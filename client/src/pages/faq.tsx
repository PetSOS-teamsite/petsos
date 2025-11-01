import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Phone, Clock, MapPin, MessageCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { analytics } from "@/lib/analytics";

interface FAQItem {
  questionEn: string;
  questionZh: string;
  answerEn: string;
  answerZh: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    questionEn: "What is PetSOS and how does it work?",
    questionZh: "PetSOS是什麼？如何運作？",
    answerEn: "PetSOS is a Hong Kong-based emergency veterinary care coordination platform. When your pet has an emergency, you can submit a request through our platform, and we'll instantly notify all nearby 24-hour veterinary clinics via WhatsApp and email. You'll receive direct contact details and can reach clinics immediately through Call, WhatsApp, or Maps.",
    answerZh: "PetSOS是一個香港緊急獸醫護理協調平台。當您的寵物遇到緊急情況時，您可以透過我們的平台提交請求，我們會即時透過WhatsApp和電郵通知附近所有24小時獸醫診所。您將收到直接聯絡資料，並可立即透過致電、WhatsApp或地圖聯絡診所。"
  },
  {
    questionEn: "Is PetSOS available 24/7?",
    questionZh: "PetSOS是否24小時服務？",
    answerEn: "Yes, PetSOS is available 24 hours a day, 7 days a week, including public holidays. Our platform is always ready to connect you with 24-hour emergency veterinary clinics whenever your pet needs urgent care.",
    answerZh: "是的，PetSOS全年無休24小時服務，包括公眾假期。我們的平台隨時準備為您聯繫24小時緊急獸醫診所，無論您的寵物何時需要緊急護理。"
  },
  {
    questionEn: "Do I need to create an account to use PetSOS?",
    questionZh: "使用PetSOS需要建立帳戶嗎？",
    answerEn: "No, you can use PetSOS without creating an account. For emergency situations, you can submit a request as a guest by providing your contact information. However, creating an account allows you to save your pet profiles for faster emergency requests in the future.",
    answerZh: "不需要，您無需建立帳戶即可使用PetSOS。在緊急情況下，您只需提供聯絡資料即可以訪客身份提交請求。不過，建立帳戶可讓您保存寵物檔案，以便日後更快速提交緊急請求。"
  },
  {
    questionEn: "How quickly will clinics respond to my emergency request?",
    questionZh: "診所會多快回應我的緊急請求？",
    answerEn: "Response times vary by clinic and their current capacity. Most clinics aim to respond within 5-15 minutes. We recommend calling the clinic directly (using our Call button) for the fastest response, as some clinics may answer phone calls more quickly than digital messages during busy periods.",
    answerZh: "回應時間因診所和當時運作量而異。大多數診所目標在5-15分鐘內回應。我們建議直接致電診所（使用我們的致電按鈕）以獲得最快回應，因為部分診所在繁忙時段可能會優先接聽電話。"
  },
  {
    questionEn: "Which areas of Hong Kong does PetSOS cover?",
    questionZh: "PetSOS覆蓋香港哪些地區？",
    answerEn: "PetSOS covers all major areas of Hong Kong, including Hong Kong Island (Central, Wan Chai, Causeway Bay), Kowloon (Tsim Sha Tsui, Mong Kok), and New Territories (Sha Tin, Tuen Mun, and more). Our clinic directory includes 24-hour veterinary clinics across all districts.",
    answerZh: "PetSOS覆蓋香港所有主要地區，包括香港島（中環、灣仔、銅鑼灣）、九龍（尖沙咀、旺角）及新界（沙田、屯門等）。我們的診所目錄包括全港各區的24小時獸醫診所。"
  },
  {
    questionEn: "Is there a fee for using PetSOS?",
    questionZh: "使用PetSOS需要收費嗎？",
    answerEn: "No, PetSOS is completely free for pet owners. Our service is designed to help you quickly connect with emergency veterinary care when you need it most. You will only pay for the actual veterinary services provided by the clinic.",
    answerZh: "不需要，PetSOS對寵物主人完全免費。我們的服務旨在幫助您在最需要時快速聯繫緊急獸醫護理。您只需支付診所提供的實際獸醫服務費用。"
  },
  {
    questionEn: "What types of pet emergencies should I use PetSOS for?",
    questionZh: "我應該為哪些寵物緊急情況使用PetSOS？",
    answerEn: "Use PetSOS for any serious pet emergency including: difficulty breathing, severe bleeding, unconsciousness, seizures, suspected poisoning, severe trauma, bloated abdomen with retching, inability to urinate, or any situation where your pet's life may be at risk.",
    answerZh: "適用於任何嚴重寵物緊急情況，包括：呼吸困難、嚴重流血、失去知覺、癲癇發作、疑似中毒、嚴重創傷、腹部腫脹並乾嘔、無法排尿，或任何可能危及寵物生命的情況。"
  },
  {
    questionEn: "Can I choose which clinic to contact?",
    questionZh: "我可以選擇聯絡哪間診所嗎？",
    answerEn: "Yes, after submitting an emergency request, you'll see a list of nearby 24-hour clinics sorted by distance from your location. You can choose to contact any clinic using the Call, WhatsApp, or Maps buttons. You can also browse our full clinic directory anytime.",
    answerZh: "可以，提交緊急請求後，您會看到按距離排序的附近24小時診所列表。您可以選擇使用致電、WhatsApp或地圖按鈕聯絡任何診所。您也可以隨時瀏覽我們的完整診所目錄。"
  },
  {
    questionEn: "What languages does PetSOS support?",
    questionZh: "PetSOS支援哪些語言？",
    answerEn: "PetSOS currently supports English and Traditional Chinese (繁體中文). You can switch between languages using the language selector in the top right corner of any page.",
    answerZh: "PetSOS目前支援英文和繁體中文。您可以使用任何頁面右上角的語言選擇器切換語言。"
  },
  {
    questionEn: "How do I know if a clinic is open right now?",
    questionZh: "我如何知道診所現在是否營業？",
    answerEn: "All clinics in our directory are marked with their operating hours. Clinics offering 24-hour service display a red '24hrs' badge. You can also use our 24-hour filter on the clinic directory page to show only clinics that are always open.",
    answerZh: "目錄中的所有診所都標示了營業時間。提供24小時服務的診所會顯示紅色的「24hrs」標誌。您也可以在診所目錄頁面使用24小時篩選器，僅顯示全天候營業的診所。"
  }
];

