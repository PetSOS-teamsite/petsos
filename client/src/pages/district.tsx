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
    descriptionEn: "Find 24-hour emergency veterinary clinics in Central, Hong Kong. Immediate pet care services near Central MTR, IFC, and surrounding areas.",
    descriptionZh: "尋找中環24小時緊急獸醫診所。提供中環港鐵站、國際金融中心及附近地區即時寵物護理服務。",
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
    descriptionEn: "24-hour emergency veterinary services in Tsim Sha Tsui, Kowloon. Find nearby animal hospitals near TST MTR, Harbour City, and Nathan Road.",
    descriptionZh: "尖沙咀九龍24小時緊急獸醫服務。尋找尖沙咀港鐵站、海港城及彌敦道附近動物醫院。",
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
    descriptionEn: "Emergency vet clinics open 24 hours in Mong Kok. Immediate pet emergency care near Mong Kok MTR, Ladies' Market, and Argyle Street.",
    descriptionZh: "旺角24小時緊急獸醫診所。提供旺角港鐵站、女人街及亞皆老街附近即時寵物緊急護理。",
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
    descriptionEn: "Find 24-hour pet emergency services in Causeway Bay. Veterinary clinics near Times Square, Causeway Bay MTR, and Victoria Park.",
    descriptionZh: "尋找銅鑼灣24小時寵物緊急服務。時代廣場、銅鑼灣港鐵站及維多利亞公園附近獸醫診所。",
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
    descriptionEn: "24-hour emergency veterinary care in Wan Chai, Hong Kong Island. Animal hospitals near Wan Chai MTR, Convention Centre, and Happy Valley.",
    descriptionZh: "香港島灣仔24小時緊急獸醫護理。灣仔港鐵站、會議展覽中心及跑馬地附近動物醫院。",
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
    descriptionEn: "Emergency vet services in Sha Tin, New Territories. 24-hour animal hospitals near Sha Tin MTR, New Town Plaza, and Ma On Shan.",
    descriptionZh: "新界沙田緊急獸醫服務。沙田港鐵站、新城市廣場及馬鞍山附近24小時動物醫院。",
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
                  {language === 'zh-HK' ? '寵物緊急情況？' : 'Pet Emergency?'}
                </h2>
                <p className="text-red-800 dark:text-red-200 mb-4">
                  {language === 'zh-HK' 
                    ? `即時向${district.nameZh}附近所有24小時診所發送緊急通知`
                    : `Send emergency alerts to all 24-hour clinics near ${district.nameEn} instantly`
                  }
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
                <p className="text-muted-foreground">
                  {language === 'zh-HK' ? '此地區暫無診所資料' : 'No clinics found in this area'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Local Information */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              {language === 'zh-HK' ? '關於本地區' : 'About This Area'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <p>
                {language === 'zh-HK' 
                  ? `PetSOS為${district.nameZh}地區提供24小時緊急獸醫轉介服務。透過一鍵式緊急通知系統，您可以即時聯繫附近所有支援緊急服務的動物醫院。`
                  : `PetSOS provides 24-hour emergency veterinary referral services for the ${district.nameEn} area. Through our one-tap emergency notification system, you can instantly contact all nearby animal hospitals that support emergency services.`
                }
              </p>
              <p>
                {language === 'zh-HK'
                  ? '我們的平台支援GPS定位、WhatsApp即時通訊，以及直接致電功能，確保您的寵物在緊急情況下得到最快速的醫療救援。'
                  : 'Our platform supports GPS location, WhatsApp instant messaging, and direct calling features to ensure your pet receives the fastest medical assistance during emergencies.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
