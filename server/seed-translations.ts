import { storage } from "./storage";

const translations = [
  // Home Page
  { key: "app.title", en: "Pet Emergency HK", zh: "寵物急症香港" },
  { key: "home.emergency.button", en: "Emergency Care Now", zh: "緊急護理" },
  { key: "home.emergency.subtitle", en: "Get help from 24-hour veterinary clinics immediately", zh: "立即獲得24小時獸醫診所的幫助" },
  { key: "home.find_clinics", en: "Find Clinics", zh: "尋找診所" },
  { key: "home.find_clinics.desc", en: "Browse all veterinary clinics", zh: "瀏覽所有獸醫診所" },
  { key: "home.my_pets", en: "My Pets", zh: "我的寵物" },
  { key: "home.my_pets.desc", en: "Manage your pet profiles", zh: "管理您的寵物資料" },
  { key: "home.how_it_works", en: "How It Works", zh: "如何使用" },
  { key: "home.step1.title", en: "Describe Emergency", zh: "描述緊急情況" },
  { key: "home.step1.desc", en: "Tell us what's happening with your pet", zh: "告訴我們您的寵物發生了什麼事" },
  { key: "home.step2.title", en: "Find Nearby Clinics", zh: "尋找附近診所" },
  { key: "home.step2.desc", en: "We'll show 24-hour clinics near you", zh: "我們會顯示您附近的24小時診所" },
  { key: "home.step3.title", en: "Contact Instantly", zh: "立即聯絡" },
  { key: "home.step3.desc", en: "Call or message clinics instantly", zh: "立即致電或訊息診所" },
  { key: "home.footer", en: "For life-threatening emergencies, call 999 immediately", zh: "如遇危及生命的緊急情況，請立即致電999" },
  
  // Emergency Flow
  { key: "emergency.title", en: "Emergency Request", zh: "緊急求助" },
  { key: "emergency.step1.title", en: "Step 1: Describe the Emergency", zh: "步驟1：描述緊急情況" },
  { key: "emergency.step1.label", en: "What's happening with your pet?", zh: "您的寵物發生了什麼事？" },
  { key: "emergency.step1.placeholder", en: "e.g., My dog is having difficulty breathing", zh: "例如：我的狗呼吸困難" },
  { key: "emergency.step2.title", en: "Step 2: Your Location", zh: "步驟2：您的位置" },
  { key: "emergency.step2.label", en: "Where are you located?", zh: "您在哪裡？" },
  { key: "emergency.step2.placeholder", en: "Enter your location or use GPS", zh: "輸入您的位置或使用GPS" },
  { key: "emergency.step2.use_gps", en: "Use My Current Location", zh: "使用我的當前位置" },
  { key: "emergency.step3.title", en: "Step 3: Contact Information", zh: "步驟3：聯絡資料" },
  { key: "emergency.step3.name", en: "Your Name", zh: "您的姓名" },
  { key: "emergency.step3.phone", en: "Phone Number", zh: "電話號碼" },
  { key: "button.next", en: "Next", zh: "下一步" },
  { key: "button.previous", en: "Previous", zh: "上一步" },
  { key: "button.submit", en: "Submit Request", zh: "提交請求" },
  
  // Clinic Results
  { key: "results.title", en: "Nearby 24-Hour Clinics", zh: "附近24小時診所" },
  { key: "results.request_for", en: "Emergency Request", zh: "緊急求助" },
  { key: "results.clinics_found", en: "clinics found", zh: "找到診所" },
  { key: "results.call", en: "Call", zh: "致電" },
  { key: "results.whatsapp", en: "WhatsApp", zh: "WhatsApp" },
  { key: "results.broadcast", en: "Broadcast to All Clinics", zh: "廣播至所有診所" },
  { key: "results.broadcast.confirm", en: "Confirm Broadcast", zh: "確認廣播" },
  { key: "results.broadcast.message", en: "This will send your emergency request to all clinics with WhatsApp or email. They will be able to contact you directly.", zh: "這將把您的緊急請求發送給所有擁有WhatsApp或電郵的診所。他們將能夠直接聯絡您。" },
  { key: "results.view_status", en: "View Broadcast Status", zh: "查看廣播狀態" },
  { key: "results.24_hours", en: "24 Hours", zh: "24小時" },
  
  // Clinics Page
  { key: "clinics.title", en: "Veterinary Clinics", zh: "獸醫診所" },
  { key: "clinics.search", en: "Search clinics...", zh: "搜尋診所..." },
  { key: "clinics.all_regions", en: "All Regions", zh: "所有地區" },
  { key: "clinics.hki", en: "Hong Kong Island", zh: "香港島" },
  { key: "clinics.kln", en: "Kowloon", zh: "九龍" },
  { key: "clinics.nti", en: "New Territories", zh: "新界" },
  { key: "clinics.24h_only", en: "24-hour clinics only", zh: "只顯示24小時診所" },
  { key: "clinics.no_results", en: "No clinics found", zh: "找不到診所" },
  { key: "clinics.adjust_search", en: "Try adjusting your search or filters", zh: "嘗試調整搜尋或篩選條件" },
  
  // Profile
  { key: "profile.title", en: "My Profile", zh: "我的個人資料" },
  { key: "profile.desc", en: "Manage your account information and preferences", zh: "管理您的帳戶資料和偏好設定" },
  { key: "profile.username", en: "Username", zh: "用戶名" },
  { key: "profile.email", en: "Email", zh: "電郵" },
  { key: "profile.phone", en: "Phone Number", zh: "電話號碼" },
  { key: "profile.language", en: "Language Preference", zh: "語言偏好" },
  { key: "profile.region", en: "Region Preference", zh: "地區偏好" },
  { key: "profile.save", en: "Save Changes", zh: "儲存變更" },
  { key: "profile.manage_pets", en: "Manage My Pets", zh: "管理我的寵物" },
  
  // Pets
  { key: "pets.title", en: "My Pets", zh: "我的寵物" },
  { key: "pets.add", en: "Add New Pet", zh: "新增寵物" },
  { key: "pets.edit", en: "Edit Pet", zh: "編輯寵物" },
  { key: "pets.delete", en: "Delete Pet", zh: "刪除寵物" },
  { key: "pets.name", en: "Pet Name", zh: "寵物名稱" },
  { key: "pets.species", en: "Species", zh: "種類" },
  { key: "pets.breed", en: "Breed", zh: "品種" },
  { key: "pets.age", en: "Age (years)", zh: "年齡（歲）" },
  { key: "pets.weight", en: "Weight (kg)", zh: "體重（公斤）" },
  { key: "pets.medical_notes", en: "Medical Notes", zh: "醫療備註" },
  { key: "pets.no_pets", en: "No pets yet", zh: "尚未新增寵物" },
  { key: "pets.add_first", en: "Add your first pet to get started", zh: "新增您的第一隻寵物以開始使用" },
  
  // Common
  { key: "button.back", en: "Back", zh: "返回" },
  { key: "button.cancel", en: "Cancel", zh: "取消" },
  { key: "button.confirm", en: "Confirm", zh: "確認" },
  { key: "button.save", en: "Save", zh: "儲存" },
  { key: "button.delete", en: "Delete", zh: "刪除" },
  { key: "button.edit", en: "Edit", zh: "編輯" },
  { key: "button.close", en: "Close", zh: "關閉" },
  { key: "loading", en: "Loading...", zh: "載入中..." },
  { key: "error", en: "Error", zh: "錯誤" },
  { key: "success", en: "Success", zh: "成功" },
  
  // Broadcast Status
  { key: "broadcast.title", en: "Broadcast Status", zh: "廣播狀態" },
  { key: "broadcast.total", en: "Total Sent", zh: "總共發送" },
  { key: "broadcast.sent", en: "Successfully Sent", zh: "成功發送" },
  { key: "broadcast.queued", en: "Queued", zh: "排隊中" },
  { key: "broadcast.failed", en: "Failed", zh: "失敗" },
  { key: "broadcast.refresh", en: "Refresh", zh: "重新整理" },
  { key: "broadcast.details", en: "Message Details", zh: "訊息詳情" },
  { key: "broadcast.retry_attempts", en: "Retry attempts", zh: "重試次數" },
  { key: "broadcast.created", en: "Created", zh: "建立時間" },
  { key: "broadcast.sent_at", en: "Sent", zh: "發送時間" },
  { key: "broadcast.failed_at", en: "Failed", zh: "失敗時間" },
  { key: "broadcast.error", en: "Error", zh: "錯誤" },
  { key: "broadcast.view_content", en: "View Message Content", zh: "查看訊息內容" },
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
