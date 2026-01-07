import { db } from "../db";
import { hospitals, clinics } from "../../shared/schema";
import { isNull, or, eq } from "drizzle-orm";

interface GeocodeResult {
  latitude: string;
  longitude: string;
  formattedAddress: string;
}

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BATCH_SIZE = 5;
const DELAY_MS = 250; // Rate limiting delay between requests

function normalizeHongKongAddress(address: string): string {
  let normalized = address.trim();
  
  // Check if address already has Hong Kong suffix
  const hkSuffixes = [
    "Hong Kong",
    "hong kong",
    "HONG KONG",
    ", HK",
    ",HK",
    " HK",
  ];
  
  const hasHKSuffix = hkSuffixes.some(suffix => 
    normalized.toLowerCase().endsWith(suffix.toLowerCase())
  );
  
  if (!hasHKSuffix) {
    // Add Hong Kong suffix for better geocoding accuracy
    normalized += ", Hong Kong";
  } else {
    // Expand abbreviated HK to full name for better geocoding
    if (normalized.endsWith(", HK") || normalized.endsWith(",HK")) {
      normalized = normalized.replace(/,?\s*HK$/i, ", Hong Kong");
    } else if (normalized.endsWith(" HK") && !normalized.toLowerCase().endsWith("hong kong")) {
      normalized = normalized.replace(/ HK$/i, ", Hong Kong");
    }
  }
  
  // Expand common abbreviations
  normalized = normalized
    .replace(/\bN\.T\.?\b/gi, "New Territories")
    .replace(/\bKLN\.?\b/gi, "Kowloon")
    .replace(/\bG\/F\b/gi, "Ground Floor")
    .replace(/\bUG\/F\b/gi, "Upper Ground Floor")
    .replace(/\b1\/F\b/gi, "1st Floor")
    .replace(/\b2\/F\b/gi, "2nd Floor")
    .replace(/\b3\/F\b/gi, "3rd Floor");
  
  return normalized;
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set in environment variables");
  }

  const normalizedAddress = normalizeHongKongAddress(address);
  console.log(`  Normalized address: ${normalizedAddress}`);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    normalizedAddress
  )}&key=${GOOGLE_MAPS_API_KEY}&region=hk`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      // Validate coordinates are within Hong Kong bounds (roughly)
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);
      
      // Hong Kong approximate bounds: 22.1-22.6 lat, 113.8-114.5 lng
      if (lat < 22.0 || lat > 22.7 || lng < 113.7 || lng > 114.6) {
        console.log(`  ⚠️ Warning: Coordinates outside Hong Kong bounds (${lat}, ${lng})`);
      }

      return {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        formattedAddress,
      };
    } else if (data.status === "ZERO_RESULTS") {
      console.log(`  No results found for address`);
      return null;
    } else if (data.status === "OVER_QUERY_LIMIT") {
      console.log(`  ⚠️ API rate limit exceeded, waiting...`);
      await delay(2000);
      return null;
    } else {
      console.error(`  Geocoding failed: ${data.status} - ${data.error_message || ""}`);
      return null;
    }
  } catch (error) {
    console.error(`  Error geocoding address:`, error);
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ProcessResult {
  success: number;
  failed: number;
  failedItems: { id: string; name: string; address: string }[];
}

async function geocodeHospitals(): Promise<ProcessResult> {
  console.log("\n" + "=".repeat(60));
  console.log("🏥 GEOCODING HOSPITALS");
  console.log("=".repeat(60));

  const hospitalsWithoutGPS = await db
    .select({
      id: hospitals.id,
      name: hospitals.nameEn,
      address: hospitals.addressEn,
    })
    .from(hospitals)
    .where(or(isNull(hospitals.latitude), isNull(hospitals.longitude)));

  console.log(`Found ${hospitalsWithoutGPS.length} hospitals without GPS coordinates\n`);

  if (hospitalsWithoutGPS.length === 0) {
    console.log("✓ All hospitals already have GPS coordinates!");
    return { success: 0, failed: 0, failedItems: [] };
  }

  let success = 0;
  let failed = 0;
  const failedItems: { id: string; name: string; address: string }[] = [];

  for (let i = 0; i < hospitalsWithoutGPS.length; i++) {
    const hospital = hospitalsWithoutGPS[i];
    console.log(`\n[${i + 1}/${hospitalsWithoutGPS.length}] ${hospital.name}`);
    console.log(`  Original address: ${hospital.address}`);

    const result = await geocodeAddress(hospital.address);

    if (result) {
      try {
        await db
          .update(hospitals)
          .set({
            latitude: result.latitude,
            longitude: result.longitude,
          })
          .where(eq(hospitals.id, hospital.id));

        console.log(`  ✓ Updated: Lat ${result.latitude}, Lng ${result.longitude}`);
        console.log(`  ✓ Google formatted: ${result.formattedAddress}`);
        success++;
      } catch (error) {
        console.error(`  ✗ Database update failed:`, error);
        failed++;
        failedItems.push({
          id: hospital.id,
          name: hospital.name,
          address: hospital.address,
        });
      }
    } else {
      console.log(`  ✗ Geocoding failed`);
      failed++;
      failedItems.push({
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
      });
    }

    await delay(DELAY_MS);
  }

  return { success, failed, failedItems };
}

async function geocodeClinics(): Promise<ProcessResult> {
  console.log("\n" + "=".repeat(60));
  console.log("🏪 GEOCODING CLINICS");
  console.log("=".repeat(60));

  const clinicsWithoutGPS = await db
    .select({
      id: clinics.id,
      name: clinics.name,
      address: clinics.address,
    })
    .from(clinics)
    .where(or(isNull(clinics.latitude), isNull(clinics.longitude)));

  console.log(`Found ${clinicsWithoutGPS.length} clinics without GPS coordinates\n`);

  if (clinicsWithoutGPS.length === 0) {
    console.log("✓ All clinics already have GPS coordinates!");
    return { success: 0, failed: 0, failedItems: [] };
  }

  let success = 0;
  let failed = 0;
  const failedItems: { id: string; name: string; address: string }[] = [];

  for (let i = 0; i < clinicsWithoutGPS.length; i += BATCH_SIZE) {
    const batch = clinicsWithoutGPS.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(clinicsWithoutGPS.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} clinics)`);

    for (const clinic of batch) {
      const clinicIndex = clinicsWithoutGPS.indexOf(clinic);
      console.log(`\n[${clinicIndex + 1}/${clinicsWithoutGPS.length}] ${clinic.name}`);
      console.log(`  Original address: ${clinic.address}`);

      const result = await geocodeAddress(clinic.address);

      if (result) {
        try {
          await db
            .update(clinics)
            .set({
              latitude: result.latitude,
              longitude: result.longitude,
            })
            .where(eq(clinics.id, clinic.id));

          console.log(`  ✓ Updated: Lat ${result.latitude}, Lng ${result.longitude}`);
          console.log(`  ✓ Google formatted: ${result.formattedAddress}`);
          success++;
        } catch (error) {
          console.error(`  ✗ Database update failed:`, error);
          failed++;
          failedItems.push({
            id: clinic.id,
            name: clinic.name,
            address: clinic.address,
          });
        }
      } else {
        console.log(`  ✗ Geocoding failed`);
        failed++;
        failedItems.push({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
        });
      }

      await delay(DELAY_MS);
    }

    console.log(`\n✓ Batch ${batchNum} complete: ${success} total successes so far`);
  }

  return { success, failed, failedItems };
}

