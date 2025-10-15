## Overview

PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics. It facilitates one-tap broadcasting of emergency cases to nearby clinics and offers direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy/compliance tracking, aiming to streamline emergency pet care coordination and improve pet welfare during crises.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript (Vite), Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI + Tailwind CSS) for UI components, React Hook Form with Zod for forms.
- **Design Decisions**: Accessible, customizable components; minimal bundle size; Tailwind CSS for theming (dark mode, custom design tokens); type-safe form validation.
- **Key Features**: Multi-step emergency request flow, clinic results filtering and communication, profile and pet management (CRUD with bilingual breed selection), clinic directory, admin dashboard (clinic CRUD, staff management, auto-fill GPS), clinic staff dashboard (availability toggle, emergency request management).
- **Branding**: Text-based "PetSOS" logo; vibrant red (#EF4444) as primary color for emergency focus and consistent UI theming.

### Backend Architecture
- **Technology Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Design Decisions**: Interface-based storage layer for flexibility; PostgreSQL for data integrity, JSONB, and PostGIS; Drizzle ORM for type-safe queries; RESTful API with consistent error handling.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests, audit logs), Queue System (retry logic, DLQ), Rate Limiting.
- **Security**: Production-grade rate limiting (general API, auth, export, deletion, broadcast, strict operations), `trust proxy` for accurate IP tracking, GDPR/PDPO compliance features (data export/deletion).
- **Emergency Broadcasts**: Enhanced content includes full pet profile information (name, species, breed, age, weight, medical notes). Support Hospital program allows prioritizing partner clinics and quick one-click broadcasting. **Existing Patient Recognition**: Clinics where the pet has previously visited are automatically highlighted and prioritized, with broadcast messages noting which clinic has medical records for faster history access.

### Data Architecture
- **Database Schema**: Users (single `name` field, with `clinicId` for staff linking), Pets, Countries (country codes, names, phone prefixes, flags), Regions (with country references), Pet Breeds (species-specific, country/global), Clinics (`isSupportHospital` field), Emergency Requests, Messages, Feature Flags, Audit Logs, Privacy Consents, Translations.
- **Design Principles**: UUID primary keys, soft deletes, JSONB for flexible metadata, timestamp tracking, foreign key constraints.
- **Schema Evolution**: 
  - User model simplified from separate `firstName`/`lastName` fields to single `name` field for better UX and data consistency (October 2025)
  - Multi-region refactoring: Replaced hardcoded Hong Kong-specific values with configurable database-driven system for countries, regions, and pet breeds (October 2025)

### Authentication & Authorization
- **Implementation**: Multi-option professional authentication system via Passport.js, role-based access control (user, admin), clinic staff access control via `clinicId` linking, session-based authentication with PostgreSQL session store.
- **Authentication Methods**: 
  - Google OAuth (passport-google-oauth20): One-click sign-in with Google accounts
  - Email/Password (passport-local): Traditional authentication with bcrypt password hashing
  - Phone/Password (passport-local): Phone number authentication with country code selection (default: +852 Hong Kong)
- **Security**: All user responses sanitized to exclude password hashes, GDPR-compliant data exports
- **Phone Authentication**: 
  - Phone numbers stored with country code prefix (e.g., "+85212345678")
  - Country code selector with support for Hong Kong, China, USA/Canada, UK, Japan, South Korea, Singapore, Taiwan
  - Unified login strategy that accepts either email or phone+countryCode as identifier
  - Frontend UI with tabs to switch between Email and Phone authentication methods
- **Roles**: Admin (full platform access), Clinic Staff (clinic-specific management), Regular User (pet owner features).

### Messaging & Communication
- **Architecture**: WhatsApp Business API as primary, email fallback, queue-based processing, template-based messaging.

### Geolocation & Region Support
- **Implementation**: PostGIS for server-side geospatial queries with ST_DWithin and ST_Distance, geography column with GIST spatial index, automatic trigger to sync location from lat/lng, centroid-based region definitions, auto-user location detection, manual override.
- **Setup**: Run `tsx scripts/setup-postgis.ts` to enable PostGIS extension, create geography column, spatial index, and auto-update trigger (idempotent script).
- **Performance**: Server-side geo-queries significantly faster than client-side Haversine calculations, with efficient spatial indexing for large datasets.

### Internationalization (i18n)
- **Multi-language**: Database-stored translations (EN, zh-HK), client-side language detection.
- **Coverage**: Comprehensive bilingual support including legal content, pet breeds, and all critical user flows.

### Analytics & Tracking
- **Implementation**: Google Analytics 4 (GA4) with GDPR-compliant cookie consent
- **Features**: 
  - Automatic page view tracking
  - Emergency request and broadcast tracking
  - Clinic contact and search tracking
  - Pet creation tracking
