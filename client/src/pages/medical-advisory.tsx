import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope, 
  Shield, 
  BookOpen, 
  Users, 
  CheckCircle,
  AlertTriangle,
  FileText,
  GraduationCap,
  Building2
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

export default function MedicalAdvisoryPage() {
  const { language } = useLanguage();

  const createMedicalOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "PetSOS Medical Advisory",
    "alternateName": language === 'zh-HK' ? "PetSOS醫療顧問" : "PetSOS Medical Advisory",
    "url": "https://petsos.site/medical-advisory",
    "description": language === 'zh-HK'
      ? "PetSOS的醫療內容由註冊獸醫審閱，並參考國際獸醫標準制定。"
      : "PetSOS medical content is reviewed by registered veterinarians and developed according to international veterinary standards.",
    "medicalSpecialty": "VeterinaryMedicine",
    "isAccreditedBy": {
      "@type": "Organization",
      "name": "Veterinary Surgeons Board of Hong Kong"
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
        "name": language === 'zh-HK' ? "醫療顧問" : "Medical Advisory",
        "item": "https://petsos.site/medical-advisory"
      }
    ]
  });

  const medicalSources = [
    {
      nameEn: "Veterinary Surgeons Board of Hong Kong (VSB)",
      nameZh: "香港獸醫管理局 (VSB)",
      descEn: "Official regulatory body for veterinary practice in Hong Kong",
      descZh: "香港獸醫執業的官方監管機構",
      icon: Building2
    },
    {
      nameEn: "World Small Animal Veterinary Association (WSAVA)",
      nameZh: "世界小動物獸醫協會 (WSAVA)",
      descEn: "Global veterinary standards and emergency care guidelines",
      descZh: "全球獸醫標準和緊急護理指南",
      icon: GraduationCap
    },
    {
      nameEn: "American Veterinary Medical Association (AVMA)",
      nameZh: "美國獸醫協會 (AVMA)",
      descEn: "Emergency first aid protocols and triage guidelines",
      descZh: "緊急急救協議和分診指南",
      icon: Stethoscope
    },
    {
      nameEn: "Hong Kong Veterinary Association (HKVA)",
      nameZh: "香港獸醫學會 (HKVA)",
      descEn: "Local veterinary practice standards and professional guidelines",
      descZh: "本地獸醫執業標準和專業指南",
      icon: Users
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "醫療顧問 | PetSOS 獸醫專業標準"
          : "Medical Advisory | PetSOS Veterinary Professional Standards"
        }
        description={language === 'zh-HK'
          ? "PetSOS的緊急分診流程和醫療內容參考國際獸醫標準制定，包括VSB、WSAVA、AVMA等專業機構指引。"
          : "PetSOS emergency triage and medical content follows international veterinary standards including VSB, WSAVA, AVMA and other professional guidelines."
        }
        keywords={language === 'zh-HK'
          ? "PetSOS醫療顧問, 獸醫標準, 緊急分診, VSB香港, 獸醫專業, 寵物急救指南"
          : "PetSOS medical advisory, veterinary standards, emergency triage, VSB Hong Kong, veterinary professional, pet first aid guidelines"
        }
        canonical="https://petsos.site/medical-advisory"
        language={language}
      />
      <StructuredData data={createMedicalOrganizationSchema()} id="schema-medical-org" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb-medical" />

      <header className="border-b border-border bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '醫療顧問' : 'Medical Advisory'}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '我們的醫療內容標準與專業來源'
              : 'Our Medical Content Standards and Professional Sources'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                  {language === 'zh-HK' ? '⚠️ 重要聲明' : '⚠️ Important Disclaimer'}
                </h2>
                <p className="text-amber-800 dark:text-amber-200">
                  {language === 'zh-HK'
                    ? 'PetSOS是一個緊急連接平台，不提供獸醫診斷或治療建議。本平台的所有內容僅供參考，不能取代專業獸醫的診斷。如有緊急情況，請立即聯絡24小時獸醫診所。'
                    : 'PetSOS is an emergency connection platform and does not provide veterinary diagnosis or treatment advice. All content on this platform is for reference only and cannot replace professional veterinary diagnosis. For emergencies, please contact a 24-hour veterinary clinic immediately.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2" data-testid="text-methodology-title">
              <Shield className="h-6 w-6 text-blue-600" />
              {language === 'zh-HK' ? '內容審核方法' : 'Content Review Methodology'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'zh-HK'
                ? 'PetSOS的所有醫療相關內容（包括緊急症狀清單、分診流程和急救建議）都經過嚴格的審核流程：'
                : 'All medical-related content on PetSOS (including emergency symptom lists, triage flow, and first aid advice) undergoes a rigorous review process:'
              }
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '參考國際標準' : 'Reference International Standards'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '所有內容基於WSAVA、AVMA等國際獸醫機構發布的指南' : 'All content based on guidelines published by WSAVA, AVMA and other international veterinary bodies'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '本地化審查' : 'Localization Review'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '根據香港VSB標準和本地獸醫執業環境調整內容' : 'Content adapted according to Hong Kong VSB standards and local veterinary practice environment'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '專業審閱' : 'Professional Review'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '邀請香港註冊獸醫審閱緊急分診流程和症狀描述' : 'Hong Kong registered veterinarians review emergency triage flow and symptom descriptions'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {language === 'zh-HK' ? '定期更新' : 'Regular Updates'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? '持續監測最新獸醫指南並相應更新內容' : 'Continuously monitor latest veterinary guidelines and update content accordingly'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="apply" className="mb-8 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2" data-testid="text-advisory-title">
              <Users className="h-6 w-6 text-green-600" />
              {language === 'zh-HK' ? '成為我們的獸醫顧問' : 'Become a Vet Consultant'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'zh-HK'
                ? 'PetSOS歡迎香港註冊獸醫加入我們的醫療顧問委員會，協助審核平台內容並確保專業性和準確性。'
                : 'PetSOS welcomes Hong Kong registered veterinarians to join our Medical Advisory Board to help review platform content and ensure professionalism and accuracy.'
              }
            </p>
            
            {/* Requirements */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-800 mb-4">
              <h4 className="font-semibold text-foreground mb-3">
                {language === 'zh-HK' ? '📋 申請資格' : '📋 Requirements'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{language === 'zh-HK' ? '必須為香港獸醫管理局 (VSB) 註冊獸醫' : 'Must be registered with Hong Kong Veterinary Surgeons Board (VSB)'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{language === 'zh-HK' ? '至少3年臨床經驗' : 'At least 3 years of clinical experience'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{language === 'zh-HK' ? '願意以專業身份公開審核內容' : 'Willing to publicly endorse verified content with professional identity'}</span>
                </li>
              </ul>
            </div>

            {/* Responsibilities */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-800 mb-4">
              <h4 className="font-semibold text-foreground mb-3">
                {language === 'zh-HK' ? '🏥 顧問職責' : '🏥 Advisor Responsibilities'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{language === 'zh-HK' ? '審閱緊急症狀指南和分診內容' : 'Review emergency symptom guides and triage content'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{language === 'zh-HK' ? '提供專業建議以改善平台服務' : 'Provide professional advice to improve platform services'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{language === 'zh-HK' ? '協助確保內容符合最新獸醫標準' : 'Help ensure content meets latest veterinary standards'}</span>
                </li>
              </ul>
            </div>

            {/* Application Process */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-800 mb-6">
              <h4 className="font-semibold text-foreground mb-3">
                {language === 'zh-HK' ? '✉️ 申請方法' : '✉️ How to Apply'}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'zh-HK'
                  ? '請將以下資料發送至我們的電郵：'
                  : 'Please send the following information to our email:'
                }
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                <li>• {language === 'zh-HK' ? '您的履歷 / CV' : 'Your CV'}</li>
                <li>• {language === 'zh-HK' ? 'VSB 註冊編號' : 'VSB Registration Number'}</li>
                <li>• {language === 'zh-HK' ? '專業領域（如有）' : 'Specialty (if applicable)'}</li>
                <li>• {language === 'zh-HK' ? '簡短介紹為何有興趣加入' : 'Brief introduction on why you are interested'}</li>
              </ul>
              <a 
                href="mailto:veterinary@petsos.site?subject=Vet%20Consultant%20Application%20獸醫顧問申請"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                data-testid="link-apply-email"
              >
                <FileText className="h-4 w-4" />
                {language === 'zh-HK' ? '發送申請至 veterinary@petsos.site' : 'Email veterinary@petsos.site'}
              </a>
            </div>

            {/* View Current Consultants */}
            <div className="flex flex-wrap gap-3">
              <Link href="/consultants">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <Users className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '查看現有顧問' : 'View Current Consultants'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2" data-testid="text-sources-title">
          <BookOpen className="h-6 w-6 text-blue-600" />
          {language === 'zh-HK' ? '參考來源' : 'Reference Sources'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {medicalSources.map((source, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full flex-shrink-0">
                  <source.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">
                    {language === 'zh-HK' ? source.nameZh : source.nameEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'zh-HK' ? source.descZh : source.descEn}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2" data-testid="text-triage-title">
              <FileText className="h-6 w-6 text-red-600" />
              {language === 'zh-HK' ? '緊急分診流程基礎' : 'Emergency Triage Flow Basis'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'zh-HK'
                ? 'PetSOS的緊急症狀分類和優先級評估基於以下標準：'
                : 'PetSOS emergency symptom classification and priority assessment is based on the following standards:'
              }
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? 'WSAVA 獸醫急診分診指南' : 'WSAVA Veterinary Emergency Triage Guidelines'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? 'AVMA 寵物急救優先級協議' : 'AVMA Pet First Aid Priority Protocols'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? 'RECOVER CPR 倡議指南（心肺復甦）' : 'RECOVER CPR Initiative Guidelines'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{language === 'zh-HK' ? 'VSB 香港獸醫執業標準' : 'VSB Hong Kong Veterinary Practice Standards'}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/verification-process">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Shield className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '了解核實流程' : 'Learn About Verification'}
            </Button>
          </Link>
          <Link href="/emergency-symptoms">
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '緊急症狀指南' : 'Emergency Symptom Guide'}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
