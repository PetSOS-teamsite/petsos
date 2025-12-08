# Google Play Store Listing Guide for PetSOS

## Quick Reference

| Item | Status/Value |
|------|-------------|
| App Package Name | `site.petsos.app` |
| Privacy Policy URL | `https://petsos.site/privacy` |
| Developer Name | Your name or company |
| Developer Email | Your contact email |
| Category | Medical (Primary) or Lifestyle |
| Content Rating | Everyone |

---

## 1. App Descriptions

### Short Description (80 characters max)
```
Emergency vet finder for Hong Kong. One-tap alerts to nearby 24-hour clinics.
```

Alternative options:
- `Find emergency vets fast. Alert 24-hour clinics instantly when pets need help.`
- `Pet emergency? Find and alert 24-hour vet clinics near you in Hong Kong.`

### Full Description (4000 characters max)
```
PetSOS is your emergency veterinary care companion for Hong Kong. When your pet faces a medical emergency, every second counts. PetSOS helps you find and contact 24-hour veterinary clinics instantly.

KEY FEATURES:

EMERGENCY BROADCAST
One tap sends your pet's emergency details to nearby 24-hour veterinary clinics via WhatsApp. Include symptoms, location, and contact information so clinics can respond quickly.

CLINIC DIRECTORY
Browse comprehensive listings of 24-hour animal hospitals across Hong Kong, organized by district. View contact details, addresses, and get directions with one tap.

PET PROFILES
Store your pets' information including breed, age, medical history, and existing vet relationships. This information can be shared during emergencies for faster treatment.

BILINGUAL SUPPORT
Full support for English and Traditional Chinese (繁體中文), making the app accessible to all Hong Kong pet owners.

VOICE RECORDING
Describe your pet's symptoms by voice if typing is difficult during a stressful emergency. AI-powered transcription captures your message accurately.

OFFLINE SUPPORT
Emergency requests are queued even without internet connection and automatically sent when you're back online.

WHO IS THIS FOR?
- Pet owners in Hong Kong
- Anyone caring for animals who may need emergency vet services
- Pet sitters and dog walkers who need quick access to emergency contacts

PRIVACY FOCUSED
Your data is protected under Hong Kong's Personal Data Privacy Ordinance (PDPO). We only collect information necessary to provide emergency services. You control what information is shared with clinics.

ALWAYS AVAILABLE
PetSOS is designed for emergencies - when you need help most. The app works 24/7, just like the clinics it connects you to.

Download PetSOS now and be prepared for pet emergencies. We hope you never need it, but when you do, we're here to help.

Questions or feedback? Contact us at petsos.site
```

---

## 2. Screenshots Required

### Minimum Requirements
- **Phone screenshots**: 2-8 screenshots
- **Recommended**: 4-6 screenshots showing key features
- **Dimensions**: 16:9 or 9:16 aspect ratio (1080x1920 recommended)

### Suggested Screenshot Sequence

1. **Home/Landing Page** - Shows the app's main interface and emergency button
2. **Emergency Form** - The multi-step emergency request form
3. **Clinic Directory** - List of 24-hour clinics by district
4. **Clinic Details** - Individual clinic with call/WhatsApp buttons
5. **Pet Profile** - Pet management with medical records
6. **Bilingual Support** - Show Chinese language option

### Screenshot Tips
- Use real device or emulator screenshots (not mockups)
- Show actual app content, not placeholder data
- Highlight key features with minimal text overlays
- Keep any text readable and under 20% of image

---

## 3. Feature Graphic

### Requirements
- **Size**: 1024 x 500 pixels (PNG or JPEG)
- **Format**: No transparency, sRGB color space
- **Content**: App name, logo, and key visual

