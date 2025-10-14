import { 
  type User, type InsertUser, type UpsertUser,
  type Pet, type InsertPet,
  type Region, type InsertRegion,
  type Clinic, type InsertClinic,
  type EmergencyRequest, type InsertEmergencyRequest,
  type Message, type InsertMessage,
  type FeatureFlag, type InsertFeatureFlag,
  type AuditLog, type InsertAuditLog,
  type PrivacyConsent, type InsertPrivacyConsent,
  type Translation, type InsertTranslation,
  users, pets, regions, clinics, emergencyRequests, messages, featureFlags, auditLogs, privacyConsents, translations
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Pets
  getPet(id: string): Promise<Pet | undefined>;
  getPetsByUserId(userId: string): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: string, pet: Partial<InsertPet>): Promise<Pet | undefined>;
  deletePet(id: string): Promise<boolean>;

  // Regions
  getRegion(id: string): Promise<Region | undefined>;
  getRegionByCode(code: string): Promise<Region | undefined>;
  getAllRegions(): Promise<Region[]>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(id: string, region: Partial<InsertRegion>): Promise<Region | undefined>;

  // Clinics
  getClinic(id: string): Promise<Clinic | undefined>;
  getClinicsByRegion(regionId: string): Promise<Clinic[]>;
  get24HourClinicsByRegion(regionId: string): Promise<Clinic[]>;
  getAllClinics(): Promise<Clinic[]>;
  getNearbyClinics(latitude: number, longitude: number, radiusMeters: number): Promise<(Clinic & { distance: number })[]>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: string, clinic: Partial<InsertClinic>): Promise<Clinic | undefined>;
  deleteClinic(id: string): Promise<boolean>;

  // Emergency Requests
  getEmergencyRequest(id: string): Promise<any>; // Returns emergency request with pet data joined
  getEmergencyRequestsByUserId(userId: string): Promise<EmergencyRequest[]>;
  getEmergencyRequestsByClinicId(clinicId: string): Promise<any[]>;
  getAllEmergencyRequests(): Promise<EmergencyRequest[]>;
  createEmergencyRequest(request: InsertEmergencyRequest): Promise<EmergencyRequest>;
  updateEmergencyRequest(id: string, request: Partial<InsertEmergencyRequest>): Promise<EmergencyRequest | undefined>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByEmergencyRequest(emergencyRequestId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message | undefined>;
  getQueuedMessages(): Promise<Message[]>;

  // Feature Flags
  getFeatureFlag(key: string): Promise<FeatureFlag | undefined>;
  getAllFeatureFlags(): Promise<FeatureFlag[]>;
  createFeatureFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>;
  updateFeatureFlag(id: string, flag: Partial<InsertFeatureFlag>): Promise<FeatureFlag | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;

  // Privacy Consents
  getPrivacyConsents(userId: string): Promise<PrivacyConsent[]>;
  createPrivacyConsent(consent: InsertPrivacyConsent): Promise<PrivacyConsent>;

  // Translations
  getTranslationsByLanguage(language: string): Promise<Translation[]>;
  getTranslation(key: string, language: string): Promise<Translation | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslation(id: string, translation: Partial<InsertTranslation>): Promise<Translation | undefined>;

  // GDPR/PDPO Compliance
  exportUserData(userId: string): Promise<{
    user: User | undefined;
    pets: Pet[];
    emergencyRequests: EmergencyRequest[];
    privacyConsents: PrivacyConsent[];
    auditLogs: AuditLog[];
  }>;
  deleteUserDataGDPR(userId: string): Promise<{
    success: boolean;
    deletedRecords: {
      pets: number;
      emergencyRequests: number;
      privacyConsents: number;
      messages: number;
      user: boolean;
    };
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pets: Map<string, Pet>;
  private regions: Map<string, Region>;
  private clinics: Map<string, Clinic>;
  private emergencyRequests: Map<string, EmergencyRequest>;
  private messages: Map<string, Message>;
  private featureFlags: Map<string, FeatureFlag>;
  private auditLogs: Map<string, AuditLog>;
  private privacyConsents: Map<string, PrivacyConsent>;
  private translations: Map<string, Translation>;

  constructor() {
    this.users = new Map();
    this.pets = new Map();
    this.regions = new Map();
    this.clinics = new Map();
    this.emergencyRequests = new Map();
    this.messages = new Map();
    this.featureFlags = new Map();
    this.auditLogs = new Map();
    this.privacyConsents = new Map();
    this.translations = new Map();
    
    // Seed test user
    const testUser: User = {
      id: 'temp-user-id',
      username: 'testuser',
      password: 'hashedpassword',
      email: 'user@example.com',
      name: null,
      profileImageUrl: null,
      phone: '+852 9123 4567',
      languagePreference: 'en',
      regionPreference: null,
      role: 'user',
      clinicId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(testUser.id, testUser);
    
    // Seed test data for regions
    const regions: Region[] = [
      { id: 'hki-region', code: 'HKI', nameEn: 'Hong Kong Island', nameZh: '香港島', country: 'HK', coordinates: { latitude: 22.2783, longitude: 114.1747 }, active: true },
      { id: 'kln-region', code: 'KLN', nameEn: 'Kowloon', nameZh: '九龍', country: 'HK', coordinates: { latitude: 22.3193, longitude: 114.1694 }, active: true },
      { id: 'nti-region', code: 'NTI', nameEn: 'New Territories', nameZh: '新界', country: 'HK', coordinates: { latitude: 22.4453, longitude: 114.1683 }, active: true },
    ];
    regions.forEach(region => this.regions.set(region.id, region));
    
    // Seed test data for clinics
    const clinics: Clinic[] = [
      {
        id: 'clinic-1',
        name: 'Central Veterinary Hospital',
        nameZh: '中環獸醫醫院',
        address: "123 Queen's Road Central, Hong Kong",
        addressZh: '香港皇后大道中123號',
        phone: '+852 2123 4567',
        whatsapp: '+85291234567',
        email: 'info@centralvet.hk',
        regionId: 'hki-region',
        is24Hour: true,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.2820',
        longitude: '114.1585',
        location: null,
        status: 'active',
        services: ['emergency', 'surgery', 'dental'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'clinic-2',
        name: 'Happy Pets Clinic TST',
        nameZh: '尖沙咀快樂寵物診所',
        address: '456 Nathan Road, Tsim Sha Tsui',
        addressZh: '尖沙咀彌敦道456號',
        phone: '+852 2234 5678',
        whatsapp: '+85292345678',
        email: 'contact@happypets.hk',
        regionId: 'kln-region',
        is24Hour: true,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.2980',
        longitude: '114.1722',
        location: null,
        status: 'active',
        services: ['emergency', 'vaccination'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'clinic-3',
        name: 'New Territories Animal Care',
        nameZh: '新界動物護理中心',
        address: '789 Castle Peak Road, Yuen Long',
        addressZh: '元朗青山公路789號',
        phone: '+852 2345 6789',
        whatsapp: '+85293456789',
        email: 'care@ntanimal.hk',
        regionId: 'nti-region',
        is24Hour: false,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.4450',
        longitude: '114.0239',
        location: null,
        status: 'active',
        services: ['general', 'grooming'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'clinic-4',
        name: 'Island Pet Emergency',
        nameZh: '港島寵物急症',
        address: '321 Hennessy Road, Causeway Bay',
        addressZh: '銅鑼灣軒尼詩道321號',
        phone: '+852 2456 7890',
        whatsapp: '+85294567890',
        email: 'emergency@islandpet.hk',
        regionId: 'hki-region',
        is24Hour: true,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.2793',
        longitude: '114.1826',
        location: null,
        status: 'active',
        services: ['emergency', '24hour'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    clinics.forEach(clinic => this.clinics.set(clinic.id, clinic));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      languagePreference: insertUser.languagePreference ?? 'en',
      regionPreference: insertUser.regionPreference ?? null,
      role: insertUser.role ?? 'user',
      email: insertUser.email ?? null,
      name: insertUser.name ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      username: insertUser.username ?? null,
      password: insertUser.password ?? null,
      phone: insertUser.phone ?? null,
      clinicId: insertUser.clinicId ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updateData };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id);
    const user: User = {
      ...existing,
      ...userData,
      username: existing?.username ?? null,
      password: existing?.password ?? null,
      phone: existing?.phone ?? null,
      languagePreference: existing?.languagePreference ?? 'en',
      regionPreference: existing?.regionPreference ?? null,
      role: existing?.role ?? 'user',
      clinicId: existing?.clinicId ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Pets
  async getPet(id: string): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async getPetsByUserId(userId: string): Promise<Pet[]> {
    return Array.from(this.pets.values()).filter(pet => pet.userId === userId);
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const id = randomUUID();
    const pet: Pet = { 
      ...insertPet, 
      id, 
      createdAt: new Date(),
      breed: insertPet.breed ?? null,
      age: insertPet.age ?? null,
      weight: insertPet.weight ?? null,
      medicalNotes: insertPet.medicalNotes ?? null,
      lastVisitClinicId: insertPet.lastVisitClinicId ?? null,
      lastVisitDate: insertPet.lastVisitDate ?? null
    };
    this.pets.set(id, pet);
    return pet;
  }

  async updatePet(id: string, updateData: Partial<InsertPet>): Promise<Pet | undefined> {
    const pet = this.pets.get(id);
    if (!pet) return undefined;
    const updated = { ...pet, ...updateData };
    this.pets.set(id, updated);
    return updated;
  }

  async deletePet(id: string): Promise<boolean> {
    return this.pets.delete(id);
  }

  // Regions
  async getRegion(id: string): Promise<Region | undefined> {
    return this.regions.get(id);
  }

  async getRegionByCode(code: string): Promise<Region | undefined> {
    return Array.from(this.regions.values()).find(region => region.code === code);
  }

  async getAllRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = randomUUID();
    const region: Region = { 
      ...insertRegion, 
      id,
      coordinates: insertRegion.coordinates ?? null,
      country: insertRegion.country ?? 'HK',
      active: insertRegion.active ?? true
    };
    this.regions.set(id, region);
    return region;
  }

  async updateRegion(id: string, updateData: Partial<InsertRegion>): Promise<Region | undefined> {
    const region = this.regions.get(id);
    if (!region) return undefined;
    const updated = { ...region, ...updateData };
    this.regions.set(id, updated);
    return updated;
  }

  // Clinics
  async getClinic(id: string): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }

  async getClinicsByRegion(regionId: string): Promise<Clinic[]> {
    return Array.from(this.clinics.values()).filter(
      clinic => clinic.regionId === regionId && clinic.status === 'active'
    );
  }

  async get24HourClinicsByRegion(regionId: string): Promise<Clinic[]> {
    return Array.from(this.clinics.values()).filter(
      clinic => clinic.regionId === regionId && clinic.is24Hour && clinic.status === 'active'
    );
  }

  async getAllClinics(): Promise<Clinic[]> {
    return Array.from(this.clinics.values()).filter(clinic => clinic.status !== 'deleted');
  }

  async getNearbyClinics(latitude: number, longitude: number, radiusMeters: number): Promise<(Clinic & { distance: number })[]> {
    // Haversine formula for distance calculation (for in-memory storage)
    const toRad = (deg: number) => deg * Math.PI / 180;
    const R = 6371000; // Earth's radius in meters
    
    const results = Array.from(this.clinics.values())
      .filter(clinic => 
        clinic.status === 'active' && 
        clinic.latitude !== null && 
        clinic.longitude !== null
      )
      .map(clinic => {
        const lat1 = toRad(latitude);
        const lat2 = toRad(Number(clinic.latitude));
        const dLat = toRad(Number(clinic.latitude) - latitude);
        const dLon = toRad(Number(clinic.longitude) - longitude);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return { ...clinic, distance };
      })
      .filter(result => result.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
    
    return results;
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const id = randomUUID();
    const now = new Date();
    const clinic: Clinic = { 
      ...insertClinic, 
      id, 
      createdAt: now, 
      updatedAt: now,
      nameZh: insertClinic.nameZh ?? null,
      addressZh: insertClinic.addressZh ?? null,
      whatsapp: insertClinic.whatsapp ?? null,
      email: insertClinic.email ?? null,
      latitude: insertClinic.latitude ?? null,
      longitude: insertClinic.longitude ?? null,
      location: null, // PostGIS geography field (not used in MemStorage)
      status: insertClinic.status ?? 'active',
      is24Hour: insertClinic.is24Hour ?? false,
      isAvailable: insertClinic.isAvailable ?? true,
      isSupportHospital: insertClinic.isSupportHospital ?? false,
      services: insertClinic.services ?? null
    };
    this.clinics.set(id, clinic);
    return clinic;
  }

  async updateClinic(id: string, updateData: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const clinic = this.clinics.get(id);
    if (!clinic) return undefined;
    const updated = { ...clinic, ...updateData, updatedAt: new Date() };
    this.clinics.set(id, updated);
    return updated;
  }

  async deleteClinic(id: string): Promise<boolean> {
    const clinic = this.clinics.get(id);
    if (!clinic) return false;
    clinic.status = 'deleted';
    this.clinics.set(id, clinic);
    return true;
  }

  // Emergency Requests
  async getEmergencyRequest(id: string): Promise<any> {
    const request = this.emergencyRequests.get(id);
    if (!request) return undefined;
    
    // Include pet data if petId exists
    const pet = request.petId ? this.pets.get(request.petId) : null;
    return {
      ...request,
      pet
    };
  }

  async getEmergencyRequestsByUserId(userId: string): Promise<EmergencyRequest[]> {
    return Array.from(this.emergencyRequests.values()).filter(req => req.userId === userId);
  }

  async getEmergencyRequestsByClinicId(clinicId: string): Promise<any[]> {
    const requestIds = new Set(
      Array.from(this.messages.values())
        .filter(msg => msg.clinicId === clinicId)
        .map(msg => msg.emergencyRequestId)
    );
    
    return Array.from(this.emergencyRequests.values())
      .filter(req => requestIds.has(req.id))
      .map(req => {
        const pet = req.petId ? this.pets.get(req.petId) : undefined;
        const user = req.userId ? this.users.get(req.userId) : undefined;
        return {
          ...req,
          pet,
          user
        };
      });
  }

  async getAllEmergencyRequests(): Promise<EmergencyRequest[]> {
    return Array.from(this.emergencyRequests.values());
  }

  async createEmergencyRequest(insertRequest: InsertEmergencyRequest): Promise<EmergencyRequest> {
    const id = randomUUID();
    const request: EmergencyRequest = { 
      ...insertRequest, 
      id, 
      createdAt: new Date(),
      userId: insertRequest.userId ?? null,
      petId: insertRequest.petId ?? null,
      petSpecies: insertRequest.petSpecies ?? null,
      petBreed: insertRequest.petBreed ?? null,
      petAge: insertRequest.petAge ?? null,
      locationLatitude: insertRequest.locationLatitude ?? null,
      locationLongitude: insertRequest.locationLongitude ?? null,
      manualLocation: insertRequest.manualLocation ?? null,
      status: insertRequest.status ?? 'pending',
      regionId: insertRequest.regionId ?? null
    };
    this.emergencyRequests.set(id, request);
    return request;
  }

  async updateEmergencyRequest(id: string, updateData: Partial<InsertEmergencyRequest>): Promise<EmergencyRequest | undefined> {
    const request = this.emergencyRequests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...updateData };
    this.emergencyRequests.set(id, updated);
    return updated;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByEmergencyRequest(emergencyRequestId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      msg => msg.emergencyRequestId === emergencyRequestId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      status: insertMessage.status ?? 'queued',
      sentAt: insertMessage.sentAt ?? null,
      deliveredAt: insertMessage.deliveredAt ?? null,
      failedAt: insertMessage.failedAt ?? null,
      errorMessage: insertMessage.errorMessage ?? null,
      retryCount: insertMessage.retryCount ?? 0
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: string, updateData: Partial<InsertMessage>): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updated = { ...message, ...updateData };
    this.messages.set(id, updated);
    return updated;
  }

  async getQueuedMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      msg => msg.status === 'queued'
    );
  }

  // Feature Flags
  async getFeatureFlag(key: string): Promise<FeatureFlag | undefined> {
    return Array.from(this.featureFlags.values()).find(flag => flag.key === key);
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values());
  }

  async createFeatureFlag(insertFlag: InsertFeatureFlag): Promise<FeatureFlag> {
    const id = randomUUID();
    const flag: FeatureFlag = { 
      ...insertFlag, 
      id, 
      updatedAt: new Date(),
      enabled: insertFlag.enabled ?? false,
      value: insertFlag.value ?? null,
      description: insertFlag.description ?? null
    };
    this.featureFlags.set(id, flag);
    return flag;
  }

  async updateFeatureFlag(id: string, updateData: Partial<InsertFeatureFlag>): Promise<FeatureFlag | undefined> {
    const flag = this.featureFlags.get(id);
    if (!flag) return undefined;
    const updated = { ...flag, ...updateData, updatedAt: new Date() };
    this.featureFlags.set(id, updated);
    return updated;
  }

  // Audit Logs
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = { 
      ...insertLog, 
      id, 
      createdAt: new Date(),
      userId: insertLog.userId ?? null,
      changes: insertLog.changes ?? null,
      ipAddress: insertLog.ipAddress ?? null,
      userAgent: insertLog.userAgent ?? null
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(
      log => log.entityType === entityType && log.entityId === entityId
    );
  }

  // Privacy Consents
  async getPrivacyConsents(userId: string): Promise<PrivacyConsent[]> {
    return Array.from(this.privacyConsents.values()).filter(
      consent => consent.userId === userId
    );
  }

  async createPrivacyConsent(insertConsent: InsertPrivacyConsent): Promise<PrivacyConsent> {
    const id = randomUUID();
    const consent: PrivacyConsent = { 
      ...insertConsent, 
      id, 
      createdAt: new Date(),
      ipAddress: insertConsent.ipAddress ?? null,
      userAgent: insertConsent.userAgent ?? null,
      expiresAt: insertConsent.expiresAt ?? null
    };
    this.privacyConsents.set(id, consent);
    return consent;
  }

  // Translations
  async getTranslationsByLanguage(language: string): Promise<Translation[]> {
    return Array.from(this.translations.values()).filter(
      t => t.language === language
    );
  }

  async getTranslation(key: string, language: string): Promise<Translation | undefined> {
    return Array.from(this.translations.values()).find(
      t => t.key === key && t.language === language
    );
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = randomUUID();
    const translation: Translation = { 
      ...insertTranslation, 
      id, 
      updatedAt: new Date(),
      namespace: insertTranslation.namespace ?? 'common'
    };
    this.translations.set(id, translation);
    return translation;
  }

  async updateTranslation(id: string, updateData: Partial<InsertTranslation>): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    if (!translation) return undefined;
    const updated = { ...translation, ...updateData, updatedAt: new Date() };
    this.translations.set(id, updated);
    return updated;
  }

  async exportUserData(userId: string): Promise<{
    user: User | undefined;
    pets: Pet[];
    emergencyRequests: EmergencyRequest[];
    privacyConsents: PrivacyConsent[];
    auditLogs: AuditLog[];
  }> {
    const user = this.users.get(userId);
    const pets = Array.from(this.pets.values()).filter(p => p.userId === userId);
    const emergencyRequests = Array.from(this.emergencyRequests.values()).filter(r => r.userId === userId);
    const privacyConsents = Array.from(this.privacyConsents.values()).filter(c => c.userId === userId);
    const auditLogs = Array.from(this.auditLogs.values()).filter(l => l.entityType === 'user' && l.entityId === userId);

    return {
      user,
      pets,
      emergencyRequests,
      privacyConsents,
      auditLogs
    };
  }

  async deleteUserDataGDPR(userId: string): Promise<{
    success: boolean;
    deletedRecords: {
      pets: number;
      emergencyRequests: number;
      privacyConsents: number;
      messages: number;
      user: boolean;
    };
  }> {
    // Delete all user's pets
    const userPets = Array.from(this.pets.values()).filter(p => p.userId === userId);
    userPets.forEach(pet => this.pets.delete(pet.id));

    // Delete all user's emergency requests and associated messages
    const userRequests = Array.from(this.emergencyRequests.values()).filter(r => r.userId === userId);
    const requestIds = userRequests.map(r => r.id);
    userRequests.forEach(req => this.emergencyRequests.delete(req.id));

    // Delete messages associated with user's emergency requests
    const requestMessages = Array.from(this.messages.values()).filter(m => requestIds.includes(m.emergencyRequestId));
    requestMessages.forEach(msg => this.messages.delete(msg.id));

    // Delete all user's privacy consents
    const userConsents = Array.from(this.privacyConsents.values()).filter(c => c.userId === userId);
    userConsents.forEach(consent => this.privacyConsents.delete(consent.id));

    // Delete ALL audit logs related to this user
    // This includes:
    // - Logs where user is the entity (entityType='user', entityId=userId)
    // - Logs where user performed actions (userId=userId)
    // - This prevents user ID from persisting in changes JSONB or other fields
    const userRelatedLogs = Array.from(this.auditLogs.values()).filter(
      l => l.userId === userId || (l.entityType === 'user' && l.entityId === userId)
    );
    userRelatedLogs.forEach(log => this.auditLogs.delete(log.id));

    // Delete user account
    const userDeleted = this.users.delete(userId);

    return {
      success: userDeleted,
      deletedRecords: {
        pets: userPets.length,
        emergencyRequests: userRequests.length,
        privacyConsents: userConsents.length,
        messages: requestMessages.length,
        user: userDeleted
      }
    };
  }
}

// Database storage implementation using PostgreSQL
class DatabaseStorage implements IStorage {
  async getAllClinics(): Promise<Clinic[]> {
    return await db.select().from(clinics).where(eq(clinics.status, 'active'));
  }

  async getClinic(id: string): Promise<Clinic | undefined> {
    const result = await db.select().from(clinics).where(eq(clinics.id, id));
    return result[0];
  }

  async getClinicsByRegion(regionId: string): Promise<Clinic[]> {
    return await db.select().from(clinics).where(
      and(eq(clinics.regionId, regionId), eq(clinics.status, 'active'))
    );
  }

  async get24HourClinicsByRegion(regionId: string): Promise<Clinic[]> {
    return await db.select().from(clinics).where(
      and(
        eq(clinics.regionId, regionId),
        eq(clinics.is24Hour, true),
        eq(clinics.status, 'active')
      )
    );
  }

  async getNearbyClinics(latitude: number, longitude: number, radiusMeters: number): Promise<(Clinic & { distance: number })[]> {
    // Use PostGIS ST_DWithin for efficient spatial query with index
    const result = await db.execute<Clinic & { distance: number }>(
      sql`
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

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const result = await db.insert(clinics).values(insertClinic).returning();
    return result[0];
  }

  async updateClinic(id: string, updateData: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const result = await db.update(clinics)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return result[0];
  }

  async deleteClinic(id: string): Promise<boolean> {
    const result = await db.update(clinics)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllRegions(): Promise<Region[]> {
    return await db.select().from(regions);
  }

  async getRegion(id: string): Promise<Region | undefined> {
    const result = await db.select().from(regions).where(eq(regions.id, id));
    return result[0];
  }

  async getRegionByCode(code: string): Promise<Region | undefined> {
    const result = await db.select().from(regions).where(eq(regions.code, code));
    return result[0];
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const result = await db.insert(regions).values(insertRegion).returning();
    return result[0];
  }

  async updateRegion(id: string, updateData: Partial<InsertRegion>): Promise<Region | undefined> {
    const result = await db.update(regions)
      .set(updateData)
      .where(eq(regions.id, id))
      .returning();
    return result[0];
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getPet(id: string): Promise<Pet | undefined> {
    const result = await db.select().from(pets).where(eq(pets.id, id));
    return result[0];
  }

  async getPetsByUserId(userId: string): Promise<Pet[]> {
    return await db.select().from(pets).where(eq(pets.userId, userId));
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const result = await db.insert(pets).values(insertPet).returning();
    return result[0];
  }

  async updatePet(id: string, updateData: Partial<InsertPet>): Promise<Pet | undefined> {
    const result = await db.update(pets)
      .set(updateData)
      .where(eq(pets.id, id))
      .returning();
    return result[0];
  }

  async deletePet(id: string): Promise<boolean> {
    const result = await db.delete(pets).where(eq(pets.id, id)).returning();
    return result.length > 0;
  }

  async getEmergencyRequest(id: string): Promise<any> {
    const results = await db
      .select({
        request: emergencyRequests,
        pet: pets,
      })
      .from(emergencyRequests)
      .leftJoin(pets, eq(pets.id, emergencyRequests.petId))
      .where(eq(emergencyRequests.id, id));
    
    if (results.length === 0) return undefined;
    
    const { request, pet } = results[0];
    return {
      ...request,
      pet
    };
  }

  async getEmergencyRequestsByUserId(userId: string): Promise<EmergencyRequest[]> {
    return await db.select().from(emergencyRequests).where(eq(emergencyRequests.userId, userId));
  }

  async getEmergencyRequestsByClinicId(clinicId: string): Promise<any[]> {
    const results = await db
      .selectDistinct({
        request: emergencyRequests,
        pet: pets,
        user: users,
      })
      .from(emergencyRequests)
      .innerJoin(messages, eq(messages.emergencyRequestId, emergencyRequests.id))
      .leftJoin(pets, eq(pets.id, emergencyRequests.petId))
      .leftJoin(users, eq(users.id, emergencyRequests.userId))
      .where(eq(messages.clinicId, clinicId))
      .orderBy(emergencyRequests.createdAt);

    return results.map(({ request, pet, user }) => ({
      ...request,
      pet,
      user
    }));
  }

  async getAllEmergencyRequests(): Promise<EmergencyRequest[]> {
    return await db.select().from(emergencyRequests);
  }

  async createEmergencyRequest(insertRequest: InsertEmergencyRequest): Promise<EmergencyRequest> {
    const result = await db.insert(emergencyRequests).values(insertRequest).returning();
    return result[0];
  }

  async updateEmergencyRequest(id: string, updateData: Partial<InsertEmergencyRequest>): Promise<EmergencyRequest | undefined> {
    const result = await db.update(emergencyRequests)
      .set(updateData)
      .where(eq(emergencyRequests.id, id))
      .returning();
    return result[0];
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async getMessagesByEmergencyRequest(emergencyRequestId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.emergencyRequestId, emergencyRequestId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async updateMessage(id: string, updateData: Partial<InsertMessage>): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set(updateData)
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async getQueuedMessages(): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.status, 'pending'));
  }

  async getFeatureFlag(key: string): Promise<FeatureFlag | undefined> {
    const result = await db.select().from(featureFlags).where(eq(featureFlags.key, key));
    return result[0];
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return await db.select().from(featureFlags);
  }

  async createFeatureFlag(insertFlag: InsertFeatureFlag): Promise<FeatureFlag> {
    const result = await db.insert(featureFlags).values(insertFlag).returning();
    return result[0];
  }

  async updateFeatureFlag(id: string, updateData: Partial<InsertFeatureFlag>): Promise<FeatureFlag | undefined> {
    const result = await db.update(featureFlags)
      .set(updateData)
      .where(eq(featureFlags.id, id))
      .returning();
    return result[0];
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(insertLog).returning();
    return result[0];
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(
      and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId))
    );
  }

  async getPrivacyConsents(userId: string): Promise<PrivacyConsent[]> {
    return await db.select().from(privacyConsents).where(eq(privacyConsents.userId, userId));
  }

  async createPrivacyConsent(insertConsent: InsertPrivacyConsent): Promise<PrivacyConsent> {
    const result = await db.insert(privacyConsents).values(insertConsent).returning();
    return result[0];
  }

  async getTranslationsByLanguage(language: string): Promise<Translation[]> {
    return await db.select().from(translations).where(eq(translations.language, language));
  }

  async getTranslation(key: string, language: string): Promise<Translation | undefined> {
    const result = await db.select().from(translations).where(
      and(eq(translations.key, key), eq(translations.language, language))
    );
    return result[0];
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const result = await db.insert(translations).values(insertTranslation).returning();
    return result[0];
  }

  async updateTranslation(id: string, updateData: Partial<InsertTranslation>): Promise<Translation | undefined> {
    const result = await db.update(translations)
      .set(updateData)
      .where(eq(translations.id, id))
      .returning();
    return result[0];
  }

  async exportUserData(userId: string): Promise<{
    user: User | undefined;
    pets: Pet[];
    emergencyRequests: EmergencyRequest[];
    privacyConsents: PrivacyConsent[];
    auditLogs: AuditLog[];
  }> {
    const user = await this.getUser(userId);
    const userPets = await db.select().from(pets).where(eq(pets.userId, userId));
    const requests = await db.select().from(emergencyRequests).where(eq(emergencyRequests.userId, userId));
    const consents = await db.select().from(privacyConsents).where(eq(privacyConsents.userId, userId));
    const logs = await db.select().from(auditLogs).where(
      and(
        eq(auditLogs.entityType, 'user'),
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

  async deleteUserDataGDPR(userId: string): Promise<{
    success: boolean;
    deletedRecords: {
      pets: number;
      emergencyRequests: number;
      privacyConsents: number;
      messages: number;
      user: boolean;
    };
  }> {
    // Get emergency request IDs for this user
    const userRequests = await db.select().from(emergencyRequests).where(eq(emergencyRequests.userId, userId));
    const requestIds = userRequests.map(r => r.id);

    // Delete messages associated with user's emergency requests
    let deletedMessages = 0;
    if (requestIds.length > 0) {
      const msgResults = await db.delete(messages).where(
        inArray(messages.emergencyRequestId, requestIds)
      ).returning();
      deletedMessages = msgResults.length;
    }

    // Delete all user's pets
    const deletedPets = await db.delete(pets).where(eq(pets.userId, userId)).returning();

    // Delete all user's emergency requests
    const deletedRequests = await db.delete(emergencyRequests).where(eq(emergencyRequests.userId, userId)).returning();

    // Delete all user's privacy consents
    const deletedConsents = await db.delete(privacyConsents).where(eq(privacyConsents.userId, userId)).returning();

    // Delete ALL audit logs related to this user
    // This includes:
    // - Logs where user is the entity (entityType='user', entityId=userId)
    // - Logs where user performed actions (userId=userId)
    // This prevents user ID from persisting in changes JSONB or other fields
    // Includes the gdpr_delete_request log we just created
    await db.delete(auditLogs).where(
      eq(auditLogs.userId, userId)
    );

    // Also delete logs where user is the entity
    await db.delete(auditLogs).where(
      and(
        eq(auditLogs.entityType, 'user'),
        eq(auditLogs.entityId, userId)
      )
    );

    // Delete user account
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
}

export const storage = new DatabaseStorage();
