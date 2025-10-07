import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { analytics } from '@/lib/analytics';

export function useAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (measurementId && typeof window !== 'undefined') {
      // Check if user has consented to analytics
      const hasConsent = localStorage.getItem('analytics_consent') === 'true';
      
      if (hasConsent) {
        analytics.initialize(measurementId);
        // Track initial page view for returning users
        analytics.pageView(location);
      }
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    const hasConsent = localStorage.getItem('analytics_consent') === 'true';
    
    if (hasConsent && window.gtag) {
      analytics.pageView(location);
    }
  }, [location]);

  return analytics;
}

export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const hasConsent = localStorage.getItem('analytics_consent') === 'true';
    
    if (hasConsent && measurementId && typeof window !== 'undefined') {
      // Initialize analytics for returning users
      analytics.initialize(measurementId);
      // Track initial page view
      analytics.pageView(location);
    }
  }, []);

  useEffect(() => {
    const hasConsent = localStorage.getItem('analytics_consent') === 'true';
    
    if (hasConsent && window.gtag) {
      analytics.pageView(location);
    }
  }, [location]);
}
