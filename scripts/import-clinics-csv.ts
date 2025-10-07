import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { regions, clinics } from '../shared/schema';
import { eq } from 'drizzle-orm';

// CSV file path - can be passed as command line argument
const CSV_FILE_PATH = process.argv[2] || 'attached_assets/clinics.csv';

async function importFromCSV() {
  console.log('Starting CSV clinic data import...\n');

  // Preflight check: Verify CSV file exists
  if (!existsSync(CSV_FILE_PATH)) {
    throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
  }
  console.log(`✓ CSV file found: ${CSV_FILE_PATH}\n`);

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

  // Step 2: Read and parse CSV file
  console.log('\nReading clinic data from CSV...');
  const fileContent = readFileSync(CSV_FILE_PATH, 'utf-8');
  
  const data = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (data.length === 0) {
    throw new Error('CSV file contains no data rows');
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
    email: string | null;
    regionId: string;
    is24Hour: boolean;
    latitude: string | null;
    longitude: string | null;
    status: 'active';
    services: never[];
  }> = [];
  let validationErrors = 0;

  for (const row of data as any[]) {
    // Helper function to get field value from multiple possible column names (case-insensitive)
    const getField = (row: any, ...names: string[]): any => {
      for (const name of names) {
        if (row[name] !== undefined && row[name] !== null) return row[name];
      }
      // Try case-insensitive match
      const lowerRow: Record<string, any> = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
      );
      for (const name of names) {
        const lower = name.toLowerCase();
        if (lowerRow[lower] !== undefined && lowerRow[lower] !== null) return lowerRow[lower];
      }
      return undefined;
    };

    // Map location to region code (supports multiple column name formats)
    const locationField = getField(row, 'Location', 'location', 'Region', 'region');
    let regionId: string;
    
    if (locationField === 'Hong Kong Island' || locationField === 'HKI' || locationField === '港島') {
      regionId = regionMap['Hong Kong Island'];
    } else if (locationField === 'Kowloon' || locationField === 'KLN' || locationField === '九龍') {
      regionId = regionMap['Kowloon'];
    } else if (locationField === 'New Territories' || locationField === 'NTI' || locationField === '新界') {
      regionId = regionMap['New Territories'];
    } else {
      console.warn(`Unknown location: ${locationField}, skipping row`);
      validationErrors++;
      continue;
    }

    // Parse WhatsApp number (handle N/A, empty, and numeric values)
    let whatsapp: string | null = null;
    const whatsappField = getField(row, 'WhatsApp Number', 'WhatsApp', 'whatsapp');
    if (whatsappField && whatsappField !== 'N/A' && whatsappField !== '') {
      whatsapp = String(whatsappField).replace(/\s/g, '');
      if (!whatsapp.startsWith('+')) {
        whatsapp = '+' + whatsapp;
      }
    }

    // Parse 24-hour status
    const is24HourField = getField(row, '24 hours', '24_hours', 'is_24_hour', 'is24Hour');
    const is24Hour = is24HourField === 'Y' || is24HourField === 'Yes' || is24HourField === 'yes' || 
                     is24HourField === 'true' || is24HourField === '1' || is24HourField === 'TRUE' || 
                     is24HourField === true || is24HourField === 1;

    // Get and validate phone number
    const phoneField = getField(row, 'Call Phone Number', 'Phone', 'phone', 'Call');
    let phone = String(phoneField || '').trim();
    
    if (!phone) {
      console.warn('Skipping clinic with no phone number');
      validationErrors++;
      continue;
    }
    
    if (phone && !phone.startsWith('+852')) {
      phone = '+852 ' + phone;
    }

    // Parse email
    const emailField = getField(row, 'Email', 'email', 'E-mail');
    const email = emailField && String(emailField).trim() !== '' ? String(emailField).trim() : null;

    // Parse coordinates if available
    const latField = getField(row, 'Latitude', 'latitude', 'lat');
    const lngField = getField(row, 'Longitude', 'longitude', 'lng', 'lon');
    const latitude = latField && String(latField).trim() !== '' ? String(latField).trim() : null;
    const longitude = lngField && String(lngField).trim() !== '' ? String(lngField).trim() : null;

    // Get clinic names
    const nameField = getField(row, 'Name of Vet Clinic (English)', 'Name', 'name', 'clinic_name');
    const nameZhField = getField(row, '獸醫診所名稱 (Chinese)', 'Name (Chinese)', 'name_zh', 'chinese_name');

    // Get addresses
    const addressField = getField(row, 'Address', 'Address (English)', 'address');
    const addressZhField = getField(row, '營業地址', 'Address (Chinese)', 'address_zh', 'chinese_address');

    const clinicData = {
      name: String(nameField || '').trim(),
      nameZh: String(nameZhField || '').trim() || null,
      address: String(addressField || '').trim(),
      addressZh: String(addressZhField || '').trim() || null,
      phone: phone,
      whatsapp: whatsapp,
      email: email,
      regionId: regionId,
      is24Hour: is24Hour,
      latitude: latitude,
      longitude: longitude,
      status: 'active' as const,
      services: [],
    };

    // Skip if name or address is missing
    if (!clinicData.name) {
      console.warn('Skipping clinic with no name');
      validationErrors++;
      continue;
    }

    if (!clinicData.address) {
      console.warn(`Skipping clinic "${clinicData.name}" with no address`);
      validationErrors++;
      continue;
    }

    clinicsToImport.push(clinicData);
  }

  console.log(`\n✓ Validated ${clinicsToImport.length} clinics (${validationErrors} errors)\n`);

  // Guard: Prevent zero-import scenarios
  if (clinicsToImport.length === 0) {
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.error('\n❌ ERROR: No valid clinics to import after validation!');
      console.error('Cannot proceed with --clear flag as this would delete all existing clinics.');
      console.error('Please fix validation errors in your CSV file and try again.');
      throw new Error('Zero-import prevented with --clear flag to avoid data loss');
    } else {
      console.warn('\n⚠️  WARNING: No valid clinics to import after validation.');
      console.warn('No changes will be made to the database.');
      console.warn('Please fix validation errors in your CSV file and try again.');
      process.exit(1);
    }
  }

  // Step 4: Execute import in a transaction
  console.log('Starting database transaction...');
  
  try {
    await db.transaction(async (tx) => {
      // Check if we should clear existing clinics
      const clearExisting = process.argv.includes('--clear');
      
      if (clearExisting) {
        const existingClinics = await tx.select().from(clinics);
        if (existingClinics.length > 0) {
          console.log(`⚠️  Clearing ${existingClinics.length} existing clinics...`);
          await tx.delete(clinics);
        }
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
  console.log('\nNote: If coordinates are missing, run bulk geocoding script:');
  console.log('  tsx scripts/bulk-geocode-clinics.ts');
}

// Run the import
importFromCSV()
  .then(() => {
    console.log('\n✓ Import finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Import failed:', error);
    process.exit(1);
  });
