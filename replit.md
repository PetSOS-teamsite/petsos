## Overview
PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics. It enables one-tap broadcasting of emergency cases to nearby clinics and offers direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy compliance, aiming to streamline emergency pet care coordination and improve pet welfare during crises.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Stack**: React with TypeScript (Vite), Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI + Tailwind CSS) for UI components, React Hook Form with Zod for forms.
- **Design Principles**: Accessible, customizable components; minimal bundle size; Tailwind CSS for theming (dark mode, custom design tokens); type-safe form validation.
- **Branding**: Text-based "PetSOS" logo, vibrant red (#EF4444) primary color, custom SVG favicon.
- **PWA Support**: Full Progressive Web App (PWA) support with web app manifest, installable to home screen, standalone display mode, emergency and clinic shortcuts.
- **Localization**: Bilingual optimization (EN/ZH-HK) for key pages, comprehensive Open Graph and Twitter Cards, geo-targeting for Hong Kong, database-stored translations, colloquial HK terminology for pet breeds.
- **Emergency UI**: Multi-step emergency request form with severity-ordered symptoms, compact VoiceRecorder UI, and real-time editable broadcast messages.
- **Clinic Display**: Compact clinic action buttons, brand-aligned directory with bilingual region names, red-themed compact cards, clickable cards with Maps integration, mobile-optimized horizontally scrollable region tabs.
- **Partner Prioritization**: Partner clinics are prioritized and identified with purple/blue gradient badges. Sorting hierarchy: existing patient clinics → partner clinics → distance-sorted remaining clinics.

### Hospital Management Features (NEW - Nov 2025)
- **Hospital Verification Code System**: Admins can generate 6-digit access codes for hospital owners to self-manage their profiles
- **Hospital Owner Edit Page**: Self-service profile editing at `/hospital/edit/:id` with 6-digit code verification
- **Auto-Save Changes**: Hospital owner changes (name, address, phone, WhatsApp, email, region, 24-hour status) auto-save to database via `/api/hospitals/:id/update-owner` endpoint
- **Hospital Form Tabs**: All tabs now active - Basic Info, Photos, Facilities, Medical Services, Operational
- **Oxygen Tank Facility**: Added as new facility option in hospital profiles
- **Database Tables**: quarterly_offers table created for quarterly promotional broadcasting with admin approval workflow

### Technical Implementations
- **Backend Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Data Storage**: PostgreSQL with JSONB for flexible metadata, PostGIS for geospatial queries, Drizzle ORM for type-safe queries.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, hospitals, requests, offers), Queue System, Rate Limiting.
- **Security**: Production-grade rate limiting, GDPR/PDPO compliance, Passport.js for multi-option authentication, role-based access control (user, admin, clinic staff, hospital staff), session-based authentication with PostgreSQL session store.
- **Authentication Methods**: Google OAuth, Email/Password, Phone/Password.
- **Emergency Broadcasts**: Enhanced content includes full pet profile information, support hospital program prioritization, existing patient recognition.
- **Geolocation**: PostGIS for server-side geospatial queries, geography column with GIST spatial index, auto-user location detection, manual override.
- **Messaging Architecture**: WhatsApp Business API as primary, email fallback, queue-based processing, template-based messaging.
- **Analytics & Monitoring**: Google Analytics 4 (GA4) with GDPR-compliant cookie consent, Sentry for backend and frontend error tracking and performance monitoring.
- **SEO Optimization**: Comprehensive bilingual SEO with performance-first approach, Core Web Vitals monitoring, code splitting, deferred initialization, image optimization, structured data (8 schema types), local SEO for Hong Kong districts, technical SEO (canonical URLs, sitemap.xml, robots.txt, dynamic meta tags), and social integration.
- **Multi-Environment Configuration**: Centralized configuration for development, staging, and production environments using `.env` files.
- **Deployment**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment, Infrastructure as Code.

