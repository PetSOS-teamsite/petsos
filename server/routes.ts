import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { messagingService } from "./services/messaging";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { 
  insertUserSchema, insertPetSchema, insertClinicSchema,
  insertMessageSchema, emergencyRequests,
  insertRegionSchema, insertFeatureFlagSchema,
  insertAuditLogSchema, insertPrivacyConsentSchema,
  insertTranslationSchema
} from "@shared/schema";
// Create manual insert schema with explicit camelCase keys matching frontend
const insertEmergencyRequestSchema = z.object({
  userId: z.string().optional().nullable(),
  petId: z.string().optional().nullable(),
  symptom: z.string(),
  petSpecies: z.string().optional().nullable(),
  petBreed: z.string().optional().nullable(),
  petAge: z.number().optional().nullable(),
  locationLatitude: z.string().optional().nullable(),
  locationLongitude: z.string().optional().nullable(),
  manualLocation: z.string().optional().nullable(),
  contactName: z.string(),
  contactPhone: z.string(),
  status: z.string().optional(),
  regionId: z.string().optional().nullable(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);
  
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
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username exists (only if username is provided)
      if (userData.username) {
        const existing = await storage.getUserByUsername(userData.username);
        if (existing) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const user = await storage.createUser(userData);
      
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
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updateData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createAuditLog({
        entityType: 'user',
        entityId: user.id,
        action: 'update',
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
  app.delete("/api/users/:id", async (req, res) => {
    const success = await storage.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    await storage.createAuditLog({
      entityType: 'user',
      entityId: req.params.id,
      action: 'delete',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({ success: true });
  });

  // ===== PET ROUTES =====
  
  // Get pets for user
  app.get("/api/users/:userId/pets", async (req, res) => {
    const pets = await storage.getPetsByUserId(req.params.userId);
    res.json(pets);
  });

  // Create pet
  app.post("/api/pets", async (req, res) => {
    try {
      const petData = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(petData);
      
      await storage.createAuditLog({
        entityType: 'pet',
        entityId: pet.id,
        action: 'create',
        userId: pet.userId,
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
  app.get("/api/pets/:id", async (req, res) => {
    const pet = await storage.getPet(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    res.json(pet);
  });

  // Update pet
  app.patch("/api/pets/:id", async (req, res) => {
    try {
      const updateData = insertPetSchema.partial().parse(req.body);
      const pet = await storage.updatePet(req.params.id, updateData);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      await storage.createAuditLog({
        entityType: 'pet',
        entityId: pet.id,
        action: 'update',
        userId: pet.userId,
        changes: updateData,
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

  // Delete pet
  app.delete("/api/pets/:id", async (req, res) => {
    const pet = await storage.getPet(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    const success = await storage.deletePet(req.params.id);
    
    await storage.createAuditLog({
      entityType: 'pet',
      entityId: req.params.id,
      action: 'delete',
      userId: pet.userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({ success });
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
      // Manual field extraction to ensure pet fields are included
      // Convert numeric GPS coords to strings for database compatibility
      const emergencyData = {
        userId: req.body.userId ?? null,
        petId: req.body.petId ?? null,
        symptom: req.body.symptom,
        petSpecies: req.body.petSpecies ?? null,
        petBreed: req.body.petBreed ?? null,
        petAge: typeof req.body.petAge === 'number' ? req.body.petAge : (req.body.petAge ? Number(req.body.petAge) : null),
        locationLatitude: req.body.locationLatitude ? String(req.body.locationLatitude) : null,
        locationLongitude: req.body.locationLongitude ? String(req.body.locationLongitude) : null,
        manualLocation: req.body.manualLocation ?? null,
        contactName: req.body.contactName,
        contactPhone: req.body.contactPhone,
        status: req.body.status ?? 'pending',
        regionId: req.body.regionId ?? null,
      };
      
      const emergencyRequest = await storage.createEmergencyRequest(emergencyData as any);
      
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
  app.get("/api/users/:userId/emergency-requests", async (req, res) => {
    const requests = await storage.getEmergencyRequestsByUserId(req.params.userId);
    res.json(requests);
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
  app.patch("/api/emergency-requests/:id", async (req, res) => {
    try {
      const updateData = insertEmergencyRequestSchema.partial().parse(req.body);
      const request = await storage.updateEmergencyRequest(req.params.id, updateData);
      
      if (!request) {
        return res.status(404).json({ message: "Emergency request not found" });
      }

      await storage.createAuditLog({
        entityType: 'emergency_request',
        entityId: request.id,
        action: 'update',
        userId: request.userId,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Broadcast emergency to clinics
  app.post("/api/emergency-requests/:id/broadcast", async (req, res) => {
    try {
      const { clinicIds, message } = z.object({
        clinicIds: z.array(z.string()),
        message: z.string(),
      }).parse(req.body);

      const emergencyRequest = await storage.getEmergencyRequest(req.params.id);
      if (!emergencyRequest) {
        return res.status(404).json({ message: "Emergency request not found" });
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
  
  // Create message
  app.post("/api/messages", async (req, res) => {
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
  
  // Get all feature flags
  app.get("/api/feature-flags", async (req, res) => {
    const flags = await storage.getAllFeatureFlags();
    res.json(flags);
  });

  // Get feature flag by key
  app.get("/api/feature-flags/:key", async (req, res) => {
    const flag = await storage.getFeatureFlag(req.params.key);
    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }
    res.json(flag);
  });

  // Create feature flag
  app.post("/api/feature-flags", async (req, res) => {
    try {
      const flagData = insertFeatureFlagSchema.parse(req.body);
      const flag = await storage.createFeatureFlag(flagData);
      
      await storage.createAuditLog({
        entityType: 'feature_flag',
        entityId: flag.id,
        action: 'create',
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

  // Update feature flag
  app.patch("/api/feature-flags/:id", async (req, res) => {
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

  // Create/update translation
  app.post("/api/translations", async (req, res) => {
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
  app.get("/api/users/:userId/consents", async (req, res) => {
    const consents = await storage.getPrivacyConsents(req.params.userId);
    res.json(consents);
  });

  // Create privacy consent
  app.post("/api/privacy-consents", async (req, res) => {
    try {
      const consentData = insertPrivacyConsentSchema.parse(req.body);
      const consent = await storage.createPrivacyConsent({
        ...consentData,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      await storage.createAuditLog({
        entityType: 'privacy_consent',
        entityId: consent.id,
        action: 'create',
        userId: consent.userId,
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
  
  // Get audit logs for entity
  app.get("/api/audit-logs/:entityType/:entityId", async (req, res) => {
    const logs = await storage.getAuditLogsByEntity(req.params.entityType, req.params.entityId);
    res.json(logs);
  });

  const httpServer = createServer(app);

  return httpServer;
}
