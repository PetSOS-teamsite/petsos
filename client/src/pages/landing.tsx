import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Phone, MapPin, AlertCircle, UserCircle, Mic, Navigation, Play, Timer } from "lucide-react";
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
      <StructuredData data={createOrganizationSchema(language)} id="schema-organization" />
      <StructuredData data={createWebSiteSchema(language)} id="schema-website" />
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
          <div className="flex flex-col gap-4 items-center mb-6 max-w-md mx-auto w-full px-4">
            {/* Primary Action - Emergency (Largest, Most Prominent) */}
            <Button
              onClick={handleEmergency}
              size="lg"
              className="w-full bg-white hover:bg-gray-100 text-red-600 py-8 text-xl font-bold shadow-xl hover:shadow-2xl transition-all rounded-2xl"
              data-testid="button-emergency-now"
            >
              <AlertCircle className="mr-3 h-7 w-7" />
              {t('landing.emergency_button', 'Emergency Help Now')}
            </Button>
            
            {/* Divider with spacing */}
            <div className="w-full h-px bg-white/20 my-2" />
            
            {/* Secondary Actions - Equal Width, Stacked */}
            <Button
              onClick={handleFindHospitals}
              size="lg"
              className="w-full py-6 text-base border-2 border-white/80 bg-white/10 text-white hover:bg-white hover:text-red-600 font-semibold transition-all rounded-xl backdrop-blur-sm"
              data-testid="button-find-hospitals"
            >
              <MapPin className="mr-2 h-5 w-5" />
              {t('landing.find_hospitals_button', 'Find Nearby 24-Hour Hospitals')}
            </Button>
            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full py-6 text-base border-2 border-white/80 bg-white/10 text-white hover:bg-white hover:text-red-600 font-semibold transition-all rounded-xl backdrop-blur-sm"
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

        {/* Video Showcase Section */}
        <div className="mt-20 max-w-6xl mx-auto" data-testid="section-video-showcase">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'zh-HK' ? '功能展示' : 'Feature Showcase'}
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {language === 'zh-HK' 
                ? '親身體驗 PetSOS 如何在緊急情況下為您爭取每一秒'
                : 'See how PetSOS helps you save every second during emergencies'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature 1: 30 seconds emergency */}
            <Card className="bg-white/95 backdrop-blur border-2 overflow-hidden group hover:shadow-2xl transition-all duration-300" data-testid="card-showcase-30sec">
              <div className="aspect-video bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Timer className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-white font-bold text-5xl mb-1">30s</div>
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mt-2 group-hover:bg-white/50 transition-colors cursor-pointer">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                  <div className="h-full bg-white w-1/3 animate-pulse" />
                </div>
              </div>
              <CardContent className="pt-5 pb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  {language === 'zh-HK' ? '30秒內完成求助' : 'Complete Help Request in 30 Seconds'}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {language === 'zh-HK' 
                    ? '簡化的3步驟流程，讓您在緊急情況下快速發送求助。選擇寵物、確認位置、一鍵廣播，比打電話更快獲得回應。'
                    : 'Streamlined 3-step process for rapid emergency requests. Select pet, confirm location, one-tap broadcast - faster than a phone call.'}
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: AI Voice-to-Text */}
            <Card className="bg-white/95 backdrop-blur border-2 overflow-hidden group hover:shadow-2xl transition-all duration-300" data-testid="card-showcase-ai-voice">
              <div className="aspect-video bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Mic className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-white rounded-full animate-pulse"
                        style={{ 
                          height: `${12 + Math.random() * 20}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-white/90 text-sm font-medium">AI Transcribing...</div>
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mt-2 group-hover:bg-white/50 transition-colors cursor-pointer">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>
              </div>
              <CardContent className="pt-5 pb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  {language === 'zh-HK' ? 'AI 語音轉文字與症狀摘要' : 'AI Voice-to-Text & Symptom Summary'}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {language === 'zh-HK' 
                    ? '緊張時無法打字？只需用語音描述症狀，AI 自動將語音轉換為文字並生成專業症狀摘要，讓診所快速了解情況。'
                    : 'Too stressed to type? Just describe symptoms by voice. AI automatically transcribes and generates professional symptom summaries for clinics.'}
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: GPS Auto Location */}
            <Card className="bg-white/95 backdrop-blur border-2 overflow-hidden group hover:shadow-2xl transition-all duration-300" data-testid="card-showcase-gps">
              <div className="aspect-video bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" />
                  <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform relative">
                    <Navigation className="h-10 w-10 text-white" />
                    <div className="absolute inset-0 border-4 border-white/50 rounded-full animate-ping" />
                  </div>
                  <div className="text-white font-medium text-sm">
                    {language === 'zh-HK' ? '位置已偵測' : 'Location Detected'}
                  </div>
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mt-2 group-hover:bg-white/50 transition-colors cursor-pointer">
                    <Play className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>
              </div>
              <CardContent className="pt-5 pb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                  {language === 'zh-HK' ? 'GPS 自動定位' : 'GPS Auto Location'}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {language === 'zh-HK' 
                    ? '自動偵測您的位置，找出距離最近的24小時動物醫院。無需手動輸入地址，一鍵獲取最快到達的診所。'
                    : 'Automatically detects your location to find the nearest 24-hour veterinary clinics. No manual address entry - get the fastest routes instantly.'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={handleEmergency}
              size="lg"
              className="bg-white hover:bg-gray-100 text-red-600 px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all rounded-xl"
              data-testid="button-try-now"
            >
              {language === 'zh-HK' ? '立即體驗' : 'Try It Now'}
            </Button>
          </div>
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
