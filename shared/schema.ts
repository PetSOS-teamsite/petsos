import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, decimal, index, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom geography type for PostGIS
const geography = customType<{ data: string }>({
  dataType() {
    return "geography(Point, 4326)";
  },
});

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  name: varchar("name"), // Simplified: single name field instead of firstName/lastName
  profileImageUrl: varchar("profile_image_url"),
  // Legacy fields (optional for backward compatibility)
  username: text("username"),
  password: text("password"),
  passwordHash: text("password_hash"), // For email/password auth
  phone: text("phone"),
  languagePreference: text("language_preference").notNull().default('en'),
  regionPreference: text("region_preference"),
  role: text("role").notNull().default('user'), // user, admin, clinic_staff
  clinicId: varchar("clinic_id").references(() => clinics.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Pets table
export const pets = pgTable("pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  breed: text("breed"),
  age: integer("age"),
  weight: decimal("weight"),
  medicalNotes: text("medical_notes"),
  lastVisitClinicId: varchar("last_visit_clinic_id").references(() => clinics.id, { onDelete: 'set null' }),
  lastVisitDate: timestamp("last_visit_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  createdAt: true,
});

export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;

// Regions table
export const regions = pgTable("regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // HKI, KLN, NTI
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh").notNull(),
  coordinates: jsonb("coordinates"), // GeoJSON polygon for auto-detect
  country: text("country").notNull().default('HK'),
  active: boolean("active").notNull().default(true),
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// Clinics table
export const clinics = pgTable("clinics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameZh: text("name_zh"),
  address: text("address").notNull(),
  addressZh: text("address_zh"),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  regionId: varchar("region_id").notNull().references(() => regions.id),
  is24Hour: boolean("is_24_hour").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true), // Real-time availability toggle
  isSupportHospital: boolean("is_support_hospital").notNull().default(false), // Official PetSOS support partner
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  location: geography("location"), // PostGIS geography point for efficient spatial queries
  status: text("status").notNull().default('active'), // active, inactive, deleted
  services: text("services").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_clinic_location").using("gist", table.location), // Spatial index for fast geo-queries
]);

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  location: true, // Auto-populated by trigger from lat/lng
  createdAt: true,
  updatedAt: true,
});

export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinics.$inferSelect;

// Emergency Requests table
export const emergencyRequests = pgTable("emergency_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // Optional - supports anonymous requests
  petId: varchar("pet_id").references(() => pets.id, { onDelete: 'set null' }),
  symptom: text("symptom").notNull(),
  // Pet details for users without pet profiles
  petSpecies: text("pet_species"),
  petBreed: text("pet_breed"),
  petAge: integer("pet_age"),
  // Voice recording fields
  voiceTranscript: text("voice_transcript"), // Transcribed text from voice recording
  aiAnalyzedSymptoms: text("ai_analyzed_symptoms"), // AI-analyzed symptom summary
  isVoiceRecording: boolean("is_voice_recording").notNull().default(false), // Flag indicating voice input
  locationLatitude: decimal("location_latitude"),
  locationLongitude: decimal("location_longitude"),
  manualLocation: text("manual_location"),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  status: text("status").notNull().default('pending'), // pending, in_progress, completed, cancelled
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmergencyRequestSchema = createInsertSchema(emergencyRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertEmergencyRequest = z.infer<typeof insertEmergencyRequestSchema>;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;

// Messages table (for tracking clinic broadcasts)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emergencyRequestId: varchar("emergency_request_id").notNull().references(() => emergencyRequests.id, { onDelete: 'cascade' }),
  clinicId: varchar("clinic_id").notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  messageType: text("message_type").notNull(), // whatsapp, email
  recipient: text("recipient").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default('queued'), // queued, sent, delivered, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Feature Flags table
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  updatedAt: true,
});

export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  changes: jsonb("changes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Privacy Consents table
export const privacyConsents = pgTable("privacy_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  consentType: text("consent_type").notNull(), // data_collection, marketing, location
  granted: boolean("granted").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPrivacyConsentSchema = createInsertSchema(privacyConsents).omit({
  id: true,
  createdAt: true,
});

export type InsertPrivacyConsent = z.infer<typeof insertPrivacyConsentSchema>;
export type PrivacyConsent = typeof privacyConsents.$inferSelect;

// i18n Translations table
export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  language: text("language").notNull(), // en, zh-HK
  value: text("value").notNull(),
  namespace: text("namespace").notNull().default('common'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  updatedAt: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;
