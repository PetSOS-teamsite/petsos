# LINE Messaging Integration Guide for PetSOS

## 🎯 Overview

PetSOS now supports **3 messaging channels** for notifying hospitals about pet emergencies:

1. **LINE** (Priority 1) - Fast, reliable messaging via LINE Official Account
2. **WhatsApp** (Priority 2) - Fallback if LINE not available
3. **Email** (Priority 3) - Fallback if WhatsApp not available

## ✅ What's Been Implemented

### Database Changes
- ✅ Added `line_user_id` column to `clinics` table
- ✅ Updated message types to support `'line'` | `'whatsapp'` | `'email'`

### Code Changes
- ✅ Installed `@line/bot-sdk` package
- ✅ Added LINE client configuration in `MessagingService`
- ✅ Created `sendLineMessage()` method
- ✅ Updated `processMessage()` to handle LINE messages
- ✅ Updated `broadcastEmergency()` with LINE priority

### Message Priority Logic
```
IF clinic has LINE user ID
  → Send via LINE
ELSE IF clinic has WhatsApp number
  → Send via WhatsApp
ELSE IF clinic has email
  → Send via Email
ELSE
  → Mark as failed
```

## 🚀 Setup Instructions

### Step 1: Create LINE Official Account

1. Go to https://manager.line.biz/
2. Click **"Create a LINE Official Account"**
3. Fill in account details:
   - Account name: **PetSOS Emergency Alerts**
   - Category: **Medical/Healthcare**
   - Description: Emergency veterinary care coordination

### Step 2: Enable Messaging API

1. In LINE Official Account Manager
2. Go to **Settings** → **Messaging API**
3. Click **"Enable Messaging API"**
4. Select/create a provider (e.g., "PetSOS")

### Step 3: Get API Credentials

1. Go to https://developers.line.biz/console/
2. Select your channel (PetSOS)
3. Go to **"Messaging API"** tab
4. Copy these credentials:
   - **Channel Access Token** (long-lived)
   - **Channel Secret**

### Step 4: Add Secrets to Replit

Add these environment variables to your Replit project:

```bash
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here
```

**How to add in Replit:**
1. Open Secrets panel (🔒 icon in left sidebar)
2. Add both variables
3. Restart your application

### Step 5: Configure Webhook (Optional for Two-Way Communication)

If you want hospitals to reply back:

1. In LINE Developers Console → Messaging API tab
2. Set **Webhook URL**: `https://your-app.onrender.com/api/line/webhook`
3. Enable **Use webhook**
4. Disable **Auto-reply messages** (optional)

## 🏥 Hospital Setup - Getting LINE User IDs

### Method 1: Via QR Code (Recommended)

1. Hospital staff open LINE app
2. Scan PetSOS Official Account QR code
3. Send a message to activate the connection
4. Backend captures user ID from webhook event
5. Admin links LINE user ID to hospital record

### Method 2: Manual Entry (Temporary)

For testing, you can manually add LINE user IDs:

1. Go to your admin panel
2. Find the hospital record
3. Add their LINE user ID to the `lineUserId` field

**How to get a LINE User ID:**
- Hospital staff add your LINE Official Account as friend
- They send a test message
- Check webhook logs for their `userId`

## 📱 Testing the Integration

### Test 1: Check Configuration

```bash
# Verify LINE credentials are loaded
curl https://your-app.onrender.com/health
```

Look for LINE configuration in logs.

### Test 2: Send Test Emergency

1. Create a test hospital with a LINE user ID
2. Submit an emergency request in the app
3. Select the test hospital
4. Check if LINE message is received

### Test 3: Verify Message Priority

Create 3 test hospitals:
- **Hospital A**: Has LINE, WhatsApp, and Email → Should use LINE
- **Hospital B**: Has only WhatsApp and Email → Should use WhatsApp
- **Hospital C**: Has only Email → Should use Email

Send emergency to all 3 and verify correct channels are used.

## 🔍 Monitoring & Debugging

### Check Message Logs

All sent messages are logged in the `messages` table:

```sql
SELECT 
  id,
  clinic_id,
  message_type,
  status,
  sent_at,
  error_message
FROM messages
WHERE message_type = 'line'
ORDER BY created_at DESC
LIMIT 10;
```

### Common Issues

**❌ Error: "LINE credentials not configured"**
- Solution: Add `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET` to Replit Secrets

**❌ Error: "Invalid LINE user ID"**
- Solution: Verify the hospital's `line_user_id` is correct
- User IDs start with `U` (e.g., `U4af4980629...`)

**❌ Messages not sending**
- Check server logs for LINE API errors
- Verify webhook is enabled in LINE Console
- Ensure hospital is friends with your Official Account

## 📊 Message Format

LINE messages will be sent in clean text format:

```
🚨 EMERGENCY PET ALERT

Last Visited: Happy Paws Veterinary Clinic
Pet: Max
Species: Dog
Breed: Golden Retriever
Age: 5 years
Weight: 30kg
Emergency: Difficulty breathing, pale gums
Medical History: Previous heart murmur detected
Location: Central, Hong Kong Island
Owner: John Chan
Contact: +852 9123 4567
```

## 🔄 Message Flow Diagram

```
User submits emergency
         ↓
System finds nearby clinics
         ↓
For each clinic:
         ↓
    ┌─────────────┐
    │ Has LINE ID?│ → YES → Send via LINE → ✅ Done
    └─────────────┘
         ↓ NO
    ┌─────────────┐
    │ Has WhatsApp?│ → YES → Send via WhatsApp → ✅ Done
    └─────────────┘
         ↓ NO
    ┌─────────────┐
    │ Has Email?  │ → YES → Send via Email → ✅ Done
    └─────────────┘
         ↓ NO
    Mark as failed ❌
```

## 🎯 Next Steps

1. ✅ Set up LINE Official Account
2. ✅ Add credentials to Replit
3. ✅ Test with your own LINE account
4. 📱 Create onboarding flow for hospitals
5. 📊 Add admin dashboard to manage LINE connections
6. 🔔 Set up webhook handler for replies (optional)

## 📝 Database Schema Reference

### Clinics Table (Updated)
```typescript
clinics {
  id: string
  name: string
  phone: string
  whatsapp?: string     // WhatsApp number
  email?: string        // Email address
  lineUserId?: string   // ✨ NEW: LINE user ID
  // ... other fields
}
```

### Messages Table (Updated)
```typescript
messages {
  id: string
  emergencyRequestId: string
  clinicId: string
  messageType: 'line' | 'whatsapp' | 'email'  // ✨ Updated
  recipient: string
  content: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  // ... other fields
}
```

## 🆘 Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify LINE Official Account settings
3. Test with LINE Official Account tester tool
4. Check LINE Developers documentation: https://developers.line.biz/en/docs/

---

**Integration completed on:** November 3, 2025
**Status:** ✅ Ready for testing
