import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageCircle, Navigation, Clock, MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { analytics } from "@/lib/analytics";
import type { Clinic } from "@shared/schema";

interface District {
  slug: string;
  nameEn: string;
  nameZh: string;
  regionCode: string;
  latitude: number;
  longitude: number;
  descriptionEn: string;
  descriptionZh: string;
  keywordsEn: string;
  keywordsZh: string;
}

const HONG_KONG_DISTRICTS: District[] = [
  {
    slug: "central",
    nameEn: "Central",
    nameZh: "中環",
    regionCode: "HKI",
    latitude: 22.2819,
    longitude: 114.1580,
    descriptionEn: "When your dog, cat, or beloved pet needs emergency care in Central, every second counts. Find nearby 24-hour veterinary clinics ready to help—whether it's late at night, on a holiday, or during a weekend crisis.",
    descriptionZh: "當您的狗狗、貓咪或心愛寵物在中環需要緊急護理時，分秒必爭。尋找附近隨時候命的24小時獸醫診所—無論深夜、假期或週末緊急情況。",
    keywordsEn: "Central vet, 24-hour animal hospital Central, emergency pet care Central Hong Kong, veterinary clinic Central MTR",
    keywordsZh: "中環獸醫, 中環24小時動物醫院, 中環寵物緊急護理, 中環港鐵獸醫診所"
  },
  {
    slug: "tsim-sha-tsui",
    nameEn: "Tsim Sha Tsui",
    nameZh: "尖沙咀",
    regionCode: "KLN",
    latitude: 22.2976,
    longitude: 114.1722,
    descriptionEn: "Your pet's emergency can't wait. Connect instantly with 24-hour veterinary clinics in Tsim Sha Tsui ready to provide urgent care. Help is available right now, any time of day or night.",
    descriptionZh: "您寵物的緊急情況不能等待。即時聯繫尖沙咀24小時獸醫診所，隨時提供緊急護理。無論日夜，即刻獲得幫助。",
    keywordsEn: "Tsim Sha Tsui vet, TST animal hospital, 24-hour pet clinic Kowloon, emergency vet Nathan Road",
    keywordsZh: "尖沙咀獸醫, 尖沙咀動物醫院, 九龍24小時寵物診所, 彌敦道緊急獸醫"
  },
  {
    slug: "mong-kok",
    nameEn: "Mong Kok",
    nameZh: "旺角",
    regionCode: "KLN",
    latitude: 22.3193,
    longitude: 114.1694,
    descriptionEn: "Is your pet sick or injured in Mong Kok? Get immediate help from 24-hour emergency vets near you. One tap connects you to all available clinics—no searching, no delays.",
    descriptionZh: "您的寵物在旺角生病或受傷？立即獲得附近24小時緊急獸醫的幫助。一按即可聯繫所有可用診所—無需搜尋，無需延誤。",
    keywordsEn: "Mong Kok vet, 24-hour veterinary Mong Kok, pet emergency Argyle Street, animal hospital Ladies Market",
    keywordsZh: "旺角獸醫, 旺角24小時獸醫, 亞皆老街寵物緊急, 女人街動物醫院"
  },
  {
    slug: "causeway-bay",
    nameEn: "Causeway Bay",
    nameZh: "銅鑼灣",
    regionCode: "HKI",
    latitude: 22.2799,
    longitude: 114.1853,
    descriptionEn: "When your pet needs emergency care in Causeway Bay, don't panic—help is closer than you think. Alert all 24-hour vets instantly and get your pet the urgent care they need.",
    descriptionZh: "當您的寵物在銅鑼灣需要緊急護理時，不要驚慌—幫助就在附近。即時通知所有24小時獸醫，讓您的寵物獲得所需的緊急護理。",
    keywordsEn: "Causeway Bay vet, emergency animal hospital Causeway Bay, 24-hour pet clinic Times Square, veterinary Victoria Park",
    keywordsZh: "銅鑼灣獸醫, 銅鑼灣緊急動物醫院, 時代廣場24小時寵物診所, 維多利亞公園獸醫"
  },
  {
    slug: "wan-chai",
    nameEn: "Wan Chai",
    nameZh: "灣仔",
    regionCode: "HKI",
    latitude: 22.2769,
    longitude: 114.1722,
    descriptionEn: "Facing a pet emergency in Wan Chai? You're not alone. Connect with experienced 24-hour emergency vets who understand your pet needs help now, not later.",
    descriptionZh: "在灣仔面對寵物緊急情況？您並不孤單。聯繫經驗豐富的24小時緊急獸醫，他們明白您的寵物現在就需要幫助。",
    keywordsEn: "Wan Chai vet, 24-hour animal hospital Wan Chai, emergency pet care Happy Valley, veterinary clinic Convention Centre",
    keywordsZh: "灣仔獸醫, 灣仔24小時動物醫院, 跑馬地緊急寵物護理, 會展獸醫診所"
  },
  {
    slug: "sha-tin",
    nameEn: "Sha Tin",
    nameZh: "沙田",
    regionCode: "NTI",
    latitude: 22.3817,
    longitude: 114.1886,
    descriptionEn: "Pet emergency in Sha Tin or New Territories? Fast access to 24-hour veterinary care can save your pet's life. Get connected to emergency vets immediately.",
    descriptionZh: "沙田或新界寵物緊急情況？快速獲得24小時獸醫護理可以拯救您寵物的生命。立即聯繫緊急獸醫。",
    keywordsEn: "Sha Tin vet, New Territories animal hospital, 24-hour pet clinic Sha Tin, emergency vet Ma On Shan",
    keywordsZh: "沙田獸醫, 新界動物醫院, 沙田24小時寵物診所, 馬鞍山緊急獸醫"
  }
];

