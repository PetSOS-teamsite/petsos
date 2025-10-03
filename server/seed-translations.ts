import { storage } from "./storage";

const translations = [
  // Home Page
  { key: "app.title", en: "Pet Emergency HK", zh: "寵物急症香港" },
  { key: "home.emergency.button", en: "Emergency Care Now", zh: "緊急求助" },
  { key: "home.emergency.subtitle", en: "Get help from 24-hour veterinary clinics immediately", zh: "立即聯絡24小時獸醫診所" },
  { key: "home.find_clinics", en: "Find Clinics", zh: "搵診所" },
  { key: "home.find_clinics.desc", en: "Browse all veterinary clinics", zh: "瀏覽所有獸醫診所" },
  { key: "home.my_pets", en: "My Pets", zh: "我的寵物" },
  { key: "home.my_pets.desc", en: "Manage your pet profiles", zh: "管理寵物資料" },
  { key: "home.how_it_works", en: "How It Works", zh: "點樣用" },
  { key: "home.step1.title", en: "Describe Emergency", zh: "講下發生咩事" },
  { key: "home.step1.desc", en: "Tell us what's happening with your pet", zh: "話俾我哋知寵物嘅情況" },
  { key: "home.step2.title", en: "Find Nearby Clinics", zh: "搵附近診所" },
  { key: "home.step2.desc", en: "We'll show 24-hour clinics near you", zh: "即刻顯示附近24小時診所" },
  { key: "home.step3.title", en: "Contact Instantly", zh: "即時聯絡" },
  { key: "home.step3.desc", en: "Call or message clinics instantly", zh: "即刻打電話或發訊息" },
  { key: "home.footer", en: "For life-threatening emergencies, call 999 immediately", zh: "如有生命危險，請即致電999" },
  
  // Emergency Flow
  { key: "emergency.title", en: "Emergency Request", zh: "緊急求助" },
  { key: "emergency.step1.title", en: "Step 1: Describe the Emergency", zh: "第1步：講下發生咩事" },
  { key: "emergency.step1.label", en: "What's happening with your pet?", zh: "寵物有咩事？" },
  { key: "emergency.step1.placeholder", en: "e.g., My dog is having difficulty breathing", zh: "例如：隻狗呼吸困難" },
  { key: "emergency.step2.title", en: "Step 2: Your Location", zh: "第2步：你嘅位置" },
  { key: "emergency.step2.label", en: "Where are you located?", zh: "你而家喺邊？" },
  { key: "emergency.step2.placeholder", en: "Enter your location or use GPS", zh: "輸入地址或用GPS定位" },
  { key: "emergency.step2.use_gps", en: "Use My Current Location", zh: "用我嘅位置" },
  { key: "emergency.step3.title", en: "Step 3: Contact Information", zh: "第3步：聯絡方法" },
  { key: "emergency.step3.name", en: "Your Name", zh: "你嘅姓名" },
  { key: "emergency.step3.phone", en: "Phone Number", zh: "電話號碼" },
  { key: "button.next", en: "Next", zh: "下一步" },
  { key: "button.previous", en: "Previous", zh: "上一步" },
  { key: "button.submit", en: "Submit Request", zh: "提交" },
  { key: "emergency.step_indicator", en: "Step {step} of 3", zh: "第 {step} 步（共3步）" },
  { key: "emergency.time_remaining", en: "~{time}s remaining", zh: "大約 {time} 秒" },
  { key: "emergency.submit.success", en: "Emergency request submitted!", zh: "已經提交咗！" },
  { key: "emergency.submit.finding", en: "Finding nearby clinics...", zh: "正在搵附近診所..." },
  { key: "emergency.gps.unavailable", en: "GPS unavailable", zh: "GPS 無法使用" },
  { key: "emergency.gps.manual", en: "Please enter location manually below", zh: "請喺下面手動輸入地址" },
  { key: "emergency.loading_pets", en: "Loading your pets...", zh: "載入緊寵物資料..." },
  
  // Clinic Results
  { key: "results.title", en: "Nearby 24-Hour Clinics", zh: "附近24小時診所" },
  { key: "results.request_for", en: "Emergency Request", zh: "緊急求助" },
  { key: "results.clinics_found", en: "clinics found", zh: "搵到診所" },
  { key: "results.call", en: "Call", zh: "打電話" },
  { key: "results.whatsapp", en: "WhatsApp", zh: "WhatsApp" },
  { key: "results.broadcast", en: "Broadcast to All Clinics", zh: "一鍵通知全部診所" },
  { key: "results.broadcast.confirm", en: "Confirm Broadcast", zh: "確認發送" },
  { key: "results.broadcast.message", en: "This will send your emergency request to all clinics with WhatsApp or email. They will be able to contact you directly.", zh: "會將你嘅緊急求助發送俾所有有WhatsApp或電郵嘅診所，佢哋會直接聯絡你。" },
  { key: "results.view_status", en: "View Broadcast Status", zh: "查看發送狀態" },
  { key: "results.24_hours", en: "24 Hours", zh: "24小時" },
  
  // Clinics Page
  { key: "clinics.title", en: "Veterinary Clinics", zh: "獸醫診所" },
  { key: "clinics.search", en: "Search clinics...", zh: "搜尋獸醫診所..." },
  { key: "clinics.all_regions", en: "All Regions", zh: "全港" },
  { key: "clinics.hki", en: "Hong Kong Island", zh: "港島" },
  { key: "clinics.kln", en: "Kowloon", zh: "九龍" },
  { key: "clinics.nti", en: "New Territories", zh: "新界" },
  { key: "clinics.24h_only", en: "24-hour clinics only", zh: "只顯示24小時門診" },
  { key: "clinics.no_results", en: "No clinics found", zh: "搵唔到診所" },
  { key: "clinics.adjust_search", en: "Try adjusting your search or filters", zh: "試下調整搜尋或篩選條件" },
  { key: "clinics.count", en: "clinic", zh: "間" },
  { key: "clinics.count_plural", en: "clinics", zh: "間" },
  { key: "clinics.found", en: "found", zh: "已搵到" },
  
  // Profile
  { key: "profile.title", en: "My Profile", zh: "個人資料" },
  { key: "profile.desc", en: "Manage your account information and preferences", zh: "管理你嘅戶口資料同喜好" },
  { key: "profile.username", en: "Username", zh: "用戶名" },
  { key: "profile.email", en: "Email", zh: "電郵" },
  { key: "profile.phone", en: "Phone Number", zh: "電話" },
  { key: "profile.language", en: "Language Preference", zh: "語言" },
  { key: "profile.region", en: "Region Preference", zh: "地區" },
  { key: "profile.save", en: "Save Changes", zh: "儲存" },
  { key: "profile.manage_pets", en: "Manage My Pets", zh: "管理寵物" },
  
  // Pets
  { key: "pets.title", en: "My Pets", zh: "我嘅寵物" },
  { key: "pets.add", en: "Add New Pet", zh: "加寵物" },
  { key: "pets.edit", en: "Edit Pet", zh: "改資料" },
  { key: "pets.delete", en: "Delete Pet", zh: "刪除" },
  { key: "pets.name", en: "Pet Name", zh: "名" },
  { key: "pets.species", en: "Species", zh: "種類" },
  { key: "pets.breed", en: "Breed", zh: "品種" },
  { key: "pets.age", en: "Age (years)", zh: "年齡" },
  { key: "pets.weight", en: "Weight (kg)", zh: "體重（公斤）" },
  { key: "pets.medical_notes", en: "Medical Notes", zh: "醫療記錄" },
  { key: "pets.no_pets", en: "No pets yet", zh: "未有寵物" },
  { key: "pets.add_first", en: "Add your first pet to get started", zh: "加第一隻寵物就可以開始用" },
  
  // Common
  { key: "button.back", en: "Back", zh: "返回" },
  { key: "button.cancel", en: "Cancel", zh: "取消" },
  { key: "button.confirm", en: "Confirm", zh: "確認" },
  { key: "button.save", en: "Save", zh: "儲存" },
  { key: "button.delete", en: "Delete", zh: "刪除" },
  { key: "button.edit", en: "Edit", zh: "改" },
  { key: "button.close", en: "Close", zh: "關閉" },
  { key: "loading", en: "Loading...", zh: "載入緊..." },
  { key: "loading.profile", en: "Loading profile...", zh: "載入緊..." },
  { key: "loading.pets", en: "Loading pets...", zh: "載入緊..." },
  { key: "error", en: "Error", zh: "錯誤" },
  { key: "success", en: "Success", zh: "成功" },
  
  // Broadcast Status
  { key: "broadcast.title", en: "Broadcast Status", zh: "發送狀態" },
  { key: "broadcast.total", en: "Total Sent", zh: "總數" },
  { key: "broadcast.sent", en: "Successfully Sent", zh: "已經發送咗" },
  { key: "broadcast.queued", en: "Queued", zh: "等候中" },
  { key: "broadcast.failed", en: "Failed", zh: "失敗咗" },
  { key: "broadcast.refresh", en: "Refresh", zh: "更新" },
  { key: "broadcast.details", en: "Message Details", zh: "詳情" },
  { key: "broadcast.retry_attempts", en: "Retry attempts", zh: "重試次數" },
  { key: "broadcast.created", en: "Created", zh: "已建立咗" },
  { key: "broadcast.sent_at", en: "Sent", zh: "已發送咗" },
  { key: "broadcast.failed_at", en: "Failed", zh: "失敗咗" },
  { key: "broadcast.error", en: "Error", zh: "錯誤" },
  { key: "broadcast.view_content", en: "View Message Content", zh: "睇內容" },
];

