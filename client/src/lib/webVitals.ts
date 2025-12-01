import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { analytics } from './analytics';

function sendToAnalytics(metric: Metric) {
  // Send to Google Analytics if available
  if (analytics && typeof analytics.event === 'function') {
    analytics.event('web_vitals', {
      event_category: 'Web Vitals',
      metric_name: metric.name,
      metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      non_interaction: true,
    });
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }
}

export function initWebVitals() {
  // Core Web Vitals (2025)
  onCLS(sendToAnalytics);  // Cumulative Layout Shift
  onINP(sendToAnalytics);  // Interaction to Next Paint (replaced FID)
  onLCP(sendToAnalytics);  // Largest Contentful Paint
  
  // Additional metrics
  onFCP(sendToAnalytics);  // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
}
