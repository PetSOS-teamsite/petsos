# Overview

PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics. It enables one-tap broadcasting of emergency cases, offers direct communication (Call/WhatsApp), and supports user/pet profiles. The platform is built for global scalability and compliance, aiming to streamline emergency pet care and improve pet welfare.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Frontend Stack**: React (Vite, TypeScript), Wouter, TanStack React Query, shadcn/ui (Radix UI + Tailwind CSS), React Hook Form with Zod.
- **Design Principles**: Accessible, customizable components, minimal bundle size, PWA support, and native mobile wrappers (Capacitor).
- **Branding**: Text-based "PetSOS" logo, vibrant red primary color, custom SVG favicon.
- **Localization**: Bilingual optimization (EN/ZH-HK), comprehensive SEO, geo-targeting, and database-stored translations.
- **Emergency UI**: Multi-step form, compact VoiceRecorder, real-time editable broadcast messages.
- **Clinic Display**: Compact action buttons, brand-aligned directory, prioritized partner clinics with badges.

## Technical Implementations
- **Backend Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless).
- **Data Storage**: PostgreSQL with JSONB and PostGIS for geospatial queries.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests), Queue System, Rate Limiting.
- **Security**: Production-grade rate limiting, GDPR/PDPO compliance, Passport.js for multi-option authentication (Google OAuth, Email/Password, Phone/Password), role-based access control.
- **Emergency Broadcasts**: Enhanced content with full pet profile info and hospital program prioritization.
- **Geolocation**: PostGIS for server-side queries, auto-user location detection with manual override.
- **Messaging Architecture**: WhatsApp Business API as primary, email fallback, queue-based processing, template-based messaging.
- **Analytics & Monitoring**: Google Analytics 4 (GA4), Sentry for error tracking.
- **SEO Optimization**: Comprehensive bilingual SEO, Core Web Vitals monitoring, structured data, hreflang tags.
- **Push Notifications**: Firebase Cloud Messaging (FCM) for web push notifications, with admin composer.
- **Multi-Environment Configuration**: Centralized configuration using `.env` files.
- **Deployment**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment.

## Feature Specifications
- **User & Pet Management**: CRUD for profiles and pets, bilingual breed selection.
- **Pet Medical Records**: Secure document storage (Replit Object Storage) with ACL, consent-based sharing in emergencies, storage quotas.
- **Hospital Management**: Admin interface for 24-hour animal hospitals, including profile updates by verified owners via access codes.
- **Emergency Request Flow**: Multi-step form for authenticated/anonymous users, including AI-powered voice recording analysis (OpenAI), and post-submission editing.
- **Internationalization**: Database-stored translations (EN, zh-HK), client-side language detection.
- **Multi-Region Configuration**: Database-driven configuration for countries, regions, and pet breeds.
- **Admin Push Notifications**: Admin panel for composing, scheduling, and broadcasting push notifications with targeting and history.
- **Offline Emergency Support**: Service worker queues requests, processes on reconnection.
- **Admin Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code setup and encrypted secrets.
- **Clinic Reviews/Ratings**: Pet owner reviews with moderation.
- **Admin Analytics Dashboard**: Visual analytics for trends and distribution.
- **Two-Way WhatsApp Chat**: Admin interface for two-way messaging with hospitals, including search, filters, media previews, and read receipts.
- **Generative Engine Optimization (GEO)**: Trust & authority pages (About Us, Medical Advisory, Verification Process), enhanced JSON-LD schema markup for hospital listings with VeterinaryCare+LocalBusiness dual-type, price transparency, verification timestamps, and medical specialties. **Advanced GEO Features**: AI-Ready Snippet blocks (bilingual hidden summaries for AI extraction), FAQ Schema markup with question-format accordions, VSB entity linking for trust signals, semantic HTML tables for consultation fees, symptom-equipment use case tags (CT→trauma/spinal, MRI→brain/joints), and micro-optimizations (itemProp, title/abbr attributes).
- **Emergency Symptom Knowledge Blocks**: 10 detailed guides covering critical pet conditions (cat panting, dog bloat, poisoning, seizures, limping, not eating, eye injury, heatstroke, urinary blockage, breathing difficulty) with severity classifications and action steps for panic search traffic.
- **Typhoon & Holiday Protocol**: Real-time tracking of 24-hour vet clinic availability during T8/T10 typhoon signals and public holidays (CNY, Christmas, Easter), with database tables for typhoon alerts, HK holidays (2024-2025 pre-seeded), hospital emergency status, and subscription management. API endpoints for status queries, hospital status updates, and emergency subscriptions.
- **Midnight Emergency Fee Blog** (`/blog/midnight-fees`): Dynamic GEO-optimized blog page comparing 24-hour vet consultation fees across Hong Kong. Features: real-time statistics dashboard (min/max/median fees, verified count, cheapest district), hospital comparison cards with on-site vet badges and T8/T10 availability indicators, region filtering, bilingual content (EN/zh-HK), Schema.org structured data (Article with ItemList of VeterinaryCare entries), AI-ready snippets, deposit information, and last-verified timestamps. API endpoint: `/api/blog/midnight-fees` returns aggregated stats and enriched hospital data.

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Vite**: Frontend build tool.
- **Express.js**: HTTP server framework.

## Database & ORM
- **Drizzle ORM**: Type-safe queries.
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
- **WhatsApp Business API**: Primary notification channel with real-time status tracking, webhooks, and retry functionality.
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

## Error Tracking & Monitoring
- **@sentry/node**: Backend error tracking.
- **@sentry/react**: Frontend error tracking and session replay.

## Push Notifications
- **Firebase Cloud Messaging (FCM)**: Web push notification service (backend: `firebase-admin` SDK, frontend: Firebase Web SDK).

## Cloud Storage (Object Storage)
- **Replit Object Storage**: Primary provider (via sidecar service).
- **Google Cloud Storage (GCS)**: Secondary provider for standalone deployments.
- **API Endpoint**: `/api/storage/status` for availability check.