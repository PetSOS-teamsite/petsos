import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { messagingService } from "./services/messaging";
import { setupAuth, isAuthenticated, isAdmin, sanitizeUser } from "./auth";
import { setupTestUtils } from "./testUtils";
import { db } from "./db";
import { messages } from "@shared/schema";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { 
  generalLimiter, 
  authLimiter, 
  broadcastLimiter, 
  exportLimiter, 
  deletionLimiter,
  strictLimiter 
} from "./middleware/rateLimiter";
import { deepseekService } from "./services/deepseek";
import { 
  insertUserSchema, insertPetSchema, insertClinicSchema,
  insertMessageSchema, emergencyRequests,
  insertRegionSchema, insertCountrySchema, insertPetBreedSchema,
  insertFeatureFlagSchema,
  insertAuditLogSchema, insertPrivacyConsentSchema,
  insertTranslationSchema, insertEmergencyRequestSchema
} from "@shared/schema";
import path from "path";
import { config } from "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);
  
  // Set up test utilities (only in non-production)
  setupTestUtils(app);
  
  // Health check endpoint for Render and other platforms (no rate limiting)
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Serve sitemap.xml and robots.txt with correct content-type headers
  const publicDir = config.isDevelopment 
    ? path.resolve(import.meta.dirname, '../client/public')
    : path.resolve(import.meta.dirname, 'public');
    
  app.get('/sitemap.xml', (req, res) => {
    // Disable all caching to force Google to fetch fresh copy
    res.set({
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.removeHeader('ETag');
    res.sendFile('sitemap.xml', { 
      root: publicDir,
      etag: false,
      lastModified: false
    });
  });
  
  app.get('/sitemap-2025.xml', (req, res) => {
    // Alternate sitemap URL to bypass caching
    res.set({
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.removeHeader('ETag');
    res.sendFile('sitemap-2025.xml', { 
      root: publicDir,
      etag: false,
      lastModified: false
    });
  });
  
  app.get('/sitemap-oct29.xml', (req, res) => {
    // Dated sitemap URL to bypass all caching layers
    // Accepts optional ?v= parameter for additional cache busting
    res.set({
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noindex'
    });
    res.removeHeader('ETag');
    res.sendFile('sitemap-oct29.xml', { 
      root: publicDir,
      etag: false,
      lastModified: false
    });
  });
  
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile('robots.txt', { root: publicDir });
  });
  
  // Test route to verify API routing works
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });
  
  // Apply general rate limiter to all API routes (100 req/15min)
  app.use('/api/', generalLimiter);
  
  // ===== USER ROUTES =====
  // Note: User registration is handled by /api/auth/signup in auth.ts
  // IMPORTANT: Specific routes must come BEFORE parameterized :id routes

  // GDPR/PDPO: Export user data
  app.get("/api/users/export", exportLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const exportData = await storage.exportUserData(userId);

      // Sanitize user data before export to remove password hashes
      const sanitizedExportData = {
        ...exportData,
        user: sanitizeUser(exportData.user)
      };

      // Log export for audit
      await storage.createAuditLog({
        entityType: 'user',
        entityId: userId,
        action: 'export_data',
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      // Set headers for JSON download (use res.send instead of res.json to preserve headers)
      const filename = `petsos-data-export-${userId}-${new Date().toISOString()}.json`;
      res.status(200)
        .set({
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        })
        .send(JSON.stringify(sanitizedExportData, null, 2));
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  // GDPR/PDPO: Delete user data (Right to be Forgotten)
  app.delete("/api/users/gdpr-delete", deletionLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;

      // Log deletion request BEFORE deleting
      await storage.createAuditLog({
        entityType: 'user',
        entityId: userId,
        action: 'gdpr_delete_request',
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      // Perform GDPR-compliant deletion
      const result = await storage.deleteUserDataGDPR(userId);

      if (!result.success) {
        return res.status(404).json({ message: "User not found" });
      }

      // Destroy session after successful deletion
      req.session.destroy((err: Error) => {
        if (err) {
          console.error("Error destroying session after GDPR delete:", err);
        }
      });

      res.json({
        success: true,
        message: "Your account and all associated data have been permanently deleted",
        deletedRecords: result.deletedRecords
      });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = req.params.id;
      
      // Users can only view their own profile unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (requestingUserId !== targetUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only view your own profile" });
      }
      
      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user
  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = req.params.id;
      
      // Users can only update their own profile unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (requestingUserId !== targetUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only update your own profile" });
      }
      
      // Parse update data with appropriate schema based on role
      let updateData;
      if (requestingUser.role === 'admin') {
        // Admins can update all fields including role and clinicId
        updateData = insertUserSchema.partial().parse(req.body);
      } else {
        // Regular users cannot update role or clinicId
        const safeUpdateSchema = insertUserSchema.omit({ role: true, clinicId: true }).partial();
        updateData = safeUpdateSchema.parse(req.body);
      }
      
      const user = await storage.updateUser(targetUserId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createAuditLog({
        entityType: 'user',
        entityId: user.id,
        action: 'update',
        userId: requestingUserId,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(sanitizeUser(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete user
  app.delete("/api/users/:id", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = req.params.id;
      
      // Users can only delete their own account unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (requestingUserId !== targetUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only delete your own account" });
      }
      
      const success = await storage.deleteUser(targetUserId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createAuditLog({
        entityType: 'user',
        entityId: targetUserId,
        action: 'delete',
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== ADMIN ROUTES =====
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Sanitize all users before returning
      const sanitizedUsers = users.map(sanitizeUser);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all pets (admin only)
  app.get("/api/admin/pets", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const pets = await storage.getAllPets();
      res.json(pets);
    } catch (error) {
      console.error("Error fetching all pets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== PET ROUTES =====
  
  // Get pets for user
  app.get("/api/users/:userId/pets", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = req.params.userId;
      
      // Users can only view their own pets unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (requestingUserId !== targetUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only view your own pets" });
      }
      
      const pets = await storage.getPetsByUserId(targetUserId);
      res.json(pets);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create pet
  app.post("/api/pets", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const petData = insertPetSchema.parse(req.body);
      
      // Ensure the user is creating a pet for themselves
      if (petData.userId !== requestingUserId) {
        return res.status(403).json({ message: "Forbidden - You can only create pets for yourself" });
      }
      
      const pet = await storage.createPet(petData);
      
      await storage.createAuditLog({
        entityType: 'pet',
        entityId: pet.id,
        action: 'create',
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(pet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get pet by ID
  app.get("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const pet = await storage.getPet(req.params.id);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      // Users can only view their own pets unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (pet.userId !== requestingUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only view your own pets" });
      }
      
      res.json(pet);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update pet
  app.patch("/api/pets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const pet = await storage.getPet(req.params.id);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      // Users can only update their own pets unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (pet.userId !== requestingUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only update your own pets" });
      }
      
      const updateData = insertPetSchema.partial().parse(req.body);
      const updatedPet = await storage.updatePet(req.params.id, updateData);

      await storage.createAuditLog({
        entityType: 'pet',
        entityId: pet.id,
        action: 'update',
        userId: requestingUserId,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedPet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Pet update error:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete pet
  app.delete("/api/pets/:id", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const pet = await storage.getPet(req.params.id);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      // Users can only delete their own pets unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (pet.userId !== requestingUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only delete your own pets" });
      }

      const success = await storage.deletePet(req.params.id);
      
      await storage.createAuditLog({
        entityType: 'pet',
        entityId: req.params.id,
        action: 'delete',
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== REGION ROUTES =====
  
  // Get all regions
  app.get("/api/regions", async (req, res) => {
    const regions = await storage.getAllRegions();
    res.json(regions);
  });

  // Get region by code
  app.get("/api/regions/code/:code", async (req, res) => {
    const region = await storage.getRegionByCode(req.params.code);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }
    res.json(region);
  });

  // Create region (admin only)
  app.post("/api/regions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const regionData = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(regionData);
      
      await storage.createAuditLog({
        entityType: 'region',
        entityId: region.id,
        action: 'create',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update region (admin only)
  app.patch("/api/regions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const regionData = insertRegionSchema.partial().parse(req.body);
      const region = await storage.updateRegion(req.params.id, regionData);
      
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }

      await storage.createAuditLog({
        entityType: 'region',
        entityId: region.id,
        action: 'update',
        changes: regionData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== COUNTRY ROUTES =====
  
  // Get all countries
  app.get("/api/countries", async (req, res) => {
    const countries = await storage.getAllCountries();
    res.json(countries);
  });

  // Get active countries only
  app.get("/api/countries/active", async (req, res) => {
    const countries = await storage.getActiveCountries();
    res.json(countries);
  });

  // Get country by code
  app.get("/api/countries/code/:code", async (req, res) => {
    const country = await storage.getCountryByCode(req.params.code);
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }
    res.json(country);
  });

  // Get regions by country
  app.get("/api/countries/:code/regions", async (req, res) => {
    const regions = await storage.getRegionsByCountry(req.params.code);
    res.json(regions);
  });

  // Create country (admin only)
  app.post("/api/countries", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const countryData = insertCountrySchema.parse(req.body);
      const country = await storage.createCountry(countryData);
      
      await storage.createAuditLog({
        entityType: 'country',
        entityId: country.id,
        action: 'create',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(country);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update country (admin only)
  app.patch("/api/countries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const countryData = insertCountrySchema.partial().parse(req.body);
      const country = await storage.updateCountry(req.params.id, countryData);
      
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }

      await storage.createAuditLog({
        entityType: 'country',
        entityId: country.id,
        action: 'update',
        changes: countryData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(country);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete country (admin only) - soft delete
  app.delete("/api/countries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCountry(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Country not found" });
      }

      await storage.createAuditLog({
        entityType: 'country',
        entityId: req.params.id,
        action: 'delete',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== PET BREED ROUTES =====
  
  // Get all pet breeds
  app.get("/api/pet-breeds", async (req, res) => {
    const breeds = await storage.getAllPetBreeds();
    res.json(breeds);
  });

  // Get breeds by species
  app.get("/api/pet-breeds/species/:species", async (req, res) => {
    const breeds = await storage.getPetBreedsBySpecies(req.params.species);
    res.json(breeds);
  });

  // Get common breeds (optionally filtered by species)
  app.get("/api/pet-breeds/common", async (req, res) => {
    const species = req.query.species as string | undefined;
    const breeds = await storage.getCommonPetBreeds(species);
    res.json(breeds);
  });

  // Get breeds by country
  app.get("/api/pet-breeds/country/:countryCode", async (req, res) => {
    const breeds = await storage.getPetBreedsByCountry(req.params.countryCode);
    res.json(breeds);
  });

  // Create pet breed (admin only)
  app.post("/api/pet-breeds", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const breedData = insertPetBreedSchema.parse(req.body);
      const breed = await storage.createPetBreed(breedData);
      
      await storage.createAuditLog({
        entityType: 'pet_breed',
        entityId: breed.id,
        action: 'create',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(breed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update pet breed (admin only)
  app.patch("/api/pet-breeds/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const breedData = insertPetBreedSchema.partial().parse(req.body);
      const breed = await storage.updatePetBreed(req.params.id, breedData);
      
      if (!breed) {
        return res.status(404).json({ message: "Pet breed not found" });
      }

      await storage.createAuditLog({
        entityType: 'pet_breed',
        entityId: breed.id,
        action: 'update',
        changes: breedData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(breed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete pet breed (admin only) - soft delete
  app.delete("/api/pet-breeds/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deletePetBreed(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Pet breed not found" });
      }

      await storage.createAuditLog({
        entityType: 'pet_breed',
        entityId: req.params.id,
        action: 'delete',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== CLINIC ROUTES (COMPATIBILITY LAYER - DEPRECATED) =====
  // These routes redirect to hospital endpoints for backwards compatibility
  // TODO: Remove after frontend migration complete and 48h zero usage
  
  // Helper function to transform hospital to legacy clinic format  
  // This provides backward compatibility while frontend migrates from /api/clinics to /api/hospitals
  const hospitalToClinicFormat = (h: any) => ({
    // Core identification
    id: h.id,
    slug: h.slug,
    
    // Names and addresses
    name: h.nameEn,
    nameZh: h.nameZh,
    address: h.addressEn,
    addressZh: h.addressZh,
    
    // Contact information
    phone: h.phone || '',
    whatsapp: h.whatsapp,
    email: h.email || null,
    websiteUrl: h.websiteUrl,
    
    // Location
    regionId: h.regionId,
    latitude: h.latitude ? parseFloat(h.latitude) : null,
    longitude: h.longitude ? parseFloat(h.longitude) : null,
    distance: h.distance, // Present only in nearby queries
    
    // Status and availability
    is24Hour: h.open247,
    status: h.isAvailable ? 'active' : 'inactive',
    isAvailable: h.isAvailable,
    liveStatus: h.liveStatus,
    
    // Partner and support flags
    isSupportHospital: h.isPartner,
    
    // Legacy field for backward compatibility
    services: [], // Hospitals use detailed service flags instead
    
    // Hospital indicator flags (for frontend migration period)
    isHospital: true, // Mark as hospital to distinguish from legacy clinics
    hospitalSlug: h.slug, // Frontend uses this to build /hospitals/:slug links
    
    // Media
    photos: h.photos || [],
    
    // Hospital-specific features
    onSiteVet247: h.onSiteVet247,
    triagePolicy: h.triagePolicy,
    icuLevel: h.icuLevel,
    whatsappTriage: h.whatsappTriage,
    
    // Amenities
    languages: h.languages,
    parking: h.parking,
    wheelchairAccess: h.wheelchairAccess
  });

  // Get all clinics → hospitals
  app.get("/api/clinics", async (req, res) => {
    console.warn('[DEPRECATED] /api/clinics called - use /api/hospitals instead');
    const hospitals = await storage.getAllHospitals();
    const clinics = hospitals.map(hospitalToClinicFormat);
    res.json(clinics);
  });

  // Get clinics by region → hospitals by region
  app.get("/api/clinics/region/:regionId", async (req, res) => {
    console.warn('[DEPRECATED] /api/clinics/region called - use /api/hospitals/region instead');
    const hospitals = await storage.getHospitalsByRegion(req.params.regionId);
    res.json(hospitals.map(hospitalToClinicFormat));
  });

  // Get 24-hour clinics by region → hospitals by region (all are 24/7)
  app.get("/api/clinics/24hour/:regionId", async (req, res) => {
    console.warn('[DEPRECATED] /api/clinics/24hour called - use /api/hospitals/region instead');
    const hospitals = await storage.getHospitalsByRegion(req.params.regionId);
    res.json(hospitals.filter(h => h.open247).map(hospitalToClinicFormat));
  });

  // Get nearby clinics → hospitals
  app.get("/api/clinics/nearby", async (req, res) => {
    console.warn('[DEPRECATED] /api/clinics/nearby called - use /api/hospitals/nearby instead');
    try {
      const { latitude, longitude, radius } = z.object({
        latitude: z.string().transform(Number),
        longitude: z.string().transform(Number),
        radius: z.string().transform(Number).default("10000"),
      }).parse(req.query);

      const hospitals = await storage.getNearbyHospitals(latitude, longitude, radius);
      res.json(hospitals.map(hospitalToClinicFormat));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get clinic by ID → hospital by ID
  app.get("/api/clinics/:id", async (req, res) => {
    console.warn('[DEPRECATED] /api/clinics/:id called - use /api/hospitals/:id instead');
    const hospital = await storage.getHospital(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: "Clinic not found" });
    }
    res.json(hospitalToClinicFormat(hospital));
  });

  // Clinic CRUD endpoints (admin only)
  app.post("/api/clinics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinicData = insertClinicSchema.parse(req.body);
      const clinic = await storage.createClinic(clinicData);
      
      await storage.createAuditLog({
        entityType: 'clinic',
        entityId: clinic.id,
        action: 'create',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(clinic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/clinics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const updateData = insertClinicSchema.partial().parse(req.body);
      const updatedClinic = await storage.updateClinic(req.params.id, updateData);

      await storage.createAuditLog({
        entityType: 'clinic',
        entityId: clinic.id,
        action: 'update',
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedClinic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/clinics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteClinic(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      await storage.createAuditLog({
        entityType: 'clinic',
        entityId: req.params.id,
        action: 'delete',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Staff management endpoints - DEPRECATED
  app.get("/api/clinics/:id/staff", isAuthenticated, isAdmin, async (req, res) => {
    console.warn('[DEPRECATED] GET /api/clinics/:id/staff called - update to use hospital staff management');
    res.status(410).json({ 
      message: "This endpoint is deprecated. Clinic staff management should be updated to use hospitals.",
      deprecated: true
    });
  });

  app.post("/api/clinics/:id/staff", isAuthenticated, isAdmin, async (req, res) => {
    console.warn('[DEPRECATED] POST /api/clinics/:id/staff called');
    res.status(410).json({ 
      message: "This endpoint is deprecated. Clinic staff management should be updated to use hospitals.",
      deprecated: true
    });
  });

  app.delete("/api/clinics/:id/staff/:userId", isAuthenticated, isAdmin, async (req, res) => {
    console.warn('[DEPRECATED] DELETE /api/clinics/:id/staff/:userId called');
    res.status(410).json({ 
      message: "This endpoint is deprecated. Clinic staff management should be updated to use hospitals.",
      deprecated: true
    });
  });

  // Geocode address to GPS coordinates
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = z.object({
        address: z.string().min(1, "Address is required"),
      }).parse(req.body);

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }

      const encodedAddress = encodeURIComponent(address);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        res.json({
          latitude: location.lat.toString(),
          longitude: location.lng.toString(),
          formattedAddress: data.results[0].formatted_address,
        });
      } else if (data.status === "ZERO_RESULTS") {
        res.status(404).json({ message: "Address not found. Please check the address and try again." });
      } else if (data.status === "OVER_QUERY_LIMIT") {
        res.status(429).json({ message: "Geocoding API quota exceeded. Please try again later." });
      } else {
        res.status(400).json({ message: `Geocoding failed: ${data.status}` });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Geocoding error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== HOSPITAL ROUTES =====
  
  // Get all hospitals
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospitals by region
  app.get("/api/hospitals/region/:regionId", async (req, res) => {
    try {
      const hospitals = await storage.getHospitalsByRegion(req.params.regionId);
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospital by slug
  app.get("/api/hospitals/slug/:slug", async (req, res) => {
    try {
      const hospital = await storage.getHospitalBySlug(req.params.slug);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospital by ID
  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create hospital (admin only)
  app.post("/api/hospitals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalSchema } = await import("@shared/schema");
      const hospitalData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
      
      await storage.createAuditLog({
        entityType: 'hospital',
        entityId: hospital.id,
        action: 'create',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update hospital (admin only)
  app.patch("/api/hospitals/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalSchema } = await import("@shared/schema");
      const hospital = await storage.getHospital(req.params.id);
      
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      const updateData = insertHospitalSchema.partial().parse(req.body);
      const updatedHospital = await storage.updateHospital(req.params.id, updateData);

      await storage.createAuditLog({
        entityType: 'hospital',
        entityId: hospital.id,
        action: 'update',
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedHospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete hospital (admin only)
  app.delete("/api/hospitals/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteHospital(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      await storage.createAuditLog({
        entityType: 'hospital',
        entityId: req.params.id,
        action: 'delete',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get consult fees for a hospital
  app.get("/api/hospitals/:hospitalId/fees", async (req, res) => {
    try {
      const fees = await storage.getConsultFeesByHospitalId(req.params.hospitalId);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create consult fee (admin only)
  app.post("/api/hospitals/:hospitalId/fees", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalConsultFeeSchema } = await import("@shared/schema");
      const feeData = insertHospitalConsultFeeSchema.parse({
        ...req.body,
        hospitalId: req.params.hospitalId
      });
      const fee = await storage.createConsultFee(feeData);
      res.json(fee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update consult fee (admin only)
  app.patch("/api/hospitals/fees/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalConsultFeeSchema } = await import("@shared/schema");
      const updateData = insertHospitalConsultFeeSchema.partial().parse(req.body);
      const updatedFee = await storage.updateConsultFee(req.params.id, updateData);
      
      if (!updatedFee) {
        return res.status(404).json({ message: "Consult fee not found" });
      }
      
      res.json(updatedFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete consult fee (admin only)
  app.delete("/api/hospitals/fees/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteConsultFee(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Consult fee not found" });
      }
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospital updates (for review/moderation)
  app.get("/api/hospitals/:hospitalId/updates", isAuthenticated, async (req, res) => {
    try {
      const updates = await storage.getHospitalUpdatesByHospitalId(req.params.hospitalId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Submit hospital update/correction (authenticated users)
  app.post("/api/hospitals/:hospitalId/report", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.id;
      
      const { insertHospitalUpdateSchema } = await import("@shared/schema");
      const updateData = insertHospitalUpdateSchema.parse({
        ...req.body,
        hospitalId: req.params.hospitalId,
        submittedById: userId
      });
      
      const update = await storage.createHospitalUpdate(updateData);
      res.json(update);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update hospital update status (admin only - for review)
  app.patch("/api/hospitals/updates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.id;
      
      const { insertHospitalUpdateSchema } = await import("@shared/schema");
      const updateData = insertHospitalUpdateSchema.partial().extend({
        reviewedById: z.string().optional(),
        reviewedAt: z.date().optional(),
      }).parse({
        ...req.body,
        reviewedById: userId,
        reviewedAt: new Date()
      });
      
      const updatedUpdate = await storage.updateHospitalUpdate(req.params.id, updateData);
      
      if (!updatedUpdate) {
        return res.status(404).json({ message: "Hospital update not found" });
      }
      
      res.json(updatedUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== HOSPITAL ROUTES =====
  
  // Get all hospitals
  app.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospitals by region
  app.get("/api/hospitals/region/:regionId", async (req, res) => {
    try {
      const hospitals = await storage.getHospitalsByRegion(req.params.regionId);
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get nearby hospitals using PostGIS (efficient server-side geo-query)
  app.get("/api/hospitals/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius } = z.object({
        latitude: z.string().transform(Number),
        longitude: z.string().transform(Number),
        radius: z.string().transform(Number).default("10000"), // default 10km in meters
      }).parse(req.query);

      const hospitals = await storage.getNearbyHospitals(latitude, longitude, radius);
      res.json(hospitals);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get hospital by ID
  app.get("/api/hospitals/:id", async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get emergency requests for hospital
  app.get("/api/hospitals/:hospitalId/emergency-requests", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const hospitalId = req.params.hospitalId;

      // Check if user is admin (for now, until we have hospital staff roles)
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized - Admin only" });
      }

      // Note: Using getEmergencyRequestsByClinicId which now uses hospitalId internally
      const requests = await storage.getEmergencyRequestsByClinicId(hospitalId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== EMERGENCY REQUEST ROUTES =====

  // Create emergency request
  app.post("/api/emergency-requests", async (req, res) => {
    try {
      // Extend schema to coerce petAge from string to number for form compatibility
      const emergencyRequestSchemaWithCoercion = insertEmergencyRequestSchema.extend({
        petAge: z.preprocess(
          (val) => {
            if (val === null || val === undefined || val === '') return null;
            const num = Number(val);
            if (isNaN(num)) return val; // Return original to trigger validation error
            return num;
          },
          z.union([z.number().int().nonnegative(), z.null()]).optional()
        ),
      });
      
      // Validate and parse request body with proper schema
      const validatedData = emergencyRequestSchemaWithCoercion.parse({
        userId: req.body.userId ?? null,
        petId: req.body.petId ?? null,
        symptom: req.body.symptom,
        petSpecies: req.body.petSpecies ?? null,
        petBreed: req.body.petBreed ?? null,
        petAge: req.body.petAge ?? null,
        locationLatitude: req.body.locationLatitude ? String(req.body.locationLatitude) : null,
        locationLongitude: req.body.locationLongitude ? String(req.body.locationLongitude) : null,
        manualLocation: req.body.manualLocation ?? null,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        status: req.body.status ?? 'pending',
        regionId: req.body.regionId ?? null,
        voiceTranscript: req.body.voiceTranscript ?? null,
        aiAnalyzedSymptoms: req.body.aiAnalyzedSymptoms ?? null,
      });
      
      const emergencyRequest = await storage.createEmergencyRequest(validatedData);
      
      await storage.createAuditLog({
        entityType: 'emergency_request',
        entityId: emergencyRequest.id,
        action: 'create',
        userId: emergencyRequest.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(emergencyRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating emergency request:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all emergency requests (admin only)
  app.get("/api/emergency-requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllEmergencyRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching emergency requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get emergency request by ID
  app.get("/api/emergency-requests/:id", async (req, res) => {
    const request = await storage.getEmergencyRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Emergency request not found" });
    }
    res.json(request);
  });

  // Get emergency requests for user
  app.get("/api/users/:userId/emergency-requests", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = req.params.userId;
      
      // Users can only view their own emergency requests unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (requestingUserId !== targetUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only view your own emergency requests" });
      }
      
      const requests = await storage.getEmergencyRequestsByUserId(targetUserId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get emergency requests for clinic
  // Emergency requests by clinic - DEPRECATED
  app.get("/api/clinics/:clinicId/emergency-requests", isAuthenticated, async (req, res) => {
    console.warn('[DEPRECATED] GET /api/clinics/:clinicId/emergency-requests called - use /api/hospitals/:hospitalId/emergency-requests instead');
    res.status(410).json({ 
      message: "This endpoint is deprecated. Please use /api/hospitals/:hospitalId/emergency-requests instead.",
      deprecated: true
    });
  });

  // Update emergency request (allows both authenticated users and anonymous for emergency flexibility)
  app.patch("/api/emergency-requests/:id", async (req: any, res) => {
    try {
      const request = await storage.getEmergencyRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Emergency request not found" });
      }
      
      // Authorization logic: Allow if user is authenticated and owns the request, is admin, or if request is anonymous
      if (req.user) {
        // User is authenticated - verify ownership, admin role, or anonymous request
        const requestingUserId = (req.user as any).id;
        const requestingUser = await storage.getUser(requestingUserId);
        
        if (!requestingUser) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Allow if: user owns the request, is admin, OR request was created anonymously
        const isOwner = request.userId === requestingUserId;
        const isAdmin = requestingUser.role === 'admin';
        const isAnonymousRequest = !request.userId;
        
        if (!isOwner && !isAdmin && !isAnonymousRequest) {
          return res.status(403).json({ message: "Forbidden - You can only update your own emergency requests" });
        }
      } else {
        // Anonymous user - only allow if request was created anonymously
        if (request.userId) {
          return res.status(403).json({ message: "Forbidden - This emergency belongs to a registered user" });
        }
      }
      
      const updateData = insertEmergencyRequestSchema.partial().parse(req.body);
      const updatedRequest = await storage.updateEmergencyRequest(req.params.id, updateData);

      await storage.createAuditLog({
        entityType: 'emergency_request',
        entityId: request.id,
        action: 'update',
        userId: req.user ? (req.user as any).id : null,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Broadcast emergency to clinics (allows anonymous users for emergency use)
  app.post("/api/emergency-requests/:id/broadcast", broadcastLimiter, async (req: any, res) => {
    try {
      const { clinicIds, message } = z.object({
        clinicIds: z.array(z.string()),
        message: z.string(),
      }).parse(req.body);

      const emergencyRequest = await storage.getEmergencyRequest(req.params.id);
      if (!emergencyRequest) {
        return res.status(404).json({ message: "Emergency request not found" });
      }
      
      // Check authorization: allow if authenticated user owns the request, is admin, or if anonymous emergency
      if (req.user) {
        // User is authenticated - verify ownership or admin role
        const requestingUserId = (req.user as any).id;
        const requestingUser = await storage.getUser(requestingUserId);
        
        if (!requestingUser) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        if (emergencyRequest.userId !== requestingUserId && requestingUser.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden - You can only broadcast your own emergency requests" });
        }
      } else {
        // Anonymous user - only allow if emergency request was created anonymously
        if (emergencyRequest.userId) {
          return res.status(403).json({ message: "Forbidden - This emergency belongs to a registered user" });
        }
      }

      const messages = await messagingService.broadcastEmergency(
        req.params.id,
        clinicIds,
        message
      );

      res.status(201).json({ messages, count: messages.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== DEEPSEEK AI VOICE ANALYSIS ROUTE =====
  
  // Analyze voice transcript with DeepSeek AI
  // Custom rate limiter for AI analysis with fallback notification
  const aiAnalysisLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Stricter limit for AI analysis
    message: JSON.stringify({ 
      message: "Too many AI analysis requests. Please try again later.", 
      fallbackAvailable: true 
    }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      res.status(429).json({
        message: "Too many AI analysis requests. Please try again later.",
        fallbackAvailable: true
      });
    }
  });

  app.post("/api/voice/analyze", aiAnalysisLimiter, async (req, res) => {
    try {
      // Validate input with size limits (max 10,000 characters)
      const { transcript, language } = z.object({
        transcript: z.string().min(1, "Transcript cannot be empty").max(10000, "Transcript too long"),
        language: z.enum(['en', 'zh', 'zh-HK', 'zh-CN']).optional().default('en'),
      }).parse(req.body);

      // Check if DeepSeek is available
      if (!deepseekService.isAvailable()) {
        return res.status(503).json({ 
          message: "DeepSeek AI service not configured. Please set DEEPSEEK_API_KEY environment variable.",
          fallbackAvailable: true 
        });
      }

      // Set timeout for AI analysis (10 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout')), 10000)
      );

      // Race between analysis and timeout
      const analysis = await Promise.race([
        deepseekService.analyzeVoiceTranscript(transcript, language),
        timeoutPromise
      ]) as any;
      
      res.json({
        success: true,
        analysis,
        formattedMessage: deepseekService.formatForBroadcast(analysis, transcript)
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors,
          fallbackAvailable: true
        });
      }
      
      // Handle timeout specifically
      if (error instanceof Error && error.message === 'Analysis timeout') {
        console.error("DeepSeek analysis timeout");
        return res.status(504).json({ 
          message: "AI analysis timeout. Please try again.", 
          error: "Timeout",
          fallbackAvailable: true
        });
      }
      
      console.error("DeepSeek analysis error:", error);
      res.status(500).json({ 
        message: "AI analysis failed", 
        error: error instanceof Error ? error.message : "Unknown error",
        fallbackAvailable: true
      });
    }
  });

  // ===== MESSAGE ROUTES =====
  
  // Create message (admin only - used by broadcast service)
  app.post("/api/messages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for emergency request
  app.get("/api/emergency-requests/:id/messages", async (req, res) => {
    const messages = await storage.getMessagesByEmergencyRequest(req.params.id);
    res.json(messages);
  });

  // Update message status
  app.patch("/api/messages/:id", async (req, res) => {
    try {
      const updateData = insertMessageSchema.partial().parse(req.body);
      const message = await storage.updateMessage(req.params.id, updateData);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get queued messages (for processing)
  app.get("/api/messages/queued", async (req, res) => {
    const messages = await storage.getQueuedMessages();
    res.json(messages);
  });

  // ===== FEATURE FLAG ROUTES =====
  
  // Get all feature flags (admin only)
  app.get("/api/feature-flags", isAuthenticated, isAdmin, async (req, res) => {
    const flags = await storage.getAllFeatureFlags();
    res.json(flags);
  });

  // Get feature flag by key (admin only)
  app.get("/api/feature-flags/:key", isAuthenticated, isAdmin, async (req, res) => {
    const flag = await storage.getFeatureFlag(req.params.key);
    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }
    res.json(flag);
  });

  // Create feature flag (admin only)
  app.post("/api/feature-flags", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const flagData = insertFeatureFlagSchema.parse(req.body);
      const flag = await storage.createFeatureFlag(flagData);
      
      await storage.createAuditLog({
        entityType: 'feature_flag',
        entityId: flag.id,
        action: 'create',
        userId: (req.user as any).id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(flag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update feature flag (admin only)
  app.patch("/api/feature-flags/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const updateData = insertFeatureFlagSchema.partial().parse(req.body);
      const flag = await storage.updateFeatureFlag(req.params.id, updateData);
      
      if (!flag) {
        return res.status(404).json({ message: "Feature flag not found" });
      }

      await storage.createAuditLog({
        entityType: 'feature_flag',
        entityId: flag.id,
        action: 'update',
        userId: (req.user as any).id,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(flag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== TRANSLATION ROUTES =====
  
  // Get translations by language
  app.get("/api/translations/:language", async (req, res) => {
    const translations = await storage.getTranslationsByLanguage(req.params.language);
    res.json(translations);
  });

  // Create/update translation (admin only)
  app.post("/api/translations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const translationData = insertTranslationSchema.parse(req.body);
      
      // Check if translation already exists
      const existing = await storage.getTranslation(translationData.key, translationData.language);
      
      let translation;
      if (existing) {
        translation = await storage.updateTranslation(existing.id, translationData);
      } else {
        translation = await storage.createTranslation(translationData);
      }
      
      res.json(translation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== PRIVACY CONSENT ROUTES =====
  
  // Get privacy consents for user
  app.get("/api/users/:userId/consents", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const targetUserId = req.params.userId;
      
      // Users can only view their own consents unless they're admin
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (requestingUserId !== targetUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only view your own consents" });
      }
      
      const consents = await storage.getPrivacyConsents(targetUserId);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create privacy consent
  app.post("/api/privacy-consents", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = (req.user as any).id;
      const consentData = insertPrivacyConsentSchema.parse(req.body);
      
      // Users can only create consents for themselves
      if (consentData.userId !== requestingUserId) {
        return res.status(403).json({ message: "Forbidden - You can only create consents for yourself" });
      }
      
      const consent = await storage.createPrivacyConsent({
        ...consentData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      await storage.createAuditLog({
        entityType: 'privacy_consent',
        entityId: consent.id,
        action: 'create',
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(consent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== AUDIT LOG ROUTES =====
  
  // Get audit logs for entity (admin only)
  app.get("/api/audit-logs/:entityType/:entityId", isAuthenticated, isAdmin, async (req, res) => {
    const logs = await storage.getAuditLogsByEntity(req.params.entityType, req.params.entityId);
    res.json(logs);
  });

  // ===== DIAGNOSTIC ROUTES (Admin Only) =====
  
  // Test WhatsApp connection and credentials
  app.post("/api/admin/test-whatsapp", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { phoneNumber, message } = z.object({
        phoneNumber: z.string().min(8, "Phone number required"),
        message: z.string().optional().default("Test message from PetSOS")
      }).parse(req.body);

      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';

      // Debug logging
      console.log('[WhatsApp Test] DEBUG - Checking credentials...');
      console.log('[WhatsApp Test] Has Access Token:', !!WHATSAPP_ACCESS_TOKEN);
      console.log('[WhatsApp Test] Has Phone Number ID:', !!WHATSAPP_PHONE_NUMBER_ID);
      console.log('[WhatsApp Test] Token length:', WHATSAPP_ACCESS_TOKEN?.length || 0);
      console.log('[WhatsApp Test] Phone ID:', WHATSAPP_PHONE_NUMBER_ID || 'NOT SET');
      console.log('[WhatsApp Test] All env keys with WHATSAPP:', Object.keys(process.env).filter(k => k.includes('WHATSAPP')));

      // Check if credentials exist
      if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error('[WhatsApp Test] ERROR - Credentials missing!');
        return res.status(400).json({
          success: false,
          error: "WhatsApp credentials not configured",
          details: {
            hasAccessToken: !!WHATSAPP_ACCESS_TOKEN,
            hasPhoneNumberId: !!WHATSAPP_PHONE_NUMBER_ID,
            apiUrl: WHATSAPP_API_URL,
            tokenLength: WHATSAPP_ACCESS_TOKEN?.length || 0,
            phoneNumberId: WHATSAPP_PHONE_NUMBER_ID || null
          }
        });
      }

      // Clean phone number
      const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      // Test API connection
      const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanedNumber,
        type: 'text',
        text: { body: message },
      };

      console.log('[WhatsApp Test] Sending to:', url);
      console.log('[WhatsApp Test] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      console.log('[WhatsApp Test] Response status:', response.status);
      console.log('[WhatsApp Test] Response data:', JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "WhatsApp API returned an error",
          statusCode: response.status,
          details: responseData,
          debugInfo: {
            url,
            phoneNumber: cleanedNumber,
            hasToken: !!WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: WHATSAPP_PHONE_NUMBER_ID
          }
        });
      }

      res.json({
        success: true,
        message: "WhatsApp test message sent successfully!",
        response: responseData,
        debugInfo: {
          phoneNumber: cleanedNumber,
          messageId: responseData.messages?.[0]?.id
        }
      });

    } catch (error) {
      console.error('[WhatsApp Test] Error:', error);
      res.status(500).json({
        success: false,
        error: "Test failed with exception",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get failed messages with details (admin only)
  app.get("/api/admin/failed-messages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Query database directly for failed messages
      const query = await db.select().from(messages as any).where(eq((messages as any).status, 'failed')).limit(100);
      
      res.json({
        total: query.length,
        messages: query.map((m: any) => ({
          id: m.id,
          emergencyRequestId: m.emergencyRequestId,
          recipient: m.recipient,
          messageType: m.messageType,
          status: m.status,
          error: m.errorMessage,
          retryCount: m.retryCount,
          createdAt: m.createdAt,
          failedAt: m.failedAt,
          content: m.content?.substring(0, 100) + '...' || ''
        }))
      });
    } catch (error) {
      console.error('[Failed Messages] Error:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

  // ===== OWNER VERIFICATION ENDPOINTS =====
  
  // Generate 6-digit verification code for clinic (admin only)
  app.post("/api/clinics/:id/generate-code", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Generate 6-digit code
      const code = Math.floor(Math.random() * 900000 + 100000).toString();
      
      const updatedClinic = await storage.updateClinic(req.params.id, { 
        ownerVerificationCode: code 
      });

      await storage.createAuditLog({
        entityType: 'clinic',
        entityId: clinic.id,
        action: 'generate_code',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ code, clinicId: clinic.id });
    } catch (error) {
      console.error("Generate clinic code error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify clinic access with code (public - no auth needed)
  app.post("/api/clinics/:id/verify", async (req, res) => {
    try {
      const { verificationCode } = z.object({
        verificationCode: z.string().length(6, "Code must be 6 digits")
      }).parse(req.body);

      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      if (clinic.ownerVerificationCode !== verificationCode) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      res.json({ verified: true, clinicId: clinic.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generate 6-digit verification code for hospital (admin only)
  app.post("/api/hospitals/:id/generate-code", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      // Generate 6-digit code
      const code = Math.floor(Math.random() * 900000 + 100000).toString();
      
      const updatedHospital = await storage.updateHospital(req.params.id, { 
        ownerVerificationCode: code 
      });

      await storage.createAuditLog({
        entityType: 'hospital',
        entityId: hospital.id,
        action: 'generate_code',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ code, hospitalId: hospital.id });
    } catch (error) {
      console.error("Generate hospital code error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify hospital access with code (public - no auth needed)
  app.post("/api/hospitals/:id/verify", async (req, res) => {
    try {
      const { verificationCode } = z.object({
        verificationCode: z.string().length(6, "Code must be 6 digits")
      }).parse(req.body);

      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      if (hospital.ownerVerificationCode !== verificationCode) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      res.json({ verified: true, hospitalId: hospital.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
