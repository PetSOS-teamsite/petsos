import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  Phone, 
  Clock, 
  MapPin, 
  Users,
  AlertTriangle,
  FileCheck,
  MessageCircle,
  Heart,
  Building2
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

export default function VerificationProcessPage() {
  const { language } = useLanguage();

  const createArticleSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": language === 'zh-HK' ? "PetSOS 如何保持100%數據準確" : "How We Keep PetSOS Data 100% Accurate",
    "description": language === 'zh-HK'
      ? "了解PetSOS的三步驗證循環：政府登記核對、每月直接聯繫、社區報告系統。我們是非牟利機構，不接受排名付費。"
      : "Learn about PetSOS's 3-step verification loop: Registry cross-check, monthly direct contact, and community reporting. We are non-profit and do not accept payment for rankings.",
    "author": {
      "@type": "Organization",
      "name": "PetSOS"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PetSOS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://petsos.site/icon-512.png"
      }
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "mainEntityOfPage": "https://petsos.site/verification-process"
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
        "name": language === 'zh-HK' ? "核實流程" : "Verification Process",
        "item": "https://petsos.site/verification-process"
      }
    ]
  });

  const verificationSteps = [
    {
      icon: Building2,
      step: 1,
      titleEn: "Registry Cross-Check",
      titleZh: "政府登記核對",
      descEn: "Every clinic listed is verified against the Veterinary Surgeons Board of Hong Kong (VSB) registry. We ensure every veterinarian is properly licensed and the clinic operates legally.",
      descZh: "每間診所均與香港獸醫管理局（VSB）登記冊進行核對。我們確保每位獸醫均持有有效執照，診所合法營運。"
    },
    {
      icon: Phone,
      step: 2,
      titleEn: "Monthly Direct Contact",
      titleZh: "每月直接聯繫",
      descEn: "Our team conducts a \"Pulse Check\" via phone/WhatsApp once a month to confirm 24-hour status and current emergency surcharges. We verify operating hours, staff availability, and service fees.",
      descZh: "我們的團隊每月透過電話/WhatsApp進行「脈搏檢查」，確認24小時服務狀態及當前急診附加費。我們核實營業時間、人員配備及服務收費。"
    },
    {
      icon: Users,
      step: 3,
      titleEn: "Community Reporting",
      titleZh: "社區報告系統",
      descEn: "Users can flag \"Outdated Status\" directly via our emergency portal, triggering an instant manual review within 12 hours. Your feedback helps save pets' lives.",
      descZh: "用戶可透過我們的緊急入口直接標記「過時狀態」，觸發12小時內的即時人工審核。您的回饋有助於拯救寵物生命。"
    }
  ];

  const verificationMetrics = [
    {
      metricEn: "Monthly",
      metricZh: "每月",
      labelEn: "Direct Contact",
      labelZh: "直接聯繫"
    },
    {
      metricEn: "12 Hours",
      metricZh: "12小時",
      labelEn: "Review Response",
      labelZh: "審核回應"
    },
    {
      metricEn: "100%",
      metricZh: "100%",
      labelEn: "VSB Verified",
      labelZh: "VSB已驗證"
    },
    {
      metricEn: "$0",
      metricZh: "$0",
      labelEn: "Paid Rankings",
      labelZh: "付費排名"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "如何保持100%數據準確 | PetSOS 核實流程"
          : "How We Keep PetSOS Data 100% Accurate | Verification Process"
        }
        description={language === 'zh-HK'
          ? "PetSOS三步驗證循環：VSB登記核對、每月直接聯繫、社區報告。非牟利機構，不接受排名付費，目標是縮短寵物緊急救援時間。"
          : "PetSOS 3-step verification loop: VSB registry cross-check, monthly direct contact, community reporting. Non-profit with no paid rankings. Goal: reduce Time-to-Help in pet emergencies."
        }
        keywords={language === 'zh-HK'
          ? "PetSOS核實流程, VSB登記核對, 診所資料驗證, 數據準確性, 24小時獸醫, 非牟利, 香港寵物急救"
          : "PetSOS verification, VSB registry, clinic data validation, data accuracy, 24-hour vet, non-profit, Hong Kong pet emergency"
        }
        canonical="https://petsos.site/verification-process"
        language={language}
      />
      <StructuredData data={createArticleSchema()} id="schema-article-verification" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb-verification" />

      <header className="border-b border-border bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-green-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '如何保持100%數據準確' : 'How We Keep PetSOS Data 100% Accurate'}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '三步驗證循環 — 確保每間診所資訊真實可靠'
              : 'The 3-Step Verification Loop — Ensuring every clinic listing is accurate and reliable'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {verificationMetrics.map((metric, index) => (
            <Card key={index} className="text-center p-6">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {language === 'zh-HK' ? metric.metricZh : metric.metricEn}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'zh-HK' ? metric.labelZh : metric.labelEn}
              </div>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-6" data-testid="text-steps-title">
          {language === 'zh-HK' ? '🔍 三步驗證循環' : '🔍 The 3-Step Verification Loop'}
        </h2>
        <div className="space-y-4 mb-8">
          {verificationSteps.map((step, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-bold text-foreground">
                      {language === 'zh-HK' ? step.titleZh : step.titleEn}
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    {language === 'zh-HK' ? step.descZh : step.descEn}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mb-8 border-red-200 dark:border-red-900 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <Heart className="h-10 w-10 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-nonprofit-title">
                  {language === 'zh-HK' ? '為何我們是非牟利機構？' : 'Why We Are Non-Profit'}
                </h2>
                <p className="text-lg text-muted-foreground mb-4">
                  {language === 'zh-HK'
                    ? '我們不接受排名付費。PetSOS的唯一目標是縮短香港寵物緊急救援的「求助時間」。'
                    : 'We do not accept payment for rankings. Our goal is strictly to reduce the "Time-to-Help" during pet emergencies in Hong Kong.'
                  }
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {language === 'zh-HK' 
                        ? '零廣告費 — 診所排名純粹基於距離和服務能力' 
                        : 'Zero advertising fees — clinic rankings based purely on distance and service capability'
                      }
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {language === 'zh-HK' 
                        ? '透明收費 — 公開顯示急診附加費，讓寵物主人做好準備' 
                        : 'Transparent pricing — emergency surcharges displayed openly so pet owners can prepare'
                      }
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      {language === 'zh-HK' 
                        ? '社區驅動 — 由寵物主人和診所共同維護數據準確性' 
                        : 'Community-driven — data accuracy maintained by pet owners and clinics together'
                      }
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2" data-testid="text-24hr-title">
              <Clock className="h-6 w-6 text-red-600" />
              {language === 'zh-HK' ? '24小時診所特別核實' : '24-Hour Clinic Special Verification'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'zh-HK'
                ? '對於聲稱提供24小時服務的診所，我們執行額外的核實措施：'
                : 'For clinics claiming 24-hour service, we perform additional verification measures:'
              }
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '深夜電話測試' : 'Late-Night Phone Test'}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '不定期在凌晨2-4點進行電話測試，確認診所確實有人接聽' : 'Random phone tests at 2-4 AM to confirm clinic actually answers'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '假日/颱風狀態追蹤' : 'Holiday/Typhoon Status Tracking'}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '在公眾假期和惡劣天氣期間主動確認診所運作狀態' : 'Proactively confirm clinic operational status during public holidays and severe weather'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '用戶實時回饋' : 'Real-Time User Feedback'}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '收集和分析用戶對診所可用性的實時回饋，12小時內處理' : 'Collect and analyze user real-time feedback on clinic availability, processed within 12 hours'}
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2" data-testid="text-report-title">
                  {language === 'zh-HK' ? '發現過時資訊？' : 'Found Outdated Information?'}
                </h2>
                <p className="text-amber-800 dark:text-amber-200 mb-4">
                  {language === 'zh-HK'
                    ? '如果您發現任何診所資訊已過時（例如營業時間、電話號碼或急診費用），請立即標記「過時狀態」。我們的團隊將在12小時內進行人工審核。'
                    : 'If you find any clinic information that is outdated (e.g., operating hours, phone number, or emergency fees), please flag "Outdated Status" immediately. Our team will conduct a manual review within 12 hours.'
                  }
                </p>
                <Link href="/emergency">
                  <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20" data-testid="button-report-error">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {language === 'zh-HK' ? '標記過時狀態' : 'Flag Outdated Status'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <FileCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  {language === 'zh-HK' ? 'VSB登記核對' : 'VSB Registry Cross-Check'}
                </h2>
                <p className="text-green-800 dark:text-green-200 mb-2">
                  {language === 'zh-HK'
                    ? '所有診所均與香港獸醫管理局官方登記冊進行核對，確保：'
                    : 'All clinics are verified against the official Veterinary Surgeons Board of Hong Kong registry to ensure:'
                  }
                </p>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• {language === 'zh-HK' ? '獸醫持有有效執照' : 'Veterinarians hold valid licenses'}</li>
                  <li>• {language === 'zh-HK' ? '診所合法註冊' : 'Clinic is legally registered'}</li>
                  <li>• {language === 'zh-HK' ? '專業資格經過驗證' : 'Professional qualifications are verified'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/about">
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" data-testid="button-about">
              {language === 'zh-HK' ? '了解PetSOS' : 'Learn About PetSOS'}
            </Button>
          </Link>
          <Link href="/hospitals">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" data-testid="button-hospitals">
              <MapPin className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '瀏覽診所目錄' : 'Browse Clinic Directory'}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
