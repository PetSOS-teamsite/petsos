import { db } from "./db";
import { users, pets, emergencyRequests, auditLogs, regions } from "@shared/schema";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

const firstNames = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
  "志明", "淑芬", "俊傑", "美玲", "建華", "雅婷", "偉強", "婉君",
  "家豪", "欣怡", "子軒", "詩涵", "宇軒", "宜蓁", "承翰", "佳蓉"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "陳", "林", "黃", "張", "李", "王", "吳", "劉",
  "蔡", "楊", "許", "鄭", "謝", "郭", "洪", "曾"
];

const petNames = [
  "Buddy", "Max", "Charlie", "Cooper", "Rocky", "Bear", "Duke", "Tucker",
  "Jack", "Oliver", "Bella", "Lucy", "Daisy", "Molly", "Sadie", "Maggie",
  "Sophie", "Chloe", "Bailey", "Lola", "Luna", "Zoey", "Lily", "Stella",
  "波波", "豆豆", "旺財", "小白", "小黑", "米米", "乖乖", "毛毛",
  "球球", "布丁", "牛奶", "咖啡", "阿寶", "貝貝", "多多", "奇奇"
];

const breeds = {
  dog: ["Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog", "Bulldog", "Poodle", "Beagle", "Rottweiler", "Dachshund", "Yorkshire Terrier", "Shiba Inu", "Corgi", "Husky", "Pomeranian", "Chihuahua", "Mixed"],
  cat: ["Persian", "Maine Coon", "Ragdoll", "British Shorthair", "Siamese", "Bengal", "Abyssinian", "Scottish Fold", "Sphynx", "Norwegian Forest", "Russian Blue", "American Shorthair", "Mixed"],
  exotic: ["Rabbit", "Hamster", "Guinea Pig", "Parrot", "Turtle", "Ferret", "Hedgehog", "Chinchilla"]
};

const symptoms = [
  "Vomiting and not eating for 2 days",
  "Difficulty breathing, very weak",
  "Hit by car, bleeding from leg",
  "Collapsed suddenly, not responding",
  "Severe diarrhea with blood",
  "Ate chocolate, showing signs of poisoning",
  "High fever, refusing to move",
  "Seizures lasting more than 5 minutes",
  "Eye injury, swollen and red",
  "Broken leg after falling",
  "Allergic reaction, face swelling",
  "Not urinating for 24 hours",
  "Choking on something",
  "Snake bite on leg",
  "Burn injury from hot water",
  "Heatstroke symptoms, excessive panting",
  "急性腹瀉，無法進食",
  "呼吸困難，精神很差",
  "車禍受傷，腿部流血",
  "突然昏倒，沒有反應",
  "持續嘔吐，已經兩天沒吃東西",
  "誤食巧克力，出現中毒症狀",
  "高燒不退，不願意活動",
  "癲癇發作超過5分鐘",
  "眼睛受傷，腫脹發紅"
];

const manualLocations = [
  "Central, Hong Kong Island",
  "Causeway Bay",
  "Wan Chai",
  "Tsim Sha Tsui",
  "Mong Kok",
  "Jordan",
  "Sha Tin",
  "Tai Po",
  "Yuen Long",
  "Tuen Mun",
  "Kwun Tong",
  "Sai Kung",
  "Kennedy Town",
  "Aberdeen",
  "Stanley",
  "中環",
  "銅鑼灣",
  "灣仔",
  "尖沙咀",
  "旺角",
  "沙田",
  "大埔",
  "元朗",
  "屯門",
  "觀塘"
];

const entityTypes = ["user", "pet", "emergency_request", "clinic", "hospital", "message"];
const actions = ["create", "update", "view", "delete", "login", "logout", "search", "broadcast"];
const userAgents = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36",
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const prefix = ["9", "6", "5"];
  return randomElement(prefix) + Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 7);
}

function randomEmail(name: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
  return `${name.toLowerCase().replace(/\s/g, "")}_${nanoid(4)}@${randomElement(domains)}`;
}

function randomDate(startDays: number, endDays: number): Date {
  const now = Date.now();
  const start = now - startDays * 24 * 60 * 60 * 1000;
  const end = now - endDays * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (end - start));
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomCoordinates(region: string): { lat: number; lng: number } {
  const coords: Record<string, { lat: [number, number]; lng: [number, number] }> = {
    "hki-region": { lat: [22.25, 22.32], lng: [114.13, 114.22] },
    "kln-region": { lat: [22.28, 22.36], lng: [114.15, 114.22] },
    "nti-region": { lat: [22.35, 22.52], lng: [113.95, 114.30] }
  };
  const c = coords[region] || coords["hki-region"];
  return {
    lat: c.lat[0] + Math.random() * (c.lat[1] - c.lat[0]),
    lng: c.lng[0] + Math.random() * (c.lng[1] - c.lng[0])
  };
}

