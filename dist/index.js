var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  auditLogs: () => auditLogs,
  clinics: () => clinics,
  countries: () => countries,
  emergencyRequests: () => emergencyRequests,
  featureFlags: () => featureFlags,
  hospitalConsultFees: () => hospitalConsultFees,
  hospitalUpdates: () => hospitalUpdates,
  hospitals: () => hospitals,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertClinicSchema: () => insertClinicSchema,
  insertCountrySchema: () => insertCountrySchema,
  insertEmergencyRequestSchema: () => insertEmergencyRequestSchema,
  insertFeatureFlagSchema: () => insertFeatureFlagSchema,
  insertHospitalConsultFeeSchema: () => insertHospitalConsultFeeSchema,
  insertHospitalSchema: () => insertHospitalSchema,
  insertHospitalUpdateSchema: () => insertHospitalUpdateSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPetBreedSchema: () => insertPetBreedSchema,
  insertPetSchema: () => insertPetSchema,
  insertPrivacyConsentSchema: () => insertPrivacyConsentSchema,
  insertRegionSchema: () => insertRegionSchema,
  insertTranslationSchema: () => insertTranslationSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  petBreeds: () => petBreeds,
  pets: () => pets,
  privacyConsents: () => privacyConsents,
  regions: () => regions,
  sessions: () => sessions,
  translations: () => translations,
  users: () => users
});
import { pgTable, varchar, text, timestamp, integer, boolean, decimal, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var geography, sessions, users, insertUserSchema, pets, insertPetSchema, countries, insertCountrySchema, regions, insertRegionSchema, petBreeds, insertPetBreedSchema, clinics, insertClinicSchema, emergencyRequests, insertEmergencyRequestSchema, hospitals, insertHospitalSchema, messages, insertMessageSchema, featureFlags, insertFeatureFlagSchema, auditLogs, insertAuditLogSchema, privacyConsents, insertPrivacyConsentSchema, translations, insertTranslationSchema, hospitalConsultFees, insertHospitalConsultFeeSchema, hospitalUpdates, insertHospitalUpdateSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    geography = customType({
      dataType() {
        return "geography";
      }
    });
    sessions = pgTable("sessions", {
      sid: varchar("sid").primaryKey(),
      sess: jsonb("sess").notNull(),
      expire: timestamp("expire").notNull()
    });
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: text("username"),
      password: text("password"),
      email: varchar("email").unique(),
      phone: text("phone"),
      passwordHash: text("password_hash"),
      googleId: text("google_id").unique(),
      openidSub: text("openid_sub").unique(),
      role: text("role").notNull().default("user"),
      // user, clinic_staff, hospital_staff, admin
      name: varchar("name"),
      avatar: text("avatar"),
      profileImageUrl: varchar("profile_image_url"),
      language: text("language").default("en"),
      // en, zh-HK
      languagePreference: text("language_preference"),
      region: text("region"),
      // HK district or region identifier
      regionPreference: text("region_preference"),
      clinicId: varchar("clinic_id").references(() => clinics.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => [
      index("idx_user_email").on(table.email),
      index("idx_user_phone").on(table.phone)
    ]);
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    pets = pgTable("pets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      species: text("species").notNull(),
      // dog, cat, exotic, etc.
      breed: text("breed"),
      breedId: varchar("breed_id").references(() => petBreeds.id),
      age: integer("age"),
      // age in years/months
      weight: text("weight"),
      // in kg
      medicalNotes: text("medical_notes"),
      // primary medical notes field
      createdAt: timestamp("created_at").notNull().defaultNow(),
      lastVisitHospitalId: varchar("last_visit_hospital_id").references(() => hospitals.id, { onDelete: "set null" }),
      lastVisitDate: timestamp("last_visit_date"),
      type: text("type"),
      // alternate field for species
      color: text("color"),
      medicalHistory: text("medical_history"),
      microchipId: text("microchip_id")
    });
    insertPetSchema = createInsertSchema(pets).omit({
      id: true,
      createdAt: true
    });
    countries = pgTable("countries", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      code: text("code").notNull().unique(),
      // HK, SG, US
      nameEn: text("name_en").notNull(),
      nameZh: text("name_zh"),
      region: text("region"),
      // asia, americas, etc.
      active: boolean("active"),
      phonePrefix: text("phone_prefix"),
      flag: text("flag")
    });
    insertCountrySchema = createInsertSchema(countries).omit({
      id: true
    });
    regions = pgTable("regions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      countryId: varchar("country_id").notNull().references(() => countries.id),
      countryCode: text("country_code"),
      // Support both countryId (FK) and countryCode (string code)
      code: text("code").notNull(),
      nameEn: text("name_en").notNull(),
      nameZh: text("name_zh"),
      active: boolean("active"),
      phonePrefix: text("phone_prefix"),
      flag: text("flag")
    }, (table) => [
      index("idx_region_country").on(table.countryId)
    ]);
    insertRegionSchema = createInsertSchema(regions).omit({
      id: true
    });
    petBreeds = pgTable("pet_breeds", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      species: text("species").notNull(),
      // dog, cat, exotic
      breedEn: text("breed_en").notNull(),
      breedZh: text("breed_zh"),
      countryCode: text("country_code"),
      // HK, SG, etc. - filters breeds by country
      isCommon: boolean("is_common").default(false),
      // whether this is a common breed
      active: boolean("active").notNull().default(true)
    });
    insertPetBreedSchema = createInsertSchema(petBreeds).omit({
      id: true
    });
    clinics = pgTable("clinics", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      nameZh: text("name_zh"),
      address: text("address").notNull(),
      addressZh: text("address_zh"),
      phone: text("phone").notNull(),
      whatsapp: text("whatsapp"),
      email: text("email"),
      lineUserId: text("line_user_id"),
      // LINE Official Account user ID for receiving emergency notifications
      regionId: varchar("region_id").notNull().references(() => regions.id),
      is24Hour: boolean("is_24_hour").notNull().default(false),
      isAvailable: boolean("is_available").notNull().default(true),
      // Real-time availability toggle
      isSupportHospital: boolean("is_support_hospital").notNull().default(false),
      // Official PetSOS support partner
      latitude: decimal("latitude"),
      longitude: decimal("longitude"),
      location: geography("location"),
      // PostGIS geography point for efficient spatial queries
      status: text("status").notNull().default("active"),
      // active, inactive, deleted
      services: text("services").array(),
      ownerVerificationCode: text("owner_verification_code"),
      // 6-digit passcode for clinic owner edit link
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertClinicSchema = createInsertSchema(clinics).omit({
      id: true,
      location: true,
      createdAt: true
    });
    emergencyRequests = pgTable("emergency_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
      petId: varchar("pet_id").references(() => pets.id, { onDelete: "set null" }),
      symptom: text("symptom"),
      // single symptom field
      locationLatitude: decimal("location_latitude"),
      locationLongitude: decimal("location_longitude"),
      manualLocation: text("manual_location"),
      contactName: text("contact_name").notNull(),
      contactPhone: text("contact_phone").notNull(),
      status: text("status").notNull().default("pending"),
      // pending, in_progress, completed, cancelled
      regionId: varchar("region_id").references(() => regions.id),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      petSpecies: text("pet_species"),
      petBreed: text("pet_breed"),
      petAge: text("pet_age"),
      voiceTranscript: text("voice_transcript"),
      aiAnalyzedSymptoms: text("ai_analyzed_symptoms"),
      isVoiceRecording: boolean("is_voice_recording")
    });
    insertEmergencyRequestSchema = createInsertSchema(emergencyRequests).omit({
      id: true,
      createdAt: true
    });
    hospitals = pgTable("hospitals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      slug: text("slug").notNull().unique(),
      nameEn: text("name_en").notNull(),
      nameZh: text("name_zh").notNull(),
      addressEn: text("address_en").notNull(),
      addressZh: text("address_zh").notNull(),
      regionId: varchar("region_id").notNull().references(() => regions.id),
      latitude: decimal("latitude"),
      longitude: decimal("longitude"),
      location: geography("location"),
      // PostGIS geography point
      phone: text("phone"),
      whatsapp: text("whatsapp"),
      email: text("email"),
      websiteUrl: text("website_url"),
      open247: boolean("open_247").notNull().default(true),
      isAvailable: boolean("is_available").notNull().default(true),
      // Admin can disable hospital
      isPartner: boolean("is_partner").notNull().default(false),
      // Official PetSOS partner hospital
      liveStatus: text("live_status"),
      // normal | busy | critical_only
      photos: jsonb("photos"),
      // Array of photo URLs
      lastVerifiedAt: timestamp("last_verified_at"),
      verifiedById: varchar("verified_by_id").references(() => users.id, { onDelete: "set null" }),
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
      ownerVerificationCode: text("owner_verification_code"),
      // 6-digit passcode for hospital owner edit link
      verified: boolean("verified").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => [
      index("idx_hospital_location").using("gist", table.location),
      index("idx_hospital_region").on(table.regionId)
    ]);
    insertHospitalSchema = createInsertSchema(hospitals).omit({
      id: true,
      location: true,
      // Auto-populated from lat/lng
      createdAt: true,
      updatedAt: true
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      emergencyRequestId: varchar("emergency_request_id").notNull().references(() => emergencyRequests.id, { onDelete: "cascade" }),
      hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
      messageType: text("message_type").notNull(),
      // whatsapp, email, line
      recipient: text("recipient").notNull(),
      content: text("content").notNull(),
      status: text("status").notNull().default("queued"),
      // queued, sent, delivered, failed
      sentAt: timestamp("sent_at"),
      deliveredAt: timestamp("delivered_at"),
      failedAt: timestamp("failed_at"),
      errorMessage: text("error_message"),
      retryCount: integer("retry_count").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      createdAt: true
    });
    featureFlags = pgTable("feature_flags", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      key: text("key").notNull().unique(),
      enabled: boolean("enabled").notNull().default(false),
      value: jsonb("value"),
      description: text("description"),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
      id: true,
      updatedAt: true
    });
    auditLogs = pgTable("audit_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      entityType: text("entity_type").notNull(),
      entityId: text("entity_id").notNull(),
      action: text("action").notNull(),
      // create, update, delete, generate_code, broadcast_offer
      userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
      changes: jsonb("changes"),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertAuditLogSchema = createInsertSchema(auditLogs).omit({
      id: true,
      createdAt: true
    });
    privacyConsents = pgTable("privacy_consents", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      consentType: text("consent_type").notNull(),
      // marketing, analytics, data_sharing
      accepted: boolean("accepted").notNull(),
      consentedAt: timestamp("consented_at").notNull().defaultNow()
    });
    insertPrivacyConsentSchema = createInsertSchema(privacyConsents).omit({
      id: true,
      consentedAt: true
    });
    translations = pgTable("translations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      key: text("key").notNull().unique(),
      // e.g., "common.emergency_alert"
      value: text("value"),
      en: text("en").notNull(),
      zhHk: text("zh_hk").notNull()
    });
    insertTranslationSchema = createInsertSchema(translations).omit({
      id: true
    });
    hospitalConsultFees = pgTable("hospital_consult_fees", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
      feeType: text("fee_type").notNull(),
      // day | evening | night_ph
      species: text("species").notNull(),
      // dog | cat | exotic
      minFee: decimal("min_fee"),
      maxFee: decimal("max_fee"),
      currency: text("currency").notNull().default("HKD"),
      notes: text("notes"),
      lastUpdated: timestamp("last_updated").notNull().defaultNow()
    }, (table) => [
      index("idx_consult_fees_hospital").on(table.hospitalId),
      uniqueIndex("idx_consult_fees_unique").on(table.hospitalId, table.feeType, table.species)
    ]);
    insertHospitalConsultFeeSchema = createInsertSchema(hospitalConsultFees).omit({
      id: true
    });
    hospitalUpdates = pgTable("hospital_updates", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
      submittedById: varchar("submitted_by_id").references(() => users.id, { onDelete: "set null" }),
      updateType: text("update_type").notNull(),
      // info_correction | fee_update | service_update
      fieldName: text("field_name"),
      oldValue: text("old_value"),
      newValue: text("new_value"),
      status: text("status").notNull().default("pending"),
      // pending | approved | rejected
      reviewedById: varchar("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
      reviewedAt: timestamp("reviewed_at"),
      notes: text("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => [
      index("idx_hospital_updates_hospital").on(table.hospitalId)
    ]);
    insertHospitalUpdateSchema = createInsertSchema(hospitalUpdates).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();

// server/db.ts
init_schema();
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, inArray, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  async getAllClinics() {
    return await db.select().from(clinics).where(eq(clinics.status, "active"));
  }
  async getClinic(id) {
    const result = await db.select().from(clinics).where(eq(clinics.id, id));
    return result[0];
  }
  async getClinicsByRegion(regionId) {
    return await db.select().from(clinics).where(
      and(eq(clinics.regionId, regionId), eq(clinics.status, "active"))
    );
  }
  async get24HourClinicsByRegion(regionId) {
    return await db.select().from(clinics).where(
      and(
        eq(clinics.regionId, regionId),
        eq(clinics.is24Hour, true),
        eq(clinics.status, "active")
      )
    );
  }
  async getNearbyClinics(latitude, longitude, radiusMeters) {
    const result = await db.execute(
      sql2`
        SELECT *, 
               ST_Distance(location, ST_MakePoint(${longitude}, ${latitude})::geography) as distance
        FROM clinics
        WHERE status = 'active'
          AND location IS NOT NULL
          AND ST_DWithin(
            location,
            ST_MakePoint(${longitude}, ${latitude})::geography,
            ${radiusMeters}
          )
        ORDER BY distance ASC
      `
    );
    return result.rows;
  }
  async createClinic(insertClinic) {
    const result = await db.insert(clinics).values(insertClinic).returning();
    return result[0];
  }
  async updateClinic(id, updateData) {
    const result = await db.update(clinics).set({ ...updateData }).where(eq(clinics.id, id)).returning();
    return result[0];
  }
  async deleteClinic(id) {
    const result = await db.update(clinics).set({ status: "inactive" }).where(eq(clinics.id, id)).returning();
    return result.length > 0;
  }
  async getAllRegions() {
    try {
      return await db.select().from(regions);
    } catch (error) {
      console.warn("getAllRegions query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getRegion(id) {
    const result = await db.select().from(regions).where(eq(regions.id, id));
    return result[0];
  }
  async getRegionByCode(code) {
    const result = await db.select().from(regions).where(eq(regions.code, code));
    return result[0];
  }
  async createRegion(insertRegion) {
    const result = await db.insert(regions).values(insertRegion).returning();
    return result[0];
  }
  async updateRegion(id, updateData) {
    const result = await db.update(regions).set(updateData).where(eq(regions.id, id)).returning();
    return result[0];
  }
  async getRegionsByCountry(countryCode) {
    try {
      return await db.select().from(regions).where(eq(regions.countryCode, countryCode));
    } catch (error) {
      console.warn("getRegionsByCountry query failed (countryCode column may not exist):", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getCountry(id) {
    try {
      const result = await db.select().from(countries).where(eq(countries.id, id));
      return result[0];
    } catch (error) {
      console.warn("getCountry query failed:", error instanceof Error ? error.message : error);
      return void 0;
    }
  }
  async getCountryByCode(code) {
    try {
      const result = await db.select().from(countries).where(eq(countries.code, code));
      return result[0];
    } catch (error) {
      console.warn("getCountryByCode query failed:", error instanceof Error ? error.message : error);
      return void 0;
    }
  }
  async getAllCountries() {
    try {
      return await db.select().from(countries);
    } catch (error) {
      console.warn("getAllCountries query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getActiveCountries() {
    try {
      return await db.select().from(countries).where(eq(countries.active, true));
    } catch (error) {
      console.warn("getActiveCountries query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async createCountry(insertCountry) {
    const result = await db.insert(countries).values(insertCountry).returning();
    return result[0];
  }
  async updateCountry(id, updateData) {
    const result = await db.update(countries).set(updateData).where(eq(countries.id, id)).returning();
    return result[0];
  }
  async deleteCountry(id) {
    const result = await db.update(countries).set({ active: false }).where(eq(countries.id, id)).returning();
    return result.length > 0;
  }
  async getPetBreed(id) {
    const result = await db.select().from(petBreeds).where(eq(petBreeds.id, id));
    return result[0];
  }
  async getPetBreedsBySpecies(species) {
    try {
      return await db.select().from(petBreeds).where(
        and(eq(petBreeds.species, species), eq(petBreeds.active, true))
      );
    } catch (error) {
      console.warn("getPetBreedsBySpecies query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getPetBreedsByCountry(countryCode) {
    try {
      return await db.select().from(petBreeds).where(
        and(eq(petBreeds.countryCode, countryCode), eq(petBreeds.active, true))
      );
    } catch (error) {
      console.warn("getPetBreedsByCountry query failed (countryCode column may not exist):", error instanceof Error ? error.message : error);
      try {
        return await db.select().from(petBreeds).where(eq(petBreeds.active, true));
      } catch {
        return [];
      }
    }
  }
  async getCommonPetBreeds(species) {
    try {
      const conditions = [eq(petBreeds.isCommon, true), eq(petBreeds.active, true)];
      if (species) {
        conditions.push(eq(petBreeds.species, species));
      }
      return await db.select().from(petBreeds).where(and(...conditions));
    } catch (error) {
      console.warn("getCommonPetBreeds query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getAllPetBreeds() {
    try {
      return await db.select().from(petBreeds).where(eq(petBreeds.active, true));
    } catch (error) {
      console.warn("getAllPetBreeds query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async createPetBreed(insertBreed) {
    const result = await db.insert(petBreeds).values(insertBreed).returning();
    return result[0];
  }
  async updatePetBreed(id, updateData) {
    const result = await db.update(petBreeds).set(updateData).where(eq(petBreeds.id, id)).returning();
    return result[0];
  }
  async deletePetBreed(id) {
    const result = await db.update(petBreeds).set({ active: false }).where(eq(petBreeds.id, id)).returning();
    return result.length > 0;
  }
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async getUserByPhone(phone) {
    const result = await db.select().from(users).where(eq(users.phone, phone));
    return result[0];
  }
  async getAllUsers() {
    const result = await db.select().from(users);
    return result;
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async updateUser(id, updateData) {
    const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getPet(id) {
    const result = await db.select().from(pets).where(eq(pets.id, id));
    return result[0];
  }
  async getPetsByUserId(userId) {
    return await db.select().from(pets).where(eq(pets.userId, userId));
  }
  async getAllPets() {
    return await db.select().from(pets);
  }
  async createPet(insertPet) {
    const result = await db.insert(pets).values(insertPet).returning();
    return result[0];
  }
  async updatePet(id, updateData) {
    const result = await db.update(pets).set(updateData).where(eq(pets.id, id)).returning();
    return result[0];
  }
  async deletePet(id) {
    const result = await db.delete(pets).where(eq(pets.id, id)).returning();
    return result.length > 0;
  }
  async getEmergencyRequest(id) {
    const results = await db.select({
      request: emergencyRequests,
      pet: pets
    }).from(emergencyRequests).leftJoin(pets, eq(pets.id, emergencyRequests.petId)).where(eq(emergencyRequests.id, id));
    if (results.length === 0) return void 0;
    const { request, pet } = results[0];
    return {
      ...request,
      pet
    };
  }
  async getEmergencyRequestsByUserId(userId) {
    return await db.select().from(emergencyRequests).where(eq(emergencyRequests.userId, userId));
  }
  async getEmergencyRequestsByClinicId(clinicId) {
    const results = await db.selectDistinct({
      request: emergencyRequests,
      pet: pets,
      user: users
    }).from(emergencyRequests).innerJoin(messages, eq(messages.emergencyRequestId, emergencyRequests.id)).leftJoin(pets, eq(pets.id, emergencyRequests.petId)).leftJoin(users, eq(users.id, emergencyRequests.userId)).where(eq(messages.hospitalId, clinicId)).orderBy(emergencyRequests.createdAt);
    return results.map(({ request, pet, user }) => ({
      ...request,
      pet,
      user
    }));
  }
  async getAllEmergencyRequests() {
    return await db.select().from(emergencyRequests);
  }
  async createEmergencyRequest(insertRequest) {
    const result = await db.insert(emergencyRequests).values(insertRequest).returning();
    return result[0];
  }
  async updateEmergencyRequest(id, updateData) {
    const result = await db.update(emergencyRequests).set(updateData).where(eq(emergencyRequests.id, id)).returning();
    return result[0];
  }
  async getMessage(id) {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }
  async getMessagesByEmergencyRequest(emergencyRequestId) {
    return await db.select().from(messages).where(eq(messages.emergencyRequestId, emergencyRequestId));
  }
  async createMessage(insertMessage) {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }
  async updateMessage(id, updateData) {
    const result = await db.update(messages).set(updateData).where(eq(messages.id, id)).returning();
    return result[0];
  }
  async getQueuedMessages() {
    return await db.select().from(messages).where(eq(messages.status, "pending"));
  }
  async getFeatureFlag(key) {
    const result = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
    return result[0];
  }
  async getAllFeatureFlags() {
    return await db.select().from(featureFlags);
  }
  async createFeatureFlag(insertFlag) {
    const result = await db.insert(featureFlags).values(insertFlag).returning();
    return result[0];
  }
  async updateFeatureFlag(id, updateData) {
    const result = await db.update(featureFlags).set(updateData).where(eq(featureFlags.id, id)).returning();
    return result[0];
  }
  async createAuditLog(insertLog) {
    const result = await db.insert(auditLogs).values(insertLog).returning();
    return result[0];
  }
  async getAuditLogsByEntity(entityType, entityId) {
    return await db.select().from(auditLogs).where(
      and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId))
    );
  }
  async getPrivacyConsents(userId) {
    return await db.select().from(privacyConsents).where(eq(privacyConsents.userId, userId));
  }
  async createPrivacyConsent(insertConsent) {
    const result = await db.insert(privacyConsents).values(insertConsent).returning();
    return result[0];
  }
  async getTranslationsByLanguage(language) {
    try {
      return await db.select().from(translations);
    } catch (error) {
      console.warn("Translation table not ready or missing columns:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getTranslation(key, language) {
    try {
      const result = await db.select().from(translations).where(eq(translations.key, key));
      return result[0];
    } catch (error) {
      console.warn("Translation query failed:", error instanceof Error ? error.message : error);
      return void 0;
    }
  }
  async createTranslation(insertTranslation) {
    const result = await db.insert(translations).values(insertTranslation).returning();
    return result[0];
  }
  async updateTranslation(id, updateData) {
    const result = await db.update(translations).set(updateData).where(eq(translations.id, id)).returning();
    return result[0];
  }
  // Hospitals
  async getHospital(id) {
    try {
      const result = await db.select().from(hospitals).where(eq(hospitals.id, id));
      return result[0];
    } catch (error) {
      console.warn("getHospital query failed:", error instanceof Error ? error.message : error);
      return void 0;
    }
  }
  async getHospitalBySlug(slug) {
    try {
      const result = await db.select().from(hospitals).where(eq(hospitals.slug, slug));
      return result[0];
    } catch (error) {
      console.warn("getHospitalBySlug query failed:", error instanceof Error ? error.message : error);
      return void 0;
    }
  }
  async getHospitalsByRegion(regionId) {
    try {
      return await db.select().from(hospitals).where(eq(hospitals.regionId, regionId));
    } catch (error) {
      console.warn("getHospitalsByRegion query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getAllHospitals() {
    try {
      return await db.select().from(hospitals);
    } catch (error) {
      console.warn("getAllHospitals query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async getNearbyHospitals(latitude, longitude, radiusMeters) {
    try {
      const results = await db.select({
        hospital: hospitals,
        distance: sql2`ST_Distance(
            ${hospitals.location}::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          )`.as("distance")
      }).from(hospitals).where(
        and(
          eq(hospitals.isAvailable, true),
          sql2`${hospitals.location} IS NOT NULL`,
          sql2`ST_DWithin(
              ${hospitals.location}::geography,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
              ${radiusMeters}
            )`
        )
      ).orderBy(sql2`distance`);
      return results.map((r) => ({
        ...r.hospital,
        distance: r.distance
      }));
    } catch (error) {
      console.warn("getNearbyHospitals query failed:", error instanceof Error ? error.message : error);
      return [];
    }
  }
  async createHospital(insertHospital) {
    const result = await db.insert(hospitals).values({
      ...insertHospital,
      ownerVerificationCode: insertHospital.ownerVerificationCode ?? null
    }).returning();
    return result[0];
  }
  async updateHospital(id, updateData) {
    const result = await db.update(hospitals).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(hospitals.id, id)).returning();
    return result[0];
  }
  async deleteHospital(id) {
    const result = await db.delete(hospitals).where(eq(hospitals.id, id)).returning();
    return result.length > 0;
  }
  // Hospital Consult Fees
  async getConsultFeesByHospitalId(hospitalId) {
    return await db.select().from(hospitalConsultFees).where(eq(hospitalConsultFees.hospitalId, hospitalId));
  }
  async createConsultFee(insertFee) {
    const result = await db.insert(hospitalConsultFees).values(insertFee).returning();
    return result[0];
  }
  async updateConsultFee(id, updateData) {
    const result = await db.update(hospitalConsultFees).set({ ...updateData, lastUpdated: /* @__PURE__ */ new Date() }).where(eq(hospitalConsultFees.id, id)).returning();
    return result[0];
  }
  async deleteConsultFee(id) {
    const result = await db.delete(hospitalConsultFees).where(eq(hospitalConsultFees.id, id)).returning();
    return result.length > 0;
  }
  // Hospital Updates
  async getHospitalUpdatesByHospitalId(hospitalId) {
    return await db.select().from(hospitalUpdates).where(eq(hospitalUpdates.hospitalId, hospitalId));
  }
  async createHospitalUpdate(insertUpdate) {
    const result = await db.insert(hospitalUpdates).values(insertUpdate).returning();
    return result[0];
  }
  async updateHospitalUpdate(id, updateData) {
    const result = await db.update(hospitalUpdates).set(updateData).where(eq(hospitalUpdates.id, id)).returning();
    return result[0];
  }
  async exportUserData(userId) {
    const user = await this.getUser(userId);
    const userPets = await db.select().from(pets).where(eq(pets.userId, userId));
    const requests = await db.select().from(emergencyRequests).where(eq(emergencyRequests.userId, userId));
    const consents = await db.select().from(privacyConsents).where(eq(privacyConsents.userId, userId));
    const logs = await db.select().from(auditLogs).where(
      and(
        eq(auditLogs.entityType, "user"),
        eq(auditLogs.entityId, userId)
      )
    );
    return {
      user,
      pets: userPets,
      emergencyRequests: requests,
      privacyConsents: consents,
      auditLogs: logs
    };
  }
  async deleteUserDataGDPR(userId) {
    const userRequests = await db.select().from(emergencyRequests).where(eq(emergencyRequests.userId, userId));
    const requestIds = userRequests.map((r) => r.id);
    let deletedMessages = 0;
    if (requestIds.length > 0) {
      const msgResults = await db.delete(messages).where(
        inArray(messages.emergencyRequestId, requestIds)
      ).returning();
      deletedMessages = msgResults.length;
    }
    const deletedPets = await db.delete(pets).where(eq(pets.userId, userId)).returning();
    const deletedRequests = await db.delete(emergencyRequests).where(eq(emergencyRequests.userId, userId)).returning();
    const deletedConsents = await db.delete(privacyConsents).where(eq(privacyConsents.userId, userId)).returning();
    await db.delete(auditLogs).where(
      eq(auditLogs.userId, userId)
    );
    await db.delete(auditLogs).where(
      and(
        eq(auditLogs.entityType, "user"),
        eq(auditLogs.entityId, userId)
      )
    );
    const deletedUser = await db.delete(users).where(eq(users.id, userId)).returning();
    return {
      success: deletedUser.length > 0,
      deletedRecords: {
        pets: deletedPets.length,
        emergencyRequests: deletedRequests.length,
        privacyConsents: deletedConsents.length,
        messages: deletedMessages,
        user: deletedUser.length > 0
      }
    };
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";

// server/gmail-client.ts
import { google } from "googleapis";
var connectionSettings;
async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-mail",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) {
    throw new Error("Gmail not connected");
  }
  return accessToken;
}
async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}
async function sendGmailEmail(to, subject, content, from) {
  try {
    const gmail = await getUncachableGmailClient();
    const emailContent = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      content
    ].join("\n");
    const encodedMessage = Buffer.from(emailContent).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage
      }
    });
    console.log("[GMAIL] Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("[GMAIL] Error sending email:", error);
    return false;
  }
}

// server/services/messaging.ts
import { Client as LineClient } from "@line/bot-sdk";
var WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v17.0";
var WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
var WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
var LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
var EMAIL_FROM = process.env.EMAIL_FROM || "noreply@petemergency.com";
var MAX_RETRIES = 3;
var RETRY_DELAY_MS = 5e3;
var TESTING_MODE = false;
var TEST_PHONE_NUMBERS = ["85265727136", "85255375152"];
var testNumberIndex = 0;
var MessagingService = class {
  /**
   * Send a WhatsApp template message using approved Meta templates
   */
  async sendWhatsAppTemplateMessage(phoneNumber, templateName, templateVariables) {
    console.log("[WhatsApp Template] Attempting to send template message...");
    console.log("[WhatsApp Template] Template:", templateName);
    console.log("[WhatsApp Template] Variables count:", templateVariables.length);
    console.log("[WhatsApp Template] Has Access Token:", !!WHATSAPP_ACCESS_TOKEN);
    console.log("[WhatsApp Template] Has Phone Number ID:", !!WHATSAPP_PHONE_NUMBER_ID);
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("[WhatsApp Template] Credentials not configured - missing token or phone number ID");
      return false;
    }
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, "");
    if (!cleanedNumber || cleanedNumber.length < 8) {
      console.error("[WhatsApp Template] Invalid phone number:", phoneNumber);
      return false;
    }
    try {
      const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const parameters = templateVariables.map((value) => ({
        type: "text",
        text: value
      }));
      const payload = {
        messaging_product: "whatsapp",
        to: cleanedNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: templateName.endsWith("_zh_hk") ? "zh_HK" : "en"
          },
          components: [
            {
              type: "body",
              parameters
            }
          ]
        }
      };
      console.log("[WhatsApp Template] Request payload:", JSON.stringify(payload, null, 2));
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("[WhatsApp Template] Response status:", response.status);
      if (!response.ok) {
        const error = await response.text();
        console.error("[WhatsApp Template] API error response:", error);
        try {
          const errorJson = JSON.parse(error);
          console.error("[WhatsApp Template] Parsed error:", JSON.stringify(errorJson, null, 2));
        } catch (e) {
        }
        return false;
      }
      const result = await response.json();
      console.log("[WhatsApp Template] Message sent successfully!");
      console.log("[WhatsApp Template] API Response:", JSON.stringify(result, null, 2));
      console.log("[WhatsApp Template] Message ID:", result.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error("[WhatsApp Template] Error sending message:", error);
      return false;
    }
  }
  /**
   * Send a message via WhatsApp Business API (legacy plain text - for fallback only)
   */
  async sendWhatsAppMessage(phoneNumber, content) {
    console.log("[WhatsApp] Attempting to send message...");
    console.log("[WhatsApp] Has Access Token:", !!WHATSAPP_ACCESS_TOKEN);
    console.log("[WhatsApp] Has Phone Number ID:", !!WHATSAPP_PHONE_NUMBER_ID);
    console.log("[WhatsApp] API URL:", WHATSAPP_API_URL);
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("[WhatsApp] Credentials not configured - missing token or phone number ID");
      return false;
    }
    let actualRecipient = phoneNumber;
    if (TESTING_MODE) {
      actualRecipient = TEST_PHONE_NUMBERS[testNumberIndex % TEST_PHONE_NUMBERS.length];
      testNumberIndex++;
      console.log(`[TESTING MODE] Redirecting WhatsApp from ${phoneNumber} to test number: ${actualRecipient}`);
      content = `[TEST MESSAGE]
Original recipient: ${phoneNumber}

${content}`;
    }
    const cleanedNumber = actualRecipient.replace(/[^0-9]/g, "");
    if (!cleanedNumber || cleanedNumber.length < 8) {
      console.error("[WhatsApp] Invalid phone number:", actualRecipient);
      return false;
    }
    try {
      const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      console.log("[WhatsApp] Sending to URL:", url);
      console.log("[WhatsApp] Recipient (original):", phoneNumber);
      console.log("[WhatsApp] Recipient (cleaned):", cleanedNumber);
      console.log("[WhatsApp] Actual recipient:", actualRecipient);
      const payload = {
        messaging_product: "whatsapp",
        to: cleanedNumber,
        // Use cleaned number without dashes
        type: "text",
        text: { body: content }
      };
      console.log("[WhatsApp] Request payload:", JSON.stringify(payload, null, 2));
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("[WhatsApp] Response status:", response.status);
      if (!response.ok) {
        const error = await response.text();
        console.error("[WhatsApp] API error response:", error);
        try {
          const errorJson = JSON.parse(error);
          console.error("[WhatsApp] Parsed error:", JSON.stringify(errorJson, null, 2));
        } catch (e) {
        }
        return false;
      }
      const result = await response.json();
      console.log("[WhatsApp] Message sent successfully!");
      console.log("[WhatsApp] API Response:", JSON.stringify(result, null, 2));
      console.log("[WhatsApp] Message ID:", result.messages?.[0]?.id);
      console.log("[WhatsApp] WhatsApp ID:", result.contacts?.[0]?.wa_id);
      return true;
    } catch (error) {
      console.error("[WhatsApp] Error sending message:", error);
      return false;
    }
  }
  /**
   * Send an email (fallback method) using Gmail
   */
  async sendEmail(to, subject, content) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error("Invalid email address:", to);
      return false;
    }
    try {
      return await sendGmailEmail(to, subject, content, EMAIL_FROM);
    } catch (error) {
      console.error("[EMAIL] Gmail send error:", error);
      return false;
    }
  }
  /**
   * Send a LINE message using LINE Messaging API
   */
  async sendLineMessage(lineUserId, content) {
    console.log("[LINE] Attempting to send message...");
    console.log("[LINE] Has Access Token:", !!LINE_CHANNEL_ACCESS_TOKEN);
    console.log("[LINE] Has Channel Secret:", !!LINE_CHANNEL_SECRET);
    if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_CHANNEL_SECRET) {
      console.error("[LINE] Credentials not configured - missing token or secret");
      return false;
    }
    if (!lineUserId || lineUserId.trim().length === 0) {
      console.error("[LINE] Invalid LINE user ID:", lineUserId);
      return false;
    }
    try {
      const lineClient = new LineClient({
        channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: LINE_CHANNEL_SECRET
      });
      await lineClient.pushMessage(lineUserId, {
        type: "text",
        text: content
      });
      console.log("[LINE] Message sent successfully!");
      console.log("[LINE] Recipient User ID:", lineUserId);
      return true;
    } catch (error) {
      console.error("[LINE] Error sending message:", error);
      return false;
    }
  }
  /**
   * Send a message with automatic fallback
   */
  async sendMessage(options) {
    const { emergencyRequestId, hospitalId, recipient, messageType, content } = options;
    const message = await storage.createMessage({
      emergencyRequestId,
      hospitalId,
      recipient,
      messageType,
      content,
      status: "queued"
    });
    await this.processMessage(message.id);
    return message;
  }
  /**
   * Process a queued message
   */
  async processMessage(messageId) {
    const message = await storage.getMessage(messageId);
    if (!message) {
      console.error("Message not found:", messageId);
      return;
    }
    if (message.status !== "queued" && message.retryCount >= MAX_RETRIES) {
      return;
    }
    try {
      let success = false;
      if (message.messageType === "whatsapp") {
        if (message.content.startsWith("[Template: ")) {
          const templateMatch = message.content.match(/\[Template: ([^\]]+)\]/);
          if (templateMatch) {
            const templateName = templateMatch[1];
            const emergencyRequestId = message.emergencyRequestId;
            const templateData = await this.buildTemplateMessage(emergencyRequestId);
            if (templateData && templateData.templateName === templateName) {
              success = await this.sendWhatsAppTemplateMessage(
                message.recipient,
                templateData.templateName,
                templateData.variables
              );
            } else {
              console.error("[Process Message] Failed to rebuild template data");
              success = false;
            }
          }
        } else {
          success = await this.sendWhatsAppMessage(message.recipient, message.content);
        }
        if (!success) {
          console.log("WhatsApp failed, trying email fallback...");
          const hospital = await storage.getHospital(message.hospitalId);
          if (hospital?.email) {
            const emailSuccess = await this.sendEmail(
              hospital.email,
              "Emergency Pet Request",
              message.content.replace(/\[Template: [^\]]+\]\s*/, "")
              // Remove template prefix for email
            );
            if (emailSuccess) {
              await storage.updateMessage(messageId, {
                messageType: "email",
                recipient: hospital.email,
                status: "sent",
                sentAt: /* @__PURE__ */ new Date()
              });
              return;
            }
          }
        }
      } else if (message.messageType === "email") {
        success = await this.sendEmail(message.recipient, "Emergency Pet Request", message.content);
      } else if (message.messageType === "line") {
        const cleanContent = message.content.replace(/\[Template: [^\]]+\]\s*/, "");
        success = await this.sendLineMessage(message.recipient, cleanContent);
      }
      if (success) {
        await storage.updateMessage(messageId, {
          status: "sent",
          sentAt: /* @__PURE__ */ new Date()
        });
      } else {
        const newRetryCount = message.retryCount + 1;
        if (newRetryCount >= MAX_RETRIES) {
          await storage.updateMessage(messageId, {
            status: "failed",
            failedAt: /* @__PURE__ */ new Date(),
            errorMessage: "Max retries exceeded",
            retryCount: newRetryCount
          });
        } else {
          await storage.updateMessage(messageId, {
            retryCount: newRetryCount
          });
          setTimeout(() => {
            this.processMessage(messageId);
          }, RETRY_DELAY_MS * newRetryCount);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const newRetryCount = message.retryCount + 1;
      await storage.updateMessage(messageId, {
        status: newRetryCount >= MAX_RETRIES ? "failed" : "queued",
        failedAt: newRetryCount >= MAX_RETRIES ? /* @__PURE__ */ new Date() : null,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        retryCount: newRetryCount
      });
      if (newRetryCount < MAX_RETRIES) {
        setTimeout(() => {
          this.processMessage(messageId);
        }, RETRY_DELAY_MS * newRetryCount);
      }
    }
  }
  /**
   * Process all queued messages (for background job)
   */
  async processQueue() {
    const queuedMessages = await storage.getQueuedMessages();
    for (const message of queuedMessages) {
      await this.processMessage(message.id);
    }
  }
  /**
   * Build WhatsApp template message based on emergency request data
   */
  async buildTemplateMessage(emergencyRequestId, language = "en") {
    const emergencyRequest = await storage.getEmergencyRequest(emergencyRequestId);
    if (!emergencyRequest) {
      console.error("[Template Builder] Emergency request not found:", emergencyRequestId);
      return null;
    }
    let pet = null;
    if (emergencyRequest.petId) {
      pet = await storage.getPet(emergencyRequest.petId);
    }
    let user = null;
    if (emergencyRequest.userId) {
      user = await storage.getUser(emergencyRequest.userId);
    }
    const userLanguage = user?.languagePreference || language || "en";
    const isZhHk = userLanguage === "zh-HK";
    const langSuffix = isZhHk ? "_zh_hk" : "_en";
    let templateName;
    let variables = [];
    let fallbackText = "";
    if (pet && pet.lastVisitHospitalId) {
      templateName = `emergency_pet_alert_full${langSuffix}`;
      const lastHospital = await storage.getHospital(pet.lastVisitHospitalId);
      const lastHospitalName = lastHospital ? isZhHk && lastHospital.nameZh ? lastHospital.nameZh : lastHospital.name : isZhHk ? "\u4E0D\u8A73" : "Unknown";
      variables = [
        lastHospitalName,
        // {{1}} Last visited hospital
        pet.name || (isZhHk ? "\u672A\u547D\u540D" : "Unnamed"),
        // {{2}} Pet name
        emergencyRequest.petSpecies || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{3}} Species
        emergencyRequest.petBreed || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{4}} Breed
        emergencyRequest.petAge ? `${emergencyRequest.petAge} ${isZhHk ? "\u6B72" : "years"}` : isZhHk ? "\u4E0D\u8A73" : "Unknown",
        // {{5}} Age
        pet.weight ? `${pet.weight}${isZhHk ? "\u516C\u65A4" : "kg"}` : isZhHk ? "\u4E0D\u8A73" : "Unknown",
        // {{6}} Weight
        emergencyRequest.symptom || (isZhHk ? "\u7DCA\u6025\u60C5\u6CC1" : "Emergency situation"),
        // {{7}} Critical symptom
        pet.medicalNotes || (isZhHk ? "\u7121" : "None"),
        // {{8}} Medical notes
        emergencyRequest.manualLocation || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{9}} Location
        emergencyRequest.contactName || (isZhHk ? "\u5BF5\u7269\u4E3B\u4EBA" : "Pet Owner"),
        // {{10}} Owner name
        emergencyRequest.contactPhone || (isZhHk ? "\u4E0D\u8A73" : "Unknown")
        // {{11}} Owner phone
      ];
      fallbackText = `\u{1F6A8} ${isZhHk ? "\u7DCA\u6025\u5BF5\u7269\u6C42\u52A9" : "EMERGENCY PET ALERT"}

${isZhHk ? "\u5DF2\u767B\u8A18\u5BF5\u7269\uFF08\u6709\u91AB\u7642\u8A18\u9304\uFF09" : "REGISTERED PET WITH MEDICAL HISTORY"}
${isZhHk ? "\u540D\u7A31" : "Name"}: ${variables[1]}
${isZhHk ? "\u7269\u7A2E" : "Species"}: ${variables[2]}
${isZhHk ? "\u7DCA\u6025\u75C7\u72C0" : "Emergency"}: ${variables[6]}
${isZhHk ? "\u806F\u7D61" : "Contact"}: ${variables[9]} (${variables[10]})`;
    } else if (pet) {
      templateName = `emergency_pet_alert_new${langSuffix}`;
      variables = [
        pet.name || (isZhHk ? "\u672A\u547D\u540D" : "Unnamed"),
        // {{1}} Pet name
        emergencyRequest.petSpecies || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{2}} Species
        emergencyRequest.petBreed || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{3}} Breed
        emergencyRequest.petAge ? `${emergencyRequest.petAge} ${isZhHk ? "\u6B72" : "years"}` : isZhHk ? "\u4E0D\u8A73" : "Unknown",
        // {{4}} Age
        pet.weight ? `${pet.weight}${isZhHk ? "\u516C\u65A4" : "kg"}` : isZhHk ? "\u4E0D\u8A73" : "Unknown",
        // {{5}} Weight
        emergencyRequest.symptom || (isZhHk ? "\u7DCA\u6025\u60C5\u6CC1" : "Emergency situation"),
        // {{6}} Critical symptom
        pet.medicalNotes || (isZhHk ? "\u7121" : "None"),
        // {{7}} Medical notes
        emergencyRequest.manualLocation || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{8}} Location
        emergencyRequest.contactName || (isZhHk ? "\u5BF5\u7269\u4E3B\u4EBA" : "Pet Owner"),
        // {{9}} Owner name
        emergencyRequest.contactPhone || (isZhHk ? "\u4E0D\u8A73" : "Unknown")
        // {{10}} Owner phone
      ];
      fallbackText = `\u{1F6A8} ${isZhHk ? "\u7DCA\u6025\u5BF5\u7269\u6C42\u52A9" : "EMERGENCY PET ALERT"}

${isZhHk ? "\u540D\u7A31" : "Name"}: ${variables[0]}
${isZhHk ? "\u7269\u7A2E" : "Species"}: ${variables[1]}
${isZhHk ? "\u7DCA\u6025\u75C7\u72C0" : "Emergency"}: ${variables[5]}
${isZhHk ? "\u806F\u7D61" : "Contact"}: ${variables[8]} (${variables[9]})`;
    } else {
      templateName = `emergency_pet_alert_basic${langSuffix}`;
      variables = [
        emergencyRequest.petSpecies || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{1}} Species
        emergencyRequest.petBreed || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{2}} Breed
        emergencyRequest.petAge ? `${emergencyRequest.petAge} ${isZhHk ? "\u6B72" : "years"}` : isZhHk ? "\u4E0D\u8A73" : "Unknown",
        // {{3}} Age
        emergencyRequest.symptom || (isZhHk ? "\u7DCA\u6025\u60C5\u6CC1" : "Emergency situation"),
        // {{4}} Critical symptom
        emergencyRequest.manualLocation || (isZhHk ? "\u4E0D\u8A73" : "Unknown"),
        // {{5}} Location
        emergencyRequest.contactName || (isZhHk ? "\u5BF5\u7269\u4E3B\u4EBA" : "Pet Owner"),
        // {{6}} Owner name
        emergencyRequest.contactPhone || (isZhHk ? "\u4E0D\u8A73" : "Unknown")
        // {{7}} Owner phone
      ];
      fallbackText = `\u{1F6A8} ${isZhHk ? "\u7DCA\u6025\u5BF5\u7269\u6C42\u52A9" : "EMERGENCY PET ALERT"}

${isZhHk ? "\u7269\u7A2E" : "Species"}: ${variables[0]}
${isZhHk ? "\u7DCA\u6025\u75C7\u72C0" : "Emergency"}: ${variables[3]}
${isZhHk ? "\u806F\u7D61" : "Contact"}: ${variables[5]} (${variables[6]})`;
    }
    console.log("[Template Builder] Selected template:", templateName);
    console.log("[Template Builder] Variables count:", variables.length);
    return { templateName, variables, fallbackText };
  }
  /**
   * Broadcast emergency to multiple hospitals
   */
  async broadcastEmergency(emergencyRequestId, hospitalIds, message) {
    const messages2 = [];
    const templateData = await this.buildTemplateMessage(emergencyRequestId);
    if (!templateData) {
      console.error("[Broadcast] Failed to build template message");
      throw new Error("Failed to build emergency message template");
    }
    const { templateName, variables, fallbackText } = templateData;
    for (const hospitalId of hospitalIds) {
      const hospital = await storage.getHospital(hospitalId);
      if (!hospital) {
        console.warn(`Hospital not found: ${hospitalId}`);
        continue;
      }
      let messageType;
      let recipient;
      let contentToStore;
      if (hospital.lineUserId) {
        messageType = "line";
        recipient = hospital.lineUserId;
        contentToStore = fallbackText;
      } else if (hospital.whatsapp) {
        messageType = "whatsapp";
        recipient = hospital.whatsapp;
        contentToStore = `[Template: ${templateName}] ${fallbackText}`;
      } else if (hospital.email) {
        messageType = "email";
        recipient = hospital.email;
        contentToStore = fallbackText;
      } else {
        console.warn(`No valid contact method (LINE, WhatsApp or Email) for hospital ${hospitalId}`);
        await storage.createMessage({
          emergencyRequestId,
          hospitalId,
          recipient: hospital.phone || "unknown",
          messageType: "whatsapp",
          content: fallbackText,
          status: "failed",
          errorMessage: "No valid LINE, WhatsApp or Email contact available",
          failedAt: /* @__PURE__ */ new Date()
        });
        continue;
      }
      const msg = await storage.createMessage({
        emergencyRequestId,
        hospitalId,
        recipient,
        messageType,
        content: contentToStore,
        status: "queued"
      });
      await this.processMessage(msg.id);
      const updatedMsg = await storage.getMessage(msg.id);
      if (updatedMsg) {
        messages2.push(updatedMsg);
      }
    }
    return messages2;
  }
};
var messagingService = new MessagingService();
setInterval(() => {
  messagingService.processQueue().catch(console.error);
}, 3e4);