export default function FAQPage() {
  const { language } = useLanguage();

  const createFAQSchema = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(item => ({
      "@type": "Question",
      "name": language === 'zh-HK' ? item.questionZh : item.questionEn,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": language === 'zh-HK' ? item.answerZh : item.answerEn
      }
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
        "name": language === 'zh-HK' ? "常見問題" : "FAQ",
        "item": "https://petsos.site/faq"
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "常見問題 | PetSOS緊急獸醫服務"
          : "Frequently Asked Questions | PetSOS Emergency Vet Service"
        }
        description={language === 'zh-HK'
          ? "關於PetSOS緊急獸醫協調平台的常見問題解答。了解如何使用我們的服務、回應時間、覆蓋地區及更多資訊。"
          : "Frequently asked questions about PetSOS emergency veterinary coordination platform. Learn how to use our service, response times, coverage areas and more."
        }
        keywords={language === 'zh-HK'
          ? "PetSOS常見問題, 緊急獸醫FAQ, 香港寵物急救, 24小時獸醫服務, 寵物緊急護理問答"
          : "PetSOS FAQ, emergency vet frequently asked questions, Hong Kong pet emergency, 24-hour vet service, pet emergency care Q&A"
        }
        canonical="https://petsos.site/faq"
        language={language}
      />
      <StructuredData data={createFAQSchema()} id="schema-faq" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb" />

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-10 w-10 text-red-600" />
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '常見問題' : 'Frequently Asked Questions'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground" data-testid="text-page-description">
            {language === 'zh-HK'
              ? '找到關於PetSOS緊急獸醫服務的答案'
              : 'Find answers about PetSOS emergency veterinary service'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* FAQ Accordion */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              onValueChange={(value) => {
                if (value) {
                  const questionId = parseInt(value.replace('item-', ''));
                  analytics.trackFAQInteraction({
                    action: 'question_expand',
                    questionId,
                    language
                  });
                }
              }}
            >
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold hover:text-red-600 transition-colors">
                    {language === 'zh-HK' ? item.questionZh : item.questionEn}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {language === 'zh-HK' ? item.answerZh : item.answerEn}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/emergency"
            onClick={() => analytics.trackFAQInteraction({
              action: 'emergency_cta_click',
              language
            })}
          >
            <Card className="p-6 border-red-600 hover:shadow-lg transition-all cursor-pointer bg-red-50 dark:bg-red-900/10" data-testid="card-emergency-cta">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-600 rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">
                    {language === 'zh-HK' ? '寵物緊急情況？' : 'Pet Emergency?'}
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {language === 'zh-HK' ? '立即發送緊急求助' : 'Send emergency request now'}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link 
            href="/clinics"
            onClick={() => analytics.trackFAQInteraction({
              action: 'clinics_cta_click',
              language
            })}
          >
            <Card className="p-6 border-blue-600 hover:shadow-lg transition-all cursor-pointer bg-blue-50 dark:bg-blue-900/10" data-testid="card-clinics-cta">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {language === 'zh-HK' ? '瀏覽診所目錄' : 'Browse Clinic Directory'}
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {language === 'zh-HK' ? '尋找附近24小時診所' : 'Find nearby 24-hour clinics'}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Still Have Questions */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {language === 'zh-HK' ? '仍有疑問？' : 'Still Have Questions?'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === 'zh-HK'
                ? '瀏覽我們的資源中心了解更多寵物緊急護理資訊'
                : 'Browse our resources center for more information on pet emergency care'
              }
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/resources">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-red-600">
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <Phone className="h-5 w-5" />
                    {language === 'zh-HK' ? '緊急護理指南' : 'Emergency Care Guide'}
                  </div>
                </Card>
              </Link>
              <Link href="/districts">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-red-600">
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <MapPin className="h-5 w-5" />
                    {language === 'zh-HK' ? '按地區搜尋' : 'Search by District'}
                  </div>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mt-8 bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-900/10 dark:to-blue-900/10 border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-8 w-8 text-red-600" />
              <div className="flex-1">
                <h4 className="font-bold text-foreground mb-1">
                  {language === 'zh-HK' ? '需要進一步協助？' : 'Need Further Assistance?'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh-HK'
                    ? '在緊急情況下，請直接聯絡24小時獸醫診所以獲得即時幫助。'
                    : 'For emergencies, please contact 24-hour veterinary clinics directly for immediate assistance.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
