import { 
  type User, type InsertUser,
  type Pet, type InsertPet,
  type Country, type InsertCountry,
  type Region, type InsertRegion,
  type PetBreed, type InsertPetBreed,
  type Clinic, type InsertClinic,
  type EmergencyRequest, type InsertEmergencyRequest,
  type Message, type InsertMessage,
  type FeatureFlag, type InsertFeatureFlag,
  type AuditLog, type InsertAuditLog,
  type PrivacyConsent, type InsertPrivacyConsent,
  type Translation, type InsertTranslation,
  type Hospital, type InsertHospital,
  type HospitalConsultFee, type InsertHospitalConsultFee,
  type HospitalUpdate, type InsertHospitalUpdate,
  users, pets, countries, regions, petBreeds, clinics, emergencyRequests, messages, featureFlags, auditLogs, privacyConsents, translations, hospitals, hospitalConsultFees, hospitalUpdates
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
  upsertUser(user: InsertUser): Promise<User>;

  // Pets
  getPet(id: string): Promise<Pet | undefined>;
  getPetsByUserId(userId: string): Promise<Pet[]>;
  getAllPets(): Promise<Pet[]>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: string, pet: Partial<InsertPet>): Promise<Pet | undefined>;
  deletePet(id: string): Promise<boolean>;

  // Countries
  getCountry(id: string): Promise<Country | undefined>;
  getCountryByCode(code: string): Promise<Country | undefined>;
  getAllCountries(): Promise<Country[]>;
  getActiveCountries(): Promise<Country[]>;
  createCountry(country: InsertCountry): Promise<Country>;
  updateCountry(id: string, country: Partial<InsertCountry>): Promise<Country | undefined>;
  deleteCountry(id: string): Promise<boolean>;

  // Regions
  getRegion(id: string): Promise<Region | undefined>;
  getRegionByCode(code: string): Promise<Region | undefined>;
  getAllRegions(): Promise<Region[]>;
  getRegionsByCountry(countryCode: string): Promise<Region[]>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(id: string, region: Partial<InsertRegion>): Promise<Region | undefined>;

  // Pet Breeds
  getPetBreed(id: string): Promise<PetBreed | undefined>;
  getPetBreedsBySpecies(species: string): Promise<PetBreed[]>;
  getPetBreedsByCountry(countryCode: string): Promise<PetBreed[]>;
  getCommonPetBreeds(species?: string): Promise<PetBreed[]>;
  getAllPetBreeds(): Promise<PetBreed[]>;
  createPetBreed(breed: InsertPetBreed): Promise<PetBreed>;
  updatePetBreed(id: string, breed: Partial<InsertPetBreed>): Promise<PetBreed | undefined>;
  deletePetBreed(id: string): Promise<boolean>;

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

  // Hospitals
  getHospital(id: string): Promise<Hospital | undefined>;
  getHospitalBySlug(slug: string): Promise<Hospital | undefined>;
  getHospitalsByRegion(region: string): Promise<Hospital[]>;
  getAllHospitals(): Promise<Hospital[]>;
  getNearbyHospitals(latitude: number, longitude: number, radiusMeters: number): Promise<(Hospital & { distance: number })[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: string, hospital: Partial<InsertHospital>): Promise<Hospital | undefined>;
  deleteHospital(id: string): Promise<boolean>;

  // Hospital Consult Fees
  getConsultFeesByHospitalId(hospitalId: string): Promise<HospitalConsultFee[]>;
  createConsultFee(fee: InsertHospitalConsultFee): Promise<HospitalConsultFee>;
  updateConsultFee(id: string, fee: Partial<InsertHospitalConsultFee>): Promise<HospitalConsultFee | undefined>;
  deleteConsultFee(id: string): Promise<boolean>;

  // Hospital Updates
  getHospitalUpdatesByHospitalId(hospitalId: string): Promise<HospitalUpdate[]>;
  createHospitalUpdate(update: InsertHospitalUpdate): Promise<HospitalUpdate>;
  updateHospitalUpdate(id: string, update: Partial<InsertHospitalUpdate>): Promise<HospitalUpdate | undefined>;

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
  private countries: Map<string, Country>;
  private regions: Map<string, Region>;
  private petBreeds: Map<string, PetBreed>;
  private clinics: Map<string, Clinic>;
  private emergencyRequests: Map<string, EmergencyRequest>;
  private messages: Map<string, Message>;
  private featureFlags: Map<string, FeatureFlag>;
  private auditLogs: Map<string, AuditLog>;
  private privacyConsents: Map<string, PrivacyConsent>;
  private translations: Map<string, Translation>;
  private hospitals: Map<string, Hospital>;
  private hospitalConsultFees: Map<string, HospitalConsultFee>;
  private hospitalUpdates: Map<string, HospitalUpdate>;

  constructor() {
    this.users = new Map();
    this.pets = new Map();
    this.countries = new Map();
    this.regions = new Map();
    this.petBreeds = new Map();
    this.clinics = new Map();
    this.emergencyRequests = new Map();
    this.messages = new Map();
    this.featureFlags = new Map();
    this.auditLogs = new Map();
    this.privacyConsents = new Map();
    this.translations = new Map();
    this.hospitals = new Map();
    this.hospitalConsultFees = new Map();
    this.hospitalUpdates = new Map();
    
    // Seed test user
    const testUser: User = {
      id: 'temp-user-id',
      username: 'testuser',
      password: 'hashedpassword',
      passwordHash: null,
      googleId: null,
      openidSub: null,
      email: 'user@example.com',
      name: null,
      avatar: null,
      profileImageUrl: null,
      phone: '+852 9123 4567',
      language: 'en',
      languagePreference: 'en',
      region: null,
      regionPreference: null,
      role: 'user',
      clinicId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(testUser.id, testUser);
    
    // Seed test data for regions (not used - data comes from production DB)
    
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
        lineUserId: null,
        regionId: 'hki-region',
        is24Hour: true,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.2820',
        longitude: '114.1585',
        location: null,
        status: 'active',
        services: ['emergency', 'surgery', 'dental'],
        ownerVerificationCode: null,
        createdAt: new Date()
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
        lineUserId: null,
        regionId: 'kln-region',
        is24Hour: true,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.2980',
        longitude: '114.1722',
        location: null,
        status: 'active',
        services: ['emergency', 'vaccination'],
        ownerVerificationCode: null,
        createdAt: new Date()
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
        lineUserId: null,
        regionId: 'nti-region',
        is24Hour: false,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.4450',
        longitude: '114.0239',
        location: null,
        status: 'active',
        services: ['general', 'grooming'],
        ownerVerificationCode: null,
        createdAt: new Date()
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
        lineUserId: null,
        regionId: 'hki-region',
        is24Hour: true,
        isAvailable: true,
        isSupportHospital: false,
        latitude: '22.2793',
        longitude: '114.1826',
        location: null,
        status: 'active',
        services: ['emergency', '24hour'],
        ownerVerificationCode: null,
        createdAt: new Date()
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
      googleId: insertUser.googleId ?? null,
      openidSub: insertUser.openidSub ?? null,
      avatar: insertUser.avatar ?? null,
      language: insertUser.language ?? 'en',
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
      passwordHash: insertUser.passwordHash ?? null,
      phone: insertUser.phone ?? null,
      region: insertUser.region ?? null,
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

  async upsertUser(userData: InsertUser): Promise<User> {
    const id = randomUUID();
    const existing = this.users.get(id);
    const user: User = {
      id,
      name: existing?.name ?? userData.name ?? null,
      username: existing?.username ?? userData.username ?? null,
      password: existing?.password ?? userData.password ?? null,
      email: existing?.email ?? userData.email ?? null,
      phone: existing?.phone ?? userData.phone ?? null,
      passwordHash: existing?.passwordHash ?? userData.passwordHash ?? null,
      googleId: existing?.googleId ?? userData.googleId ?? null,
      openidSub: existing?.openidSub ?? userData.openidSub ?? null,
      role: existing?.role ?? userData.role ?? 'user',
      avatar: existing?.avatar ?? userData.avatar ?? null,
      profileImageUrl: existing?.profileImageUrl ?? userData.profileImageUrl ?? null,
      language: existing?.language ?? userData.language ?? 'en',
      languagePreference: existing?.languagePreference ?? userData.languagePreference ?? null,
      region: existing?.region ?? userData.region ?? null,
      regionPreference: existing?.regionPreference ?? userData.regionPreference ?? null,
      clinicId: existing?.clinicId ?? userData.clinicId ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Pets
  async getPet(id: string): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async getPetsByUserId(userId: string): Promise<Pet[]> {
    return Array.from(this.pets.values()).filter(pet => pet.userId === userId);
  }

  async getAllPets(): Promise<Pet[]> {
    return Array.from(this.pets.values());
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const id = randomUUID();
    const pet: Pet = { 
      id, 
      userId: insertPet.userId,
      name: insertPet.name,
      species: insertPet.species,
      type: insertPet.type ?? null,
      breed: insertPet.breed ?? null,
      breedId: insertPet.breedId ?? null,
      age: insertPet.age ?? null,
      weight: insertPet.weight ?? null,
      medicalNotes: insertPet.medicalNotes ?? null,
      color: insertPet.color ?? null,
      medicalHistory: insertPet.medicalHistory ?? null,
      microchipId: insertPet.microchipId ?? null,
      lastVisitHospitalId: insertPet.lastVisitHospitalId ?? null,
      lastVisitDate: insertPet.lastVisitDate ?? null,
      createdAt: new Date()
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
      id,
      code: insertRegion.code,
      nameEn: insertRegion.nameEn,
      nameZh: (insertRegion.nameZh ?? "") as string,
      countryCode: (insertRegion.countryCode ?? "HK") as string,
      active: (insertRegion.active ?? true) as boolean,
      coordinates: insertRegion.coordinates ?? null
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

  async getRegionsByCountry(countryCode: string): Promise<Region[]> {
    return Array.from(this.regions.values()).filter(region => region.countryCode === countryCode);
  }

  // Countries (stub implementations - app uses DatabaseStorage in production)
  async getCountry(id: string): Promise<Country | undefined> {
    return this.countries.get(id);
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    return Array.from(this.countries.values()).find(country => country.code === code);
  }

  async getAllCountries(): Promise<Country[]> {
    return Array.from(this.countries.values());
  }

  async getActiveCountries(): Promise<Country[]> {
    return Array.from(this.countries.values()).filter(country => country.active);
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    const id = randomUUID();
    const country: Country = { 
      id,
      code: insertCountry.code,
      nameEn: insertCountry.nameEn,
      nameZh: insertCountry.nameZh ?? null,
      region: insertCountry.region ?? null,
      active: insertCountry.active ?? null,
      phonePrefix: insertCountry.phonePrefix ?? null,
      flag: insertCountry.flag ?? null
    };
    this.countries.set(id, country);
    return country;
  }

  async updateCountry(id: string, updateData: Partial<InsertCountry>): Promise<Country | undefined> {
    const country = this.countries.get(id);
    if (!country) return undefined;
    const updated = { ...country, ...updateData };
    this.countries.set(id, updated);
    return updated;
  }

  async deleteCountry(id: string): Promise<boolean> {
    return this.countries.delete(id);
  }

  // Pet Breeds (stub implementations - app uses DatabaseStorage in production)
  async getPetBreed(id: string): Promise<PetBreed | undefined> {
    return this.petBreeds.get(id);
  }

  async getPetBreedsBySpecies(species: string): Promise<PetBreed[]> {
    return Array.from(this.petBreeds.values()).filter(breed => breed.species === species);
  }

  async getPetBreedsByCountry(countryCode: string): Promise<PetBreed[]> {
    return Array.from(this.petBreeds.values()).filter(breed => 
      breed.countryCode === countryCode || breed.countryCode === null
    );
  }

  async getCommonPetBreeds(species?: string): Promise<PetBreed[]> {
    const breeds = Array.from(this.petBreeds.values()).filter(breed => breed.isCommon);
    if (species) {
      return breeds.filter(breed => breed.species === species);
    }
    return breeds;
  }

  async getAllPetBreeds(): Promise<PetBreed[]> {
    return Array.from(this.petBreeds.values());
  }

  async createPetBreed(insertBreed: InsertPetBreed): Promise<PetBreed> {
    const id = randomUUID();
    const breed: PetBreed = { 
      ...insertBreed, 
      id,
      breedZh: insertBreed.breedZh ?? null,
      countryCode: insertBreed.countryCode ?? null,
      isCommon: insertBreed.isCommon ?? false,
      active: insertBreed.active ?? true
    };
    this.petBreeds.set(id, breed);
    return breed;
  }

  async updatePetBreed(id: string, updateData: Partial<InsertPetBreed>): Promise<PetBreed | undefined> {
    const breed = this.petBreeds.get(id);
    if (!breed) return undefined;
    const updated = { ...breed, ...updateData };
    this.petBreeds.set(id, updated);
    return updated;
  }

  async deletePetBreed(id: string): Promise<boolean> {
    return this.petBreeds.delete(id);
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
    const clinic: Clinic = { 
      id, 
      name: insertClinic.name,
      nameZh: insertClinic.nameZh ?? null,
      address: insertClinic.address,
      addressZh: insertClinic.addressZh ?? null,
      phone: insertClinic.phone,
      whatsapp: insertClinic.whatsapp ?? null,
      email: insertClinic.email ?? null,
      lineUserId: insertClinic.lineUserId ?? null,
      regionId: insertClinic.regionId,
      is24Hour: insertClinic.is24Hour ?? false,
      isAvailable: insertClinic.isAvailable ?? true,
      isSupportHospital: insertClinic.isSupportHospital ?? false,
      latitude: insertClinic.latitude ?? null,
      longitude: insertClinic.longitude ?? null,
      location: null,
      status: insertClinic.status ?? 'active',
      services: insertClinic.services ?? null,
      ownerVerificationCode: insertClinic.ownerVerificationCode ?? null,
      createdAt: new Date()
    };
    this.clinics.set(id, clinic);
    return clinic;
  }

  async updateClinic(id: string, updateData: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const clinic = await this.getClinic(id);
    if (!clinic) return undefined;
    const updated = { ...clinic, ...updateData };
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
        .filter(msg => msg.hospitalId === clinicId)
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
      id, 
      userId: insertRequest.userId ?? null,
      petId: insertRequest.petId ?? null,
      symptom: insertRequest.symptom ?? null,
      locationLatitude: insertRequest.locationLatitude ?? null,
      locationLongitude: insertRequest.locationLongitude ?? null,
      manualLocation: insertRequest.manualLocation ?? null,
      contactName: insertRequest.contactName,
      contactPhone: insertRequest.contactPhone,
      status: insertRequest.status ?? 'pending',
      regionId: insertRequest.regionId ?? null,
      createdAt: new Date(),
      petSpecies: insertRequest.petSpecies ?? null,
      petBreed: insertRequest.petBreed ?? null,
      petAge: insertRequest.petAge ?? null,
      voiceTranscript: insertRequest.voiceTranscript ?? null,
      aiAnalyzedSymptoms: insertRequest.aiAnalyzedSymptoms ?? null,
      isVoiceRecording: insertRequest.isVoiceRecording ?? null
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
      consentedAt: new Date(),
      accepted: insertConsent.accepted ?? false
    };
    this.privacyConsents.set(id, consent);
    return consent;
  }

  // Translations
  async getTranslationsByLanguage(language: string): Promise<Translation[]> {
    return Array.from(this.translations.values()).filter(
      t => (language === 'en' && !!t.en) || (language === 'zh-HK' && !!t.zhHk)
    );
  }

  async getTranslation(key: string, language: string): Promise<Translation | undefined> {
    return Array.from(this.translations.values()).find(
      t => t.key === key
    );
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = randomUUID();
    const translation: Translation = { 
      id,
      key: insertTranslation.key,
      value: insertTranslation.value ?? null,
      en: (insertTranslation.en ?? "") as string,
      zhHk: (insertTranslation.zhHk ?? "") as string
    };
    this.translations.set(id, translation);
    return translation;
  }

  async updateTranslation(id: string, updateData: Partial<InsertTranslation>): Promise<Translation | undefined> {
    const translation = this.translations.get(id);
    if (!translation) return undefined;
    const updated = { ...translation, ...updateData };
    this.translations.set(id, updated);
    return updated;
  }

  // Hospitals
  async getHospital(id: string): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }

  async getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
    return Array.from(this.hospitals.values()).find(
      hospital => hospital.slug === slug
    );
  }

  async getHospitalsByRegion(regionId: string): Promise<Hospital[]> {
    return Array.from(this.hospitals.values()).filter(
      hospital => hospital.regionId === regionId
    );
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async getNearbyHospitals(latitude: number, longitude: number, radiusMeters: number): Promise<(Hospital & { distance: number })[]> {
    // Haversine formula for distance calculation (for in-memory storage)
    const toRad = (deg: number) => deg * Math.PI / 180;
    const R = 6371000; // Earth's radius in meters
    
    const results = Array.from(this.hospitals.values())
      .filter(hospital => 
        hospital.isAvailable && 
        hospital.latitude !== null && 
        hospital.longitude !== null
      )
      .map(hospital => {
        const lat1 = toRad(latitude);
        const lat2 = toRad(Number(hospital.latitude));
        const dLat = toRad(Number(hospital.latitude) - latitude);
        const dLon = toRad(Number(hospital.longitude) - longitude);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return { ...hospital, distance };
      })
      .filter(result => result.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
    
    return results;
  }

  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const id = randomUUID();
    const now = new Date();
    const hospital: Hospital = {
      id,
      slug: insertHospital.slug,
      nameEn: insertHospital.nameEn,
      nameZh: insertHospital.nameZh,
      addressEn: insertHospital.addressEn,
      addressZh: insertHospital.addressZh,
      regionId: insertHospital.regionId,
      latitude: insertHospital.latitude ?? null,
      longitude: insertHospital.longitude ?? null,
      location: null,
      phone: insertHospital.phone ?? null,
      whatsapp: insertHospital.whatsapp ?? null,
      email: insertHospital.email ?? null,
      websiteUrl: insertHospital.websiteUrl ?? null,
      open247: insertHospital.open247 ?? true,
      isAvailable: insertHospital.isAvailable ?? true,
      isPartner: insertHospital.isPartner ?? false,
      liveStatus: insertHospital.liveStatus ?? null,
      photos: insertHospital.photos ?? null,
      lastVerifiedAt: insertHospital.lastVerifiedAt ?? null,
      verifiedById: insertHospital.verifiedById ?? null,
      onSiteVet247: insertHospital.onSiteVet247 ?? null,
      triagePolicy: insertHospital.triagePolicy ?? null,
      typicalWaitBand: insertHospital.typicalWaitBand ?? null,
      isolationWard: insertHospital.isolationWard ?? null,
      ambulanceSupport: insertHospital.ambulanceSupport ?? null,
      icuLevel: insertHospital.icuLevel ?? null,
      nurse24h: insertHospital.nurse24h ?? null,
      ownerVisitPolicy: insertHospital.ownerVisitPolicy ?? null,
      eolSupport: insertHospital.eolSupport ?? null,
      imagingXray: insertHospital.imagingXray ?? null,
      imagingUS: insertHospital.imagingUS ?? null,
      imagingCT: insertHospital.imagingCT ?? null,
      sameDayCT: insertHospital.sameDayCT ?? null,
      inHouseLab: insertHospital.inHouseLab ?? null,
      extLabCutoff: insertHospital.extLabCutoff ?? null,
      bloodBankAccess: insertHospital.bloodBankAccess ?? null,
      sxEmergencySoft: insertHospital.sxEmergencySoft ?? null,
      sxEmergencyOrtho: insertHospital.sxEmergencyOrtho ?? null,
      anaesMonitoring: insertHospital.anaesMonitoring ?? null,
      specialistAvail: insertHospital.specialistAvail ?? null,
      speciesAccepted: insertHospital.speciesAccepted ?? null,
      whatsappTriage: insertHospital.whatsappTriage ?? null,
      languages: insertHospital.languages ?? null,
      parking: insertHospital.parking ?? null,
      wheelchairAccess: insertHospital.wheelchairAccess ?? null,
      payMethods: insertHospital.payMethods ?? null,
      admissionDeposit: insertHospital.admissionDeposit ?? null,
      depositBand: insertHospital.depositBand ?? null,
      insuranceSupport: insertHospital.insuranceSupport ?? null,
      recheckWindow: insertHospital.recheckWindow ?? null,
      refundPolicy: insertHospital.refundPolicy ?? null,
      ownerVerificationCode: insertHospital.ownerVerificationCode ?? null,
      verified: insertHospital.verified ?? false,
      createdAt: now,
      updatedAt: now
    };
    this.hospitals.set(id, hospital);
    return hospital;
  }

  async updateHospital(id: string, updateData: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const hospital = this.hospitals.get(id);
    if (!hospital) return undefined;
    const updated = { ...hospital, ...updateData, updatedAt: new Date() };
    this.hospitals.set(id, updated);
    return updated;
  }

  async deleteHospital(id: string): Promise<boolean> {
    return this.hospitals.delete(id);
  }

  // Hospital Consult Fees
  async getConsultFeesByHospitalId(hospitalId: string): Promise<HospitalConsultFee[]> {
    return Array.from(this.hospitalConsultFees.values()).filter(
      fee => fee.hospitalId === hospitalId
    );
  }

  async createConsultFee(insertFee: InsertHospitalConsultFee): Promise<HospitalConsultFee> {
    const id = randomUUID();
    const fee: HospitalConsultFee = {
      ...insertFee,
      id,
      minFee: insertFee.minFee ?? null,
      maxFee: insertFee.maxFee ?? null,
      currency: insertFee.currency ?? 'HKD',
      notes: insertFee.notes ?? null,
      lastUpdated: insertFee.lastUpdated ?? new Date(),
    };
    this.hospitalConsultFees.set(id, fee);
    return fee;
  }

  async updateConsultFee(id: string, updateData: Partial<InsertHospitalConsultFee>): Promise<HospitalConsultFee | undefined> {
    const fee = this.hospitalConsultFees.get(id);
    if (!fee) return undefined;
    const updated = { ...fee, ...updateData, lastUpdated: new Date() };
    this.hospitalConsultFees.set(id, updated);
    return updated;
  }

  async deleteConsultFee(id: string): Promise<boolean> {
    return this.hospitalConsultFees.delete(id);
  }

  // Hospital Updates
  async getHospitalUpdatesByHospitalId(hospitalId: string): Promise<HospitalUpdate[]> {
    return Array.from(this.hospitalUpdates.values()).filter(
      update => update.hospitalId === hospitalId
    );
  }

  async createHospitalUpdate(insertUpdate: InsertHospitalUpdate): Promise<HospitalUpdate> {
    const id = randomUUID();
    const update: HospitalUpdate = {
      ...insertUpdate,
      id,
      createdAt: new Date(),
      submittedById: insertUpdate.submittedById ?? null,
      fieldName: insertUpdate.fieldName ?? null,
      oldValue: insertUpdate.oldValue ?? null,
      newValue: insertUpdate.newValue ?? null,
      status: insertUpdate.status ?? 'pending',
      reviewedById: insertUpdate.reviewedById ?? null,
      reviewedAt: insertUpdate.reviewedAt ?? null,
      notes: insertUpdate.notes ?? null,
    };
    this.hospitalUpdates.set(id, update);
    return update;
  }

  async updateHospitalUpdate(id: string, updateData: Partial<InsertHospitalUpdate>): Promise<HospitalUpdate | undefined> {
    const update = this.hospitalUpdates.get(id);
    if (!update) return undefined;
    const updated = { ...update, ...updateData };
    this.hospitalUpdates.set(id, updated);
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
      .set(updateData)
      .where(eq(clinics.id, id))
      .returning();
    return result[0];
  }

  async deleteClinic(id: string): Promise<boolean> {
    const result = await db.update(clinics)
      .set({ status: 'inactive' })
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

  async getRegionsByCountry(countryCode: string): Promise<Region[]> {
    try {
      // Try to filter by countryCode first, fallback if column doesn't exist
      return await db.select().from(regions).where(eq(regions.countryCode, countryCode));
    } catch (error) {
      console.warn('getRegionsByCountry query failed (countryCode column may not exist):', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getCountry(id: string): Promise<Country | undefined> {
    try {
      const result = await db.select().from(countries).where(eq(countries.id, id));
      return result[0];
    } catch (error) {
      console.warn('getCountry query failed:', error instanceof Error ? error.message : error);
      return undefined;
    }
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    try {
      const result = await db.select().from(countries).where(eq(countries.code, code));
      return result[0];
    } catch (error) {
      console.warn('getCountryByCode query failed:', error instanceof Error ? error.message : error);
      return undefined;
    }
  }

  async getAllCountries(): Promise<Country[]> {
    try {
      return await db.select().from(countries);
    } catch (error) {
      console.warn('getAllCountries query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getActiveCountries(): Promise<Country[]> {
    try {
      return await db.select().from(countries).where(eq(countries.active, true));
    } catch (error) {
      console.warn('getActiveCountries query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    const result = await db.insert(countries).values(insertCountry).returning();
    return result[0];
  }

  async updateCountry(id: string, updateData: Partial<InsertCountry>): Promise<Country | undefined> {
    const result = await db.update(countries)
      .set(updateData)
      .where(eq(countries.id, id))
      .returning();
    return result[0];
  }

  async deleteCountry(id: string): Promise<boolean> {
    const result = await db.update(countries)
      .set({ active: false })
      .where(eq(countries.id, id))
      .returning();
    return result.length > 0;
  }

  async getPetBreed(id: string): Promise<PetBreed | undefined> {
    const result = await db.select().from(petBreeds).where(eq(petBreeds.id, id));
    return result[0];
  }

  async getPetBreedsBySpecies(species: string): Promise<PetBreed[]> {
    try {
      return await db.select().from(petBreeds).where(
        and(eq(petBreeds.species, species), eq(petBreeds.active, true))
      );
    } catch (error) {
      console.warn('getPetBreedsBySpecies query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getPetBreedsByCountry(countryCode: string): Promise<PetBreed[]> {
    try {
      // Try to filter by countryCode, fallback if column doesn't exist
      return await db.select().from(petBreeds).where(
        and(eq(petBreeds.countryCode, countryCode), eq(petBreeds.active, true))
      );
    } catch (error) {
      console.warn('getPetBreedsByCountry query failed (countryCode column may not exist):', error instanceof Error ? error.message : error);
      // Return all active breeds as fallback
      try {
        return await db.select().from(petBreeds).where(eq(petBreeds.active, true));
      } catch {
        return [];
      }
    }
  }

  async getCommonPetBreeds(species?: string): Promise<PetBreed[]> {
    try {
      const conditions = [eq(petBreeds.isCommon, true), eq(petBreeds.active, true)];
      if (species) {
        conditions.push(eq(petBreeds.species, species));
      }
      return await db.select().from(petBreeds).where(and(...conditions));
    } catch (error) {
      console.warn('getCommonPetBreeds query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getAllPetBreeds(): Promise<PetBreed[]> {
    try {
      return await db.select().from(petBreeds).where(eq(petBreeds.active, true));
    } catch (error) {
      console.warn('getAllPetBreeds query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async createPetBreed(insertBreed: InsertPetBreed): Promise<PetBreed> {
    const result = await db.insert(petBreeds).values(insertBreed).returning();
    return result[0];
  }

  async updatePetBreed(id: string, updateData: Partial<InsertPetBreed>): Promise<PetBreed | undefined> {
    const result = await db.update(petBreeds)
      .set(updateData)
      .where(eq(petBreeds.id, id))
      .returning();
    return result[0];
  }

  async deletePetBreed(id: string): Promise<boolean> {
    const result = await db.update(petBreeds)
      .set({ active: false })
      .where(eq(petBreeds.id, id))
      .returning();
    return result.length > 0;
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

  async upsertUser(userData: InsertUser): Promise<User> {
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

  async getAllPets(): Promise<Pet[]> {
    return await db.select().from(pets);
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
      .where(eq(messages.hospitalId, clinicId))
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
    // Returns all translations - client can select en or zhHk field based on language
    try {
      return await db.select().from(translations);
    } catch (error) {
      // Handle missing table or columns gracefully
      console.warn('Translation table not ready or missing columns:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getTranslation(key: string, language: string): Promise<Translation | undefined> {
    // Get translation by key - client can select en or zhHk field based on language
    try {
      const result = await db.select().from(translations).where(eq(translations.key, key));
      return result[0];
    } catch (error) {
      // Handle missing table or columns gracefully
      console.warn('Translation query failed:', error instanceof Error ? error.message : error);
      return undefined;
    }
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

  // Hospitals
  async getHospital(id: string): Promise<Hospital | undefined> {
    try {
      const result = await db.select().from(hospitals).where(eq(hospitals.id, id));
      return result[0];
    } catch (error) {
      console.warn('getHospital query failed:', error instanceof Error ? error.message : error);
      return undefined;
    }
  }

  async getHospitalBySlug(slug: string): Promise<Hospital | undefined> {
    try {
      const result = await db.select().from(hospitals).where(eq(hospitals.slug, slug));
      return result[0];
    } catch (error) {
      console.warn('getHospitalBySlug query failed:', error instanceof Error ? error.message : error);
      return undefined;
    }
  }

  async getHospitalsByRegion(regionId: string): Promise<Hospital[]> {
    try {
      return await db.select().from(hospitals).where(eq(hospitals.regionId, regionId));
    } catch (error) {
      console.warn('getHospitalsByRegion query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getAllHospitals(): Promise<Hospital[]> {
    try {
      return await db.select().from(hospitals);
    } catch (error) {
      console.warn('getAllHospitals query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getNearbyHospitals(latitude: number, longitude: number, radiusMeters: number): Promise<(Hospital & { distance: number })[]> {
    try {
      // Use PostGIS ST_DWithin for efficient spatial query
      const results = await db
        .select({
          hospital: hospitals,
          distance: sql<number>`ST_Distance(
            ${hospitals.location}::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          )`.as('distance')
        })
        .from(hospitals)
        .where(
          and(
            eq(hospitals.isAvailable, true),
            sql`${hospitals.location} IS NOT NULL`,
            sql`ST_DWithin(
              ${hospitals.location}::geography,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
              ${radiusMeters}
            )`
          )
        )
        .orderBy(sql`distance`);

      return results.map(r => ({
        ...r.hospital,
        distance: r.distance
      }));
    } catch (error) {
      console.warn('getNearbyHospitals query failed:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const result = await db.insert(hospitals).values({
      ...insertHospital,
      ownerVerificationCode: insertHospital.ownerVerificationCode ?? null
    }).returning();
    return result[0];
  }

  async updateHospital(id: string, updateData: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const result = await db.update(hospitals)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(hospitals.id, id))
      .returning();
    return result[0];
  }

  async deleteHospital(id: string): Promise<boolean> {
    const result = await db.delete(hospitals)
      .where(eq(hospitals.id, id))
      .returning();
    return result.length > 0;
  }

  // Hospital Consult Fees
  async getConsultFeesByHospitalId(hospitalId: string): Promise<HospitalConsultFee[]> {
    return await db.select().from(hospitalConsultFees).where(eq(hospitalConsultFees.hospitalId, hospitalId));
  }

  async createConsultFee(insertFee: InsertHospitalConsultFee): Promise<HospitalConsultFee> {
    const result = await db.insert(hospitalConsultFees).values(insertFee).returning();
    return result[0];
  }

  async updateConsultFee(id: string, updateData: Partial<InsertHospitalConsultFee>): Promise<HospitalConsultFee | undefined> {
    const result = await db.update(hospitalConsultFees)
      .set({ ...updateData, lastUpdated: new Date() })
      .where(eq(hospitalConsultFees.id, id))
      .returning();
    return result[0];
  }

  async deleteConsultFee(id: string): Promise<boolean> {
    const result = await db.delete(hospitalConsultFees)
      .where(eq(hospitalConsultFees.id, id))
      .returning();
    return result.length > 0;
  }

  // Hospital Updates
  async getHospitalUpdatesByHospitalId(hospitalId: string): Promise<HospitalUpdate[]> {
    return await db.select().from(hospitalUpdates).where(eq(hospitalUpdates.hospitalId, hospitalId));
  }

  async createHospitalUpdate(insertUpdate: InsertHospitalUpdate): Promise<HospitalUpdate> {
    const result = await db.insert(hospitalUpdates).values(insertUpdate).returning();
    return result[0];
  }

  async updateHospitalUpdate(id: string, updateData: Partial<InsertHospitalUpdate>): Promise<HospitalUpdate | undefined> {
    const result = await db.update(hospitalUpdates)
      .set(updateData)
      .where(eq(hospitalUpdates.id, id))
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
