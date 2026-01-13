import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  Phone,
  Briefcase,
  FileText,
  Pill,
  Syringe,
  Stethoscope,
  CreditCard,
  Shirt,
  Clock,
  Utensils,
  Activity,
  Heart,
  Scale,
  PawPrint,
  ShieldAlert,
  Car,
  Wind,
  MessageCircle,
  ClipboardList,
  HelpCircle,
  DollarSign,
  ChevronRight,
  CheckCircle,
  Save,
  ArrowRight
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

interface ChecklistItem {
  id: string;
  icon: typeof Briefcase;
  textEn: string;
  textZh: string;
}

const WHAT_TO_BRING: ChecklistItem[] = [
  { id: "carrier", icon: Briefcase, textEn: "Pet carrier (secure transport)", textZh: "寵物籠（安全運送）" },
  { id: "records", icon: FileText, textEn: "Pet's medical records (if accessible)", textZh: "寵物病歷（如可取得）" },
  { id: "medications", icon: Pill, textEn: "Current medications", textZh: "正在服用的藥物" },
  { id: "vaccination", icon: Syringe, textEn: "Recent vaccination records", textZh: "最近的疫苗紀錄" },
  { id: "vet-contact", icon: Stethoscope, textEn: "Contact info for your regular vet", textZh: "日常獸醫的聯絡資料" },
  { id: "payment", icon: CreditCard, textEn: "ID and payment method", textZh: "身份證明及付款方式" },
  { id: "towel", icon: Shirt, textEn: "Towel or blanket (for warmth/cleanup)", textZh: "毛巾或毯子（保暖/清潔用）" },
];

const INFO_TO_PREPARE: ChecklistItem[] = [
  { id: "symptom-time", icon: Clock, textEn: "Time symptoms started", textZh: "症狀開始時間" },
  { id: "food-water", icon: Utensils, textEn: "What your pet ate/drank recently", textZh: "寵物最近進食/飲水情況" },
  { id: "meds-given", icon: Pill, textEn: "Any medications given", textZh: "已給予的藥物" },
  { id: "symptoms", icon: Activity, textEn: "Description of symptoms", textZh: "症狀描述" },
  { id: "pet-info", icon: PawPrint, textEn: "Pet's age, weight, and breed", textZh: "寵物年齡、體重及品種" },
  { id: "allergies", icon: ShieldAlert, textEn: "Known allergies or conditions", textZh: "已知的過敏或疾病" },
];

interface FAQ {
  id: string;
  questionEn: string;
  questionZh: string;
  answerEn: string;
  answerZh: string;
}

