import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-red-600 dark:text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('privacy.title', 'Privacy Policy')}
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('privacy.last_updated', 'Last Updated')}: October 2025
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy.intro', 'PetSOS Limited (\'we\', \'us\', or \'PetSOS\') is committed to protecting your privacy.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.controller_title', 'Data Controller')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy.controller_desc', 'PetSOS Limited acts as the data controller for all personal information collected through this platform.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.data_collection_title', 'Information We Collect')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.data_collection_desc', 'We collect contact information, pet information, and location data.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.lawful_basis_title', 'Lawful Basis for Processing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.lawful_basis_desc', 'We process your data based on consent, legitimate interests, and legal obligations.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.data_usage_title', 'How We Use Your Information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.data_usage_desc', 'Your information is used to connect you with veterinary clinics during emergencies.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.data_sharing_title', 'Data Recipients')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.data_sharing_desc', 'We share your data with veterinary clinics and service providers.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.data_retention_title', 'Data Retention')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.data_retention_desc', 'We retain emergency requests for 12 months, pet profiles until deletion requested.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.international_title', 'International Data Transfers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('privacy.international_desc', 'Your data may be transferred to service providers outside Hong Kong.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.security_title', 'Security Measures')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.security_desc', 'We implement encryption, access controls, and security audits.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.your_rights_title', 'Your Rights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.your_rights_desc', 'You have the right to access, export, correct, or delete your personal data.')}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.complaints_title', 'Complaints')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.complaints_desc', 'Contact us at privacy@petsos.hk or the Privacy Commissioner.')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {t('privacy.contact_title', 'Contact Us')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {t('privacy.contact_desc', 'Email: privacy@petsos.hk | Data Protection Officer: dpo@petsos.hk')}
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
