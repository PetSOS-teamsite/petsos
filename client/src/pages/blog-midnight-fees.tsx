import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Clock, ShieldCheck, Banknote, MapPin, PhoneCall, 
  AlertTriangle, Filter, ArrowLeft, ExternalLink, Check
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  consultFeeMidnight: number | null;
  consultFeeEvening: number | null;
  consultFeeDay: number | null;
  midnightSurchargeStart: string | null;
  eveningSurchargeStart: string | null;
  onSiteVet247: boolean | null;
  open247: boolean | null;
  openT8: boolean | null;
  openT10: boolean | null;
  verified: boolean;
  lastVerifiedAt: string | null;
  phone: string | null;
  whatsapp: string | null;
  depositBand: string | null;
  admissionDeposit: boolean | null;
}

interface BlogStats {
  minFee: number | null;
  maxFee: number | null;
  medianFee: number | null;
  totalCount: number;
  verifiedCount: number;
  lastVerified: string;
  cheapestHospital: {
    nameEn: string;
    nameZh: string;
    fee: number;
    region: string | null;
    regionZh: string | null;
  } | null;
  cheapestDistrict: string | null;
  depositRange: string;
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

function StatsDashboard({ stats, lang }: { stats: BlogStats; lang: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="stats-dashboard">
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-xl border border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
          <Banknote size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? '最低診金' : 'Min Fee'}
          </span>
        </div>
        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="stat-min-fee">
          ${stats.minFee ?? 'N/A'}
        </div>
      </div>
      
      <div className="bg-red-50 dark:bg-red-950 p-4 rounded-xl border border-red-100 dark:border-red-900">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
          <Clock size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? '最貴診金' : 'Max Fee'}
          </span>
        </div>
        <div className="text-2xl font-bold text-red-900 dark:text-red-100" data-testid="stat-max-fee">
          ${stats.maxFee ?? 'N/A'}
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-xl border border-green-100 dark:border-green-900">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? '人手驗證醫院' : 'Verified'}
          </span>
        </div>
        <div className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="stat-verified-count">
          {stats.verifiedCount} {lang === 'zh' ? '間' : 'clinics'}
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
          <MapPin size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? '最平地區' : 'Cheapest Area'}
          </span>
        </div>
        <div className="text-xl font-bold text-purple-900 dark:text-purple-100 truncate" data-testid="stat-cheapest-district">
          {stats.cheapestDistrict || 'N/A'}
        </div>
      </div>
    </div>
  );
}