const FAQS: FAQ[] = [
  {
    id: "faq-feed",
    questionEn: "Should I feed my pet before going to the emergency vet?",
    questionZh: "去急診獸醫前應該餵寵物嗎？",
    answerEn: "Generally, do NOT feed your pet before an emergency vet visit unless specifically instructed. If your pet needs anesthesia or surgery, having food in their stomach can be dangerous. However, if your pet is diabetic and has received insulin, bring food or glucose paste as directed by your vet. When in doubt, call the emergency clinic ahead.",
    answerZh: "一般而言，除非獸醫特別指示，否則去急診前不要餵食寵物。如果寵物需要麻醉或手術，胃中有食物可能很危險。但如果寵物是糖尿病患者且已注射胰島素，請按照獸醫指示攜帶食物或葡萄糖膏。如有疑問，請先致電急診診所。"
  },
  {
    id: "faq-meds",
    questionEn: "Can I give my pet medication before the vet visit?",
    questionZh: "看獸醫前可以給寵物服藥嗎？",
    answerEn: "Do NOT give any new medications unless instructed by a veterinarian. If your pet takes regular medications (like heart pills or seizure medication), continue those unless told otherwise. Never give human medications like ibuprofen or acetaminophen - they are toxic to pets. Bring all current medications to show the vet.",
    answerZh: "除非獸醫指示，否則不要給予任何新藥物。如果寵物定期服藥（如心臟藥或抗癲癇藥），除非另有指示，否則繼續服用。切勿給予人類藥物如布洛芬或對乙酰氨基酚——這些對寵物有毒。帶上所有目前的藥物讓獸醫查看。"
  },
  {
    id: "faq-afford",
    questionEn: "What if I can't afford emergency care?",
    questionZh: "如果負擔不起急診費用怎麼辦？",
    answerEn: "Many emergency vets offer payment plans or accept pet insurance. Some clinics work with financing options. Call ahead and ask about payment options - most clinics will discuss costs upfront. In Hong Kong, some animal welfare organizations may offer financial assistance. Don't delay critical care - speak honestly with the vet about your budget.",
    answerZh: "許多急診獸醫提供分期付款或接受寵物保險。部分診所提供融資選項。提前致電詢問付款方式——大多數診所會預先討論費用。在香港，一些動物福利組織可能提供經濟援助。不要延誤緊急治療——坦誠地與獸醫討論您的預算。"
  },
  {
    id: "faq-call",
    questionEn: "Should I call the emergency vet before arriving?",
    questionZh: "到達前應該先致電急診獸醫嗎？",
    answerEn: "Yes, calling ahead is highly recommended when possible. It allows the clinic to prepare for your arrival, advise you on immediate first aid, and confirm they can handle your pet's condition. For life-threatening emergencies, have someone else call while you focus on getting to the clinic safely.",
    answerZh: "是的，如果可能的話，強烈建議提前致電。這讓診所可以為您的到來做好準備，指導您進行即時急救，並確認他們能處理您寵物的情況。對於危及生命的緊急情況，讓其他人打電話，而您專注於安全到達診所。"
  }
];