async function seedTranslations() {
  console.log("🌱 Seeding translations...");
  
  let created = 0;
  let updated = 0;
  
  for (const translation of translations) {
    // English version
    const existingEn = await storage.getTranslation(translation.key, 'en');
    if (existingEn) {
      await storage.updateTranslation(existingEn.id, {
        key: translation.key,
        language: 'en',
        value: translation.en,
        namespace: 'common',
      });
      updated++;
    } else {
      await storage.createTranslation({
        key: translation.key,
        language: 'en',
        value: translation.en,
        namespace: 'common',
      });
      created++;
    }
    
    // Chinese version
    const existingZh = await storage.getTranslation(translation.key, 'zh-HK');
    if (existingZh) {
      await storage.updateTranslation(existingZh.id, {
        key: translation.key,
        language: 'zh-HK',
        value: translation.zh,
        namespace: 'common',
      });
      updated++;
    } else {
      await storage.createTranslation({
        key: translation.key,
        language: 'zh-HK',
        value: translation.zh,
        namespace: 'common',
      });
      created++;
    }
  }
  
  console.log(`✅ Translation seeding complete!`);
  console.log(`   - Created: ${created} translations`);
  console.log(`   - Updated: ${updated} translations`);
  console.log(`   - Total keys: ${translations.length}`);
  
  process.exit(0);
}

seedTranslations().catch(error => {
  console.error("❌ Error seeding translations:", error);
  process.exit(1);
});
