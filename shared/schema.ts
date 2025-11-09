import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, decimal, index, uniqueIndex, customType } from "drizzle-orm/pg-core";
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

// Countries table
export const countries = pgTable("countries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // ISO country code (HK, CN, US, etc.)
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  phonePrefix: text("phone_prefix").notNull(), // +852, +86, +1, etc.
  flag: text("flag"), // Emoji flag or icon
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true,
});

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

// Regions table
export const regions = pgTable("regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // HKI, KLN, NTI
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh").notNull(),
  coordinates: jsonb("coordinates"), // GeoJSON polygon for auto-detect
  countryCode: text("country_code").notNull().references(() => countries.code).default('HK'),
  active: boolean("active").notNull().default(true),
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// Pet Breeds table
export const petBreeds = pgTable("pet_breeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  species: text("species").notNull(), // dog, cat, bird, etc.
  breedEn: text("breed_en").notNull(),
  breedZh: text("breed_zh"),
  countryCode: text("country_code").references(() => countries.code), // Optional: breed specific to country
  isCommon: boolean("is_common").notNull().default(true), // Flag common breeds for easier selection
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPetBreedSchema = createInsertSchema(petBreeds).omit({
  id: true,
  createdAt: true,
});

export type InsertPetBreed = z.infer<typeof insertPetBreedSchema>;
export type PetBreed = typeof petBreeds.$inferSelect;

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
  lineUserId: text("line_user_id"), // LINE Official Account user ID for receiving emergency notifications
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
  messageType: text("message_type").notNull(), // whatsapp, email, line
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

// Hospitals table - detailed 24-hour animal hospital profiles
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh").notNull(),
  addressEn: text("address_en").notNull(),
  addressZh: text("address_zh").notNull(),
  regionId: varchar("region_id").notNull().references(() => regions.id),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  location: geography("location"), // PostGIS geography point
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  websiteUrl: text("website_url"),
  open247: boolean("open_247").notNull().default(true),
  liveStatus: text("live_status"), // normal | busy | critical_only
  photos: jsonb("photos"), // Array of photo URLs
  lastVerifiedAt: timestamp("last_verified_at"),
  verifiedById: varchar("verified_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Owner-centric details
  onSiteVet247: boolean("on_site_vet_247"),
  triagePolicy: text("triage_policy"),
  typicalWaitBand: text("typical_wait_band"),
  isolationWard: boolean("isolation_ward"),
  ambulanceSupport: boolean("ambulance_support"),
  icuLevel: text("icu_level"),
  nurse24h: boolean("nurse_24h"),
  ownerVisitPolicy: text("owner_visit_policy"),
  eolSupport: boolean("eol_support"),
  imagingXray: boolean("imaging_xray"),
  imagingUS: boolean("imaging_us"),
  imagingCT: boolean("imaging_ct"),
  sameDayCT: boolean("same_day_ct"),
  inHouseLab: boolean("in_house_lab"),
  extLabCutoff: text("ext_lab_cutoff"),
  bloodBankAccess: text("blood_bank_access"),
  sxEmergencySoft: boolean("sx_emergency_soft"),
  sxEmergencyOrtho: boolean("sx_emergency_ortho"),
  anaesMonitoring: text("anaes_monitoring"),
  specialistAvail: text("specialist_avail"),
  speciesAccepted: text("species_accepted").array(),
  whatsappTriage: boolean("whatsapp_triage"),
  languages: text("languages").array(),
  parking: boolean("parking"),
  wheelchairAccess: boolean("wheelchair_access"),
  payMethods: text("pay_methods").array(),
  admissionDeposit: boolean("admission_deposit"),
  depositBand: text("deposit_band"),
  insuranceSupport: text("insurance_support").array(),
  recheckWindow: text("recheck_window"),
  refundPolicy: text("refund_policy"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_hospital_location").using("gist", table.location),
  index("idx_hospital_region").on(table.regionId),
]);

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  location: true, // Auto-populated from lat/lng
  createdAt: true,
  updatedAt: true,
});

export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Hospital = typeof hospitals.$inferSelect;

// Hospital Consult Fees table
export const hospitalConsultFees = pgTable("hospital_consult_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: 'cascade' }),
  feeType: text("fee_type").notNull(), // day | evening | night_ph
  species: text("species").notNull(), // dog | cat | exotic
  minFee: decimal("min_fee"),
  maxFee: decimal("max_fee"),
  currency: text("currency").notNull().default('HKD'),
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => [
  index("idx_consult_fees_hospital").on(table.hospitalId),
  // Unique constraint to prevent duplicate fee entries
  uniqueIndex("idx_consult_fees_unique").on(table.hospitalId, table.feeType, table.species),
]);

export const insertHospitalConsultFeeSchema = createInsertSchema(hospitalConsultFees).omit({
  id: true,
});

export type InsertHospitalConsultFee = z.infer<typeof insertHospitalConsultFeeSchema>;
export type HospitalConsultFee = typeof hospitalConsultFees.$inferSelect;

// Hospital Updates table - tracks changes and user submissions
export const hospitalUpdates = pgTable("hospital_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: 'cascade' }),
  submittedById: varchar("submitted_by_id").references(() => users.id, { onDelete: 'set null' }),
  updateType: text("update_type").notNull(), // info_correction | fee_update | service_update
  fieldName: text("field_name"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  status: text("status").notNull().default('pending'), // pending | approved | rejected
  reviewedById: varchar("reviewed_by_id").references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_hospital_updates_hospital").on(table.hospitalId),
]);

export const insertHospitalUpdateSchema = createInsertSchema(hospitalUpdates).omit({
  id: true,
  createdAt: true,
});

export type InsertHospitalUpdate = z.infer<typeof insertHospitalUpdateSchema>;
export type HospitalUpdate = typeof hospitalUpdates.$inferSelect;
