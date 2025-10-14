import { db } from '../server/db';
import { countries, petBreeds } from '../shared/schema';

async function seedCountries() {
  console.log('Seeding countries...');
  
  const countriesData = [
    { code: 'HK', nameEn: 'Hong Kong', nameZh: '香港', phonePrefix: '+852', flag: '🇭🇰' },
    { code: 'CN', nameEn: 'China', nameZh: '中国', phonePrefix: '+86', flag: '🇨🇳' },
    { code: 'US', nameEn: 'United States', nameZh: '美国', phonePrefix: '+1', flag: '🇺🇸' },
    { code: 'CA', nameEn: 'Canada', nameZh: '加拿大', phonePrefix: '+1', flag: '🇨🇦' },
    { code: 'GB', nameEn: 'United Kingdom', nameZh: '英国', phonePrefix: '+44', flag: '🇬🇧' },
    { code: 'JP', nameEn: 'Japan', nameZh: '日本', phonePrefix: '+81', flag: '🇯🇵' },
    { code: 'KR', nameEn: 'South Korea', nameZh: '韩国', phonePrefix: '+82', flag: '🇰🇷' },
    { code: 'SG', nameEn: 'Singapore', nameZh: '新加坡', phonePrefix: '+65', flag: '🇸🇬' },
    { code: 'TW', nameEn: 'Taiwan', nameZh: '台湾', phonePrefix: '+886', flag: '🇹🇼' },
  ];
  
  for (const country of countriesData) {
    await db.insert(countries).values(country).onConflictDoNothing();
  }
  
  console.log('✅ Countries seeded successfully');
}

async function seedPetBreeds() {
  console.log('Seeding pet breeds...');
  
  const breedsData = [
    // Common dog breeds
    { species: 'dog', breedEn: 'Labrador Retriever', breedZh: '拉布拉多犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Golden Retriever', breedZh: '金毛尋回犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'German Shepherd', breedZh: '德國牧羊犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'French Bulldog', breedZh: '法國鬥牛犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Poodle', breedZh: '貴賓犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Chihuahua', breedZh: '吉娃娃', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Pomeranian', breedZh: '博美犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Shih Tzu', breedZh: '西施犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Yorkshire Terrier', breedZh: '約克夏梗', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Corgi', breedZh: '柯基犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Husky', breedZh: '哈士奇', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Beagle', breedZh: '比格犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Dachshund', breedZh: '臘腸犬', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Maltese', breedZh: '馬爾濟斯', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Pug', breedZh: '哈巴狗', countryCode: null, isCommon: true },
    { species: 'dog', breedEn: 'Mixed Breed', breedZh: '混種犬', countryCode: null, isCommon: true },
    
    // Common cat breeds
    { species: 'cat', breedEn: 'Persian', breedZh: '波斯貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'British Shorthair', breedZh: '英國短毛貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Scottish Fold', breedZh: '蘇格蘭摺耳貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Ragdoll', breedZh: '布偶貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Maine Coon', breedZh: '緬因貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Siamese', breedZh: '暹羅貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'American Shorthair', breedZh: '美國短毛貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Bengal', breedZh: '孟加拉貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Sphynx', breedZh: '無毛貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Russian Blue', breedZh: '俄羅斯藍貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Exotic Shorthair', breedZh: '異國短毛貓', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Domestic Shorthair', breedZh: '家貓短毛', countryCode: null, isCommon: true },
    { species: 'cat', breedEn: 'Domestic Longhair', breedZh: '家貓長毛', countryCode: null, isCommon: true },
    
    // Other pets
    { species: 'bird', breedEn: 'Budgerigar', breedZh: '虎皮鸚鵡', countryCode: null, isCommon: true },
    { species: 'bird', breedEn: 'Cockatiel', breedZh: '玄鳳鸚鵡', countryCode: null, isCommon: true },
    { species: 'bird', breedEn: 'Lovebird', breedZh: '愛情鳥', countryCode: null, isCommon: true },
    { species: 'rabbit', breedEn: 'Holland Lop', breedZh: '荷蘭垂耳兔', countryCode: null, isCommon: true },
    { species: 'rabbit', breedEn: 'Netherland Dwarf', breedZh: '荷蘭侏儒兔', countryCode: null, isCommon: true },
    { species: 'hamster', breedEn: 'Syrian Hamster', breedZh: '敘利亞倉鼠', countryCode: null, isCommon: true },
    { species: 'hamster', breedEn: 'Dwarf Hamster', breedZh: '侏儒倉鼠', countryCode: null, isCommon: true },
  ];
  
  for (const breed of breedsData) {
    await db.insert(petBreeds).values(breed).onConflictDoNothing();
  }
  
  console.log('✅ Pet breeds seeded successfully');
}

async function main() {
  try {
    await seedCountries();
    await seedPetBreeds();
    console.log('🎉 All data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

main();