// server/auth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";

// server/config.ts
function getEnvironment() {
  const env = process.env.NODE_ENV?.toLowerCase() || "development";
  if (env === "production" || env === "prod") return "production";
  if (env === "staging" || env === "stage") return "staging";
  return "development";
}
function validateEnvironmentVariables(env) {
  if (env === "development") {
    return;
  }
  const required = [];
  const missing = [];
  if (env === "production" || env === "staging") {
    required.push("DATABASE_URL", "SESSION_SECRET");
  }
  required.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(", ")}`;
    console.error(`[Config Error] ${message}`);
    throw new Error(message);
  }
  console.log("[Config] All required environment variables are set");
}
function loadConfig() {
  const env = getEnvironment();
  const isDevelopment = env === "development";
  const isStaging = env === "staging";
  const isProduction = env === "production";
  validateEnvironmentVariables(env);
  if (isDevelopment) {
    if (!process.env.DATABASE_URL) {
      console.warn("[Config] DATABASE_URL not set - database features will not work");
    }
    if (!process.env.REPLIT_DOMAINS && !process.env.PRODUCTION_URL) {
      console.warn("[Config] Neither REPLIT_DOMAINS nor PRODUCTION_URL set - authentication may not work correctly");
    }
    if (!process.env.SESSION_SECRET) {
      console.warn("[Config] SESSION_SECRET not set - using default (insecure for production)");
    }
  } else {
    const requiredVars = ["DATABASE_URL", "SESSION_SECRET"];
    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for ${env}: ${missing.join(", ")}`);
    }
    if (!process.env.REPLIT_DOMAINS && !process.env.PRODUCTION_URL) {
      console.warn("[Config] Neither REPLIT_DOMAINS nor PRODUCTION_URL set - Google OAuth may not work");
    }
  }
  const config2 = {
    env,
    port: parseInt(process.env.PORT || "5000", 10),
    isDevelopment,
    isStaging,
    isProduction,
    database: {
      // Use empty string in development if not set, otherwise it's guaranteed to exist
      url: process.env.DATABASE_URL || (isDevelopment ? "" : process.env.DATABASE_URL)
    },
    session: {
      secret: process.env.SESSION_SECRET || (isDevelopment ? "dev-secret-change-in-production" : process.env.SESSION_SECRET),
      secure: isProduction || isStaging,
      // HTTPS only in staging/production
      maxAge: isProduction ? 7 * 24 * 60 * 60 * 1e3 : 30 * 24 * 60 * 60 * 1e3
      // 7 days prod, 30 days dev
    },
    auth: {
      // REPLIT_DOMAINS is now optional - if not set, app uses PRODUCTION_URL for Google OAuth
      replitDomains: process.env.REPLIT_DOMAINS || ""
    },
    rateLimit: {
      enabled: !isDevelopment,
      // Disable in development for easier testing
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      maxRequests: isProduction ? 100 : 1e3
      // Stricter in production
    },
    monitoring: {
      sentryDsn: process.env.SENTRY_DSN,
      sentryTracesSampleRate: isProduction ? 0.1 : 1,
      sentryEnv: env
    },
    logging: {
      level: isDevelopment ? "debug" : isProduction ? "warn" : "info"
    },
    regional: {
      defaultCountry: process.env.DEFAULT_COUNTRY || "HK",
      defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || "+852",
      defaultLanguage: process.env.DEFAULT_LANGUAGE || "zh-HK"
    }
  };
  console.log(`[Config] Environment: ${env}`);
  console.log(`[Config] Port: ${config2.port}`);
  console.log(`[Config] Rate limiting: ${config2.rateLimit.enabled ? "enabled" : "disabled"}`);
  console.log(`[Config] Session secure cookies: ${config2.session.secure}`);
  console.log(`[Config] Sentry monitoring: ${config2.monitoring.sentryDsn ? "enabled" : "disabled"}`);
  console.log(`[Config] Regional defaults: ${config2.regional.defaultCountry} (${config2.regional.defaultCountryCode}), Language: ${config2.regional.defaultLanguage}`);
  return config2;
}
var config = loadConfig();

