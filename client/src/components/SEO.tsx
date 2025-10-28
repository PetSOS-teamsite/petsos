import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  language?: string;
}

export function SEO({
  title,
  description,
  keywords,
  ogImage = 'https://petsos.site/og-image.png',
  canonical,
  noindex = false,
  language = 'en',
}: SEOProps) {
  const [location] = useLocation(); // Track route changes

  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

    // Update or create meta tags
    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const updateProperty = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Get current page URL (use canonical if provided, otherwise current location)
    const pageUrl = canonical || window.location.href;

    if (description) {
      updateMeta('description', description);
      updateProperty('og:description', description);
      updateProperty('twitter:description', description);
    }

    if (keywords) {
      updateMeta('keywords', keywords);
    }

    if (title) {
      updateMeta('title', title);
      updateProperty('og:title', title);
      updateProperty('twitter:title', title);
    }

    if (ogImage) {
      updateProperty('og:image', ogImage);
      updateProperty('twitter:image', ogImage);
    }

    // Update URLs for social sharing
    updateProperty('og:url', pageUrl);
    updateProperty('twitter:url', pageUrl);

    // Update canonical URL
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Handle noindex
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.remove();
      }
    }

    // Add hreflang tags for bilingual support
    // Remove existing hreflang tags
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflangs.forEach(tag => tag.remove());

    // Add hreflang tags for both languages
    const baseUrl = canonical || window.location.origin + window.location.pathname;
    const languages = [
      { code: 'en', url: baseUrl },
      { code: 'zh-HK', url: baseUrl },
      { code: 'x-default', url: baseUrl } // Default language
    ];

    languages.forEach(({ code, url }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = code;
      link.href = url;
      document.head.appendChild(link);
    });

    // Update HTML lang attribute
    document.documentElement.lang = language === 'zh-HK' ? 'zh-HK' : 'en';
  }, [title, description, keywords, ogImage, canonical, noindex, language, location]); // Re-run on location change

  return null;
}
