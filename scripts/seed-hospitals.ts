import { db } from "../server/db";
import { hospitals, hospitalConsultFees, regions } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedHospitals() {
  console.log("🏥 Starting hospital seeding...");

  // Get regions
  const allRegions = await db.select().from(regions);
  const hkiRegion = allRegions.find(r => r.code === 'HKI');
  const klnRegion = allRegions.find(r => r.code === 'KLN');
  const ntiRegion = allRegions.find(r => r.code === 'NTI');

  if (!hkiRegion || !klnRegion || !ntiRegion) {
    console.error("❌ Regions not found. Please run seed-countries.ts first.");
    return;
  }

  // Sample hospitals data
  const hospitalsData = [
    {
      slug: "central-animal-hospital",
      nameEn: "Central Animal Hospital",
      nameZh: "中環動物醫院",
      addressEn: "123 Queen's Road Central, Central, Hong Kong",
      addressZh: "香港中環皇后大道中123號",
      regionId: hkiRegion.id,
      latitude: "22.2820",
      longitude: "114.1585",
      phone: "+85225551234",
      whatsapp: "+85291234567",
      websiteUrl: "https://example.com/central-animal-hospital",
      open247: true,
      liveStatus: "normal",
      onSiteVet247: true,
      triagePolicy: "First-come-first-served with priority for critical cases",
      typicalWaitBand: "30-60 minutes",
      isolationWard: true,
      ambulanceSupport: false,
      icuLevel: "Level 3 - Full ICU with oxygen, monitoring",
      nurse24h: true,
      ownerVisitPolicy: "Scheduled visits allowed 10am-8pm",
      eolSupport: true,
      imagingXray: true,
      imagingUS: true,
      imagingCT: true,
      sameDayCT: true,
      inHouseLab: true,
      extLabCutoff: "2pm for next-day results",
      bloodBankAccess: "Direct access to HK Vet Blood Bank",
      sxEmergencySoft: true,
      sxEmergencyOrtho: true,
      anaesMonitoring: "Multi-parameter monitoring during all procedures",
      specialistAvail: "On-call specialists for surgery, internal medicine",
      speciesAccepted: ["Dog", "Cat", "Rabbit", "Guinea Pig"],
      whatsappTriage: true,
      languages: ["English", "Cantonese", "Mandarin"],
      parking: true,
      wheelchairAccess: true,
      payMethods: ["Cash", "Credit Card", "FPS", "Bank Transfer"],
      admissionDeposit: true,
      depositBand: "HKD 5,000 - 15,000",
      insuranceSupport: ["OneDegree", "Blue Cross", "Bow Wow Meow"],
      recheckWindow: "Free recheck within 48 hours",
      refundPolicy: "Deposit refund within 7 days after discharge",
      lastVerifiedAt: new Date("2024-11-01"),
    },
    {
      slug: "kowloon-24h-vet",
      nameEn: "Kowloon 24H Veterinary Clinic",
      nameZh: "九龍24小時獸醫診所",
      addressEn: "456 Nathan Road, Tsim Sha Tsui, Kowloon",
      addressZh: "九龍尖沙咀彌敦道456號",
      regionId: klnRegion.id,
      latitude: "22.2980",
      longitude: "114.1722",
      phone: "+85227778888",
      whatsapp: "+85298765432",
      open247: true,
      liveStatus: "busy",
      onSiteVet247: true,
      triagePolicy: "Color-coded triage system - Red/Yellow/Green",
      typicalWaitBand: "45-90 minutes",
      isolationWard: true,
      ambulanceSupport: true,
      icuLevel: "Level 2 - Basic ICU",
      nurse24h: true,
      ownerVisitPolicy: "Video call updates only",
      eolSupport: true,
      imagingXray: true,
      imagingUS: true,
      imagingCT: false,
      sameDayCT: false,
      inHouseLab: true,
      bloodBankAccess: "Partner access",
      sxEmergencySoft: true,
      sxEmergencyOrtho: false,
      anaesMonitoring: "Standard monitoring",
      specialistAvail: "Referral to partner specialists",
      speciesAccepted: ["Dog", "Cat"],
      whatsappTriage: true,
      languages: ["English", "Cantonese"],
      parking: false,
      wheelchairAccess: true,
      payMethods: ["Cash", "Credit Card", "FPS"],
      admissionDeposit: true,
      depositBand: "HKD 3,000 - 10,000",
      insuranceSupport: ["OneDegree"],
      recheckWindow: "Free recheck within 24 hours",
      lastVerifiedAt: new Date("2024-10-28"),
    },
    {
      slug: "sha-tin-emergency-vet",
      nameEn: "Sha Tin Emergency Veterinary Center",
      nameZh: "沙田緊急獸醫中心",
      addressEn: "789 Sha Tin Centre Street, Sha Tin, New Territories",
      addressZh: "新界沙田沙田中心街789號",
      regionId: ntiRegion.id,
      latitude: "22.3817",
      longitude: "114.1878",
      phone: "+85226667777",
      whatsapp: "+85296543210",
      open247: true,
      liveStatus: "normal",
      onSiteVet247: true,
      triagePolicy: "Emergency cases prioritized",
      typicalWaitBand: "20-45 minutes",
      isolationWard: false,
      ambulanceSupport: false,
      icuLevel: "Level 1 - Basic monitoring",
      nurse24h: false,
      ownerVisitPolicy: "Open visiting 9am-9pm",
      eolSupport: false,
      imagingXray: true,
      imagingUS: false,
      imagingCT: false,
      inHouseLab: false,
      extLabCutoff: "5pm for next-day results",
      sxEmergencySoft: true,
      sxEmergencyOrtho: false,
      speciesAccepted: ["Dog", "Cat", "Bird"],
      whatsappTriage: false,
      languages: ["Cantonese", "Mandarin"],
      parking: true,
      wheelchairAccess: false,
      payMethods: ["Cash", "FPS"],
      admissionDeposit: true,
      depositBand: "HKD 2,000 - 5,000",
      insuranceSupport: [],
      lastVerifiedAt: new Date("2024-10-20"),
    },
  ];

  // Insert hospitals
  const insertedHospitals = [];
  for (const hospitalData of hospitalsData) {
    const [hospital] = await db.insert(hospitals).values(hospitalData).returning();
    insertedHospitals.push(hospital);
    console.log(`✅ Inserted hospital: ${hospital.nameEn}`);
  }

  // Sample consult fees
  const consultFeesData = [];
  
  for (const hospital of insertedHospitals) {
    // Dog fees
    consultFeesData.push(
      {
        hospitalId: hospital.id,
        feeType: "day",
        species: "dog",
        minFee: "500",
        maxFee: "800",
        currency: "HKD",
        notes: "Weekdays 9am-6pm",
      },
      {
        hospitalId: hospital.id,
        feeType: "evening",
        species: "dog",
        minFee: "800",
        maxFee: "1200",
        currency: "HKD",
        notes: "Weekdays 6pm-11pm, Weekends 9am-11pm",
      },
      {
        hospitalId: hospital.id,
        feeType: "night_ph",
        species: "dog",
        minFee: "1200",
        maxFee: "1800",
        currency: "HKD",
        notes: "11pm-9am, Public Holidays",
      }
    );

    // Cat fees
    consultFeesData.push(
      {
        hospitalId: hospital.id,
        feeType: "day",
        species: "cat",
        minFee: "450",
        maxFee: "700",
        currency: "HKD",
        notes: "Weekdays 9am-6pm",
      },
      {
        hospitalId: hospital.id,
        feeType: "evening",
        species: "cat",
        minFee: "700",
        maxFee: "1000",
        currency: "HKD",
        notes: "Weekdays 6pm-11pm, Weekends 9am-11pm",
      },
      {
        hospitalId: hospital.id,
        feeType: "night_ph",
        species: "cat",
        minFee: "1000",
        maxFee: "1500",
        currency: "HKD",
        notes: "11pm-9am, Public Holidays",
      }
    );
  }

  // Insert consult fees
  for (const feeData of consultFeesData) {
    await db.insert(hospitalConsultFees).values(feeData);
  }
  console.log(`✅ Inserted ${consultFeesData.length} consult fees`);

  console.log("✅ Hospital seeding completed!");
}

seedHospitals()
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding hospitals:", error);
    process.exit(1);
  });
