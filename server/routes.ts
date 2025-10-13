import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { messagingService } from "./services/messaging";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { setupTestUtils } from "./testUtils";
import { 
  generalLimiter, 
  authLimiter, 
  broadcastLimiter, 
  exportLimiter, 
  deletionLimiter,
  strictLimiter 
} from "./middleware/rateLimiter";
import { 
  insertUserSchema, insertPetSchema, insertClinicSchema,
  insertMessageSchema, emergencyRequests,
  insertRegionSchema, insertFeatureFlagSchema,
  insertAuditLogSchema, insertPrivacyConsentSchema,
  insertTranslationSchema, insertEmergencyRequestSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);
  
  // Set up test utilities (only in non-production)
  setupTestUtils(app);
  
  // Apply general rate limiter to all API routes (100 req/15min)
  app.use('/api/', generalLimiter);
  
  // ===== AUTH ROUTES =====
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // ===== USER ROUTES =====
  
  // Register user
  app.post("/api/users/register", authLimiter, async (req, res) => {
    try {
      // Strip sensitive fields and use safe schema for registration
      const safeUserSchema = insertUserSchema.omit({ role: true, clinicId: true });
      const userData = safeUserSchema.parse(req.body);
      
      // Check if username exists (only if username is provided)
      if (userData.username) {
        const existing = await storage.getUserByUsername(userData.username);
        if (existing) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Always set role to 'user' for new registrations (admins must be created by other admins)
      const user = await storage.createUser({
        ...userData,
        role: 'user'
      });
      
      // Create audit log
      await storage.createAuditLog({
        entityType: 'user',
        entityId: user.id,
        action: 'create',
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
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
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user
  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
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
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
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

  // GDPR/PDPO: Export user data
  app.get("/api/users/export", exportLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exportData = await storage.exportUserData(userId);

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
        .send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  // GDPR/PDPO: Delete user data (Right to be Forgotten)
  app.delete("/api/users/gdpr-delete", deletionLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

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

  // ===== PET ROUTES =====
  
  // Get pets for user
  app.get("/api/users/:userId/pets", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
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
      const requestingUserId = req.user.claims.sub;
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
      const requestingUserId = req.user.claims.sub;
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
      const requestingUserId = req.user.claims.sub;
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
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete pet
  app.delete("/api/pets/:id", strictLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
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

  // ===== CLINIC ROUTES =====
  
  // Get all clinics
  app.get("/api/clinics", async (req, res) => {
    const clinics = await storage.getAllClinics();
    res.json(clinics);
  });

  // Get clinics by region
  app.get("/api/clinics/region/:regionId", async (req, res) => {
    const clinics = await storage.getClinicsByRegion(req.params.regionId);
    res.json(clinics);
  });

  // Get 24-hour clinics by region
  app.get("/api/clinics/24hour/:regionId", async (req, res) => {
    const clinics = await storage.get24HourClinicsByRegion(req.params.regionId);
    res.json(clinics);
  });

  // Get nearby clinics using PostGIS (efficient server-side geo-query)
  app.get("/api/clinics/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius } = z.object({
        latitude: z.string().transform(Number),
        longitude: z.string().transform(Number),
        radius: z.string().transform(Number).default("10000"), // default 10km in meters
      }).parse(req.query);

      const clinics = await storage.getNearbyClinics(latitude, longitude, radius);
      res.json(clinics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get clinic by ID
  app.get("/api/clinics/:id", async (req, res) => {
    const clinic = await storage.getClinic(req.params.id);
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }
    res.json(clinic);
  });

  // Create clinic (admin only)
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

  // Update clinic (admin or clinic staff only)
  app.patch("/api/clinics/:id", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.claims.sub;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const clinic = await storage.getClinic(req.params.id);
      
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Check if user is admin or clinic staff for this specific clinic
      if (dbUser.role !== 'admin' && dbUser.clinicId !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
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

  // Delete clinic (soft delete) (admin only)
  app.delete("/api/clinics/:id", isAuthenticated, isAdmin, async (req, res) => {
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
    
    res.json({ success: true });
  });

  // Get clinic staff (admin only)
  app.get("/api/clinics/:id/staff", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Get all users with this clinicId
      const allUsers = await storage.getAllUsers();
      const staff = allUsers.filter(user => user.clinicId === req.params.id);
      
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Link user to clinic (admin only)
  app.post("/api/clinics/:id/staff", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email } = z.object({
        email: z.string().email("Valid email is required"),
      }).parse(req.body);

      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      // Find user by email
      const allUsers = await storage.getAllUsers();
      const user = allUsers.find(u => u.email === email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      // Link user to clinic
      await storage.updateUser(user.id, { clinicId: req.params.id });

      await storage.createAuditLog({
        entityType: 'clinic',
        entityId: req.params.id,
        action: 'link_staff',
        changes: { userId: user.id, email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({ success: true, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unlink user from clinic (admin only)
  app.delete("/api/clinics/:id/staff/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }

      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.clinicId !== req.params.id) {
        return res.status(400).json({ message: "User is not linked to this clinic" });
      }

      // Unlink user from clinic
      await storage.updateUser(user.id, { clinicId: null });

      await storage.createAuditLog({
        entityType: 'clinic',
        entityId: req.params.id,
        action: 'unlink_staff',
        changes: { userId: user.id, email: user.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
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
      const requestingUserId = req.user.claims.sub;
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
  app.get("/api/clinics/:clinicId/emergency-requests", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const clinicId = req.params.clinicId;

      // Check if user is admin or clinic staff for this specific clinic
      if (user.role !== 'admin' && user.clinicId !== clinicId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const requests = await storage.getEmergencyRequestsByClinicId(clinicId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update emergency request status
  app.patch("/api/emergency-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const request = await storage.getEmergencyRequest(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Emergency request not found" });
      }
      
      // Only the owner or admin can update emergency requests
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (request.userId !== requestingUserId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden - You can only update your own emergency requests" });
      }
      
      const updateData = insertEmergencyRequestSchema.partial().parse(req.body);
      const updatedRequest = await storage.updateEmergencyRequest(req.params.id, updateData);

      await storage.createAuditLog({
        entityType: 'emergency_request',
        entityId: request.id,
        action: 'update',
        userId: requestingUserId,
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
        const requestingUserId = req.user.claims.sub;
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
        userId: req.user.claims.sub,
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
        userId: req.user.claims.sub,
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
      const requestingUserId = req.user.claims.sub;
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
      const requestingUserId = req.user.claims.sub;
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

  const httpServer = createServer(app);

  return httpServer;
}
