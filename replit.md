# Overview

PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics. It facilitates one-tap broadcasting of emergency cases to nearby clinics and offers direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy compliance, aiming to streamline emergency pet care coordination and improve pet welfare during crises.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Frontend Stack**: React with TypeScript (Vite), Wouter, TanStack React Query, shadcn/ui (Radix UI + Tailwind CSS), React Hook Form with Zod.
- **Design Principles**: Accessible, customizable components; minimal bundle size; Tailwind CSS for theming; type-safe form validation.
- **Branding**: Text-based "PetSOS" logo, vibrant red (#EF4444) primary color, custom SVG favicon.
- **PWA Support**: Full Progressive Web App support with web app manifest, installable to home screen, standalone display mode, emergency and clinic shortcuts.
- **Native Mobile Apps**: Capacitor-based iOS and Android app wrappers for App Store and Play Store deployment. Includes native push notifications, haptic feedback, deep linking, and platform-specific UI adaptations.
- **Localization**: Bilingual optimization (EN/ZH-HK), comprehensive Open Graph and Twitter Cards, geo-targeting, database-stored translations, colloquial HK terminology.
- **Emergency UI**: Multi-step emergency request form, compact VoiceRecorder UI, real-time editable broadcast messages.
- **Clinic Display**: Compact clinic action buttons, brand-aligned directory, red-themed compact cards, clickable cards with Maps integration, mobile-optimized horizontally scrollable region tabs.
- **Partner Prioritization**: Partner clinics are prioritized and identified with purple/blue gradient badges. Sorting hierarchy: existing patient clinics → partner clinics → distance-sorted remaining clinics.

## Technical Implementations
- **Backend Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Data Storage**: PostgreSQL with JSONB for flexible metadata, PostGIS for geospatial queries, Drizzle ORM for type-safe queries.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, hospitals, requests), Queue System, Rate Limiting.
- **Security**: Production-grade rate limiting, GDPR/PDPO compliance, Passport.js for multi-option authentication, role-based access control, session-based authentication.
- **Authentication Methods**: Google OAuth, Email/Password, Phone/Password.
- **Emergency Broadcasts**: Enhanced content includes full pet profile information, support for hospital program prioritization, existing patient recognition.
- **Geolocation**: PostGIS for server-side geospatial queries, geography column with GIST spatial index, auto-user location detection, manual override.
- **Messaging Architecture**: WhatsApp Business API as primary, email fallback, queue-based processing, template-based messaging.
- **Analytics & Monitoring**: Google Analytics 4 (GA4), Sentry for error tracking and performance monitoring.
- **SEO Optimization**: Comprehensive bilingual SEO with performance-first approach, Core Web Vitals monitoring, code splitting, image optimization, structured data (VeterinaryClinic, LocalBusiness, Breadcrumb schemas), hreflang tags for EN/zh-HK, local SEO, technical SEO, social integration.
- **Push Notifications**: Firebase Cloud Messaging (FCM) powered web push notifications for emergency alerts and platform updates. Admin broadcast composer with language targeting, audit logging, and notification history. Client-side permission banner with graceful fallback.
- **Multi-Environment Configuration**: Centralized configuration for development, staging, and production environments using `.env` files.
- **Deployment**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment, Infrastructure as Code.

