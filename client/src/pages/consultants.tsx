import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Stethoscope, 
  Shield, 
  Building2, 
  Calendar,
  FileCheck,
  ExternalLink,
  Users,
  Award
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import type { VetConsultantWithContent } from "@shared/schema";
import { format } from "date-fns";

export default function ConsultantsPage() {
  const { language } = useLanguage();

  const { data: consultants, isLoading, error } = useQuery<VetConsultantWithContent[]>({
    queryKey: ["/api/consultants"],
  });

  const createMedicalOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": language === 'zh-HK' ? "PetSOS醫療顧問委員會" : "PetSOS Medical Advisory Board",
    "alternateName": "PetSOS Medical Advisory Board",
    "url": "https://petsos.site/consultants",
    "description": language === 'zh-HK'
      ? "PetSOS醫療顧問委員會由資深註冊獸醫組成，負責審核及驗證平台上的所有醫療內容。"
      : "The PetSOS Medical Advisory Board consists of experienced registered veterinarians who review and verify all medical content on the platform.",
    "medicalSpecialty": "VeterinaryMedicine",
    "member": consultants?.map(consultant => ({
      "@type": "Person",
      "name": language === 'zh-HK' ? consultant.nameZh || consultant.nameEn : consultant.nameEn,
      "jobTitle": language === 'zh-HK' ? consultant.titleZh || consultant.titleEn : consultant.titleEn,
      "worksFor": {
        "@type": "VeterinaryHospital",
        "name": language === 'zh-HK' 
          ? consultant.hospitalAffiliationZh || consultant.hospitalAffiliationEn 
          : consultant.hospitalAffiliationEn
      }
    })) || []
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
        "name": language === 'zh-HK' ? "醫療顧問委員會" : "Medical Advisory Board",
        "item": "https://petsos.site/consultants"
      }
    ]
  });

  const formatVerificationDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'MMM yyyy');
    } catch {
      return '';
    }
  };

  const getInitials = (nameEn: string, nameZh?: string | null) => {
    if (language === 'zh-HK' && nameZh) {
      return nameZh.charAt(0);
    }
    return nameEn.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "醫療顧問委員會 | PetSOS 獸醫專家團隊"
          : "Medical Advisory Board | PetSOS Veterinary Expert Team"
        }
        description={language === 'zh-HK'
          ? "認識PetSOS醫療顧問委員會的獸醫專家，他們負責審核及驗證平台上的所有醫療內容，確保資訊準確可靠。"
          : "Meet the veterinary experts on the PetSOS Medical Advisory Board who review and verify all medical content on the platform to ensure accuracy and reliability."
        }
        keywords={language === 'zh-HK'
          ? "PetSOS醫療顧問, 獸醫專家, 醫療顧問委員會, 內容驗證, 寵物醫療, 香港獸醫"
          : "PetSOS medical advisory, veterinary experts, medical advisory board, content verification, pet healthcare, Hong Kong veterinarians"
        }
        canonical="https://petsos.site/consultants"
        language={language}
      />
      <StructuredData data={createMedicalOrganizationSchema()} id="schema-medical-advisory-board" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb-consultants" />

      <header className="border-b border-border bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '醫療顧問委員會' : 'Medical Advisory Board'}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '認識我們的獸醫專家團隊 — 他們負責審核及驗證PetSOS平台上的所有醫療內容，確保資訊準確可靠。'
              : 'Meet our veterinary expert team — they review and verify all medical content on PetSOS to ensure accuracy and reliability.'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-8 border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-foreground mb-2">
                  {language === 'zh-HK' ? '🔬 專業內容驗證' : '🔬 Professional Content Verification'}
                </h2>
                <p className="text-muted-foreground">
                  {language === 'zh-HK'
                    ? '我們的醫療顧問委員會成員均為持牌註冊獸醫，他們審核PetSOS平台上的緊急症狀指南、急救建議及其他醫療相關內容。每項經驗證的內容都會顯示驗證者資訊及驗證日期。'
                    : 'Our Medical Advisory Board members are all licensed registered veterinarians who review emergency symptom guides, first aid advice, and other medical content on PetSOS. Each verified piece of content displays the verifier information and verification date.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2" data-testid="loading-consultants">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="p-6 border-red-200 dark:border-red-900" data-testid="error-consultants">
            <p className="text-center text-red-600">
              {language === 'zh-HK' 
                ? '無法載入顧問資料，請稍後再試。'
                : 'Failed to load consultants. Please try again later.'
              }
            </p>
          </Card>
        )}

        {consultants && consultants.length === 0 && (
          <Card className="p-8 text-center" data-testid="empty-consultants">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {language === 'zh-HK' 
                ? '顧問委員會成員資料即將公佈。'
                : 'Advisory board member information coming soon.'
              }
            </p>
          </Card>
        )}

        {consultants && consultants.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2" data-testid="consultants-grid">
            {consultants.map((consultant) => (
              <Card 
                key={consultant.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`card-consultant-${consultant.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 border-2 border-blue-100">
                      <AvatarImage src={consultant.photoUrl || undefined} alt={consultant.nameEn} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                        {getInitials(consultant.nameEn, consultant.nameZh)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate" data-testid={`text-name-${consultant.id}`}>
                        {language === 'zh-HK' ? consultant.nameZh || consultant.nameEn : consultant.nameEn}
                      </h3>
                      {(consultant.nameZh && language !== 'zh-HK') && (
                        <p className="text-sm text-muted-foreground">{consultant.nameZh}</p>
                      )}
                      {(consultant.nameEn && language === 'zh-HK' && consultant.nameZh) && (
                        <p className="text-sm text-muted-foreground">{consultant.nameEn}</p>
                      )}
                      <Badge variant="secondary" className="mt-1">
                        <Award className="h-3 w-3 mr-1" />
                        {language === 'zh-HK' ? consultant.titleZh || consultant.titleEn : consultant.titleEn}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(consultant.specialtyEn || consultant.specialtyZh) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">
                          {language === 'zh-HK' 
                            ? consultant.specialtyZh || consultant.specialtyEn 
                            : consultant.specialtyEn}
                        </span>
                      </div>
                    )}
                    {(consultant.hospitalAffiliationEn || consultant.hospitalAffiliationZh) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">
                          {language === 'zh-HK' 
                            ? consultant.hospitalAffiliationZh || consultant.hospitalAffiliationEn 
                            : consultant.hospitalAffiliationEn}
                        </span>
                      </div>
                    )}
                    {consultant.yearsExperience && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">
                          {language === 'zh-HK' 
                            ? `${consultant.yearsExperience} 年經驗`
                            : `${consultant.yearsExperience} years experience`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {consultant.verifiedContent && consultant.verifiedContent.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        {language === 'zh-HK' ? '已驗證內容' : 'Verified Content'}
                      </h4>
                      <ul className="space-y-1">
                        {consultant.verifiedContent.slice(0, 5).map((content, idx) => (
                          <li key={content.contentSlug || idx} className="text-sm">
                            {content.url ? (
                              <Link 
                                href={content.url}
                                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                data-testid={`link-content-${content.contentSlug}`}
                              >
                                {language === 'zh-HK' 
                                  ? content.titleZh || content.titleEn 
                                  : content.titleEn}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-foreground">
                                {language === 'zh-HK' 
                                  ? content.titleZh || content.titleEn 
                                  : content.titleEn}
                              </span>
                            )}
                            {content.verifiedAt && (
                              <span className="text-muted-foreground text-xs ml-2">
                                ({formatVerificationDate(content.verifiedAt)})
                              </span>
                            )}
                          </li>
                        ))}
                        {consultant.verifiedContent.length > 5 && (
                          <li className="text-sm text-muted-foreground">
                            {language === 'zh-HK' 
                              ? `還有 ${consultant.verifiedContent.length - 5} 項...`
                              : `+${consultant.verifiedContent.length - 5} more...`
                            }
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-foreground mb-3" data-testid="text-join-cta">
              {language === 'zh-HK' ? '想加入我們？' : 'Want to join us?'}
            </h2>
            <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
              {language === 'zh-HK'
                ? '如果您是持牌獸醫並希望為香港寵物主人提供專業支援，歡迎申請加入PetSOS醫療顧問委員會。'
                : 'If you are a licensed veterinarian and would like to provide professional support to pet owners in Hong Kong, apply to join the PetSOS Medical Advisory Board.'
              }
            </p>
            <Link href="/medical-advisory#apply">
              <Button size="lg" className="bg-green-600 hover:bg-green-700" data-testid="button-apply">
                <Stethoscope className="h-5 w-5 mr-2" />
                {language === 'zh-HK' ? '了解更多及申請' : 'Learn More & Apply'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/verification-process">
            <Button variant="outline" data-testid="link-verification-process">
              <Shield className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '了解我們的驗證流程' : 'Learn about our verification process'}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
