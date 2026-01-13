import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Rabbit, MapPin, PhoneCall, ArrowLeft, ExternalLink, 
  Info, AlertTriangle, Bird, Bug
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
  exoticVet247: boolean | null;
  exoticSpecies247: string[];
  open247: boolean | null;
  liveStatus: string | null;
  phone: string | null;
  whatsapp: string | null;
  lastVerifiedAt: string | null;
}

interface BlogStats {
  exoticVet247Count: number;
  totalCount: number;
  speciesSupported: string[];
  lastVerified: string;
  topHospital: {
    id: string;
    nameEn: string;
    nameZh: string;
    speciesCount: number;
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

const SPECIES_FILTERS = [
  { key: 'rabbit', labelEn: 'Rabbit', labelZh: '兔仔' },
  { key: 'bird', labelEn: 'Bird', labelZh: '鳥類' },
  { key: 'reptile', labelEn: 'Reptile', labelZh: '爬蟲' },
  { key: 'small_mammal', labelEn: 'Small Mammal', labelZh: '小型哺乳類' },
];

function ExoticDashboard({ stats, lang }: { stats: BlogStats; lang: string }) {
  return (
    <div className="bg-green-50 dark:bg-green-950 rounded-2xl p-6 mb-10" data-testid="exotic-dashboard">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Rabbit className="text-green-600" size={28} />
          <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
            {lang === 'zh' ? '異寵急診支援系統' : 'Exotic Pet Emergency Support'}
          </h2>
        </div>
        <Badge className="bg-green-600 text-white">
          {lang === 'zh' ? '24小時' : '24/7'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-green-900 p-4 rounded-xl border-2 border-green-300">
          <div className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
            {lang === 'zh' ? '24h 異寵專科' : '24h Exotic Specialists'}
          </div>
          <div className="text-3xl font-bold text-green-800 dark:text-green-100" data-testid="stat-exotic-count">
            {stats.exoticVet247Count}
          </div>
          <div className="text-green-600 dark:text-green-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-green-900 p-4 rounded-xl border-2 border-green-300">
          <div className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
            {lang === 'zh' ? '可接診異寵' : 'Exotic-Capable'}
          </div>
          <div className="text-3xl font-bold text-green-800 dark:text-green-100">
            {stats.totalCount}
          </div>
          <div className="text-green-600 dark:text-green-400 text-xs">
            {lang === 'zh' ? '間醫院' : 'hospitals'}
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-green-900 p-4 rounded-xl border-2 border-green-300">
          <div className="text-green-600 dark:text-green-400 text-sm font-medium mb-2">
            {lang === 'zh' ? '支援物種' : 'Species Covered'}
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.speciesSupported.slice(0, 4).map(species => (
              <Badge key={species} variant="secondary" className="bg-green-100 text-green-700 text-xs">
                {species === 'rabbit' ? (lang === 'zh' ? '兔仔' : 'Rabbit') :
                 species === 'bird' ? (lang === 'zh' ? '鳥類' : 'Bird') :
                 species === 'reptile' ? (lang === 'zh' ? '爬蟲' : 'Reptile') :
                 species === 'small_mammal' ? (lang === 'zh' ? '小型哺乳' : 'Small Mammal') :
                 species}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExoticHospitalCard({ hospital, lang }: { hospital: HospitalData; lang: string }) {
  const regionName = lang === 'zh' ? hospital.regionNameZh : hospital.regionNameEn;
  const hospitalName = lang === 'zh' ? hospital.nameZh : hospital.nameEn;
  
  const getSpeciesLabel = (species: string) => {
    switch (species) {
      case 'rabbit': return lang === 'zh' ? '兔仔' : 'Rabbit';
      case 'bird': return lang === 'zh' ? '鳥類' : 'Bird';
      case 'reptile': return lang === 'zh' ? '爬蟲' : 'Reptile';
      case 'small_mammal': return lang === 'zh' ? '小型哺乳' : 'Small Mammal';
      default: return species;
    }
  };
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-t-8 border-t-green-500" data-testid={`hospital-card-${hospital.id}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
            <Rabbit className="text-green-600" size={24} />
          </div>
          <Badge 
            className={hospital.exoticVet247 
              ? "bg-green-500 text-white text-xs" 
              : "bg-yellow-500 text-white text-xs"
            }
          >
            {hospital.exoticVet247 
              ? (lang === 'zh' ? '✅ 24h 專科' : '✅ 24h Specialist')
              : (lang === 'zh' ? '📞 需預約' : '📞 By Appointment')
            }
          </Badge>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {hospitalName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={14} /> {regionName || hospital.regionNameEn}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">
            {lang === 'zh' ? '24h 異寵支援:' : '24h Exotic Support:'}
            {hospital.exoticVet247 
              ? <span className="text-green-600 font-medium"> ✅ {lang === 'zh' ? '有' : 'Yes'}</span>
              : <span className="text-yellow-600 font-medium"> 📞 {lang === 'zh' ? '需預約' : 'By Appointment'}</span>
            }
          </p>
          
          {hospital.exoticSpecies247 && hospital.exoticSpecies247.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hospital.exoticSpecies247.map(species => (
                <Badge key={species} variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">
                  {getSpeciesLabel(species)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {hospital.phone && (
            <a 
              href={`tel:${hospital.phone}`}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
              data-testid={`call-${hospital.id}`}
            >
              <PhoneCall size={16} />
              {lang === 'zh' ? '即刻求助' : 'Call Now'}
            </a>
          )}
          <Link href={`/hospitals/${hospital.slug}`}>
            <Button variant="outline" size="icon" className="w-12 h-12" data-testid={`details-${hospital.id}`}>
              <Info size={20} />
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

export default function ExoticEmergencyBlog() {
  const { language } = useLanguage();
  const lang = language === 'zh-HK' ? 'zh' : 'en';
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  
  const { data, isLoading, error } = useQuery<BlogData>({
    queryKey: ["/api/blog/exotic-emergency"]
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Rabbit className="mx-auto h-12 w-12 text-green-500 mb-4" />
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
  
  if (selectedSpecies !== 'all') {
    filteredHospitals = filteredHospitals.filter(h => 
      h.exoticSpecies247 && h.exoticSpecies247.includes(selectedSpecies)
    );
  }

  const pageTitle = lang === 'zh' 
    ? `2026 香港異寵急症地圖 | 兔仔、龍貓、鳥類 24 小時專科醫療` 
    : `24/7 Exotic Pet Emergencies in Hong Kong 2026 | Rabbits, Chinchillas & Birds`;
  
  const pageDescription = lang === 'zh'
    ? `異寵（Exotics）生理結構特殊，普通獸醫未必能處理其急症。PetSOS 核實全港具備 exoticVet247 資質的醫院，共 ${stats.exoticVet247Count} 間。`
    : `Exotic pets hide illnesses until they are critical. In Hong Kong, only ${stats.exoticVet247Count} clinics have specialized 24h exotic vet staffing.`;

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
              h.exoticVet247 && "24/7 Exotic Vet Specialist",
              ...(h.exoticSpecies247 || []).map(s => `Treats ${s}`)
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
            <Rabbit size={14} />
            <span data-testid="last-verified">
              {lang === 'zh' ? '最後更新' : 'Last Updated'}: {formatDistanceToNow(new Date(stats.lastVerified), { addSuffix: true })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4" data-testid="page-title">
            {lang === 'zh' 
              ? '2026 香港異寵急症地圖 | 兔仔、龍貓、鳥類 24 小時專科醫療'
              : '24/7 Exotic Pet Emergencies in Hong Kong 2026 | Rabbits, Chinchillas & Birds'
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
                異寵（Exotics）生理結構特殊，普通獸醫未必能處理其急症。PetSOS 核實全港具備 exoticVet247 資質的醫院。
                當遇到兔子不吃不喝等緊急情況，請參考以下具備異寵醫療能力的 24 小時醫院清單。
                目前共有 <strong>{stats.exoticVet247Count}</strong> 間醫院提供 24 小時異寵專科服務。
              </>
            ) : (
              <>
                Exotic pets hide illnesses until they are critical. In Hong Kong, only <strong>{stats.exoticVet247Count}</strong> clinics 
                have specialized 24h exotic vet staffing. This guide tracks which hospitals see rabbits, birds, reptiles 
                and small mammals after-hours.
              </>
            )}
          </p>
        </section>

        <section className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg" data-testid="warning-section">
          <h3 className="font-bold mb-2 text-lg text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertTriangle size={20} />
            {lang === 'zh' ? '緊急警告' : 'Critical Warning'}
          </h3>
          <p className="text-red-700 dark:text-red-300 leading-relaxed">
            {lang === 'zh' 
              ? '⚠️ 腸停滯（Gut Stasis）對兔子是致命急症，如果兔子停止進食，不能等待超過 12 小時！'
              : '⚠️ Gut Stasis (腸停滯) in rabbits is a life-threatening emergency. Do not wait more than 12 hours if your rabbit stops eating.'
            }
          </p>
        </section>

        <ExoticDashboard stats={stats} lang={lang} />

        <section className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {lang === 'zh' ? '異寵急症醫院' : 'Exotic Emergency Hospitals'}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2" data-testid="species-filter">
                {SPECIES_FILTERS.map(filter => (
                  <Button
                    key={filter.key}
                    variant={selectedSpecies === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSpecies(selectedSpecies === filter.key ? 'all' : filter.key)}
                    className={selectedSpecies === filter.key ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {filter.key === 'rabbit' && <Rabbit size={14} className="mr-1" />}
                    {filter.key === 'bird' && <Bird size={14} className="mr-1" />}
                    {filter.key === 'reptile' && <Bug size={14} className="mr-1" />}
                    {lang === 'zh' ? filter.labelZh : filter.labelEn}
                  </Button>
                ))}
              </div>
              
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="hospitals-grid">
            {filteredHospitals.map(hospital => (
              <ExoticHospitalCard key={hospital.id} hospital={hospital} lang={lang} />
            ))}
          </div>

          {filteredHospitals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {lang === 'zh' ? '此地區暫無符合條件的醫院' : 'No matching hospitals found in this region'}
            </div>
          )}
        </section>

        <section className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-8" data-testid="tips-section">
          <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-gray-100">
            {lang === 'zh' ? '💡 異寵急救小貼士' : '💡 Exotic Pet Emergency Tips'}
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              {lang === 'zh' 
                ? '兔子停止進食或排便超過 12 小時，必須立即就醫。'
                : 'If your rabbit stops eating or pooping for more than 12 hours, seek immediate vet care.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '鳥類呼吸困難（張嘴呼吸、尾部上下擺動）是緊急狀況。'
                : 'Birds with breathing difficulties (open-mouth breathing, tail bobbing) need emergency care.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '爬蟲類動物體溫過低會導致消化系統停止運作。'
                : 'Reptiles with low body temperature may have their digestive system shut down.'
              }
            </li>
            <li>
              {lang === 'zh'
                ? '帶寵物就診時，請保持適當溫度並攜帶平時的食物。'
                : 'When bringing your pet to the vet, maintain proper temperature and bring their regular food.'
              }
            </li>
          </ul>
        </section>

        <section className="bg-green-50 dark:bg-green-950 p-6 rounded-xl mb-8">
          <h3 className="font-bold mb-2 text-green-800 dark:text-green-200">
            {lang === 'zh' ? '關於此數據' : 'About This Data'}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            {lang === 'zh' 
              ? `此異寵急症指南由 PetSOS 團隊人手核實，最後更新日期為 ${new Date(stats.lastVerified).toLocaleDateString('zh-HK')}。我哋會定期聯絡各醫院更新異寵醫療資料，確保數據準確。如發現任何錯誤，歡迎聯絡我哋更正。`
              : `This exotic pet emergency guide is human-verified by the PetSOS team, last updated on ${new Date(stats.lastVerified).toLocaleDateString()}. We regularly contact hospitals to update exotic pet care information. Please contact us if you find any errors.`
            }
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
