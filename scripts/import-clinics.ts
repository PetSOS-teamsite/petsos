import XLSX from 'xlsx';
import { db } from '../server/db';
import { regions, clinics } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';

const EXCEL_FILE_PATH = 'attached_assets/Clinic List (1)_1759485517119.xlsx';

async function importData() {
  console.log('Starting clinic data import...\n');

  // Preflight check: Verify Excel file exists
  if (!existsSync(EXCEL_FILE_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`);
  }
  console.log('✓ Excel file found\n');

  // Step 1: Get or create regions
  console.log('Setting up regions...');
  const regionData = [
    { code: 'HKI', nameEn: 'Hong Kong Island', nameZh: '港島', country: 'HK', active: true },
    { code: 'KLN', nameEn: 'Kowloon', nameZh: '九龍', country: 'HK', active: true },
    { code: 'NTI', nameEn: 'New Territories', nameZh: '新界', country: 'HK', active: true },
  ];

  const regionMap: Record<string, string> = {};
  
  for (const region of regionData) {
    // Check if region exists
    const existing = await db.select().from(regions).where(eq(regions.code, region.code)).limit(1);
    
    if (existing.length > 0) {
      regionMap[region.nameEn] = existing[0].id;
      console.log(`✓ Found existing region: ${region.nameEn} (${region.code})`);
    } else {
      const [inserted] = await db.insert(regions).values(region).returning();
      regionMap[region.nameEn] = inserted.id;
      console.log(`✓ Created region: ${region.nameEn} (${region.code})`);
    }
  }

  // Step 2: Read and validate Excel file BEFORE any database changes
  console.log('Reading clinic data from Excel...');
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  
  if (!sheetName) {
    throw new Error('Excel file has no sheets');
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  if (data.length === 0) {
    throw new Error('Excel file contains no data rows');
  }

  console.log(`✓ Found ${data.length} clinics to import\n`);

  // Step 3: Prepare clinic data (validate before transaction)
  const clinicsToImport: Array<{
    name: string;
    nameZh: string | null;
    address: string;
    addressZh: string | null;
    phone: string;
    whatsapp: string | null;
    email: null;
    regionId: string;
    is24Hour: boolean;
    latitude: null;
    longitude: null;
    status: 'active';
    services: never[];
  }> = [];
  let validationErrors = 0;

  for (const row of data as any[]) {
    // Map location to region code
    let regionId: string;
    if (row['Location'] === 'Hong Kong Island') {
      regionId = regionMap['Hong Kong Island'];
    } else if (row['Location'] === 'Kowloon') {
      regionId = regionMap['Kowloon'];
    } else if (row['Location'] === 'New Territories') {
      regionId = regionMap['New Territories'];
    } else {
      console.warn(`Unknown location: ${row['Location']}, skipping row`);
      validationErrors++;
      continue;
    }

    // Parse WhatsApp number (handle N/A and numeric values)
    let whatsapp: string | null = null;
    if (row['WhatsApp Number'] && row['WhatsApp Number'] !== 'N/A') {
      whatsapp = String(row['WhatsApp Number']).replace(/\s/g, '');
      if (!whatsapp.startsWith('+')) {
        whatsapp = '+' + whatsapp;
      }
    }

    // Parse 24-hour status
    const is24Hour = row['24 hours'] === 'Y';

    // Clean phone number
    let phone = String(row['Call Phone Number'] || '').trim();
    if (phone && !phone.startsWith('+852')) {
      phone = '+852 ' + phone;
    }

    const clinicData = {
      name: String(row['Name of Vet Clinic (English)'] || '').trim(),
      nameZh: String(row['獸醫診所名稱 (Chinese)'] || '').trim() || null,
      address: String(row['Address'] || '').trim(),
      addressZh: String(row['營業地址'] || '').trim() || null,
      phone: phone,
      whatsapp: whatsapp,
      email: null,
      regionId: regionId,
      is24Hour: is24Hour,
      latitude: null,
      longitude: null,
      status: 'active' as const,
      services: [],
    };

    // Skip if name is missing
    if (!clinicData.name) {
      console.warn('Skipping clinic with no name');
      validationErrors++;
      continue;
    }

    clinicsToImport.push(clinicData);
  }

  console.log(`\n✓ Validated ${clinicsToImport.length} clinics (${validationErrors} errors)\n`);

  // Step 4: Execute import in a transaction
  console.log('Starting database transaction...');
  
  try {
    await db.transaction(async (tx) => {
      // Clear existing clinics
      const existingClinics = await tx.select().from(clinics);
      if (existingClinics.length > 0) {
        console.log(`⚠️  Clearing ${existingClinics.length} existing clinics...`);
        await tx.delete(clinics);
      }

      // Import all clinics
      let imported = 0;
      for (const clinicData of clinicsToImport) {
        await tx.insert(clinics).values(clinicData);
        imported++;
        
        if (imported % 20 === 0) {
          console.log(`Progress: ${imported}/${clinicsToImport.length} clinics imported...`);
        }
      }

      console.log(`✓ Transaction complete: ${imported} clinics imported`);
    });
  } catch (error) {
    console.error('\n✗ Transaction failed - database rolled back:', error);
    throw error;
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Successfully imported: ${clinicsToImport.length} clinics`);
  console.log(`✗ Validation errors: ${validationErrors} rows`);
  console.log(`Total rows processed: ${data.length}`);
}

// Run the import
importData()
  .then(() => {
    console.log('\n✓ Import finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Import failed:', error);
    process.exit(1);
  });
