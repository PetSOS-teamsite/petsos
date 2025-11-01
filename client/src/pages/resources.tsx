import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  AlertTriangle, 
  Phone, 
  Clock, 
  Thermometer,
  Activity,
  Stethoscope,
  FileText,
  ChevronRight
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { analytics } from "@/lib/analytics";

interface EmergencyTip {
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  icon: React.ReactNode;
}

const EMERGENCY_TIPS: EmergencyTip[] = [
  {
    titleEn: "Stay Calm",
    titleZh: "保持冷靜",
    descriptionEn: "Your pet can sense your anxiety. Speak softly and move slowly to keep them calm during an emergency.",
    descriptionZh: "您的寵物能感受到您的焦慮。在緊急情況下請輕聲說話並慢慢移動，以保持牠們的冷靜。",
    icon: <Heart className="h-6 w-6" />
  },
  {
    titleEn: "Check Vital Signs",
    titleZh: "檢查生命徵象",
    descriptionEn: "Monitor breathing, heart rate, and gum color. Normal gums should be pink, not pale or blue.",
    descriptionZh: "監察呼吸、心跳和牙齦顏色。正常牙齦應呈粉紅色，而非蒼白或藍色。",
    icon: <Activity className="h-6 w-6" />
  },
  {
    titleEn: "Call Ahead",
    titleZh: "提前致電",
    descriptionEn: "Contact the veterinary clinic before arriving so they can prepare for your pet's emergency.",
    descriptionZh: "到達前先聯絡獸醫診所，以便他們為您寵物的緊急情況做好準備。",
    icon: <Phone className="h-6 w-6" />
  },
  {
    titleEn: "Safe Transport",
    titleZh: "安全運送",
    descriptionEn: "Use a carrier or secure your pet safely in the vehicle. Injured pets may bite or scratch involuntarily.",
    descriptionZh: "使用寵物籠或在車輛中安全固定您的寵物。受傷的寵物可能會無意識地咬傷或抓傷。",
    icon: <AlertTriangle className="h-6 w-6" />
  }
];

const CRITICAL_SIGNS = {
  titleEn: "Critical Emergency Signs",
  titleZh: "緊急危險徵兆",
  items: [
    { en: "Difficulty breathing or choking", zh: "呼吸困難或窒息" },
    { en: "Severe bleeding that won't stop", zh: "嚴重流血不止" },
    { en: "Unconsciousness or collapse", zh: "失去知覺或倒地" },
    { en: "Seizures lasting more than 2 minutes", zh: "癲癇發作超過2分鐘" },
    { en: "Suspected poisoning or toxin exposure", zh: "疑似中毒或接觸毒物" },
    { en: "Severe trauma from accident or fall", zh: "意外或跌倒造成嚴重創傷" },
    { en: "Bloated, hard abdomen with retching", zh: "腹部腫脹堅硬並乾嘔" },
    { en: "Inability to urinate or defecate", zh: "無法排尿或排便" }
  ]
};

const CLINIC_SELECTION = {
  titleEn: "How to Choose a Veterinary Clinic",
  titleZh: "如何選擇獸醫診所",
  criteria: [
    {
      titleEn: "24-Hour Availability",
      titleZh: "24小時服務",
      descEn: "Ensure the clinic offers emergency services during nights, weekends, and public holidays.",
      descZh: "確保診所在夜間、週末和公眾假期提供緊急服務。"
    },
    {
      titleEn: "Location & Accessibility",
      titleZh: "位置及交通",
      descEn: "Choose a clinic within 15-20 minutes of your home for quick emergency access.",
      descZh: "選擇離家15-20分鐘內的診所，以便緊急時快速到達。"
    },
    {
      titleEn: "Qualified Veterinarians",
      titleZh: "專業獸醫",
      descEn: "Verify the clinic has licensed veterinarians with emergency care experience.",
      descZh: "確認診所有持牌獸醫並具備緊急護理經驗。"
    },
    {
      titleEn: "Equipment & Facilities",
      titleZh: "設備及設施",
      descEn: "Modern clinics should have X-ray, ultrasound, laboratory, and surgical facilities.",
      descZh: "現代診所應配備X光、超聲波、化驗室及手術設施。"
    }
  ]
};

