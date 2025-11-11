## Overview
PetSOS is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics. It enables one-tap broadcasting of emergency cases to nearby clinics and offers direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy compliance, aiming to streamline emergency pet care coordination and improve pet welfare during crises.

## Production Deployment (petsos.site)
The production deployment at petsos.site uses white-labeled authentication without Replit branding:
- **Authentication Methods**: Google OAuth, Email/Password, Phone/Password
- **Required Environment Variables**: PRODUCTION_URL=https://petsos.site, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, DATABASE_URL
- **Excluded Variables**: REPLIT_DOMAINS, REPL_ID, ISSUER_URL (must NOT be set in production to avoid Replit consent screen)
- **Google OAuth Callback**: https://petsos.site/api/auth/google/callback must be configured in Google Cloud Console
- **Build Command**: `npm install --include=dev && rm -rf dist && npm run build` (includes dist cleanup to prevent cache corruption)
- **Cache Prevention**: Aggressive no-cache headers on HTML/JS/CSS to bypass Cloudflare CDN caching
- See docs/PRODUCTION_DEPLOYMENT.md for complete deployment instructions

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Stack**: React with TypeScript (Vite), Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI + Tailwind CSS) for UI components, React Hook Form with Zod for forms.
- **Design Principles**: Accessible, customizable components; minimal bundle size; Tailwind CSS for theming (dark mode, custom design tokens); type-safe form validation.
- **Routing**: Dedicated `/signup` and `/login` routes both point to LoginPage component; page detects current route to default to appropriate mode (signup vs login). This enables direct navigation to signup via URL and supports external links.
- **Branding**: Text-based "PetSOS" logo, vibrant red (#EF4444) primary color, custom SVG favicon (emergency cross + paw print).
- **PWA Support**: Full Progressive Web App (PWA) support with web app manifest, multiple icon sizes, installable to home screen, standalone display mode, emergency and clinic shortcuts. Cache-busting headers prevent users from loading stale HTML/JS bundles.
- **Localization**: Bilingual optimization (EN/ZH-HK) for key pages, comprehensive Open Graph and Twitter Cards, geo-targeting for Hong Kong, database-stored translations, colloquial HK terminology for pet breeds.
- **Emergency UI**: Multi-step emergency request form with severity-ordered symptoms (Critical, Serious, Moderate), compact VoiceRecorder UI with collapsible tips, and real-time editable broadcast messages.
- **Clinic Display**: Compact clinic action buttons, brand-aligned directory with bilingual region names, red-themed compact cards, clickable cards with Maps integration, mobile-optimized horizontally scrollable region tabs.
- **Partner Prioritization**: Partner clinics are prioritized and identified with purple/blue gradient badges. Sorting hierarchy: existing patient clinics → partner clinics → distance-sorted remaining clinics.
- **Region Management**: Active regions limited to Hong Kong Island (HKI), Kowloon (KLN), and New Territories (NTI).

### Technical Implementations
- **Backend Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Data Storage**: PostgreSQL with JSONB for flexible metadata, PostGIS for geospatial queries, Drizzle ORM for type-safe queries.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests), Queue System, Rate Limiting.
- **Security**: Production-grade rate limiting, `trust proxy`, GDPR/PDPO compliance, Passport.js for multi-option authentication, role-based access control (user, admin, clinic staff), session-based authentication with PostgreSQL session store.
- **Authentication Methods**: Google OAuth (with explicit session persistence via `req.session.save()` and session guards to handle missing sessions gracefully), Email/Password, Phone/Password (with country code selection).
- **Emergency Broadcasts**: Enhanced content includes full pet profile information, support hospital program prioritization, existing patient recognition.
- **Geolocation**: PostGIS for server-side geospatial queries (ST_DWithin, ST_Distance), geography column with GIST spatial index, auto-user location detection, manual override.
- **Messaging Architecture**: WhatsApp Business API as primary, email fallback, queue-based processing, template-based messaging (full, new, basic templates dynamically selected based on pet registration and language).
- **Analytics & Monitoring**: Google Analytics 4 (GA4) with GDPR-compliant cookie consent, Sentry for backend and frontend error tracking and performance monitoring.
  - **Custom Event Tracking**: District page views, district card clicks, resources page interactions (emergency tips, critical signs, clinic guide), FAQ accordion expansions, language switching, all tracked with district/region/language parameters for detailed engagement analysis
  - **Marketing Analytics**: Comprehensive tracking of district landing pages, resources center, and FAQ interactions to measure content effectiveness and user engagement patterns
