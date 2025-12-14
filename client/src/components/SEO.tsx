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
  const [location] = useLocation();

  useEffect(() => {
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
      }
      link.href = canonical;
    }

    // Update hreflang tags by updating existing or creating new (no removal)
    if (alternateLanguages) {
      if (alternateLanguages.en) {
        let enLink = document.querySelector('link[hreflang="en"]') as HTMLLinkElement;
        if (!enLink) {
          enLink = document.createElement('link');
          enLink.rel = 'alternate';
          enLink.hreflang = 'en';
          document.head.appendChild(enLink);
        }
        enLink.href = alternateLanguages.en;
      }
      if (alternateLanguages['zh-HK']) {
        let zhLink = document.querySelector('link[hreflang="zh-HK"]') as HTMLLinkElement;
        if (!zhLink) {
          zhLink = document.createElement('link');
          zhLink.rel = 'alternate';
          zhLink.hreflang = 'zh-HK';
          document.head.appendChild(zhLink);
        }
        zhLink.href = alternateLanguages['zh-HK'];
      }
      if (alternateLanguages.en) {
        let defaultLink = document.querySelector('link[hreflang="x-default"]') as HTMLLinkElement;
        if (!defaultLink) {
          defaultLink = document.createElement('link');
          defaultLink.rel = 'alternate';
          defaultLink.hreflang = 'x-default';
          document.head.appendChild(defaultLink);
        }
        defaultLink.href = alternateLanguages.en;
      }
    }

    if (noindex) {
      createOrUpdateMeta('robots', 'noindex, nofollow');
    }

    document.documentElement.lang = language === 'zh-HK' ? 'zh-HK' : 'en';

    // No cleanup - elements persist in head
  }, [title, description, keywords, ogImage, canonical, noindex, language, location, alternateLanguages]);

  return null;
}
