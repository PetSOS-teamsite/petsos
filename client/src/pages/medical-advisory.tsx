import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { 
  Stethoscope, 
  Shield, 
  Users, 
  CheckCircle,
  AlertTriangle,
  FileText,
  GraduationCap,
  Building2,
  Loader2,
  Clock
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const roleOptions = ['vet', 'nurse', 'practice_manager', 'other'] as const;
const vetTypeOptions = ['GP', 'Specialist', 'GP_with_interest'] as const;
const verificationScopeOptions = ['clarity', 'emergency_discovery', 'safety_messaging'] as const;
const futureContactOptions = ['reviewing_guides', 'cpd_sessions', 'workshops', 'videos', 'community_education', 'not_now'] as const;

const vetApplicationFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(roleOptions, { required_error: "Please select your role" }),
  vetType: z.enum(vetTypeOptions).optional(),
  clinicName: z.string().min(1, "Primary Clinic / Organisation is required"),
  phoneWhatsapp: z.string().min(1, "WhatsApp / Phone number is required"),
  email: z.string().email("Please enter a valid email").min(1, "Email is required"),
  educationBackground: z.string().optional(),
  verificationScope: z.array(z.enum(verificationScopeOptions)).min(1, "Please select at least one verification scope"),
  consentAcknowledged: z.literal(true, { errorMap: () => ({ message: "You must acknowledge this statement" }) }),
  futureContactInterest: z.array(z.enum(futureContactOptions)).optional(),
  additionalComments: z.string().optional(),
}).refine((data) => {
  if (data.role === 'vet' && !data.vetType) {
    return false;
  }
  return true;
}, {
  message: "Please select your vet type",
  path: ["vetType"],
});

type VetApplicationFormData = z.infer<typeof vetApplicationFormSchema>;

