import { useEffect, useRef } from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
  id: string; // Required to ensure uniqueness
}

export function StructuredData({ data, id }: StructuredDataProps) {
  const scriptIdRef = useRef<string>(id);

  useEffect(() => {
    const scriptId = scriptIdRef.current;
    
    // Remove existing script with same ID to avoid duplicates
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create and append new script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = scriptId;
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data, id]);

  return null;
}

// Helper function to create Organization schema
export function createOrganizationSchema(language: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PetSOS",
    "alternateName": language === 'zh-HK' ? "寵物緊急求助" : "Pet Emergency Service",
    "url": "https://petsos.site",
    "logo": "https://petsos.site/icon-512.png",
    "description": language === 'zh-HK' 
      ? "一按即時通知香港24小時動物醫院。GPS定位最近診所，WhatsApp廣播求助，3步驟完成緊急求助。"
      : "Alert 24-hour animal hospitals in Hong Kong with one tap. GPS-powered emergency pet care with instant WhatsApp broadcast to nearby clinics.",
    "foundingDate": "2025",
    "areaServed": {
      "@type": "City",
      "name": language === 'zh-HK' ? "香港" : "Hong Kong"
    },
    "sameAs": [
      "https://petsos.site"
    ]
  };
}

// Helper function to create Emergency Service schema
export function createEmergencyServiceSchema(language: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "EmergencyService",
    "name": "PetSOS",
    "alternateName": language === 'zh-HK' ? "寵物緊急求助服務" : "Pet Emergency Service",
    "description": language === 'zh-HK'
      ? "24小時寵物緊急求助服務，即時連接香港所有24小時獸醫診所。GPS定位、WhatsApp廣播、快速回應。"
      : "24-hour pet emergency service connecting you instantly to all 24-hour veterinary clinics in Hong Kong. GPS location, WhatsApp broadcast, fast response.",
    "url": "https://petsos.site/emergency",
    "image": "https://petsos.site/icon-512.png",
    "serviceType": language === 'zh-HK' ? "獸醫緊急服務" : "Veterinary Emergency Service",
    "provider": {
      "@type": "Organization",
      "name": "PetSOS",
      "url": "https://petsos.site"
    },
    "areaServed": [
      {
        "@type": "AdministrativeArea",
        "name": language === 'zh-HK' ? "香港島" : "Hong Kong Island"
      },
      {
        "@type": "AdministrativeArea",
        "name": language === 'zh-HK' ? "九龍" : "Kowloon"
      },
      {
        "@type": "AdministrativeArea",
        "name": language === 'zh-HK' ? "新界" : "New Territories"
      }
    ],
    "availableLanguage": [
      {
        "@type": "Language",
        "name": "English",
        "alternateName": "en"
      },
      {
        "@type": "Language",
        "name": language === 'zh-HK' ? "繁體中文（香港）" : "Traditional Chinese (Hong Kong)",
        "alternateName": "zh-HK"
      }
    ],
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday", 
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": language === 'zh-HK' ? "緊急服務" : "Emergency Service",
      "availableLanguage": ["en", "zh-HK"],
      "areaServed": "HK"
    },
    "priceRange": "$$"
  };
}

// Helper function to create Medical Business (Veterinary) schema for clinic directory
export function createVeterinaryDirectorySchema(language: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "PetSOS",
    "alternateName": language === 'zh-HK' ? "24小時動物醫院目錄" : "24-Hour Veterinary Clinic Directory",
    "description": language === 'zh-HK'
      ? "香港24小時動物醫院完整目錄。提供GPS定位、距離排序、即時聯絡功能。覆蓋港島、九龍、新界全區。"
      : "Complete directory of 24-hour veterinary clinics in Hong Kong. Features GPS location, distance sorting, instant contact. Coverage across Hong Kong Island, Kowloon, and New Territories.",
    "url": "https://petsos.site/clinics",
    "medicalSpecialty": language === 'zh-HK' ? "獸醫急症" : "Veterinary Emergency Medicine",
    "areaServed": [
      {
        "@type": "AdministrativeArea",
        "name": language === 'zh-HK' ? "香港島" : "Hong Kong Island"
      },
      {
        "@type": "AdministrativeArea",
        "name": language === 'zh-HK' ? "九龍" : "Kowloon"
      },
      {
        "@type": "AdministrativeArea",
        "name": language === 'zh-HK' ? "新界" : "New Territories"
      }
    ],
    "availableLanguage": ["en", "zh-HK"]
  };
}

// Helper function to create VeterinaryClinic schema for individual clinics
export function createVeterinaryClinicSchema(clinic: {
  name: string;
  nameZh?: string | null;
  address: string;
  addressZh?: string | null;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  is24Hour: boolean;
}, language: string = 'en') {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "VeterinaryClinic",
    "name": language === 'zh-HK' && clinic.nameZh ? clinic.nameZh : clinic.name,
    "telephone": clinic.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": language === 'zh-HK' && clinic.addressZh ? clinic.addressZh : clinic.address,
      "addressLocality": language === 'zh-HK' ? "香港" : "Hong Kong",
      "addressCountry": "HK"
    }
  };

  if (clinic.latitude && clinic.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": clinic.latitude,
      "longitude": clinic.longitude
    };
  }

  if (clinic.is24Hour) {
    schema.openingHoursSpecification = {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday", 
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    };
  }

  return schema;
}

// Helper function to create FAQ schema
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Helper function to create WebSite schema with SearchAction
export function createWebSiteSchema(language: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PetSOS",
    "alternateName": language === 'zh-HK' ? "寵物緊急求助" : "Pet Emergency Service",
    "url": "https://petsos.site",
    "description": language === 'zh-HK'
      ? "香港寵物緊急求助平台，連接24小時動物醫院"
      : "Hong Kong pet emergency platform connecting to 24-hour veterinary clinics",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://petsos.site/clinics?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["en", "zh-HK"]
  };
}
