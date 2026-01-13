import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, Phone, MessageCircle, MapPin, Globe, Clock, 
  AlertCircle, CheckCircle, Info, Stethoscope, Activity,
  Siren, FlaskConical, Home, CreditCard, Navigation as NavigationIcon,
  Calendar, ChevronRight, ArrowUp, Shield, CloudRain, Car, ExternalLink
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
import { StructuredData, createEnhancedHospitalSchema, createBreadcrumbSchema, createFAQSchema } from "@/components/StructuredData";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Hospital, HospitalConsultFee } from "@shared/schema";
import { format } from "date-fns";

const equipmentUseCases = {
  ct: {
    en: "Trauma, Spinal injuries, Internal bleeding",
    zh: "車禍外傷, 脊椎癱瘓, 內出血"
  },
  mri: {
    en: "Brain disorders, Joint problems",
    zh: "腦部疾病, 關節問題"
  },
  ultrasound: {
    en: "Abdominal exam, Pregnancy",
    zh: "腹部檢查, 懷孕"
  },
  xray: {
    en: "Fractures, Foreign body",
    zh: "骨折, 異物吞入"
  }
};

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

  const isEastIsland = hospital?.slug === 'east-island-24-hours-animal-hospital';

  const regionName = useMemo(() => {
    const region = regions?.find(r => r.id === hospital?.regionId);
    if (region) {
      return language === 'zh-HK' ? region.nameZh : region.nameEn;
    }
    return language === 'zh-HK' ? '香港' : 'Hong Kong';
  }, [regions, hospital?.regionId, language]);

  const nightFee = useMemo(() => {
    if (!consultFees || consultFees.length === 0) return null;
    const nightFees = consultFees.filter(f => f.feeType === 'night' && f.minFee);
    if (nightFees.length === 0) return null;
    return Math.min(...nightFees.map(f => parseFloat(f.minFee!)));
  }, [consultFees]);

  const verifiedDate = useMemo(() => {
    if (!hospital?.lastVerifiedAt) return null;
    return format(new Date(hospital.lastVerifiedAt), 'yyyy-MM-dd');
  }, [hospital?.lastVerifiedAt]);

  const bestForCapabilities = useMemo(() => {
    if (!hospital) return [];
    const capabilities: Array<{ key: string; en: string; zh: string }> = [];
    
    if (hospital.icuLevel) {
      capabilities.push({ key: 'icu', en: 'ICU / Critical Care', zh: 'ICU 深切治療' });
    }
    if (hospital.sxEmergencySoft || hospital.sxEmergencyOrtho) {
      capabilities.push({ key: 'surgery', en: 'Emergency Surgery', zh: '緊急手術' });
    }
    if (hospital.imagingCT || hospital.imagingMRI) {
      capabilities.push({ key: 'imaging', en: 'Advanced Imaging (CT/MRI)', zh: '高階影像診斷（CT/MRI）' });
    }
    if (hospital.bloodTransfusion || hospital.oxygenTherapy) {
      const parts = [];
      if (hospital.bloodTransfusion) parts.push(language === 'zh-HK' ? '輸血' : 'Blood transfusion');
      if (hospital.oxygenTherapy) parts.push(language === 'zh-HK' ? '氧氣治療' : 'Oxygen therapy');
      capabilities.push({ 
        key: 'blood-oxygen', 
        en: parts.join(' & '), 
        zh: parts.join(' & ')
      });
    }
    if (hospital.exoticVet247) {
      capabilities.push({ key: 'exotic', en: 'Exotic / Special Species Care', zh: '特殊動物護理' });
    }
    
    return capabilities.slice(0, 5);
  }, [hospital, language]);

  const isAcceptingNewPatients = useMemo(() => {
    if (!hospital) return false;
    return hospital.isAvailable && hospital.liveStatus !== 'critical_only';
  }, [hospital]);

  const faqData = useMemo(() => {
    if (!hospital) return [];
    const faqs: Array<{ question: string; answer: string }> = [];
    
    if (hospital.onSiteVet247 !== null || hospital.triagePolicy || hospital.typicalWaitBand) {
      const answer = [
        hospital.onSiteVet247 ? (language === 'zh-HK' ? '提供24小時駐場獸醫。' : '24/7 on-site veterinarian available.') : '',
        hospital.triagePolicy ? `${language === 'zh-HK' ? '分流政策：' : 'Triage policy: '}${hospital.triagePolicy}` : '',
        hospital.typicalWaitBand ? `${language === 'zh-HK' ? '一般等候時間：' : 'Typical wait time: '}${hospital.typicalWaitBand}` : '',
        hospital.ambulanceSupport ? (language === 'zh-HK' ? '提供救護車服務。' : 'Ambulance service available.') : ''
      ].filter(Boolean).join(' ');
      faqs.push({
        question: language === 'zh-HK' ? '這間醫院提供什麼緊急服務？' : 'What emergency services does this hospital provide?',
        answer: answer || (language === 'zh-HK' ? '請聯絡醫院查詢。' : 'Please contact the hospital for details.')
      });
    }
    
    if (hospital.imagingXray || hospital.imagingUS || hospital.imagingCT || hospital.inHouseLab) {
      const equipment = [
        hospital.imagingXray ? (language === 'zh-HK' ? 'X光' : 'X-Ray') : '',
        hospital.imagingUS ? (language === 'zh-HK' ? '超聲波' : 'Ultrasound') : '',
        hospital.imagingCT ? 'CT' : '',
        hospital.imagingMRI ? 'MRI' : '',
        hospital.endoscopy ? (language === 'zh-HK' ? '內視鏡' : 'Endoscopy') : '',
        hospital.inHouseLab ? (language === 'zh-HK' ? '院內化驗室' : 'In-house laboratory') : ''
      ].filter(Boolean).join(', ');
      faqs.push({
        question: language === 'zh-HK' ? '這間醫院有什麼診斷設備？' : 'What diagnostic equipment is available?',
        answer: equipment
      });
    }
    
    if (hospital.oxygenTherapy || hospital.ventilator || hospital.bloodTransfusion || hospital.dialysis || hospital.defibrillator) {
      const equipment = [
        hospital.oxygenTherapy ? (language === 'zh-HK' ? '氧氣治療' : 'Oxygen therapy') : '',
        hospital.ventilator ? (language === 'zh-HK' ? '呼吸機' : 'Ventilator') : '',
        hospital.bloodTransfusion ? (language === 'zh-HK' ? '輸血服務' : 'Blood transfusion') : '',
        hospital.dialysis ? (language === 'zh-HK' ? '透析' : 'Dialysis') : '',
        hospital.defibrillator ? (language === 'zh-HK' ? '除顫器' : 'Defibrillator') : ''
      ].filter(Boolean).join(', ');
      faqs.push({
        question: language === 'zh-HK' ? '這間醫院有什麼生命支援設備？' : 'What life support equipment is on-site?',
        answer: equipment
      });
    }
    
    if (hospital.sxEmergencySoft || hospital.sxEmergencyOrtho || hospital.anaesMonitoring) {
      const procedures = [
        hospital.sxEmergencySoft ? (language === 'zh-HK' ? '緊急軟組織手術' : 'Emergency soft tissue surgery') : '',
        hospital.sxEmergencyOrtho ? (language === 'zh-HK' ? '緊急骨科手術' : 'Emergency orthopedic surgery') : '',
        hospital.anaesMonitoring ? `${language === 'zh-HK' ? '麻醉監測：' : 'Anesthesia monitoring: '}${hospital.anaesMonitoring}` : '',
        hospital.specialistAvail ? `${language === 'zh-HK' ? '專科：' : 'Specialists: '}${hospital.specialistAvail}` : ''
      ].filter(Boolean).join('. ');
      faqs.push({
        question: language === 'zh-HK' ? '這間醫院可以進行什麼手術？' : 'What surgical procedures can be performed?',
        answer: procedures
      });
    }
    
    if (hospital.icuLevel || hospital.nurse24h || hospital.isolationWard || hospital.ownerVisitPolicy) {
      const options = [
        hospital.icuLevel ? `ICU ${language === 'zh-HK' ? '級別' : 'level'}: ${hospital.icuLevel}` : '',
        hospital.nurse24h ? (language === 'zh-HK' ? '24小時護士值班' : '24-hour nursing care') : '',
        hospital.isolationWard ? (language === 'zh-HK' ? '隔離病房' : 'Isolation ward available') : '',
        hospital.ownerVisitPolicy ? `${language === 'zh-HK' ? '探訪政策：' : 'Visitation policy: '}${hospital.ownerVisitPolicy}` : ''
      ].filter(Boolean).join('. ');
      faqs.push({
        question: language === 'zh-HK' ? '這間醫院的住院及ICU設施如何？' : 'What are the hospitalization and ICU options?',
        answer: options
      });
    }
    
    if (hospital.payMethods || hospital.insuranceSupport) {
      const payment = [
        hospital.payMethods && hospital.payMethods.length > 0 ? `${language === 'zh-HK' ? '付款方式：' : 'Payment methods: '}${hospital.payMethods.join(', ')}` : '',
        hospital.insuranceSupport && hospital.insuranceSupport.length > 0 ? `${language === 'zh-HK' ? '接受保險：' : 'Insurance accepted: '}${hospital.insuranceSupport.join(', ')}` : '',
        hospital.admissionDeposit ? (language === 'zh-HK' ? '需要入院按金' : 'Admission deposit required') : ''
      ].filter(Boolean).join('. ');
      faqs.push({
        question: language === 'zh-HK' ? '這間醫院接受什麼付款方式及保險？' : 'What payment methods and insurance are accepted?',
        answer: payment || (language === 'zh-HK' ? '請聯絡醫院查詢。' : 'Please contact the hospital for details.')
      });
    }
    
    return faqs;
  }, [hospital, language]);

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

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowBackToTop(false);
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

  const feeTypes = ['day', 'evening', 'night'] as const;
  const speciesOrder = ['dog', 'cat', 'other'];

  const hasCriticalCare = hospital.icuLevel || hospital.nurse24h || hospital.onSiteVet247;
  const hasImagingDiagnostics = hospital.imagingCT || hospital.imagingMRI || hospital.imagingXray || hospital.imagingUS || hospital.inHouseLab;
  const hasBloodLifeSupport = hospital.oxygenTherapy || hospital.bloodTransfusion || hospital.ventilator || hospital.dialysis || hospital.defibrillator;
  const hasEmergencySurgery = hospital.sxEmergencySoft || hospital.sxEmergencyOrtho;
  const hasExoticSpecies = hospital.exoticVet247 || (hospital.exoticSpecies247 && hospital.exoticSpecies247.length > 0);
  const hasAnyCapability = hasCriticalCare || hasImagingDiagnostics || hasBloodLifeSupport || hasEmergencySurgery || hasExoticSpecies;

  const hasTyphoonData = hospital.openT8 !== null || hospital.openT10 !== null || hospital.openBlackRainstorm !== null || hospital.christmasOpen !== null;
  
  const emergencyEntrance = language === 'zh-HK' ? hospital.emergencyEntranceZh : hospital.emergencyEntranceEn;
  const taxiDropoff = language === 'zh-HK' ? hospital.taxiDropoffZh : hospital.taxiDropoffEn;
  const parkingDetails = language === 'zh-HK' ? hospital.parkingDetailsZh : hospital.parkingDetailsEn;
  const hasPanicLogistics = emergencyEntrance || taxiDropoff || parkingDetails || hospital.wheelchairAccess;

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
      {faqData.length > 0 && (
        <StructuredData
          id={`hospital-${hospital.id}-faq`}
          data={createFAQSchema(faqData)}
        />
      )}
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
                  <Badge 
                    variant="default" 
                    className="bg-red-500" 
                    data-testid="badge-24-7"
                    title={language === 'zh-HK' ? '全天候24小時服務' : '24 hours a day, 7 days a week'}
                  >
                    24/7
                  </Badge>
                )}
                {hospital.liveStatus && (
                  <Badge 
                    variant={hospital.liveStatus === 'normal' ? 'default' : 'destructive'}
                    data-testid="badge-status"
                    itemProp="actionStatus"
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
          {/* AI-Ready Snippet Block - Hidden from users, visible to AI/crawlers */}
          <div 
            className="sr-only" 
            aria-hidden="true"
            data-ai-summary="true"
            itemScope 
            itemType="https://schema.org/VeterinaryCare"
          >
            <p lang="en" itemProp="description">
              {hospital.nameEn} is a {hospital.open247 ? '24-hour emergency ' : ''}veterinary hospital 
              located in {regionName}, Hong Kong.
              {hospital.icuLevel ? ' Intensive Care Unit (ICU) available.' : ''}
              {hospital.imagingCT ? ' CT scan on-site.' : ''}
              {hospital.bloodTransfusion ? ' Blood transfusion services provided.' : ''}
              {' '}Current status: {hospital.liveStatus === 'busy' ? 'busy' : hospital.liveStatus === 'critical_only' ? 'critical cases only' : 'normal'}.
              {nightFee ? ` Night emergency consultation from HKD $${nightFee}.` : ''}
              {verifiedDate ? ` Information verified by PetSOS on ${verifiedDate}.` : ''}
            </p>
            <p lang="zh-HK">
              {hospital.nameZh}是位於香港{regionName}的{hospital.open247 ? '24小時緊急' : ''}獸醫醫院。
              {hospital.icuLevel ? '設有深切治療部(ICU)。' : ''}
              {hospital.imagingCT ? '備有CT掃描設備。' : ''}
              {hospital.bloodTransfusion ? '提供輸血服務。' : ''}
              目前狀態：{hospital.liveStatus === 'busy' ? '繁忙' : hospital.liveStatus === 'critical_only' ? '僅接受危急個案' : '正常'}。
              {nightFee ? `夜間急診諮詢費由港幣$${nightFee}起。` : ''}
              {verifiedDate ? `資料由PetSOS於${verifiedDate}驗證。` : ''}
            </p>
          </div>

          {/* BLOCK 1 - What This Hospital Is Best For */}
          {bestForCapabilities.length > 0 && (
            <Card className="mb-6" data-testid="card-best-for">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-red-500" />
                  {language === 'zh-HK' ? '特別適合處理以下緊急情況：' : 'Best suited for emergencies involving:'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" data-testid="list-best-for">
                  {bestForCapabilities.map((cap, index) => (
                    <li key={cap.key} className="flex items-center gap-2" data-testid={`item-best-for-${cap.key}`}>
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-900 dark:text-white">
                        {language === 'zh-HK' ? cap.zh : cap.en}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* BLOCK 2 - Emergency Capability Matrix */}
          {hasAnyCapability && (
            <Card className="mb-6" data-testid="card-capability-matrix">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" data-testid="text-capability-matrix">
                    {language === 'zh-HK' ? '急症服務設施' : 'Emergency Capabilities'}
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
              <CardContent className="space-y-4">
                {/* Critical Care */}
                {hasCriticalCare && (
                  <div data-testid="section-critical-care">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'zh-HK' ? '深切治療' : 'Critical Care'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hospital.icuLevel && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-icu">
                          ✅ ICU {hospital.icuLevel}
                        </Badge>
                      )}
                      {hospital.nurse24h && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-nurse24h">
                          ✅ {language === 'zh-HK' ? '24小時護士' : '24H Nursing'}
                        </Badge>
                      )}
                      {hospital.onSiteVet247 && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-vet247">
                          ✅ {language === 'zh-HK' ? '24小時獸醫' : '24H Vet'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Imaging & Diagnostics */}
                {hasImagingDiagnostics && (
                  <div data-testid="section-imaging">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'zh-HK' ? '影像及診斷' : 'Imaging & Diagnostics'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hospital.imagingCT && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-ct">
                          ✅ CT {hospital.sameDayCT && (language === 'zh-HK' ? '(當日)' : '(Same Day)')}
                        </Badge>
                      )}
                      {hospital.imagingMRI && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-mri">
                          ✅ MRI
                        </Badge>
                      )}
                      {hospital.imagingXray && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-xray">
                          ✅ {language === 'zh-HK' ? 'X光' : 'X-Ray'}
                        </Badge>
                      )}
                      {hospital.imagingUS && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-ultrasound">
                          ✅ {language === 'zh-HK' ? '超聲波' : 'Ultrasound'}
                        </Badge>
                      )}
                      {hospital.inHouseLab && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-lab">
                          ✅ {language === 'zh-HK' ? '院內化驗' : 'In-house Lab'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Blood & Life Support */}
                {hasBloodLifeSupport && (
                  <div data-testid="section-life-support">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'zh-HK' ? '輸血及生命支援' : 'Blood & Life Support'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hospital.oxygenTherapy && (
                        <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 border-red-300" data-testid="badge-oxygen">
                          ✅ {language === 'zh-HK' ? '氧氣治療' : 'Oxygen Therapy'}
                        </Badge>
                      )}
                      {hospital.bloodTransfusion && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-blood">
                          ✅ {language === 'zh-HK' ? '輸血服務' : 'Blood Transfusion'}
                        </Badge>
                      )}
                      {hospital.ventilator && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-ventilator">
                          ✅ {language === 'zh-HK' ? '呼吸機' : 'Ventilator'}
                        </Badge>
                      )}
                      {hospital.dialysis && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-dialysis">
                          ✅ {language === 'zh-HK' ? '透析' : 'Dialysis'}
                        </Badge>
                      )}
                      {hospital.defibrillator && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-defib">
                          ✅ {language === 'zh-HK' ? '除顫器' : 'Defibrillator'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Surgery */}
                {hasEmergencySurgery && (
                  <div data-testid="section-surgery">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'zh-HK' ? '緊急手術' : 'Emergency Surgery'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hospital.sxEmergencySoft && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-soft-tissue">
                          ✅ {language === 'zh-HK' ? '軟組織手術' : 'Soft Tissue Surgery'}
                        </Badge>
                      )}
                      {hospital.sxEmergencyOrtho && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-ortho">
                          ✅ {language === 'zh-HK' ? '骨科手術' : 'Orthopedic Surgery'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Exotic Species */}
                {hasExoticSpecies && (
                  <div data-testid="section-exotic">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'zh-HK' ? '特殊動物' : 'Exotic Species'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hospital.exoticVet247 && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20" data-testid="badge-exotic-vet">
                          ✅ {language === 'zh-HK' ? '24小時特殊動物獸醫' : '24H Exotic Vet'}
                        </Badge>
                      )}
                      {hospital.exoticSpecies247 && hospital.exoticSpecies247.map(species => (
                        <Badge key={species} variant="outline" className="bg-green-50 dark:bg-green-900/20">
                          ✅ {species}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* BLOCK 3 - Triage & Wait-Time */}
          <Card className="mb-6" data-testid="card-triage">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-500" />
                {language === 'zh-HK' ? '急症分流及等候時間' : 'Triage & Wait Time'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live Status Pill */}
              <div className="flex items-center gap-3" data-testid="section-live-status">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {language === 'zh-HK' ? '目前狀態：' : 'Current status:'}
                </span>
                <Badge 
                  className={`${
                    hospital.liveStatus === 'normal' ? 'bg-green-500' : 
                    hospital.liveStatus === 'busy' ? 'bg-amber-500' : 
                    hospital.liveStatus === 'critical_only' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  data-testid="badge-live-status"
                >
                  {hospital.liveStatus === 'normal' ? (language === 'zh-HK' ? '正常' : 'Normal') :
                   hospital.liveStatus === 'busy' ? (language === 'zh-HK' ? '繁忙' : 'Busy') :
                   hospital.liveStatus === 'critical_only' ? (language === 'zh-HK' ? '僅危急' : 'Critical Only') :
                   (language === 'zh-HK' ? '未知' : 'Unknown')}
                </Badge>
              </div>

              {/* Accepting Patients */}
              <div className="flex items-center gap-2" data-testid="section-accepting">
                {isAcceptingNewPatients ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      {language === 'zh-HK' ? '正在接收急症病患' : 'Accepting emergency patients'}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 dark:text-red-400 font-medium">
                      {language === 'zh-HK' ? '目前只接受危急個案' : 'Currently accepting critical cases only'}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'zh-HK' 
                  ? '容量可能隨時變化，請於到達前致電確認。' 
                  : 'Capacity may change; please call ahead to confirm.'}
              </p>

              <Separator />

              {/* Triage Explainer */}
              <div className="space-y-2" data-testid="section-triage-explainer">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {language === 'zh-HK' 
                    ? '急症分流說明：病患會按醫療緊急程度處理，而非到達先後。危急個案會優先。' 
                    : 'How emergency triage works: Patients are assessed based on medical urgency, not arrival order. Life-threatening cases are prioritised.'}
                </p>
                {hospital.typicalWaitBand && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'zh-HK' 
                      ? `一般等候時間：${hospital.typicalWaitBand}（實際時間會因個案嚴重程度及醫院即時情況而有所不同）` 
                      : `Typical waiting time: ${hospital.typicalWaitBand} (May vary depending on case severity and hospital load.)`}
                  </p>
                )}
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {language === 'zh-HK' 
                    ? '此資料僅供緊急參考之用。' 
                    : 'Information is provided for emergency guidance only.'}
                </p>
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

          {/* BLOCK 4 - Consultation Fees */}
          {isEastIsland && (hospital.consultFeeDay || hospital.consultFeeEvening || hospital.consultFeeMidnight) ? (
            <Card className="mb-6" data-testid="card-fees-ei">
              <CardHeader>
                <CardTitle className="text-lg" data-testid="text-consult-fees">
                  {language === 'zh-HK' ? '診症費用（只供參考）' : 'Emergency consultation fees (reference)'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh-HK' 
                    ? '僅供參考，最終收費以醫院為準' 
                    : 'For reference only; final charges determined by hospital'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hospital.consultFeeDay && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid="fee-day">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {language === 'zh-HK' ? '日間診症' : 'Day Consultation'}
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        HK${hospital.consultFeeDay}
                      </span>
                    </div>
                  )}
                  {hospital.consultFeeEvening && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid="fee-evening">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {language === 'zh-HK' 
                          ? `晚間診症${hospital.eveningSurchargeStart ? `（${hospital.eveningSurchargeStart}起）` : ''}` 
                          : `Evening Consultation${hospital.eveningSurchargeStart ? ` (from ${hospital.eveningSurchargeStart})` : ''}`}
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        HK${hospital.consultFeeEvening}
                      </span>
                    </div>
                  )}
                  {hospital.consultFeeMidnight && (
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" data-testid="fee-midnight">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {language === 'zh-HK' 
                          ? `午夜急症${hospital.midnightSurchargeStart ? `（${hospital.midnightSurchargeStart}起）` : ''}` 
                          : `Emergency/Midnight${hospital.midnightSurchargeStart ? ` (from ${hospital.midnightSurchargeStart})` : ''}`}
                      </span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        HK${hospital.consultFeeMidnight}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {language === 'zh-HK' ? '僅供參考' : 'Reference only'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            !feesLoading && consultFees && consultFees.length > 0 && (
              <Card className="mb-6" data-testid="card-fees">
                <CardHeader>
                  <CardTitle className="text-lg" data-testid="text-consult-fees">
                    {language === 'zh-HK' ? '診症費用（只供參考）' : 'Emergency consultation fees (reference)'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'zh-HK' 
                      ? '僅供參考，最終收費以醫院為準' 
                      : 'For reference only; final charges determined by hospital'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table 
                      className="w-full border-collapse"
                      aria-label={language === 'zh-HK' ? '診症費用表' : 'Consultation fees table'}
                    >
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {language === 'zh-HK' ? '動物類別' : 'Species'}
                          </th>
                          <th 
                            className="py-2 px-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                            data-surcharge-start="09:00"
                          >
                            {language === 'zh-HK' ? '日間' : 'Day'}
                          </th>
                          <th 
                            className="py-2 px-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                            data-surcharge-start="18:00"
                          >
                            {language === 'zh-HK' ? '晚間' : 'Evening'}
                          </th>
                          <th 
                            className="py-2 px-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                            data-surcharge-start="22:00"
                          >
                            {language === 'zh-HK' ? '深夜/公眾假期' : 'Night/PH'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {speciesOrder.filter(species => groupedFees?.[species]).map((species) => {
                          const fees = groupedFees![species];
                          const getFeeByType = (type: string) => fees.find(f => f.feeType === type);
                          return (
                            <tr 
                              key={species} 
                              className="border-b border-gray-100 dark:border-gray-800"
                              data-testid={`row-species-${species}`}
                            >
                              <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                                {species === 'dog' ? (language === 'zh-HK' ? '🐕 狗' : '🐕 Dog') :
                                 species === 'cat' ? (language === 'zh-HK' ? '🐱 貓' : '🐱 Cat') :
                                 (language === 'zh-HK' ? '🐾 其他' : '🐾 Other')}
                              </td>
                              {feeTypes.map((feeType) => {
                                const fee = getFeeByType(feeType);
                                return (
                                  <td 
                                    key={feeType}
                                    className="py-3 px-3 text-center"
                                    aria-label={`${species} ${feeType} fee`}
                                  >
                                    {fee ? (
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {fee.currency} ${fee.minFee}
                                        {fee.maxFee && fee.maxFee !== fee.minFee && ` - $${fee.maxFee}`}
                                        {fee.notes && (
                                          <div className="text-xs text-gray-500 font-normal mt-0.5">{fee.notes}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {language === 'zh-HK' ? '僅供參考' : 'Reference only'}
                  </p>
                </CardContent>
              </Card>
            )
          )}

          {/* BLOCK 5 - Typhoon & Holiday Operations */}
          {hasTyphoonData && (
            <Card className="mb-6" data-testid="card-typhoon">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-blue-500" />
                  {language === 'zh-HK' ? '颱風及假期營業' : 'Typhoon & Holiday Operations'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3" data-testid="grid-typhoon-status">
                  {hospital.openT8 !== null && (
                    <div className="flex items-center gap-2" data-testid="status-t8">
                      {hospital.openT8 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {language === 'zh-HK' ? '八號風球' : 'T8 Signal'}: {hospital.openT8 ? (language === 'zh-HK' ? '營業' : 'Open') : (language === 'zh-HK' ? '休息' : 'Closed')}
                      </span>
                    </div>
                  )}
                  {hospital.openT10 !== null && (
                    <div className="flex items-center gap-2" data-testid="status-t10">
                      {hospital.openT10 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {language === 'zh-HK' ? '十號風球' : 'T10 Signal'}: {hospital.openT10 ? (language === 'zh-HK' ? '營業' : 'Open') : (language === 'zh-HK' ? '休息' : 'Closed')}
                      </span>
                    </div>
                  )}
                  {hospital.openBlackRainstorm !== null && (
                    <div className="flex items-center gap-2" data-testid="status-black-rain">
                      {hospital.openBlackRainstorm ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {language === 'zh-HK' ? '黑雨' : 'Black Rain'}: {hospital.openBlackRainstorm ? (language === 'zh-HK' ? '營業' : 'Open') : (language === 'zh-HK' ? '休息' : 'Closed')}
                      </span>
                    </div>
                  )}
                  {hospital.christmasOpen !== null && (
                    <div className="flex items-center gap-2" data-testid="status-christmas">
                      {hospital.christmasOpen ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {language === 'zh-HK' ? '聖誕節' : 'Christmas'}: {hospital.christmasOpen ? (language === 'zh-HK' ? '營業' : 'Open') : (language === 'zh-HK' ? '休息' : 'Closed')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Transport Warning */}
                {(hospital.openT8 || hospital.openT10) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3" data-testid="transport-warning">
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {language === 'zh-HK' 
                          ? '八號／十號風球交通提示：港鐵露天路段或會暫停服務，通常需要使用的士或私家車前往。' 
                          : 'Transport note during T8 / T10: MTR services may be suspended. Road transport (taxi or van) is usually required.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Verification timestamp */}
                {hospital.lastVerifiedAt ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'zh-HK' 
                      ? `最後核實：${format(new Date(hospital.lastVerifiedAt), 'yyyy-MM-dd')}` 
                      : `Last verified: ${format(new Date(hospital.lastVerifiedAt), 'yyyy-MM-dd')}`}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'zh-HK' ? '請於到達前確認' : 'Please confirm before arrival'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* BLOCK 6 - Panic Logistics */}
          {hasPanicLogistics && (
            <Card className="mb-6" data-testid="card-panic-logistics">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <NavigationIcon className="h-5 w-5 text-blue-500" />
                  {language === 'zh-HK' ? '緊急到達指引' : 'Arriving during an emergency'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-3">
                  {emergencyEntrance && (
                    <div data-testid="logistics-entrance">
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '急症入口' : 'Emergency Entrance'}
                      </dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">{emergencyEntrance}</dd>
                    </div>
                  )}
                  {taxiDropoff && (
                    <div data-testid="logistics-taxi">
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '的士落客點' : 'Taxi Drop-off'}
                      </dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">{taxiDropoff}</dd>
                    </div>
                  )}
                  {parkingDetails && (
                    <div data-testid="logistics-parking">
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {language === 'zh-HK' ? '停車資訊' : 'Parking Details'}
                      </dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">{parkingDetails}</dd>
                    </div>
                  )}
                  {hospital.wheelchairAccess && (
                    <div className="flex items-center gap-2" data-testid="logistics-wheelchair">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-900 dark:text-white">
                        ♿ {language === 'zh-HK' ? '無障礙通道' : 'Wheelchair Access'}
                      </span>
                    </div>
                  )}
                </dl>

                {/* Taxi note - only show when there's actual text logistics data */}
                {(emergencyEntrance || taxiDropoff || parkingDetails) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {language === 'zh-HK' 
                        ? '的士 / Uber Pet（香港常見，可能收取約 HK$5 寵物附加費）' 
                        : 'Taxi / Uber Pet (common in HK, may charge ~HK$5 per pet)'}
                    </p>
                  </div>
                )}

                {/* Open in Maps CTA */}
                <Button
                  variant="outline"
                  onClick={handleMaps}
                  className="w-full"
                  data-testid="button-open-maps"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {language === 'zh-HK' ? '在地圖中開啟' : 'Open in Maps'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Detailed Information - Accordion with FAQ Format */}
          <Accordion type="multiple" defaultValue={["diagnostics"]} className="space-y-4">
            {/* Diagnostics with Symptom-Equipment Use Case Tags */}
            {(hospital.imagingXray || hospital.imagingUS || hospital.imagingCT || hospital.inHouseLab) && (
              <AccordionItem value="diagnostics" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-diagnostics">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '這間醫院有什麼診斷設備？' : 'What diagnostic equipment is available?'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {language === 'zh-HK' ? '影像檢查' : 'Imaging'}
                      </dt>
                      <dd className="space-y-2">
                        {hospital.imagingXray && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline"
                              title={language === 'zh-HK' ? 'X光射線檢查' : 'X-Ray Radiography'}
                            >
                              {language === 'zh-HK' ? 'X光' : 'X-Ray'}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              → {language === 'zh-HK' ? equipmentUseCases.xray.zh : equipmentUseCases.xray.en}
                            </span>
                          </div>
                        )}
                        {hospital.imagingUS && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline"
                              title={language === 'zh-HK' ? '超聲波檢查' : 'Ultrasound Imaging'}
                            >
                              {language === 'zh-HK' ? '超聲波' : 'Ultrasound'}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              → {language === 'zh-HK' ? equipmentUseCases.ultrasound.zh : equipmentUseCases.ultrasound.en}
                            </span>
                          </div>
                        )}
                        {hospital.imagingCT && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline"
                              title={language === 'zh-HK' ? '電腦斷層掃描' : 'Computed Tomography Scan'}
                            >
                              <abbr title="Computed Tomography">CT</abbr> {hospital.sameDayCT && `(${language === 'zh-HK' ? '當日' : 'Same Day'})`}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              → {language === 'zh-HK' ? equipmentUseCases.ct.zh : equipmentUseCases.ct.en}
                            </span>
                          </div>
                        )}
                        {hospital.imagingMRI && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline"
                              title={language === 'zh-HK' ? '磁力共振成像' : 'Magnetic Resonance Imaging'}
                            >
                              <abbr title="Magnetic Resonance Imaging">MRI</abbr>
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              → {language === 'zh-HK' ? equipmentUseCases.mri.zh : equipmentUseCases.mri.en}
                            </span>
                          </div>
                        )}
                        {hospital.endoscopy && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{language === 'zh-HK' ? '內視鏡' : 'Endoscopy'}</Badge>
                          </div>
                        )}
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

            {/* Surgery */}
            {(hospital.sxEmergencySoft || hospital.sxEmergencyOrtho || hospital.anaesMonitoring || hospital.specialistAvail) && (
              <AccordionItem value="surgery" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                <AccordionTrigger className="hover:no-underline" data-testid="accordion-surgery">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">
                      {language === 'zh-HK' ? '這間醫院可以進行什麼手術？' : 'What surgical procedures can be performed?'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    {hospital.sxEmergencySoft !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '緊急軟組織手術' : 'Emergency Soft Tissue Surgery'}
                        </dt>
                        <dd className="mt-1 flex items-center gap-2">
                          {hospital.sxEmergencySoft ? (
                            <><CheckCircle className="h-4 w-4 text-green-500" /> {language === 'zh-HK' ? '可進行' : 'Available'}</>
                          ) : (
                            <><AlertCircle className="h-4 w-4 text-yellow-500" /> {language === 'zh-HK' ? '不提供' : 'Not Available'}</>
                          )}
                        </dd>
                      </div>
                    )}
                    {hospital.sxEmergencyOrtho !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {language === 'zh-HK' ? '緊急骨科手術' : 'Emergency Orthopedic Surgery'}
                        </dt>
                        <dd className="mt-1 flex items-center gap-2">
                          {hospital.sxEmergencyOrtho ? (
                            <><CheckCircle className="h-4 w-4 text-green-500" /> {language === 'zh-HK' ? '可進行' : 'Available'}</>
                          ) : (
                            <><AlertCircle className="h-4 w-4 text-yellow-500" /> {language === 'zh-HK' ? '不提供' : 'Not Available'}</>
                          )}
                        </dd>
                      </div>
                    )}
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
                      {language === 'zh-HK' ? '這間醫院的住院及ICU設施如何？' : 'What are the hospitalization and ICU options?'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <dl className="space-y-3">
                    {hospital.icuLevel && (
                      <div>
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          <abbr title="Intensive Care Unit">ICU</abbr> {language === 'zh-HK' ? '級別' : 'Level'}
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
                      {language === 'zh-HK' ? '這間醫院接受什麼付款方式及保險？' : 'What payment methods and insurance are accepted?'}
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

          {/* BLOCK 7 - Verification & Trust Footer */}
          {(hospital.verified || hospital.lastVerifiedAt) && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid="section-trust-footer">
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  {isEastIsland ? (
                    <p>
                      {language === 'zh-HK' 
                        ? `資料由 PetSOS 驗證。最後驗證時間：${verifiedDate || '未知'}。急症服務資料已與東區24小時動物醫院確認。` 
                        : `Information verified by PetSOS. Last verified: ${verifiedDate || 'Unknown'}. Emergency capability data validated with East Island 24-Hour Animal Hospital.`}
                    </p>
                  ) : (
                    <p>
                      {language === 'zh-HK' 
                        ? '資料來源為公開紀錄。請於到達前向醫院確認。' 
                        : 'Information sourced from public records. Please confirm with hospital before arrival.'}
                    </p>
                  )}
                  <p className="mt-1 text-xs">
                    {language === 'zh-HK' 
                      ? '此醫院已在香港獸醫管理局 (VSB) 註冊。' 
                      : 'Registered with Hong Kong Veterinary Surgeons Board (VSB).'}
                    <code className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded ml-1">
                      PETSOS-{hospital.id.slice(0, 8).toUpperCase()}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}
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
