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
- **Emergency Broadcasts**: Enhanced content includes full pet profile information (name, species, breed, age, weight, medical notes). Support Hospital program allows prioritizing partner clinics and quick one-click broadcasting.

### Data Architecture
- **Database Schema**: Users (with `clinicId` for staff linking), Pets, Regions, Clinics (`isSupportHospital` field), Emergency Requests, Messages, Feature Flags, Audit Logs, Privacy Consents, Translations.
- **Design Principles**: UUID primary keys, soft deletes, JSONB for flexible metadata, timestamp tracking, foreign key constraints.

### Authentication & Authorization
- **Implementation**: Replit OIDC, role-based access control (user, admin), clinic staff access control via `clinicId` linking, session-based authentication.
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

### Deployment Architecture
- **Infrastructure**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment, Infrastructure as Code.

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