export default function MedicalAdvisoryPage() {
  const { language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<VetApplicationFormData>({
    resolver: zodResolver(vetApplicationFormSchema),
    defaultValues: {
      fullName: "",
      role: undefined,
      vetType: undefined,
      clinicName: "",
      phoneWhatsapp: "",
      email: "",
      educationBackground: "",
      verificationScope: [],
      consentAcknowledged: undefined as unknown as true,
      futureContactInterest: [],
      additionalComments: "",
    },
  });

  const watchRole = form.watch("role");

  const submitMutation = useMutation({
    mutationFn: async (data: VetApplicationFormData) => {
      const payload = {
        ...data,
        consentVersion: 'v1',
      };
      const response = await apiRequest("POST", "/api/vet-applications", payload);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
    },
  });

  const onSubmit = (data: VetApplicationFormData) => {
    submitMutation.mutate(data);
  };

  const labels = {
    formTitle: {
      en: "PetSOS – Veterinary Professional Verification & Interest Form",
      zh: "PetSOS – 獸醫專業驗證及意向表格"
    },
    formIntro: {
      en: "PetSOS is a non-profit pet emergency support platform.",
      zh: "PetSOS 是一個非牟利寵物緊急支援平台。"
    },
    formIntroPoints: {
      en: [
        "your professional background",
        "whether you're comfortable verifying our emergency support approach",
        "if you're open to future collaboration"
      ],
      zh: [
        "您的專業背景",
        "您是否願意驗證我們的緊急支援方式",
        "您是否有興趣日後合作"
      ]
    },
    formTime: {
      en: "Takes ~2–3 minutes.",
      zh: "約需 2–3 分鐘。"
    },
    sectionA: {
      en: "Section A — Professional Snapshot",
      zh: "第 A 部分 — 專業概況"
    },
    fullName: {
      en: "Full Name",
      zh: "全名"
    },
    role: {
      en: "Role",
      zh: "職位"
    },
    roleOptions: {
      vet: { en: "Veterinarian", zh: "獸醫" },
      nurse: { en: "Veterinary Nurse", zh: "獸醫護士" },
      practice_manager: { en: "Practice Manager", zh: "診所經理" },
      other: { en: "Other", zh: "其他" }
    },
    vetType: {
      en: "Vet Type",
      zh: "獸醫類型"
    },
    vetTypeOptions: {
      GP: { en: "General Practitioner (GP)", zh: "普通科醫生 (GP)" },
      Specialist: { en: "Specialist", zh: "專科醫生" },
      GP_with_interest: { en: "GP with special interest", zh: "具特別興趣的 GP" }
    },
    clinicName: {
      en: "Primary Clinic / Organisation",
      zh: "主要診所 / 機構"
    },
    phoneWhatsapp: {
      en: "WhatsApp / Phone Number",
      zh: "WhatsApp / 電話號碼"
    },
    email: {
      en: "Email (optional)",
      zh: "電郵（選填）"
    },
    sectionB: {
      en: "Section B — Background",
      zh: "第 B 部分 — 背景"
    },
    educationBackground: {
      en: "Education Background",
      zh: "教育背景"
    },
    educationPlaceholder: {
      en: "BVSc / DVM / VN Diploma / FANZCVS",
      zh: "BVSc / DVM / VN 文憑 / FANZCVS"
    },
    sectionC: {
      en: "Section C — Verification Scope (Must-Have)",
      zh: "第 C 部分 — 驗證範圍（必填）"
    },
    verificationScopeLabel: {
      en: "I'm comfortable supporting PetSOS in the following scope:",
      zh: "我願意在以下範圍支持 PetSOS："
    },
    verificationScopeOptions: {
      clarity: { 
        en: "Verifying clarity of emergency guidance (non-diagnostic)", 
        zh: "驗證緊急指引的清晰度（非診斷性）" 
      },
      emergency_discovery: { 
        en: "Emergency discovery & clinic connection concept", 
        zh: "緊急發現及診所連接概念" 
      },
      safety_messaging: { 
        en: 'Safety-first "when to seek emergency care" messaging', 
        zh: '以安全為先的「何時尋求緊急護理」訊息' 
      }
    },
    acknowledgement: {
      en: "I understand this is not a medical diagnosis or treatment endorsement.",
      zh: "我明白這不是醫療診斷或治療背書。"
    },
    sectionD: {
      en: "Section D — Future Involvement (Optional)",
      zh: "第 D 部分 — 未來參與（選填）"
    },
    futureContactLabel: {
      en: "I'm open to being contacted in the future about:",
      zh: "我願意日後就以下事項聯繫："
    },
    futureContactOptions: {
      reviewing_guides: { en: "Reviewing emergency guide messages", zh: "審閱緊急指引訊息" },
      cpd_sessions: { en: "CPD / peer education sessions", zh: "CPD / 同儕教育課程" },
      workshops: { en: "Emergency workshops (vet / nurse / owner)", zh: "緊急工作坊（獸醫 / 護士 / 主人）" },
      videos: { en: "Education videos or posts", zh: "教育影片或貼文" },
      community_education: { en: "Community / shelter emergency education", zh: "社區 / 收容所緊急教育" },
      not_now: { en: "Not at the moment", zh: "暫時不需要" }
    },
    sectionE: {
      en: "Section E — Close",
      zh: "第 E 部分 — 結語"
    },
    additionalComments: {
      en: "Anything you'd like us to know?",
      zh: "有什麼想讓我們知道的嗎？"
    },
    submitButton: {
      en: "Submit Application",
      zh: "提交申請"
    },
    successMessage: {
      en: "Thank you for supporting a community-first emergency initiative 🐾 Our team may reach out via WhatsApp if you've indicated interest above.",
      zh: "感謝您支持以社區為先的緊急倡議 🐾 如果您在上方表示有興趣，我們的團隊可能會透過 WhatsApp 聯繫您。"
    },
    errorMessage: {
      en: "Submission failed. Please try again later.",
      zh: "提交失敗，請稍後再試。"
    },
    required: {
      en: "(required)",
      zh: "（必填）"
    },
    optional: {
      en: "(optional)",
      zh: "（選填）"
    }
  };

  const t = (key: keyof typeof labels) => {
    const label = labels[key];
    return language === 'zh-HK' ? label.zh : label.en;
  };

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

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-800 mb-6">
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-6">
                <FileText className="h-4 w-4 text-green-600" />
                {t('formTitle')}
              </h4>
              {submitted ? (
                <div className="p-6 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-400 dark:border-green-700" data-testid="text-success-message">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-green-800 dark:text-green-200 font-medium">
                      {t('successMessage')}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-foreground mb-3">{t('formIntro')}</p>
                    <p className="text-muted-foreground text-sm mb-2">
                      {language === 'zh-HK' ? '這份簡短表格幫助我們了解：' : 'This short form helps us understand:'}
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3">
                      {(language === 'zh-HK' ? labels.formIntroPoints.zh : labels.formIntroPoints.en).map((point, i) => (
                        <li key={i}>• {point}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ⏱ {t('formTime')}
                    </p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {submitMutation.isError && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-400 dark:border-red-700" data-testid="text-error-message">
                          <p className="text-red-800 dark:text-red-200 text-sm">
                            {t('errorMessage')}
                          </p>
                        </div>
                      )}

                      {/* SECTION A - Professional Snapshot */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2" data-testid="text-section-a">
                          {t('sectionA')}
                        </h3>

                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('fullName')} *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={language === 'zh-HK' ? '請輸入全名' : 'Enter your full name'}
                                  data-testid="input-full-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('role')} *</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-2"
                                  data-testid="radio-group-role"
                                >
                                  {roleOptions.map((role) => (
                                    <div key={role} className="flex items-center space-x-2">
                                      <RadioGroupItem value={role} id={`role-${role}`} data-testid={`radio-role-${role}`} />
                                      <label htmlFor={`role-${role}`} className="text-sm cursor-pointer">
                                        {language === 'zh-HK' 
                                          ? labels.roleOptions[role].zh 
                                          : labels.roleOptions[role].en}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchRole === 'vet' && (
                          <FormField
                            control={form.control}
                            name="vetType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('vetType')} *</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex flex-col space-y-2"
                                    data-testid="radio-group-vet-type"
                                  >
                                    {vetTypeOptions.map((vetType) => (
                                      <div key={vetType} className="flex items-center space-x-2">
                                        <RadioGroupItem value={vetType} id={`vetType-${vetType}`} data-testid={`radio-vet-type-${vetType}`} />
                                        <label htmlFor={`vetType-${vetType}`} className="text-sm cursor-pointer">
                                          {language === 'zh-HK' 
                                            ? labels.vetTypeOptions[vetType].zh 
                                            : labels.vetTypeOptions[vetType].en}
                                        </label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="clinicName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('clinicName')} *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={language === 'zh-HK' ? '請輸入診所或機構名稱' : 'Enter clinic or organisation name'}
                                  data-testid="input-clinic-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phoneWhatsapp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('phoneWhatsapp')} *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={language === 'zh-HK' ? '例如：+852 9123 4567' : 'e.g., +852 9123 4567'}
                                  data-testid="input-phone-whatsapp"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('email')}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder={language === 'zh-HK' ? '請輸入電郵地址' : 'Enter your email address'}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* SECTION B - Background */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2" data-testid="text-section-b">
                          {t('sectionB')}
                        </h3>

                        <FormField
                          control={form.control}
                          name="educationBackground"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('educationBackground')} {t('optional')}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={language === 'zh-HK' ? labels.educationPlaceholder.zh : labels.educationPlaceholder.en}
                                  data-testid="input-education-background"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* SECTION C - Verification Scope */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2" data-testid="text-section-c">
                          {t('sectionC')}
                        </h3>

                        <FormField
                          control={form.control}
                          name="verificationScope"
                          render={() => (
                            <FormItem>
                              <FormLabel>{t('verificationScopeLabel')} *</FormLabel>
                              <div className="space-y-3 mt-2">
                                {verificationScopeOptions.map((option) => (
                                  <FormField
                                    key={option}
                                    control={form.control}
                                    name="verificationScope"
                                    render={({ field }) => (
                                      <FormItem className="flex items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(option)}
                                            onCheckedChange={(checked) => {
                                              const newValue = checked
                                                ? [...(field.value || []), option]
                                                : field.value?.filter((v) => v !== option) || [];
                                              field.onChange(newValue);
                                            }}
                                            data-testid={`checkbox-verification-${option}`}
                                          />
                                        </FormControl>
                                        <label className="text-sm cursor-pointer leading-relaxed">
                                          {language === 'zh-HK' 
                                            ? labels.verificationScopeOptions[option].zh 
                                            : labels.verificationScopeOptions[option].en}
                                        </label>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="consentAcknowledged"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                              <FormControl>
                                <Checkbox
                                  checked={field.value === true}
                                  onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                                  data-testid="checkbox-consent"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <label className="text-sm font-medium cursor-pointer">
                                  {t('acknowledgement')} *
                                </label>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* SECTION D - Future Involvement */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2" data-testid="text-section-d">
                          {t('sectionD')}
                        </h3>

                        <FormField
                          control={form.control}
                          name="futureContactInterest"
                          render={() => (
                            <FormItem>
                              <FormLabel>{t('futureContactLabel')}</FormLabel>
                              <div className="space-y-3 mt-2">
                                {futureContactOptions.map((option) => (
                                  <FormField
                                    key={option}
                                    control={form.control}
                                    name="futureContactInterest"
                                    render={({ field }) => (
                                      <FormItem className="flex items-start space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(option)}
                                            onCheckedChange={(checked) => {
                                              const newValue = checked
                                                ? [...(field.value || []), option]
                                                : field.value?.filter((v) => v !== option) || [];
                                              field.onChange(newValue);
                                            }}
                                            data-testid={`checkbox-future-${option}`}
                                          />
                                        </FormControl>
                                        <label className="text-sm cursor-pointer">
                                          {language === 'zh-HK' 
                                            ? labels.futureContactOptions[option].zh 
                                            : labels.futureContactOptions[option].en}
                                        </label>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* SECTION E - Close */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2" data-testid="text-section-e">
                          {t('sectionE')}
                        </h3>

                        <FormField
                          control={form.control}
                          name="additionalComments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('additionalComments')} {t('optional')}</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={4}
                                  placeholder={language === 'zh-HK' ? '請在此分享任何想法或問題...' : 'Share any thoughts or questions here...'}
                                  data-testid="textarea-additional-comments"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={submitMutation.isPending}
                        data-testid="button-submit-application"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === 'zh-HK' ? '提交中...' : 'Submitting...'}
                          </>
                        ) : (
                          t('submitButton')
                        )}
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2" data-testid="text-sources-title">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              {language === 'zh-HK' ? '專業來源' : 'Professional Sources'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalSources.map((source, index) => {
                const IconComponent = source.icon;
                return (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border" data-testid={`card-source-${index}`}>
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {language === 'zh-HK' ? source.nameZh : source.nameEn}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'zh-HK' ? source.descZh : source.descEn}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
