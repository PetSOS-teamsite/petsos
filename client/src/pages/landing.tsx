import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Phone, MapPin, AlertCircle, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/footer";
import { SEO } from "@/components/SEO";
import { StructuredData, createOrganizationSchema, createWebSiteSchema } from "@/components/StructuredData";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  const handleLogin = () => {
    setLocation("/login");
  };

  const handleEmergency = () => {
    setLocation("/emergency");
  };

  const handleFindHospitals = () => {
    setLocation("/clinics");
  };

  return (
    <>
      <SEO
        title={language === 'zh-HK' 
          ? "PetSOS - 香港24小時寵物緊急求助 | 即時通知動物醫院" 
          : "PetSOS - Emergency 24-Hour Veterinary Care in Hong Kong | Pet Emergency Help"
        }
        description={language === 'zh-HK'
          ? "一按即時通知香港24小時動物醫院。GPS定位最近診所，WhatsApp廣播求助，3步驟完成緊急求助。港島、九龍、新界全覆蓋。毛孩緊急情況時最快獲得專業協助。"
          : "Alert 24-hour animal hospitals in Hong Kong with one tap. GPS-powered emergency pet care with instant WhatsApp broadcast to nearby clinics. Fast help when your pet needs it most. Hong Kong Island, Kowloon, New Territories coverage."
        }
        keywords={language === 'zh-HK'
          ? "寵物緊急, 24小時獸醫, 動物醫院香港, 緊急求助, 毛孩, GPS尋找診所, WhatsApp廣播, 香港寵物, 緊急護理"
          : "pet emergency Hong Kong, 24-hour vet, emergency veterinary care, animal hospital, pet SOS, GPS clinic finder, WhatsApp alert, emergency pet help"
        }
        canonical="https://petsos.site/"
        language={language}
      />
      <StructuredData data={createOrganizationSchema(language)} />
      <StructuredData data={createWebSiteSchema(language)} />
      <div className="min-h-screen bg-[#EF4444] dark:bg-[#DC2626]">
        {/* Top Navigation Bar - Language Switcher (Right) */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex justify-end items-center">
          <LanguageSwitcher />
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-7xl md:text-8xl font-bold text-white" data-testid="text-hero-title">
              PetSOS
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-medium">
            {t('landing.subtitle', 'Alert 24-hour animal hospitals with one tap')}
          </p>
          
          {/* Emergency CTA - Most Prominent */}
          <div className="flex flex-col gap-4 items-center mb-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
              <Button
                onClick={handleEmergency}
                size="lg"
                className="bg-white hover:bg-gray-100 text-red-600 px-10 py-7 text-xl font-bold shadow-lg"
                data-testid="button-emergency-now"
              >
                <AlertCircle className="mr-2 h-6 w-6" />
                {t('landing.emergency_button', 'Emergency Help Now')}
              </Button>
              <Button
                onClick={handleFindHospitals}
                size="lg"
                className="px-8 py-7 text-lg border-2 border-white bg-transparent text-white hover:bg-white hover:text-red-600 font-semibold transition-all"
                data-testid="button-find-hospitals"
              >
                <MapPin className="mr-2 h-5 w-5" />
                {t('landing.find_hospitals_button', 'Find Nearby 24-Hour Hospitals')}
              </Button>
            </div>
            <Button
              onClick={handleLogin}
              size="lg"
              className="px-8 py-6 text-base border-2 border-white bg-transparent text-white hover:bg-white hover:text-red-600 font-medium transition-all"
              data-testid="button-login-corner"
            >
              <UserCircle className="mr-2 h-5 w-5" />
              {t('landing.login_profile_button', 'Login / Create Pet Profile')}
            </Button>
          </div>
          <p className="text-sm text-white/80">
            {t('landing.quick_access', 'Emergency access available without login • Get help in under 60 seconds')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <Card className="border-2 bg-white/95 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Clock className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.feature1.title', 'Fast Emergency Flow')}</h3>
                <p className="text-gray-600">
                  {t('landing.feature1.desc', '3-step emergency request in under 30 seconds. Every second counts when your pet needs help.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 bg-white/95 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <MapPin className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.feature2.title', '24-Hour Clinics')}</h3>
                <p className="text-gray-600">
                  {t('landing.feature2.desc', 'Find nearest 24-hour veterinary clinics across Hong Kong Island, Kowloon, and New Territories.')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 bg-white/95 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Phone className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('landing.feature3.title', 'One-Tap Broadcast')}</h3>
                <p className="text-gray-600">
                  {t('landing.feature3.desc', 'Alert multiple clinics instantly via WhatsApp with one tap. Get help faster.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white/95 backdrop-blur border-2 border-white rounded-lg p-6">
            <p className="text-sm text-gray-800 text-center">
              ⚠️ {t('landing.disclaimer', 'PetSOS provides emergency guidance only and is not medical advice. If in doubt, contact a vet immediately.')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
      </div>
    </>
  );
}
