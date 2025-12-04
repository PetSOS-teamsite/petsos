# PetSOS App Store Deployment Guide

This guide explains how to build and deploy PetSOS to the iOS App Store and Google Play Store.

## Prerequisites

### Developer Accounts
- **Apple Developer Account** ($99/year): https://developer.apple.com
- **Google Play Developer Account** ($25 one-time): https://play.google.com/console

### Development Environment
- **For iOS**: macOS with Xcode 15+
- **For Android**: Android Studio with SDK 34+

## Project Setup

### 1. Build the Web App

```bash
# Build the production web app
npm run build
```

### 2. Initialize Native Platforms

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android

# Sync web build with native platforms
npx cap sync
```

## iOS Deployment

### 1. Open in Xcode

```bash
npx cap open ios
```

### 2. Configure Xcode Project

1. Select the project in the navigator
2. Under "Signing & Capabilities":
   - Select your Team
   - Set Bundle Identifier: `site.petsos.app`
3. Add capabilities:
   - Push Notifications
   - Background Modes (Remote notifications)

### 3. Configure Push Notifications

1. In Apple Developer Portal, create an APNs Key
2. Upload the key to Firebase Console (Project Settings > Cloud Messaging > Apple app configuration)
3. Add the GoogleService-Info.plist to the iOS project

### 4. App Icons and Splash Screens

Icons are pre-generated in `resources/ios/`:
- Copy `AppIcon.appiconset` to `ios/App/App/Assets.xcassets/`
- Copy splash screens to the appropriate location

### 5. Build for App Store

1. Select "Any iOS Device" as build target
2. Product > Archive
3. Distribute App > App Store Connect

### 6. App Store Connect Setup

1. Create new app in App Store Connect
2. Fill in app information:
   - Name: PetSOS - Emergency Veterinary Care
   - Subtitle: 24-Hour Pet Emergency Help
   - Category: Health & Fitness (Medical subcategory)
   - Privacy Policy URL: https://petsos.site/privacy
3. Upload screenshots (see Screenshot Guidelines below)
4. Submit for review

## Android Deployment

### 1. Open in Android Studio

```bash
npx cap open android
```

### 2. Configure Build

1. Update `android/app/build.gradle`:
   ```gradle
   android {
       defaultConfig {
           applicationId "site.petsos.app"
           minSdkVersion 22
           targetSdkVersion 34
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

2. Configure signing:
   ```bash
   # Generate keystore
   keytool -genkey -v -keystore petsos-release.keystore -alias petsos -keyalg RSA -keysize 2048 -validity 10000
   ```

### 3. Configure Push Notifications

1. Download `google-services.json` from Firebase Console
2. Place in `android/app/`

### 4. App Icons

Icons are pre-generated in `resources/android/`:
- Copy all `mipmap-*` folders to `android/app/src/main/res/`

### 5. Build Release APK/AAB

```bash
cd android
./gradlew bundleRelease
```

The AAB file will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### 6. Google Play Console Setup

1. Create new app in Google Play Console
2. Fill in store listing:
   - App name: PetSOS - Emergency Veterinary Care
   - Short description: Alert 24-hour vet clinics with one tap
   - Full description: (see below)
   - Category: Medical
3. Upload screenshots
4. Complete content rating questionnaire
5. Submit for review

## App Store Descriptions

### Short Description (80 chars)
```
Alert 24-hour animal hospitals instantly when your pet needs emergency care.
```

### Full Description
```
PetSOS connects pet owners with 24-hour veterinary clinics during emergencies. With one tap, broadcast your emergency to nearby clinics and get help fast.

KEY FEATURES:
- One-tap emergency broadcast to 24-hour clinics
- GPS-powered clinic finder
- WhatsApp direct connection to clinics
- Pet profile management
- Medical record storage
- Bilingual support (English/Chinese)

EMERGENCY FEATURES:
- Voice-to-text symptom description
- AI-powered symptom analysis
- Real-time clinic availability
- Distance-based clinic sorting

COVERAGE:
- Hong Kong Island
- Kowloon
- New Territories

Your pet's health can't wait. Download PetSOS today.
```

## Screenshot Guidelines

### iOS Screenshots Required:
- 6.5" Display (1284 x 2778 pixels)
- 5.5" Display (1242 x 2208 pixels)
- 12.9" iPad Pro (2048 x 2732 pixels) - optional

### Android Screenshots Required:
- Phone (16:9 aspect ratio)
- 7" Tablet (optional)
- 10" Tablet (optional)

### Recommended Screenshots:
1. Landing page with emergency button
2. Emergency form (symptom selection)
3. Clinic results with distance
4. Clinic directory
5. Pet profile management

## Privacy & Compliance

### Required Policies
- Privacy Policy: https://petsos.site/privacy
- Terms of Service: https://petsos.site/terms

### Data Collection Disclosure

**iOS App Privacy:**
- Location: Used for finding nearby clinics
- Contact Info: Used for emergency communication
- Health Records: Pet medical information storage

**Android Data Safety:**
- Location data: Collected for core functionality
- Personal info: Name, phone for emergency contact
- Health info: Pet health records

## Testing Before Submission

### TestFlight (iOS)
1. Archive and upload build
2. Add internal testers
3. Test all features especially:
   - Push notifications
   - Location services
   - Emergency flow

### Internal Testing (Android)
1. Create internal testing track
2. Upload AAB
3. Add testers via email

## Capacitor Configuration

The `capacitor.config.ts` is already configured with:
- App ID: `site.petsos.app`
- App Name: `PetSOS`
- Splash screen settings
- Status bar configuration
- Push notification options

## Troubleshooting

### iOS Build Issues
- Ensure Xcode is up to date
- Clean build folder: Cmd + Shift + K
- Reset package cache: File > Packages > Reset Package Caches

### Android Build Issues
- Sync Gradle: File > Sync Project with Gradle Files
- Invalidate caches: File > Invalidate Caches / Restart

### Push Notification Issues
- Verify APNs key is configured in Firebase
- Check entitlements in Xcode
- Verify google-services.json is in correct location

## Version Updates

When releasing new versions:

1. Update version in `capacitor.config.ts`
2. Rebuild: `npm run build`
3. Sync: `npx cap sync`
4. Update native version codes
5. Archive and upload
