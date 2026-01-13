import { useEffect, useRef } from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
  id: string; // Required to ensure uniqueness
}

export function StructuredData({ data, id }: StructuredDataProps) {
  const scriptIdRef = useRef<string>(id);

  useEffect(() => {
    const scriptId = scriptIdRef.current;
    const jsonContent = JSON.stringify(data);
    
    // Check for existing script with same ID
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (existingScript) {
      // Update existing script content instead of removing/re-adding
      // This prevents DOM manipulation race conditions
      existingScript.textContent = jsonContent;
    } else {
      // Create and append new script only if it doesn't exist
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = jsonContent;
      script.id = scriptId;
      document.head.appendChild(script);
    }

    return () => {
      // Safe removal: use contains() which is more reliable across environments
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove && document.head.contains(scriptToRemove)) {
        try {
          scriptToRemove.remove(); // Modern, safer method than removeChild
        } catch (e) {
          // Silently ignore if already removed
        }
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
    "image": "https://petsos.site/og-image.webp",
    "description": language === 'zh-HK' 
      ? "一按即時通知香港24小時動物醫院。GPS定位最近診所，WhatsApp廣播求助，3步驟完成緊急求助。"
      : "Alert 24-hour animal hospitals in Hong Kong with one tap. GPS-powered emergency pet care with instant WhatsApp broadcast to nearby clinics.",
    "foundingDate": "2025",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "22.3193",
      "longitude": "114.1694"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": language === 'zh-HK' ? "香港" : "Hong Kong",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "22.3193",
          "longitude": "114.1694"
        }
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "HK",
      "addressRegion": language === 'zh-HK' ? "香港" : "Hong Kong"
    },
    "sameAs": [
      "https://petsos.site",
      "https://www.facebook.com/petsos",
      "https://www.instagram.com/petsos.hk"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": language === 'zh-HK' ? "緊急服務" : "Emergency Service",
      "availableLanguage": ["en", "zh-HK"],
      "areaServed": "HK"
    }
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
    "image": "https://petsos.site/og-image.webp",
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

// Helper function to create BreadcrumbList schema for navigation
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Helper function to create HowTo schema for emergency request process
export function createHowToSchema(language: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": language === 'zh-HK' 
      ? "如何使用PetSOS發出寵物緊急求助"
      : "How to Request Emergency Pet Care with PetSOS",
    "description": language === 'zh-HK'
      ? "3步驟即時連接香港24小時動物醫院，GPS定位、WhatsApp廣播、快速回應"
      : "Connect to 24-hour veterinary clinics in Hong Kong in 3 simple steps with GPS location, WhatsApp broadcast, and fast response",
    "image": "https://petsos.site/og-image.png",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "HKD",
      "value": "0"
    },
    "tool": [
      {
        "@type": "HowToTool",
        "name": language === 'zh-HK' ? "智能手機" : "Smartphone"
      },
      {
        "@type": "HowToTool",
        "name": language === 'zh-HK' ? "GPS定位" : "GPS Location"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": language === 'zh-HK' ? "描述緊急情況" : "Describe Emergency",
        "text": language === 'zh-HK'
          ? "選擇寵物症狀，可使用語音記錄或文字輸入。AI會協助分析症狀嚴重程度。"
          : "Select your pet's symptoms using voice recording or text input. AI assists with severity analysis.",
        "url": "https://petsos.site/emergency#step1",
        "image": "https://petsos.site/icon-512.png"
      },
      {
        "@type": "HowToStep",
        "name": language === 'zh-HK' ? "確認位置" : "Confirm Location",
        "text": language === 'zh-HK'
          ? "系統自動GPS定位，顯示最近的24小時動物醫院。可手動調整位置。"
          : "System automatically detects your GPS location and shows nearest 24-hour clinics. Manual adjustment available.",
        "url": "https://petsos.site/emergency#step2",
        "image": "https://petsos.site/icon-512.png"
      },
      {
        "@type": "HowToStep",
        "name": language === 'zh-HK' ? "發送求助" : "Send Request",
        "text": language === 'zh-HK'
          ? "確認聯絡資料後，系統即時透過WhatsApp向附近診所廣播求助訊息，並可直接致電診所。"
          : "After confirming contact details, system broadcasts emergency request to nearby clinics via WhatsApp. Direct call option available.",
        "url": "https://petsos.site/emergency#step3",
        "image": "https://petsos.site/icon-512.png"
      }
    ]
  };
}

