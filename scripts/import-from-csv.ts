import { db } from "../server/db";
import { hospitals } from "../shared/schema";

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const csvPath = path.join(process.cwd(), "attached_assets", "Clinic List - Clinic_1763995869608.csv");

const districtToRegionId: Record<string, string> = {
  "Central, Western and Southern District": "hki-region", "中西及南區": "hki-region",
  "Wan Chai District": "hki-region", "灣仔區": "hki-region",
  "Eastern District": "hki-region", "東區": "hki-region",
  "Sham Shui Po District": "kln-region", "深水埗區": "kln-region",
  "Yau Tsim Mong District": "kln-region", "油尖旺區": "kln-region",
  "Kowloon City District": "kln-region", "九龍城區": "kln-region",
  "Wong Tai Sin District": "kln-region", "黃大仙區": "kln-region",
  "Tai Po District": "nti-region", "大埔區": "nti-region",
  "Sha Tin District": "nti-region", "沙田區": "nti-region",
  "Tuen Mun District": "nti-region", "屯門區": "nti-region",
  "Yuen Long District": "nti-region", "元朗區": "nti-region",
  "Sai Kung District": "nti-region", "西貢區": "nti-region",
  "Islands District": "nti-region", "離島區": "nti-region",
  "Tsuen Wan District": "nti-region", "荃灣區": "nti-region",
  "Kwai Tsing District": "nti-region", "葵青區": "nti-region",
  "New Territories North District": "nti-region", "新界北區": "nti-region",
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
  
  // Delete all existing
  await db.delete(hospitals).execute();
  
  let inserted = 0, skipped = 0;
  
  for (const record of records) {
    const nameEn = record["Name of Vet Clinic (English)"]?.trim();
    const nameZh = record["獸醫診所名稱 (Chinese)"]?.trim();
    const districtEn = record["District"]?.trim();
    
    if (!nameEn && !nameZh) { skipped++; continue; }
    if (nameEn?.includes("CLOSED") || record["Opening Time"]?.includes("PERMANENTLY CLOSED")) { skipped++; continue; }
    
    const regionId = districtToRegionId[districtEn] || "hki-region";
    
    try {
      await db.insert(hospitals).values({
        name_en: nameEn || "",
        name_zh: nameZh || "",
        address_en: record["Address"]?.trim() || "",
        address_zh: record["營業地址"]?.trim() || "",
        region_id: regionId,
        phone: formatPhone(record["Call Phone Number"]?.trim() || "") || null,
        whatsapp: formatPhone(record["WhatsApp Number"]?.trim() || "") || null,
        website_url: record["Website "]?.trim() || null,
        open_247: record["24 hours"]?.trim().toUpperCase() === "Y",
        slug: createSlug(nameEn || "", nameZh || ""),
      }).execute();
      inserted++;
    } catch (err: any) {
      if (err.code !== "23505") console.error(`Error: ${nameEn}:`, err.message);
      skipped++;
    }
  }
  
  console.log(`✅ Inserted: ${inserted}, Skipped: ${skipped}`);
}

importFromCsv().catch(console.error).then(() => process.exit(0));
