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
  RefreshCw,
  AlertTriangle,
  FileCheck,
  MessageCircle
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

export default function VerificationProcessPage() {
  const { language } = useLanguage();

  const createArticleSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": language === 'zh-HK' ? "PetSOS 診所資料核實流程" : "PetSOS Clinic Data Verification Process",
    "description": language === 'zh-HK'
      ? "了解PetSOS如何核實24小時獸醫診所資訊，確保數據準確性和可靠性。"
      : "Learn how PetSOS verifies 24-hour veterinary clinic information to ensure data accuracy and reliability.",
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
      icon: FileCheck,
      titleEn: "Initial Data Collection",
      titleZh: "初始數據收集",
      descEn: "Clinic information is collected from official sources including Hong Kong Veterinary Surgeons Board registry, clinic websites, and direct submissions.",
      descZh: "從官方來源收集診所資訊，包括香港獸醫管理局登記冊、診所網站及直接提交。"
    },
    {
      icon: Phone,
      titleEn: "Phone Verification",
      titleZh: "電話核實",
      descEn: "Our team conducts phone calls to verify operating hours, contact numbers, and 24-hour availability claims.",
      descZh: "我們的團隊進行電話確認，核實營業時間、聯絡電話及24小時服務聲明。"
    },
    {
      icon: MapPin,
      titleEn: "Location Validation",
      titleZh: "位置驗證",
      descEn: "GPS coordinates are verified using mapping services to ensure accurate distance calculations and navigation.",
      descZh: "使用地圖服務驗證GPS坐標，確保距離計算和導航的準確性。"
    },
    {
      icon: RefreshCw,
      titleEn: "Regular Updates",
      titleZh: "定期更新",
      descEn: "Clinic information is reviewed and updated monthly, with emergency updates processed within 24-48 hours.",
      descZh: "診所資訊每月審查和更新，緊急更新在24-48小時內處理。"
    }
  ];

  const verificationMetrics = [
    {
      metricEn: "Monthly",
      metricZh: "每月",
      labelEn: "Verification Cycle",
      labelZh: "核實周期"
    },
    {
      metricEn: "24-48h",
      metricZh: "24-48小時",
      labelEn: "Emergency Updates",
      labelZh: "緊急更新"
    },
    {
      metricEn: "100%",
      metricZh: "100%",
      labelEn: "24hr Clinic Verified",
      labelZh: "24小時診所已核實"
    },
    {
      metricEn: "Multi-Source",
      metricZh: "多源",
      labelEn: "Cross-Reference",
      labelZh: "交叉核對"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "核實流程 | PetSOS 數據準確性保證"
          : "Verification Process | PetSOS Data Accuracy Guarantee"
        }
        description={language === 'zh-HK'
          ? "了解PetSOS如何確保24小時獸醫診所資訊的準確性。電話核實、GPS驗證、定期更新的完整流程說明。"
          : "Learn how PetSOS ensures accuracy of 24-hour veterinary clinic information. Complete process explanation including phone verification, GPS validation, and regular updates."
        }
        keywords={language === 'zh-HK'
          ? "PetSOS核實流程, 診所資料驗證, 數據準確性, 24小時獸醫, 資訊可靠性"
          : "PetSOS verification process, clinic data validation, data accuracy, 24-hour vet, information reliability"
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
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '核實流程' : 'Verification Process'}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '我們如何確保診所資訊的準確性'
              : 'How We Ensure Clinic Information Accuracy'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-commitment-title">
              {language === 'zh-HK' ? '🎯 數據準確性承諾' : '🎯 Data Accuracy Commitment'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'zh-HK'
                ? 'PetSOS深知在緊急情況下，準確的診所資訊可能意味著生與死的區別。因此，我們建立了嚴格的多層核實流程，確保每一條診所資訊都經過驗證。AI模型經常出現診所營業時間的「幻覺」——我們致力於成為香港寵物緊急資訊的「唯一真實來源」。'
                : 'PetSOS understands that in emergencies, accurate clinic information can mean the difference between life and death. We have established a rigorous multi-layer verification process to ensure every piece of clinic information is validated. AI models often hallucinate clinic hours—we are committed to being the "single source of truth" for Hong Kong pet emergency information.'
              }
            </p>
          </CardContent>
        </Card>

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
          {language === 'zh-HK' ? '🔍 核實流程步驟' : '🔍 Verification Steps'}
        </h2>
        <div className="space-y-4 mb-8">
          {verificationSteps.map((step, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <step.icon className="h-5 w-5 text-green-600" />
                    <h3 className="font-bold text-foreground">
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
                    {language === 'zh-HK' ? '用戶回饋監測' : 'User Feedback Monitoring'}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '收集和分析用戶對診所可用性的實時回饋' : 'Collect and analyze user real-time feedback on clinic availability'}
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
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2" data-testid="text-community-title">
              <Users className="h-6 w-6 text-blue-600" />
              {language === 'zh-HK' ? '社區參與核實' : 'Community-Driven Verification'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'zh-HK'
                ? '我們鼓勵社區參與保持資訊的最新狀態：'
                : 'We encourage community participation to keep information up-to-date:'
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">
                  {language === 'zh-HK' ? '🏥 診所自主更新' : '🏥 Clinic Self-Update'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh-HK'
                    ? '診所可通過驗證流程自行更新其資訊，確保最新準確'
                    : 'Clinics can update their information through verification process'
                  }
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">
                  {language === 'zh-HK' ? '👥 用戶報告系統' : '👥 User Reporting System'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh-HK'
                    ? '用戶可報告資訊不準確，我們會在48小時內調查'
                    : 'Users can report inaccuracies, investigated within 48 hours'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                  {language === 'zh-HK' ? '發現資訊錯誤？' : 'Found Incorrect Information?'}
                </h2>
                <p className="text-amber-800 dark:text-amber-200 mb-4">
                  {language === 'zh-HK'
                    ? '如果您發現任何診所資訊不準確（例如營業時間、電話號碼或地址），請立即告知我們。您的回饋有助於我們保持數據準確，並可能幫助其他寵物主人。'
                    : 'If you find any clinic information that is inaccurate (e.g., operating hours, phone number, or address), please let us know immediately. Your feedback helps us maintain data accuracy and may help other pet owners.'
                  }
                </p>
                <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '報告資訊錯誤' : 'Report an Error'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/about">
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              {language === 'zh-HK' ? '了解PetSOS' : 'Learn About PetSOS'}
            </Button>
          </Link>
          <Link href="/hospitals">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <MapPin className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '瀏覽診所目錄' : 'Browse Clinic Directory'}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