- **SEO Optimization (2025)**: Comprehensive bilingual SEO with performance-first approach:
  - **Core Web Vitals Monitoring**: Real-time tracking of LCP, INP, CLS, FCP, TTFB via web-vitals library integrated with Google Analytics
  - **Performance Optimizations**: Single Google Font (Inter) with font-display: swap and preload, WebP images (62.5% smaller OG image: 72KB→27KB), fetchpriority="high" on critical assets, DNS prefetch for external resources
  - **Structured Data**: 8 schema types (Organization with geo-coordinates, WebSite, EmergencyService, VeterinaryDirectory, FAQ, HowTo, BreadcrumbList, LocalBusiness, AggregateRating), all schemas use WebP images
  - **Local SEO**: Hong Kong geo-targeting (22.3193, 114.1694), district-specific keywords (Central, Tsim Sha Tsui, Mong Kok + Chinese), enhanced Organization schema with address and contact points
  - **Technical SEO**: Canonical URLs site-wide, sitemap.xml with cache-busting, robots.txt, dynamic meta tags (Open Graph, Twitter Cards), HTML lang attribute switching, mobile-first optimization
  - **Social Integration**: Facebook/Instagram sameAs properties in Organization schema
  - **District Marketing Pages**: Dedicated landing pages for 6 major Hong Kong districts (Central, Causeway Bay, Wan Chai, Tsim Sha Tsui, Mong Kok, Sha Tin) with bilingual content, local SEO keywords, geo-coordinates, nearby clinic listings, and analytics tracking for page views and CTA clicks
  - **Resources Center**: Comprehensive Traditional Chinese marketing content including pet emergency handling guide, critical warning signs, clinic selection criteria, and preventive care information with HowTo structured data and interaction tracking
  - **FAQ Page**: Bilingual frequently asked questions with FAQPage structured data for rich snippets in search results, includes accordion expansion tracking and CTA analytics
  - **Google Search Console**: Sitemap.xml submitted with 15 indexed pages (increased from 6), robots.txt updated with cache-busting, comprehensive setup documentation in docs/GOOGLE_SEARCH_CONSOLE_SETUP.md
- **Multi-Environment Configuration**: Centralized configuration for development, staging, and production environments using `.env` files.
- **Deployment**: Dockerized services, GitHub for CI/CD, cloud-agnostic deployment, Infrastructure as Code.

### Feature Specifications
- **User & Pet Management**: CRUD operations for profiles and pets, bilingual breed selection.
- **Clinic Management**: Directory, staff dashboard, admin dashboard.
- **Hospital Management**: Comprehensive admin interface for managing 24-hour animal hospitals with enhanced profiles:
  - **Tabbed Form Interface**: 5-tab organization (Basic Info, Photos, Facilities, Medical Services, Operational Details)
  - **Photo Management**: Add/remove multiple hospital photo URLs with thumbnail display
  - **Facilities**: Parking availability, wheelchair accessibility, isolation ward, ambulance service, end-of-life care, 24/7 ICU availability
  - **Medical Services**: Imaging (X-ray, ultrasound, CT, MRI), laboratory services, surgery capabilities, anesthesia level, ICU level, specialist services
  - **Operational Details**: Triage policy, average wait times, visiting hours, deposit requirements, client support features
  - **Array Field Support**: Custom CommaArrayField component using useController for proper handling of comma-separated arrays (species accepted, languages spoken, payment methods, insurance providers)
  - **Form Architecture**: Reusable component pattern with parseCommaList/joinCommaList helpers, useEffect-based resync on form.reset, no React Hooks violations
- **Emergency Request Flow**: Multi-step form (symptoms & pet → location → contact info with optional voice recording), supports authenticated and anonymous users. Authenticated users still see Step 3 (contact information) but their name and phone number are automatically pre-filled from their profile; users can edit pre-filled values if needed (e.g., using a different phone for the emergency). Auto-fill only applies if users haven't manually edited the fields during the current session.
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
- **sharp**: Image processing (SVG to PNG/WebP conversion).
- **web-vitals**: Core Web Vitals monitoring (LCP, INP, CLS, FCP, TTFB).

### Error Tracking & Monitoring
- **@sentry/node**: Backend error tracking and performance monitoring.
- **@sentry/react**: Frontend error tracking with React integration and session replay.