import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageCircle, Navigation, Clock, MapPin, ArrowLeft, ExternalLink, AlertTriangle, Ship } from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData, createDistrictCollectionSchema } from "@/components/StructuredData";
import { analytics } from "@/lib/analytics";
import type { Clinic, Hospital } from "@shared/schema";

interface District {
  slug: string;
  nameEn: string;
  nameZh: string;
  regionCode: string;
  latitude: number;
  longitude: number;
  descriptionEn: string;
  descriptionZh: string;
  keywordsEn: string;
  keywordsZh: string;
  transportWarningEn?: string;
  transportWarningZh?: string;
  hasTransportRestriction?: boolean;
}

const HONG_KONG_DISTRICTS: District[] = [
  {
    slug: "central",
    nameEn: "Central",
    nameZh: "中環",
    regionCode: "HKI",
    latitude: 22.2819,
    longitude: 114.1580,
    descriptionEn: "When your dog, cat, or beloved pet needs emergency care in Central, every second counts. Find nearby 24-hour veterinary clinics ready to help—whether it's late at night, on a holiday, or during a weekend crisis.",
    descriptionZh: "當您的狗狗、貓咪或心愛寵物在中環需要緊急護理時，分秒必爭。尋找附近隨時候命的24小時獸醫診所—無論深夜、假期或週末緊急情況。",
    keywordsEn: "Central vet, 24-hour animal hospital Central, emergency pet care Central Hong Kong, veterinary clinic Central MTR",
    keywordsZh: "中環獸醫, 中環24小時動物醫院, 中環寵物緊急護理, 中環港鐵獸醫診所"
  },
  {
    slug: "tsim-sha-tsui",
    nameEn: "Tsim Sha Tsui",
    nameZh: "尖沙咀",
    regionCode: "KLN",
    latitude: 22.2976,
    longitude: 114.1722,
    descriptionEn: "Your pet's emergency can't wait. Connect instantly with 24-hour veterinary clinics in Tsim Sha Tsui ready to provide urgent care. Help is available right now, any time of day or night.",
    descriptionZh: "您寵物的緊急情況不能等待。即時聯繫尖沙咀24小時獸醫診所，隨時提供緊急護理。無論日夜，即刻獲得幫助。",
    keywordsEn: "Tsim Sha Tsui vet, TST animal hospital, 24-hour pet clinic Kowloon, emergency vet Nathan Road",
    keywordsZh: "尖沙咀獸醫, 尖沙咀動物醫院, 九龍24小時寵物診所, 彌敦道緊急獸醫"
  },
  {
    slug: "mong-kok",
    nameEn: "Mong Kok",
    nameZh: "旺角",
    regionCode: "KLN",
    latitude: 22.3193,
    longitude: 114.1694,
    descriptionEn: "Is your pet sick or injured in Mong Kok? Get immediate help from 24-hour emergency vets near you. One tap connects you to all available clinics—no searching, no delays.",
    descriptionZh: "您的寵物在旺角生病或受傷？立即獲得附近24小時緊急獸醫的幫助。一按即可聯繫所有可用診所—無需搜尋，無需延誤。",
    keywordsEn: "Mong Kok vet, 24-hour veterinary Mong Kok, pet emergency Argyle Street, animal hospital Ladies Market",
    keywordsZh: "旺角獸醫, 旺角24小時獸醫, 亞皆老街寵物緊急, 女人街動物醫院"
  },
  {
    slug: "causeway-bay",
    nameEn: "Causeway Bay",
    nameZh: "銅鑼灣",
    regionCode: "HKI",
    latitude: 22.2799,
    longitude: 114.1853,
    descriptionEn: "When your pet needs emergency care in Causeway Bay, don't panic—help is closer than you think. Alert all 24-hour vets instantly and get your pet the urgent care they need.",
    descriptionZh: "當您的寵物在銅鑼灣需要緊急護理時，不要驚慌—幫助就在附近。即時通知所有24小時獸醫，讓您的寵物獲得所需的緊急護理。",
    keywordsEn: "Causeway Bay vet, emergency animal hospital Causeway Bay, 24-hour pet clinic Times Square, veterinary Victoria Park",
    keywordsZh: "銅鑼灣獸醫, 銅鑼灣緊急動物醫院, 時代廣場24小時寵物診所, 維多利亞公園獸醫"
  },
  {
    slug: "wan-chai",
    nameEn: "Wan Chai",
    nameZh: "灣仔",
    regionCode: "HKI",
    latitude: 22.2769,
    longitude: 114.1722,
    descriptionEn: "Facing a pet emergency in Wan Chai? You're not alone. Connect with experienced 24-hour emergency vets who understand your pet needs help now, not later.",
    descriptionZh: "在灣仔面對寵物緊急情況？您並不孤單。聯繫經驗豐富的24小時緊急獸醫，他們明白您的寵物現在就需要幫助。",
    keywordsEn: "Wan Chai vet, 24-hour animal hospital Wan Chai, emergency pet care Happy Valley, veterinary clinic Convention Centre",
    keywordsZh: "灣仔獸醫, 灣仔24小時動物醫院, 跑馬地緊急寵物護理, 會展獸醫診所"
  },
  {
    slug: "eastern",
    nameEn: "Eastern District",
    nameZh: "東區",
    regionCode: "HKI",
    latitude: 22.2842,
    longitude: 114.2240,
    descriptionEn: "Pet emergency in Eastern District including Shau Kei Wan and Quarry Bay? Connect instantly with 24-hour veterinary clinics ready to help your pet. Emergency care is available around the clock.",
    descriptionZh: "筲箕灣、鰂魚涌等東區寵物緊急情況？即時聯繫24小時獸醫診所，隨時為您的寵物提供幫助。全天候緊急護理服務。",
    keywordsEn: "Eastern District vet, 24-hour animal hospital Shau Kei Wan, emergency pet care Quarry Bay, veterinary clinic Sai Wan Ho",
    keywordsZh: "東區獸醫, 筲箕灣24小時動物醫院, 鰂魚涌緊急寵物護理, 西灣河獸醫診所"
  },
  {
    slug: "southern",
    nameEn: "Southern District",
    nameZh: "南區",
    regionCode: "HKI",
    latitude: 22.2472,
    longitude: 114.1553,
    descriptionEn: "Pet emergency in Southern District including Repulse Bay and Stanley? Find 24-hour veterinary clinics nearby. Don't let distance delay your pet's emergency care.",
    descriptionZh: "淺水灣、赤柱等南區寵物緊急情況？尋找附近24小時獸醫診所。不要讓距離延誤您寵物的緊急護理。",
    keywordsEn: "Southern District vet, 24-hour animal hospital Repulse Bay, emergency pet care Stanley, veterinary clinic Aberdeen",
    keywordsZh: "南區獸醫, 淺水灣24小時動物醫院, 赤柱緊急寵物護理, 香港仔獸醫診所"
  },
  {
    slug: "aberdeen",
    nameEn: "Aberdeen",
    nameZh: "香港仔",
    regionCode: "HKI",
    latitude: 22.2478,
    longitude: 114.1556,
    descriptionEn: "Pet emergency in Aberdeen or Ap Lei Chau? Find nearby 24-hour veterinary clinics ready to provide urgent care. Help is available around the clock.",
    descriptionZh: "香港仔或鴨脷洲寵物緊急情況？尋找附近24小時獸醫診所，隨時提供緊急護理。全天候服務。",
    keywordsEn: "Aberdeen vet, 24-hour animal hospital Aberdeen, emergency pet care Ap Lei Chau, veterinary clinic South Horizons",
    keywordsZh: "香港仔獸醫, 香港仔24小時動物醫院, 鴨脷洲緊急寵物護理, 海怡半島獸醫診所"
  },
  {
    slug: "jordan",
    nameEn: "Jordan",
    nameZh: "佐敦",
    regionCode: "KLN",
    latitude: 22.3047,
    longitude: 114.1721,
    descriptionEn: "Pet emergency in Jordan? Connect instantly with 24-hour veterinary clinics in Kowloon ready to help your pet. Emergency care available day and night.",
    descriptionZh: "佐敦寵物緊急情況？即時聯繫九龍24小時獸醫診所，隨時為您的寵物提供幫助。日夜緊急護理服務。",
    keywordsEn: "Jordan vet, 24-hour animal hospital Jordan, emergency pet care Yau Ma Tei, veterinary clinic Austin Road",
    keywordsZh: "佐敦獸醫, 佐敦24小時動物醫院, 油麻地緊急寵物護理, 柯士甸道獸醫診所"
  },
  {
    slug: "kowloon-city",
    nameEn: "Kowloon City",
    nameZh: "九龍城",
    regionCode: "KLN",
    latitude: 22.3307,
    longitude: 114.1897,
    descriptionEn: "Pet emergency in Kowloon City or To Kwa Wan? Find 24-hour veterinary clinics ready to provide urgent care. Every second counts in a pet emergency.",
    descriptionZh: "九龍城或土瓜灣寵物緊急情況？尋找24小時獸醫診所，隨時提供緊急護理。寵物緊急情況分秒必爭。",
    keywordsEn: "Kowloon City vet, 24-hour animal hospital To Kwa Wan, emergency pet care Ho Man Tin, veterinary clinic Kai Tak",
    keywordsZh: "九龍城獸醫, 土瓜灣24小時動物醫院, 何文田緊急寵物護理, 啟德獸醫診所"
  },
  {
    slug: "kowloon-bay",
    nameEn: "Kowloon Bay",
    nameZh: "九龍灣",
    regionCode: "KLN",
    latitude: 22.3234,
    longitude: 114.2136,
    descriptionEn: "Pet emergency in Kowloon Bay? Connect with experienced 24-hour emergency vets nearby. Fast access to veterinary care can save your pet's life.",
    descriptionZh: "九龍灣寵物緊急情況？聯繫附近經驗豐富的24小時緊急獸醫。快速獲得獸醫護理可以拯救您寵物的生命。",
    keywordsEn: "Kowloon Bay vet, 24-hour animal hospital Kowloon Bay, emergency pet care Telford Gardens, veterinary clinic MegaBox",
    keywordsZh: "九龍灣獸醫, 九龍灣24小時動物醫院, 德福花園緊急寵物護理, MegaBox獸醫診所"
  },
  {
    slug: "kwun-tong",
    nameEn: "Kwun Tong",
    nameZh: "觀塘",
    regionCode: "KLN",
    latitude: 22.3131,
    longitude: 114.2258,
    descriptionEn: "Pet emergency in Kwun Tong? Find 24-hour veterinary clinics in East Kowloon ready to help. Immediate access to emergency pet care.",
    descriptionZh: "觀塘寵物緊急情況？尋找東九龍24小時獸醫診所，隨時提供幫助。即時獲得緊急寵物護理。",
    keywordsEn: "Kwun Tong vet, 24-hour animal hospital Kwun Tong, emergency pet care APM, veterinary clinic Lam Tin",
    keywordsZh: "觀塘獸醫, 觀塘24小時動物醫院, APM緊急寵物護理, 藍田獸醫診所"
  },
  {
    slug: "wong-tai-sin",
    nameEn: "Wong Tai Sin",
    nameZh: "黃大仙",
    regionCode: "KLN",
    latitude: 22.3419,
    longitude: 114.1936,
    descriptionEn: "Pet emergency in Wong Tai Sin? Connect with 24-hour veterinary clinics ready to provide urgent care for your pet. Help is available now.",
    descriptionZh: "黃大仙寵物緊急情況？聯繫24小時獸醫診所，隨時為您的寵物提供緊急護理。即時獲得幫助。",
    keywordsEn: "Wong Tai Sin vet, 24-hour animal hospital Wong Tai Sin, emergency pet care Diamond Hill, veterinary clinic Choi Hung",
    keywordsZh: "黃大仙獸醫, 黃大仙24小時動物醫院, 鑽石山緊急寵物護理, 彩虹獸醫診所"
  },
  {
    slug: "sham-shui-po",
    nameEn: "Sham Shui Po",
    nameZh: "深水埗",
    regionCode: "KLN",
    latitude: 22.3303,
    longitude: 114.1622,
    descriptionEn: "Pet emergency in Sham Shui Po? Find nearby 24-hour veterinary clinics ready to help. Don't wait—get your pet the care they need now.",
    descriptionZh: "深水埗寵物緊急情況？尋找附近24小時獸醫診所，隨時提供幫助。不要等待—立即為您的寵物獲得所需護理。",
    keywordsEn: "Sham Shui Po vet, 24-hour animal hospital Sham Shui Po, emergency pet care Cheung Sha Wan, veterinary clinic Lai Chi Kok",
    keywordsZh: "深水埗獸醫, 深水埗24小時動物醫院, 長沙灣緊急寵物護理, 荔枝角獸醫診所"
  },
  {
    slug: "sha-tin",
    nameEn: "Sha Tin",
    nameZh: "沙田",
    regionCode: "NTI",
    latitude: 22.3817,
    longitude: 114.1886,
    descriptionEn: "Pet emergency in Sha Tin or New Territories? Fast access to 24-hour veterinary care can save your pet's life. Get connected to emergency vets immediately.",
    descriptionZh: "沙田或新界寵物緊急情況？快速獲得24小時獸醫護理可以拯救您寵物的生命。立即聯繫緊急獸醫。",
    keywordsEn: "Sha Tin vet, New Territories animal hospital, 24-hour pet clinic Sha Tin, emergency vet Ma On Shan",
    keywordsZh: "沙田獸醫, 新界動物醫院, 沙田24小時寵物診所, 馬鞍山緊急獸醫"
  },
  {
    slug: "lamma-island",
    nameEn: "Lamma Island",
    nameZh: "南丫島",
    regionCode: "ISL",
    latitude: 22.2167,
    longitude: 114.1167,
    descriptionEn: "Pet emergency on Lamma Island requires special planning. There are NO veterinary clinics on Lamma Island. You must take the ferry to Central or Aberdeen, then proceed to a 24-hour vet on Hong Kong Island.",
    descriptionZh: "南丫島寵物緊急情況需要特別計劃。南丫島上沒有獸醫診所。您必須乘渡輪到中環或香港仔，然後前往港島的24小時獸醫診所。",
    keywordsEn: "Lamma Island vet, pet emergency Lamma, ferry pet transport, outlying islands vet",
    keywordsZh: "南丫島獸醫, 南丫島寵物緊急, 渡輪寵物運輸, 離島獸醫",
    hasTransportRestriction: true,
    transportWarningEn: "⚠️ TRANSPORT ALERT: No veterinary clinics on Lamma Island. You must take the ferry to Central (Central Pier 4, ~30 min) or Aberdeen (Aberdeen Promenade Pier, ~25 min). Last ferries: Central ~11:30pm, Aberdeen ~10:30pm. After last ferry, contact emergency marine services. Plan your route to the nearest Hong Kong Island 24-hour vet before departing.",
    transportWarningZh: "⚠️ 交通警示：南丫島上沒有獸醫診所。您必須乘渡輪到中環（中環4號碼頭，約30分鐘）或香港仔（香港仔海濱長廊碼頭，約25分鐘）。尾班船：中環約晚上11:30，香港仔約晚上10:30。尾班船後請聯繫緊急海上服務。出發前請先規劃到最近港島24小時獸醫診所的路線。"
  },
  {
    slug: "discovery-bay",
    nameEn: "Discovery Bay",
    nameZh: "愉景灣",
    regionCode: "ISL",
    latitude: 22.2947,
    longitude: 114.0147,
    descriptionEn: "Pet emergency in Discovery Bay? Limited vehicle access means you need to plan your route carefully. The fastest way to a 24-hour vet is via ferry to Central, or Discovery Bay bus to Tung Chung MTR.",
    descriptionZh: "愉景灣寵物緊急情況？受限的車輛通行意味著您需要仔細規劃路線。到24小時獸醫最快的方式是乘渡輪到中環，或乘愉景灣巴士到東涌港鐵站。",
    keywordsEn: "Discovery Bay vet, pet emergency DB, Lantau Island vet, Discovery Bay ferry pet",
    keywordsZh: "愉景灣獸醫, 愉景灣寵物緊急, 大嶼山獸醫, 愉景灣渡輪寵物",
    hasTransportRestriction: true,
    transportWarningEn: "⚠️ TRANSPORT ALERT: Discovery Bay has restricted vehicle access. Options: 1) Ferry to Central (24/7 service, ~25 min, pets allowed on deck), 2) DB Bus to Tung Chung MTR (~15 min), then taxi to nearest Kowloon vet. Private cars cannot enter DB—arrange taxi pickup at DB Plaza or ferry pier. After midnight: ferry service continues 24/7 but reduced frequency.",
    transportWarningZh: "⚠️ 交通警示：愉景灣限制車輛進入。選項：1) 渡輪到中環（24小時服務，約25分鐘，寵物可在甲板），2) 愉景灣巴士到東涌港鐵站（約15分鐘），然後乘的士到最近的九龍獸醫。私家車不能進入愉景灣—請安排在愉景廣場或渡輪碼頭接載。午夜後：渡輪服務繼續24小時但班次減少。"
  },
  {
    slug: "cheung-chau",
    nameEn: "Cheung Chau",
    nameZh: "長洲",
    regionCode: "ISL",
    latitude: 22.2100,
    longitude: 114.0267,
    descriptionEn: "Pet emergency on Cheung Chau? There are no 24-hour veterinary clinics on the island. You must take the ferry to Central for emergency vet care.",
    descriptionZh: "長洲寵物緊急情況？島上沒有24小時獸醫診所。您必須乘渡輪到中環尋求緊急獸醫護理。",
    keywordsEn: "Cheung Chau vet, pet emergency outlying islands, ferry pet transport Central",
    keywordsZh: "長洲獸醫, 離島寵物緊急, 渡輪寵物運輸中環",
    hasTransportRestriction: true,
    transportWarningEn: "⚠️ TRANSPORT ALERT: No veterinary clinics on Cheung Chau. Take the ferry to Central (Central Pier 5, ~35-55 min depending on fast/slow ferry). Last fast ferry ~11:30pm, last slow ferry ~11:45pm. Pets are allowed on ferries. Plan your route to Hong Kong Island 24-hour vet before departing.",
    transportWarningZh: "⚠️ 交通警示：長洲沒有獸醫診所。乘渡輪到中環（中環5號碼頭，約35-55分鐘，視快船/慢船而定）。尾班快船約晚上11:30，尾班慢船約晚上11:45。渡輪允許攜帶寵物。出發前請先規劃到港島24小時獸醫診所的路線。"
  },
  {
    slug: "tuen-mun",
    nameEn: "Tuen Mun",
    nameZh: "屯門",
    regionCode: "NTI",
    latitude: 22.3908,
    longitude: 113.9772,
    descriptionEn: "Pet emergency in Tuen Mun? Connect with nearby 24-hour veterinary clinics in the New Territories West region. Fast access to emergency care when your pet needs it most.",
    descriptionZh: "屯門寵物緊急情況？聯繫新界西區附近的24小時獸醫診所。在您的寵物最需要時快速獲得緊急護理。",
    keywordsEn: "Tuen Mun vet, 24-hour animal hospital Tuen Mun, emergency pet care New Territories West",
    keywordsZh: "屯門獸醫, 屯門24小時動物醫院, 新界西緊急寵物護理"
  },
  {
    slug: "yuen-long",
    nameEn: "Yuen Long",
    nameZh: "元朗",
    regionCode: "NTI",
    latitude: 22.4445,
    longitude: 114.0228,
    descriptionEn: "Pet emergency in Yuen Long? Find 24-hour veterinary clinics in the New Territories ready to help your pet. Immediate access to emergency care.",
    descriptionZh: "元朗寵物緊急情況？尋找新界24小時獸醫診所，隨時為您的寵物提供幫助。即時獲得緊急護理。",
    keywordsEn: "Yuen Long vet, 24-hour pet clinic Yuen Long, emergency vet New Territories",
    keywordsZh: "元朗獸醫, 元朗24小時寵物診所, 新界緊急獸醫"
  },
  {
    slug: "yau-ma-tei",
    nameEn: "Yau Ma Tei",
    nameZh: "油麻地",
    regionCode: "KLN",
    latitude: 22.3126,
    longitude: 114.1705,
    descriptionEn: "Pet emergency in Yau Ma Tei? Connect with 24-hour veterinary clinics in Kowloon. Immediate access to emergency pet care when your pet needs it most.",
    descriptionZh: "油麻地寵物緊急情況？聯繫九龍24小時獸醫診所。在您的寵物最需要時即時獲得緊急護理。",
    keywordsEn: "Yau Ma Tei vet, 24-hour animal hospital Yau Ma Tei, emergency pet care Temple Street, veterinary clinic Nathan Road",
    keywordsZh: "油麻地獸醫, 油麻地24小時動物醫院, 廟街緊急寵物護理, 彌敦道獸醫診所"
  },
  {
    slug: "tai-po",
    nameEn: "Tai Po",
    nameZh: "大埔",
    regionCode: "NTI",
    latitude: 22.4507,
    longitude: 114.1642,
    descriptionEn: "Pet emergency in Tai Po? Find 24-hour veterinary clinics in the New Territories ready to help. Quick access to emergency care for your pet.",
    descriptionZh: "大埔寵物緊急情況？尋找新界24小時獸醫診所，隨時提供幫助。快速獲得您寵物的緊急護理。",
    keywordsEn: "Tai Po vet, 24-hour animal hospital Tai Po, emergency pet care New Territories North, veterinary clinic Tai Wo",
    keywordsZh: "大埔獸醫, 大埔24小時動物醫院, 新界北緊急寵物護理, 太和獸醫診所"
  },
  {
    slug: "tsuen-wan",
    nameEn: "Tsuen Wan",
    nameZh: "荃灣",
    regionCode: "NTI",
    latitude: 22.3703,
    longitude: 114.1144,
    descriptionEn: "Pet emergency in Tsuen Wan? Connect with 24-hour veterinary clinics ready to provide urgent care. Help is available around the clock.",
    descriptionZh: "荃灣寵物緊急情況？聯繫24小時獸醫診所，隨時提供緊急護理。全天候服務。",
    keywordsEn: "Tsuen Wan vet, 24-hour animal hospital Tsuen Wan, emergency pet care New Territories West, veterinary clinic Kwai Chung",
    keywordsZh: "荃灣獸醫, 荃灣24小時動物醫院, 新界西緊急寵物護理, 葵涌獸醫診所"
  }
];