// Helper function to create LocalBusiness schema for individual clinics with enhanced details
export function createLocalBusinessSchema(clinic: {
  id: string;
  name: string;
  nameZh?: string | null;
  address: string;
  addressZh?: string | null;
  phone: string;
  whatsapp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is24Hour: boolean;
  regionId?: string | null;
}, language: string = 'en') {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "VeterinaryClinic",
    "name": language === 'zh-HK' && clinic.nameZh ? clinic.nameZh : clinic.name,
    "telephone": clinic.phone,
    "url": `https://petsos.site/clinics#${clinic.id}`,
    "priceRange": "$$-$$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": language === 'zh-HK' && clinic.addressZh ? clinic.addressZh : clinic.address,
      "addressLocality": language === 'zh-HK' ? "香港" : "Hong Kong",
      "addressRegion": clinic.regionId || "HK",
      "addressCountry": "HK"
    },
    "availableLanguage": ["en", "zh-HK"]
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

// Helper function to create AggregateRating schema
export function createAggregateRatingSchema(ratingValue: number, reviewCount: number, bestRating: number = 5) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "PetSOS - Emergency Veterinary Care Platform",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue.toString(),
      "reviewCount": reviewCount.toString(),
      "bestRating": bestRating.toString()
    }
  };
}

// Enhanced Hospital schema with VeterinaryCare + LocalBusiness for maximum GEO visibility
export function createEnhancedHospitalSchema(hospital: {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  addressEn: string;
  addressZh?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  open247?: boolean;
  regionName?: string;
  specialistAvail?: string | null;
  lastVerifiedAt?: string | Date | null;
  minFee?: number | null;
  maxFee?: number | null;
  languages?: string[] | null;
  speciesAccepted?: string[] | null;
}, language: string = 'en') {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": ["VeterinaryCare", "LocalBusiness"],
    "name": language === 'zh-HK' ? hospital.nameZh : hospital.nameEn,
    "alternateName": language === 'zh-HK' ? hospital.nameEn : hospital.nameZh,
    "url": `https://petsos.site/hospitals/${hospital.slug}`,
    "telephone": hospital.phone || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": language === 'zh-HK' && hospital.addressZh ? hospital.addressZh : hospital.addressEn,
      "addressLocality": "Hong Kong",
      "addressRegion": hospital.regionName || "Hong Kong",
      "addressCountry": "HK"
    },
    "isAcceptingNewPatients": true,
    "publishingPrinciples": "https://petsos.site/verification-process"
  };

  // Add geo coordinates
  if (hospital.latitude && hospital.longitude) {
    const lat = typeof hospital.latitude === 'string' ? parseFloat(hospital.latitude) : hospital.latitude;
    const lng = typeof hospital.longitude === 'string' ? parseFloat(hospital.longitude) : hospital.longitude;
    if (!isNaN(lat) && !isNaN(lng)) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": lat,
        "longitude": lng
      };
    }
  }

  // Add 24/7 opening hours
  if (hospital.open247) {
    schema.openingHoursSpecification = {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    };
  }

  // Add price range if fees are available
  if (hospital.minFee && hospital.maxFee) {
    schema.priceRange = `${hospital.minFee} - ${hospital.maxFee} HKD`;
  } else if (hospital.minFee) {
    schema.priceRange = `From ${hospital.minFee} HKD`;
  } else {
    schema.priceRange = "$$-$$$";
  }

  // Add verification timestamp (key trust signal)
  if (hospital.lastVerifiedAt) {
    const verifiedDate = hospital.lastVerifiedAt instanceof Date 
      ? hospital.lastVerifiedAt.toISOString().split('T')[0]
      : new Date(hospital.lastVerifiedAt).toISOString().split('T')[0];
    schema.dateModified = verifiedDate;
  }

  // Add description with specialty info
  const specialties = hospital.specialistAvail || (language === 'zh-HK' ? '緊急護理' : 'Emergency Care');
  schema.description = language === 'zh-HK'
    ? `${hospital.regionName || '香港'}24小時動物醫院，提供${specialties}服務。`
    : `24-hour emergency vet in ${hospital.regionName || 'Hong Kong'} specializing in ${specialties}.`;

  // Add medical specialty array
  if (hospital.specialistAvail) {
    schema.medicalSpecialty = hospital.specialistAvail.split(',').map(s => s.trim());
  }

  // Add available languages
  if (hospital.languages && hospital.languages.length > 0) {
    schema.availableLanguage = hospital.languages;
  } else {
    schema.availableLanguage = ["en", "zh-HK"];
  }

  // Build additionalProperty array
  const additionalProperties: Array<{ "@type": string; name: string; value: string }> = [];
  
  // Add species accepted
  if (hospital.speciesAccepted && hospital.speciesAccepted.length > 0) {
    hospital.speciesAccepted.forEach(species => {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Species Accepted",
        "value": species
      });
    });
  }
  
  // Add ReferencePartner for East Island hospital (EI partnership signal)
  const EI_SLUG = 'east-island-24-hours-animal-hospital';
  if (hospital.slug === EI_SLUG) {
    additionalProperties.push({
      "@type": "PropertyValue",
      "name": "ReferencePartner",
      "value": "PetSOS"
    });
  }
  
  if (additionalProperties.length > 0) {
    schema.additionalProperty = additionalProperties;
  }

  return schema;
}