- **Privacy**: Explicit user consent required, no PII or health data collected
- **Status**: Fully implemented - all event tracking wired to UI
- **Documentation**: See `docs/ANALYTICS.md` for implementation status and usage guide

### Error Tracking & Monitoring
- **Implementation**: Sentry for both backend (Node.js) and frontend (React)
- **Features**: 
  - Automatic error capture with Express middleware and React ErrorBoundary
  - Performance monitoring with configurable trace sampling
  - Session replay for frontend debugging
  - Sensitive data filtering (auth headers, cookies, passwords)
  - User-friendly error UI with recovery options
- **Privacy**: GDPR compliant, no PII collection, automatic sensitive data removal
- **Configuration**: Optional via `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) environment variables
- **Documentation**: See `docs/SENTRY.md` for setup and usage guide

### Multi-Region Configuration (October 2025)
- **Architecture**: Database-driven configuration system replacing hardcoded Hong Kong-specific values
- **Countries Management**: 
  - Database table with country codes, names (EN/ZH), phone prefixes, flags, and active status
  - API routes for CRUD operations (admin-only mutations, public reads)
  - Seeded with 15 countries (HK, CN, US, JP, UK, SG, KR, TW, AU, CA, NZ, MY, TH, VN, PH)
  - PhoneInput component dynamically loads country codes from database
- **Regions Management**:
  - Foreign key reference to countries table
  - Bilingual names (EN/ZH), active status, country association
  - Admin UI for region CRUD operations
- **Pet Breeds Management**:
  - Species-specific (dog, cat, bird, rabbit, hamster, other)
  - Bilingual names (EN/ZH), country/global scope, common/uncommon flag
  - Seeded with 50+ breeds across multiple species
  - BreedCombobox component dynamically loads breeds from database
- **Admin Configuration UI**: 
  - Tabbed interface for countries, regions, and pet breeds management
  - React Hook Form with Zod validation for type-safe mutations
  - Proper boolean and nullable field handling
  - Loading guards for dependent data queries
  - Access via Admin Dashboard → Configuration
- **Environment Variables**: DEFAULT_COUNTRY, DEFAULT_COUNTRY_CODE, DEFAULT_LANGUAGE for regional defaults

### Multi-Environment Configuration
- **Environment Management**: Centralized configuration system supporting development, staging, and production environments
- **Backend Config**: Type-safe configuration loader (`server/config.ts`) with environment-specific validation
- **Frontend Config**: Separate frontend configuration (`client/src/lib/config.ts`) for client-side settings
- **Environment-Specific Behavior**:
  - **Development**: Optional DATABASE_URL/REPLIT_DOMAINS, in-memory sessions, disabled rate limiting, verbose logging
  - **Staging**: Required DATABASE_URL/REPLIT_DOMAINS, secure sessions, enabled rate limiting, info logging
  - **Production**: Required DATABASE_URL/REPLIT_DOMAINS, strict rate limiting (100 req/15min), secure sessions (7-day max-age), minimal logging
- **Configuration Files**: `.env.example` (development), `.env.staging.example`, `.env.production.example` with documented requirements

### Deployment Architecture
- **Infrastructure**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment, Infrastructure as Code
- **Environment Detection**: Automatic via NODE_ENV environment variable
- **Deployment Readiness**: Application is prepared for independent deployment (not relying on Replit)
  - Comprehensive deployment guide available in `docs/DEPLOYMENT.md`
  - Production-ready Dockerfile with multi-stage builds
  - Docker Compose configuration for local testing
  - Environment templates for staging/production (`.env.production.example`)
  - Platform-specific guides for Render, Railway, AWS, GCP, Azure, DigitalOcean
  - Database (Neon PostgreSQL), external services, and session storage are already platform-independent
  - Authentication supports Google OAuth and Email/Password (Replit auth optional fallback)

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Vite**: Frontend build tool.
- **Express.js**: HTTP server framework.

### Database & ORM
- **Drizzle ORM**: Type-safe queries and schema management (`drizzle-kit`, `drizzle-zod`).
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

### Messaging Services (Planned)
- **WhatsApp Business API**: Primary notification channel.
- **SendGrid**: Email fallback.
- **Twilio/similar**: Optional SMS.

### Geospatial
- **PostGIS**: PostgreSQL extension for geospatial queries.
- **Browser Geolocation API**.

### Session Management
- **connect-pg-simple**: PostgreSQL session store.
- **express-session**: Session middleware.

### Development & Utilities
- **TypeScript**: Language.
- **tsx**: TypeScript execution.
- **esbuild**: Bundler.
- **date-fns**: Date manipulation.
- **nanoid**: Unique ID generation.
- **express-rate-limit**: Rate limiting middleware.

### Error Tracking & Monitoring
- **@sentry/node**: Backend error tracking and performance monitoring.
- **@sentry/react**: Frontend error tracking with React integration and session replay.