export default function DistrictPage() {
  const params = useParams();
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  
  const district = HONG_KONG_DISTRICTS.find(d => d.slug === params.district);

  const { data: regions } = useQuery<Array<{id: string; code: string}>>({
    queryKey: ['/api/regions'],
  });

  const { data: clinics, isLoading } = useQuery<Clinic[]>({
    queryKey: ['/api/clinics'],
    enabled: !!district,
  });

  // Fetch hospitals for CollectionPage schema (hospitals have slugs, clinics don't)
  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ['/api/hospitals'],
    enabled: !!district,
  });

  // Track district page view
  useEffect(() => {
    if (district) {
      analytics.trackDistrictPageView({
        district: district.slug,
        region: district.regionCode,
        language,
      });
    }
  }, [district, language]);

  if (!district) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">District Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {language === 'zh-HK' ? '找不到該地區' : 'District not found'}
            </p>
            <Button onClick={() => navigate('/clinics')} className="bg-red-600 hover:bg-red-700">
              {language === 'zh-HK' ? '瀏覽所有診所' : 'Browse All Clinics'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const regionId = regions?.find(r => r.code === district.regionCode)?.id;
  const districtClinics = clinics?.filter(clinic => 
    clinic.regionId === regionId
  ).slice(0, 10) || [];

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9+]/g, "")}`, "_blank");
  };

  const handleMaps = (latitude: number, longitude: number, name: string) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodeURIComponent(name)}`;
    window.open(mapsUrl, "_blank");
  };

  const createLocalBusinessSchema = () => ({
    "@context": "https://schema.org",
    "@type": "VeterinaryCare",
    "name": `PetSOS ${language === 'zh-HK' ? district.nameZh : district.nameEn}`,
    "description": language === 'zh-HK' ? district.descriptionZh : district.descriptionEn,
    "areaServed": {
      "@type": "Place",
      "name": language === 'zh-HK' ? district.nameZh : district.nameEn,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": district.latitude,
        "longitude": district.longitude
      },
      "address": {
        "@type": "PostalAddress",
        "addressRegion": language === 'zh-HK' ? district.nameZh : district.nameEn,
        "addressCountry": "HK"
      }
    },
    "availableService": {
      "@type": "MedicalProcedure",
      "name": language === 'zh-HK' ? "24小時緊急獸醫服務" : "24-Hour Emergency Veterinary Services"
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
        "name": language === 'zh-HK' ? "診所目錄" : "Clinics",
        "item": "https://petsos.site/clinics"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": language === 'zh-HK' ? district.nameZh : district.nameEn,
        "item": `https://petsos.site/district/${district.slug}`
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? `${district.nameZh}24小時獸醫 | PetSOS緊急寵物護理`
          : `${district.nameEn} 24-Hour Vet | PetSOS Emergency Pet Care`
        }
        description={language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
        keywords={language === 'zh-HK' ? district.keywordsZh : district.keywordsEn}
        canonical={`https://petsos.site/district/${district.slug}`}
        language={language}
      />
      <StructuredData data={createLocalBusinessSchema()} id="schema-local-business" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb" />
      {(() => {
        // Get verified 24-hour hospitals in this region for CollectionPage schema
        const districtHospitals = hospitals?.filter(h => 
          h.regionId === regionId && 
          h.slug && 
          h.open247 && 
          (h.verified || h.isAvailable)
        ).sort((a, b) => {
          // Sort: partners first, then by lastVerifiedAt desc
          if (a.isPartner && !b.isPartner) return -1;
          if (!a.isPartner && b.isPartner) return 1;
          const aDate = a.lastVerifiedAt ? new Date(a.lastVerifiedAt).getTime() : 0;
          const bDate = b.lastVerifiedAt ? new Date(b.lastVerifiedAt).getTime() : 0;
          return bDate - aDate;
        }) || [];
        
        return districtHospitals.length > 0 ? (
          <StructuredData 
            data={createDistrictCollectionSchema(
              language === 'zh-HK' ? district.nameZh : district.nameEn,
              `https://petsos.site/district/${district.slug}`,
              districtHospitals.map(h => ({
                slug: h.slug!,
                nameEn: h.nameEn,
                isPartner: h.isPartner || false
              })),
              language
            )} 
            id="schema-collection-page" 
          />
        ) : null;
      })()}

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/clinics')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '返回診所目錄' : 'Back to Clinics'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-district-title">
                {language === 'zh-HK' ? district.nameZh : district.nameEn}
              </h1>
              <p className="text-muted-foreground" data-testid="text-district-description">
                {language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Transport Warning for Remote Districts */}
        {district.hasTransportRestriction && (
          <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-900/10" data-testid="card-transport-warning">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-600 rounded-full flex-shrink-0">
                  <Ship className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                    <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                      {language === 'zh-HK' ? '重要交通資訊' : 'Important Transport Information'}
                    </h2>
                  </div>
                  <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                    {language === 'zh-HK' ? district.transportWarningZh : district.transportWarningEn}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                      onClick={() => window.open('https://www.nwff.com.hk/route', '_blank')}
                      data-testid="button-ferry-schedule"
                    >
                      <Ship className="h-4 w-4 mr-2" />
                      {language === 'zh-HK' ? '渡輪時刻表' : 'Ferry Schedule'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                      onClick={() => navigate('/hospitals')}
                      data-testid="button-find-mainland-vet"
                    >
                      {language === 'zh-HK' ? '查看港島/九龍獸醫' : 'View HK Island/Kowloon Vets'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency CTA */}
        <Card className="mb-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                  {language === 'zh-HK' ? '您的寵物正處於危險中？' : 'Is Your Pet in Distress?'}
                </h2>
                <p className="text-red-800 dark:text-red-200 mb-2">
                  {language === 'zh-HK' 
                    ? `我們明白這有多可怕。即時通知${district.nameZh}所有24小時緊急獸醫。他們會在數秒內收到訊息—讓您的寵物更快獲得幫助。`
                    : `We know how scary this is. Instantly alert all 24-hour emergency vets in ${district.nameEn}. They'll get your message in seconds—so your pet gets help faster.`
                  }
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4 font-medium">
                  {language === 'zh-HK' ? '大多數診所在5-15分鐘內回應' : 'Most vets respond within 5-15 minutes'}
                </p>
                <Button
                  onClick={() => {
                    analytics.event('district_emergency_cta_click', {
                      event_category: 'CTA',
                      district: district.slug,
                      region: district.regionCode,
                    });
                    navigate('/emergency');
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-emergency-cta"
                >
                  {language === 'zh-HK' ? '發送緊急求助' : 'Send Emergency Request'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinics List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {language === 'zh-HK' ? '附近診所' : 'Nearby Clinics'}
            </h2>
            <Link href="/clinics">
              <Button variant="outline" size="sm" data-testid="button-view-all">
                {language === 'zh-HK' ? '查看所有診所' : 'View All Clinics'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : districtClinics.length > 0 ? (
            <div className="space-y-4">
              {districtClinics.map(clinic => (
                <Card 
                  key={clinic.id} 
                  className="border-l-4 border-l-red-600 hover:shadow-md transition-shadow"
                  data-testid={`card-clinic-${clinic.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-foreground" data-testid={`text-clinic-name-${clinic.id}`}>
                            {clinic.name}
                          </h3>
                          {clinic.is24Hour && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              24hrs
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-4 w-4" />
                          {clinic.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(clinic.phone);
                        }}
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid={`button-call-${clinic.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {language === 'zh-HK' ? '致電' : 'Call'}
                      </Button>
                      {clinic.whatsapp && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(clinic.whatsapp!);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-whatsapp-${clinic.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {clinic.latitude && clinic.longitude && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMaps(parseFloat(clinic.latitude!), parseFloat(clinic.longitude!), clinic.name);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-maps-${clinic.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          {language === 'zh-HK' ? '導航' : 'Maps'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  {language === 'zh-HK' ? '我們正在更新此地區的診所列表' : "We're updating our clinic list for this area"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'zh-HK' 
                    ? '同時，請查看附近地區或致電我們遍布香港的合作診所' 
                    : 'Meanwhile, check nearby districts or call our partner clinics across Hong Kong'
                  }
                </p>
                <Link href="/clinics">
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                    {language === 'zh-HK' ? '瀏覽所有診所' : 'View All Clinics'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Local Information */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {language === 'zh-HK' ? `${district.nameZh}緊急獸醫護理` : `Emergency Vet Care in ${district.nameEn}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
              <p>
                {language === 'zh-HK' 
                  ? `當您的寵物生病或受傷時，尋找幫助不應增加您的壓力。PetSOS一鍵即可連接您與${district.nameZh}所有24小時緊急獸醫。`
                  : `When your pet is sick or injured, finding help shouldn't add to your stress. PetSOS instantly connects you with every 24-hour emergency vet in ${district.nameEn}—with one tap.`
                }
              </p>
              <div className="bg-white dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {language === 'zh-HK' ? '接下來會發生什麼？' : 'What happens next?'}
                </h4>
                <ul className="space-y-2 text-blue-900 dark:text-blue-100">
                  <li className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    {language === 'zh-HK' 
                      ? '所有附近診所透過WhatsApp收到您寵物的詳情'
                      : "All nearby clinics receive your pet's details via WhatsApp"
                    }
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    {language === 'zh-HK' 
                      ? '您會看到他們的位置並獲得即時導航'
                      : "You'll see their locations and get instant directions"
                    }
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                    {language === 'zh-HK' 
                      ? '可直接致電他們。大多數診所在5-15分鐘內回應'
                      : 'You can call them directly. Most clinics respond within 5-15 minutes'
                    }
                  </li>
                </ul>
              </div>
              <p className="font-medium text-blue-900 dark:text-blue-100 text-center pt-2">
                {language === 'zh-HK' 
                  ? '您並不孤單。幫助比您想像的更近。'
                  : "You're not alone in this. Help is closer than you think."
                }
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                {language === 'zh-HK'
                  ? '* PetSOS是一個連接平台，不提供獸醫服務。所有醫療服務由獨立註冊獸醫診所提供。'
                  : '* PetSOS is a connection platform and does not provide veterinary services. All medical care is provided by independent licensed veterinary clinics.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
