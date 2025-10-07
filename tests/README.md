# PetSOS Test Suite

## Overview
Comprehensive Playwright-based regression test suite covering all critical user flows for the PetSOS emergency veterinary platform.

## Test Coverage

### ✅ Implemented Tests
1. **Emergency Request Workflow** (`emergency-workflow.spec.ts`)
   - Creating emergency requests with pet selection
   - Broadcasting to nearby clinics
   - Support Hospital prioritization
   - Viewing clinic results and contact options

2. **Pet Profile Management** (`pet-management.spec.ts`)
   - Creating pets with complete information
   - Editing existing pets
   - Deleting pets
   - Form validation
   - Bilingual breed selection

3. **Clinic Directory** (`clinic-directory.spec.ts`)
   - Displaying clinic listings
   - Filtering by 24-hour availability
   - Location-based search
   - Clinic details view
   - Distance calculation with geolocation

4. **Admin Dashboard** (`admin-dashboard.spec.ts`)
   - Accessing admin clinic management
   - Creating clinics with GPS auto-fill
   - Editing clinic information
   - Deleting clinics
   - Staff assignment
   - Access control verification

5. **Clinic Staff Dashboard** (`clinic-staff-dashboard.spec.ts`)
   - Staff dashboard access
   - Availability toggle
   - Viewing incoming emergency requests
   - Responding to requests
   - Access control verification

## Setup Instructions

### Required Package.json Scripts
Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report"
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Debug mode
npm run test:debug

# View test report
npm run test:report
```

## Test Architecture

### Test Utilities
- **Auth Utilities** (`tests/utils/auth.ts`)
  - `loginAsUser()` - Creates authenticated session for regular user
  - `loginAsAdmin()` - Creates authenticated session with admin role
  - `logout()` - Logs out current user

- **Database Utilities** (`tests/utils/database.ts`)
  - `createPetViaAPI()` - Creates test pet data
  - `createClinicViaAPI()` - Creates test clinic data
  - `assignStaffToClinic()` - Assigns user as clinic staff

### Test-Only Endpoints
Test utilities use special endpoints (enabled only in non-production):
- `POST /api/test/auth/session` - Create authenticated sessions
- `POST /api/test/clinics` - Create clinics without admin auth
- `POST /api/test/assign-staff` - Assign staff to clinics
- `POST /api/test/make-admin` - Grant admin role

**Security**: All `/api/test/*` endpoints are automatically disabled in production via `NODE_ENV` check.

### Test Data Isolation
- All tests use unique identifiers (`nanoid()`) to prevent conflicts
- Tests create their own data via test utilities
- No shared state between test runs

## CI/CD Integration

The test suite is configured to run in CI/CD pipelines:
- Playwright starts the dev server automatically
- Tests run in headless Chromium
- Retries enabled for flaky tests
- HTML reports generated on failure

## Best Practices

1. **Use Test Utilities**: Always use provided auth and database helpers instead of direct API calls
2. **Unique Test Data**: Generate unique names/IDs for all test entities
3. **Clean Setup**: Each test creates its own data - no assumptions about existing state
4. **Proper Assertions**: Use data-testid attributes for stable element selection
5. **Error Handling**: Tests include validation and error state coverage

## Development

### Adding New Tests
1. Create new spec file in `tests/` directory
2. Import utilities from `tests/utils/`
3. Use test-only endpoints for data setup
4. Follow existing patterns for consistency

### Updating Test Utilities
When adding new test helpers:
1. Add backend endpoint in `server/testUtils.ts`
2. Create helper function in appropriate utils file
3. Ensure `NODE_ENV` check for security
4. Document in this README