// server/auth.ts
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, password, ...sanitized } = user;
  return sanitized;
}
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var BASE_URL = process.env.PRODUCTION_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost:5000");
function getSession() {
  let sessionStore;
  if (config.database.url) {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: config.database.url,
      createTableIfMissing: false,
      ttl: config.session.maxAge,
      tableName: "sessions"
    });
  } else if (config.isDevelopment) {
    console.warn("[Session] Using in-memory session store - sessions will not persist across restarts");
  }
  return session({
    secret: config.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.session.secure,
      maxAge: config.session.maxAge
    }
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${BASE_URL}/api/auth/google/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }
            let user = await storage.getUserByEmail(email);
            if (!user) {
              user = await storage.createUser({
                email,
                name: profile.displayName || profile.name?.givenName || "",
                profileImageUrl: profile.photos?.[0]?.value,
                role: "user"
              });
            }
            done(null, user);
          } catch (error) {
            done(error);
          }
        }
      )
    );
    app2.get(
      "/api/auth/google",
      (req, res, next) => {
        if (!req.session) {
          console.error("[Auth] Session not available at Google OAuth start");
          return res.redirect("/login?error=session_failed");
        }
        const returnTo = req.query.returnTo;
        if (returnTo && returnTo.startsWith("/")) {
          req.session.returnTo = returnTo;
        }
        next();
      },
      passport.authenticate("google", { scope: ["profile", "email"] })
    );
    app2.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        if (!req.session) {
          console.error("[Auth] Session not available after Google OAuth");
          return res.redirect("/login?error=session_failed");
        }
        const returnTo = req.session.returnTo || "/profile";
        delete req.session.returnTo;
        req.session.save((err) => {
          if (err) {
            console.error("[Auth] Session save error:", err);
            return res.redirect("/login?error=session_save_failed");
          }
          res.redirect(returnTo);
        });
      }
    );
  } else {
    console.warn("[Auth] Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
  }
  passport.use(
    new LocalStrategy(
      { usernameField: "identifier", passwordField: "password", passReqToCallback: true },
      async (req, identifier, password, done) => {
        try {
          let user;
          const isPhone = identifier?.startsWith("+");
          if (isPhone) {
            user = await storage.getUserByPhone(identifier);
          } else {
            user = await storage.getUserByEmail(identifier);
          }
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid credentials" });
          }
          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid credentials" });
          }
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
  app2.post("/api/auth/login", (req, res, next) => {
    const { email, phone, countryCode } = req.body;
    const identifier = phone && countryCode ? `${countryCode}${phone}` : email;
    req.body.identifier = identifier;
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err2) => {
        if (err2) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ success: true, user: sanitizeUser(user) });
      });
    })(req, res, next);
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, phone, countryCode, password, name } = req.body;
      if (!email && !phone || !password) {
        return res.status(400).json({ message: "Email or phone number, and password are required" });
      }
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      const fullPhone = phone && countryCode ? `${countryCode}${phone}` : phone;
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }
      if (fullPhone) {
        const existingUser = await storage.getUserByPhone(fullPhone);
        if (existingUser) {
          return res.status(400).json({ message: "Phone number already registered" });
        }
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email: email || null,
        phone: fullPhone || null,
        passwordHash,
        name: name || "",
        role: "user"
      });
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        return res.json({ success: true, user: sanitizeUser(user) });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(sanitizeUser(req.user));
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
}
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
var isAdmin = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user;
  if (user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

// server/testUtils.ts
function setupTestUtils(app2) {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  app2.post("/api/test/auth/session", async (req, res) => {
    try {
      const { sub, email, name, role } = req.body;
      await storage.upsertUser({
        id: sub,
        email: email || `test-${sub}@test.com`,
        name: name || "Test User",
        profileImageUrl: null
      });
      if (role === "admin") {
        await storage.updateUser(sub, { role: "admin" });
      }
      req.session.passport = {
        user: sub
        // Just the user ID, not the full OIDC claims object
      };
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(void 0);
        });
      });
      res.json({ success: true, userId: sub });
    } catch (error) {
      console.error("Test auth error:", error);
      res.status(500).json({ error: "Failed to create test session" });
    }
  });
  app2.post("/api/test/clinics", async (req, res) => {
    try {
      const clinic = await storage.createClinic(req.body);
      res.status(201).json(clinic);
    } catch (error) {
      console.error("Test clinic creation error:", error);
      res.status(500).json({ error: "Failed to create test clinic" });
    }
  });
  app2.post("/api/test/assign-staff", async (req, res) => {
    try {
      const { userId, clinicId } = req.body;
      await storage.updateUser(userId, { clinicId });
      res.json({ success: true });
    } catch (error) {
      console.error("Test staff assignment error:", error);
      res.status(500).json({ error: "Failed to assign staff" });
    }
  });
  app2.post("/api/test/make-admin", async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.updateUser(userId, { role: "admin" });
      res.json({ success: true });
    } catch (error) {
      console.error("Test admin assignment error:", error);
      res.status(500).json({ error: "Failed to make user admin" });
    }
  });
}

