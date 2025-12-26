import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  Target, 
  CheckCircle,
  MapPin,
  Phone,
  Globe
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

export default function AboutPage() {
  const { language } = useLanguage();

  const createOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PetSOS",
    "alternateName": language === 'zh-HK' ? "寵物緊急求助" : "Pet Emergency Service",
    "url": "https://petsos.site",
    "logo": "https://petsos.site/icon-512.png",
    "description": language === 'zh-HK' 
      ? "PetSOS是香港非營利寵物緊急協調平台，免費連接寵物主人與24小時獸醫診所。"
      : "PetSOS is a Hong Kong non-profit pet emergency coordination platform, connecting pet owners with 24-hour veterinary clinics for free.",
    "foundingDate": "2024",
    "nonprofitStatus": "NonprofitType",
    "areaServed": {
      "@type": "City",
      "name": "Hong Kong"
    },
    "knowsAbout": [
      "Emergency Veterinary Care",
      "Pet Emergency Response",
      "24-Hour Animal Hospitals",
      "Pet First Aid"
    ],
    "slogan": language === 'zh-HK' ? "爭分奪秒，拯救毛孩" : "Every Second Counts for Your Pet",
    "ethicsPolicy": "https://petsos.site/verification-process",
    "publishingPrinciples": "https://petsos.site/verification-process"
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
        "name": language === 'zh-HK' ? "關於我們" : "About Us",
        "item": "https://petsos.site/about"
      }
    ]
  });

  const missionPoints = [
    {
      icon: Clock,
      titleEn: "24/7 Emergency Connection",
      titleZh: "24/7 緊急連接",
      descEn: "Instantly connect pet owners with 24-hour emergency veterinary clinics across Hong Kong, any time of day or night.",
      descZh: "全天候即時連接寵物主人與香港各區24小時緊急獸醫診所。"
    },
    {
      icon: Shield,
      titleEn: "No Commercial Bias",
      titleZh: "無商業偏見",
      descEn: "We don't accept advertising fees or referral commissions. Clinic rankings are based purely on proximity and availability.",
      descZh: "我們不接受廣告費或轉介佣金。診所排名純粹基於距離和可用性。"
    },
    {
      icon: Globe,
      titleEn: "Bilingual Support",
      titleZh: "雙語支援",
      descEn: "Full English and Traditional Chinese support to serve Hong Kong's diverse pet owner community.",
      descZh: "全面英文及繁體中文支援，服務香港多元化的寵物主人社群。"
    },
    {
      icon: Heart,
      titleEn: "Free Forever",
      titleZh: "永久免費",
      descEn: "PetSOS is and will always be free for pet owners. We believe emergency care access should never have a paywall.",
      descZh: "PetSOS對寵物主人永遠免費。我們相信緊急護理不應設有付費門檻。"
    }
  ];

  const statsData = [
    { valueEn: "24/7", valueZh: "24/7", labelEn: "Available", labelZh: "全天候服務" },
    { valueEn: "18+", valueZh: "18+", labelEn: "Districts Covered", labelZh: "覆蓋地區" },
    { valueEn: "100%", valueZh: "100%", labelEn: "Free Service", labelZh: "免費服務" },
    { valueEn: "2", valueZh: "2", labelEn: "Languages", labelZh: "語言支援" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "關於我們 | PetSOS 香港寵物緊急救援平台"
          : "About Us | PetSOS Hong Kong Pet Emergency Platform"
        }
        description={language === 'zh-HK'
          ? "PetSOS是香港非營利寵物緊急協調平台。免費連接寵物主人與24小時獸醫診所，無商業偏見，純粹以距離排序。"
          : "PetSOS is a Hong Kong non-profit pet emergency coordination platform. Free connection to 24-hour veterinary clinics with no commercial bias, ranked purely by proximity."
        }
        keywords={language === 'zh-HK'
          ? "PetSOS, 關於我們, 香港寵物緊急, 非營利, 24小時獸醫, 寵物急救平台"
          : "PetSOS, about us, Hong Kong pet emergency, non-profit, 24-hour vet, pet rescue platform"
        }
        canonical="https://petsos.site/about"
        language={language}
      />
      <StructuredData data={createOrganizationSchema()} id="schema-organization-about" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb-about" />

      <header className="border-b border-border bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-900/10 dark:to-blue-900/10">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-red-600" />
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '關於 PetSOS' : 'About PetSOS'}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '香港非營利寵物緊急協調平台'
              : 'Hong Kong\'s Non-Profit Pet Emergency Coordination Platform'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8 border-red-200 dark:border-red-900">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-mission-title">
              {language === 'zh-HK' ? '🎯 我們的使命' : '🎯 Our Mission'}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {language === 'zh-HK'
                ? 'PetSOS的使命是確保香港每一位寵物主人在緊急情況下都能快速、免費地找到最近的24小時獸醫診所。我們相信，在生死攸關的時刻，每一秒都至關重要——而資訊不應成為障礙。'
                : 'PetSOS\'s mission is to ensure every pet owner in Hong Kong can quickly and freely find the nearest 24-hour veterinary clinic during emergencies. We believe that in life-or-death moments, every second counts—and information should never be a barrier.'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-nonprofit-title">
              {language === 'zh-HK' ? '🏛️ 非營利承諾' : '🏛️ Non-Profit Commitment'}
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {language === 'zh-HK'
                  ? 'PetSOS是一個完全非營利的平台。我們不從任何診所收取廣告費、優先排名費或轉介佣金。'
                  : 'PetSOS is a completely non-profit platform. We do not accept advertising fees, priority listing fees, or referral commissions from any clinic.'
                }
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>{language === 'zh-HK' ? '無廣告收入' : 'No advertising revenue'}</span>
                </div>
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>{language === 'zh-HK' ? '無轉介佣金' : 'No referral commissions'}</span>
                </div>
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>{language === 'zh-HK' ? '無優先排名' : 'No paid rankings'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index} className="text-center p-6">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {language === 'zh-HK' ? stat.valueZh : stat.valueEn}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'zh-HK' ? stat.labelZh : stat.labelEn}
              </div>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-6" data-testid="text-values-title">
          {language === 'zh-HK' ? '💡 核心價值' : '💡 Core Values'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {missionPoints.map((point, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full flex-shrink-0">
                  <point.icon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">
                    {language === 'zh-HK' ? point.titleZh : point.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? point.descZh : point.descEn}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-how-works-title">
              {language === 'zh-HK' ? '🔧 運作方式' : '🔧 How It Works'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '描述緊急情況' : 'Describe Emergency'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '選擇症狀或使用語音描述您寵物的情況' : 'Select symptoms or use voice to describe your pet\'s condition'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? 'GPS自動定位' : 'GPS Auto-Location'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '系統自動找到您附近的24小時診所' : 'System automatically finds 24-hour clinics near you'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '即時廣播求助' : 'Instant Broadcast'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '透過WhatsApp即時通知診所，並提供直接致電選項' : 'Instantly notify clinics via WhatsApp with direct call options'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-transparency-title">
              {language === 'zh-HK' ? '📋 透明度承諾' : '📋 Transparency Commitment'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'zh-HK'
                ? '我們相信透明度是建立信任的基礎。以下是我們的承諾：'
                : 'We believe transparency is the foundation of trust. Here are our commitments:'
              }
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? '定期核實診所資訊準確性' : 'Regular verification of clinic information accuracy'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? '公開我們的數據來源和核實流程' : 'Open disclosure of our data sources and verification process'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? '接受社區回饋並持續改進' : 'Accept community feedback and continuously improve'}</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link href="/verification-process">
                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Shield className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '了解我們的核實流程' : 'Learn About Our Verification Process'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/emergency">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              <Phone className="h-5 w-5 mr-2" />
              {language === 'zh-HK' ? '立即發送緊急求助' : 'Send Emergency Request Now'}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