export default function EmergencyChecklistPage() {
  const { language } = useLanguage();
  const lastReviewed = "2026-01-13";

  const createFAQSchema = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": language === 'zh-HK' ? faq.questionZh : faq.questionEn,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": language === 'zh-HK' ? faq.answerZh : faq.answerEn
      }
    }))
  });

  const createMedicalWebPageSchema = () => ({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": language === 'zh-HK' ? "寵物急診準備清單" : "Pet Emergency Vet Visit Checklist",
    "headline": language === 'zh-HK' 
      ? "急診獸醫準備清單：帶什麼去動物醫院"
      : "Emergency Checklist: What to Bring to the Vet Hospital",
    "description": language === 'zh-HK' 
      ? "香港寵物主人急診準備指南。出發前該做什麼、該帶什麼、到達醫院後該怎麼做的完整清單。"
      : "Emergency vet visit preparation guide for Hong Kong pet owners. Complete checklist of what to do before leaving, what to bring, and what to expect at the hospital.",
    "url": "https://petsos.site/emergency-checklist",
    "datePublished": "2026-01-01",
    "dateModified": lastReviewed,
    "lastReviewed": lastReviewed,
    "reviewedBy": {
      "@type": "Organization",
      "name": "PetSOS"
    },
    "medicalAudience": {
      "@type": "PetOwner"
    },
    "specialty": "VeterinaryMedicine",
    "inLanguage": language === 'zh-HK' ? "zh-HK" : "en"
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
        "name": language === 'zh-HK' ? "緊急求助" : "Emergency",
        "item": "https://petsos.site/emergency"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": language === 'zh-HK' ? "急診準備清單" : "Emergency Checklist",
        "item": "https://petsos.site/emergency-checklist"
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "急診準備清單 | 帶什麼去獸醫急診 | PetSOS"
          : "Emergency Checklist | What to Bring to the Vet ER | PetSOS"
        }
        description={language === 'zh-HK'
          ? "寵物急診準備清單。出發前快速檢查：該帶什麼、該準備什麼資料、運送途中注意事項。香港24小時動物醫院就診指南。"
          : "Pet emergency vet visit checklist. Quick pre-departure check: what to bring, information to prepare, transport tips. Guide for 24-hour animal hospital visits in Hong Kong."
        }
        keywords={language === 'zh-HK'
          ? "寵物急診, 獸醫急診準備, 動物醫院, 寵物醫療記錄, 急診清單, 香港24小時獸醫"
          : "pet emergency, vet ER preparation, animal hospital, pet medical records, emergency checklist, Hong Kong 24-hour vet"
        }
        canonical="https://petsos.site/emergency-checklist"
        language={language}
      />
      <StructuredData data={createFAQSchema()} id="schema-faq-checklist" />
      <StructuredData data={createMedicalWebPageSchema()} id="schema-medical-checklist" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb-checklist" />

      <div className="sr-only" aria-hidden="true" data-ai-summary="true">
        <p lang="en">
          PetSOS Emergency Checklist helps Hong Kong pet owners prepare for emergency vet visits. Includes quick actions before leaving (call ahead, keep pet calm, have someone drive), items to bring (carrier, medical records, medications, vaccination records, regular vet contact, ID/payment, towel), information to prepare (symptom timing, food/water intake, medications given, symptom description, pet details, allergies), transport tips, and what to expect at the hospital. Also covers FAQs about feeding before visits, giving medications, affording care, and calling ahead.
        </p>
        <p lang="zh-HK">
          PetSOS急診準備清單幫助香港寵物主人為緊急獸醫就診做好準備。包括出發前的快速行動（提前致電、保持寵物冷靜、讓別人開車）、需要攜帶的物品（籠子、病歷、藥物、疫苗記錄、日常獸醫聯絡方式、身份證/付款方式、毛巾）、需要準備的資訊（症狀時間、進食/飲水情況、已給藥物、症狀描述、寵物資料、過敏史）、運送提示，以及到達醫院後的預期。還包括關於就診前餵食、給藥、負擔費用和提前致電的常見問題。
        </p>
      </div>

      <header className="border-b border-border bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" data-testid="nav-breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">
              {language === 'zh-HK' ? '主頁' : 'Home'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/emergency" className="hover:text-foreground transition-colors">
              {language === 'zh-HK' ? '緊急求助' : 'Emergency'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{language === 'zh-HK' ? '準備清單' : 'Checklist'}</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '急診準備清單' : 'Emergency Checklist'}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '前往獸醫急診前的快速準備指南'
              : 'What to prepare when heading to the vet hospital'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 mb-8" data-testid="card-medical-disclaimer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  {language === 'zh-HK' ? '醫療免責聲明' : 'Medical Disclaimer'}
                </h2>
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  {language === 'zh-HK'
                    ? '此清單僅供參考，不能替代專業獸醫建議。如情況危急，請立即前往最近的24小時動物醫院，不要延誤。'
                    : 'This checklist is for reference only and does not replace professional veterinary advice. In critical emergencies, proceed to the nearest 24-hour animal hospital immediately without delay.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-10" data-testid="section-quick-actions">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Phone className="h-6 w-6 text-red-500" />
            {language === 'zh-HK' ? '出發前快速行動' : 'Quick Actions Before Leaving'}
          </h2>
          <div className="space-y-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '如可能，先致電醫院' : 'Call ahead if possible'}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {language === 'zh-HK'
                      ? '讓醫院知道您正在前往，他們可以提前準備'
                      : 'Let the hospital know you\'re coming so they can prepare'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '保持寵物冷靜和安靜' : 'Keep your pet calm and still'}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {language === 'zh-HK'
                      ? '減少移動，輕聲安撫，避免額外壓力'
                      : 'Minimize movement, speak softly, avoid additional stress'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '讓別人開車' : 'Have someone else drive'}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {language === 'zh-HK'
                      ? '您可以專心安撫寵物並監察其狀況'
                      : 'You can focus on comforting your pet and monitoring their condition'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-10" data-testid="section-what-to-bring">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-500" />
            {language === 'zh-HK' ? '需要攜帶的物品' : 'What to Bring'}
          </h2>
          <Card>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {WHAT_TO_BRING.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id} className="flex items-center gap-4" data-testid={`checklist-item-${item.id}`}>
                      <div className="flex-shrink-0 w-6 h-6 border-2 border-blue-300 rounded flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-500 opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">
                        {language === 'zh-HK' ? item.textZh : item.textEn}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10" data-testid="section-info-to-prepare">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-green-500" />
            {language === 'zh-HK' ? '需要準備的資訊' : 'Information to Prepare'}
          </h2>
          <Card>
            <CardContent className="p-6">
              <dl className="space-y-4">
                {INFO_TO_PREPARE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-start gap-4" data-testid={`info-item-${item.id}`}>
                      <Icon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <dt className="text-foreground font-medium">
                        {language === 'zh-HK' ? item.textZh : item.textEn}
                      </dt>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10" data-testid="section-transport-tips">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Car className="h-6 w-6 text-purple-500" />
            {language === 'zh-HK' ? '運送途中提示' : 'During Transport Tips'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm">
                  {language === 'zh-HK' ? '將寵物放在籠中或繫好牽繩' : 'Keep pet in carrier or on leash'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Wind className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm">
                  {language === 'zh-HK' ? '保持車內涼爽/通風' : 'Keep car cool/ventilated'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm">
                  {language === 'zh-HK' ? '輕聲說話以減少壓力' : 'Speak calmly to reduce stress'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm">
                  {language === 'zh-HK' ? '留意症狀的任何變化' : 'Note any changes in symptoms'}
                </span>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-10" data-testid="section-at-hospital">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            {language === 'zh-HK' ? '到達醫院後' : 'At the Hospital'}
          </h2>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'zh-HK' ? '保持冷靜，清晰提供資訊' : 'Stay calm and provide information clearly'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'zh-HK' ? '詢問診斷和治療選項' : 'Ask questions about diagnosis and treatment options'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'zh-HK' ? '在進行程序前獲取費用估算' : 'Get estimated costs before procedures'}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <Save className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'zh-HK' ? '儲存急診獸醫聯絡方式以備將來使用' : 'Save emergency vet contact for future'}
                </span>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-10" data-testid="section-faq">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-500" />
            {language === 'zh-HK' ? '常見問題' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <Card key={faq.id} data-testid={`faq-${faq.id}`}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    {language === 'zh-HK' ? faq.questionZh : faq.questionEn}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {language === 'zh-HK' ? faq.answerZh : faq.answerEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-10" data-testid="section-cta">
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-3">
                {language === 'zh-HK' ? '需要立即尋找急診獸醫？' : 'Need to find an emergency vet now?'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {language === 'zh-HK'
                  ? '使用PetSOS快速聯繫香港24小時動物醫院'
                  : 'Use PetSOS to quickly reach 24-hour animal hospitals in Hong Kong'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/emergency">
                  <Button className="bg-red-600 hover:bg-red-700" data-testid="button-emergency">
                    {language === 'zh-HK' ? '發送緊急求助' : 'Send Emergency Request'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/hospitals">
                  <Button variant="outline" data-testid="button-hospitals">
                    {language === 'zh-HK' ? '查看24小時醫院' : 'View 24-Hour Hospitals'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p data-testid="text-last-reviewed">
              {language === 'zh-HK' 
                ? `最後審閱日期：${lastReviewed}`
                : `Last reviewed: ${lastReviewed}`
              }
            </p>
            <div className="flex gap-4">
              <Link href="/emergency-symptoms" className="hover:text-foreground transition-colors" data-testid="link-symptoms">
                {language === 'zh-HK' ? '緊急症狀指南' : 'Emergency Symptom Guide'}
              </Link>
              <Link href="/hospitals" className="hover:text-foreground transition-colors" data-testid="link-hospitals">
                {language === 'zh-HK' ? '24小時醫院目錄' : '24-Hour Hospital Directory'}
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
