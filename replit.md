# PetSOS - Emergency Veterinary Service Platform

## Overview

PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics during emergencies. It enables one-tap broadcasting of emergency cases to nearby clinics and provides direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy/compliance tracking, aiming to streamline emergency pet care coordination.

## User Preferences

Preferred communication style: Simple, everyday language.

## Branding

- **Logo**: Text-based "PetSOS" in white on vibrant red background (#EF4444)
- **Primary Color**: Vibrant red (#EF4444 / #DC2626 for dark mode)
- **Landing Page**: Full red background with white text for emergency-focused design
- **Header**: Red background across all authenticated pages with white "PetSOS" text logo

## Recent Changes (October 2025)

### Enhanced Emergency Broadcasts with Full Pet Profiles (October 7, 2025)
- **Enhanced Message Content**:
  - Emergency broadcasts now include complete pet profile information when a saved pet is selected
  - Format: Pet name, species, breed, age, weight (kg), and medical history/notes
  - Example: "Buddy (Dog, Golden Retriever, 5 years, 30.5kg)" with "⚠️ Medical History: Allergic to chicken"
  - Backwards compatible: Falls back to manual entry format (species, breed, age only) when no pet profile exists
  
- **Backend Enhancements**:
  - `getEmergencyRequest()` now joins with pets table and returns full pet data
  - Updated both DatabaseStorage and MemStorage implementations
  - Returns: `{ ...emergencyRequest, pet: { name, species, breed, age, weight, medicalNotes, ... } }`
  
- **Frontend Improvements**:
  - New `buildPetInfoString()` helper function for consistent message formatting
  - All 3 broadcast paths updated: main broadcast, support hospital quick broadcast, dialog preview
  - Enhanced medical triage: Weight crucial for medication dosing, medical notes for allergies/conditions
  
- **Translation Support**:
  - Added 4 new bilingual translation keys (EN/zh-HK): pet_name, weight_kg, medical_history, no_medical_notes
  - Total translation keys: 269

### Support Hospital Program & Quick Broadcast
- **Support Hospital Feature**:
  - New `isSupportHospital` boolean field in clinics schema for flagging partner hospitals
  - Admin can toggle Support Hospital status in add/edit clinic forms (blue highlighted field)
  - Visual "⭐ Support Hospital" badge displayed on clinic cards throughout UI
  - Support hospitals are prioritized for emergency broadcasts
  
- **Quick Broadcast Button** (`/emergency-results/:requestId`):
  - Prominent red "INSTANT EMERGENCY BROADCAST" button at top of clinic results page
  - One-click broadcasting to all available 24-hour support hospitals
  - Shows dynamic count: "Send alert to X available 24-hour support hospitals NOW"
  - Only displays when support hospitals exist with contact methods (WhatsApp/email)
  - Filtering criteria: active status, support hospital flag, 24-hour service, available, has contact method
  - Success confirmation with toast message
  - Designed to reduce cognitive load for panic pet parents during emergencies

### Clinic and Admin Dashboards
- **Admin Dashboard** (`/admin/clinics`):
  - Comprehensive statistics: total clinics, available clinics, 24-hour clinics, total emergency requests
  - Full CRUD operations for clinic management
  - Search and filter functionality (by name, address, region, 24-hour, availability, support hospital)
  - Pagination (20 clinics per page)
  - Clickable statistics cards as quick filters
  - Visual warning badges for missing GPS/contact data
  - Real-time availability toggle
  - Support Hospital toggle in add/edit forms
  - **Auto-fill GPS Feature**: One-click geocoding button to automatically populate latitude/longitude from clinic address using Google Geocoding API
    - Integrated into both Add and Edit clinic forms
    - Shows loading state during API call
    - Validates response before populating coordinates
    - Clear error messages for failed geocoding attempts
  - **Clinic Staff Management**:
    - Link/unlink users to clinics via email
    - Dashboard URL generator with copy-to-clipboard
    - Step-by-step login instructions for clinic staff
    - Current staff members list with unlink capability
  - Protected route (admin role required)
  
- **Admin Login Page** (`/admin/login`):
  - Dedicated login page for administrators
  - Shows admin-only feature list and access requirements
  - Secure returnTo parameter handling with validation (prevents open redirect attacks)
  - Auto-redirects to admin dashboard if already authenticated as admin
  - Warning message for non-admin users
  - Redirects to admin dashboard after successful authentication

- **Clinic Staff Dashboard** (`/clinic/dashboard`):
  - View clinic information and contact details
  - Toggle clinic availability in real-time
  - **Emergency Request Management**:
    - Statistics cards (broadcasts today/week/month, pending, critical)
    - Filter by status (all/pending/responded) and priority (critical only)
    - Sort by newest/oldest/severity
    - Quick response actions (Call Now, WhatsApp buttons)
    - Mark as Responded functionality with backend integration
  - Edit clinic profile (name, address, phone, WhatsApp, email, region, 24-hour status)
  - Protected route (requires authentication + clinicId linkage)
  - Authorization: Only admins or linked clinic staff can access/modify clinic data

- **Database Changes**:
  - Added `clinicId` field to users table for linking staff to clinics
  - Added `isSupportHospital` field to clinics table for partner hospital program
  - Added `getAllEmergencyRequests()` and `getAllUsers()` storage methods and API endpoints
  - Staff management endpoints: POST/DELETE `/api/clinics/:id/staff`

- **Translation Keys**: Added 70+ clinic dashboard translation keys (EN/zh-HK) covering dashboard UI, availability, emergency requests, and edit forms

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript (Vite), Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI + Tailwind CSS) for UI components, React Hook Form with Zod for forms.
- **Design Decisions**: Accessible, customizable components via shadcn/ui; minimal bundle size with Wouter; Tailwind CSS for theming (dark mode, custom design tokens); type-safe form validation with shared Zod schemas.
- **Key Pages**: Home (emergency button), multi-step emergency request, clinic results (compact statistics, always-visible 24-hour filter toggle, filtering, communication), profile management, pet management (CRUD with bilingual breed selection), clinic directory (search, filters), admin dashboard (clinic CRUD with statistics), clinic staff dashboard (availability toggle, emergency requests, profile editing).

### Backend Architecture
- **Technology Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Design Decisions**: Interface-based storage layer for flexibility; PostgreSQL for data integrity, JSONB, and PostGIS; Drizzle ORM for type-safe and lightweight queries; RESTful API with consistent error handling.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests, audit logs), Queue System (retry logic, DLQ).

