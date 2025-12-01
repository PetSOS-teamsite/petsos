import { pgTable, varchar, text, timestamp, integer, boolean, decimal, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

const geography = customType<{ data: string }>({
  dataType() {
    return 'geography';
  },
});

// Sessions table
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Users table - unified auth system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username"),
  password: text("password"),
  email: varchar("email").unique(),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  openidSub: text("openid_sub").unique(),
  
  role: text("role").notNull().default('user'), // user, clinic_staff, hospital_staff, admin
  
  name: varchar("name"),
  avatar: text("avatar"),
  profileImageUrl: varchar("profile_image_url"),
  language: text("language").default('en'), // en, zh-HK
  languagePreference: text("language_preference"),
  region: text("region"), // HK district or region identifier
  regionPreference: text("region_preference"),
  clinicId: varchar("clinic_id").references(() => clinics.id, { onDelete: 'set null' }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_user_email").on(table.email),
  index("idx_user_phone").on(table.phone),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Pets table
export const pets = pgTable("pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  species: text("species").notNull(), // dog, cat, exotic, etc.
  breed: text("breed"),
  breedId: varchar("breed_id").references(() => petBreeds.id),
  age: integer("age"), // age in years/months
  weight: text("weight"), // in kg
  medicalNotes: text("medical_notes"), // primary medical notes field
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastVisitHospitalId: varchar("last_visit_hospital_id").references(() => hospitals.id, { onDelete: 'set null' }),
  lastVisitDate: timestamp("last_visit_date"),
  type: text("type"), // alternate field for species
  color: text("color"),
  medicalHistory: text("medical_history"),
  microchipId: text("microchip_id"),
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
  code: text("code").notNull().unique(), // HK, SG, US
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  region: text("region"), // asia, americas, etc.
  active: boolean("active"),
  phonePrefix: text("phone_prefix"),
  flag: text("flag"),
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
});

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

// Regions table (districts, states)
export const regions = pgTable("regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  countryId: varchar("country_id").notNull().references(() => countries.id),
  countryCode: text("country_code"), // Support both countryId (FK) and countryCode (string code)
  code: text("code").notNull(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  active: boolean("active"),
  phonePrefix: text("phone_prefix"),
  flag: text("flag"),
}, (table) => [
  index("idx_region_country").on(table.countryId),
]);

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// Pet Breeds table
export const petBreeds = pgTable("pet_breeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  species: text("species").notNull(), // dog, cat, exotic
  breedEn: text("breed_en").notNull(),
  breedZh: text("breed_zh"),
  countryCode: text("country_code"), // HK, SG, etc. - filters breeds by country
  isCommon: boolean("is_common").default(false), // whether this is a common breed
  active: boolean("active").notNull().default(true),
});

export const insertPetBreedSchema = createInsertSchema(petBreeds).omit({
  id: true,
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
  ownerVerificationCode: text("owner_verification_code"), // 6-digit passcode for clinic owner edit link
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  location: true,
  createdAt: true,
});

export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinics.$inferSelect;

// Emergency Requests table
export const emergencyRequests = pgTable("emergency_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  petId: varchar("pet_id").references(() => pets.id, { onDelete: 'set null' }),
  symptom: text("symptom"), // single symptom field
  locationLatitude: decimal("location_latitude"),
  locationLongitude: decimal("location_longitude"),
  manualLocation: text("manual_location"),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  status: text("status").notNull().default('pending'), // pending, in_progress, completed, cancelled
  regionId: varchar("region_id").references(() => regions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  petSpecies: text("pet_species"),
  petBreed: text("pet_breed"),
  petAge: text("pet_age"),
  voiceTranscript: text("voice_transcript"),
  aiAnalyzedSymptoms: text("ai_analyzed_symptoms"),
  isVoiceRecording: boolean("is_voice_recording"),
});

