import { db } from "../server/db";
import { clinics } from "../shared/schema";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const csvPath = path.join(process.cwd(), "attached_assets", "Clinic List - Clinic_1763995869608.csv");

const districtToRegionId: Record<string, string> = {
  "Central, Western and Southern District": "hki-region", "Wan Chai District": "hki-region",
  "Eastern District": "hki-region",
  "Sham Shui Po District": "kln-region", "Yau Tsim Mong District": "kln-region",
  "Kowloon City District": "kln-region", "Wong Tai Sin District": "kln-region",
  "Tai Po District": "nti-region", "Sha Tin District": "nti-region",
  "Tuen Mun District": "nti-region", "Yuen Long District": "nti-region",
  "Sai Kung District": "nti-region", "Islands District": "nti-region",
  "Tsuen Wan District": "nti-region", "Kwai Tsing District": "nti-region",
  "New Territories North District": "nti-region",
};

function formatPhone(phone: string): string {
  if (!phone || phone === "N/A" || phone === "") return "";
  let cleaned = phone.replace(/\s+/g, "");
  if (!cleaned.startsWith("+")) cleaned = "+852" + cleaned;
  return cleaned;
}

async function importAllClinics() {
  console.log("🏥 Importing ALL clinics from CSV...");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(csvContent, {
    columns: true, skip_empty_lines: true, trim: true, relaxColumnCount: true,
  }) as Array<Record<string, string>>;

  console.log(`📊 Found ${records.length} records. Clearing & importing...`);
  
  await db.delete(clinics).execute();
  
  let inserted = 0, skipped = 0;
  
  for (const record of records) {
    const nameEn = record["Name of Vet Clinic (English)"]?.trim();
    const nameZh = record["獸醫診所名稱 (Chinese)"]?.trim();
    const districtEn = record["District"]?.trim();
    
    if (!nameEn && !nameZh) { skipped++; continue; }
    // Skip only permanently closed ones that have "PERMANENTLY CLOSED" in opening time
    if (record["Opening Time"]?.includes("PERMANENTLY CLOSED")) { skipped++; continue; }
    
    const regionId = districtToRegionId[districtEn] || "hki-region";
    
    try {
      await db.insert(clinics).values({
        name: nameEn || "",
        nameZh: nameZh || "",
        address: record["Address"]?.trim() || "",
        addressZh: record["營業地址"]?.trim() || "",
        regionId: regionId,
        phone: formatPhone(record["Call Phone Number"]?.trim() || "") || "",
        whatsapp: formatPhone(record["WhatsApp Number"]?.trim() || "") || "",
        email: record["Website "]?.trim() || "",
        is24Hour: record["24 hours"]?.trim().toUpperCase() === "Y",
      }).execute();
      inserted++;
    } catch (err: any) {
      if (err.code !== "23505") console.error(`Error: ${nameEn}:`, err.message.slice(0, 100));
      skipped++;
    }
  }
  
  console.log(`\n✅ Imported: ${inserted} clinics, Skipped: ${skipped}`);
}

importAllClinics().catch(console.error).then(() => process.exit(0));
