import { storage } from "./storage";

const translations = [
  // App Title
  { key: "app.title", en: "PetSOS", zh: "PetSOS" },
  { key: "app.disclaimer", en: "⚠️ PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.", zh: "⚠️ PetSOS 只提供緊急支援，並非專業獸醫診斷或醫療建議。如有疑問，請立即聯絡獸醫。" },
  
  // Landing Page
  { key: "landing.subtitle", en: "Alert 24-hour animal hospitals with one tap", zh: "一按即時通知24小時動物醫院" },
  { key: "landing.emergency_button", en: "Emergency Help Now", zh: "緊急求助" },
  { key: "landing.login_button", en: "Log In / Sign Up", zh: "登入 / 註冊" },
  { key: "landing.quick_access", en: "Emergency access available without login • Get help in under 60 seconds", zh: "無需登入即可緊急求助 • 60秒內獲得協助" },
  { key: "landing.feature1.title", en: "Fast Emergency Flow", zh: "快速緊急求助" },
  { key: "landing.feature1.desc", en: "3-step emergency request in under 30 seconds. Every second counts when your pet needs help.", zh: "3步驟完成緊急求助，只需30秒。寵物需要幫助時，分秒必爭。" },
  { key: "landing.feature2.title", en: "24-Hour Clinics", zh: "24小時診所" },
  { key: "landing.feature2.desc", en: "Find nearest 24-hour veterinary clinics across Hong Kong Island, Kowloon, and New Territories.", zh: "搜尋港島、九龍及新界區內最近的24小時獸醫診所。" },
  { key: "landing.feature3.title", en: "One-Tap Broadcast", zh: "一鍵廣播" },
  { key: "landing.feature3.desc", en: "Alert multiple clinics instantly via WhatsApp with one tap. Get help faster.", zh: "一鍵透過WhatsApp即時通知多間診所，更快獲得協助。" },
  { key: "landing.disclaimer", en: "PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.", zh: "PetSOS 只提供緊急支援，並非專業獸醫診斷或醫療建議。如有疑問，請立即聯絡獸醫。" },
  
  // Home Page
  { key: "home.emergency.button", en: "Emergency Care Now", zh: "緊急求助" },
  { key: "home.emergency.subtitle", en: "Get help from 24-hour veterinary clinics immediately", zh: "立即聯絡24小時獸醫診所" },
  { key: "home.find_clinics", en: "Find Clinics", zh: "尋找診所" },
  { key: "home.find_clinics.desc", en: "Browse all veterinary clinics", zh: "瀏覽所有獸醫診所" },
  { key: "home.my_pets", en: "My Pets", zh: "我的寵物" },
  { key: "home.my_pets.desc", en: "Manage your pet profiles", zh: "管理寵物資料" },
  { key: "home.how_it_works", en: "How It Works", zh: "使用方法" },
  { key: "home.step1.title", en: "Describe Emergency", zh: "描述緊急情況" },
  { key: "home.step1.desc", en: "Tell us what's happening with your pet", zh: "告知寵物的狀況" },
  { key: "home.step2.title", en: "Find Nearby Clinics", zh: "尋找附近診所" },
  { key: "home.step2.desc", en: "We'll show 24-hour clinics near you", zh: "即時顯示附近的24小時診所" },
  { key: "home.step3.title", en: "Contact Instantly", zh: "即時聯絡" },
  { key: "home.step3.desc", en: "Call or message clinics instantly", zh: "即時致電或發送訊息給診所" },
  
  // Emergency Flow
  { key: "emergency.title", en: "Emergency Pet Care", zh: "寵物緊急情況" },
  { key: "emergency.step1.title", en: "What's happening?", zh: "發生什麼事？" },
  { key: "emergency.step2.title", en: "Where are you?", zh: "您在哪裡？" },
  { key: "emergency.step3.title", en: "How can clinics reach you?", zh: "診所如何聯絡您？" },
  { key: "emergency.step_indicator", en: "Step {step} of 3", zh: "第 {step} 步，共3步" },
  { key: "emergency.time_step1", en: "~30s", zh: "約30秒" },
  { key: "emergency.time_step2", en: "~15s", zh: "約15秒" },
  { key: "emergency.time_step3", en: "~10s", zh: "約10秒" },
  
  // Emergency Step 1 - Symptoms
  { key: "symptoms.urgent", en: "What's happening to your pet right now?", zh: "毛孩現時出現什麼情況？" },
  { key: "symptoms.select_all", en: "Tap all symptoms that apply", zh: "請選擇所有適用的症狀" },
  { key: "symptoms.describe", en: "Describe the symptoms...", zh: "請描述情況..." },
  { key: "emergency.select_pet", en: "Which pet is this for?", zh: "是哪一隻毛孩？" },
  { key: "optional", en: "Optional", zh: "選填" },
  { key: "emergency.pet_details", en: "Pet Information", zh: "毛孩資料" },
  { key: "emergency.pet_details_desc", en: "Tell us about your pet so clinics can prepare", zh: "請提供毛孩資料，讓診所預先準備" },
  { key: "pets.select_species", en: "Select species", zh: "選擇種類" },
  { key: "pets.dog", en: "Dog", zh: "狗" },
  { key: "pets.cat", en: "Cat", zh: "貓" },
  { key: "pets.breed_placeholder", en: "Select or type breed...", zh: "選擇或輸入品種..." },
  { key: "pets.age_placeholder", en: "e.g., 3", zh: "例如：3" },
  
  // Emergency Step 2 - Location
  { key: "emergency.step2.detecting", en: "Detecting your location...", zh: "正在偵測您的位置..." },
  { key: "emergency.step2.detected", en: "Location detected", zh: "已偵測到位置" },
  { key: "emergency.step2.nearest", en: "We'll find the nearest 24-hour clinics", zh: "我們會為您搜尋最近的24小時診所" },
  { key: "emergency.step2.retry", en: "Retry GPS", zh: "重試GPS定位" },
  { key: "emergency.step2.manual_label", en: "Or enter your location manually", zh: "或手動輸入您的位置" },
  { key: "emergency.step2.placeholder", en: "e.g., Central, Hong Kong Island", zh: "例如：中環，香港島" },
  { key: "emergency.gps.unavailable", en: "GPS unavailable", zh: "GPS定位無法使用" },
  { key: "emergency.gps.manual", en: "Please enter location manually below", zh: "請在下方手動輸入位置" },
  { key: "emergency.gps.error", en: "Unable to detect location", zh: "無法偵測位置" },
  { key: "emergency.gps.not_supported", en: "Geolocation is not supported by this browser", zh: "您的瀏覽器不支援GPS定位功能" },
  
  // Emergency Step 3 - Contact
  { key: "emergency.step3.name", en: "Your Name", zh: "您的姓名" },
  { key: "emergency.step3.name_placeholder", en: "Full name", zh: "全名" },
  { key: "emergency.step3.phone", en: "Phone Number", zh: "電話號碼" },
  { key: "emergency.step3.phone_placeholder", en: "+852 1234 5678", zh: "+852 1234 5678" },
  { key: "emergency.step3.clinic_contact", en: "Clinics will contact you at this number to confirm availability", zh: "診所會致電此號碼確認是否可以接診" },
  
  // Emergency Buttons & Status
  { key: "button.next", en: "Next", zh: "下一步" },
  { key: "button.previous", en: "Back", zh: "返回" },
  { key: "button.submit", en: "Find Clinics", zh: "尋找診所" },
  { key: "button.submitting", en: "Submitting...", zh: "提交中..." },
  { key: "emergency.submit.success", en: "Emergency request submitted!", zh: "緊急求助已提交！" },
  { key: "emergency.submit.finding", en: "Finding nearby clinics...", zh: "正在搜尋附近的診所..." },
  
  // Validation Messages
  { key: "validation.symptom_required", en: "Please select at least one symptom", zh: "請至少選擇一個症狀" },
  { key: "validation.pet_required", en: "Please select a pet or provide pet details", zh: "請選擇寵物或提供寵物資料" },
  { key: "validation.location_required", en: "Please provide a location (GPS or manual entry)", zh: "請提供位置（GPS定位或手動輸入）" },
  { key: "validation.name_required", en: "Contact name is required", zh: "請輸入聯絡人姓名" },
  { key: "validation.phone_required", en: "Please enter a valid phone number", zh: "請輸入有效的電話號碼" },
  
  // Clinic Results
  { key: "results.title", en: "Nearby 24-Hour Clinics", zh: "附近的24小時診所" },
  { key: "results.request_for", en: "Emergency Request", zh: "緊急求助" },
  { key: "results.clinics_found", en: "clinics found", zh: "間診所" },
  { key: "results.call", en: "Call", zh: "致電" },
  { key: "results.whatsapp", en: "WhatsApp", zh: "WhatsApp" },
  { key: "results.broadcast", en: "Broadcast to All Clinics", zh: "一鍵通知所有診所" },
  { key: "results.broadcast.confirm", en: "Confirm Broadcast", zh: "確認發送" },
  { key: "results.broadcast.message", en: "This will send your emergency request to all clinics with WhatsApp or email. They will be able to contact you directly.", zh: "系統會將您的緊急求助發送至所有設有WhatsApp或電郵的診所，他們會直接聯絡您。" },
  { key: "results.view_status", en: "View Broadcast Status", zh: "查看發送狀態" },
  { key: "results.24_hours", en: "24 Hours", zh: "24小時" },
  
  // Clinic Results Page - Comprehensive Translation
  { key: "clinic_results.title", en: "Emergency Clinic Results", zh: "緊急診所搜尋結果" },
  { key: "clinic_results.clinics_found", en: "clinics found", zh: "間診所" },
  { key: "clinic_results.total_clinics", en: "Total Clinics", zh: "診所總數" },
  { key: "clinic_results.24hour", en: "24-Hour", zh: "24小時" },
  { key: "clinic_results.whatsapp", en: "WhatsApp", zh: "WhatsApp" },
  { key: "clinic_results.within_5km", en: "Within 5km", zh: "5公里內" },
  { key: "clinic_results.km", en: "km", zh: "公里" },
  { key: "clinic_results.emergency_request", en: "Emergency Request", zh: "緊急求助" },
  { key: "clinic_results.symptoms", en: "Symptoms", zh: "症狀" },
  { key: "clinic_results.pet", en: "Pet", zh: "寵物" },
  { key: "clinic_results.location", en: "Location", zh: "位置" },
  { key: "clinic_results.contact", en: "Contact", zh: "聯絡方式" },
  { key: "clinic_results.filters_search", en: "Filters & Search", zh: "篩選與搜尋" },
  { key: "clinic_results.show_filters", en: "Show Filters", zh: "顯示篩選" },
  { key: "clinic_results.hide_filters", en: "Hide Filters", zh: "隱藏篩選" },
  { key: "clinic_results.search_placeholder", en: "Search clinics by name or address...", zh: "搜尋診所名稱或地址..." },
  { key: "clinic_results.24hour_only", en: "24-Hour Clinics Only", zh: "只顯示24小時診所" },
  { key: "clinic_results.24hour_only_short", en: "24-Hour Only", zh: "只顯示24小時" },
  { key: "clinic_results.whatsapp_only", en: "WhatsApp Only", zh: "只顯示WhatsApp" },
  { key: "clinic_results.region", en: "Region", zh: "地區" },
  { key: "clinic_results.all_regions", en: "All Regions", zh: "全港" },
  { key: "clinic_results.distance", en: "Distance", zh: "距離" },
  { key: "clinic_results.all", en: "All", zh: "全部" },
  { key: "clinic_results.enable_gps", en: "Enable GPS on Step 2 for distance filtering", zh: "請在第2步啟用GPS定位以使用距離篩選" },
  { key: "clinic_results.no_gps_data", en: "No clinic GPS data available", zh: "沒有診所GPS資料" },
  { key: "clinic_results.clinics_selected", en: "clinics selected", zh: "間診所已選" },
  { key: "clinic_results.clear_selection", en: "Clear Selection", zh: "清除選擇" },
  { key: "clinic_results.view_status", en: "View Status", zh: "查看狀態" },
  { key: "clinic_results.broadcast", en: "Broadcast", zh: "廣播" },
  { key: "clinic_results.to_all", en: "to All", zh: "至全部" },
  { key: "clinic_results.call", en: "Call", zh: "致電" },
  { key: "clinic_results.no_clinics", en: "No clinics found", zh: "找不到診所" },
  { key: "clinic_results.adjust_filters", en: "Try adjusting your filters or search criteria", zh: "請嘗試調整篩選或搜尋條件" },
  { key: "clinic_results.priority_clinic", en: "Priority Clinic", zh: "優先診所" },
  { key: "clinic_results.available_now", en: "Available Now", zh: "現在可接診" },
  { key: "clinic_results.unavailable", en: "Unavailable", zh: "未能接診" },
  { key: "clinic_results.24_hours", en: "24 Hours", zh: "24小時" },
  { key: "clinic_results.broadcast_success", en: "Broadcast sent successfully!", zh: "廣播已成功發送！" },
  { key: "clinic_results.broadcast_success_desc", en: "Emergency alert sent to clinics", zh: "緊急通知已發送至診所" },
  { key: "clinic_results.broadcast_failed", en: "Broadcast failed", zh: "廣播發送失敗" },
  { key: "clinic_results.broadcast_to_selected", en: "Broadcast to Selected Clinics", zh: "廣播至已選診所" },
  { key: "clinic_results.broadcast_emergency", en: "Broadcast Emergency Alert", zh: "廣播緊急通知" },
  { key: "clinic_results.broadcast_desc_selected", en: "This will send your emergency alert to selected clinics via WhatsApp and email.", zh: "系統會透過WhatsApp及電郵將您的緊急通知發送至已選診所。" },
  { key: "clinic_results.broadcast_desc_all", en: "This will send your emergency alert to all clinics via WhatsApp and email.", zh: "系統會透過WhatsApp及電郵將您的緊急通知發送至所有診所。" },
  { key: "clinic_results.broadcast_tip", en: "💡 Tip: Select specific clinics using the checkboxes to send a targeted broadcast", zh: "💡 提示：使用勾選框選擇特定診所，以發送針對性廣播" },
  { key: "clinic_results.message_preview", en: "Message Preview", zh: "訊息預覽" },
  { key: "clinic_results.send_to_clinics", en: "Send to Clinics", zh: "發送至診所" },
  { key: "clinic_results.whatsapp_message_emergency", en: "Emergency", zh: "緊急" },
  { key: "clinic_results.whatsapp_message_contact", en: "Contact", zh: "聯絡" },
  { key: "clinic_results.whatsapp_message_request", en: "I need emergency pet care", zh: "我需要緊急寵物護理" },
  { key: "clinic_results.location_not_provided", en: "Location not provided", zh: "未提供位置" },
  { key: "clinic_results.map", en: "Map", zh: "地圖" },
  { key: "clinic_results.pet_name", en: "Pet Name", zh: "寵物名稱" },
  { key: "clinic_results.weight_kg", en: "kg", zh: "公斤" },
  { key: "clinic_results.medical_history", en: "⚠️ Medical History", zh: "⚠️ 病歷紀錄" },
  { key: "clinic_results.no_medical_notes", en: "No medical notes on file", zh: "沒有病歷紀錄" },
  { key: "clinic_results.gps_prefix", en: "GPS", zh: "GPS" },
  { key: "clinic_results.broadcast_alert_title", en: "PET EMERGENCY ALERT", zh: "寵物緊急警報" },
  { key: "clinic_results.broadcast_alert_footer", en: "Please respond urgently if you can help.", zh: "如能提供協助，請儘快回覆。" },
  { key: "clinic_results.emergency_care_needed", en: "Emergency pet care needed", zh: "需要緊急寵物護理" },
  
  // Clinics Page
  { key: "clinics.title", en: "Veterinary Clinics", zh: "獸醫診所" },
  { key: "clinics.search", en: "Search clinics...", zh: "搜尋診所..." },
  { key: "clinics.all_regions", en: "All Regions", zh: "全港" },
  { key: "clinics.hki", en: "Hong Kong Island", zh: "香港島" },
  { key: "clinics.kln", en: "Kowloon", zh: "九龍" },
  { key: "clinics.nti", en: "New Territories", zh: "新界" },
  { key: "clinics.24h_only", en: "24-hour clinics only", zh: "只顯示24小時診所" },
  { key: "clinics.no_results", en: "No clinics found", zh: "找不到診所" },
  { key: "clinics.adjust_search", en: "Try adjusting your search or filters", zh: "請嘗試調整搜尋或篩選條件" },
  { key: "clinics.count", en: "clinic", zh: "間" },
  { key: "clinics.count_plural", en: "clinics", zh: "間" },
  { key: "clinics.found", en: "found", zh: "已找到" },
  
  // Profile
  { key: "profile.title", en: "My Profile", zh: "我的個人資料" },
  { key: "profile.desc", en: "Manage your account information and preferences", zh: "管理您的帳戶資料及偏好設定" },
  { key: "profile.username", en: "Username", zh: "用戶名稱" },
  { key: "profile.email", en: "Email", zh: "電郵地址" },
  { key: "profile.phone", en: "Phone Number", zh: "電話號碼" },
  { key: "profile.language", en: "Language Preference", zh: "語言偏好" },
  { key: "profile.region", en: "Region Preference", zh: "地區偏好" },
  { key: "profile.save", en: "Save Changes", zh: "儲存" },
  { key: "profile.saving", en: "Saving...", zh: "儲存中..." },
  { key: "profile.manage_pets", en: "Manage My Pets", zh: "管理我的寵物" },

  { key: "profile.privacy.title", en: "Privacy & Data Rights", zh: "私隱及數據權利" },
  { key: "profile.privacy.desc", en: "Manage your personal data and privacy settings", zh: "管理您的個人資料及私隱設定" },
  { key: "profile.privacy.export_title", en: "Export Your Data", zh: "匯出您的資料" },
  { key: "profile.privacy.export_desc", en: "Download a copy of all your personal data in JSON format (GDPR/PDPO compliant)", zh: "下載您的所有個人資料副本（JSON格式，符合GDPR/PDPO規定）" },
  { key: "profile.privacy.export_button", en: "Download My Data", zh: "下載我的資料" },
  { key: "profile.export.success_title", en: "Data exported successfully", zh: "資料匯出成功" },
  { key: "profile.export.success_desc", en: "Your personal data has been downloaded.", zh: "您的個人資料已下載。" },
  { key: "profile.export.error_title", en: "Export failed", zh: "匯出失敗" },
  { key: "profile.export.error_desc", en: "Failed to download your data. Please try again.", zh: "下載資料失敗。請重試。" },

  { key: "profile.privacy.delete_title", en: "Delete Your Account", zh: "刪除您的帳戶" },
  { key: "profile.privacy.delete_desc", en: "Permanently delete your account and all associated data. This action cannot be undone.", zh: "永久刪除您的帳戶及所有相關資料。此操作無法復原。" },
  { key: "profile.privacy.delete_button", en: "Delete My Account", zh: "刪除我的帳戶" },
  { key: "profile.delete.success_title", en: "Account deleted", zh: "帳戶已刪除" },
  { key: "profile.delete.success_desc", en: "Your account and all data have been permanently deleted.", zh: "您的帳戶及所有資料已永久刪除。" },
  { key: "profile.delete.error_title", en: "Deletion failed", zh: "刪除失敗" },
  { key: "profile.delete.error_desc", en: "Failed to delete your account. Please try again.", zh: "刪除帳戶失敗。請重試。" },
  { key: "profile.delete.dialog_title", en: "Are you absolutely sure?", zh: "您確定要刪除嗎？" },
  { key: "profile.delete.dialog_desc", en: "This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:", zh: "此操作無法復原。這將永久刪除您的帳戶並從我們的伺服器移除所有資料，包括：" },
  { key: "profile.delete.dialog_item1", en: "Your profile and contact information", zh: "您的個人資料及聯絡資訊" },
  { key: "profile.delete.dialog_item2", en: "All saved pets and their medical history", zh: "所有已儲存的寵物及其病歷" },
  { key: "profile.delete.dialog_item3", en: "All emergency request records", zh: "所有緊急求助記錄" },
  { key: "profile.delete.dialog_item4", en: "All privacy consents and preferences", zh: "所有私隱同意及偏好設定" },
  { key: "profile.delete.dialog_cancel", en: "Cancel", zh: "取消" },
  { key: "profile.delete.dialog_confirm", en: "Yes, delete my account", zh: "是的，刪除我的帳戶" },
  { key: "profile.username_placeholder", en: "Enter username", zh: "輸入用戶名稱" },
  { key: "profile.email_placeholder", en: "you@example.com", zh: "您的電郵地址" },
  { key: "profile.phone_placeholder", en: "+852 1234 5678", zh: "+852 1234 5678" },
  { key: "profile.language_placeholder", en: "Select language", zh: "選擇語言" },
  { key: "profile.region_placeholder", en: "Select region", zh: "選擇地區" },
  { key: "profile.validation.username", en: "Username must be at least 3 characters", zh: "用戶名稱須至少3個字元" },
  { key: "profile.validation.email", en: "Please enter a valid email", zh: "請輸入有效的電郵地址" },
  { key: "profile.validation.phone", en: "Please enter a valid phone number", zh: "請輸入有效的電話號碼" },
  { key: "profile.success.title", en: "Profile updated successfully!", zh: "個人資料已更新！" },
  { key: "profile.success.desc", en: "Your changes have been saved.", zh: "您的變更已儲存。" },
  { key: "profile.error.title", en: "Update failed", zh: "更新失敗" },
  { key: "profile.name", en: "Name", zh: "姓名" },
  { key: "profile.name_placeholder", en: "Enter your name", zh: "輸入您的姓名" },
  
  // Profile Pet CTA Section
  { key: "profile.pets_cta.title", en: "Your Pets", zh: "毛孩資料" },
  { key: "profile.pets_cta.desc", en: "Save your pet profiles for faster emergency help", zh: "預先登記毛孩資料，緊急時節省時間" },
  { key: "profile.pets_cta.benefit", en: "With saved pet profiles, emergency requests only take 10 seconds!", zh: "預先登記後，緊急求助僅需10秒！" },
  { key: "profile.pets_cta.button", en: "Add or Manage Pets", zh: "新增或管理毛孩" },
  
  // Pets
  { key: "pets.title", en: "My Pets", zh: "我的寵物" },
  { key: "pets.desc", en: "Manage your pets for faster emergency requests", zh: "管理您的寵物資料，以便快速提交緊急求助" },
  { key: "pets.add", en: "Add Pet", zh: "新增寵物" },
  { key: "pets.add_new", en: "Add New Pet", zh: "新增寵物" },
  { key: "pets.edit", en: "Edit Pet", zh: "編輯" },
  { key: "pets.delete", en: "Delete Pet", zh: "刪除" },
  { key: "pets.delete_confirm", en: "Are you sure you want to remove this pet from your profile? This action cannot be undone.", zh: "確定要從個人資料中移除此寵物嗎？此操作無法復原。" },
  { key: "pets.name", en: "Name", zh: "名稱" },
  { key: "pets.name_placeholder", en: "Fluffy", zh: "小白" },
  { key: "pets.species", en: "Species", zh: "種類" },
  { key: "pets.species_placeholder", en: "Dog, Cat, etc.", zh: "狗、貓等" },
  { key: "pets.breed", en: "Breed", zh: "品種" },
  { key: "pets.breed_placeholder", en: "Golden Retriever", zh: "金毛尋回犬" },
  { key: "pets.age", en: "Age (years)", zh: "年齡（歲）" },
  { key: "pets.age_placeholder", en: "3", zh: "3" },
  { key: "pets.weight", en: "Weight (kg, Optional)", zh: "體重（公斤，選填）" },
  { key: "pets.weight_placeholder", en: "10.5", zh: "10.5" },
  { key: "pets.medical_notes", en: "Medical Notes (Optional)", zh: "醫療記錄（選填）" },
  { key: "pets.medical_notes_placeholder", en: "Allergies, medications, conditions...", zh: "過敏、用藥、病史..." },
  { key: "pets.medical_label", en: "Medical:", zh: "醫療記錄：" },
  { key: "pets.no_pets", en: "No pets added yet", zh: "尚未新增寵物" },
  { key: "pets.add_first", en: "Add Your First Pet", zh: "新增第一隻寵物" },
  { key: "pets.back_to_profile", en: "Back to Profile", zh: "返回個人資料" },
  { key: "pets.update", en: "Update Pet", zh: "更新寵物資料" },
  { key: "pets.saving", en: "Saving...", zh: "儲存中..." },
  { key: "pets.age_years", en: "Age: {age} years", zh: "{age} 歲" },
  { key: "pets.weight_kg", en: "Weight: {weight} kg", zh: "{weight} 公斤" },
  { key: "pets.success.add", en: "Pet added successfully!", zh: "寵物已新增！" },
  { key: "pets.success.add_desc", en: "Your pet has been added to your profile.", zh: "寵物已加入您的個人資料。" },
  { key: "pets.success.update", en: "Pet updated successfully!", zh: "寵物資料已更新！" },
  { key: "pets.success.update_desc", en: "Your pet's information has been updated.", zh: "寵物資料已更新。" },
  { key: "pets.success.delete", en: "Pet removed", zh: "已移除寵物" },
  { key: "pets.success.delete_desc", en: "Your pet has been removed from your profile.", zh: "寵物已從個人資料中移除。" },
  { key: "pets.error.add", en: "Failed to add pet", zh: "無法新增寵物" },
  { key: "pets.error.update", en: "Failed to update pet", zh: "無法更新寵物資料" },
  { key: "pets.error.delete", en: "Failed to delete pet", zh: "無法刪除寵物" },
  { key: "pets.validation.name_required", en: "Pet name is required", zh: "請輸入寵物名稱" },
  { key: "pets.validation.species_required", en: "Species is required", zh: "請選擇種類" },
  { key: "pets.last_visit_clinic", en: "Last Visit Clinic (Optional)", zh: "最近就診的診所（選填）" },
  { key: "pets.last_visit_clinic_placeholder", en: "Search clinic...", zh: "搜尋診所..." },
  { key: "pets.last_visit_date", en: "Last Visit Date (Optional)", zh: "最近就診日期（選填）" },
  { key: "pets.select_species", en: "Select species", zh: "選擇種類" },
  { key: "pets.select_breed", en: "Select breed or type custom", zh: "選擇品種或自行輸入" },
  { key: "pets.custom_breed", en: "Custom breed...", zh: "自訂品種..." },
  { key: "pets.no_clinic_selected", en: "No clinic selected", zh: "未選擇診所" },
  
  // Emergency Symptoms (used in SYMPTOMS array)
  { key: "symptoms.select", en: "Select symptoms (tap all that apply)", zh: "請選擇症狀（可選擇多項）" },
  { key: "symptoms.breathing", en: "Difficulty breathing / Respiratory distress", zh: "呼吸困難 / 呼吸窘迫" },
  { key: "symptoms.vomiting", en: "Vomiting / Nausea", zh: "嘔吐 / 作嘔" },
  { key: "symptoms.seizure", en: "Seizure / Convulsions", zh: "癲癇發作 / 抽搐" },
  { key: "symptoms.unable_stand", en: "Unable to stand or walk", zh: "無法站立或行走" },
  { key: "symptoms.bleeding", en: "Bleeding / Hemorrhage", zh: "出血 / 流血不止" },
  { key: "symptoms.trauma", en: "Trauma / Hit by vehicle", zh: "外傷 / 車禍撞擊" },
  { key: "symptoms.poisoning", en: "Suspected poisoning / Toxin ingestion", zh: "疑似中毒 / 誤食毒物" },
  { key: "symptoms.not_eating", en: "Refusing food/water", zh: "拒絕進食/飲水" },
  { key: "symptoms.choking", en: "Choking / Airway obstruction", zh: "哽塞 / 氣道阻塞" },
  { key: "symptoms.pain", en: "Severe pain / Distress", zh: "劇烈疼痛 / 不安" },
  { key: "symptoms.unconscious", en: "Unconscious / Unresponsive", zh: "昏迷 / 無反應" },
  { key: "symptoms.swollen", en: "Abdominal swelling / Bloating", zh: "腹部腫脹 / 腹脹" },
  { key: "symptoms.diarrhea", en: "Severe diarrhea", zh: "嚴重腹瀉" },
  { key: "symptoms.eye_injury", en: "Eye injury / Vision problem", zh: "眼部受傷 / 視力問題" },
  { key: "symptoms.broken_bone", en: "Fracture / Severe limping", zh: "骨折 / 嚴重跛行" },
  { key: "symptoms.other", en: "Other symptoms", zh: "其他症狀" },
  { key: "symptoms.describe", en: "Describe other symptoms (optional)", zh: "描述其他症狀（選填）" },
  { key: "symptoms.none_selected", en: "Please select at least one symptom", zh: "請至少選擇一個症狀" },
  
  // Common
  { key: "common.cancel", en: "Cancel", zh: "取消" },
  { key: "common.home", en: "Home", zh: "主頁" },
  { key: "common.email", en: "Email", zh: "電郵" },
  { key: "common.years", en: "years", zh: "歲" },
  { key: "button.back", en: "Back", zh: "返回" },
  { key: "button.back_home", en: "Back to Home", zh: "返回主頁" },
  { key: "button.cancel", en: "Cancel", zh: "取消" },
  { key: "button.confirm", en: "Confirm", zh: "確認" },
  { key: "button.save", en: "Save", zh: "儲存" },
  { key: "button.delete", en: "Delete", zh: "刪除" },
  { key: "button.edit", en: "Edit", zh: "編輯" },
  { key: "button.close", en: "Close", zh: "關閉" },
  { key: "loading", en: "Loading...", zh: "載入中..." },
  { key: "loading.profile", en: "Loading profile...", zh: "載入中..." },
  { key: "loading.pets", en: "Loading pets...", zh: "載入中..." },
  { key: "error", en: "Error", zh: "錯誤" },
  { key: "success", en: "Success", zh: "成功" },
  
  // Broadcast Status
  { key: "broadcast.title", en: "Broadcast Status", zh: "廣播狀態" },
  { key: "broadcast.total", en: "Total Sent", zh: "總共發送" },
  { key: "broadcast.sent", en: "Successfully Sent", zh: "成功發送" },
  { key: "broadcast.queued", en: "Queued", zh: "等候中" },
  { key: "broadcast.failed", en: "Failed", zh: "發送失敗" },
  { key: "broadcast.refresh", en: "Refresh", zh: "重新整理" },
  { key: "broadcast.details", en: "Message Details", zh: "訊息詳情" },
  { key: "broadcast.retry_attempts", en: "Retry attempts", zh: "重試次數" },
  { key: "broadcast.created", en: "Created", zh: "已建立" },
  { key: "broadcast.sent_at", en: "Sent", zh: "已發送" },
  { key: "broadcast.failed_at", en: "Failed", zh: "失敗" },
  { key: "broadcast.error", en: "Error", zh: "錯誤" },
  { key: "broadcast.view_content", en: "View Message Content", zh: "查看訊息內容" },

  // Privacy & Legal Pages
  { key: "privacy.title", en: "Privacy Policy", zh: "私隱政策" },
  { key: "privacy.last_updated", en: "Last Updated", zh: "最後更新" },
  { key: "privacy.intro", en: "PetSOS Limited ('we', 'us', or 'PetSOS') is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information in compliance with Hong Kong Personal Data (Privacy) Ordinance (PDPO) and GDPR.", zh: "PetSOS Limited（「我們」）致力保護您的私隱。本政策說明我們如何收集、使用及保護您的個人資料，並符合香港個人資料（私隱）條例及GDPR。" },
  
  { key: "privacy.controller_title", en: "Data Controller", zh: "資料控制者" },
  { key: "privacy.controller_desc", en: "PetSOS Limited acts as the data controller for all personal information collected through this platform. For data protection queries, contact: privacy@petsos.hk", zh: "PetSOS Limited為本平台所收集個人資料的資料控制者。如有資料保護查詢，請聯絡：privacy@petsos.hk" },
  
  { key: "privacy.data_collection_title", en: "Information We Collect", zh: "我們收集的資料" },
  { key: "privacy.data_collection_desc", en: "We collect: (1) Contact information (name, phone, email); (2) Pet information (name, species, breed, age, weight, medical notes); (3) Location data (GPS coordinates, address); (4) Emergency request details (symptoms, urgency); (5) Technical data (IP address, device information).", zh: "我們收集：(1) 聯絡資料（姓名、電話、電郵）；(2) 寵物資料（名稱、品種、年齡、體重、病歷）；(3) 位置資料（GPS座標、地址）；(4) 緊急求助詳情（症狀、緊急程度）；(5) 技術資料（IP地址、裝置資料）。" },
  
  { key: "privacy.lawful_basis_title", en: "Lawful Basis for Processing", zh: "處理資料的法律依據" },
  { key: "privacy.lawful_basis_desc", en: "We process your data based on: (1) Your consent for emergency broadcasts; (2) Legitimate interests in providing emergency coordination services; (3) Legal obligations for audit and compliance.", zh: "我們基於以下理由處理您的資料：(1) 您同意進行緊急廣播；(2) 提供緊急協調服務的合法權益；(3) 審計及合規的法律責任。" },
  
  { key: "privacy.data_usage_title", en: "How We Use Your Information", zh: "我們如何使用您的資料" },
  { key: "privacy.data_usage_desc", en: "Your information is used to: (1) Connect you with veterinary clinics during emergencies; (2) Send emergency alerts via WhatsApp and email; (3) Improve service quality; (4) Comply with legal obligations. We do not sell your data.", zh: "您的資料用於：(1) 在緊急情況下為您聯絡獸醫診所；(2) 透過WhatsApp及電郵發送緊急警報；(3) 改善服務質素；(4) 履行法律責任。我們不會出售您的資料。" },
  
  { key: "privacy.data_sharing_title", en: "Data Recipients", zh: "資料接收者" },
  { key: "privacy.data_sharing_desc", en: "We share your data with: (1) Veterinary clinics you contact; (2) WhatsApp Business API (Meta) for emergency messaging; (3) Email service providers; (4) Database hosting (Neon). All recipients are bound by data protection agreements.", zh: "我們會與以下各方分享您的資料：(1) 您聯絡的獸醫診所；(2) WhatsApp Business API（Meta）用於緊急訊息；(3) 電郵服務供應商；(4) 資料庫託管（Neon）。所有接收者均受資料保護協議約束。" },
  
  { key: "privacy.data_retention_title", en: "Data Retention", zh: "資料保留" },
  { key: "privacy.data_retention_desc", en: "We retain: (1) Emergency requests for 12 months; (2) Pet profiles until deletion requested; (3) Audit logs for 7 years (legal compliance); (4) User accounts until deletion requested. You may request data deletion at any time.", zh: "我們保留：(1) 緊急求助紀錄12個月；(2) 寵物檔案直至您要求刪除；(3) 審計日誌7年（法律合規）；(4) 用戶帳戶直至您要求刪除。您可隨時要求刪除資料。" },
  
  { key: "privacy.international_title", en: "International Data Transfers", zh: "跨境資料轉移" },
  { key: "privacy.international_desc", en: "Your data may be transferred to service providers outside Hong Kong (e.g., Neon - USA, Meta - USA). We ensure adequate safeguards through Standard Contractual Clauses and certified providers.", zh: "您的資料可能轉移至香港以外的服務供應商（如Neon - 美國、Meta - 美國）。我們透過標準合約條款及認證供應商確保足夠保障。" },
  
  { key: "privacy.security_title", en: "Security Measures", zh: "保安措施" },
  { key: "privacy.security_desc", en: "We implement: (1) Encryption at rest and in transit (TLS/SSL); (2) Access controls and authentication; (3) Regular security audits; (4) Secure credential management.", zh: "我們實施：(1) 靜態及傳輸加密（TLS/SSL）；(2) 存取控制及認證；(3) 定期保安審計；(4) 安全憑證管理。" },
  
  { key: "privacy.your_rights_title", en: "Your Rights", zh: "您的權利" },
  { key: "privacy.your_rights_desc", en: "Under PDPO and GDPR, you have the right to: (1) Access your personal data; (2) Export your data (data portability); (3) Correct inaccurate data; (4) Delete your data (right to erasure); (5) Withdraw consent; (6) Lodge a complaint with the Privacy Commissioner.", zh: "根據PDPO及GDPR，您有權：(1) 查閱您的個人資料；(2) 匯出您的資料（資料可攜性）；(3) 更正不準確資料；(4) 刪除您的資料（刪除權）；(5) 撤回同意；(6) 向私隱專員公署投訴。" },
  
  { key: "privacy.complaints_title", en: "Complaints", zh: "投訴" },
  { key: "privacy.complaints_desc", en: "To lodge a complaint: (1) Contact us at privacy@petsos.hk; (2) Contact Hong Kong Privacy Commissioner: enquiry@pcpd.org.hk; (3) For EU residents: Contact your local supervisory authority.", zh: "如需投訴：(1) 聯絡我們：privacy@petsos.hk；(2) 聯絡香港私隱專員公署：enquiry@pcpd.org.hk；(3) 歐盟居民：聯絡當地監管機構。" },
  
  { key: "privacy.contact_title", en: "Contact Us", zh: "聯絡我們" },
  { key: "privacy.contact_desc", en: "For privacy concerns or to exercise your rights: Email: privacy@petsos.hk | Data Protection Officer: dpo@petsos.hk", zh: "如有私隱疑慮或行使您的權利：電郵：privacy@petsos.hk | 資料保護主任：dpo@petsos.hk" },
  
  { key: "terms.title", en: "Terms of Service", zh: "服務條款" },
  { key: "terms.last_updated", en: "Last Updated", zh: "最後更新" },
  { key: "terms.intro", en: "These Terms of Service ('Terms') govern your use of PetSOS. By accessing or using our platform, you agree to be bound by these Terms. If you do not agree, please do not use our services.", zh: "本服務條款（「條款」）規管您使用PetSOS。存取或使用我們的平台即表示您同意受本條款約束。如您不同意，請勿使用我們的服務。" },
  
  { key: "terms.acceptance_title", en: "Acceptance of Terms", zh: "接受條款" },
  { key: "terms.acceptance_desc", en: "By creating an account or using PetSOS services, you acknowledge that you have read, understood, and agree to these Terms and our Privacy Policy. Your continued use constitutes ongoing acceptance.", zh: "建立帳戶或使用PetSOS服務即表示您確認已閱讀、理解並同意本條款及我們的私隱政策。繼續使用即表示持續接受。" },
  
  { key: "terms.service_description_title", en: "Service Description", zh: "服務描述" },
  { key: "terms.service_description_desc", en: "PetSOS is an emergency coordination platform that connects pet owners with veterinary clinics. We facilitate communication but do not provide medical services, veterinary advice, or emergency medical care.", zh: "PetSOS是一個連接寵物主人與獸醫診所的緊急協調平台。我們促進溝通，但不提供醫療服務、獸醫意見或緊急醫療護理。" },
  
  { key: "terms.user_responsibilities_title", en: "User Responsibilities", zh: "用戶責任" },
  { key: "terms.user_responsibilities_desc", en: "You agree to: (1) Provide accurate emergency information; (2) Use the service only for genuine pet emergencies; (3) Respect clinic operating hours; (4) Not misuse the broadcast system. Violations may result in account suspension or termination.", zh: "您同意：(1) 提供準確的緊急資料；(2) 僅在真正的寵物緊急情況下使用服務；(3) 尊重診所營業時間；(4) 不濫用廣播系統。違規可能導致帳戶暫停或終止。" },
  
  { key: "terms.disclaimer_title", en: "Medical Disclaimer", zh: "醫療免責聲明" },
  { key: "terms.disclaimer_desc", en: "PetSOS does not provide medical advice. We do not guarantee clinic availability, response times, or treatment outcomes. In life-threatening situations, contact emergency veterinary services immediately.", zh: "PetSOS不提供醫療意見。我們不保證診所的接診情況、回應時間或治療結果。在危及生命的情況下，請立即聯絡緊急獸醫服務。" },
  
  { key: "terms.limitation_title", en: "Limitation of Liability", zh: "責任限制" },
  { key: "terms.limitation_desc", en: "To the maximum extent permitted by law, PetSOS is not liable for: (1) Direct, indirect, or consequential damages; (2) Loss of data or business; (3) Clinic actions or inactions; (4) Service interruptions. Maximum liability is limited to HKD 100.", zh: "在法律允許的最大範圍內，PetSOS不對以下情況負責：(1) 直接、間接或相應損失；(2) 資料或業務損失；(3) 診所的行為或不行為；(4) 服務中斷。最高責任限於港幣100元。" },
  
  { key: "terms.governing_law_title", en: "Governing Law & Jurisdiction", zh: "適用法律及司法管轄權" },
  { key: "terms.governing_law_desc", en: "These Terms are governed by Hong Kong law. Any disputes shall be resolved exclusively in Hong Kong courts.", zh: "本條款受香港法律管轄。任何爭議應在香港法院專屬解決。" },
  
  { key: "terms.eu_rights_title", en: "EU Consumer Rights", zh: "歐盟消費者權利" },
  { key: "terms.eu_rights_desc", en: "For residents of the European Union, nothing in these Terms affects your statutory consumer rights under EU law, including the right to withdraw from contracts and remedies for defective services.", zh: "對於歐盟居民，本條款內容不影響您在歐盟法律下的法定消費者權利，包括撤回合約的權利及對有缺陷服務的補救措施。" },
  
  { key: "terms.privacy_policy_title", en: "Privacy Policy", zh: "私隱政策" },
  { key: "terms.privacy_policy_desc", en: "Your use of PetSOS is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.", zh: "您使用PetSOS亦受我們的私隱政策管轄。請查閱我們的私隱政策，了解我們如何收集、使用及保護您的個人資料。" },
  
  { key: "terms.termination_title", en: "Service Modification & Termination", zh: "服務修改及終止" },
  { key: "terms.termination_desc", en: "We reserve the right to: (1) Modify or discontinue services at any time; (2) Terminate accounts for violations; (3) Update these Terms with notice. We will provide 30 days notice for material changes.", zh: "我們保留以下權利：(1) 隨時修改或終止服務；(2) 因違規終止帳戶；(3) 在通知後更新本條款。重大變更將提前30天通知。" },
  
  { key: "terms.changes_title", en: "Changes to Terms", zh: "條款變更" },
  { key: "terms.changes_desc", en: "We may update these Terms periodically. We will notify you of material changes via email or platform notice. Continued use after changes constitutes acceptance. Last updated: October 2025.", zh: "我們可能定期更新本條款。我們會透過電郵或平台通知重大變更。變更後繼續使用即表示接受。最後更新：2025年10月。" },
  
  { key: "footer.privacy", en: "Privacy Policy", zh: "私隱政策" },
  { key: "footer.terms", en: "Terms of Service", zh: "服務條款" },
  { key: "footer.contact", en: "Contact", zh: "聯絡我們" },
  { key: "footer.rights", en: "© 2025 PetSOS. All rights reserved.", zh: "© 2025 PetSOS. 版權所有。" },
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
