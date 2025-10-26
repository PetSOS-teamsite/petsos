## Overview

PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics. It enables one-tap broadcasting of emergency cases to nearby clinics and offers direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy compliance, aiming to streamline emergency pet care coordination and improve pet welfare during crises.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript (Vite), Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI + Tailwind CSS) for UI components, React Hook Form with Zod for forms.
- **Design Decisions**: Accessible, customizable components; minimal bundle size; Tailwind CSS for theming (dark mode, custom design tokens); type-safe form validation.
- **Key Features**: Multi-step emergency request flow, clinic results filtering and communication, profile and pet management (CRUD with bilingual breed selection), clinic directory, admin dashboard, clinic staff dashboard.
- **Branding & SEO**: Text-based "PetSOS" logo, vibrant red (#EF4444) primary color, custom SVG favicon (emergency cross + paw print), reusable `<SEO>` component for page-specific meta tags, bilingual optimization (EN/ZH-HK) for key pages, comprehensive Open Graph and Twitter Cards, geo-targeting for Hong Kong.
- **Progressive Web App (PWA)**: Full PWA support with web app manifest, multiple icon sizes (192x192, 512x512, 180x180 Apple Touch Icon), installable to home screen on iOS/Android, standalone display mode, emergency and clinic shortcuts, generated from SVG using Sharp.
- **UX Enhancements**: Prominent pet management CTA, auto-scroll to status button post-broadcast, extended toast duration, blue-styled "View Broadcast Status" button, post-broadcast guidance to status page, compressed VoiceRecorder UI with collapsible tips (info icon), emergency request edit functionality with real-time broadcast message updates, severity-ordered emergency symptoms (critical → serious → moderate), compact clinic action buttons (Call/WhatsApp/Maps) in single horizontal row, and brand-aligned clinic directory with proper bilingual region names, Maps navigation button, and red-themed compact cards (~25% more compact) showing more clinics per screen.

### Backend Architecture
- **Technology Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Design Decisions**: Interface-based storage layer, PostgreSQL for data integrity (JSONB, PostGIS), Drizzle ORM for type-safe queries, RESTful API with consistent error handling.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests, audit logs), Queue System (retry logic, DLQ), Rate Limiting.
- **Security**: Production-grade rate limiting, `trust proxy` for accurate IP tracking, GDPR/PDPO compliance features.
- **Emergency Broadcasts**: Enhanced content includes full pet profile information. The Support Hospital program prioritizes partner clinics and enables one-click broadcasting. Existing Patient Recognition highlights and prioritizes clinics where a pet has previously visited.
- **Route Ordering Constraint**: In Express routing, specific routes (e.g., `/api/users/export`, `/api/users/gdpr-delete`) must be defined BEFORE parameterized routes (e.g., `/api/users/:id`) to prevent incorrect route matching. This is critical for GDPR endpoints.

### Data Architecture
- **Database Schema**: Users, Pets, Countries, Regions, Pet Breeds, Clinics, Emergency Requests, Messages, Feature Flags, Audit Logs, Privacy Consents, Translations.
- **Design Principles**: UUID primary keys, soft deletes, JSONB for flexible metadata, timestamp tracking, foreign key constraints.
- **Schema Evolution**: User model simplified to a single `name` field. Multi-region refactoring replaced hardcoded values with a configurable, database-driven system for countries, regions, and pet breeds.

### Authentication & Authorization
- **Implementation**: Multi-option professional authentication via Passport.js, role-based access control (user, admin, clinic staff), session-based authentication with PostgreSQL session store.
- **Authentication Methods**: Google OAuth, Email/Password, Phone/Password (with country code selection).
- **Security**: User responses sanitized, GDPR-compliant data exports.
- **Phone Authentication**: Phone numbers stored with country code prefix, country code selector for multiple regions, unified login strategy.
- **Roles**: Admin, Clinic Staff, Regular User.

### Emergency Request Management
- **Creation**: Multi-step emergency request form (symptoms & pet → location → contact info with optional voice recording) supports both authenticated and anonymous users for emergency flexibility.
- **Symptom Selection**: Symptoms ordered by severity level to help users identify critical emergencies quickly:
  - **Critical** (7 symptoms): Unconscious/unresponsive, not breathing, seizure, choking, severe bleeding, major trauma, poisoning - require immediate action
  - **Serious** (5 symptoms): Collapse, bloated abdomen, severe pain, repeated vomiting, severe diarrhea - urgent attention needed
  - **Moderate** (4 symptoms): Fracture, eye injury, not eating 24+ hours, other symptoms - concerning but less immediately life-threatening
