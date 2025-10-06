import { Link } from "wouter";
import { AlertCircle, MapPin, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import petSOSLogo from "@assets/PetSOS Logo_1759741755560.png";

export default function HomePage() {
  const { t } = useTranslation();

  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <img 
              src={petSOSLogo} 
              alt="PetSOS" 
              className="h-10 w-auto cursor-pointer"
              data-testid="img-logo-header"
            />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/profile">
              <Button variant="ghost" size="icon" data-testid="button-profile">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        {/* Emergency Button - Large and Accessible */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <Link href="/emergency">
            <Button
              size="lg"
              className="w-full h-32 text-3xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
              data-testid="button-emergency"
            >
              <AlertCircle className="mr-4 h-12 w-12" />
              {t('home.emergency.button', 'Emergency Care Now')}
            </Button>
          </Link>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('home.emergency.subtitle', 'Get help from 24-hour veterinary clinics immediately')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/clinics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-clinics">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {t('home.find_clinics', 'Find Clinics')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('home.find_clinics.desc', 'Browse all veterinary clinics')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pets">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-pets">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {t('home.my_pets', 'My Pets')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('home.my_pets.desc', 'Manage your pet profiles')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {t('home.how_it_works', 'How It Works')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                {t('home.step1.title', 'Describe Emergency')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.step1.desc', "Tell us what's happening with your pet")}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                {t('home.step2.title', 'Find Nearby Clinics')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.step2.desc', "We'll show 24-hour clinics near you")}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                {t('home.step3.title', 'Contact Instantly')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('home.step3.desc', 'Call or message clinics instantly')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">{t('app.disclaimer', '⚠️ PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.')}</p>
        </div>
      </footer>
    </div>
  );
}
