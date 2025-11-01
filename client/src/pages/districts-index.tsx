import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

interface District {
  slug: string;
  nameEn: string;
  nameZh: string;
  regionCode: string;
  descriptionEn: string;
  descriptionZh: string;
}

const HONG_KONG_DISTRICTS: District[] = [
  {
    slug: "central",
    nameEn: "Central",
    nameZh: "中環",
    regionCode: "HKI",
    descriptionEn: "24-hour emergency vet services in Central, Hong Kong Island",
    descriptionZh: "香港島中環24小時緊急獸醫服務"
  },
  {
    slug: "causeway-bay",
    nameEn: "Causeway Bay",
    nameZh: "銅鑼灣",
    regionCode: "HKI",
    descriptionEn: "Emergency veterinary clinics in Causeway Bay",
    descriptionZh: "銅鑼灣緊急獸醫診所"
  },
  {
    slug: "wan-chai",
    nameEn: "Wan Chai",
    nameZh: "灣仔",
    regionCode: "HKI",
    descriptionEn: "24-hour animal hospitals in Wan Chai",
    descriptionZh: "灣仔24小時動物醫院"
  },
  {
    slug: "tsim-sha-tsui",
    nameEn: "Tsim Sha Tsui",
    nameZh: "尖沙咀",
    regionCode: "KLN",
    descriptionEn: "Emergency vet clinics in Tsim Sha Tsui, Kowloon",
    descriptionZh: "九龍尖沙咀緊急獸醫診所"
  },
  {
    slug: "mong-kok",
    nameEn: "Mong Kok",
    nameZh: "旺角",
    regionCode: "KLN",
    descriptionEn: "24-hour pet emergency services in Mong Kok",
    descriptionZh: "旺角24小時寵物緊急服務"
  },
  {
    slug: "sha-tin",
    nameEn: "Sha Tin",
    nameZh: "沙田",
    regionCode: "NTI",
    descriptionEn: "Emergency veterinary care in Sha Tin, New Territories",
    descriptionZh: "新界沙田緊急獸醫護理"
  }
];

export default function DistrictsIndexPage() {
  const { language } = useLanguage();

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
        "name": language === 'zh-HK' ? "地區" : "Districts",
        "item": "https://petsos.site/districts"
      }
    ]
  });

  const hkiDistricts = HONG_KONG_DISTRICTS.filter(d => d.regionCode === "HKI");
  const klnDistricts = HONG_KONG_DISTRICTS.filter(d => d.regionCode === "KLN");
  const ntiDistricts = HONG_KONG_DISTRICTS.filter(d => d.regionCode === "NTI");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "香港地區24小時獸醫目錄 | PetSOS"
          : "Hong Kong Districts 24-Hour Vet Directory | PetSOS"
        }
        description={language === 'zh-HK'
          ? "瀏覽香港各區24小時緊急獸醫服務，包括中環、尖沙咀、旺角、銅鑼灣等地區"
          : "Browse 24-hour emergency vet services across Hong Kong districts including Central, Tsim Sha Tsui, Mong Kok, Causeway Bay and more"
        }
        keywords={language === 'zh-HK'
          ? "香港地區獸醫, 中環獸醫, 尖沙咀獸醫, 旺角獸醫, 24小時動物醫院, 緊急寵物護理"
          : "Hong Kong district vets, Central vet, Tsim Sha Tsui vet, Mong Kok vet, 24-hour animal hospital, emergency pet care"
        }
        canonical="https://petsos.site/districts"
        language={language}
      />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb" />

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            {language === 'zh-HK' ? '香港地區獸醫目錄' : 'Hong Kong Districts Vet Directory'}
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-page-description">
            {language === 'zh-HK'
              ? '選擇您的地區，尋找附近的24小時緊急獸醫診所'
              : 'Select your district to find nearby 24-hour emergency veterinary clinics'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hong Kong Island */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-red-600" />
            {language === 'zh-HK' ? '港島' : 'Hong Kong Island'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hkiDistricts.map(district => (
              <Link key={district.slug} href={`/district/${district.slug}`}>
                <Card className="hover:shadow-lg hover:border-red-600 transition-all cursor-pointer h-full" data-testid={`card-district-${district.slug}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{language === 'zh-HK' ? district.nameZh : district.nameEn}</span>
                      <ArrowRight className="h-5 w-5 text-red-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Kowloon */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-red-600" />
            {language === 'zh-HK' ? '九龍' : 'Kowloon'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {klnDistricts.map(district => (
              <Link key={district.slug} href={`/district/${district.slug}`}>
                <Card className="hover:shadow-lg hover:border-red-600 transition-all cursor-pointer h-full" data-testid={`card-district-${district.slug}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{language === 'zh-HK' ? district.nameZh : district.nameEn}</span>
                      <ArrowRight className="h-5 w-5 text-red-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* New Territories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-red-600" />
            {language === 'zh-HK' ? '新界' : 'New Territories'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ntiDistricts.map(district => (
              <Link key={district.slug} href={`/district/${district.slug}`}>
                <Card className="hover:shadow-lg hover:border-red-600 transition-all cursor-pointer h-full" data-testid={`card-district-${district.slug}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{language === 'zh-HK' ? district.nameZh : district.nameEn}</span>
                      <ArrowRight className="h-5 w-5 text-red-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-4">
              {language === 'zh-HK' ? '找不到您的地區？' : 'Can\'t Find Your District?'}
            </h3>
            <p className="text-red-800 dark:text-red-200 mb-6">
              {language === 'zh-HK'
                ? '瀏覽完整診所目錄或直接發送緊急求助'
                : 'Browse the full clinic directory or send an emergency request directly'
              }
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/clinics">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-red-600">
                  <div className="text-red-600 font-semibold">
                    {language === 'zh-HK' ? '瀏覽所有診所' : 'Browse All Clinics'}
                  </div>
                </Card>
              </Link>
              <Link href="/emergency">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-red-600 border-red-600">
                  <div className="text-white font-semibold">
                    {language === 'zh-HK' ? '發送緊急求助' : 'Send Emergency Request'}
                  </div>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