// District CollectionPage schema for hyper-local GEO
export function createDistrictCollectionSchema(
  districtName: string,
  districtUrl: string,
  hospitals: Array<{
    slug: string;
    nameEn: string;
    isPartner?: boolean;
  }>,
  language: string = 'en'
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": language === 'zh-HK' 
      ? `${districtName}24小時動物醫院`
      : `24-Hour Animal Hospitals in ${districtName}`,
    "description": language === 'zh-HK'
      ? `${districtName}區經驗證的24小時動物醫院列表`
      : `Verified 24-hour veterinary hospitals in ${districtName} district`,
    "url": districtUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": hospitals.length,
      "itemListElement": hospitals.map((hospital, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@id": `https://petsos.site/hospitals/${hospital.slug}`,
          "@type": "VeterinaryCare",
          "name": hospital.nameEn
        }
      }))
    }
  };
}

// SoftwareApplication schema for /emergency page
export function createSoftwareApplicationSchema(language: string = 'en') {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PetSOS",
    "applicationCategory": "MedicalApplication",
    "operatingSystem": ["Web", "iOS", "Android"],
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "HKD"
    },
    "url": "https://petsos.site/emergency",
    "description": language === 'zh-HK'
      ? "PetSOS是免費緊急協調工具，幫助香港寵物主人一鍵向多間24小時動物醫院廣播求助。"
      : "PetSOS is a free emergency coordination tool that helps Hong Kong pet owners reach 24-hour animal hospitals faster by broadcasting emergencies to multiple clinics at once.",
    "publisher": {
      "@type": "Organization",
      "name": "PetSOS",
      "url": "https://petsos.site"
    },
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": language === 'zh-HK' ? "香港" : "Hong Kong"
    }
  };
}

// Typhoon/Holiday emergency status schema
export function createEmergencyStatusSchema(
  status: 'normal' | 'typhoon' | 'holiday',
  activeHospitals: Array<{ name: string; url: string }>,
  language: string = 'en'
) {
  return {
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    "name": language === 'zh-HK' 
      ? `香港寵物緊急服務 - ${status === 'typhoon' ? '颱風警告' : status === 'holiday' ? '假日' : '正常'}狀態`
      : `Hong Kong Pet Emergency - ${status === 'typhoon' ? 'Typhoon Warning' : status === 'holiday' ? 'Holiday' : 'Normal'} Status`,
    "category": "https://www.wikidata.org/wiki/Q81068910",
    "datePosted": new Date().toISOString(),
    "text": language === 'zh-HK'
      ? `目前有 ${activeHospitals.length} 間24小時動物醫院確認營業中。`
      : `Currently ${activeHospitals.length} 24-hour veterinary hospitals confirmed open.`,
    "spatialCoverage": {
      "@type": "City",
      "name": "Hong Kong"
    },
    "announcementLocation": activeHospitals.map(h => ({
      "@type": "VeterinaryCare",
      "name": h.name,
      "url": h.url
    }))
  };
}
