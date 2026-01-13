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
  alternateLanguages?: {
    en?: string;
    'zh-HK'?: string;
  };
}

export function SEO({
  title,
  description,
  keywords,
  ogImage = 'https://petsos.site/og-image.webp',
  canonical,
  noindex = false,
  language = 'en',
  alternateLanguages,
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

    // Get current page URL - strip query params for canonical (especially ?lang=)
    const getCleanCanonical = () => {
      if (canonical) return canonical;
      // Strip query params from current URL for canonical
      const url = new URL(window.location.href);
      return `${url.origin}${url.pathname}`;
    };
    const pageUrl = getCleanCanonical();

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

    // Always set canonical URL (stripped of query params)
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = pageUrl;

    // Handle hreflang tags for multilingual SEO
    const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingHreflangs.forEach(el => {
      try {
        el.remove();
      } catch (e) {
        // Silently ignore if already removed
      }
    });
    
    if (alternateLanguages) {
      if (alternateLanguages.en) {
        const enLink = document.createElement('link');
        enLink.rel = 'alternate';
        enLink.hreflang = 'en';
        enLink.href = alternateLanguages.en;
        document.head.appendChild(enLink);
      }
      if (alternateLanguages['zh-HK']) {
        const zhLink = document.createElement('link');
        zhLink.rel = 'alternate';
        zhLink.hreflang = 'zh-HK';
        zhLink.href = alternateLanguages['zh-HK'];
        document.head.appendChild(zhLink);
      }
      // Add x-default pointing to English version
      if (alternateLanguages.en) {
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = alternateLanguages.en;
        document.head.appendChild(defaultLink);
      }
    }

    // Handle noindex
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        try {
          robotsMeta.remove();
        } catch (e) {
          // Silently ignore if already removed
        }
      }
    }

    // Update HTML lang attribute to reflect current language
    document.documentElement.lang = language === 'zh-HK' ? 'zh-HK' : 'en';
  }, [title, description, keywords, ogImage, canonical, noindex, language, location, alternateLanguages]); // Re-run on location change

  return null;
}