## Feature Specifications
- **User & Pet Management**: CRUD operations for profiles and pets, bilingual breed selection.
- **Pet Medical Records**: Secure document storage for pet medical files (blood tests, X-rays, vaccinations, surgery reports, prescriptions) using Replit Object Storage with ACL-based access control. Users can upload, view, and delete medical records. Consent-based emergency sharing allows medical record summaries to be included in emergency broadcasts when enabled.
- **Hospital Management**: Comprehensive admin interface for managing 24-hour animal hospitals with enhanced profiles, including tabbed forms (Basic Info, Photos, Facilities, Medical Services, Operational), photo management, detailed facility and medical service fields, and custom array field handling.
- **Hospital Owner Self-Service**: Verified hospital owners can update their own profiles using 6-digit access codes generated by admins, with auto-save to database and audit logging.
- **Emergency Request Flow**: Multi-step form (symptoms & pet → location → contact info with optional voice recording), supports authenticated and anonymous users.
- **Voice Recording**: AI-powered symptom analysis from voice transcripts (OpenAI), bilingual support (EN/ZH-HK), automatic fallback to manual text entry.
- **Emergency Request Editing**: Post-submission editing of contact info, symptoms, location with real-time broadcast message updates, Zod validation, audit trail, GPS location support, and bilingual UI.
- **Internationalization**: Database-stored translations (EN, zh-HK), client-side language detection, comprehensive bilingual support.
- **Multi-Region Configuration**: Database-driven configuration for countries, regions, and pet breeds, dynamic loading in UI components.
- **Admin Push Notifications**: Admin panel (`/admin/notifications`) for composing and broadcasting push notifications to all users or by language preference. Includes notification history with recipient counts and delivery status. Supports scheduled notifications with date/time picker and cancellation.
- **Hospital Access Code Expiry**: Hospital access codes now have configurable expiration (default 72 hours). Expired codes are rejected during validation.
- **User Notification Preferences**: Users can control notification types (emergency alerts, platform updates, marketing) via profile settings.
- **Storage Quotas**: Medical record storage limited to 100MB per user, 50 records max, 10MB per file. Quota validation at upload and record creation.
- **Pet Photo Upload**: Pet profiles support photo uploads with image preview, stored in object storage with public ACL.
- **Hospital Photo Upload**: Hospital photos can be uploaded directly from device (in addition to URL input) by both verified hospital owners and admins. Photos are stored in object storage with public ACL. API routes support verification code authentication for owners and session-based auth for admins.
- **Offline Emergency Support**: Service worker queues emergency requests when offline, processes on reconnection or app startup. Visual indicator shows offline status and queued count.
- **Admin Two-Factor Authentication (2FA)**: TOTP-based 2FA for admin accounts with QR code setup, backup codes (single-use, hashed), encrypted secrets at rest (AES-256-GCM).
- **Clinic Reviews/Ratings**: Pet owners can rate clinics (1-5 stars) with optional text reviews. Reviews require moderation (pending → approved). Average ratings and counts cached on clinic records.
- **Drag-and-Drop Upload**: Enhanced medical record upload with drag-and-drop zone, file previews, upload progress, memory-safe cleanup.
- **Admin Analytics Dashboard**: Visual analytics at `/admin/analytics` with summary cards, line charts for trends, bar charts for regional distribution, pie charts for status breakdown. Configurable date ranges.
- **Two-Way WhatsApp Chat**: Admin chat interface at `/admin/chats` for two-way messaging with hospitals. Features include: conversation list with unread counts, message threading, real-time polling, optimistic updates, archive/unarchive, hospital linking, and message status tracking (sent/delivered/read). Uses the same WhatsApp number as emergency broadcasts. Enhanced with: conversation search/filter, start new conversation dialog, notification sound toggle (localStorage), media message previews (image/document/audio/video), and read receipts preference toggle.

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Vite**: Frontend build tool.
- **Express.js**: HTTP server framework.

## Database & ORM
- **Drizzle ORM**: Type-safe queries and schema management.
- **@neondatabase/serverless**: Neon PostgreSQL driver.

## UI Component Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Component system.
- **Tailwind CSS**: Utility-first CSS framework.

## Form Management & Validation
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.

## Data Fetching & State Management
- **TanStack React Query**: Server state management.
- **Wouter**: Client-side routing.

## Messaging Services
- **WhatsApp Business API**: Primary notification channel with real-time status tracking.
  - Status tracking via webhooks: sent → delivered → read
  - Admin dashboard at `/admin/messages` for monitoring message delivery
  - Retry functionality for failed messages
  - Webhook endpoint: `/api/webhooks/whatsapp` (both GET for verification and POST for events)
  - Required Environment Variables:
    - `WHATSAPP_ACCESS_TOKEN`: Meta Business API access token
    - `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Business phone number ID
    - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Webhook verification token (required, no default)
    - `WHATSAPP_APP_SECRET`: App Secret from Meta Business settings for webhook signature verification
  - WhatsApp Coexistence: Allows simultaneous API automation and manual WhatsApp Business App usage
- **SendGrid**: Email fallback.

## Geospatial
- **PostGIS**: PostgreSQL extension for geospatial queries.
- **Browser Geolocation API**.

## Session Management
- **connect-pg-simple**: PostgreSQL session store.
- **express-session**: Session middleware.

## Development & Utilities
- **TypeScript**: Language.
- **nanoid**: Unique ID generation.
- **sharp**: Image processing.
- **web-vitals**: Core Web Vitals monitoring.

## Error Tracking & Monitoring
- **@sentry/node**: Backend error tracking and performance monitoring.
- **@sentry/react**: Frontend error tracking with React integration and session replay.

## Push Notifications
- **Firebase Cloud Messaging (FCM)**: Web push notification service for PWA notifications.
  - Backend: `firebase-admin` SDK with service account credentials
  - Frontend: Firebase Web SDK (`firebase/messaging`)
  - Service Worker: Firebase-based service worker for background notification delivery
  - Required Environment Variables:
    - `FIREBASE_SERVICE_ACCOUNT_JSON` (backend, secret): Full Firebase service account JSON
    - `VITE_FIREBASE_API_KEY` (frontend): Firebase web API key
    - `VITE_FIREBASE_AUTH_DOMAIN` (frontend): Firebase auth domain
    - `VITE_FIREBASE_PROJECT_ID` (frontend): Firebase project ID
    - `VITE_FIREBASE_STORAGE_BUCKET` (frontend): Firebase storage bucket
    - `VITE_FIREBASE_MESSAGING_SENDER_ID` (frontend): Firebase messaging sender ID
    - `VITE_FIREBASE_APP_ID` (frontend): Firebase app ID
    - `VITE_FIREBASE_VAPID_KEY` (frontend): Firebase VAPID key for web push