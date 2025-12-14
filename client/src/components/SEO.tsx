import { useEffect, useRef } from 'react';
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
  const [location] = useLocation();
  
  const createdElementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const createdElements: HTMLElement[] = [];

    const safeRemoveElement = (el: HTMLElement | null) => {
      if (el && el.parentNode) {
        try {
          el.parentNode.removeChild(el);
        } catch (e) {
          // Ignore if already removed
        }
      }
    };

    const createOrUpdateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.name = name;
        }
        document.head.appendChild(element);
        createdElements.push(element);
      }
      element.content = content;
    };

    if (title) {
      document.title = title;
      createOrUpdateMeta('title', title);
      createOrUpdateMeta('og:title', title, true);
      createOrUpdateMeta('twitter:title', title, true);
    }

    if (description) {
      createOrUpdateMeta('description', description);
      createOrUpdateMeta('og:description', description, true);
      createOrUpdateMeta('twitter:description', description, true);
    }

    if (keywords) {
      createOrUpdateMeta('keywords', keywords);
    }

    if (ogImage) {
      createOrUpdateMeta('og:image', ogImage, true);
      createOrUpdateMeta('twitter:image', ogImage, true);
    }

    const pageUrl = canonical || window.location.href;
    createOrUpdateMeta('og:url', pageUrl, true);
    createOrUpdateMeta('twitter:url', pageUrl, true);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
        createdElements.push(link);
      }
      link.href = canonical;
    }

    // Remove only previously created hreflang elements by this component
    createdElementsRef.current.forEach(el => {
      if (el.tagName === 'LINK' && el.getAttribute('rel') === 'alternate') {
        safeRemoveElement(el);
      }
    });

    if (alternateLanguages) {
      if (alternateLanguages.en) {
        const enLink = document.createElement('link');
        enLink.rel = 'alternate';
        enLink.hreflang = 'en';
        enLink.href = alternateLanguages.en;
        enLink.setAttribute('data-seo-managed', 'true');
        document.head.appendChild(enLink);
        createdElements.push(enLink);
      }
      if (alternateLanguages['zh-HK']) {
        const zhLink = document.createElement('link');
        zhLink.rel = 'alternate';
        zhLink.hreflang = 'zh-HK';
        zhLink.href = alternateLanguages['zh-HK'];
        zhLink.setAttribute('data-seo-managed', 'true');
        document.head.appendChild(zhLink);
        createdElements.push(zhLink);
      }
      if (alternateLanguages.en) {
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = alternateLanguages.en;
        defaultLink.setAttribute('data-seo-managed', 'true');
        document.head.appendChild(defaultLink);
        createdElements.push(defaultLink);
      }
    }

    if (noindex) {
      createOrUpdateMeta('robots', 'noindex, nofollow');
    }

    document.documentElement.lang = language === 'zh-HK' ? 'zh-HK' : 'en';

    createdElementsRef.current = createdElements;

    return () => {
      // Cleanup only elements created by this component
      createdElements.forEach(el => {
        if (el.getAttribute('data-seo-managed') === 'true') {
          safeRemoveElement(el);
        }
      });
    };
  }, [title, description, keywords, ogImage, canonical, noindex, language, location, alternateLanguages]);

  return null;
}