export default function ResourcesPage() {
  const { language } = useLanguage();

  const createHowToSchema = () => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": language === 'zh-HK' ? "寵物緊急情況處理指南" : "Pet Emergency Handling Guide",
    "description": language === 'zh-HK' 
      ? "了解如何處理寵物緊急情況，包括辨識危險徵兆、提供急救護理及選擇適當的獸醫診所。"
      : "Learn how to handle pet emergencies, including recognizing critical signs, providing first aid, and choosing the right veterinary clinic.",
    "step": EMERGENCY_TIPS.map((tip, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": language === 'zh-HK' ? tip.titleZh : tip.titleEn,
      "text": language === 'zh-HK' ? tip.descriptionZh : tip.descriptionEn
    }))
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
        "name": language === 'zh-HK' ? "資源中心" : "Resources",
        "item": "https://petsos.site/resources"
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "寵物緊急護理指南 | PetSOS資源中心"
          : "Pet Emergency Care Guide | PetSOS Resources"
        }
        description={language === 'zh-HK'
          ? "學習如何辨識寵物緊急情況、提供急救護理及選擇合適的24小時獸醫診所。PetSOS為香港寵物主人提供全面的緊急護理指南。"
          : "Learn how to recognize pet emergencies, provide first aid, and choose the right 24-hour veterinary clinic. PetSOS provides comprehensive emergency care guides for Hong Kong pet owners."
        }
        keywords={language === 'zh-HK'
          ? "寵物急救, 寵物緊急情況, 獸醫診所選擇, 寵物危險徵兆, 寵物健康指南, 香港寵物護理"
          : "pet first aid, pet emergency, veterinary clinic selection, pet critical signs, pet health guide, Hong Kong pet care"
        }
        canonical="https://petsos.site/resources"
        language={language}
      />
      <StructuredData data={createHowToSchema()} id="schema-howto" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb" />

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            {language === 'zh-HK' ? '寵物緊急護理資源' : 'Pet Emergency Care Resources'}
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-page-description">
            {language === 'zh-HK'
              ? '學習如何辨識寵物緊急情況並提供適當護理'
              : 'Learn how to recognize pet emergencies and provide appropriate care'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Emergency Tips */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-red-600" />
            {language === 'zh-HK' ? '緊急處理步驟' : 'Emergency Response Steps'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EMERGENCY_TIPS.map((tip, index) => (
              <Card key={index} className="border-l-4 border-l-red-600" data-testid={`card-tip-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600">
                      {tip.icon}
                    </div>
                    {language === 'zh-HK' ? tip.titleZh : tip.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {language === 'zh-HK' ? tip.descriptionZh : tip.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Critical Signs */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-900 dark:text-red-100">
              <AlertTriangle className="h-6 w-6" />
              {language === 'zh-HK' ? CRITICAL_SIGNS.titleZh : CRITICAL_SIGNS.titleEn}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 dark:text-red-200 mb-4 font-medium">
              {language === 'zh-HK'
                ? '如果您的寵物出現以下任何徵兆，請立即尋求緊急獸醫護理：'
                : 'Seek immediate emergency veterinary care if your pet shows any of these signs:'
              }
            </p>
            <ul className="space-y-2">
              {CRITICAL_SIGNS.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-red-900 dark:text-red-100">
                  <ChevronRight className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{language === 'zh-HK' ? item.zh : item.en}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-800">
              <Link 
                href="/emergency"
                onClick={() => analytics.trackResourcesInteraction({
                  interactionType: 'emergency_cta_click',
                  section: 'critical_signs',
                  language
                })}
              >
                <Card className="p-4 bg-red-600 hover:bg-red-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center gap-2 text-white font-semibold">
                    <Clock className="h-5 w-5" />
                    {language === 'zh-HK' ? '立即發送緊急求助' : 'Send Emergency Request Now'}
                  </div>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Selection Guide */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-red-600" />
            {language === 'zh-HK' ? CLINIC_SELECTION.titleZh : CLINIC_SELECTION.titleEn}
          </h2>
          <div className="space-y-4">
            {CLINIC_SELECTION.criteria.map((criterion, index) => (
              <Card key={index} data-testid={`card-criterion-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    {language === 'zh-HK' ? criterion.titleZh : criterion.titleEn}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {language === 'zh-HK' ? criterion.descZh : criterion.descEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
                {language === 'zh-HK' ? '尋找您附近的24小時獸醫診所' : 'Find 24-Hour Vet Clinics Near You'}
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-6">
                {language === 'zh-HK'
                  ? 'PetSOS為您提供香港所有地區的24小時緊急獸醫診所目錄'
                  : 'PetSOS provides a directory of 24-hour emergency veterinary clinics across all Hong Kong districts'
                }
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/clinics">
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-blue-600">
                    <div className="text-blue-600 font-semibold">
                      {language === 'zh-HK' ? '瀏覽診所目錄' : 'Browse Clinic Directory'}
                    </div>
                  </Card>
                </Link>
                <Link href="/districts">
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-blue-600">
                    <div className="text-blue-600 font-semibold">
                      {language === 'zh-HK' ? '按地區搜尋' : 'Search by District'}
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preventive Care Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-red-600" />
              {language === 'zh-HK' ? '預防勝於治療' : 'Prevention is Better Than Cure'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              {language === 'zh-HK'
                ? '定期健康檢查可以及早發現潛在問題。建議每年至少進行一次全面身體檢查，老年寵物或有慢性疾病的寵物則建議每六個月檢查一次。'
                : 'Regular health checkups can detect potential problems early. Annual comprehensive examinations are recommended, with senior pets or those with chronic conditions requiring checkups every six months.'
              }
            </p>
            <p>
              {language === 'zh-HK'
                ? '保持寵物最新的疫苗接種、定期驅蟲、提供均衡飲食和適量運動，都是維持寵物健康的重要因素。'
                : 'Maintaining up-to-date vaccinations, regular deworming, providing balanced nutrition, and ensuring adequate exercise are all crucial factors in maintaining your pet\'s health.'
              }
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