### Data Architecture
- **Database Schema**: Users (with clinicId for staff linking), Pets, Regions, Clinics, Emergency Requests, Messages, Feature Flags, Audit Logs, Privacy Consents, Translations.
- **Design Principles**: UUID primary keys, soft deletes, JSONB for flexible metadata, timestamp tracking, foreign key constraints.
- **Key Relationships**: Users.clinicId → Clinics.id (for clinic staff access control)

### Authentication & Authorization
- **Implementation**: Replit OIDC authentication, role-based access control (user, admin), clinic staff access control via clinicId linking, session-based authentication.
- **Security**: IP/user agent logging, privacy consent tracking, authorization checks for clinic-specific data access.
- **Roles**: 
  - Admin: Full access to all clinics, statistics, and emergency requests
  - Clinic Staff: Access to own clinic dashboard, can toggle availability, view clinic-specific emergency requests, edit clinic profile
  - Regular User: Standard pet owner access

### Messaging & Communication
- **WhatsApp Business API**: Primary notification channel with email fallback and optional SMS.
- **Architecture**: Queue-based processing, DLQ for failures, template-based messaging.

### Geolocation & Region Support
- **Global Design**: Auto user location detection, manual region override, region-scoped data queries, clinic proximity calculation.
- **Implementation**: PostGIS for geospatial queries, centroid-based region definitions, Haversine formula for client-side distance, edge caching for clinic directory.

### Observability & Monitoring
- **Logging**: Request/response logging, performance metrics, audit logs.

### Internationalization (i18n)
- **Multi-language**: Database-stored translations with 205 translation keys, supports English (EN) and Traditional Chinese (zh-HK), client-side language detection with localStorage sync.
- **Translation Quality**: All Chinese translations reviewed and optimized for Hong Kong users with natural, official, and friendly tone. Verified across landing page, emergency flow, profile, pets, and broadcast status.
- **Coverage**: Complete bilingual support for landing page (subtitle, features, disclaimer), emergency flow (symptoms, validation, steps), clinic results, profile management, pets, and broadcast status.
- **Pet Breeds**: 29 dog breeds and 24 cat breeds with professional Traditional Chinese translations. Breed selector supports searching in both English and Chinese, stores English keys in database, displays localized names based on language preference.

### Deployment Architecture
- **Infrastructure**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment (e.g., Render, Fly.io, Vercel), Infrastructure as Code (Terraform).
- **Build**: Vite for frontend, esbuild for server, separate configurations, HMR in development.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL.
- **Vite**: Frontend build tool.
- **Express.js**: HTTP server framework.

### Database & ORM
- **Drizzle ORM**: Type-safe queries.
- **drizzle-kit**: Schema management.
- **drizzle-zod**: Zod schema generation.
- **@neondatabase/serverless**: Neon PostgreSQL driver.

### UI Component Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Component system built on Radix UI.
- **Tailwind CSS**: Utility-first CSS.

### Form Management
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.

### Data Fetching & State
- **TanStack React Query**: Server state management.
- **Wouter**: Client-side routing.

### Messaging Services (Planned)
- **WhatsApp Business API**: Primary notification channel.
- **SendGrid**: Email fallback.
- **Twilio/similar**: Optional SMS.

### Geospatial
- **PostGIS**: PostgreSQL extension.
- **Browser Geolocation API**.

### Session Management
- **connect-pg-simple**: PostgreSQL session store.
- **express-session**: Session middleware.

### Development Tools
- **TypeScript**: Type safety.
- **tsx**: TypeScript execution.
- **esbuild**: Bundler.

### Additional Utilities
- **date-fns**: Date manipulation.
- **nanoid**: Unique ID generation.
- **ws**: WebSocket client.
- **embla-carousel-react**: Carousel.
- **cmdk**: Command palette.