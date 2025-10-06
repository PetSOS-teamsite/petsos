import { storage } from "./storage";

const translations = [
  // App Title
  { key: "app.title", en: "PetSOS", zh: "PetSOS" },
  { key: "app.disclaimer", en: "⚠️ PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.", zh: "⚠️ PetSOS 只提供緊急支援，並非專業獸醫診斷或醫療建議。如有疑問，請立即聯絡獸醫。" },
  
  // Landing Page
  { key: "landing.subtitle", en: "Emergency veterinary care coordination platform for Hong Kong pet owners", zh: "香港寵物主人的緊急獸醫護理協調平台" },
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
  { key: "emergency.title", en: "Emergency Pet Care", zh: "寵物緊急護理" },
  { key: "emergency.step1.title", en: "What's happening?", zh: "發生什麼事？" },
  { key: "emergency.step2.title", en: "Where are you?", zh: "您在哪裡？" },
  { key: "emergency.step3.title", en: "How can clinics reach you?", zh: "診所如何聯絡您？" },
  { key: "emergency.step_indicator", en: "Step {step} of 3", zh: "第 {step} 步，共3步" },
  { key: "emergency.time_step1", en: "~30s", zh: "約30秒" },
  { key: "emergency.time_step2", en: "~15s", zh: "約15秒" },
  { key: "emergency.time_step3", en: "~10s", zh: "約10秒" },
  
  // Emergency Step 1 - Symptoms
  { key: "symptoms.urgent", en: "What's happening to your pet right now?", zh: "您的寵物現在出現什麼狀況？" },
  { key: "symptoms.select_all", en: "Tap all symptoms that apply", zh: "請選擇所有適用的症狀" },
  { key: "symptoms.describe", en: "Describe the symptoms...", zh: "請描述症狀..." },
  { key: "emergency.select_pet", en: "Which pet is this for?", zh: "這是哪一隻寵物？" },
  { key: "optional", en: "Optional", zh: "選填" },
  { key: "emergency.pet_details", en: "Pet Information", zh: "寵物資料" },
  { key: "emergency.pet_details_desc", en: "Tell us about your pet so clinics can prepare", zh: "告訴我們您寵物的資料，讓診所可以預先準備" },
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
