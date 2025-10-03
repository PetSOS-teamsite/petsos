# PetSOS Lite - Emergency Veterinary Service Platform

## Overview

PetSOS Lite is an emergency veterinary care coordination platform that enables pet owners to quickly connect with 24-hour veterinary clinics during emergencies. The application allows users to broadcast emergency cases to nearby clinics with one-tap functionality while providing direct communication channels (Call/WhatsApp) to veterinary services. The system supports user and pet profiles, multi-region operations with global scalability, and comprehensive privacy/compliance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript running on Vite
- Routing via Wouter (lightweight client-side routing)
- State management through TanStack React Query for server state
- UI components from shadcn/ui (Radix UI primitives with Tailwind CSS)
- Form handling with React Hook Form and Zod validation

**Design Decisions:**
- **Component Library Choice**: shadcn/ui provides accessible, customizable components without external dependencies, allowing full control over styling and behavior
- **Routing Strategy**: Wouter chosen for minimal bundle size over React Router
- **Styling Approach**: Tailwind CSS with CSS variables for theming, supporting dark mode and customizable design tokens
- **Form Validation**: Zod schemas shared between client and server for type-safe validation

**Key Pages:**
- Home page with prominent emergency button (accessibility-focused, large touch target)
- Multi-step emergency request flow (symptom → location → contact)
- Clinic results page with filtering, distance calculation, and communication options
- Profile management (future implementation)

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js
- TypeScript for type safety
- Drizzle ORM with PostgreSQL (Neon serverless)
- Modular storage abstraction layer

**Design Decisions:**
- **Storage Pattern**: Interface-based storage layer (`IStorage`) allows swapping implementations without changing business logic
- **Database Choice**: PostgreSQL selected for relational data integrity, JSONB support for flexible fields, and PostGIS capability for geospatial queries
- **ORM Strategy**: Drizzle chosen for type-safe queries, lightweight footprint, and excellent TypeScript integration
- **API Architecture**: RESTful endpoints with consistent error handling and request/response validation

**Core Services:**
- **Messaging Service**: Handles WhatsApp Business API integration with email fallback mechanism
- **Storage Service**: Abstracted data access layer supporting users, pets, clinics, regions, emergency requests, and audit logs
- **Queue System**: Designed for retry logic with Dead Letter Queue (DLQ) for failed messages

### Data Architecture

**Database Schema:**
- **Users**: Authentication, contact info, language/region preferences, role-based access
- **Pets**: Pet profiles linked to users with medical notes
- **Regions**: Hierarchical geographic organization (country → region) with centroid coordinates
- **Clinics**: Veterinary clinic records with services, hours, contact methods, geolocation
- **Emergency Requests**: Symptom logs, location data, status tracking, clinic broadcasts
- **Messages**: Communication records with delivery status and retry tracking
- **Feature Flags**: Runtime configuration for gradual rollouts
- **Audit Logs**: Compliance tracking for all entity operations
- **Privacy Consents**: GDPR/privacy law compliance with consent logging
- **Translations**: i18n content management for multi-language support

**Design Principles:**
- UUID primary keys for distributed system compatibility
- Soft delete patterns via status fields
- JSONB columns for flexible metadata storage
- Timestamp tracking (createdAt, updatedAt) for audit trails
- Foreign key constraints with cascade deletes where appropriate

### Authentication & Authorization

**Current Implementation:**
- User registration with username/password
- Role-based access control (user, admin)
- Session-based authentication foundation (connect-pg-simple integration prepared)

**Security Considerations:**
- IP address and user agent logging for audit trails
- Privacy consent tracking before data collection
- Planned: Password hashing, secure session management, CSRF protection

### Messaging & Communication

**WhatsApp Business API Integration:**
- Primary communication channel for clinic notifications
- Fallback to email if WhatsApp delivery fails
- Optional SMS support for redundancy
- Message status tracking (pending, sent, delivered, failed)
- Retry mechanism with configurable attempts and delays

**Architecture:**
- Queue-based message processing for reliability
- DLQ for failed messages requiring manual intervention
- Template-based messaging for consistent communication

### Geolocation & Region Support

**Global-Ready Design:**
- Auto-detection of user location via GPS
- Manual region override capability
- Region-scoped data queries for performance
- Distance calculation for clinic proximity
- Edge caching for read-only clinic directory endpoints (Cloudflare)

**Implementation Strategy:**
- PostGIS extension for geospatial queries
- Centroid-based region definitions
- Client-side distance calculation using Haversine formula
- Region filters for clinic directory browsing

### Observability & Monitoring

**Logging Strategy:**
- Request/response logging for API endpoints
- Performance metrics (response time tracking)
- Truncated logs for readability (80 character limit)
- Audit logs for compliance and security

**Planned Enhancements:**
- Metrics collection (Prometheus/StatsD)
- Distributed tracing
- Error tracking (Sentry integration)
- Alert system for critical failures

### Internationalization (i18n)

**Multi-language Support:**
- JSON-based translation files (EN, zh-HK initially)
- Region-specific content variations
- Database-stored translations for dynamic content
- Client-side language detection and preferences

### Deployment Architecture

**Infrastructure Strategy:**
- Dockerized services for environment parity
- No Replit lock-in: GitHub source control with CI/CD pipelines
- Cloud-agnostic deployment (Render, Fly.io, Vercel, or custom infrastructure)
- Infrastructure as Code (Terraform) recommended for reproducibility

**Build & Deploy:**
- Vite for optimized frontend builds
- esbuild for efficient server bundling
- Separate production/development configurations
- Hot module replacement in development

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Vite**: Frontend build tool and development server
- **Express.js**: HTTP server framework

### Database & ORM
- **Drizzle ORM**: Type-safe database queries and migrations
- **drizzle-kit**: Schema management and migration tooling
- **drizzle-zod**: Automatic Zod schema generation from database schema
- **@neondatabase/serverless**: Neon PostgreSQL driver with connection pooling

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives (20+ components)
- **shadcn/ui**: Pre-styled component system built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Variant-based styling utility
- **tailwind-merge**: Intelligent Tailwind class merging

### Form Management
- **React Hook Form**: Performant form state management
- **@hookform/resolvers**: Validation resolver adapters
- **Zod**: TypeScript-first schema validation

### Data Fetching & State
- **TanStack React Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing

### Messaging Services (Planned Integration)
- **WhatsApp Business API**: Primary notification channel (requires provider setup)
- **SendGrid**: Email fallback service
- **Twilio/similar**: Optional SMS provider

### Geospatial
- **PostGIS**: PostgreSQL extension for location-based queries (to be configured)
- Browser Geolocation API for GPS coordinates

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express
- **express-session**: Session middleware (to be fully configured)

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript/TypeScript bundler
- **@replit/vite-plugin-***: Replit-specific development enhancements (dev-only)

### Additional Utilities
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **ws**: WebSocket client for Neon database connection
- **embla-carousel-react**: Carousel/slider functionality
- **cmdk**: Command palette component