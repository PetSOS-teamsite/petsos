import { storage } from "./storage";

export const countriesData = [
  { code: 'HK', nameEn: 'Hong Kong', nameZh: '香港', phonePrefix: '+852', flag: '🇭🇰', active: true, sortOrder: 1, region: 'asia' },
  { code: 'CN', nameEn: 'China', nameZh: '中國', phonePrefix: '+86', flag: '🇨🇳', active: true, sortOrder: 2, region: 'asia' },
  { code: 'TW', nameEn: 'Taiwan', nameZh: '台灣', phonePrefix: '+886', flag: '🇹🇼', active: true, sortOrder: 3, region: 'asia' },
  { code: 'SG', nameEn: 'Singapore', nameZh: '新加坡', phonePrefix: '+65', flag: '🇸🇬', active: true, sortOrder: 4, region: 'asia' },
  { code: 'JP', nameEn: 'Japan', nameZh: '日本', phonePrefix: '+81', flag: '🇯🇵', active: true, sortOrder: 5, region: 'asia' },
  { code: 'KR', nameEn: 'South Korea', nameZh: '韓國', phonePrefix: '+82', flag: '🇰🇷', active: true, sortOrder: 6, region: 'asia' },
  { code: 'US', nameEn: 'United States', nameZh: '美國', phonePrefix: '+1', flag: '🇺🇸', active: true, sortOrder: 7, region: 'americas' },
  { code: 'GB', nameEn: 'United Kingdom', nameZh: '英國', phonePrefix: '+44', flag: '🇬🇧', active: true, sortOrder: 8, region: 'europe' },
  { code: 'CA', nameEn: 'Canada', nameZh: '加拿大', phonePrefix: '+1', flag: '🇨🇦', active: true, sortOrder: 9, region: 'americas' },
  { code: 'AU', nameEn: 'Australia', nameZh: '澳洲', phonePrefix: '+61', flag: '🇦🇺', active: true, sortOrder: 10, region: 'oceania' },
];

export async function seedCountries(): Promise<{ created: number; skipped: number }> {
  console.log("🌍 Seeding countries...");
  
  let created = 0;
  let skipped = 0;
  
  for (const country of countriesData) {
    try {
      const existing = await storage.getCountryByCode(country.code);
      if (existing) {
        skipped++;
      } else {
        await storage.createCountry(country);
        created++;
      }
    } catch (error) {
      console.error(`Error seeding country "${country.code}":`, error);
    }
  }
  
  console.log(`✅ Country seeding complete!`);
  console.log(`   - Created: ${created} countries`);
  console.log(`   - Skipped: ${skipped} existing`);
  
  return { created, skipped };
}

export async function ensureCountriesExist(): Promise<void> {
  try {
    const existingCountries = await storage.getAllCountries();
    if (existingCountries.length === 0) {
      console.log("🌍 No countries found, seeding...");
      await seedCountries();
    } else {
      console.log(`✅ Found ${existingCountries.length} countries`);
    }
  } catch (error) {
    console.error("Error checking countries:", error);
  }
}

// Support explicit seeding via environment variable
if (process.env.RUN_COUNTRY_SEED === 'true') {
  console.log('🌍 Running country seed via RUN_COUNTRY_SEED=true');
  seedCountries()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error seeding countries:", error);
      process.exit(1);
    });
}
