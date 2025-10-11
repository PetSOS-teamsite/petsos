import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-white dark:bg-gray-900" data-testid="footer">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('footer.rights', '© 2025 PetSOS. All rights reserved.')}
          </div>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
              data-testid="link-privacy"
            >
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
              data-testid="link-terms"
            >
              {t('footer.terms', 'Terms of Service')}
            </Link>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400 dark:text-gray-600">Anny Fantasy Limited</p>
        </div>
      </div>
    </footer>
  );
}
