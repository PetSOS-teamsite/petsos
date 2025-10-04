# PetSOS Lite - Emergency Veterinary Service Platform

## Overview

PetSOS Lite is an emergency veterinary care coordination platform designed to quickly connect pet owners with 24-hour veterinary clinics during emergencies. It enables one-tap broadcasting of emergency cases to nearby clinics and provides direct communication channels (Call/WhatsApp). The platform supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy/compliance tracking, aiming to streamline emergency pet care coordination.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript (Vite), Wouter for routing, TanStack React Query for state management, shadcn/ui (Radix UI + Tailwind CSS) for UI components, React Hook Form with Zod for forms.
- **Design Decisions**: Accessible, customizable components via shadcn/ui; minimal bundle size with Wouter; Tailwind CSS for theming (dark mode, custom design tokens); type-safe form validation with shared Zod schemas.
- **Key Pages**: Home (emergency button), multi-step emergency request, clinic results (filtering, communication), profile management, pet management (CRUD), clinic directory (search, filters), admin dashboard (clinic CRUD).

### Backend Architecture
- **Technology Stack**: Node.js with Express.js, TypeScript, Drizzle ORM with PostgreSQL (Neon serverless), modular storage abstraction.
- **Design Decisions**: Interface-based storage layer for flexibility; PostgreSQL for data integrity, JSONB, and PostGIS; Drizzle ORM for type-safe and lightweight queries; RESTful API with consistent error handling.
- **Core Services**: Messaging (WhatsApp Business API, email fallback), Storage (users, pets, clinics, requests, audit logs), Queue System (retry logic, DLQ).

### Data Architecture
- **Database Schema**: Users, Pets, Regions, Clinics, Emergency Requests, Messages, Feature Flags, Audit Logs, Privacy Consents, Translations.
- **Design Principles**: UUID primary keys, soft deletes, JSONB for flexible metadata, timestamp tracking, foreign key constraints.

### Authentication & Authorization
- **Implementation**: User registration (username/password), role-based access control (user, admin), session-based authentication.
- **Security**: IP/user agent logging, privacy consent tracking.

### Messaging & Communication
- **WhatsApp Business API**: Primary notification channel with email fallback and optional SMS.
- **Architecture**: Queue-based processing, DLQ for failures, template-based messaging.

### Geolocation & Region Support
- **Global Design**: Auto user location detection, manual region override, region-scoped data queries, clinic proximity calculation.
- **Implementation**: PostGIS for geospatial queries, centroid-based region definitions, Haversine formula for client-side distance, edge caching for clinic directory.

### Observability & Monitoring
- **Logging**: Request/response logging, performance metrics, audit logs.

### Internationalization (i18n)
- **Multi-language**: JSON-based translation files (EN, zh-HK), region-specific content, database-stored translations, client-side language detection.

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