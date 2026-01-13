import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  CloudLightning, MapPin, PhoneCall, ArrowLeft, ExternalLink, 
  Navigation, Info, MessageCircle, ShieldCheck, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  openT8: boolean | null;
  openT10: boolean | null;
  openBlackRainstorm: boolean | null;
  liveStatus: string | null;
  taxiDropoffEn: string | null;
  taxiDropoffZh: string | null;
  emergencyEntranceEn: string | null;
  emergencyEntranceZh: string | null;
  phone: string | null;
  whatsapp: string | null;
  lastVerifiedAt: string | null;
}

interface BlogStats {
  t8Count: number;
  t10Count: number;
  blackRainCount: number;
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

function WeatherDashboard({ stats, lang }: { stats: BlogStats; lang: string }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 mb-10" data-testid="weather-dashboard">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CloudLightning className="text-yellow-400" size={28} />
          <h2 className="text-xl font-bold text-white">
            {lang === 'zh' ? '極端天氣支援系統' : 'Extreme Weather Support System'}
          </h2>
        </div>
        <Badge className="bg-red-600 text-white animate-pulse">
          LIVE UPDATE
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border-2 border-blue-400">
          <div className="text-blue-400 text-sm font-medium mb-1">
            {lang === 'zh' ? 'T8 風球照開' : 'T8 Open'}
          </div>
          <div className="text-3xl font-bold text-white" data-testid="stat-t8-count">
            {stats.t8Count}
          </div>
          <div className="text-slate-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-xl border-2 border-purple-400">
          <div className="text-purple-400 text-sm font-medium mb-1">
            {lang === 'zh' ? 'T10 風球照開' : 'T10 Open'}
          </div>
          <div className="text-3xl font-bold text-white" data-testid="stat-t10-count">
            {stats.t10Count}
          </div>
          <div className="text-slate-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl border-2 border-yellow-400">
          <div className="text-yellow-400 text-sm font-medium mb-1">
            {lang === 'zh' ? '黑雨照開' : 'Black Rain Open'}
          </div>
          <div className="text-3xl font-bold text-white" data-testid="stat-blackrain-count">
            {stats.blackRainCount}
          </div>
          <div className="text-slate-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>
      </div>
    </div>
  );
}

