import { db } from "../server/db";
import { hospitals } from "../shared/schema";
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

function createSlug(nameEn: string, nameZh: string): string {
  return (nameEn || nameZh).toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function formatPhone(phone: string): string {
  if (!phone || phone === "N/A" || phone === "") return "";
  let cleaned = phone.replace(/\s+/g, "");
  if (!cleaned.startsWith("+")) cleaned = "+852" + cleaned;
  return cleaned;
}

async function importFromCsv() {
  console.log("🏥 Reading CSV...");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(csvContent, {
    columns: true, skip_empty_lines: true, trim: true, relaxColumnCount: true,
  }) as Array<Record<string, string>>;

  console.log(`📊 Found ${records.length} records. Clearing & importing...`);
  
  await db.delete(hospitals).execute();
  
  let inserted = 0, skipped = 0;
  
  for (const record of records) {
    const nameEn = record["Name of Vet Clinic (English)"]?.trim();
    const nameZh = record["獸醫診所名稱 (Chinese)"]?.trim();
    const districtEn = record["District"]?.trim();
    const openingTime = record["Opening Time"]?.trim() || "";
    
    if (!nameEn && !nameZh) { skipped++; continue; }
    if (nameEn?.includes("CLOSED") || openingTime.includes("PERMANENTLY CLOSED")) { skipped++; continue; }
    
    const regionId = districtToRegionId[districtEn] || "hki-region";
    
    try {
      // Use camelCase property names (not snake_case database column names)
      await db.insert(hospitals).values({
        nameEn: nameEn || "",
        nameZh: nameZh || "",
        addressEn: record["Address"]?.trim() || "",
        addressZh: record["營業地址"]?.trim() || "",
        regionId: regionId,
        phone: formatPhone(record["Call Phone Number"]?.trim() || "") || null,
        whatsapp: formatPhone(record["WhatsApp Number"]?.trim() || "") || null,
        websiteUrl: record["Website "]?.trim() || null,
        open247: record["24 hours"]?.trim().toUpperCase() === "Y",
        slug: createSlug(nameEn || "", nameZh || ""),
      }).execute();
      inserted++;
    } catch (err: any) {
      if (err.code !== "23505") console.error(`Error: ${nameEn}:`, err.message.slice(0, 100));
      skipped++;
    }
  }
  
  console.log(`\n✅ Imported: ${inserted} hospitals, Skipped: ${skipped}`);
}

importFromCsv().catch(console.error).then(() => process.exit(0));
