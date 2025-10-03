import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translation } from '@shared/schema';

export function useTranslation() {
  const { language } = useLanguage();

  const { data: translations = [] } = useQuery<Translation[]>({
    queryKey: ['/api/translations', language],
  });

  const t = (key: string, fallback?: string): string => {
    const translation = translations.find(t => t.key === key);
    return translation?.value || fallback || key;
  };

  return { t, language };
}
