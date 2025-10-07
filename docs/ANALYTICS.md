# Analytics Integration Guide

PetSOS uses Google Analytics 4 (GA4) to track user interactions and improve the platform. This guide explains how analytics is implemented and how to configure it.

## Overview

The analytics system currently tracks:
- **Page views and navigation** (✅ Active)
- **Cookie consent events** (✅ Active)

Additional event tracking helpers are available for future integration:
- Emergency requests and broadcasts (🚧 Helper available, needs UI integration)
- Clinic searches and contacts (🚧 Helper available, needs UI integration)
- User registrations and pet management (🚧 Helper available, needs UI integration)

## Features

### GDPR Compliance

- **Cookie Consent Banner**: Users must explicitly consent before analytics tracking begins
- **User Control**: Consent choice is stored in localStorage and respected throughout the app
- **Privacy First**: No tracking occurs until user accepts cookies
- **Easy Opt-Out**: Users can decline or close the banner to prevent tracking

### Current Implementation Status

#### ✅ Implemented and Active

1. **Page Views** (`page_view`)
   - ✅ Tracked automatically on route changes
   - ✅ Includes page path and title
   - ✅ Initial page view tracked for both new and returning users

2. **Cookie Consent** (`cookie_consent`)
   - ✅ Tracked when user accepts cookies
   - ✅ No tracking on decline (respects user choice)

#### 🚧 Event Tracking Helpers (Ready to Use)

The following event tracking methods are available in the analytics utility but not yet wired to UI components:

1. **Emergency Requests** (`emergency_request`)
   - Method: `analytics.trackEmergencyRequest()`
   - Status: Helper created, needs UI integration

2. **Emergency Broadcasts** (`broadcast_sent`)
   - Method: `analytics.trackBroadcast()`
   - Status: Helper created, needs UI integration

3. **Clinic Searches** (`clinic_search`)
   - Method: `analytics.trackClinicSearch()`
   - Status: Helper created, needs UI integration

4. **Clinic Contacts** (`clinic_contact`)
   - Method: `analytics.trackClinicContact()`
   - Status: Helper created, needs UI integration

5. **User Registration** (`sign_up`)
   - Method: `analytics.trackUserRegistration()`
   - Status: Helper created, needs UI integration

6. **Pet Creation** (`pet_created`)
   - Method: `analytics.trackPetCreation()`
   - Status: Helper created, needs UI integration

## Setup

### 1. Get Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property or use an existing one
3. Copy your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variable

Add your Measurement ID to `.env`:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Note**: The variable must be prefixed with `VITE_` to be accessible in the frontend.

### 3. Restart Application

After adding the environment variable, restart the development server:

```bash
npm run dev
```

## Usage

### Automatic Tracking

Page views are tracked automatically when the user navigates between pages.

### Manual Event Tracking

To track custom events in your components:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();

  const handleAction = () => {
    analytics.event('custom_event', {
      event_category: 'User Action',
      custom_parameter: 'value',
    });
  };

  // ... rest of component
}
```

### Tracking Specific Events

#### Emergency Request

```typescript
analytics.trackEmergencyRequest({
  petType: 'dog',
  region: 'HKI',
  is24Hour: true,
  clinicsCount: 5,
});
```

#### Clinic Contact

```typescript
analytics.trackClinicContact({
  clinicId: 'clinic-123',
  contactMethod: 'whatsapp',
  clinicName: 'Example Vet Clinic',
});
```

#### Clinic Search

```typescript
analytics.trackClinicSearch({
  region: 'KLN',
  is24Hour: false,
  resultsCount: 12,
});
```

#### User Registration

```typescript
analytics.trackUserRegistration({
  userId: user.id,
  method: 'replit_auth',
});
```

#### Pet Creation

```typescript
analytics.trackPetCreation({
  petType: 'cat',
  breed: 'Persian',
});
```

#### Broadcast Sent

```typescript
analytics.trackBroadcast({
  requestId: 'request-123',
  clinicsCount: 8,
  petType: 'dog',
});
```

### Setting User Properties

```typescript
analytics.setUserProperties({
  user_role: 'pet_owner',
  region: 'Hong Kong',
  language: 'en',
});
```

### Setting User ID

```typescript
analytics.setUserId(user.id);
```

## Privacy & Compliance

### GDPR Compliance

The analytics implementation is GDPR compliant:

1. **Explicit Consent**: Users must actively accept cookies
2. **Clear Information**: Cookie banner explains data usage
3. **Easy Opt-Out**: Users can decline or close the banner
4. **Persistent Choice**: Consent decision is remembered
5. **No Tracking Before Consent**: Analytics only initializes after user accepts

### Data Collected

Google Analytics collects:
- Page views and navigation patterns
- User interactions with the platform
- Device and browser information
- Geographic location (country/city level)
- User demographics (if available)

### Data NOT Collected

- Personal health information
- Pet medical records
- Passwords or authentication tokens
- Payment information
- Exact GPS coordinates

### Privacy Policy

Ensure your privacy policy includes:
- What data is collected
- How it's used
- How long it's retained
- User rights (access, deletion, opt-out)
- Third-party services (Google Analytics)

## Testing

### Test in Development

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter for "google-analytics" or "gtag"
4. Navigate around the app
5. Verify GA requests are sent

### Check in Google Analytics

1. Go to Google Analytics
2. Navigate to Reports → Real-time
3. Use the app and verify events appear
4. Check that event parameters are correct

### Test Cookie Consent

1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Verify cookie banner appears
4. Test "Accept" and "Decline" buttons
5. Verify choice is remembered on refresh

## Debugging

### Analytics Not Working

**Problem**: No events being tracked

**Solutions**:
1. Check `VITE_GA_MEASUREMENT_ID` is set in `.env`
2. Verify user has accepted cookies
3. Check browser console for errors
4. Ensure ad blockers are disabled for testing

### Cookie Banner Not Showing

**Problem**: Cookie consent banner doesn't appear

**Solutions**:
1. Clear localStorage: `localStorage.clear()`
2. Check if `analytics_consent` key exists
3. Refresh the page
4. Verify `CookieConsent` component is imported in App.tsx

### Events Not Appearing in GA

**Problem**: Events tracked but not in Google Analytics

**Solutions**:
1. Wait 24-48 hours for data to process
2. Use Real-time reports for immediate verification
3. Verify Measurement ID is correct
4. Check GA4 property configuration

## Best Practices

1. **Track Meaningful Events**: Only track events that provide actionable insights
2. **Use Consistent Naming**: Follow the event naming conventions
3. **Include Context**: Add relevant parameters to events
4. **Respect Privacy**: Never track personal health information
5. **Test Thoroughly**: Verify tracking before deploying to production
6. **Monitor Data Quality**: Regularly check GA reports for anomalies
7. **Document Custom Events**: Keep this guide updated with new events

## Removing Analytics

To completely remove analytics:

1. Remove `VITE_GA_MEASUREMENT_ID` from `.env`
2. Remove `<CookieConsent />` from `App.tsx`
3. Remove `usePageTracking()` from `App.tsx`
4. Delete analytics-related files:
   - `client/src/lib/analytics.ts`
   - `client/src/hooks/useAnalytics.ts`
   - `client/src/components/CookieConsent.tsx`

## Related Documentation

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)
- [Cookie Consent Best Practices](https://developers.google.com/analytics/devguides/collection/gtagjs/cookie-usage)