### Feature Specifications
- **User & Pet Management**: CRUD operations for profiles and pets, bilingual breed selection.
- **Hospital Management**: Comprehensive admin interface for managing 24-hour animal hospitals with enhanced profiles, including tabbed forms (Basic Info, Photos, Facilities, Medical Services, Operational), photo management, detailed facility and medical service fields, and custom array field handling.
- **Hospital Owner Self-Service**: Verified hospital owners can update their own profiles using 6-digit access codes generated by admins, with auto-save to database.
- **Emergency Request Flow**: Multi-step form (symptoms & pet → location → contact info with optional voice recording), supports authenticated and anonymous users with pre-filled contact information for authenticated users.
- **Voice Recording**: AI-powered symptom analysis from voice transcripts (OpenAI), bilingual support (EN/ZH-HK), automatic fallback to manual text entry.
- **Emergency Request Editing**: Post-submission editing of contact info, symptoms, location with real-time broadcast message updates, Zod validation, audit trail, GPS location support, and bilingual UI.
- **Internationalization**: Database-stored translations (EN, zh-HK), client-side language detection, comprehensive bilingual support.
- **Multi-Region Configuration**: Database-driven configuration for countries, regions, and pet breeds, dynamic loading in UI components.
- **Quarterly Offers Broadcasting**: Partner-exclusive promotional offers system with admin approval workflow and push notification delivery (scheduled for implementation).

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Vite**: Frontend build tool.
- **Express.js**: HTTP server framework.

### Database & ORM
- **Drizzle ORM**: Type-safe queries and schema management.
- **@neondatabase/serverless**: Neon PostgreSQL driver.

### UI Component Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Component system.
- **Tailwind CSS**: Utility-first CSS framework.

### Form Management & Validation
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.

### Data Fetching & State Management
- **TanStack React Query**: Server state management.
- **Wouter**: Client-side routing.

### Messaging Services
- **WhatsApp Business API**: Primary notification channel.
- **SendGrid**: Email fallback.

### Geospatial
- **PostGIS**: PostgreSQL extension for geospatial queries.
- **Browser Geolocation API**.

### Session Management
- **connect-pg-simple**: PostgreSQL session store.
- **express-session**: Session middleware.

### Development & Utilities
- **TypeScript**: Language.
- **nanoid**: Unique ID generation.
- **sharp**: Image processing.
- **web-vitals**: Core Web Vitals monitoring.

### Error Tracking & Monitoring
- **@sentry/node**: Backend error tracking and performance monitoring.
- **@sentry/react**: Frontend error tracking with React integration and session replay.

## Recent Changes (Nov 27, 2025)

### Hospital Management & Owner Self-Service
1. **Hospital Verification Code System**
   - Admins can generate 6-digit access codes via checkmark button on hospital cards
   - Dialog shows code and shareable edit link for hospital owners
   - Code stored in database for verification

2. **Hospital Owner Edit Page** (`/hospital/edit/:id`)
   - Verification form requires 6-digit code
   - After verification, shows edit form for hospital information
   - Fields: Name (EN/ZH), Address (EN/ZH), Phone, WhatsApp, Email, Region, 24-Hour Operation toggle

3. **Auto-Save Backend Endpoint** (`/api/hospitals/:id/update-owner`)
   - Requires verification code in request body
   - Validates code matches hospital's stored code
   - Updates hospital information
   - Creates audit log entry
   - Returns updated hospital data

4. **Database Schema Updates**
   - Added `oxygenTank` boolean field to hospitals table
   - Created `quarterlyOffers` table for promotional offers
   - Added insert schemas for countries, regions, pet breeds, privacy consents, translations
   - Fixed import errors (sql from drizzle-orm instead of drizzle-orm/pg-core)

5. **Hospital Form Tabs Enabled**
   - Removed disabled styling from Photos, Facilities, Medical Services, Operational tabs
   - All tabs now fully functional

6. **Oxygen Tank Facility Added**
   - New toggle option in hospital facilities form
   - Properly integrated into form state and database schema

## Current Issues
- Database migration status: pending final sync (quarterly_offers table creation confirmation)
- App deployment: waiting for database schema to fully sync before app can run
- LSP diagnostics: 5 errors in server/routes.ts (type-related, non-blocking)

## Next Steps
1. Complete database migration with `npm run db:push` to sync quarterly_offers table
2. Restart application after migration completes
3. Test hospital owner verification and auto-save flow end-to-end
4. Implement quarterly offers broadcasting system:
   - Backend endpoints to create/list/approve offers
   - Push notification delivery to pet owner apps
   - Admin dashboard for offer management
