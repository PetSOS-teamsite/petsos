declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

let isInitialized = false;

// Analytics tracking utility
export const analytics = {
  // Initialize Google Analytics
  initialize(measurementId: string) {
    if (typeof window === 'undefined' || !measurementId || isInitialized) return;

    // Create gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll handle page views manually
    });

    isInitialized = true;
  },

  // Track page view
  pageView(path: string, title?: string) {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  },

  // Track custom event
  event(eventName: string, parameters?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', eventName, parameters);
  },

  // Track emergency request
  trackEmergencyRequest(data: {
    petType: string;
    region?: string;
    is24Hour?: boolean;
    clinicsCount?: number;
  }) {
    const params: Record<string, any> = {
      event_category: 'Emergency',
      pet_type: data.petType,
    };
    
    // Only include optional fields if they have meaningful values
    if (data.region) params.region = data.region;
    if (data.is24Hour !== undefined) params.is_24_hour = data.is24Hour;
    if (data.clinicsCount !== undefined) params.clinics_count = data.clinicsCount;
    
    this.event('emergency_request', params);
  },

  // Track clinic contact
  trackClinicContact(data: {
    clinicId: string;
    contactMethod: 'call' | 'whatsapp';
    clinicName: string;
  }) {
    this.event('clinic_contact', {
      event_category: 'Engagement',
      clinic_id: data.clinicId,
      contact_method: data.contactMethod,
      clinic_name: data.clinicName,
    });
  },

  // Track clinic search
  trackClinicSearch(data: {
    region?: string;
    is24Hour?: boolean;
    resultsCount: number;
  }) {
    this.event('clinic_search', {
      event_category: 'Search',
      region: data.region || 'all',
      is_24_hour: data.is24Hour,
      results_count: data.resultsCount,
    });
  },

  // Track user registration
  trackUserRegistration(data: {
    userId: string;
    method: string;
  }) {
    this.event('sign_up', {
      event_category: 'User',
      user_id: data.userId,
      method: data.method,
    });
  },

  // Track pet profile creation
  trackPetCreation(data: {
    petType: string;
    breed?: string;
  }) {
    this.event('pet_created', {
      event_category: 'Pet Management',
      pet_type: data.petType,
      breed: data.breed,
    });
  },

  // Track broadcast sent
  trackBroadcast(data: {
    requestId: string;
    clinicsCount: number;
    petType: string;
  }) {
    this.event('broadcast_sent', {
      event_category: 'Emergency',
      request_id: data.requestId,
      clinics_count: data.clinicsCount,
      pet_type: data.petType,
    });
  },

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('set', 'user_properties', properties);
  },

  // Set user ID
  setUserId(userId: string | null) {
    if (typeof window === 'undefined' || !window.gtag) return;

    if (userId) {
      window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  },

  // Track district page view
  trackDistrictPageView(data: {
    district: string;
    region: string;
    language: string;
  }) {
    this.event('district_page_view', {
      event_category: 'Marketing',
      district: data.district,
      region: data.region,
      language: data.language,
    });
  },

  // Track district card click
  trackDistrictClick(data: {
    district: string;
    region: string;
    source: 'index' | 'other';
  }) {
    this.event('district_click', {
      event_category: 'Navigation',
      district: data.district,
      region: data.region,
      source: data.source,
    });
  },

  // Track resources page interaction
  trackResourcesInteraction(data: {
    interactionType: 'emergency_tip_view' | 'critical_sign_view' | 'emergency_cta_click' | 'clinic_guide_view';
    section?: string;
    language: string;
  }) {
    this.event('resources_interaction', {
      event_category: 'Content',
      interaction_type: data.interactionType,
      section: data.section,
      language: data.language,
    });
  },

  // Track FAQ interaction
  trackFAQInteraction(data: {
    action: 'question_expand' | 'emergency_cta_click' | 'clinics_cta_click';
    questionId?: number;
    language: string;
  }) {
    this.event('faq_interaction', {
      event_category: 'Content',
      action: data.action,
      question_id: data.questionId,
      language: data.language,
    });
  },

  // Track language switch
  trackLanguageSwitch(data: {
    from: string;
    to: string;
    page: string;
  }) {
    this.event('language_switch', {
      event_category: 'User Preference',
      from_language: data.from,
      to_language: data.to,
      page: data.page,
    });
  },
};
