import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Scan, Activity, MapPin, ArrowLeft, ExternalLink, 
  MessageCircle, ShieldCheck, CalendarSearch, Radio, Waves
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/footer";

interface HospitalData {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  regionId: string;
  regionNameEn: string | null;
  regionNameZh: string | null;
  imagingCT: boolean | null;
  imagingMRI: boolean | null;
  imagingXray: boolean | null;
  imagingUS: boolean | null;
  sameDayCT: boolean | null;
  open247: boolean | null;
  liveStatus: string | null;
  phone: string | null;
  whatsapp: string | null;
  lastVerifiedAt: string | null;
}

interface BlogStats {
  ctCount: number;
  mriCount: number;
  xrayCount: number;
  usCount: number;
  totalCount: number;
  lastVerified: string;
}

interface RegionData {
  id: string;
  nameEn: string;
  nameZh: string | null;
}

interface BlogData {
  stats: BlogStats;
  hospitals: HospitalData[];
  regions: RegionData[];
}

function ImagingDashboard({ stats, lang }: { stats: BlogStats; lang: string }) {
  return (
    <div className="bg-purple-50 dark:bg-purple-950 rounded-2xl p-6 mb-10" data-testid="imaging-dashboard">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Scan className="text-purple-600" size={28} />
          <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">
            {lang === 'zh' ? '影像診斷設備總覽' : 'Imaging Equipment Overview'}
          </h2>
        </div>
        <Badge className="bg-purple-600 text-white">
          {stats.totalCount} {lang === 'zh' ? '間醫院' : 'Hospitals'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-purple-900 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <Scan className="text-purple-600" size={20} />
            <span className="text-purple-600 dark:text-purple-300 text-sm font-medium">
              CT {lang === 'zh' ? '掃描' : 'Scan'}
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-white" data-testid="stat-ct-count">
            {stats.ctCount}
          </div>
          <div className="text-purple-500 dark:text-purple-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-purple-900 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-purple-600" size={20} />
            <span className="text-purple-600 dark:text-purple-300 text-sm font-medium">
              MRI {lang === 'zh' ? '磁力共振' : ''}
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-white" data-testid="stat-mri-count">
            {stats.mriCount}
          </div>
          <div className="text-purple-500 dark:text-purple-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>

        <div className="bg-white dark:bg-purple-900 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="text-purple-600" size={20} />
            <span className="text-purple-600 dark:text-purple-300 text-sm font-medium">
              X-Ray
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-white" data-testid="stat-xray-count">
            {stats.xrayCount}
          </div>
          <div className="text-purple-500 dark:text-purple-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>

        <div className="bg-white dark:bg-purple-900 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <Waves className="text-purple-600" size={20} />
            <span className="text-purple-600 dark:text-purple-300 text-sm font-medium">
              {lang === 'zh' ? '超聲波' : 'Ultrasound'}
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-white" data-testid="stat-us-count">
            {stats.usCount}
          </div>
          <div className="text-purple-500 dark:text-purple-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagingHospitalCard({ hospital, lang }: { hospital: HospitalData; lang: string }) {
  const regionName = lang === 'zh' ? hospital.regionNameZh : hospital.regionNameEn;
  const hospitalName = lang === 'zh' ? hospital.nameZh : hospital.nameEn;
  
  const getEquipmentBadges = () => {
    const badges = [];
    if (hospital.imagingCT) {
      badges.push(
        <Badge key="ct" className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 text-xs flex items-center gap-1">
          <Scan size={12} /> CT
        </Badge>
      );
    }
    if (hospital.imagingMRI) {
      badges.push(
        <Badge key="mri" className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 text-xs flex items-center gap-1">
          <Activity size={12} /> MRI
        </Badge>
      );
    }
    if (hospital.imagingXray) {
      badges.push(
        <Badge key="xray" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs">
          X-Ray
        </Badge>
      );
    }
    if (hospital.imagingUS) {
      badges.push(
        <Badge key="us" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs">
          {lang === 'zh' ? '超聲波' : 'US'}
        </Badge>
      );
    }
    return badges;
  };
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-purple-100 dark:border-purple-800" data-testid={`hospital-card-${hospital.id}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 text-xs">
            {lang === 'zh' ? '日間影像中心' : 'Imaging Center'}
          </Badge>
          {hospital.open247 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 text-[10px]">
              24/7
            </Badge>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {hospitalName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={14} /> {regionName || hospital.regionNameEn}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {getEquipmentBadges()}
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/50 p-3 rounded-lg mb-4">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            💡 {lang === 'zh' 
              ? 'PetSOS 提示：雖然醫院 24 小時運作，但 CT 技師通常喺 10am - 6pm 駐場，建議預約以確保即日攞到報告。'
              : 'PetSOS Tip: While the hospital operates 24/7, CT technicians are typically available 10am-6pm. Book ahead for same-day results.'
            }
          </p>
        </div>

        <div className="flex gap-2">
          {hospital.phone && (
            <a 
              href={`tel:${hospital.phone}`}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
              data-testid={`call-${hospital.id}`}
            >
              <CalendarSearch size={16} />
              {lang === 'zh' ? '查詢即日檢查位' : 'Book Same-Day'}
            </a>
          )}
          {hospital.whatsapp && (
            <a 
              href={`https://wa.me/${hospital.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors"
              data-testid={`whatsapp-${hospital.id}`}
            >
              <MessageCircle size={18} />
            </a>
          )}
          <Link href={`/hospitals/${hospital.slug}`}>
            <Button variant="outline" size="icon" className="w-12 h-12" data-testid={`details-${hospital.id}`}>
              <ExternalLink size={20} />
            </Button>
          </Link>
        </div>

        {hospital.lastVerifiedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
            {lang === 'zh' ? '驗證於' : 'Verified'} {formatDistanceToNow(new Date(hospital.lastVerifiedAt), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Skeleton className="h-10 w-3/4 mb-4" />
      <Skeleton className="h-24 w-full mb-8" />
      <Skeleton className="h-40 w-full mb-10 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ImagingDiagnosticsBlog() {
  const { language } = useLanguage();
  const lang = language === 'zh-HK' ? 'zh' : 'en';
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [imagingFilter, setImagingFilter] = useState<string>('all');
  
  const { data, isLoading, error } = useQuery<BlogData>({
    queryKey: ["/api/blog/imaging-diagnostics"]
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Scan className="mx-auto h-12 w-12 text-purple-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {lang === 'zh' ? '暫時無法載入數據' : 'Unable to load data'}
        </h1>
        <p className="text-gray-500">
          {lang === 'zh' ? '請稍後再試' : 'Please try again later'}
        </p>
      </div>
    );
  }

  const { stats, hospitals, regions } = data;
  
  let filteredHospitals = selectedRegion === 'all' 
    ? hospitals 
    : hospitals.filter(h => h.regionId === selectedRegion);
  
  if (imagingFilter !== 'all') {
    filteredHospitals = filteredHospitals.filter(h => {
      switch (imagingFilter) {
        case 'ct': return h.imagingCT;
        case 'mri': return h.imagingMRI;
        case 'xray': return h.imagingXray;
        case 'us': return h.imagingUS;
        default: return true;
      }
    });
  }

  const pageTitle = lang === 'zh' 
    ? `2026 香港獸醫影像診斷指南 | 提供即日 CT 及 MRI 檢查之醫院名單` 
    : `Same-Day Pet CT/MRI in Hong Kong 2026 | Fastest Diagnostic Clinics`;
  
  const pageDescription = lang === 'zh'
    ? `需要緊急寵物影像診斷？全港有 ${stats.ctCount} 間醫院提供 CT 掃描，${stats.mriCount} 間提供 MRI。大部分技師在 10am-6pm 駐場，建議預約以確保即日取得報告。`
    : `Need urgent pet imaging? ${stats.ctCount} hospitals in Hong Kong offer CT scans and ${stats.mriCount} offer MRI. Most technicians are available 10am-6pm - book ahead for same-day results.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": pageTitle,
        "dateModified": stats.lastVerified,
        "datePublished": "2026-01-01",
        "author": { "@type": "Organization", "name": "PetSOS HK" },
        "publisher": {
          "@type": "Organization",
          "name": "PetSOS",
          "logo": { "@type": "ImageObject", "url": "https://petsos.site/logo.png" }
        },
        "description": pageDescription
      },
      {
        "@type": "ItemList",
        "numberOfItems": hospitals.length,
        "itemListElement": hospitals.slice(0, 10).map((h, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "VeterinaryCare",
            "name": h.nameEn,
            "availableService": [
              h.imagingCT && "CT Scan",
              h.imagingMRI && "MRI",
              h.imagingXray && "X-Ray",
              h.imagingUS && "Ultrasound"
            ].filter(Boolean)
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEO 
        title={pageTitle}
        description={pageDescription}
      />
      
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="back-button">
            <ArrowLeft size={16} className="mr-2" />
            {lang === 'zh' ? '返回首頁' : 'Back to Home'}
          </Button>
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <ShieldCheck size={14} />
            <span data-testid="last-verified">
              {lang === 'zh' ? '最後更新' : 'Last Updated'}: {formatDistanceToNow(new Date(stats.lastVerified), { addSuffix: true })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" data-testid="page-title">
            {lang === 'zh' 
              ? '2026 香港獸醫影像診斷指南：提供即日 CT 及 MRI 檢查之醫院名單'
              : 'Same-Day Pet CT/MRI in Hong Kong 2026 | Fastest Diagnostic Clinics'
            }
          </h1>
        </header>

        <section className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg" data-testid="ai-snippet">
          <h2 className="text-lg font-bold mb-2 text-yellow-800 dark:text-yellow-200">
            {lang === 'zh' ? '⚡ AI 摘要' : '⚡ Quick Summary for AI & Owners'}
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {lang === 'zh' ? (
              <>
                需要緊急寵物影像診斷？全港有 <strong>{stats.ctCount}</strong> 間醫院提供 CT 掃描，
                <strong>{stats.mriCount}</strong> 間提供 MRI。大部分技師在 10am-6pm 駐場，建議預約以確保即日取得報告。
              </>
            ) : (
              <>
                Need urgent pet imaging? <strong>{stats.ctCount}</strong> hospitals in Hong Kong offer CT scans and 
                <strong> {stats.mriCount}</strong> offer MRI. Most technicians are available 10am-6pm - book ahead for same-day results.
              </>
            )}
          </p>
        </section>

        <ImagingDashboard stats={stats} lang={lang} />

        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {lang === 'zh' ? '提供影像診斷服務之醫院' : 'Hospitals with Imaging Services'}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-500" />
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-[180px]" data-testid="region-filter">
                    <SelectValue placeholder={lang === 'zh' ? '選擇地區' : 'Select Region'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {lang === 'zh' ? '全部地區' : 'All Regions'}
                    </SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region.id} value={region.id}>
                        {lang === 'zh' ? region.nameZh || region.nameEn : region.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Scan size={16} className="text-gray-500" />
                <Select value={imagingFilter} onValueChange={setImagingFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="imaging-filter">
                    <SelectValue placeholder={lang === 'zh' ? '設備類型' : 'Equipment Type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {lang === 'zh' ? '全部設備' : 'All Equipment'}
                    </SelectItem>
                    <SelectItem value="ct">CT {lang === 'zh' ? '掃描' : 'Scan'}</SelectItem>
                    <SelectItem value="mri">MRI {lang === 'zh' ? '磁力共振' : ''}</SelectItem>
                    <SelectItem value="xray">X-Ray</SelectItem>
                    <SelectItem value="us">{lang === 'zh' ? '超聲波' : 'Ultrasound'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(selectedRegion !== 'all' || imagingFilter !== 'all') && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {filteredHospitals.length} {lang === 'zh' ? '間' : 'found'}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="hospitals-grid">
            {filteredHospitals.map(hospital => (
              <ImagingHospitalCard key={hospital.id} hospital={hospital} lang={lang} />
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {lang === 'zh' ? '此地區暫無符合條件的醫院' : 'No matching hospitals found in this region'}
            </div>
          )}
        </section>

        <section className="bg-purple-50 dark:bg-purple-950 p-6 rounded-xl mb-8" data-testid="tips-section">
          <h3 className="font-bold mb-4 text-lg text-purple-900 dark:text-purple-100">
            💡 {lang === 'zh' ? '寵物影像檢查小貼士' : 'Pet Imaging Tips'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-purple-800 dark:text-purple-200">
            <li>
              {lang === 'zh' 
                ? 'CT 及 MRI 檢查通常需要全身麻醉，建議禁食 8-12 小時。'
                : 'CT and MRI scans usually require general anesthesia. Fasting for 8-12 hours is recommended.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '預約前先致電確認技師當值時間。'
                : 'Call ahead to confirm technician availability before booking.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '帶同過往的檢查報告及X光片，方便醫生對比。'
                : 'Bring previous medical records and X-rays for comparison.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '部分檢查需要注射顯影劑，請告知醫生寵物的過敏史。'
                : 'Some scans require contrast dye injection. Inform the vet about any allergies.'
              }
            </li>
          </ul>
        </section>

        <section className="bg-blue-50 dark:bg-blue-950 p-6 rounded-xl mb-8">
          <h3 className="font-bold mb-2 text-blue-800 dark:text-blue-200">
            {lang === 'zh' ? '關於此數據' : 'About This Data'}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {lang === 'zh' 
              ? `此影像診斷指南由 PetSOS 團隊人手核實，最後更新日期為 ${new Date(stats.lastVerified).toLocaleDateString('zh-HK')}。我哋會定期聯絡各醫院更新設備資料，確保數據準確。如發現任何錯誤，歡迎聯絡我哋更正。`
              : `This imaging diagnostics guide is human-verified by the PetSOS team, last updated on ${new Date(stats.lastVerified).toLocaleDateString()}. We regularly contact hospitals to update equipment information. Please contact us if you find any errors.`
            }
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