export const insertEmergencyRequestSchema = createInsertSchema(emergencyRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertEmergencyRequest = z.infer<typeof insertEmergencyRequestSchema>;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;

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
  email: text("email"),
  websiteUrl: text("website_url"),
  open247: boolean("open_247").notNull().default(true),
  isAvailable: boolean("is_available").notNull().default(true), // Admin can disable hospital
  isPartner: boolean("is_partner").notNull().default(false), // Official PetSOS partner hospital
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
  // Additional Medical Equipment
  oxygenTherapy: boolean("oxygen_therapy"), // Oxygen tanks/support
  ventilator: boolean("ventilator"), // Ventilator/respirator
  bloodTransfusion: boolean("blood_transfusion"), // Blood transfusion capability
  imagingMRI: boolean("imaging_mri"), // MRI imaging
  endoscopy: boolean("endoscopy"), // Endoscopy services
  dialysis: boolean("dialysis"), // Dialysis/renal support
  defibrillator: boolean("defibrillator"), // Defibrillator/AED
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
  ownerVerificationCode: text("owner_verification_code"), // 6-digit passcode for hospital owner edit link
  verified: boolean("verified").notNull().default(false),
  
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

// Messages table (for tracking hospital broadcasts)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emergencyRequestId: varchar("emergency_request_id").notNull().references(() => emergencyRequests.id, { onDelete: 'cascade' }),
  hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: 'cascade' }),
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
  action: text("action").notNull(), // create, update, delete, generate_code, broadcast_offer
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
  consentType: text("consent_type").notNull(), // marketing, analytics, data_sharing
  accepted: boolean("accepted").notNull(),
  consentedAt: timestamp("consented_at").notNull().defaultNow(),
});

export const insertPrivacyConsentSchema = createInsertSchema(privacyConsents).omit({
  id: true,
  consentedAt: true,
});

export type InsertPrivacyConsent = z.infer<typeof insertPrivacyConsentSchema>;
export type PrivacyConsent = typeof privacyConsents.$inferSelect;

// Translations table
export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(), // e.g., "common.emergency_alert"
  language: text("language").notNull(), // e.g., "en", "zh-HK"
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

// Pet Medical Records table - stores medical documents for pets
export const petMedicalRecords = pgTable("pet_medical_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id), // uploader, for ownership
  documentType: text("document_type").notNull(), // blood_test, xray, vaccination, surgery_report, prescription, other
  title: text("title").notNull(), // user-provided title like "Blood Test Dec 2024"
  description: text("description"), // optional notes
  filePath: text("file_path").notNull(), // object storage path
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: text("mime_type").notNull(), // application/pdf, image/jpeg, etc.
  isConfidential: boolean("is_confidential").notNull().default(false), // if true, requires explicit sharing consent
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // optional, for time-limited documents
}, (table) => [
  index("idx_pet_medical_records_pet").on(table.petId),
  index("idx_pet_medical_records_user").on(table.userId),
]);

export const insertPetMedicalRecordSchema = createInsertSchema(petMedicalRecords).omit({
  id: true,
  uploadedAt: true,
});

export type InsertPetMedicalRecord = z.infer<typeof insertPetMedicalRecordSchema>;
export type PetMedicalRecord = typeof petMedicalRecords.$inferSelect;

// Pet Medical Sharing Consent table - manages consent for sharing medical records
export const petMedicalSharingConsents = pgTable("pet_medical_sharing_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  consentType: text("consent_type").notNull(), // emergency_broadcast, hospital_view
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_pet_medical_sharing_consent_pet").on(table.petId),
  index("idx_pet_medical_sharing_consent_user").on(table.userId),
]);

export const insertPetMedicalSharingConsentSchema = createInsertSchema(petMedicalSharingConsents).omit({
  id: true,
  updatedAt: true,
});

export type InsertPetMedicalSharingConsent = z.infer<typeof insertPetMedicalSharingConsentSchema>;
export type PetMedicalSharingConsent = typeof petMedicalSharingConsents.$inferSelect;

// Push Notification Subscriptions table - stores OneSignal player IDs for push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  playerId: text("player_id").notNull().unique(),
  platform: text("platform").notNull(), // web, ios, android
  browserInfo: text("browser_info"),
  language: text("language").default('en'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
}, (table) => [
  index("idx_push_subscriptions_user").on(table.userId),
  index("idx_push_subscriptions_player").on(table.playerId),
]);

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Admin Notification Broadcasts table - stores sent notifications for audit
export const notificationBroadcasts = pgTable("notification_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  targetLanguage: text("target_language"), // null = all, 'en', 'zh-HK'
  targetAudience: text("target_audience").notNull().default('all'), // all, subscribed_users
  recipientCount: integer("recipient_count"),
  status: text("status").notNull().default('pending'), // pending, sent, failed
  onesignalResponse: jsonb("onesignal_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
}, (table) => [
  index("idx_notification_broadcasts_admin").on(table.adminId),
]);

export const insertNotificationBroadcastSchema = createInsertSchema(notificationBroadcasts).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  recipientCount: true,
  onesignalResponse: true,
});

export type InsertNotificationBroadcast = z.infer<typeof insertNotificationBroadcastSchema>;
export type NotificationBroadcast = typeof notificationBroadcasts.$inferSelect;
