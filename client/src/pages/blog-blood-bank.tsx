import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  ShieldCheck, MapPin, PhoneCall, ArrowLeft, ExternalLink, Check,
  Dog, Cat, Droplets, Heart, Clock, MessageCircle
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
  bloodTransfusion: boolean | null;
  bloodBankCanine: boolean | null;
  bloodBankFeline: boolean | null;
  open247: boolean | null;
  verified: boolean;
  lastVerifiedAt: string | null;
  phone: string | null;
  whatsapp: string | null;
}

interface BlogStats {
  canineCount: number;
  felineCount: number;
  transfusionCount: number;
  totalCount: number;
  lastVerified: string;
  topHospital: {
    nameEn: string;
    nameZh: string;
    region: string | null;
    regionZh: string | null;
  } | null;
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

function BloodDashboard({ stats, lang }: { stats: BlogStats; lang: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-10" data-testid="blood-dashboard">
      <div className="bg-red-50 dark:bg-red-950 p-4 rounded-xl border border-red-100 dark:border-red-900">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
          <Dog size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? '狗隻血庫' : 'Canine Stock'}
          </span>
        </div>
        <div className="text-2xl font-bold text-red-900 dark:text-red-100" data-testid="stat-canine-count">
          {stats.canineCount} {lang === 'zh' ? '間' : 'hospitals'}
        </div>
      </div>
      
      <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-xl border border-orange-100 dark:border-orange-900">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
          <Cat size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? '貓隻血庫' : 'Feline Stock'}
          </span>
        </div>
        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100" data-testid="stat-feline-count">
          {stats.felineCount} {lang === 'zh' ? '間' : 'hospitals'}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
          <ShieldCheck size={18} />
          <span className="text-sm font-medium">
            {lang === 'zh' ? 'PetSOS 核實' : 'PetSOS Verified'}
          </span>
        </div>
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid="stat-verified">
          100%
        </div>
      </div>
    </div>
  );
}

