# Hong Kong Localization Migration Guide

This guide explains how to run the HK Chinese localization updates on your production database.

## 📋 What This Migration Does

Updates all translations to use natural Hong Kong Chinese terminology:
- Changes "Mixed Breed" from **混種犬** to **唐狗** (colloquial HK term)
- Updates emergency flow to use **毛孩** (furry kids) instead of repetitive **寵物** (pets)
- Updates 17 translation keys across emergency, profile, and clinic results pages

---

## 🚀 Option 1: Run via Render Dashboard (Recommended)

### Step 1: Access Database Console

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click on your **PostgreSQL database** (not the web service)
3. Click **"Connect"** button (top right)
4. Select **"PSQL Command"**
5. You'll see a command like:
   ```bash
   PGPASSWORD=xxx psql -h xxx.render.com -U petsos_app_user petsos_app
   ```
6. **Copy this command** (we'll use it in a moment)

### Step 2: Upload Migration File

Since Render's web interface doesn't allow file uploads, we'll use the command line:

**On your local machine:**

```bash
# Navigate to the scripts folder
cd /path/to/PetSOS/scripts

# Connect to Render database and run the migration
# (Replace with the PSQL command you copied from Render)
PGPASSWORD=xxx psql -h xxx.render.com -U petsos_app_user petsos_app < migrate-hk-localization.sql
```

### Step 3: Verify Changes

After running the migration, verify the updates:

```sql
-- Check pet breed updated
SELECT breed_en, breed_zh FROM pet_breeds WHERE breed_en = 'Mixed Breed';
-- Should show: Mixed Breed | 唐狗

-- Check translations updated (should show ~17 rows with 毛孩)
SELECT key, value FROM translations WHERE language = 'zh-HK' AND value LIKE '%毛孩%' ORDER BY key;
```

---

## 🔧 Option 2: Manual Copy-Paste (If Option 1 Doesn't Work)

### Step 1: Access Database Shell

1. Render Dashboard → Your PostgreSQL database
2. Click **"Connect"** → Select **"PSQL Command"**
3. Copy the command and run it in your terminal
4. You should see a prompt like: `petsos_app=>`

### Step 2: Run SQL Commands Manually

Open `scripts/migrate-hk-localization.sql` in a text editor, then:

1. **Copy the UPDATE statements** (starting from line 8)
2. **Paste them one by one** into the PSQL shell
3. Press **Enter** after each statement
4. You should see `UPDATE 1` for each successful update

### Step 3: Verify

Run the verification queries at the bottom of the file.

---

## 🎯 Expected Results

After migration, you should see:

✅ **Pet Breed Dropdown:** Shows **唐狗** instead of 混種犬
✅ **Emergency Flow:** Uses **毛孩** throughout (instead of 寵物)
✅ **Broadcast Messages:** "毛孩緊急通知已發送至 X 間診所"
✅ **Profile Page:** Shows "我的毛孩" (My Furry Kids)

---

## ⚠️ Troubleshooting

### "Permission denied"
Make sure you're using the database user from the PSQL command (usually `petsos_app_user`).

### "Column does not exist"
Your database schema might be different. Check the column names:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'translations';
```

### "No rows updated"
The translation keys might not exist yet. Check what's in the database:
```sql
SELECT key, language, value FROM translations WHERE key LIKE '%pet%' LIMIT 10;
```

---

## 🔄 Rollback (If Needed)

If you need to revert the changes:

```sql
-- Revert pet breed
UPDATE pet_breeds SET breed_zh = '混種犬' WHERE breed_en = 'Mixed Breed';

-- Revert key translations (example)
UPDATE translations SET value = '寵物緊急警報' WHERE key = 'clinic_results.broadcast_alert_title' AND language = 'zh-HK';
-- ... (continue for other keys)
```

---

## 📞 Need Help?

If you encounter issues:
1. Take a screenshot of the error message
2. Check Render's database logs
3. Verify you're connected to the production database (not development)