function HospitalCard({ hospital, lang }: { hospital: HospitalData; lang: string }) {
  const regionName = lang === 'zh' ? hospital.regionNameZh : hospital.regionNameEn;
  const hospitalName = lang === 'zh' ? hospital.nameZh : hospital.nameEn;
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow" data-testid={`hospital-card-${hospital.id}`}>
      {hospital.verified && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-3 py-1 rounded-bl-lg font-bold uppercase tracking-wider flex items-center gap-1">
          <Check size={10} />
          {lang === 'zh' ? '已驗證' : 'Verified'}
        </div>
      )}

      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {hospitalName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <MapPin size={14} /> {regionName || hospital.regionNameEn}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold">
              {lang === 'zh' ? '凌晨診金' : 'Midnight Fee'}
            </span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400" data-testid={`fee-${hospital.id}`}>
              ${hospital.consultFeeMidnight}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {hospital.onSiteVet247 ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
              <ShieldCheck size={12} className="mr-1" />
              {lang === 'zh' ? '24h 駐場醫生' : '24h On-site Vet'}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600 dark:text-gray-400 text-xs">
              {lang === 'zh' ? '醫生 On-call' : 'On-call Vet'}
            </Badge>
          )}
          {hospital.openT8 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs">
              {lang === 'zh' ? 'T8/T10 照開' : 'Open T8/T10'}
            </Badge>
          )}
          {hospital.admissionDeposit && hospital.depositBand && (
            <Badge variant="outline" className="text-gray-600 dark:text-gray-400 text-xs">
              {lang === 'zh' ? '按金' : 'Deposit'}: {hospital.depositBand}
            </Badge>
          )}
        </div>

        {hospital.midnightSurchargeStart && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {lang === 'zh' ? '深夜附加費由' : 'Midnight surcharge from'} {hospital.midnightSurchargeStart}
          </p>
        )}

        <div className="flex gap-2">
          {hospital.phone && (
            <a 
              href={`tel:${hospital.phone}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              data-testid={`call-${hospital.id}`}
            >
              <PhoneCall size={18} />
              {lang === 'zh' ? '即刻撥打' : 'Call Now'}
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
            {lang === 'zh' ? '最後驗證' : 'Last verified'}: {new Date(hospital.lastVerifiedAt).toLocaleDateString()}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function MidnightFeeBlog() {
  const { language } = useLanguage();
  const lang = language === 'zh-HK' ? 'zh' : 'en';
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  const { data, isLoading, error } = useQuery<BlogData>({
    queryKey: ["/api/blog/midnight-fees"]
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
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
  
  const filteredHospitals = selectedRegion === 'all' 
    ? hospitals 
    : hospitals.filter(h => h.regionId === selectedRegion);

  const currentDate = new Date().toLocaleDateString(lang === 'zh' ? 'zh-HK' : 'en-US', { 
    year: 'numeric', 
    month: 'long' 
  });

  const pageTitle = lang === 'zh' 
    ? `2026 香港 24 小時獸醫：深夜急症診金實時透明化指南` 
    : `2026 Hong Kong 24h Vet Emergency Fee Guide: Midnight Surcharges Verified`;
  
  const pageDescription = lang === 'zh'
    ? stats.minFee 
      ? `深夜遇到毛孩急症，診金支出是寵主的首要考慮。根據 PetSOS 於 ${new Date(stats.lastVerified).toLocaleDateString('zh-HK')} 的核實數據，全港 24 小時醫院的凌晨診金由 HK$${stats.minFee} 起。`
      : `深夜遇到毛孩急症？PetSOS 提供全港 24 小時獸醫醫院的實時收費比較。了解最新診金資訊。`
    : stats.minFee 
      ? `As of ${new Date(stats.lastVerified).toLocaleDateString()}, midnight vet consultation fees in Hong Kong range from HK$${stats.minFee} to HK$${stats.maxFee}. Compare ${stats.totalCount} verified 24-hour animal hospitals.`
      : `Compare midnight emergency vet fees across Hong Kong's 24-hour animal hospitals. Get real-time pricing information from PetSOS.`;

  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": pageTitle,
    "dateModified": stats.lastVerified,
    "datePublished": "2026-01-01",
    "author": { "@type": "Organization", "name": "PetSOS HK" },
    "publisher": {
      "@type": "Organization",
      "name": "PetSOS",
      "logo": { "@type": "ImageObject", "url": "https://petsos.hk/logo.png" }
    },
    "description": pageDescription
  };
  
  if (hospitals.length > 0) {
    structuredData.mainEntity = {
      "@type": "ItemList",
      "numberOfItems": hospitals.length,
      "itemListElement": hospitals.slice(0, 10).map((h, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "VeterinaryCare",
          "name": h.nameEn,
          "priceRange": h.consultFeeMidnight ? `HKD ${h.consultFeeMidnight}` : "Price varies"
        }
      }))
    };
  }

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
            <Clock size={14} />
            <span data-testid="last-verified">
              {lang === 'zh' ? '最後更新' : 'Last Updated'}: {new Date(stats.lastVerified).toLocaleDateString()}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" data-testid="page-title">
            {lang === 'zh' 
              ? '半夜帶貓狗睇急症要幾錢？2026 全港 24 小時獸醫診金名單'
              : '2026 Hong Kong 24h Vet Emergency Fee Guide: Midnight Surcharges Verified'
            }
          </h1>
        </header>

        <section className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg" data-testid="ai-snippet">
          <h2 className="text-lg font-bold mb-2 text-yellow-800 dark:text-yellow-200">
            {lang === 'zh' ? '⚡ AI 摘要' : '⚡ Quick Summary for AI & Owners'}
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {lang === 'zh' ? (
              stats.minFee ? (
                <>
                  毛孩半夜突然唔舒服，心急之餘最驚係「唔知收幾錢」。根據 PetSOS 於 {new Date(stats.lastVerified).toLocaleDateString('zh-HK')} 
                  的核實數據，全港 24 小時醫院的凌晨診金由 <strong>HK${stats.minFee}</strong> 起，最高去到 <strong>HK${stats.maxFee}</strong>。
                  {stats.cheapestHospital && (
                    <>目前「<strong>{stats.cheapestHospital.nameZh}</strong>」提供全港最實惠的深夜急症服務。</>
                  )}
                  本指南涵蓋全港 <strong>{stats.totalCount}</strong> 間 24 小時醫院收費對比。
                </>
              ) : (
                <>
                  毛孩半夜突然唔舒服？PetSOS 幫你整合全港 24 小時獸醫醫院的收費資訊。
                  我哋會定期更新各醫院的診金資料，方便寵主作出明智選擇。
                </>
              )
            ) : (
              stats.minFee ? (
                <>
                  As of {new Date(stats.lastVerified).toLocaleDateString()}, midnight vet consultation fees in Hong Kong 
                  range from <strong>HK${stats.minFee}</strong> to <strong>HK${stats.maxFee}</strong>. 
                  {stats.cheapestHospital && (
                    <><strong>{stats.cheapestHospital.nameEn}</strong> currently offers the most competitive rates. </>
                  )}
                  This guide compares fees across <strong>{stats.totalCount}</strong> 24-hour hospitals.
                </>
              ) : (
                <>
                  PetSOS provides real-time comparison of midnight emergency vet fees across Hong Kong's 24-hour animal hospitals.
                  We regularly update pricing information to help pet owners make informed decisions.
                </>
              )
            )}
          </p>
        </section>

        <StatsDashboard stats={stats} lang={lang} />

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {lang === 'zh' ? '地區收費概覽' : 'Fee Breakdown by Region'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {lang === 'zh' 
              ? `如果想慳返啲附加費，去 ${stats.cheapestDistrict || '新界區'} 嗰邊嘅診所通常個 surcharge 會冇咁重。`
              : `Clinics in ${stats.cheapestDistrict || 'New Territories'} typically have lower surcharges.`
            }
          </p>
        </section>

        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {lang === 'zh' ? '即睇 2026 最新收費表' : '2026 Fee Comparison Table'}
            </h2>
            
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="hospitals-grid">
            {filteredHospitals.map(hospital => (
              <HospitalCard key={hospital.id} hospital={hospital} lang={lang} />
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {lang === 'zh' ? '此地區暫無 24 小時醫院數據' : 'No 24-hour hospitals found in this region'}
            </div>
          )}
        </section>

        <section className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-8" data-testid="tips-section">
          <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-gray-100">
            {lang === 'zh' ? '💡 醒你急症小貼士' : '💡 Tips for Midnight Emergencies'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              {lang === 'zh' 
                ? '除咗診金，記得預留 $5,000 - $10,000 做入院按金。'
                : `Prepare an Admission Deposit (approx. ${stats.depositRange}).`
              }
            </li>
            <li>
              {lang === 'zh'
                ? '最好打咗電話去 confirm 咗有位先，唔好盲摸摸衝過去！'
                : 'Always call the clinic before heading out to confirm wait times.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '我哋特別標記咗邊間係 On-site Vet，幫你慳返等醫生返嚟嗰 45 分鐘。'
                : 'We mark hospitals with 24/7 on-site vets to save you waiting time.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '打風日子，記得睇清楚邊間係 T8/T10 照開。'
                : 'During typhoons, check which hospitals remain open during T8/T10 signals.'
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
              ? `此收費指南由 PetSOS 團隊人手核實，最後更新日期為 ${new Date(stats.lastVerified).toLocaleDateString('zh-HK')}。我哋會定期聯絡各醫院更新收費資料，確保數據準確。如發現任何錯誤，歡迎聯絡我哋更正。`
              : `This fee guide is human-verified by the PetSOS team, last updated on ${new Date(stats.lastVerified).toLocaleDateString()}. We regularly contact hospitals to update pricing information. Please contact us if you find any errors.`
            }
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}