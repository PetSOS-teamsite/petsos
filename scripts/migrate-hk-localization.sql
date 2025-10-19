-- ============================================================
-- Hong Kong Chinese Localization Migration
-- Updates translations to use natural HK terminology (毛孩)
-- ============================================================

-- 1. Update pet breed: Mixed Breed to use colloquial HK term
UPDATE pet_breeds 
SET breed_zh = '唐狗' 
WHERE breed_en = 'Mixed Breed';

-- 2. Update emergency flow translations to use 毛孩 (furry kids)
UPDATE translations 
SET value = '毛孩緊急情況' 
WHERE key = 'clinic_results.broadcast_alert_title' AND language = 'zh-HK';

UPDATE translations 
SET value = '需要緊急協助' 
WHERE key = 'clinic_results.emergency_care_needed' AND language = 'zh-HK';

UPDATE translations 
SET value = '我的毛孩需要緊急協助' 
WHERE key = 'clinic_results.whatsapp_message_request' AND language = 'zh-HK';

UPDATE translations 
SET value = '毛孩出現什麼狀況？' 
WHERE key = 'emergency.step1.label' AND language = 'zh-HK';

UPDATE translations 
SET value = '這是哪一隻毛孩？' 
WHERE key = 'emergency.select_pet' AND language = 'zh-HK';

UPDATE translations 
SET value = '正在載入毛孩資料...' 
WHERE key = 'emergency.loading_pets' AND language = 'zh-HK';

UPDATE translations 
SET value = '廣播毛孩緊急通知' 
WHERE key = 'clinic_results.broadcast_emergency' AND language = 'zh-HK';

UPDATE translations 
SET value = '例如：狗狗呼吸困難' 
WHERE key = 'emergency.step1.placeholder' AND language = 'zh-HK';

UPDATE translations 
SET value = '系統會透過WhatsApp及電郵將毛孩緊急通知發送至所有診所。' 
WHERE key = 'clinic_results.broadcast_desc_all' AND language = 'zh-HK';

UPDATE translations 
SET value = '系統會透過WhatsApp及電郵將毛孩緊急通知發送至已選診所。' 
WHERE key = 'clinic_results.broadcast_desc_selected' AND language = 'zh-HK';

-- 3. Update clinic results page translations
UPDATE translations 
SET value = '毛孩' 
WHERE key = 'clinic_results.pet' AND language = 'zh-HK';

UPDATE translations 
SET value = '毛孩名稱' 
WHERE key = 'clinic_results.pet_name' AND language = 'zh-HK';

UPDATE translations 
SET value = '緊急通知已發送至診所' 
WHERE key = 'clinic_results.broadcast_success_desc' AND language = 'zh-HK';

-- 4. Update profile and home page translations
UPDATE translations 
SET value = '我的毛孩' 
WHERE key = 'home.my_pets' AND language = 'zh-HK';

UPDATE translations 
SET value = '管理我的毛孩' 
WHERE key = 'profile.manage_pets' AND language = 'zh-HK';

UPDATE translations 
SET value = '管理毛孩資料' 
WHERE key = 'home.my_pets.desc' AND language = 'zh-HK';

-- 5. Update pet profile translations
UPDATE translations 
SET value = '毛孩資料' 
WHERE key = 'emergency.pet_details' AND language = 'zh-HK';

UPDATE translations 
SET value = '告訴我們您毛孩的資料，讓診所可以預先準備' 
WHERE key = 'emergency.pet_details_desc' AND language = 'zh-HK';

-- ============================================================
-- Verification: Check updated records
-- ============================================================
-- Run these SELECT queries to verify the changes:
--
-- SELECT breed_en, breed_zh FROM pet_breeds WHERE breed_en = 'Mixed Breed';
-- SELECT key, value FROM translations WHERE language = 'zh-HK' AND value LIKE '%毛孩%' ORDER BY key;
-- ============================================================
