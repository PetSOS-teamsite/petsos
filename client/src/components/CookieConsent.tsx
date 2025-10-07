import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { analytics } from '@/lib/analytics';
import { X } from 'lucide-react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('analytics_consent');
    if (consent === null) {
      setShowBanner(true);
    } else if (consent === 'true') {
      // User has consented, initialize analytics
      const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (measurementId) {
        analytics.initialize(measurementId);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics_consent', 'true');
    setShowBanner(false);
    
    // Initialize analytics
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      analytics.initialize(measurementId);
      analytics.event('cookie_consent', { consent_given: true });
      // Track initial page view
      analytics.pageView(window.location.pathname);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('analytics_consent', 'false');
    setShowBanner(false);
    
    // Do not track decline - no consent means no tracking
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50" data-testid="cookie-consent-banner">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">Cookie Notice</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={handleDecline}
              data-testid="button-close-consent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            We use cookies to improve your experience and analyze site usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">
            We use Google Analytics to understand how you use PetSOS and improve our services. 
            This helps us make the platform better for emergency pet care.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
            data-testid="button-decline-cookies"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1"
            data-testid="button-accept-cookies"
          >
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
