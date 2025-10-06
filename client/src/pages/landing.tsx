import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Phone, MapPin, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import petSOSLogo from "@assets/PetSOS Logo_1759741755560.png";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleEmergency = () => {
    setLocation("/emergency");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Language Switcher - Top Right */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={petSOSLogo} 
              alt="PetSOS" 
              className="h-24 w-auto"
              data-testid="img-logo"
            />
          </div>
          <h1 className="sr-only" data-testid="text-hero-title">
            {t('app.title', 'PetSOS')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t('landing.subtitle', 'Emergency veterinary care coordination platform for Hong Kong pet owners')}
          </p>
          
          {/* Emergency CTA - Most Prominent */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button
              onClick={handleEmergency}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-7 text-xl font-bold shadow-lg"
              data-testid="button-emergency-now"
            >
              <AlertCircle className="mr-2 h-6 w-6" />
              {t('landing.emergency_button', 'Emergency Help Now')}
            </Button>
            <Button
              onClick={handleLogin}
              size="lg"
              variant="outline"
              className="px-8 py-7 text-lg border-2"
              data-testid="button-login"
            >
              {t('landing.login_button', 'Log In / Sign Up')}
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('landing.quick_access', 'Emergency access available without login • Get help in under 60 seconds')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-3 lg:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.feature1.title', 'Fast Emergency Flow')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('landing.feature1.desc', '3-step emergency request in under 30 seconds. Every second counts when your pet needs help.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <MapPin className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.feature2.title', '24-Hour Clinics')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('landing.feature2.desc', 'Find nearest 24-hour veterinary clinics across Hong Kong Island, Kowloon, and New Territories.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Phone className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.feature3.title', 'One-Tap Broadcast')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('landing.feature3.desc', 'Alert multiple clinics instantly via WhatsApp with one tap. Get help faster.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <p className="text-sm text-amber-900 dark:text-amber-200 text-center">
              ⚠️ {t('landing.disclaimer', 'PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