function HospitalBloodCard({ hospital, lang }: { hospital: HospitalData; lang: string }) {
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
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight pr-16">
            {hospitalName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={14} /> {regionName || hospital.regionNameEn}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {hospital.bloodTransfusion && (
            <Badge className="bg-red-600 text-white hover:bg-red-700 text-xs">
              <Droplets size={12} className="mr-1" />
              {lang === 'zh' ? '輸血中心' : 'Transfusion Hub'}
            </Badge>
          )}
          {hospital.open247 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
              {lang === 'zh' ? '24小時' : '24/7'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={`p-3 rounded-lg text-center ${hospital.bloodBankCanine ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Dog size={20} className={`mx-auto mb-1 ${hospital.bloodBankCanine ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className={`text-xs font-medium ${hospital.bloodBankCanine ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
              {hospital.bloodBankCanine 
                ? (lang === 'zh' ? '有存貨' : 'Available') 
                : (lang === 'zh' ? '暫無庫存' : 'N/A')
              }
            </span>
          </div>
          <div className={`p-3 rounded-lg text-center ${hospital.bloodBankFeline ? 'bg-orange-50 dark:bg-orange-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Cat size={20} className={`mx-auto mb-1 ${hospital.bloodBankFeline ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className={`text-xs font-medium ${hospital.bloodBankFeline ? 'text-orange-700 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400'}`}>
              {hospital.bloodBankFeline 
                ? (lang === 'zh' ? '有存貨' : 'Available') 
                : (lang === 'zh' ? '暫無庫存' : 'N/A')
              }
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {hospital.phone && (
            <a 
              href={`tel:${hospital.phone}`}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
              data-testid={`call-${hospital.id}`}
            >
              <PhoneCall size={16} />
              {lang === 'zh' ? '即刻查詢血位' : 'Check Availability'}
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
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function BloodBankBlog() {
  const { language } = useLanguage();
  const lang = language === 'zh-HK' ? 'zh' : 'en';
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  const { data, isLoading, error } = useQuery<BlogData>({
    queryKey: ["/api/blog/blood-bank"]
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Droplets className="mx-auto h-12 w-12 text-red-500 mb-4" />
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

  const pageTitle = lang === 'zh' 
    ? `2026 香港寵物血庫指南 | 緊急輸血服務地點` 
    : `Hong Kong Pet Blood Bank Guide 2026 | Emergency Transfusion Locations`;
  
  const pageDescription = lang === 'zh'
    ? `當毛孩面臨急性貧血或手術大出血，搵到合適血源係救命關鍵。全港目前有 ${stats.canineCount} 間醫院設有狗隻血庫，${stats.felineCount} 間設有貓隻血庫。`
    : `Time is critical during pet blood loss. As of ${new Date(stats.lastVerified).toLocaleDateString()}, there are ${stats.canineCount} hospitals with canine blood and ${stats.felineCount} with feline blood stocks in Hong Kong.`;

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
        "@type": "MedicalWebPage",
        "name": pageTitle,
        "specialty": "Veterinary Medicine",
        "medicalAudience": {
          "@type": "MedicalAudience",
          "audienceType": "Pet Owners"
        }
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
              h.bloodBankCanine && "Canine Blood Bank",
              h.bloodBankFeline && "Feline Blood Bank",
              h.bloodTransfusion && "Blood Transfusion"
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
            <Clock size={14} />
            <span data-testid="last-verified">
              {lang === 'zh' ? '最後更新' : 'Last Updated'}: {formatDistanceToNow(new Date(stats.lastVerified), { addSuffix: true })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" data-testid="page-title">
            {lang === 'zh' 
              ? '2026 香港寵物血庫指南：緊急輸血服務地點'
              : 'Hong Kong Pet Blood Bank Guide 2026 | Emergency Transfusion Locations'
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
                當毛孩面臨急性貧血或手術大出血，搵到合適血源係救命關鍵。根據 PetSOS 最新核實，
                全港目前有 <strong>{stats.canineCount}</strong> 間醫院設有狗隻血庫，
                <strong>{stats.felineCount}</strong> 間設有貓隻血庫。
                {stats.topHospital && (
                  <>「<strong>{stats.topHospital.nameZh}</strong>」同時提供狗貓血庫服務。</>
                )}
              </>
            ) : (
              <>
                Time is critical during pet blood loss. As of {new Date(stats.lastVerified).toLocaleDateString()}, 
                there are <strong>{stats.canineCount}</strong> hospitals with canine blood 
                and <strong>{stats.felineCount}</strong> with feline blood stocks in Hong Kong.
                {stats.topHospital && (
                  <> <strong>{stats.topHospital.nameEn}</strong> offers both canine and feline blood services.</>
                )}
              </>
            )}
          </p>
        </section>

        <BloodDashboard stats={stats} lang={lang} />

        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {lang === 'zh' ? '血庫醫院名單' : 'Blood Bank Hospitals'}
            </h2>
            
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="hospitals-grid">
            {filteredHospitals.map(hospital => (
              <HospitalBloodCard key={hospital.id} hospital={hospital} lang={lang} />
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {lang === 'zh' ? '此地區暫無血庫醫院數據' : 'No blood bank hospitals found in this region'}
            </div>
          )}
        </section>

        <section className="bg-red-50 dark:bg-red-950 p-6 rounded-xl mb-8" data-testid="donor-section">
          <h3 className="font-bold mb-4 text-lg text-red-800 dark:text-red-200 flex items-center gap-2">
            <Heart size={20} />
            {lang === 'zh' ? '捐血者標準' : 'Blood Donor Criteria'}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-red-700 dark:text-red-300 flex items-center gap-2">
                <Dog size={18} />
                {lang === 'zh' ? '狗隻捐血者' : 'Canine Donors'}
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-red-900 dark:text-red-100 text-sm">
                <li>{lang === 'zh' ? '體重 25-45 公斤' : 'Weight: 25-45 kg'}</li>
                <li>{lang === 'zh' ? '年齡 1-8 歲' : 'Age: 1-8 years old'}</li>
                <li>{lang === 'zh' ? '已完成疫苗接種' : 'Current on vaccinations'}</li>
                <li>{lang === 'zh' ? '健康無慢性病' : 'Healthy with no chronic conditions'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-300 flex items-center gap-2">
                <Cat size={18} />
                {lang === 'zh' ? '貓隻捐血者' : 'Feline Donors'}
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-red-900 dark:text-red-100 text-sm">
                <li>{lang === 'zh' ? '室內貓優先' : 'Indoor cats preferred'}</li>
                <li>{lang === 'zh' ? '健康狀況良好' : 'Healthy condition'}</li>
                <li>{lang === 'zh' ? '已進行 A/B 血型測試' : 'Type A/B tested'}</li>
                <li>{lang === 'zh' ? '體重 4 公斤以上' : 'Weight: 4 kg or above'}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-purple-50 dark:bg-purple-950 p-6 rounded-xl mb-8" data-testid="blood-groups-section">
          <h3 className="font-bold mb-4 text-lg text-purple-800 dark:text-purple-200">
            {lang === 'zh' ? '🩸 了解血型 (Blood Groups)' : '🩸 Understanding Blood Groups'}
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Dog size={18} />
                {lang === 'zh' ? '狗隻血型' : 'Canine Blood Types'}
              </h4>
              <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">
                {lang === 'zh' 
                  ? '狗隻最重要嘅血型系統係 DEA (Dog Erythrocyte Antigen)。'
                  : 'Dogs use the DEA (Dog Erythrocyte Antigen) blood typing system.'
                }
              </p>
              <ul className="list-disc pl-5 space-y-1 text-purple-800 dark:text-purple-200 text-sm">
                <li><strong>DEA 1.1+</strong> {lang === 'zh' ? '- 最常見，約 40% 狗隻' : '- Most common, ~40% of dogs'}</li>
                <li><strong>DEA 1.1-</strong> {lang === 'zh' ? '- 「萬能捐血者」' : '- "Universal donor"'}</li>
                <li>{lang === 'zh' ? '首次輸血通常可以唔使配血' : 'First transfusions often don\'t require cross-matching'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Cat size={18} />
                {lang === 'zh' ? '貓隻血型' : 'Feline Blood Types'}
              </h4>
              <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">
                {lang === 'zh' 
                  ? '貓隻有三種血型：A、B、AB。'
                  : 'Cats have three blood types: A, B, and AB.'
                }
              </p>
              <ul className="list-disc pl-5 space-y-1 text-purple-800 dark:text-purple-200 text-sm">
                <li><strong>{lang === 'zh' ? 'A 型' : 'Type A'}</strong> {lang === 'zh' ? '- 最常見 (約 95%)' : '- Most common (~95%)'}</li>
                <li><strong>{lang === 'zh' ? 'B 型' : 'Type B'}</strong> {lang === 'zh' ? '- 英短、波斯貓較常見' : '- More common in British Shorthair, Persian'}</li>
                <li><strong>{lang === 'zh' ? 'AB 型' : 'Type AB'}</strong> {lang === 'zh' ? '- 非常罕見' : '- Very rare'}</li>
                <li className="text-red-600 dark:text-red-400 font-medium">{lang === 'zh' ? '⚠️ 貓隻必須配血先可以輸血！' : '⚠️ Cats MUST be cross-matched before transfusion!'}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-8" data-testid="tips-section">
          <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-gray-100">
            {lang === 'zh' ? '💡 血庫使用小貼士' : '💡 Blood Bank Tips'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              {lang === 'zh' 
                ? '致電前先確認醫院目前有冇合適血型存貨。'
                : 'Always call ahead to confirm blood type availability.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '輸血前需要進行配血測試，確保血液相容。'
                : 'Cross-matching is required before transfusion to ensure compatibility.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '緊急情況下，部分醫院可安排即時配血。'
                : 'Some hospitals can arrange immediate cross-matching in emergencies.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '考慮登記你嘅寵物做捐血者，幫助其他有需要嘅毛孩。'
                : 'Consider registering your pet as a blood donor to help other pets in need.'
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
              ? `此血庫指南由 PetSOS 團隊人手核實，最後更新日期為 ${new Date(stats.lastVerified).toLocaleDateString('zh-HK')}。我哋會定期聯絡各醫院更新血庫資料，確保數據準確。如發現任何錯誤，歡迎聯絡我哋更正。`
              : `This blood bank guide is human-verified by the PetSOS team, last updated on ${new Date(stats.lastVerified).toLocaleDateString()}. We regularly contact hospitals to update blood bank information. Please contact us if you find any errors.`
            }
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
