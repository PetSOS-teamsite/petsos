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

### Technical Implementations
- **Backend Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Data Storage**: PostgreSQL with JSONB for flexible metadata, PostGIS for geospatial queries, Drizzle ORM for type-safe queries.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests), Queue System, Rate Limiting.
- **Security**: Production-grade rate limiting, GDPR/PDPO compliance, Passport.js for multi-option authentication, role-based access control (user, admin, clinic staff), session-based authentication with PostgreSQL session store.
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
- **Hospital Management**: Comprehensive admin interface for managing 24-hour animal hospitals with enhanced profiles, including tabbed forms (Basic Info, Photos, Facilities, Medical Services, Operational Details), photo management, detailed facility and medical service fields, and custom array field handling.
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