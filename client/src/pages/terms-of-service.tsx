import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ScrollText className="h-8 w-8 text-red-600 dark:text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('terms.title', 'Terms of Service')}
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('terms.last_updated', 'Last Updated')}: October 2025
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.intro', 'These Terms of Service (\'Terms\') govern your use of PetSOS.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.acceptance_title', 'Acceptance of Terms')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.acceptance_desc', 'By creating an account or using PetSOS services, you acknowledge that you have read, understood, and agree to these Terms and our Privacy Policy.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.service_description_title', 'Service Description')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.service_description_desc', 'PetSOS is an emergency coordination platform that connects pet owners with veterinary clinics.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.user_responsibilities_title', 'User Responsibilities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('terms.user_responsibilities_desc', 'You are responsible for providing accurate information during emergencies.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.disclaimer_title', 'Medical Disclaimer')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.disclaimer_desc', 'PetSOS does not provide medical advice. We do not guarantee clinic availability or response times.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.limitation_title', 'Limitation of Liability')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('terms.limitation_desc', 'To the maximum extent permitted by law, PetSOS is not liable for any damages resulting from use of our platform.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.governing_law_title', 'Governing Law & Jurisdiction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.governing_law_desc', 'These Terms are governed by Hong Kong law. Any disputes shall be resolved exclusively in Hong Kong courts.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.eu_rights_title', 'EU Consumer Rights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.eu_rights_desc', 'For residents of the European Union, nothing in these Terms affects your statutory consumer rights.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.privacy_policy_title', 'Privacy Policy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.privacy_policy_desc', 'Your use of PetSOS is also governed by our Privacy Policy.')}
              {" "}
              <Link href="/privacy" className="text-red-600 dark:text-red-500 hover:underline">
                {t('footer.privacy', 'Privacy Policy')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.termination_title', 'Service Modification & Termination')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('terms.termination_desc', 'We reserve the right to modify or discontinue services at any time.')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {t('terms.changes_title', 'Changes to Terms')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('terms.changes_desc', 'We may update these Terms periodically. Continued use after changes constitutes acceptance.')}
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-red-600 dark:text-red-500 hover:underline">
            ← {t('common.back_home', 'Back to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