export default function DistrictPage() {
  const params = useParams();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  
  const district = HONG_KONG_DISTRICTS.find(d => d.slug === params.district);

  const { data: regions } = useQuery<Array<{id: string; code: string}>>({
    queryKey: ['/api/regions'],
  });

  const { data: clinics, isLoading } = useQuery<Clinic[]>({
    queryKey: ['/api/clinics'],
    enabled: !!district,
  });

  // Track district page view
  useEffect(() => {
    if (district) {
      analytics.trackDistrictPageView({
        district: district.slug,
        region: district.regionCode,
        language,
      });
    }
  }, [district, language]);

  if (!district) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">District Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {language === 'zh-HK' ? '找不到該地區' : 'District not found'}
            </p>
            <Button onClick={() => navigate('/clinics')} className="bg-red-600 hover:bg-red-700">
              {language === 'zh-HK' ? '瀏覽所有診所' : 'Browse All Clinics'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const regionId = regions?.find(r => r.code === district.regionCode)?.id;
  const districtClinics = clinics?.filter(clinic => 
    clinic.regionId === regionId
  ).slice(0, 10) || [];

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`, "_blank");
  };

  const handleMaps = (latitude: number, longitude: number, name: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodeURIComponent(name)}`;
    window.open(mapsUrl, "_blank");
  };

  const createLocalBusinessSchema = () => ({
    "@context": "https://schema.org",
    "@type": "VeterinaryCare",
    "name": `PetSOS ${language === 'zh-HK' ? district.nameZh : district.nameEn}`,
    "description": language === 'zh-HK' ? district.descriptionZh : district.descriptionEn,
    "areaServed": {
      "@type": "Place",
      "name": language === 'zh-HK' ? district.nameZh : district.nameEn,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": district.latitude,
        "longitude": district.longitude
      },
      "address": {
        "@type": "PostalAddress",
        "addressRegion": language === 'zh-HK' ? district.nameZh : district.nameEn,
        "addressCountry": "HK"
      }
    },
    "availableService": {
      "@type": "MedicalProcedure",
      "name": language === 'zh-HK' ? "24小時緊急獸醫服務" : "24-Hour Emergency Veterinary Services"
    }
  });

  const createBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === 'zh-HK' ? "主頁" : "Home",
        "item": "https://petsos.site/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": language === 'zh-HK' ? "診所目錄" : "Clinics",
        "item": "https://petsos.site/clinics"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": language === 'zh-HK' ? district.nameZh : district.nameEn,
        "item": `https://petsos.site/district/${district.slug}`
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? `${district.nameZh}24小時獸醫 | PetSOS緊急寵物護理`
          : `${district.nameEn} 24-Hour Vet | PetSOS Emergency Pet Care`
        }
        description={language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
        keywords={language === 'zh-HK' ? district.keywordsZh : district.keywordsEn}
        canonical={`https://petsos.site/district/${district.slug}`}
        language={language}
      />
      <StructuredData data={createLocalBusinessSchema()} id="schema-local-business" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clinics')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '返回診所目錄' : 'Back to Clinics'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-district-title">
                {language === 'zh-HK' ? district.nameZh : district.nameEn}
              </h1>
              <p className="text-muted-foreground" data-testid="text-district-description">
                {language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Emergency CTA */}
        <Card className="mb-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                  {language === 'zh-HK' ? '您的寵物正處於危險中？' : 'Is Your Pet in Distress?'}
                </h2>
                <p className="text-red-800 dark:text-red-200 mb-2">
                  {language === 'zh-HK' 
                    ? `我們明白這有多可怕。即時通知${district.nameZh}所有24小時緊急獸醫。他們會在數秒內收到訊息—讓您的寵物更快獲得幫助。`
                    : `We know how scary this is. Instantly alert all 24-hour emergency vets in ${district.nameEn}. They'll get your message in seconds—so your pet gets help faster.`
                  }
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4 font-medium">
                  {language === 'zh-HK' ? '大多數診所在5-15分鐘內回應' : 'Most vets respond within 5-15 minutes'}
                </p>
                <Button
                  onClick={() => {
                    analytics.event('district_emergency_cta_click', {
                      event_category: 'CTA',
                      district: district.slug,
                      region: district.regionCode,
                    });
                    navigate('/emergency');
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-emergency-cta"
                >
                  {language === 'zh-HK' ? '發送緊急求助' : 'Send Emergency Request'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinics List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {language === 'zh-HK' ? '附近診所' : 'Nearby Clinics'}
            </h2>
            <Link href="/clinics">
              <Button variant="outline" size="sm" data-testid="button-view-all">
                {language === 'zh-HK' ? '查看所有診所' : 'View All Clinics'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : districtClinics.length > 0 ? (
            <div className="space-y-4">
              {districtClinics.map(clinic => (
                <Card 
                  key={clinic.id} 
                  className="border-l-4 border-l-red-600 hover:shadow-md transition-shadow"
                  data-testid={`card-clinic-${clinic.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-foreground" data-testid={`text-clinic-name-${clinic.id}`}>
                            {clinic.name}
                          </h3>
                          {clinic.is24Hour && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              24hrs
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-4 w-4" />
                          {clinic.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(clinic.phone);
                        }}
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid={`button-call-${clinic.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '致電' : 'Call'}
                      </Button>
                      {clinic.whatsapp && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(clinic.whatsapp!);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-whatsapp-${clinic.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {clinic.latitude && clinic.longitude && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMaps(parseFloat(clinic.latitude!), parseFloat(clinic.longitude!), clinic.name);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-maps-${clinic.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          {language === 'zh-HK' ? '導航' : 'Maps'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  {language === 'zh-HK' ? '我們正在更新此地區的診所列表' : "We're updating our clinic list for this area"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'zh-HK' 
                    ? '同時，請查看附近地區或致電我們遍布香港的合作診所' 
                    : 'Meanwhile, check nearby districts or call our partner clinics across Hong Kong'
                  }
                </p>
                <Link href="/clinics">
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                    {language === 'zh-HK' ? '瀏覽所有診所' : 'View All Clinics'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Local Information */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {language === 'zh-HK' ? `${district.nameZh}緊急獸醫護理` : `Emergency Vet Care in ${district.nameEn}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
              <p>
                {language === 'zh-HK' 
                  ? `當您的寵物生病或受傷時，尋找幫助不應增加您的壓力。PetSOS一鍵即可連接您與${district.nameZh}所有24小時緊急獸醫。`
                  : `When your pet is sick or injured, finding help shouldn't add to your stress. PetSOS instantly connects you with every 24-hour emergency vet in ${district.nameEn}—with one tap.`
                }
              </p>
              <div className="bg-white dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {language === 'zh-HK' ? '接下來會發生什麼？' : 'What happens next?'}
                </h4>
                <ul className="space-y-2 text-blue-900 dark:text-blue-100">
                  <li className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    {language === 'zh-HK' 
                      ? '所有附近診所透過WhatsApp收到您寵物的詳情'
                      : "All nearby clinics receive your pet's details via WhatsApp"
                    }
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    {language === 'zh-HK' 
                      ? '您會看到他們的位置並獲得即時導航'
                      : "You'll see their locations and get instant directions"
                    }
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    {language === 'zh-HK' 
                      ? '可直接致電他們。大多數診所在5-15分鐘內回應'
                      : 'You can call them directly. Most clinics respond within 5-15 minutes'
                    }
                  </li>
                </ul>
              </div>
              <p className="font-medium text-blue-900 dark:text-blue-100 text-center pt-2">
                {language === 'zh-HK' 
                  ? '您並不孤單。幫助比您想像的更近。'
                  : "You're not alone in this. Help is closer than you think."
                }
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                {language === 'zh-HK'
                  ? '* PetSOS是一個連接平台，不提供獸醫服務。所有醫療服務由獨立註冊獸醫診所提供。'
                  : '* PetSOS is a connection platform and does not provide veterinary services. All medical care is provided by independent licensed veterinary clinics.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