### Design Suggestions
- Use PetSOS red (#EF4444) as primary color
- Include "PetSOS" text prominently
- Add a pet-related visual (cat/dog silhouette)
- Tagline: "Emergency Vet Finder" or "Find Help Fast"
- Keep important content centered (edges may be cropped)

---

## 4. App Icon

### Already Configured
The app icons are already set up in:
- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### High-Res Icon for Play Store
- **Size**: 512 x 512 pixels (PNG, 32-bit with alpha)
- Use the same design as app icon

---

## 5. Data Safety Questionnaire

Answer these questions in Google Play Console:

### Data Collection

| Data Type | Collected? | Purpose | Shared? |
|-----------|------------|---------|---------|
| Name | Yes | Account/Profile | Yes (with clinics during emergency) |
| Email | Yes | Account/Login | No |
| Phone number | Yes | Emergency contact | Yes (with clinics during emergency) |
| Address | Optional | Emergency location | Yes (with clinics during emergency) |
| Pet information | Yes | Emergency details | Yes (with clinics during emergency) |
| Location | Yes | Find nearby clinics | No |
| Device identifiers | Yes | Push notifications | No |

### Data Handling Practices

- **Encrypted in transit**: Yes (HTTPS/TLS)
- **Encrypted at rest**: Yes (PostgreSQL encryption)
- **Users can request deletion**: Yes
- **Data retention**: Until user requests deletion
- **Data shared with third parties**: Only veterinary clinics during emergencies (with user consent)

### Data Safety Declaration Text
```
PetSOS collects personal and pet information to facilitate emergency veterinary care. Your data is encrypted and only shared with veterinary clinics when you initiate an emergency request. You can delete your data anytime from your profile settings. Location is used only to find nearby clinics and is not stored permanently.
```

---

## 6. Content Rating Questionnaire

Select these responses in the Play Console rating questionnaire:

- **Violence**: None
- **Sexual content**: None
- **Language**: None
- **Controlled substances**: None (reference to veterinary medicine is medical, not recreational)
- **User-generated content**: Yes (reviews/ratings of clinics - requires moderation)
- **Personal information collection**: Yes (for emergency services)
- **Location sharing**: Yes (to find nearby clinics)
- **Ads**: No (if no ads in app)
- **In-app purchases**: No (if no purchases)

**Expected Rating**: Everyone (E)

---

## 7. App Category & Tags

### Primary Category
**Medical** - Most accurate for emergency healthcare coordination

### Secondary Category (if allowed)
**Lifestyle** - Pet-related apps often fit here

### Tags/Keywords
- Emergency
- Veterinary
- Pet care
- Hong Kong
- 24-hour clinic
- Animal hospital
- Pet emergency
- Vet finder

---

## 8. Contact Details for Play Store

### Developer Contact
- **Developer Name**: [Your name or company name]
- **Email**: [Your contact email - required, visible on store]
- **Website**: https://petsos.site
- **Privacy Policy**: https://petsos.site/privacy

### Physical Address (Optional but recommended)
Required for certain regions. Use your business address if available.

---

## 9. Release Notes for Version 1.0.0

```
First release of PetSOS - Emergency Veterinary Care Finder for Hong Kong.

Features:
- One-tap emergency broadcast to nearby 24-hour vet clinics
- Comprehensive clinic directory by district
- Pet profile management with medical records
- Voice recording for emergency descriptions
- Bilingual support (English & Traditional Chinese)
- Push notifications for updates
- Offline emergency queue
```

---

## 10. Pre-Launch Checklist

Before uploading to Play Store:

- [ ] Privacy policy page accessible at https://petsos.site/privacy
- [ ] All screenshots captured from actual app
- [ ] Feature graphic created (1024x500)
- [ ] High-res icon ready (512x512)
- [ ] App bundle (AAB) signed and built
- [ ] Tested on multiple Android devices/versions
- [ ] Data safety questionnaire completed
- [ ] Content rating questionnaire completed
- [ ] Developer contact email verified
- [ ] App descriptions reviewed for accuracy

---

## 11. Building the App Bundle

From your local machine with Android Studio:

```bash
# 1. Clone the repository
git clone [your-repo-url]

# 2. Install dependencies
npm install

# 3. Build web assets
npm run build

# 4. Sync with Android project
npx cap sync android

# 5. Open in Android Studio
npx cap open android

# 6. In Android Studio:
#    Build → Generate Signed Bundle/APK
#    Select "Android App Bundle"
#    Create or use existing keystore
#    Build release bundle
```

The AAB file will be in: `android/app/release/app-release.aab`

---

## 12. Keystore Management

### First-Time Setup
When generating your signed bundle, create a new keystore:
- **Key alias**: petsos-upload-key
- **Validity**: 25+ years
- **Store password**: [create strong password]
- **Key password**: [create strong password]

### IMPORTANT
- **Backup your keystore file** - You cannot update your app without it
- **Save passwords securely** - Consider a password manager
- Store a copy of the keystore outside your local machine

---

## Need Help?

For Google Play Console support:
- https://support.google.com/googleplay/android-developer

For PetSOS-specific questions:
- Review this guide and the Android project setup in `/android/`
- Check `capacitor.config.ts` for app configuration
