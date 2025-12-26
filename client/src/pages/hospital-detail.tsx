import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Phone, MessageCircle, MapPin, Globe, Clock, 
  AlertCircle, CheckCircle, Info, Stethoscope, Activity,
  Siren, FlaskConical, Home, CreditCard, Navigation as NavigationIcon,
  Calendar, ChevronRight, ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { analytics } from "@/lib/analytics";
import { SEO } from "@/components/SEO";
import { StructuredData, createEnhancedHospitalSchema, createBreadcrumbSchema } from "@/components/StructuredData";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Hospital, HospitalConsultFee } from "@shared/schema";
import { format } from "date-fns";

export default function HospitalDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportNotes, setReportNotes] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { data: hospital, isLoading: hospitalLoading } = useQuery<Hospital>({
    queryKey: [`/api/hospitals/slug/${slug}`],
    enabled: !!slug,
  });

  const { data: consultFees, isLoading: feesLoading} = useQuery<HospitalConsultFee[]>({
    queryKey: [`/api/hospitals/${hospital?.id}/fees`],
    enabled: !!hospital?.id,
  });

  const { data: regions } = useQuery<Array<{ id: string; nameEn: string; nameZh: string }>>({
    queryKey: ["/api/regions"],
  });

  // Track page view
  useEffect(() => {
    if (hospital) {
      analytics.event('hospital_page_view', {
        event_category: 'Hospital',
        hospital_id: hospital.id,
        hospital_slug: hospital.slug,
        region: hospital.regionId,
        language: language,
      });
    }
  }, [hospital, language]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowBackToTop(false); // Hide button immediately
  };

  const reportMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      if (!hospital?.id) throw new Error("Hospital ID not found");
      return apiRequest("POST", `/api/hospitals/${hospital.id}/report`, {
        updateType: "info_correction",
        notes: data.notes,
      });
    },
    onSuccess: () => {
      analytics.event('hospital_report_submitted', {
        event_category: 'Hospital',
        hospital_id: hospital?.id,
        hospital_slug: hospital?.slug,
      });
      toast({
        title: language === 'zh-HK' ? "已提交報告" : "Report Submitted",
        description: language === 'zh-HK' 
          ? "謝謝您的反饋。我們會盡快審核。" 
          : "Thank you for your feedback. We'll review it shortly.",
      });
      setReportDialogOpen(false);
      setReportNotes("");
    },
    onError: () => {
      toast({
        title: language === 'zh-HK' ? "提交失敗" : "Submission Failed",
        description: language === 'zh-HK' 
          ? "無法提交報告，請稍後再試。" 
          : "Failed to submit report. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleCall = (phone: string | null) => {
    if (phone && hospital) {
      analytics.event('hospital_cta_click', {
        event_category: 'Hospital',
        type: 'call',
        hospital_id: hospital.id,
        hospital_slug: hospital.slug,
      });
      window.location.href = `tel:${phone}`;
    }
  };

  const handleWhatsApp = (whatsapp: string | null) => {
    if (whatsapp && hospital) {
      analytics.event('hospital_cta_click', {
        event_category: 'Hospital',
        type: 'whatsapp',
        hospital_id: hospital.id,
        hospital_slug: hospital.slug,
      });
      const cleanNumber = whatsapp.replace(/[^\d]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleMaps = () => {
    if (!hospital) return;
    analytics.event('hospital_cta_click', {
      event_category: 'Hospital',
      type: 'maps',
      hospital_id: hospital.id,
      hospital_slug: hospital.slug,
    });
    if (hospital.latitude && hospital.longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${hospital.latitude},${hospital.longitude}`;
      window.open(mapsUrl, '_blank');
    } else {
      const addressQuery = language === 'zh-HK' ? hospital.addressZh : hospital.addressEn;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handleReportSubmit = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    if (!reportNotes.trim()) {
      toast({
        title: language === 'zh-HK' ? "請輸入內容" : "Please enter details",
        description: language === 'zh-HK' 
          ? "請描述需要更正的資訊。" 
          : "Please describe what information needs to be corrected.",
        variant: "destructive",
      });
      return;
    }
    reportMutation.mutate({ notes: reportNotes });
  };

  if (hospitalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-not-found">
            {language === 'zh-HK' ? '找不到醫院' : 'Hospital Not Found'}
          </h1>
          <Link href="/hospitals">
            <Button variant="default" data-testid="button-back-list">
              {language === 'zh-HK' ? '返回列表' : 'Back to List'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const groupedFees = consultFees?.reduce((acc, fee) => {
    const key = fee.species;
    if (!acc[key]) acc[key] = [];
    acc[key].push(fee);
    return acc;
  }, {} as Record<string, HospitalConsultFee[]>);

  return (
    <>
      <SEO
        title={`${language === 'zh-HK' ? hospital.nameZh : hospital.nameEn} - ${language === 'zh-HK' ? '24小時動物醫院' : '24-Hour Animal Hospital'} - PetSOS`}
        description={`${language === 'zh-HK' ? hospital.nameZh : hospital.nameEn} - ${language === 'zh-HK' ? '診症費用、服務設施、聯絡資訊' : 'Consultation fees, facilities, and contact information'}`}
        canonical={`https://petsos.site/hospitals/${hospital.slug}`}
        language={language}
        alternateLanguages={{
          en: `https://petsos.site/hospitals/${hospital.slug}?lang=en`,
          'zh-HK': `https://petsos.site/hospitals/${hospital.slug}?lang=zh-HK`,
        }}
      />
      <StructuredData
        id={`hospital-${hospital.id}-enhanced-schema`}
        data={createEnhancedHospitalSchema({
          id: hospital.id,
          slug: hospital.slug,
          nameEn: hospital.nameEn,
          nameZh: hospital.nameZh,
          addressEn: hospital.addressEn,
          addressZh: hospital.addressZh,
          phone: hospital.phone,
          whatsapp: hospital.whatsapp,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          open247: hospital.open247,
          regionName: regions?.find(r => r.id === hospital.regionId)?.nameEn,
          specialistAvail: hospital.specialistAvail,
          lastVerifiedAt: hospital.lastVerifiedAt,
          minFee: consultFees && consultFees.length > 0 ? Math.min(...consultFees.filter(f => f.minFee).map(f => parseFloat(f.minFee!))) : null,
          maxFee: consultFees && consultFees.length > 0 ? Math.max(...consultFees.filter(f => f.maxFee).map(f => parseFloat(f.maxFee!))) : null,
          languages: hospital.languages,
          speciesAccepted: hospital.speciesAccepted,
        }, language)}
      />
      <StructuredData
        id={`hospital-${hospital.id}-breadcrumb`}
        data={createBreadcrumbSchema([
          { name: language === 'zh-HK' ? '首頁' : 'Home', url: 'https://petsos.site' },
          { name: language === 'zh-HK' ? '醫院' : 'Hospitals', url: 'https://petsos.site/hospitals' },
          { name: language === 'zh-HK' ? hospital.nameZh : hospital.nameEn, url: `https://petsos.site/hospitals/${hospital.slug}` },
        ])}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <Link href="/hospitals">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <LanguageSwitcher />
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb" data-testid="breadcrumb">
              <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                {language === 'zh-HK' ? '首頁' : 'Home'}
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Link href="/hospitals" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                {language === 'zh-HK' ? '醫院' : 'Hospitals'}
              </Link>
              {(() => {
                const region = regions?.find(r => r.id === hospital.regionId);
                if (region) {
                  return (
                    <>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? region.nameZh : region.nameEn}
                      </span>
                    </>
                  );
                }
                return null;
              })()}
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                {language === 'zh-HK' ? hospital.nameZh : hospital.nameEn}
              </span>
            </nav>
            
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-hospital-name">
                {language === 'zh-HK' ? hospital.nameZh : hospital.nameEn}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                <MapPin className="h-4 w-4" />
                <span className="text-sm" data-testid="text-hospital-address">
                  {language === 'zh-HK' ? hospital.addressZh : hospital.addressEn}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hospital.open247 && (
                  <Badge variant="default" className="bg-red-500" data-testid="badge-24-7">
                    24/7
                  </Badge>
                )}
                {hospital.liveStatus && (
                  <Badge 
                    variant={hospital.liveStatus === 'normal' ? 'default' : 'destructive'}
                    data-testid="badge-status"
                  >
                    {hospital.liveStatus === 'normal' ? (language === 'zh-HK' ? '正常' : 'Normal') :
                     hospital.liveStatus === 'busy' ? (language === 'zh-HK' ? '繁忙' : 'Busy') :
                     (language === 'zh-HK' ? '僅危急' : 'Critical Only')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Quick Facts */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" data-testid="text-quick-facts">
                  {language === 'zh-HK' ? '主要設施' : 'Key Facilities'}
                </CardTitle>
                {hospital.lastVerifiedAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400" data-testid="text-verified">
                    <CheckCircle className="h-3 w-3" />
                    {language === 'zh-HK' ? '核實於 ' : 'Verified '}
                    {format(new Date(hospital.lastVerifiedAt), 'yyyy-MM-dd')}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {hospital.icuLevel && (
                  <Badge variant="outline" data-testid="badge-icu">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    ICU {hospital.icuLevel}
                  </Badge>
                )}
                {hospital.imagingCT && (
                  <Badge variant="outline" data-testid="badge-ct">
                    CT {hospital.sameDayCT && (language === 'zh-HK' ? '(當日)' : '(Same Day)')}
                  </Badge>
                )}
                {hospital.imagingUS && (
                  <Badge variant="outline">
                    {language === 'zh-HK' ? '超聲波' : 'Ultrasound'}
                  </Badge>
                )}
                {hospital.imagingXray && (
                  <Badge variant="outline">
                    {language === 'zh-HK' ? 'X光' : 'X-Ray'}
                  </Badge>
                )}
                {hospital.nurse24h && (
                  <Badge variant="outline">
                    {language === 'zh-HK' ? '24小時護士' : '24H Nurse'}
                  </Badge>
                )}
                {hospital.parking && (
                  <Badge variant="outline" data-testid="badge-parking">
                    {language === 'zh-HK' ? '停車場' : 'Parking'}
                  </Badge>
                )}
                {hospital.wheelchairAccess && (
                  <Badge variant="outline" data-testid="badge-wheelchair">
                    ♿ {language === 'zh-HK' ? '無障礙通道' : 'Wheelchair Access'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(hospital.email || hospital.websiteUrl) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg" data-testid="text-contact-info">
                  {language === 'zh-HK' ? '聯絡資訊' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {hospital.email && (
                    <div className="flex items-center gap-3">
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                        {language === 'zh-HK' ? '電郵' : 'Email'}
                      </dt>
                      <dd>
                        <a 
                          href={`mailto:${hospital.email}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          data-testid="link-email"
                        >
                          {hospital.email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {hospital.websiteUrl && (
                    <div className="flex items-center gap-3">
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">
                        <Globe className="h-4 w-4 inline mr-1" />
                        {language === 'zh-HK' ? '網站' : 'Website'}
                      </dt>
                      <dd>
                        <a 
                          href={hospital.websiteUrl.startsWith('http') ? hospital.websiteUrl : `https://${hospital.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          data-testid="link-website"
                        >
                          {hospital.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Consultation Fees */}
          {!feesLoading && consultFees && consultFees.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg" data-testid="text-consult-fees">
                  {language === 'zh-HK' ? '診症費用參考' : 'Consultation Fees Reference'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh-HK' 
                    ? '僅供參考，最終收費以醫院為準' 
                    : 'For reference only; final charges determined by hospital'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(groupedFees || {}).map(([species, fees]) => (
                    <div key={species}>
                      <h4 className="font-medium mb-2" data-testid={`text-species-${species}`}>
                        {species === 'dog' ? (language === 'zh-HK' ? '狗' : 'Dog') :
                         species === 'cat' ? (language === 'zh-HK' ? '貓' : 'Cat') :
                         (language === 'zh-HK' ? '其他' : 'Other')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {fees.map((fee) => (
                          <div key={fee.id} className="border rounded-lg p-3" data-testid={`fee-${species}-${fee.feeType}`}>
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {fee.feeType === 'day' ? (language === 'zh-HK' ? '日間' : 'Day') :
                               fee.feeType === 'evening' ? (language === 'zh-HK' ? '晚間' : 'Evening') :
                               (language === 'zh-HK' ? '深夜/公眾假期' : 'Night/PH')}
                            </div>
                            <div className="text-lg font-bold">
                              {fee.currency} ${fee.minFee}
                              {fee.maxFee && fee.maxFee !== fee.minFee && ` - $${fee.maxFee}`}
                            </div>
                            {fee.notes && (
                              <div className="text-xs text-gray-500 mt-1">{fee.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Information - Accordion */}
          <Accordion type="multiple" defaultValue={["emergency"]} className="space-y-4">
            {/* Emergency & Triage */}
            <AccordionItem value="emergency" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-emergency">
                <div className="flex items-center gap-2">
                  <Siren className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">
                    {language === 'zh-HK' ? '緊急服務及分流' : 'Emergency Services & Triage'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-2">
                <dl className="space-y-3">
                  {hospital.onSiteVet247 !== null && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '24小時駐場獸醫' : '24/7 On-site Vet'}
                      </dt>
                      <dd className="mt-1 flex items-center gap-2">
                        {hospital.onSiteVet247 ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" /> {language === 'zh-HK' ? '是' : 'Yes'}</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> {language === 'zh-HK' ? '否' : 'No'}</>
                        )}
                      </dd>
                    </div>
                  )}
                  {hospital.triagePolicy && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '分流政策' : 'Triage Policy'}
                      </dt>
                      <dd className="mt-1">{hospital.triagePolicy}</dd>
                    </div>
                  )}
                  {hospital.typicalWaitBand && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '一般等候時間' : 'Typical Wait Time'}
                      </dt>
                      <dd className="mt-1">{hospital.typicalWaitBand}</dd>
                    </div>
                  )}
                  {hospital.whatsappTriage !== null && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? 'WhatsApp分流' : 'WhatsApp Triage'}
                      </dt>
                      <dd className="mt-1">{hospital.whatsappTriage ? (language === 'zh-HK' ? '提供' : 'Available') : (language === 'zh-HK' ? '不提供' : 'Not Available')}</dd>
                    </div>
                  )}
                  {hospital.ambulanceSupport !== null && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '救護車服務' : 'Ambulance Support'}
                      </dt>
                      <dd className="mt-1 flex items-center gap-2">
                        {hospital.ambulanceSupport ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" /> {language === 'zh-HK' ? '有' : 'Available'}</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> {language === 'zh-HK' ? '無' : 'Not Available'}</>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </AccordionContent>
            </AccordionItem>

            {/* Diagnostics */}
            {(hospital.imagingXray || hospital.imagingUS || hospital.imagingCT || hospital.inHouseLab) && (
              <AccordionItem value="diagnostics" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-diagnostics">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '診斷設施' : 'Diagnostic Facilities'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {language === 'zh-HK' ? '影像檢查' : 'Imaging'}
                      </dt>
                      <dd className="flex flex-wrap gap-2">
                        {hospital.imagingXray && <Badge variant="outline">{language === 'zh-HK' ? 'X光' : 'X-Ray'}</Badge>}
                        {hospital.imagingUS && <Badge variant="outline">{language === 'zh-HK' ? '超聲波' : 'Ultrasound'}</Badge>}
                        {hospital.imagingCT && <Badge variant="outline">CT {hospital.sameDayCT && `(${language === 'zh-HK' ? '當日' : 'Same Day'})`}</Badge>}
                        {hospital.imagingMRI && <Badge variant="outline">{language === 'zh-HK' ? 'MRI磁力共振' : 'MRI'}</Badge>}
                        {hospital.endoscopy && <Badge variant="outline">{language === 'zh-HK' ? '內視鏡' : 'Endoscopy'}</Badge>}
                      </dd>
                    </div>
                    {hospital.inHouseLab !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '院內化驗室' : 'In-house Laboratory'}
                        </dt>
                        <dd className="mt-1">{hospital.inHouseLab ? (language === 'zh-HK' ? '有' : 'Yes') : (language === 'zh-HK' ? '無' : 'No')}</dd>
                      </div>
                    )}
                    {hospital.extLabCutoff && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '外送化驗截止時間' : 'External Lab Cutoff'}
                        </dt>
                        <dd className="mt-1">{hospital.extLabCutoff}</dd>
                      </div>
                    )}
                    {hospital.bloodBankAccess && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '血庫使用' : 'Blood Bank Access'}
                        </dt>
                        <dd className="mt-1">{hospital.bloodBankAccess}</dd>
                      </div>
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Life Support Equipment */}
            {(hospital.oxygenTherapy || hospital.ventilator || hospital.bloodTransfusion || hospital.dialysis || hospital.defibrillator) && (
              <AccordionItem value="life-support" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-life-support">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '生命支援設備' : 'Life Support Equipment'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {hospital.oxygenTherapy && (
                      <Badge variant="outline" data-testid="badge-oxygen">
                        {language === 'zh-HK' ? '氧氣治療' : 'Oxygen Therapy'}
                      </Badge>
                    )}
                    {hospital.ventilator && (
                      <Badge variant="outline" data-testid="badge-ventilator">
                        {language === 'zh-HK' ? '呼吸機' : 'Ventilator'}
                      </Badge>
                    )}
                    {hospital.bloodTransfusion && (
                      <Badge variant="outline" data-testid="badge-blood-transfusion">
                        {language === 'zh-HK' ? '輸血服務' : 'Blood Transfusion'}
                      </Badge>
                    )}
                    {hospital.dialysis && (
                      <Badge variant="outline" data-testid="badge-dialysis">
                        {language === 'zh-HK' ? '透析/腎臟支援' : 'Dialysis'}
                      </Badge>
                    )}
                    {hospital.defibrillator && (
                      <Badge variant="outline" data-testid="badge-defibrillator">
                        {language === 'zh-HK' ? '除顫器/AED' : 'Defibrillator/AED'}
                      </Badge>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Surgery Capabilities */}
            {(hospital.sxEmergencySoft || hospital.sxEmergencyOrtho || hospital.anaesMonitoring) && (
              <AccordionItem value="surgery" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-surgery">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '手術能力' : 'Surgery Capabilities'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {hospital.sxEmergencySoft && (
                        <Badge variant="outline" data-testid="badge-surgery-soft">
                          {language === 'zh-HK' ? '緊急軟組織手術' : 'Emergency Soft Tissue Surgery'}
                        </Badge>
                      )}
                      {hospital.sxEmergencyOrtho && (
                        <Badge variant="outline" data-testid="badge-surgery-ortho">
                          {language === 'zh-HK' ? '緊急骨科手術' : 'Emergency Orthopedic Surgery'}
                        </Badge>
                      )}
                    </div>
                    {hospital.anaesMonitoring && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '麻醉監測' : 'Anesthesia Monitoring'}
                        </dt>
                        <dd className="mt-1">{hospital.anaesMonitoring}</dd>
                      </div>
                    )}
                    {hospital.specialistAvail && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '專科醫生' : 'Specialist Availability'}
                        </dt>
                        <dd className="mt-1">{hospital.specialistAvail}</dd>
                      </div>
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Hospitalization */}
            {(hospital.icuLevel || hospital.nurse24h || hospital.isolationWard || hospital.ownerVisitPolicy) && (
              <AccordionItem value="hospitalization" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-hospitalization">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '住院服務' : 'Hospitalization'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    {hospital.icuLevel && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? 'ICU級別' : 'ICU Level'}
                        </dt>
                        <dd className="mt-1">{hospital.icuLevel}</dd>
                      </div>
                    )}
                    {hospital.nurse24h !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '24小時護士' : '24-Hour Nursing'}
                        </dt>
                        <dd className="mt-1">{hospital.nurse24h ? (language === 'zh-HK' ? '有' : 'Yes') : (language === 'zh-HK' ? '無' : 'No')}</dd>
                      </div>
                    )}
                    {hospital.isolationWard !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '隔離病房' : 'Isolation Ward'}
                        </dt>
                        <dd className="mt-1">{hospital.isolationWard ? (language === 'zh-HK' ? '有' : 'Yes') : (language === 'zh-HK' ? '無' : 'No')}</dd>
                      </div>
                    )}
                    {hospital.ownerVisitPolicy && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '探訪政策' : 'Visitation Policy'}
                        </dt>
                        <dd className="mt-1">{hospital.ownerVisitPolicy}</dd>
                      </div>
                    )}
                    {hospital.eolSupport !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '臨終護理' : 'End-of-Life Support'}
                        </dt>
                        <dd className="mt-1">{hospital.eolSupport ? (language === 'zh-HK' ? '提供' : 'Available') : (language === 'zh-HK' ? '不提供' : 'Not Available')}</dd>
                      </div>
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Payment & Insurance */}
            {(hospital.payMethods || hospital.admissionDeposit || hospital.insuranceSupport) && (
              <AccordionItem value="payment" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-payment">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '付款及保險' : 'Payment & Insurance'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    {hospital.payMethods && hospital.payMethods.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '付款方式' : 'Payment Methods'}
                        </dt>
                        <dd className="mt-1 flex flex-wrap gap-2">
                          {hospital.payMethods.map((method) => (
                            <Badge key={method} variant="outline">{method}</Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                    {hospital.admissionDeposit !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '入院按金' : 'Admission Deposit'}
                        </dt>
                        <dd className="mt-1">
                          {hospital.admissionDeposit ? (
                            <>{language === 'zh-HK' ? '需要' : 'Required'} {hospital.depositBand && `(${hospital.depositBand})`}</>
                          ) : (
                            language === 'zh-HK' ? '不需要' : 'Not Required'
                          )}
                        </dd>
                      </div>
                    )}
                    {hospital.insuranceSupport && hospital.insuranceSupport.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '保險支援' : 'Insurance Support'}
                        </dt>
                        <dd className="mt-1 flex flex-wrap gap-2">
                          {hospital.insuranceSupport.map((insurer) => (
                            <Badge key={insurer} variant="outline">{insurer}</Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Report Incorrect Info */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh-HK' 
                    ? '發現資料有誤？請協助我們更正。' 
                    : 'Found incorrect information? Help us correct it.'}
                </p>
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-report">
                      {language === 'zh-HK' ? '報告錯誤資訊' : 'Report Incorrect Info'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{language === 'zh-HK' ? '報告錯誤資訊' : 'Report Incorrect Information'}</DialogTitle>
                      <DialogDescription>
                        {language === 'zh-HK' 
                          ? '請詳細描述需要更正的資訊。' 
                          : 'Please describe what information needs to be corrected.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="report-notes">
                        {language === 'zh-HK' ? '詳情' : 'Details'}
                      </Label>
                      <Textarea
                        id="report-notes"
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        placeholder={language === 'zh-HK' 
                          ? '例如：診症費已更新為...' 
                          : 'e.g., Consultation fee has been updated to...'}
                        rows={4}
                        className="mt-2"
                        data-testid="textarea-report-notes"
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setReportDialogOpen(false)}
                        data-testid="button-cancel-report"
                      >
                        {language === 'zh-HK' ? '取消' : 'Cancel'}
                      </Button>
                      <Button 
                        onClick={handleReportSubmit}
                        disabled={reportMutation.isPending}
                        data-testid="button-submit-report"
                      >
                        {reportMutation.isPending 
                          ? (language === 'zh-HK' ? '提交中...' : 'Submitting...') 
                          : (language === 'zh-HK' ? '提交' : 'Submit')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2 justify-center">
              {hospital.phone && (
                <Button
                  variant="default"
                  onClick={() => handleCall(hospital.phone)}
                  className="flex-1 min-w-[120px]"
                  data-testid="button-call-sticky"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '致電' : 'Call'}
                </Button>
              )}
              {hospital.whatsapp && (
                <Button
                  variant="outline"
                  onClick={() => handleWhatsApp(hospital.whatsapp)}
                  className="flex-1 min-w-[120px] text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  data-testid="button-whatsapp-sticky"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleMaps}
                className="flex-1 min-w-[120px]"
                data-testid="button-maps-sticky"
              >
                <NavigationIcon className="h-4 w-4 mr-2" />
                {language === 'zh-HK' ? '地圖' : 'Maps'}
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 z-30 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label={language === 'zh-HK' ? '返回頂部' : 'Back to top'}
            data-testid="button-back-to-top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  );
}