function TyphoonHospitalCard({ hospital, lang }: { hospital: HospitalData; lang: string }) {
  const regionName = lang === 'zh' ? hospital.regionNameZh : hospital.regionNameEn;
  const hospitalName = lang === 'zh' ? hospital.nameZh : hospital.nameEn;
  const taxiDropoff = lang === 'zh' 
    ? (hospital.taxiDropoffZh || '的士可直達入口')
    : (hospital.taxiDropoffEn || 'Taxi can reach entrance');
  const emergencyEntrance = lang === 'zh'
    ? (hospital.emergencyEntranceZh || '經正門進入')
    : (hospital.emergencyEntranceEn || 'Enter through main entrance');
  
  const getStatusBadge = () => {
    switch (hospital.liveStatus) {
      case 'normal':
        return <Badge className="bg-green-500 text-white text-xs">{lang === 'zh' ? '正常營業' : 'Normal'}</Badge>;
      case 'busy':
        return <Badge className="bg-orange-500 text-white text-xs">{lang === 'zh' ? '繁忙' : 'Busy'}</Badge>;
      case 'critical_only':
        return <Badge className="bg-red-600 text-white text-xs">{lang === 'zh' ? '只接急症' : 'Critical Only'}</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-slate-200" data-testid={`hospital-card-${hospital.id}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            {getStatusBadge()}
          </div>
          <div className="flex gap-1">
            {hospital.openT10 && (
              <Badge variant="secondary" className="bg-slate-700 text-white text-[10px]">T10</Badge>
            )}
            {hospital.openBlackRainstorm && (
              <Badge variant="secondary" className="bg-black text-white text-[10px]">黑雨</Badge>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {hospitalName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={14} /> {regionName || hospital.regionNameEn}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mb-4 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Navigation size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">{taxiDropoff}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Info size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">{emergencyEntrance}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {hospital.phone && (
            <a 
              href={`tel:${hospital.phone}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
              data-testid={`call-${hospital.id}`}
            >
              <PhoneCall size={16} />
              {lang === 'zh' ? '立即致電確認' : 'Call to Confirm'}
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

export default function TyphoonGuideBlog() {
  const { language } = useLanguage();
  const lang = language === 'zh-HK' ? 'zh' : 'en';
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showT8Only, setShowT8Only] = useState(false);
  
  const { data, isLoading, error } = useQuery<BlogData>({
    queryKey: ["/api/blog/typhoon-guide"]
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <CloudLightning className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
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
  
  if (showT8Only) {
    filteredHospitals = filteredHospitals.filter(h => h.openT8);
  }

  const pageTitle = lang === 'zh' 
    ? `2026 香港寵物緊急指南 | 颱風 T8/T10 及黑雨期間照常營業獸醫` 
    : `Hong Kong Pet Emergency Guide 2026 | Vets Open During Typhoon T8/T10 & Black Rain`;
  
  const pageDescription = lang === 'zh'
    ? `極端天氣下，全港僅有少數獸醫醫院維持服務。目前全港共有 ${stats.t8Count} 間醫院在 8 號風球下維持門診，${stats.t10Count} 間在 10 號風球下提供緊急服務。`
    : `During severe weather in Hong Kong, most clinics close, but ${stats.t8Count} hospitals remain operational under Typhoon Signal No. 8 or 10. Based on PetSOS verified data, hospitals provide 24/7 care even during Black Rainstorms.`;

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
              h.openT8 && "Open during Typhoon Signal 8",
              h.openT10 && "Open during Typhoon Signal 10",
              h.openBlackRainstorm && "Open during Black Rainstorm"
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
              ? '2026 香港寵物颱風緊急指南：惡劣天氣照常營業獸醫'
              : 'Hong Kong Pet Emergency Guide 2026 | Vets Open During Typhoon T8/T10 & Black Rain'
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
                極端天氣下，全港僅有少數獸醫醫院維持服務。PetSOS 實時追蹤具備 openT8 及 openT10 資質的醫院。
                目前全港共有 <strong>{stats.t8Count}</strong> 間醫院在 8 號風球下維持門診，
                <strong>{stats.t10Count}</strong> 間在 10 號風球下提供緊急服務。
              </>
            ) : (
              <>
                During severe weather in Hong Kong, most clinics close, but <strong>{stats.t8Count}</strong> hospitals 
                remain operational under Typhoon Signal No. 8 or 10. Based on PetSOS verified data, hospitals provide 
                24/7 care even during Black Rainstorms.
              </>
            )}
          </p>
        </section>

        <WeatherDashboard stats={stats} lang={lang} />

        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {lang === 'zh' ? '惡劣天氣照常營業醫院' : 'Hospitals Open During Severe Weather'}
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
                <Switch 
                  checked={showT8Only} 
                  onCheckedChange={setShowT8Only}
                  data-testid="t8-filter-toggle"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {lang === 'zh' ? '只顯示 T8 開門' : 'Show Only T8 Open'}
                </span>
                {showT8Only && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {filteredHospitals.length} {lang === 'zh' ? '間' : 'found'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="hospitals-grid">
            {filteredHospitals.map(hospital => (
              <TyphoonHospitalCard key={hospital.id} hospital={hospital} lang={lang} />
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {lang === 'zh' ? '此地區暫無符合條件的醫院' : 'No matching hospitals found in this region'}
            </div>
          )}
        </section>

        <section className="bg-amber-50 dark:bg-amber-950 p-6 rounded-xl mb-8" data-testid="safety-section">
          <h3 className="font-bold mb-4 text-lg text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle size={20} />
            {lang === 'zh' ? '風暴期間運送寵物安全須知' : 'Safety Protocol: Transporting Your Pet During a Storm'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-amber-900 dark:text-amber-100">
            <li>
              {lang === 'zh' 
                ? '出發前致電確認醫院開放情況'
                : 'Call ahead to confirm the hospital is open before leaving'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '準備好寵物的急救箱及證件'
                : 'Prepare your pet\'s first aid kit and documents'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '使用堅固的寵物籠或背包'
                : 'Use a sturdy pet carrier or backpack'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '避免使用公共交通工具'
                : 'Avoid using public transportation'
              }
            </li>
          </ul>
        </section>

        <section className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-8" data-testid="tips-section">
          <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-gray-100">
            {lang === 'zh' ? '💡 颱風季節小貼士' : '💡 Typhoon Season Tips'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              {lang === 'zh' 
                ? '提前儲備寵物藥物及糧食，至少備有一週份量。'
                : 'Stock up on pet medications and food - keep at least one week\'s supply.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '將獸醫緊急聯絡電話存入手機，以備不時之需。'
                : 'Save emergency vet contact numbers in your phone for quick access.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '保持寵物證件及疫苗記錄更新，並存放於容易取得的位置。'
                : 'Keep pet documents and vaccination records updated and easily accessible.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '了解住所附近的避風塘及寵物友善避難場所。'
                : 'Know the location of nearby typhoon shelters and pet-friendly evacuation centers.'
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
              ? `此颱風緊急指南由 PetSOS 團隊人手核實，最後更新日期為 ${new Date(stats.lastVerified).toLocaleDateString('zh-HK')}。我哋會定期聯絡各醫院更新惡劣天氣營業資料，確保數據準確。如發現任何錯誤，歡迎聯絡我哋更正。`
              : `This typhoon emergency guide is human-verified by the PetSOS team, last updated on ${new Date(stats.lastVerified).toLocaleDateString()}. We regularly contact hospitals to update severe weather operation information. Please contact us if you find any errors.`
            }
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