export async function seedMockData() {
  console.log("Starting mock data seeding...");
  
  const regionList = await db.select().from(regions);
  if (regionList.length === 0) {
    console.error("No regions found. Please seed regions first.");
    return;
  }
  
  const regionIds = regionList.map(r => r.id);
  console.log(`Found ${regionIds.length} regions`);
  
  const createdUserIds: string[] = [];
  const createdPetIds: string[] = [];
  
  console.log("Creating 1,200 mock users...");
  const userBatches = [];
  for (let i = 0; i < 1200; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const language = Math.random() > 0.4 ? "zh-HK" : "en";
    const createdAt = randomDate(365, 0);
    
    userBatches.push({
      id: `mock-user-${nanoid(10)}`,
      username: `user_${nanoid(6)}`,
      email: randomEmail(firstName),
      phone: randomPhone(),
      name,
      language,
      languagePreference: language,
      role: "user" as const,
      region: randomElement(regionIds),
      regionPreference: randomElement(regionIds),
      createdAt,
      updatedAt: createdAt,
      notificationPreferences: {
        emergencyAlerts: Math.random() > 0.1,
        generalUpdates: Math.random() > 0.3,
        promotions: Math.random() > 0.7,
        systemAlerts: Math.random() > 0.2,
        vetTips: Math.random() > 0.4
      }
    });
  }
  
  for (let i = 0; i < userBatches.length; i += 100) {
    const batch = userBatches.slice(i, i + 100);
    const inserted = await db.insert(users).values(batch).returning({ id: users.id });
    createdUserIds.push(...inserted.map(u => u.id));
    console.log(`  Created users ${i + 1} to ${Math.min(i + 100, userBatches.length)}`);
  }
  
  console.log("\nCreating 1,500 mock pets...");
  const petBatches = [];
  for (let i = 0; i < 1500; i++) {
    const species = randomElement(["dog", "dog", "dog", "cat", "cat", "exotic"]) as "dog" | "cat" | "exotic";
    const breedList = breeds[species];
    
    petBatches.push({
      id: `mock-pet-${nanoid(10)}`,
      userId: randomElement(createdUserIds),
      name: randomElement(petNames),
      species,
      breed: randomElement(breedList),
      age: Math.floor(Math.random() * 15) + 1,
      weight: (Math.random() * 40 + 1).toFixed(1),
      medicalNotes: Math.random() > 0.7 ? "Regular checkups, healthy" : null,
      createdAt: randomDate(365, 0)
    });
  }
  
  for (let i = 0; i < petBatches.length; i += 100) {
    const batch = petBatches.slice(i, i + 100);
    const inserted = await db.insert(pets).values(batch).returning({ id: pets.id });
    createdPetIds.push(...inserted.map(p => p.id));
    console.log(`  Created pets ${i + 1} to ${Math.min(i + 100, petBatches.length)}`);
  }
  
  console.log("\nCreating 1,500 mock emergency requests...");
  const emergencyBatches = [];
  const statuses = ["pending", "in_progress", "completed", "cancelled"];
  const statusWeights = [0.1, 0.15, 0.7, 0.05];
  
  for (let i = 0; i < 1500; i++) {
    const userId = Math.random() > 0.1 ? randomElement(createdUserIds) : null;
    const petId = userId && Math.random() > 0.2 ? randomElement(createdPetIds) : null;
    const regionId = randomElement(regionIds);
    const coords = randomCoordinates(regionId);
    const createdAt = randomDate(180, 0);
    
    const rand = Math.random();
    let status = "completed";
    let cumulative = 0;
    for (let j = 0; j < statuses.length; j++) {
      cumulative += statusWeights[j];
      if (rand < cumulative) {
        status = statuses[j];
        break;
      }
    }
    
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const species = randomElement(["dog", "dog", "cat", "exotic"]) as "dog" | "cat" | "exotic";
    
    emergencyBatches.push({
      id: `mock-emergency-${nanoid(10)}`,
      userId,
      petId,
      symptom: randomElement(symptoms),
      locationLatitude: coords.lat.toString(),
      locationLongitude: coords.lng.toString(),
      manualLocation: Math.random() > 0.5 ? randomElement(manualLocations) : null,
      contactName: `${firstName} ${lastName}`,
      contactPhone: randomPhone(),
      status,
      regionId,
      createdAt,
      petSpecies: species,
      petBreed: randomElement(breeds[species]),
      petAge: Math.floor(Math.random() * 10) + 1,
      isVoiceRecording: Math.random() > 0.8
    });
  }
  
  for (let i = 0; i < emergencyBatches.length; i += 100) {
    const batch = emergencyBatches.slice(i, i + 100);
    await db.insert(emergencyRequests).values(batch);
    console.log(`  Created emergency requests ${i + 1} to ${Math.min(i + 100, emergencyBatches.length)}`);
  }
  
  console.log("\nCreating 3,000 mock audit logs (analytics data)...");
  const auditBatches = [];
  
  for (let i = 0; i < 3000; i++) {
    const entityType = randomElement(entityTypes);
    const action = randomElement(actions);
    const createdAt = randomDate(90, 0);
    
    auditBatches.push({
      id: `mock-audit-${nanoid(10)}`,
      entityType,
      entityId: `${entityType}-${nanoid(8)}`,
      action,
      userId: Math.random() > 0.3 ? randomElement(createdUserIds) : null,
      changes: action === "update" ? { field: "status", old: "pending", new: "completed" } : null,
      ipAddress: randomIp(),
      userAgent: randomElement(userAgents),
      createdAt
    });
  }
  
  for (let i = 0; i < auditBatches.length; i += 200) {
    const batch = auditBatches.slice(i, i + 200);
    await db.insert(auditLogs).values(batch);
    console.log(`  Created audit logs ${i + 1} to ${Math.min(i + 200, auditBatches.length)}`);
  }
  
  console.log("\n=== Mock Data Seeding Complete ===");
  console.log(`Users created: ${createdUserIds.length}`);
  console.log(`Pets created: ${createdPetIds.length}`);
  console.log(`Emergency requests created: ${emergencyBatches.length}`);
  console.log(`Audit logs created: ${auditBatches.length}`);
  console.log(`Total records: ${createdUserIds.length + createdPetIds.length + emergencyBatches.length + auditBatches.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedMockData()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error seeding mock data:", err);
      process.exit(1);
    });
}