async function main() {
  console.log("🚀 Starting geocoding of hospitals and clinics...");
  console.log(`📅 ${new Date().toISOString()}\n`);

  if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ GOOGLE_MAPS_API_KEY environment variable is not set!");
    console.error("Please set the API key and try again.");
    process.exit(1);
  }

  console.log("✓ Google Maps API key found");

  // Process hospitals first (smaller dataset)
  const hospitalResults = await geocodeHospitals();

  // Then process clinics
  const clinicResults = await geocodeClinics();

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(60));
  
  console.log("\n🏥 Hospitals:");
  console.log(`   ✓ Successfully geocoded: ${hospitalResults.success}`);
  console.log(`   ✗ Failed: ${hospitalResults.failed}`);
  
  console.log("\n🏪 Clinics:");
  console.log(`   ✓ Successfully geocoded: ${clinicResults.success}`);
  console.log(`   ✗ Failed: ${clinicResults.failed}`);
  
  const totalSuccess = hospitalResults.success + clinicResults.success;
  const totalFailed = hospitalResults.failed + clinicResults.failed;
  
  console.log("\n📈 Total:");
  console.log(`   ✓ Successfully geocoded: ${totalSuccess}`);
  console.log(`   ✗ Failed: ${totalFailed}`);
  console.log("=".repeat(60));

  // List failed items
  if (hospitalResults.failedItems.length > 0) {
    console.log("\n⚠️ Failed hospitals:");
    hospitalResults.failedItems.forEach((item) => {
      console.log(`   - ${item.name}`);
      console.log(`     Address: ${item.address}`);
    });
  }

  if (clinicResults.failedItems.length > 0) {
    console.log("\n⚠️ Failed clinics:");
    clinicResults.failedItems.forEach((item) => {
      console.log(`   - ${item.name}`);
      console.log(`     Address: ${item.address}`);
    });
  }

  console.log("\n✅ Geocoding complete!");
}

main()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
