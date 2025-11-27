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

### Hospital Management Features (COMPLETED - Nov 27, 2025)
✅ **Hospital Verification Code System**
- Admins generate 6-digit access codes via checkmark button on hospital cards
- Dialog displays code and shareable edit link for hospital owners
- Code stored and validated against hospital records

✅ **Hospital Owner Self-Service Edit Page** (`/hospital/edit/:id`)
- Step 1: Verification form requires 6-digit code entry
- Step 2: After verification, full edit form unlocks with hospital fields
- Auto-saves changes to database when owner clicks "Save Changes"
- Toast notifications for success/error feedback
- Audit logging of all owner-initiated updates

✅ **Hospital Form Tabs - All Enabled**
- Basic Info: Name (EN/ZH), Address (EN/ZH), Region, 24-Hour toggle
- Photos: Photo URL management with preview
- Facilities: Parking, Wheelchair Access, Isolation Ward, Ambulance Support, End-of-Life Support, **Oxygen Tank** ✓
- Medical Services: Imaging (X-Ray, US, CT), Lab services, Surgery capabilities, Specialist availability
- Operational: ICU level, Nurse 24h, Owner visit policy, WhatsApp triage, etc.

✅ **Oxygen Tank Facility**
- New boolean toggle in Facilities tab (hospital profiles)
- Properly integrated into database schema (`oxygenTank` column in hospitals table)
- Searchable and filterable by hospital admins

✅ **Backend Auto-Save Endpoint**
- Route: `POST /api/hospitals/:id/update-owner`
- Validates 6-digit verification code from request body
- Updates hospital info fields: nameEn, nameZh, addressEn, addressZh, phone, whatsapp, email, regionId, open247
- Creates audit log entry for tracking changes
- Returns updated hospital data to frontend
- Invalidates query cache to refresh UI immediately

### Technical Implementations
- **Backend Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Data Storage**: PostgreSQL with JSONB for flexible metadata, PostGIS for geospatial queries, Drizzle ORM for type-safe queries.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, hospitals, requests), Queue System, Rate Limiting.
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

## Recent Changes (Nov 27, 2025 - FINAL SESSION)

### Hospital Management System - COMPLETE IMPLEMENTATION
1. **Hospital Verification Code System** ✅
   - Backend: `POST /api/hospitals/:id/generate-code` - generates 6-digit code
   - Backend: `POST /api/hospitals/:id/verify` - verifies code validity
   - Admin UI: Checkmark button on hospital cards triggers code generation dialog
   - Dialog displays code + shareable edit link with code pre-filled

2. **Hospital Owner Edit Page** ✅
   - Frontend: `/hospital/edit/:id` with two-step flow
   - Step 1: Code verification form (6-digit input)
   - Step 2: Full hospital edit form (name, address, contact, region, 24-hour status)
   - Auto-save on submit with loading/success states

3. **Auto-Save Backend Endpoint** ✅
   - Route: `PATCH /api/hospitals/:id/update-owner`
   - Validates verification code in request
   - Updates hospital fields in database
   - Creates audit log entry
   - Returns updated hospital for frontend cache invalidation

4. **Hospital Form Tabs** ✅
   - All tabs enabled and fully functional
   - Photos tab: URL management and preview
   - Facilities tab: All toggles including Oxygen Tank
   - Medical Services tab: Imaging, lab, surgery, specialist fields
   - Operational tab: ICU, nursing, policies, etc.

5. **Database Schema Updates** ✅
   - Added `oxygenTank` boolean to hospitals table
   - Removed `quarterlyOffers` table (deferred for future implementation)
   - Added insert schemas for: countries, regions, pet breeds, privacy consents, translations
   - Fixed imports: `sql` from `drizzle-orm` (not drizzle-orm/pg-core)
   - Added: geography type definition for PostGIS columns

6. **Pets Table Migration** ✅
   - Created new columns: `type`, `breed_id`, `color`, `medical_history`, `microchip_id`
   - Maintains backward compatibility with existing data

## Current Status
✅ **Code Implementation**: 100% Complete
- All hospital management features built and tested
- Backend endpoints functioning
- Frontend UI complete with proper state management
- Database schema updated in code

⏳ **Database Migration**: 95% Complete
- Awaiting final interactive confirmation to apply column changes to database
- All column migrations identified: type, breed_id, color, medical_history, microchip_id in pets table; accepted in privacy_consents table
- Migration will complete once confirmed

## How to Complete Setup

**Step 1: Complete Database Migration**
```bash
npm run db:push --force
# When prompted, select option 1 (Create column) for each new column
# Type "1" and press Enter for each prompt until migration completes
```

**Step 2: Start Application**
```bash
npm run dev
```

**Step 3: Test Hospital Features**
1. Go to `/admin/hospitals`
2. Click the checkmark icon on any hospital card
3. Dialog shows 6-digit code
4. Share the code with hospital owner
5. Hospital owner opens `/hospital/edit/{hospital_id}` and enters code
6. Owner can now edit hospital information and changes auto-save

## Next Steps (Future)
- Implement quarterly offers broadcasting system (deferred)
- Add push notifications for pet parent apps
- Admin dashboard for offer management and approval workflow

## Architecture Notes
- Hospital verification uses secure 6-digit codes (numeric only, exactly 6 digits)
- Owner updates are tracked via audit logs for compliance
- All changes trigger query cache invalidation for real-time UI updates
- Oxygen Tank facility integrates seamlessly with existing facility toggles
- All form data validated with Zod schemas before database commit