- **Voice Recording**: Compact UI design with reduced padding and spacing (15-20% less vertical space), collapsible tips (info icon trigger), smaller text and icons while maintaining readability, AI-powered symptom analysis from voice transcripts using OpenAI, bilingual support (EN/ZH-HK), automatic fallback to manual text entry.
- **Editing**: Post-submission edit functionality allows users to update contact information, symptoms, and location via edit button on clinic results page.
  - **Authorization**: Authenticated users can edit their own requests or anonymous requests; anonymous users can only edit anonymous requests
  - **Real-time Updates**: Edited data automatically reflects in broadcast message previews since `buildStructuredBroadcastMessage()` reads from the updated emergency request object
  - **Validation**: Uses `insertEmergencyRequestSchema.partial()` with Zod validation
  - **Audit Trail**: All edits are logged with user ID, IP address, and user agent for security and compliance

### Messaging & Communication
- **Architecture**: WhatsApp Business API as primary, email fallback, queue-based processing, template-based messaging.
- **WhatsApp Templates**: Meta-approved message templates for emergency broadcasts in English and Traditional Chinese (6 templates total):
  - **Full Template** (`emergency_pet_alert_full_*`): For registered pets with medical history (11 variables: last visited clinic, pet profile, symptoms, medical notes, owner contact)
  - **New Template** (`emergency_pet_alert_new_*`): For registered pets without visit history (10 variables: pet profile, symptoms, medical notes, owner contact)
  - **Basic Template** (`emergency_pet_alert_basic_*`): For anonymous users (7 variables: species, breed, age, symptoms, location, owner contact)
- **Template Selection**: Automatic detection based on pet registration status and language preference (user's `languagePreference` field)
- **Implementation**: `buildTemplateMessage()` method dynamically builds template variables from emergency request and pet data, sends via WhatsApp template API with automatic email fallback

### Geolocation & Region Support
- **Implementation**: PostGIS for server-side geospatial queries (ST_DWithin, ST_Distance), geography column with GIST spatial index, automatic location sync trigger, centroid-based region definitions, auto-user location detection, manual override.
- **Performance**: Server-side geo-queries with spatial indexing for efficiency.

### Internationalization (i18n)
- **Multi-language**: Database-stored translations (EN, zh-HK), client-side language detection.
- **Coverage**: Comprehensive bilingual support including legal content, pet breeds, and critical user flows.
- **Hong Kong Localization**: Pet breeds use colloquial HK terminology, emergency flow messaging uses "毛孩" (furry kids), professional tone adjustments for Hong Kong Chinese, language-aware template strings for broadcast messages.

### Analytics & Tracking
- **Implementation**: Google Analytics 4 (GA4) with GDPR-compliant cookie consent.
- **Features**: Automatic page view tracking, emergency request/broadcast tracking, clinic contact/search tracking, pet creation tracking.
- **Privacy**: Explicit user consent, no PII or health data collected.

### Error Tracking & Monitoring
- **Implementation**: Sentry for both backend (Node.js) and frontend (React).
- **Features**: Automatic error capture, performance monitoring, session replay, sensitive data filtering, user-friendly error UI with recovery options.
- **Privacy**: GDPR compliant, no PII collection, automatic sensitive data removal.

### Multi-Region Configuration
- **Architecture**: Database-driven configuration for countries, regions, and pet breeds.
- **Management**: Admin UI for CRUD operations on countries, regions, and pet breeds.
- **Dynamic Loading**: PhoneInput and BreedCombobox components dynamically load data from the database.
- **Environment Variables**: DEFAULT_COUNTRY, DEFAULT_COUNTRY_CODE, DEFAULT_LANGUAGE for regional defaults.

### Multi-Environment Configuration
- **Environment Management**: Centralized configuration for development, staging, and production environments.
- **Config Files**: `.env.example`, `.env.staging.example`, `.env.production.example`.

### Deployment Architecture
- **Infrastructure**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment, Infrastructure as Code.
- **Deployment Readiness**: Production-ready Dockerfile, Docker Compose for local testing, platform-specific deployment guides.

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
- **tsx**: TypeScript execution.
- **esbuild**: Bundler.
- **date-fns**: Date manipulation.
- **nanoid**: Unique ID generation.
- **express-rate-limit**: Rate limiting middleware.
- **sharp**: Image processing for icon generation (SVG to PNG conversion).

### Error Tracking & Monitoring
- **@sentry/node**: Backend error tracking and performance monitoring.
- **@sentry/react**: Frontend error tracking with React integration and session replay.