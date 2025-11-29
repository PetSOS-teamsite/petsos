import { db } from "./db";
import {
  regions,
  hospitals,
  clinics,
  countries,
} from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Seed Hong Kong region if not exists
    const existingRegions = await db.select().from(regions).limit(1);
    
    if (existingRegions.length === 0) {
      console.log("🌍 Seeding countries...");
      const hkCountry = await db
        .insert(countries)
        .values({
          code: "HK",
          nameEn: "Hong Kong",
          nameZh: "香港",
          region: "asia",
          active: true,
          phonePrefix: "+852",
          flag: "🇭🇰",
        })
        .returning();

      const countryId = hkCountry[0]?.id || "country-hk";
      console.log("✅ Country seeded:", hkCountry[0]?.nameEn);

      console.log("📍 Seeding regions...");
      const hkRegion = await db
        .insert(regions)
        .values({
          countryId: countryId as string,
          code: "HK",
          nameEn: "Hong Kong",
          nameZh: "香港",
          countryCode: "HK",
          active: true,
          phonePrefix: "+852",
          flag: "🇭🇰",
        })
        .returning();
      
      console.log("✅ Region seeded:", hkRegion[0]?.nameEn);
      
      const regionId = hkRegion[0]?.id || "hk-region-1";

      // Seed hospitals
      console.log("🏥 Seeding hospitals...");
      const hospitalData = [
        {
          id: "hosp-1",
          slug: "emergency-vet-central",
          nameEn: "Emergency Vet Central",
          nameZh: "中環寵物急症室",
          addressEn: "123 Central Street, Hong Kong",
          addressZh: "香港中環街123號",
          regionId,
          phone: "25551234",
          email: "info@emergencyvet.hk",
          open247: true,
          isAvailable: true,
          isPartner: true,
          verified: true,
        },
        {
          id: "hosp-2",
          slug: "cross-harbor-emergency",
          nameEn: "Cross Harbor Emergency Clinic",
          nameZh: "跨境急症診所",
          addressEn: "456 Harbor Road, Kowloon",
          addressZh: "九龍港灣道456號",
          regionId,
          phone: "27778888",
          email: "info@crossharbor.hk",
          open247: true,
          isAvailable: true,
          isPartner: true,
          verified: true,
        },
        {
          id: "hosp-3",
          slug: "new-territories-vets",
          nameEn: "New Territories Veterinary Hospital",
          nameZh: "新界獸醫醫院",
          addressEn: "789 New Town Road, New Territories",
          addressZh: "新界新鎮道789號",
          regionId,
          phone: "26699999",
          email: "info@ntvets.hk",
          open247: true,
          isAvailable: true,
          isPartner: false,
          verified: true,
        },
      ];

      for (const hospital of hospitalData) {
        try {
          const result = await db.insert(hospitals).values(hospital).returning();
          console.log("✅ Hospital seeded:", result[0]?.nameEn);
        } catch (error) {
          console.log("ℹ️  Hospital may already exist:", hospital.nameEn);
        }
      }

      // Seed clinics
      console.log("🏪 Seeding clinics...");
      const clinicData = [
        {
          id: "clinic-1",
          name: "Central Pet Clinic",
          nameZh: "中環寵物診所",
          address: "100 Central, Hong Kong",
          addressZh: "香港中環100號",
          phone: "25559999",
          regionId,
          is24Hour: true,
          isAvailable: true,
          status: "active" as const,
        },
        {
          id: "clinic-2",
          name: "Kowloon Emergency Clinic",
          nameZh: "九龍急症診所",
          address: "200 Kowloon Ave, Kowloon",
          addressZh: "九龍尖沙咀200號",
          phone: "27775555",
          regionId,
          is24Hour: true,
          isAvailable: true,
          status: "active" as const,
        },
        {
          id: "clinic-3",
          name: "Island East Veterinary",
          nameZh: "島東獸醫",
          address: "300 Island East, Hong Kong",
          addressZh: "香港東港島300號",
          phone: "28882222",
          regionId,
          is24Hour: false,
          isAvailable: true,
          status: "active" as const,
        },
      ];

      for (const clinic of clinicData) {
        try {
          const result = await db.insert(clinics).values(clinic).returning();
          console.log("✅ Clinic seeded:", result[0]?.name);
        } catch (error) {
          console.log("ℹ️  Clinic may already exist:", clinic.name);
        }
      }
    } else {
      console.log("✅ Database already seeded, skipping...");
    }

    console.log("🎉 Database seeding complete!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}