// server/routes.ts
init_schema();
import { eq as eq2 } from "drizzle-orm";
import rateLimit2 from "express-rate-limit";

// server/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
var generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.floor(config.rateLimit.windowMs / 1e3)
  },
  standardHeaders: true,
  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  // Disable the `X-RateLimit-*` headers
  skip: () => !config.rateLimit.enabled,
  // Skip rate limiting if disabled
  skipSuccessfulRequests: false
  // Count all requests
});
var strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many attempts. Please try again later.",
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  // Skip rate limiting if disabled
  skipSuccessfulRequests: false
});
var broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 10,
  // Limit each IP to 10 broadcasts per hour
  message: {
    error: "Too many emergency broadcasts. Please wait before sending another alert.",
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  // Skip rate limiting if disabled
  skipSuccessfulRequests: false
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  // Limit each IP to 10 login attempts per windowMs
  message: {
    error: "Too many login attempts. Please try again later.",
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  // Skip rate limiting if disabled
  skipSuccessfulRequests: false
});
var exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 3,
  // Limit each IP to 3 exports per hour
  message: {
    error: "Too many data export requests. Please try again later.",
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  // Skip rate limiting if disabled
  skipSuccessfulRequests: false
});
var deletionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1e3,
  // 24 hours
  max: 1,
  // Limit each IP to 1 deletion per day
  message: {
    error: "Account deletion limit reached. Please contact support if you need assistance.",
    retryAfter: 86400
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  // Skip rate limiting if disabled
  skipSuccessfulRequests: false
});

