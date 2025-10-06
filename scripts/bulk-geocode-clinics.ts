import { db } from "../server/db";
import { clinics } from "../shared/schema";
import { isNull, or, eq } from "drizzle-orm";

interface GeocodeResult {
  latitude: string;
  longitude: string;
  formattedAddress: string;
}

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BATCH_SIZE = 5;
const DELAY_MS = 200;

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      return {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        formattedAddress,
      };
    } else if (data.status === "ZERO_RESULTS") {
      console.log(`No results found for address: ${address}`);
      return null;
    } else {
      console.error(`Geocoding failed for ${address}: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error geocoding address ${address}:`, error);
    return null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function bulkGeocodeClinicsBatch(
  clinicBatch: any[]
): Promise<{ success: number; failed: number; results: any[] }> {
  let success = 0;
  let failed = 0;
  const results: any[] = [];

  for (const clinic of clinicBatch) {
    console.log(
      `\nProcessing: ${clinic.name} (ID: ${clinic.id})`
    );
    console.log(`Address: ${clinic.address}`);

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

        console.log(
          `✓ Updated: ${clinic.name} - Lat: ${result.latitude}, Lng: ${result.longitude}`
        );
        success++;
        results.push({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          status: "success",
          latitude: result.latitude,
          longitude: result.longitude,
        });
      } catch (error) {
        console.error(`✗ Failed to update database for ${clinic.name}:`, error);
        failed++;
        results.push({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          status: "db_error",
          error: String(error),
        });
      }
    } else {
      console.log(`✗ Failed to geocode: ${clinic.name}`);
      failed++;
      results.push({
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        status: "geocode_failed",
      });
    }

    await delay(DELAY_MS);
  }

  return { success, failed, results };
}

async function main() {
  console.log("🚀 Starting bulk geocoding of clinics...\n");

  const clinicsWithoutGPS = await db
    .select()
    .from(clinics)
    .where(or(isNull(clinics.latitude), isNull(clinics.longitude)));

  console.log(`Found ${clinicsWithoutGPS.length} clinics without GPS coordinates\n`);

  if (clinicsWithoutGPS.length === 0) {
    console.log("✓ All clinics already have GPS coordinates!");
    return;
  }

  let totalSuccess = 0;
  let totalFailed = 0;
  const allResults: any[] = [];

  for (let i = 0; i < clinicsWithoutGPS.length; i += BATCH_SIZE) {
    const batch = clinicsWithoutGPS.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(clinicsWithoutGPS.length / BATCH_SIZE);

    console.log(
      `\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} clinics)...`
    );

    const { success, failed, results } = await bulkGeocodeClinicsBatch(batch);
    totalSuccess += success;
    totalFailed += failed;
    allResults.push(...results);

    console.log(
      `\n✓ Batch ${batchNumber} complete: ${success} succeeded, ${failed} failed`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total clinics processed: ${clinicsWithoutGPS.length}`);
  console.log(`✓ Successfully geocoded: ${totalSuccess}`);
  console.log(`✗ Failed to geocode: ${totalFailed}`);
  console.log("=".repeat(60));

  if (totalFailed > 0) {
    console.log("\n⚠️  Failed clinics:");
    allResults
      .filter((r) => r.status !== "success")
      .forEach((r) => {
        console.log(`  - ${r.name} (${r.id}): ${r.status}`);
      });
  }

  console.log("\n✅ Bulk geocoding complete!");
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
