import { Button } from '@/components/ui/button';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg" data-testid="language-switcher">
      <Button
        variant={language === 'zh-HK' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('zh-HK')}
        className={`
          px-3 py-1 text-sm font-medium transition-all
          ${language === 'zh-HK' 
            ? 'bg-red-600 text-white hover:bg-red-700' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        data-testid="button-language-zh"
      >
        中文
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className={`
          px-3 py-1 text-sm font-medium transition-all
          ${language === 'en' 
            ? 'bg-red-600 text-white hover:bg-red-700' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        data-testid="button-language-en"
      >
        English
      </Button>
    </div>
  );
}