// server/services/deepseek.ts
var DeepSeekService = class {
  apiKey;
  apiUrl = "https://api.deepseek.com/v1/chat/completions";
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || "";
    if (!this.apiKey) {
      console.warn("\u26A0\uFE0F DEEPSEEK_API_KEY not set - AI analysis will use fallback keyword detection");
    }
  }
  /**
   * Check if DeepSeek API is configured
   */
  isAvailable() {
    return !!this.apiKey;
  }
  /**
   * Analyze voice transcript using DeepSeek AI
   */
  async analyzeVoiceTranscript(transcript, language = "en") {
    if (!this.isAvailable()) {
      throw new Error("DeepSeek API key not configured");
    }
    try {
      const systemPrompt = this.buildSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(transcript, language);
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          // Lower temperature for more consistent medical analysis
          max_tokens: 500,
          response_format: { type: "json_object" }
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from DeepSeek API");
      }
      const analysis = JSON.parse(content);
      return {
        severity: analysis.severity || "general",
        confidence: analysis.confidence || 0.5,
        primarySymptoms: analysis.primarySymptoms || [],
        summary: analysis.summary || "Emergency situation detected",
        detectedKeywords: analysis.detectedKeywords || [],
        language: analysis.language || language,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("DeepSeek analysis error:", error);
      throw error;
    }
  }
  /**
   * Build system prompt for DeepSeek
   */
  buildSystemPrompt(language) {
    return `You are a veterinary triage assistant analyzing pet emergency descriptions.

Your task:
1. Analyze the pet owner's description of their emergency
2. Identify symptoms and their severity
3. Categorize the emergency level
4. Extract key information for veterinary clinics

Categories of symptoms:
- Critical: Life-threatening (unconscious, not breathing, severe bleeding, poisoning, trauma)
- Urgent: Serious but stable (difficulty breathing, seizures, severe pain, acute injury)
- Moderate: Concerning but not immediately life-threatening (vomiting, diarrhea, limping)
- General: Non-specific emergency

Return ONLY a JSON object with this exact structure:
{
  "severity": "critical" | "urgent" | "moderate" | "general",
  "confidence": 0.0-1.0,
  "primarySymptoms": [
    {
      "symptom": "difficulty breathing",
      "category": "breathing",
      "bodyPart": "respiratory system"
    }
  ],
  "summary": "Brief description (max 50 words) suitable for emergency broadcast",
  "detectedKeywords": ["keyword1", "keyword2"],
  "language": "${language}"
}

Be concise, accurate, and prioritize life-threatening conditions.`;
  }
  /**
   * Build user prompt for DeepSeek
   */
  buildUserPrompt(transcript, language) {
    const langNote = language === "zh-HK" || language === "zh" ? " (Note: This may be in Cantonese or mixed Cantonese/English)" : language === "zh-CN" ? " (Note: This may be in Mandarin Chinese)" : "";
    return `Analyze this pet emergency description${langNote}:

"${transcript}"

Provide JSON analysis with severity, symptoms, and a brief summary for veterinary clinics.`;
  }
  /**
   * Generate broadcast-ready message from analysis
   */
  formatForBroadcast(analysis, transcript) {
    const severityEmoji = {
      critical: "\u{1F534}",
      urgent: "\u26A0\uFE0F",
      moderate: "\u{1F7E1}",
      general: "\u2139\uFE0F"
    };
    const emoji = severityEmoji[analysis.severity];
    const confidencePercent = Math.round(analysis.confidence * 100);
    let message = `${emoji} AI EMERGENCY ANALYSIS
`;
    message += `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;
    message += `Severity: ${analysis.severity.toUpperCase()}
`;
    message += `Confidence: ${confidencePercent}%

`;
    if (analysis.primarySymptoms.length > 0) {
      message += `Primary Concerns:
`;
      analysis.primarySymptoms.forEach((symptom) => {
        message += `  \u2022 ${symptom.symptom}`;
        if (symptom.bodyPart) {
          message += ` (${symptom.bodyPart})`;
        }
        message += `
`;
      });
      message += `
`;
    }
    message += `Summary:
${analysis.summary}

`;
    message += `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;
    message += `\u{1F3A4} OWNER'S DESCRIPTION
`;
    message += `\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;
    message += `"${transcript}"

`;
    message += `Analyzed: ${new Date(analysis.timestamp).toLocaleString()}
`;
    return message;
  }
};
var deepseekService = new DeepSeekService();

// server/routes.ts
init_schema();
import path from "path";
async function registerRoutes(app2) {
  await setupAuth(app2);
  setupTestUtils(app2);
  app2.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  });
  const publicDir = config.isDevelopment ? path.resolve(import.meta.dirname, "../client/public") : path.resolve(import.meta.dirname, "public");
  app2.get("/sitemap.xml", (req, res) => {
    res.set({
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.removeHeader("ETag");
    res.sendFile("sitemap.xml", {
      root: publicDir,
      etag: false,
      lastModified: false
    });
  });
  app2.get("/sitemap-2025.xml", (req, res) => {
    res.set({
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.removeHeader("ETag");
    res.sendFile("sitemap-2025.xml", {
      root: publicDir,
      etag: false,
      lastModified: false
    });
  });
  app2.get("/sitemap-oct29.xml", (req, res) => {
    res.set({
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Robots-Tag": "noindex"
    });
    res.removeHeader("ETag");
    res.sendFile("sitemap-oct29.xml", {
      root: publicDir,
      etag: false,
      lastModified: false
    });
  });
  app2.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.sendFile("robots.txt", { root: publicDir });
  });
  app2.get("/api/test", (req, res) => {
    res.json({ message: "API is working!" });
  });
  app2.use("/api/", generalLimiter);
  app2.get("/api/users/export", exportLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const exportData = await storage.exportUserData(userId);
      const sanitizedExportData = {
        ...exportData,
        user: sanitizeUser(exportData.user)
      };
      await storage.createAuditLog({
        entityType: "user",
        entityId: userId,
        action: "export_data",
        userId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      const filename = `petsos-data-export-${userId}-${(/* @__PURE__ */ new Date()).toISOString()}.json`;
      res.status(200).set({
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }).send(JSON.stringify(sanitizedExportData, null, 2));
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });
  app2.delete("/api/users/gdpr-delete", deletionLimiter, isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      await storage.createAuditLog({
        entityType: "user",
        entityId: userId,
        action: "gdpr_delete_request",
        userId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      const result = await storage.deleteUserDataGDPR(userId);
      if (!result.success) {
        return res.status(404).json({ message: "User not found" });
      }
      req.session.destroy((err) => {
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
  app2.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.id;
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (requestingUserId !== targetUserId && requestingUser.role !== "admin") {
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
  app2.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.id;
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (requestingUserId !== targetUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only update your own profile" });
      }
      let updateData;
      if (requestingUser.role === "admin") {
        updateData = insertUserSchema.partial().parse(req.body);
      } else {
        const safeUpdateSchema = insertUserSchema.omit({ role: true, clinicId: true }).partial();
        updateData = safeUpdateSchema.parse(req.body);
      }
      const user = await storage.updateUser(targetUserId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.createAuditLog({
        entityType: "user",
        entityId: user.id,
        action: "update",
        userId: requestingUserId,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(sanitizeUser(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.delete("/api/users/:id", strictLimiter, isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.id;
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (requestingUserId !== targetUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only delete your own account" });
      }
      const success = await storage.deleteUser(targetUserId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.createAuditLog({
        entityType: "user",
        entityId: targetUserId,
        action: "delete",
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const sanitizedUsers = users2.map(sanitizeUser);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/admin/pets", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const pets2 = await storage.getAllPets();
      res.json(pets2);
    } catch (error) {
      console.error("Error fetching all pets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/pets", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.userId;
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (requestingUserId !== targetUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only view your own pets" });
      }
      const pets2 = await storage.getPetsByUserId(targetUserId);
      res.json(pets2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/pets", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const petData = insertPetSchema.parse(req.body);
      if (petData.userId !== requestingUserId) {
        return res.status(403).json({ message: "Forbidden - You can only create pets for yourself" });
      }
      const pet = await storage.createPet(petData);
      await storage.createAuditLog({
        entityType: "pet",
        entityId: pet.id,
        action: "create",
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(pet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/pets/:id", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (pet.userId !== requestingUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only view your own pets" });
      }
      res.json(pet);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/pets/:id", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (pet.userId !== requestingUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only update your own pets" });
      }
      const updateData = insertPetSchema.partial().parse(req.body);
      const updatedPet = await storage.updatePet(req.params.id, updateData);
      await storage.createAuditLog({
        entityType: "pet",
        entityId: pet.id,
        action: "update",
        userId: requestingUserId,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(updatedPet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Pet update error:", error);
      res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.delete("/api/pets/:id", strictLimiter, isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (pet.userId !== requestingUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only delete your own pets" });
      }
      const success = await storage.deletePet(req.params.id);
      await storage.createAuditLog({
        entityType: "pet",
        entityId: req.params.id,
        action: "delete",
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/regions", async (req, res) => {
    const regions2 = await storage.getAllRegions();
    res.json(regions2);
  });
  app2.get("/api/regions/code/:code", async (req, res) => {
    const region = await storage.getRegionByCode(req.params.code);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }
    res.json(region);
  });
  app2.post("/api/regions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const regionData = insertRegionSchema.parse(req.body);
      const region = await storage.createRegion(regionData);
      await storage.createAuditLog({
        entityType: "region",
        entityId: region.id,
        action: "create",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/regions/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const regionData = insertRegionSchema.partial().parse(req.body);
      const region = await storage.updateRegion(req.params.id, regionData);
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }
      await storage.createAuditLog({
        entityType: "region",
        entityId: region.id,
        action: "update",
        changes: regionData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(region);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/countries", async (req, res) => {
    const countries2 = await storage.getAllCountries();
    res.json(countries2);
  });
  app2.get("/api/countries/active", async (req, res) => {
    const countries2 = await storage.getActiveCountries();
    res.json(countries2);
  });
  app2.get("/api/countries/code/:code", async (req, res) => {
    const country = await storage.getCountryByCode(req.params.code);
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }
    res.json(country);
  });
  app2.get("/api/countries/:code/regions", async (req, res) => {
    const regions2 = await storage.getRegionsByCountry(req.params.code);
    res.json(regions2);
  });
  app2.post("/api/countries", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const countryData = insertCountrySchema.parse(req.body);
      const country = await storage.createCountry(countryData);
      await storage.createAuditLog({
        entityType: "country",
        entityId: country.id,
        action: "create",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(country);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/countries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const countryData = insertCountrySchema.partial().parse(req.body);
      const country = await storage.updateCountry(req.params.id, countryData);
      if (!country) {
        return res.status(404).json({ message: "Country not found" });
      }
      await storage.createAuditLog({
        entityType: "country",
        entityId: country.id,
        action: "update",
        changes: countryData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(country);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/countries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCountry(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Country not found" });
      }
      await storage.createAuditLog({
        entityType: "country",
        entityId: req.params.id,
        action: "delete",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/pet-breeds", async (req, res) => {
    const breeds = await storage.getAllPetBreeds();
    res.json(breeds);
  });
  app2.get("/api/pet-breeds/species/:species", async (req, res) => {
    const breeds = await storage.getPetBreedsBySpecies(req.params.species);
    res.json(breeds);
  });
  app2.get("/api/pet-breeds/common", async (req, res) => {
    const species = req.query.species;
    const breeds = await storage.getCommonPetBreeds(species);
    res.json(breeds);
  });
  app2.get("/api/pet-breeds/country/:countryCode", async (req, res) => {
    const breeds = await storage.getPetBreedsByCountry(req.params.countryCode);
    res.json(breeds);
  });
  app2.post("/api/pet-breeds", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const breedData = insertPetBreedSchema.parse(req.body);
      const breed = await storage.createPetBreed(breedData);
      await storage.createAuditLog({
        entityType: "pet_breed",
        entityId: breed.id,
        action: "create",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(breed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/pet-breeds/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const breedData = insertPetBreedSchema.partial().parse(req.body);
      const breed = await storage.updatePetBreed(req.params.id, breedData);
      if (!breed) {
        return res.status(404).json({ message: "Pet breed not found" });
      }
      await storage.createAuditLog({
        entityType: "pet_breed",
        entityId: breed.id,
        action: "update",
        changes: breedData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(breed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/pet-breeds/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deletePetBreed(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Pet breed not found" });
      }
      await storage.createAuditLog({
        entityType: "pet_breed",
        entityId: req.params.id,
        action: "delete",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const hospitalToClinicFormat = (h) => ({
    // Core identification
    id: h.id,
    slug: h.slug,
    // Names and addresses
    name: h.nameEn,
    nameZh: h.nameZh,
    address: h.addressEn,
    addressZh: h.addressZh,
    // Contact information
    phone: h.phone || "",
    whatsapp: h.whatsapp,
    email: h.email || null,
    websiteUrl: h.websiteUrl,
    // Location
    regionId: h.regionId,
    latitude: h.latitude ? parseFloat(h.latitude) : null,
    longitude: h.longitude ? parseFloat(h.longitude) : null,
    distance: h.distance,
    // Present only in nearby queries
    // Status and availability
    is24Hour: h.open247,
    status: h.isAvailable ? "active" : "inactive",
    isAvailable: h.isAvailable,
    liveStatus: h.liveStatus,
    // Partner and support flags
    isSupportHospital: h.isPartner,
    // Legacy field for backward compatibility
    services: [],
    // Hospitals use detailed service flags instead
    // Hospital indicator flags (for frontend migration period)
    isHospital: true,
    // Mark as hospital to distinguish from legacy clinics
    hospitalSlug: h.slug,
    // Frontend uses this to build /hospitals/:slug links
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
  app2.get("/api/clinics", async (req, res) => {
    try {
      const clinics2 = await storage.getAllClinics();
      res.json(clinics2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/clinics/region/:regionId", async (req, res) => {
    console.warn("[DEPRECATED] /api/clinics/region called - use /api/hospitals/region instead");
    const hospitals2 = await storage.getHospitalsByRegion(req.params.regionId);
    res.json(hospitals2.map(hospitalToClinicFormat));
  });
  app2.get("/api/clinics/24hour/:regionId", async (req, res) => {
    console.warn("[DEPRECATED] /api/clinics/24hour called - use /api/hospitals/region instead");
    const hospitals2 = await storage.getHospitalsByRegion(req.params.regionId);
    res.json(hospitals2.filter((h) => h.open247).map(hospitalToClinicFormat));
  });
  app2.get("/api/clinics/nearby", async (req, res) => {
    console.warn("[DEPRECATED] /api/clinics/nearby called - use /api/hospitals/nearby instead");
    try {
      const { latitude, longitude, radius } = z.object({
        latitude: z.string().transform(Number),
        longitude: z.string().transform(Number),
        radius: z.string().transform(Number).default("10000")
      }).parse(req.query);
      const hospitals2 = await storage.getNearbyHospitals(latitude, longitude, radius);
      res.json(hospitals2.map(hospitalToClinicFormat));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/clinics/:id", async (req, res) => {
    const clinic = await storage.getClinic(req.params.id);
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }
    res.json(clinic);
  });
  app2.post("/api/clinics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinicData = insertClinicSchema.parse(req.body);
      const clinic = await storage.createClinic(clinicData);
      await storage.createAuditLog({
        entityType: "clinic",
        entityId: clinic.id,
        action: "create",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(clinic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/clinics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }
      const updateData = insertClinicSchema.partial().parse(req.body);
      const updatedClinic = await storage.updateClinic(req.params.id, updateData);
      await storage.createAuditLog({
        entityType: "clinic",
        entityId: clinic.id,
        action: "update",
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(updatedClinic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/clinics/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteClinic(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Clinic not found" });
      }
      await storage.createAuditLog({
        entityType: "clinic",
        entityId: req.params.id,
        action: "delete",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/clinics/import", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { csvData } = z.object({
        csvData: z.string()
      }).parse(req.body);
      const lines = csvData.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must contain headers and at least one row" });
      }
      const headers = lines[0].split(",").map((h) => h.trim());
      const regions2 = await storage.getAllRegions();
      const imported = [];
      const errors = [];
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map((v) => v.trim());
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
          });
          const districtEn = row["District"] || row["District (English)"] || "";
          const regionId = regions2.find(
            (r) => r.nameEn?.toLowerCase().includes(districtEn.toLowerCase()) || r.nameZh?.includes(row["District"] || "")
          )?.id;
          if (!regionId) {
            errors.push(`Row ${i}: No matching region found for "${districtEn}"`);
            continue;
          }
          const clinicData = {
            name: row["Name of Vet Clinic (English)"] || row["Clinic Name (English)"] || "Unnamed",
            nameZh: row["\u7378\u91AB\u8A3A\u6240\u540D\u7A31 (Chinese)"] || row["Clinic Name (Chinese)"] || "\u672A\u547D\u540D",
            address: row["Address"] || row["Address (English)"] || "",
            addressZh: row["\u71DF\u696D\u5730\u5740"] || row["Address (Chinese)"] || "",
            phone: row["Call Phone Number"] || row["Phone"] || "",
            whatsapp: (row["WhatsApp Number"] || row["WhatsApp"] || "").replace(/[^\d+]/g, "") || void 0,
            email: row["Email"] || void 0,
            regionId,
            is24Hour: (row["24 hours"] || "").toLowerCase() === "y" || (row["24 hours"] || "").toLowerCase() === "yes",
            websiteUrl: row["Website"] || row["Website URL"] || void 0
          };
          const existing = (await storage.getAllClinics()).find(
            (c) => c.name?.toLowerCase() === clinicData.name.toLowerCase() && c.regionId === regionId
          );
          if (existing) {
            await storage.updateClinic(existing.id, clinicData);
            imported.push({ action: "updated", name: clinicData.name, id: existing.id });
          } else {
            const created = await storage.createClinic(clinicData);
            imported.push({ action: "created", name: clinicData.name, id: created.id });
          }
        } catch (error) {
          errors.push(`Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      await storage.createAuditLog({
        entityType: "clinic",
        entityId: "bulk-import",
        action: "import",
        changes: { imported: imported.length, errors: errors.length },
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ imported, errors, summary: { createdOrUpdated: imported.length, errors: errors.length } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/clinics/:id/staff", isAuthenticated, isAdmin, async (req, res) => {
    console.warn("[DEPRECATED] GET /api/clinics/:id/staff called - update to use hospital staff management");
    res.status(410).json({
      message: "This endpoint is deprecated. Clinic staff management should be updated to use hospitals.",
      deprecated: true
    });
  });
  app2.post("/api/clinics/:id/staff", isAuthenticated, isAdmin, async (req, res) => {
    console.warn("[DEPRECATED] POST /api/clinics/:id/staff called");
    res.status(410).json({
      message: "This endpoint is deprecated. Clinic staff management should be updated to use hospitals.",
      deprecated: true
    });
  });
  app2.delete("/api/clinics/:id/staff/:userId", isAuthenticated, isAdmin, async (req, res) => {
    console.warn("[DEPRECATED] DELETE /api/clinics/:id/staff/:userId called");
    res.status(410).json({
      message: "This endpoint is deprecated. Clinic staff management should be updated to use hospitals.",
      deprecated: true
    });
  });
  app2.post("/api/geocode", async (req, res) => {
    try {
      const { address } = z.object({
        address: z.string().min(1, "Address is required")
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
          formattedAddress: data.results[0].formatted_address
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
  app2.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals2 = await storage.getAllHospitals();
      res.json(hospitals2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/hospitals/region/:regionId", async (req, res) => {
    try {
      const hospitals2 = await storage.getHospitalsByRegion(req.params.regionId);
      res.json(hospitals2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/hospitals/slug/:slug", async (req, res) => {
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
  app2.get("/api/hospitals/:id", async (req, res) => {
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
  app2.post("/api/hospitals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalSchema: insertHospitalSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const hospitalData = insertHospitalSchema2.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
      await storage.createAuditLog({
        entityType: "hospital",
        entityId: hospital.id,
        action: "create",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/hospitals/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalSchema: insertHospitalSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      const updateData = insertHospitalSchema2.partial().parse(req.body);
      const updatedHospital = await storage.updateHospital(req.params.id, updateData);
      await storage.createAuditLog({
        entityType: "hospital",
        entityId: hospital.id,
        action: "update",
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(updatedHospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/hospitals/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteHospital(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      await storage.createAuditLog({
        entityType: "hospital",
        entityId: req.params.id,
        action: "delete",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/hospitals/:hospitalId/fees", async (req, res) => {
    try {
      const fees = await storage.getConsultFeesByHospitalId(req.params.hospitalId);
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/hospitals/:hospitalId/fees", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalConsultFeeSchema: insertHospitalConsultFeeSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const feeData = insertHospitalConsultFeeSchema2.parse({
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
  app2.patch("/api/hospitals/fees/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertHospitalConsultFeeSchema: insertHospitalConsultFeeSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const updateData = insertHospitalConsultFeeSchema2.partial().parse(req.body);
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
  app2.delete("/api/hospitals/fees/:id", isAuthenticated, isAdmin, async (req, res) => {
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
  app2.get("/api/hospitals/:hospitalId/updates", isAuthenticated, async (req, res) => {
    try {
      const updates = await storage.getHospitalUpdatesByHospitalId(req.params.hospitalId);
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/hospitals/:hospitalId/report", isAuthenticated, async (req, res) => {
    try {
      const sessionUser = req.user;
      const userId = sessionUser.id;
      const { insertHospitalUpdateSchema: insertHospitalUpdateSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const updateData = insertHospitalUpdateSchema2.parse({
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
  app2.patch("/api/hospitals/updates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const sessionUser = req.user;
      const userId = sessionUser.id;
      const { insertHospitalUpdateSchema: insertHospitalUpdateSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const updateData = insertHospitalUpdateSchema2.partial().extend({
        reviewedById: z.string().optional(),
        reviewedAt: z.date().optional()
      }).parse({
        ...req.body,
        reviewedById: userId,
        reviewedAt: /* @__PURE__ */ new Date()
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
  app2.get("/api/hospitals", async (req, res) => {
    try {
      const hospitals2 = await storage.getAllHospitals();
      res.json(hospitals2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/hospitals/region/:regionId", async (req, res) => {
    try {
      const hospitals2 = await storage.getHospitalsByRegion(req.params.regionId);
      res.json(hospitals2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/hospitals/nearby", async (req, res) => {
    try {
      const { latitude, longitude, radius } = z.object({
        latitude: z.string().transform(Number),
        longitude: z.string().transform(Number),
        radius: z.string().transform(Number).default("10000")
        // default 10km in meters
      }).parse(req.query);
      const hospitals2 = await storage.getNearbyHospitals(latitude, longitude, radius);
      res.json(hospitals2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/hospitals/:id", async (req, res) => {
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
  app2.get("/api/hospitals/:hospitalId/emergency-requests", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const hospitalId = req.params.hospitalId;
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized - Admin only" });
      }
      const requests = await storage.getEmergencyRequestsByClinicId(hospitalId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/emergency-requests", async (req, res) => {
    try {
      const emergencyRequestSchemaWithCoercion = insertEmergencyRequestSchema.extend({
        petAge: z.union([z.string(), z.null()]).optional()
      });
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
        status: req.body.status ?? "pending",
        regionId: req.body.regionId ?? null,
        voiceTranscript: req.body.voiceTranscript ?? null,
        aiAnalyzedSymptoms: req.body.aiAnalyzedSymptoms ?? null
      });
      const emergencyRequest = await storage.createEmergencyRequest(validatedData);
      await storage.createAuditLog({
        entityType: "emergency_request",
        entityId: emergencyRequest.id,
        action: "create",
        userId: emergencyRequest.userId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
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
  app2.get("/api/emergency-requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllEmergencyRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching emergency requests:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/emergency-requests/:id", async (req, res) => {
    const request = await storage.getEmergencyRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Emergency request not found" });
    }
    res.json(request);
  });
  app2.get("/api/users/:userId/emergency-requests", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.userId;
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (requestingUserId !== targetUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only view your own emergency requests" });
      }
      const requests = await storage.getEmergencyRequestsByUserId(targetUserId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/clinics/:clinicId/emergency-requests", isAuthenticated, async (req, res) => {
    console.warn("[DEPRECATED] GET /api/clinics/:clinicId/emergency-requests called - use /api/hospitals/:hospitalId/emergency-requests instead");
    res.status(410).json({
      message: "This endpoint is deprecated. Please use /api/hospitals/:hospitalId/emergency-requests instead.",
      deprecated: true
    });
  });
  app2.patch("/api/emergency-requests/:id", async (req, res) => {
    try {
      const request = await storage.getEmergencyRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Emergency request not found" });
      }
      if (req.user) {
        const requestingUserId = req.user.id;
        const requestingUser = await storage.getUser(requestingUserId);
        if (!requestingUser) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const isOwner = request.userId === requestingUserId;
        const isAdmin2 = requestingUser.role === "admin";
        const isAnonymousRequest = !request.userId;
        if (!isOwner && !isAdmin2 && !isAnonymousRequest) {
          return res.status(403).json({ message: "Forbidden - You can only update your own emergency requests" });
        }
      } else {
        if (request.userId) {
          return res.status(403).json({ message: "Forbidden - This emergency belongs to a registered user" });
        }
      }
      const updateData = insertEmergencyRequestSchema.partial().parse(req.body);
      const updatedRequest = await storage.updateEmergencyRequest(req.params.id, updateData);
      await storage.createAuditLog({
        entityType: "emergency_request",
        entityId: request.id,
        action: "update",
        userId: req.user ? req.user.id : null,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(updatedRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/emergency-requests/:id/broadcast", broadcastLimiter, async (req, res) => {
    try {
      const { clinicIds, message } = z.object({
        clinicIds: z.array(z.string()),
        message: z.string()
      }).parse(req.body);
      const emergencyRequest = await storage.getEmergencyRequest(req.params.id);
      if (!emergencyRequest) {
        return res.status(404).json({ message: "Emergency request not found" });
      }
      if (req.user) {
        const requestingUserId = req.user.id;
        const requestingUser = await storage.getUser(requestingUserId);
        if (!requestingUser) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        if (emergencyRequest.userId !== requestingUserId && requestingUser.role !== "admin") {
          return res.status(403).json({ message: "Forbidden - You can only broadcast your own emergency requests" });
        }
      } else {
        if (emergencyRequest.userId) {
          return res.status(403).json({ message: "Forbidden - This emergency belongs to a registered user" });
        }
      }
      const messages2 = await messagingService.broadcastEmergency(
        req.params.id,
        clinicIds,
        message
      );
      res.status(201).json({ messages: messages2, count: messages2.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const aiAnalysisLimiter = rateLimit2({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 20,
    // Stricter limit for AI analysis
    message: JSON.stringify({
      message: "Too many AI analysis requests. Please try again later.",
      fallbackAvailable: true
    }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: "Too many AI analysis requests. Please try again later.",
        fallbackAvailable: true
      });
    }
  });
  app2.post("/api/voice/analyze", aiAnalysisLimiter, async (req, res) => {
    try {
      const { transcript, language } = z.object({
        transcript: z.string().min(1, "Transcript cannot be empty").max(1e4, "Transcript too long"),
        language: z.enum(["en", "zh", "zh-HK", "zh-CN"]).optional().default("en")
      }).parse(req.body);
      if (!deepseekService.isAvailable()) {
        return res.status(503).json({
          message: "DeepSeek AI service not configured. Please set DEEPSEEK_API_KEY environment variable.",
          fallbackAvailable: true
        });
      }
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Analysis timeout")), 1e4)
      );
      const analysis = await Promise.race([
        deepseekService.analyzeVoiceTranscript(transcript, language),
        timeoutPromise
      ]);
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
      if (error instanceof Error && error.message === "Analysis timeout") {
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
  app2.post("/api/messages", isAuthenticated, isAdmin, async (req, res) => {
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
  app2.get("/api/emergency-requests/:id/messages", async (req, res) => {
    const messages2 = await storage.getMessagesByEmergencyRequest(req.params.id);
    res.json(messages2);
  });
  app2.patch("/api/messages/:id", async (req, res) => {
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
  app2.get("/api/messages/queued", async (req, res) => {
    const messages2 = await storage.getQueuedMessages();
    res.json(messages2);
  });
  app2.get("/api/feature-flags", isAuthenticated, isAdmin, async (req, res) => {
    const flags = await storage.getAllFeatureFlags();
    res.json(flags);
  });
  app2.get("/api/feature-flags/:key", isAuthenticated, isAdmin, async (req, res) => {
    const flag = await storage.getFeatureFlag(req.params.key);
    if (!flag) {
      return res.status(404).json({ message: "Feature flag not found" });
    }
    res.json(flag);
  });
  app2.post("/api/feature-flags", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const flagData = insertFeatureFlagSchema.parse(req.body);
      const flag = await storage.createFeatureFlag(flagData);
      await storage.createAuditLog({
        entityType: "feature_flag",
        entityId: flag.id,
        action: "create",
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(flag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/feature-flags/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updateData = insertFeatureFlagSchema.partial().parse(req.body);
      const flag = await storage.updateFeatureFlag(req.params.id, updateData);
      if (!flag) {
        return res.status(404).json({ message: "Feature flag not found" });
      }
      await storage.createAuditLog({
        entityType: "feature_flag",
        entityId: flag.id,
        action: "update",
        userId: req.user.id,
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(flag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/translations/:language", async (req, res) => {
    try {
      const translations2 = await storage.getTranslationsByLanguage(req.params.language);
      res.json(translations2);
    } catch (error) {
      res.status(500).json({ message: "Translation service unavailable", translations: [] });
    }
  });
  app2.post("/api/translations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const translationData = insertTranslationSchema.parse(req.body);
      const existing = await storage.getTranslation(translationData.key, "en");
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
  app2.get("/api/users/:userId/consents", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const targetUserId = req.params.userId;
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (requestingUserId !== targetUserId && requestingUser.role !== "admin") {
        return res.status(403).json({ message: "Forbidden - You can only view your own consents" });
      }
      const consents = await storage.getPrivacyConsents(targetUserId);
      res.json(consents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/privacy-consents", isAuthenticated, async (req, res) => {
    try {
      const requestingUserId = req.user.id;
      const consentData = insertPrivacyConsentSchema.parse(req.body);
      if (consentData.userId !== requestingUserId) {
        return res.status(403).json({ message: "Forbidden - You can only create consents for yourself" });
      }
      const consent = await storage.createPrivacyConsent(consentData);
      await storage.createAuditLog({
        entityType: "privacy_consent",
        entityId: consent.id,
        action: "create",
        userId: requestingUserId,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(consent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/audit-logs/:entityType/:entityId", isAuthenticated, isAdmin, async (req, res) => {
    const logs = await storage.getAuditLogsByEntity(req.params.entityType, req.params.entityId);
    res.json(logs);
  });
  app2.post("/api/admin/test-whatsapp", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { phoneNumber, message } = z.object({
        phoneNumber: z.string().min(8, "Phone number required"),
        message: z.string().optional().default("Test message from PetSOS")
      }).parse(req.body);
      const WHATSAPP_ACCESS_TOKEN2 = process.env.WHATSAPP_ACCESS_TOKEN;
      const WHATSAPP_PHONE_NUMBER_ID2 = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const WHATSAPP_API_URL2 = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v17.0";
      console.log("[WhatsApp Test] DEBUG - Checking credentials...");
      console.log("[WhatsApp Test] Has Access Token:", !!WHATSAPP_ACCESS_TOKEN2);
      console.log("[WhatsApp Test] Has Phone Number ID:", !!WHATSAPP_PHONE_NUMBER_ID2);
      console.log("[WhatsApp Test] Token length:", WHATSAPP_ACCESS_TOKEN2?.length || 0);
      console.log("[WhatsApp Test] Phone ID:", WHATSAPP_PHONE_NUMBER_ID2 || "NOT SET");
      console.log("[WhatsApp Test] All env keys with WHATSAPP:", Object.keys(process.env).filter((k) => k.includes("WHATSAPP")));
      if (!WHATSAPP_ACCESS_TOKEN2 || !WHATSAPP_PHONE_NUMBER_ID2) {
        console.error("[WhatsApp Test] ERROR - Credentials missing!");
        return res.status(400).json({
          success: false,
          error: "WhatsApp credentials not configured",
          details: {
            hasAccessToken: !!WHATSAPP_ACCESS_TOKEN2,
            hasPhoneNumberId: !!WHATSAPP_PHONE_NUMBER_ID2,
            apiUrl: WHATSAPP_API_URL2,
            tokenLength: WHATSAPP_ACCESS_TOKEN2?.length || 0,
            phoneNumberId: WHATSAPP_PHONE_NUMBER_ID2 || null
          }
        });
      }
      const cleanedNumber = phoneNumber.replace(/[^0-9]/g, "");
      const url = `${WHATSAPP_API_URL2}/${WHATSAPP_PHONE_NUMBER_ID2}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: cleanedNumber,
        type: "text",
        text: { body: message }
      };
      console.log("[WhatsApp Test] Sending to:", url);
      console.log("[WhatsApp Test] Payload:", JSON.stringify(payload, null, 2));
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN2}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const responseData = await response.json();
      console.log("[WhatsApp Test] Response status:", response.status);
      console.log("[WhatsApp Test] Response data:", JSON.stringify(responseData, null, 2));
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: "WhatsApp API returned an error",
          statusCode: response.status,
          details: responseData,
          debugInfo: {
            url,
            phoneNumber: cleanedNumber,
            hasToken: !!WHATSAPP_ACCESS_TOKEN2,
            phoneNumberId: WHATSAPP_PHONE_NUMBER_ID2
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
      console.error("[WhatsApp Test] Error:", error);
      res.status(500).json({
        success: false,
        error: "Test failed with exception",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/admin/failed-messages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const query = await db.select().from(messages).where(eq2(messages.status, "failed")).limit(100);
      res.json({
        total: query.length,
        messages: query.map((m) => ({
          id: m.id,
          emergencyRequestId: m.emergencyRequestId,
          recipient: m.recipient,
          messageType: m.messageType,
          status: m.status,
          error: m.errorMessage,
          retryCount: m.retryCount,
          createdAt: m.createdAt,
          failedAt: m.failedAt,
          content: m.content?.substring(0, 100) + "..." || ""
        }))
      });
    } catch (error) {
      console.error("[Failed Messages] Error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/clinics/:id/generate-code", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const clinic = await storage.getClinic(req.params.id);
      if (!clinic) {
        return res.status(404).json({ message: "Clinic not found" });
      }
      const code = Math.floor(Math.random() * 9e5 + 1e5).toString();
      const updatedClinic = await storage.updateClinic(req.params.id, { ownerVerificationCode: code });
      await storage.createAuditLog({
        entityType: "clinic",
        entityId: clinic.id,
        action: "generate_code",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ code, clinicId: clinic.id });
    } catch (error) {
      console.error("Generate clinic code error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/clinics/:id/verify", async (req, res) => {
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
  app2.post("/api/hospitals/:id/generate-code", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      const code = Math.floor(Math.random() * 9e5 + 1e5).toString();
      const updatedHospital = await storage.updateHospital(req.params.id, { ownerVerificationCode: code });
      await storage.createAuditLog({
        entityType: "hospital",
        entityId: hospital.id,
        action: "generate_code",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json({ code, hospitalId: hospital.id });
    } catch (error) {
      console.error("Generate hospital code error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/hospitals/:id/verify", async (req, res) => {
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
  app2.patch("/api/hospitals/:id/update-owner", async (req, res) => {
    try {
      const { verificationCode, ...updateData } = z.object({
        verificationCode: z.string().length(6, "Code must be 6 digits"),
        nameEn: z.string().optional(),
        nameZh: z.string().optional(),
        addressEn: z.string().optional(),
        addressZh: z.string().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().optional(),
        regionId: z.string().optional(),
        open247: z.boolean().optional()
      }).parse(req.body);
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      if (hospital.ownerVerificationCode !== verificationCode) {
        return res.status(401).json({ message: "Invalid verification code" });
      }
      const updatedHospital = await storage.updateHospital(req.params.id, updateData);
      await storage.createAuditLog({
        entityType: "hospital",
        entityId: hospital.id,
        action: "update",
        changes: updateData,
        ipAddress: req.ip,
        userAgent: req.get("user-agent")
      });
      res.json(updatedHospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/sentry.ts
import * as Sentry from "@sentry/node";
var SENSITIVE_KEYS = ["password", "token", "api_key", "apikey", "secret", "authorization", "cookie", "auth"];
function scrubSensitiveData(data, depth = 0) {
  if (depth > 5 || !data) return data;
  if (typeof data === "string") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => scrubSensitiveData(item, depth + 1));
  }
  if (typeof data === "object") {
    const scrubbed = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
        scrubbed[key] = "[REDACTED]";
      } else {
        scrubbed[key] = scrubSensitiveData(value, depth + 1);
      }
    }
    return scrubbed;
  }
  return data;
}
function initSentry() {
  const { sentryDsn, sentryTracesSampleRate, sentryEnv } = config.monitoring;
  if (!sentryDsn) {
    console.log("Sentry DSN not provided - error tracking disabled");
    return false;
  }
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnv,
    // Performance monitoring
    tracesSampleRate: sentryTracesSampleRate,
    // Filter out sensitive data
    beforeSend(event) {
      if (event.request?.headers) {
        event.request.headers = scrubSensitiveData(event.request.headers);
      }
      if (event.request?.query_string) {
        event.request.query_string = scrubSensitiveData(event.request.query_string);
      }
      if (event.request?.data) {
        event.request.data = scrubSensitiveData(event.request.data);
      }
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra);
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
          ...breadcrumb,
          data: scrubSensitiveData(breadcrumb.data)
        }));
      }
      return event;
    }
  });
  console.log(`Sentry initialized for ${sentryEnv} environment`);
  return true;
}
function setupSentryMiddleware(app2) {
  if (!config.monitoring.sentryDsn) {
    return;
  }
}
function setupSentryErrorHandler(app2) {
  if (!config.monitoring.sentryDsn) {
    return;
  }
  Sentry.setupExpressErrorHandler(app2);
}

// server/index.ts
import fs2 from "fs";
import path4 from "path";
var app = express2();
initSentry();
setupSentryMiddleware(app);
app.set("trust proxy", true);
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
var BUILD_VERSION = process.env.RENDER_GIT_COMMIT || Date.now().toString();
app.use((req, res, next) => {
  if (req.path === "/" || req.path.endsWith(".html") || req.path.endsWith(".js") || req.path.endsWith(".css")) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Cloudflare-CDN-Cache-Control", "no-store");
    res.setHeader("X-Build-Version", BUILD_VERSION);
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  setupSentryErrorHandler(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  if (config.isDevelopment) {
    await setupVite(app, server);
  } else {
    app.use((req, res, next) => {
      if (req.path === "/" || req.path.endsWith(".html")) {
        const distPath = path4.resolve(import.meta.dirname, "public");
        const indexPath = path4.resolve(distPath, "index.html");
        fs2.readFile(indexPath, "utf-8", (err, html) => {
          if (err) {
            next();
            return;
          }
          const versionedHtml = html.replace(
            /<script([^>]*)\ssrc="([^"?]+\.js)"/g,
            `<script$1 src="$2?v=${BUILD_VERSION}"`
          ).replace(
            /<link([^>]*)\shref="([^"?]+\.css)"/g,
            `<link$1 href="$2?v=${BUILD_VERSION}"`
          );
          res.setHeader("Content-Type", "text/html");
          res.send(versionedHtml);
        });
      } else {
        next();
      }
    });
    serveStatic(app);
  }
  server.listen({
    port: config.port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${config.port}`);
  });
})();
