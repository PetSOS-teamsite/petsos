import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageCircle, Navigation, Clock, MapPin, ArrowLeft, ExternalLink, AlertTriangle, Ship, CloudRain, Train, Car, Info, Shield, FileText, ArrowRight, CheckCircle } from "lucide-react";
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
  mtrLinesEn?: string;
  mtrLinesZh?: string;
  transportNotesEn?: string;
  transportNotesZh?: string;
  tunnelAccessEn?: string;
  tunnelAccessZh?: string;
  lastReviewed?: string;
}

const HONG_KONG_DISTRICTS: District[] = [
  {
    slug: "central",
    nameEn: "Central & Western",
    nameZh: "中西區",
    regionCode: "HKI",
    latitude: 22.2819,
    longitude: 114.1580,
    descriptionEn: "When your dog, cat, or beloved pet needs emergency care in Central, every second counts. Find nearby 24-hour veterinary clinics ready to help—whether it's late at night, on a holiday, or during a weekend crisis.",
    descriptionZh: "當您的狗狗、貓咪或心愛寵物在中環需要緊急護理時，分秒必爭。尋找附近隨時候命的24小時獸醫診所—無論深夜、假期或週末緊急情況。",
    keywordsEn: "Central vet, 24-hour animal hospital Central, emergency pet care Central Hong Kong, veterinary clinic Central MTR",
    keywordsZh: "中環獸醫, 中環24小時動物醫院, 中環寵物緊急護理, 中環港鐵獸醫診所",
    mtrLinesEn: "Kennedy Town MTR (Island Line), HKU MTR, Sheung Wan MTR, Central MTR",
    mtrLinesZh: "堅尼地城港鐵站（港島綫）、香港大學港鐵站、上環港鐵站、中環港鐵站",
    transportNotesEn: "Steep hill terrain in some areas (Mid-Levels, The Peak). Limited parking in Central core. Moderate taxi availability.",
    transportNotesZh: "部分地區地勢陡峭（半山區、太平山）。中環核心區泊車位有限。的士供應中等。",
    tunnelAccessEn: "Western Harbour Tunnel access to Kowloon",
    tunnelAccessZh: "西區海底隧道連接九龍",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "尖沙咀獸醫, 尖沙咀動物醫院, 九龍24小時寵物診所, 彌敦道緊急獸醫",
    mtrLinesEn: "Tsim Sha Tsui MTR (Tsuen Wan Line), East Tsim Sha Tsui MTR (West Rail Line)",
    mtrLinesZh: "尖沙咀港鐵站（荃灣綫）、尖東港鐵站（西鐵綫）",
    transportNotesEn: "Highest taxi availability. Heavy traffic during peak hours. Multiple MTR exits.",
    transportNotesZh: "的士供應最充足。繁忙時間交通擠塞。多個港鐵出口。",
    tunnelAccessEn: "Cross-Harbour Tunnel to Hong Kong Island",
    tunnelAccessZh: "紅磡海底隧道連接港島",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "旺角獸醫, 旺角24小時獸醫, 亞皆老街寵物緊急, 女人街動物醫院",
    mtrLinesEn: "Mong Kok MTR (Kwun Tong/Tsuen Wan Lines), Mong Kok East MTR (East Rail Line)",
    mtrLinesZh: "旺角港鐵站（觀塘綫/荃灣綫）、旺角東港鐵站（東鐵綫）",
    transportNotesEn: "Highest taxi availability. Congested streets but good MTR coverage. 24-hour street activity.",
    transportNotesZh: "的士供應最充足。街道擠迫但港鐵覆蓋良好。24小時街道活動。",
    tunnelAccessEn: "Cross-Harbour Tunnel via Hung Hom",
    tunnelAccessZh: "經紅磡往紅磡海底隧道",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "銅鑼灣獸醫, 銅鑼灣緊急動物醫院, 時代廣場24小時寵物診所, 維多利亞公園獸醫",
    mtrLinesEn: "Causeway Bay MTR (Island Line)",
    mtrLinesZh: "銅鑼灣港鐵站（港島綫）",
    transportNotesEn: "High taxi availability. Heavy weekend traffic. Good MTR access.",
    transportNotesZh: "的士供應充足。週末交通繁忙。港鐵交通便利。",
    tunnelAccessEn: "Cross-Harbour Tunnel access nearby",
    tunnelAccessZh: "鄰近紅磡海底隧道入口",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "灣仔獸醫, 灣仔24小時動物醫院, 跑馬地緊急寵物護理, 會展獸醫診所",
    mtrLinesEn: "Wan Chai MTR (Island Line), Exhibition Centre MTR (East Rail Line)",
    mtrLinesZh: "灣仔港鐵站（港島綫）、會展港鐵站（東鐵綫）",
    transportNotesEn: "High taxi availability. Cross-Harbour Tunnel entrance nearby. Good public transport.",
    transportNotesZh: "的士供應充足。鄰近紅磡海底隧道入口。公共交通便利。",
    tunnelAccessEn: "Cross-Harbour Tunnel direct access",
    tunnelAccessZh: "紅磡海底隧道直達",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "東區獸醫, 筲箕灣24小時動物醫院, 鰂魚涌緊急寵物護理, 西灣河獸醫診所",
    mtrLinesEn: "Shau Kei Wan MTR (Island Line), Quarry Bay MTR (Island/Tseung Kwan O Lines)",
    mtrLinesZh: "筲箕灣港鐵站（港島綫）、鰂魚涌港鐵站（港島綫/將軍澳綫）",
    transportNotesEn: "High taxi availability. Island Eastern Corridor provides fast highway access. Good MTR coverage.",
    transportNotesZh: "的士供應充足。東區走廊提供快速公路連接。港鐵覆蓋良好。",
    tunnelAccessEn: "Eastern Harbour Crossing to Kowloon, Island Eastern Corridor",
    tunnelAccessZh: "東區海底隧道連接九龍、東區走廊",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "南區獸醫, 淺水灣24小時動物醫院, 赤柱緊急寵物護理, 香港仔獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "香港仔獸醫, 香港仔24小時動物醫院, 鴨脷洲緊急寵物護理, 海怡半島獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "佐敦獸醫, 佐敦24小時動物醫院, 油麻地緊急寵物護理, 柯士甸道獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "九龍城獸醫, 土瓜灣24小時動物醫院, 何文田緊急寵物護理, 啟德獸醫診所",
    mtrLinesEn: "Ho Man Tin MTR (Kwun Tong Line), Kai Tak MTR (Tuen Ma Line)",
    mtrLinesZh: "何文田港鐵站（觀塘綫）、啟德港鐵站（屯馬綫）",
    transportNotesEn: "Kai Tak development area with new MTR access. Moderate taxi availability. Near Kowloon City Ferry Pier.",
    transportNotesZh: "啟德發展區設有新港鐵站。的士供應中等。鄰近九龍城碼頭。",
    tunnelAccessEn: "Lion Rock Tunnel to New Territories, Cross-Harbour Tunnel nearby",
    tunnelAccessZh: "獅子山隧道連接新界、鄰近紅磡海底隧道",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "九龍灣獸醫, 九龍灣24小時動物醫院, 德福花園緊急寵物護理, MegaBox獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "觀塘獸醫, 觀塘24小時動物醫院, APM緊急寵物護理, 藍田獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "黃大仙獸醫, 黃大仙24小時動物醫院, 鑽石山緊急寵物護理, 彩虹獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "深水埗獸醫, 深水埗24小時動物醫院, 長沙灣緊急寵物護理, 荔枝角獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "沙田獸醫, 新界動物醫院, 沙田24小時寵物診所, 馬鞍山緊急獸醫",
    mtrLinesEn: "Tai Wai MTR (East Rail/Tuen Ma Lines), Sha Tin MTR (East Rail Line), Ma On Shan MTR (Tuen Ma Line)",
    mtrLinesZh: "大圍港鐵站（東鐵綫/屯馬綫）、沙田港鐵站（東鐵綫）、馬鞍山港鐵站（屯馬綫）",
    transportNotesEn: "Good taxi availability. Multiple MTR stations. Easy highway access to Kowloon.",
    transportNotesZh: "的士供應良好。多個港鐵站。往九龍公路交通便利。",
    tunnelAccessEn: "Shing Mun Tunnel to Tsuen Wan, Lion Rock Tunnel to Kowloon",
    tunnelAccessZh: "城門隧道連接荃灣、獅子山隧道連接九龍",
    lastReviewed: "2026-01-13"
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
    transportWarningZh: "⚠️ 交通警示：南丫島上沒有獸醫診所。您必須乘渡輪到中環（中環4號碼頭，約30分鐘）或香港仔（香港仔海濱長廊碼頭，約25分鐘）。尾班船：中環約晚上11:30，香港仔約晚上10:30。尾班船後請聯繫緊急海上服務。出發前請先規劃到最近港島24小時獸醫診所的路線。",
    lastReviewed: "2026-01-13"
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
    transportWarningZh: "⚠️ 交通警示：愉景灣限制車輛進入。選項：1) 渡輪到中環（24小時服務，約25分鐘，寵物可在甲板），2) 愉景灣巴士到東涌港鐵站（約15分鐘），然後乘的士到最近的九龍獸醫。私家車不能進入愉景灣—請安排在愉景廣場或渡輪碼頭接載。午夜後：渡輪服務繼續24小時但班次減少。",
    lastReviewed: "2026-01-13"
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
    transportWarningZh: "⚠️ 交通警示：長洲沒有獸醫診所。乘渡輪到中環（中環5號碼頭，約35-55分鐘，視快船/慢船而定）。尾班快船約晚上11:30，尾班慢船約晚上11:45。渡輪允許攜帶寵物。出發前請先規劃到港島24小時獸醫診所的路線。",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "屯門獸醫, 屯門24小時動物醫院, 新界西緊急寵物護理",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "元朗獸醫, 元朗24小時寵物診所, 新界緊急獸醫",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "油麻地獸醫, 油麻地24小時動物醫院, 廟街緊急寵物護理, 彌敦道獸醫診所",
    mtrLinesEn: "Yau Ma Tei MTR (Kwun Tong/Tsuen Wan Lines)",
    mtrLinesZh: "油麻地港鐵站（觀塘綫/荃灣綫）",
    transportNotesEn: "Highest taxi availability. Good MTR access. 24-hour street activity.",
    transportNotesZh: "的士供應最充足。港鐵交通便利。24小時街道活動。",
    tunnelAccessEn: "Cross-Harbour Tunnel via Hung Hom",
    tunnelAccessZh: "經紅磡往紅磡海底隧道",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "大埔獸醫, 大埔24小時動物醫院, 新界北緊急寵物護理, 太和獸醫診所",
    lastReviewed: "2026-01-13"
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
    keywordsZh: "荃灣獸醫, 荃灣24小時動物醫院, 新界西緊急寵物護理, 葵涌獸醫診所",
    lastReviewed: "2026-01-13"
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

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ['/api/hospitals'],
    enabled: !!district,
  });

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
            <Button onClick={() => navigate('/clinics')} className="bg-red-600 hover:bg-red-700" data-testid="button-browse-clinics">
              {language === 'zh-HK' ? '瀏覽所有診所' : 'Browse All Clinics'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const regionId = regions?.find(r => r.code === district.regionCode)?.id;
  
  const verified24HourHospitals = hospitals?.filter(h => 
    h.regionId === regionId && 
    h.slug && 
    h.open247 && 
    (h.verified || h.isAvailable)
  ).sort((a, b) => {
    if (a.isPartner && !b.isPartner) return -1;
    if (!a.isPartner && b.isPartner) return 1;
    const aDate = a.lastVerifiedAt ? new Date(a.lastVerifiedAt).getTime() : 0;
    const bDate = b.lastVerifiedAt ? new Date(b.lastVerifiedAt).getTime() : 0;
    return bDate - aDate;
  }) || [];

  const districtClinics = clinics?.filter(clinic => 
    clinic.regionId === regionId && clinic.is24Hour
  ).slice(0, 10) || [];

  const hospitalCount = verified24HourHospitals.length;
  const lastReviewed = district.lastReviewed || "2026-01-13";

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

  const createMedicalWebPageSchema = () => ({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": language === 'zh-HK' 
      ? `${district.nameZh}寵物緊急護理`
      : `Pet Emergency Care in ${district.nameEn}`,
    "headline": language === 'zh-HK'
      ? `如果我的寵物在${district.nameZh}發生緊急情況，應該怎麼辦？`
      : `What should I do if my pet has an emergency in ${district.nameEn}?`,
    "about": {
      "@type": "MedicalCondition",
      "name": language === 'zh-HK' ? "寵物緊急情況" : "Pet Emergency"
    },
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": `${language === 'zh-HK' ? district.nameZh : district.nameEn}, Hong Kong`
    },
    "lastReviewed": lastReviewed,
    "inLanguage": language === 'zh-HK' ? "zh-HK" : "en",
    "medicalAudience": {
      "@type": "MedicalAudience",
      "audienceType": language === 'zh-HK' ? "寵物主人" : "Pet Owner"
    },
    "url": `https://petsos.site/district/${district.slug}`
  });

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
        "name": language === 'zh-HK' ? "地區目錄" : "Districts",
        "item": "https://petsos.site/districts"
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
      <StructuredData data={createMedicalWebPageSchema()} id="schema-medical-web-page" />
      <StructuredData data={createLocalBusinessSchema()} id="schema-local-business" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb" />
      {verified24HourHospitals.length > 0 && (
        <StructuredData 
          data={createDistrictCollectionSchema(
            language === 'zh-HK' ? district.nameZh : district.nameEn,
            `https://petsos.site/district/${district.slug}`,
            verified24HourHospitals.map(h => ({
              slug: h.slug!,
              nameEn: h.nameEn,
              isPartner: h.isPartner || false
            })),
            language
          )} 
          id="schema-collection-page" 
        />
      )}

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/districts')}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'zh-HK' ? '返回地區目錄' : 'Back to Districts'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* BLOCK 1: District Emergency Overview */}
        <section className="mb-8" data-testid="section-emergency-overview">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4" data-testid="text-district-question">
            {language === 'zh-HK' 
              ? `如果我的寵物在${district.nameZh}發生緊急情況，應該怎麼辦？`
              : `What should I do if my pet has an emergency in ${district.nameEn}?`
            }
          </h1>
          
          {/* Medical Disclaimer - Amber styling, above-fold */}
          <Card className="border-amber-400 bg-amber-50 dark:bg-amber-900/10 mb-6" data-testid="card-medical-disclaimer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">
                    {language === 'zh-HK' ? '醫療免責聲明' : 'Medical Disclaimer'}
                  </p>
                  <p>
                    {language === 'zh-HK' 
                      ? '本頁資訊僅供參考，並非專業獸醫意見。如寵物出現緊急症狀，請立即聯繫獸醫診所。PetSOS不提供診斷或治療建議。'
                      : 'This information is for reference only and is not professional veterinary advice. If your pet shows emergency symptoms, please contact a veterinary clinic immediately. PetSOS does not provide diagnosis or treatment recommendations.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary for screen readers */}
          <div className="sr-only" aria-label={language === 'zh-HK' ? '地區緊急指南摘要' : 'District emergency guide summary'}>
            {language === 'zh-HK' 
              ? `${district.nameZh}寵物緊急指南。本區設有${hospitalCount}間經驗證的24小時動物醫院。${district.mtrLinesZh ? `港鐵: ${district.mtrLinesZh}。` : ''}${district.transportNotesZh || ''}`
              : `Pet emergency guide for ${district.nameEn}. This district has ${hospitalCount} verified 24-hour animal hospitals. ${district.mtrLinesEn ? `MTR: ${district.mtrLinesEn}.` : ''} ${district.transportNotesEn || ''}`
            }
          </div>

          <p className="text-muted-foreground" data-testid="text-district-description">
            {language === 'zh-HK' ? district.descriptionZh : district.descriptionEn}
          </p>
        </section>

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

        {/* BLOCK 2: What to Know in This District (Local Reality) */}
        {(district.mtrLinesEn || district.transportNotesEn || district.tunnelAccessEn) && (
          <section className="mb-8" data-testid="section-local-reality">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {language === 'zh-HK' ? '本區須知' : 'What to Know in This District'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  {district.mtrLinesEn && (
                    <div className="flex gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                        <Train className="h-4 w-4 text-blue-600" />
                        {language === 'zh-HK' ? '港鐵' : 'MTR'}
                      </dt>
                      <dd className="text-foreground" data-testid="text-mtr-lines">
                        {language === 'zh-HK' ? district.mtrLinesZh : district.mtrLinesEn}
                      </dd>
                    </div>
                  )}
                  {district.tunnelAccessEn && (
                    <div className="flex gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                        <Car className="h-4 w-4 text-blue-600" />
                        {language === 'zh-HK' ? '隧道' : 'Tunnels'}
                      </dt>
                      <dd className="text-foreground" data-testid="text-tunnel-access">
                        {language === 'zh-HK' ? district.tunnelAccessZh : district.tunnelAccessEn}
                      </dd>
                    </div>
                  )}
                  {district.transportNotesEn && (
                    <div className="flex gap-3">
                      <dt className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                        <Navigation className="h-4 w-4 text-blue-600" />
                        {language === 'zh-HK' ? '交通' : 'Transport'}
                      </dt>
                      <dd className="text-foreground" data-testid="text-transport-notes">
                        {language === 'zh-HK' ? district.transportNotesZh : district.transportNotesEn}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </section>
        )}

        {/* BLOCK 3: Typhoon & Weather Reality */}
        <section className="mb-8" data-testid="section-typhoon-weather">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CloudRain className="h-5 w-5" />
                {language === 'zh-HK' ? '颱風及惡劣天氣' : 'Typhoon & Weather Conditions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  {language === 'zh-HK' 
                    ? '八號或以上颱風信號懸掛期間，公共交通可能暫停服務。24小時動物醫院通常維持運作，但請先致電確認。'
                    : 'During T8 or higher typhoon signals, public transport may be suspended. 24-hour animal hospitals typically remain operational, but please call ahead to confirm.'
                  }
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">
                    {language === 'zh-HK' ? '惡劣天氣貼士' : 'Severe Weather Tips'}
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {language === 'zh-HK' 
                        ? '預先記下附近24小時獸醫的電話號碼'
                        : 'Save phone numbers of nearby 24-hour vets in advance'
                      }
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {language === 'zh-HK' 
                        ? '颱風期間出行前致電診所確認營業狀況'
                        : 'Call the clinic before traveling during typhoons to confirm availability'
                      }
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {language === 'zh-HK' 
                        ? '考慮使用的士而非公共交通工具'
                        : 'Consider using taxis instead of public transport'
                      }
                    </li>
                  </ul>
                </div>
                <Link href="/blog/typhoon-guide" data-testid="link-typhoon-guide">
                  <Button variant="outline" size="sm" className="mt-2">
                    <CloudRain className="h-4 w-4 mr-2" />
                    {language === 'zh-HK' ? '閱讀完整颱風指南' : 'Read Full Typhoon Guide'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* BLOCK 4: Nearest Verified 24-Hour Hospitals */}
        <section className="mb-8" data-testid="section-hospitals">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {language === 'zh-HK' ? '經驗證24小時動物醫院' : 'Verified 24-Hour Hospitals'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-hospital-count">
                {language === 'zh-HK' 
                  ? `${district.nameZh}設有 ${hospitalCount} 間經驗證的24小時動物醫院`
                  : `${hospitalCount} verified 24-hour hospitals in ${district.nameEn}`
                }
              </p>
            </div>
            <Link href="/hospitals">
              <Button variant="outline" size="sm" data-testid="button-view-all-hospitals">
                {language === 'zh-HK' ? '查看所有醫院' : 'View All Hospitals'}
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
          ) : verified24HourHospitals.length > 0 ? (
            <div className="space-y-4">
              {verified24HourHospitals.slice(0, 5).map(hospital => (
                <Card 
                  key={hospital.id} 
                  className="border-l-4 border-l-red-600 hover:shadow-md transition-shadow"
                  data-testid={`card-hospital-${hospital.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Link href={`/hospitals/${hospital.slug}`}>
                            <h3 className="text-lg font-bold text-foreground hover:text-red-600 cursor-pointer" data-testid={`text-hospital-name-${hospital.id}`}>
                              {language === 'zh-HK' ? hospital.nameZh : hospital.nameEn}
                            </h3>
                          </Link>
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            24hrs
                          </span>
                          {hospital.isPartner && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {language === 'zh-HK' ? '合作夥伴' : 'Partner'}
                            </span>
                          )}
                          {hospital.verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {language === 'zh-HK' ? '已驗證' : 'Verified'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="h-4 w-4" />
                          {language === 'zh-HK' ? hospital.addressZh || hospital.addressEn : hospital.addressEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {hospital.phone && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(hospital.phone!);
                          }}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          data-testid={`button-call-${hospital.id}`}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {language === 'zh-HK' ? '致電' : 'Call'}
                        </Button>
                      )}
                      {hospital.whatsapp && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(hospital.whatsapp!);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-whatsapp-${hospital.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {hospital.latitude && hospital.longitude && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMaps(
                              parseFloat(hospital.latitude!.toString()), 
                              parseFloat(hospital.longitude!.toString()), 
                              hospital.nameEn
                            );
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-maps-${hospital.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          {language === 'zh-HK' ? '導航' : 'Maps'}
                        </Button>
                      )}
                      <Link href={`/hospitals/${hospital.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          data-testid={`button-details-${hospital.id}`}
                        >
                          {language === 'zh-HK' ? '詳情' : 'Details'}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {verified24HourHospitals.length > 5 && (
                <div className="text-center pt-2">
                  <Link href="/hospitals">
                    <Button variant="outline" data-testid="button-view-more-hospitals">
                      {language === 'zh-HK' 
                        ? `查看更多 ${verified24HourHospitals.length - 5} 間醫院`
                        : `View ${verified24HourHospitals.length - 5} more hospitals`
                      }
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
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
                  {language === 'zh-HK' ? '我們正在更新此地區的醫院列表' : "We're updating our hospital list for this area"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'zh-HK' 
                    ? '同時，請查看附近地區或使用緊急求助功能聯繫所有24小時診所' 
                    : 'Meanwhile, check nearby districts or use the emergency feature to contact all 24-hour clinics'
                  }
                </p>
                <Link href="/hospitals">
                  <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" data-testid="button-browse-hospitals">
                    {language === 'zh-HK' ? '瀏覽所有醫院' : 'View All Hospitals'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* BLOCK 5: If You're Unsure Where to Go (PetSOS Bridge) */}
        <section className="mb-8" data-testid="section-petsos-bridge">
          <Card className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full">
                  <Phone className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {language === 'zh-HK' ? '如果您不確定該去哪裡' : "If You're Unsure Where to Go"}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {language === 'zh-HK' 
                      ? `PetSOS可以幫助您同時聯繫${district.nameZh}的${hospitalCount > 0 ? hospitalCount : '多間'}24小時動物醫院，讓您更快獲得回應。`
                      : `PetSOS can help you contact ${hospitalCount > 0 ? hospitalCount : 'multiple'} 24-hour hospitals in ${district.nameEn} simultaneously for faster response.`
                    }
                  </p>
                  <Link href="/emergency" data-testid="link-emergency">
                    <Button 
                      variant="outline" 
                      className="border-slate-400 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      data-testid="button-contact-hospitals"
                    >
                      {language === 'zh-HK' 
                        ? `聯繫${hospitalCount > 0 ? hospitalCount : ''}間24小時醫院`
                        : `Contact ${hospitalCount > 0 ? hospitalCount + ' ' : ''}24-Hour Hospitals`
                      }
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* BLOCK 6: Trust Footer */}
        <section className="mb-8" data-testid="section-trust-footer">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {language === 'zh-HK' 
                      ? `最後更新: ${new Date(lastReviewed).toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' })}`
                      : `Last reviewed: ${new Date(lastReviewed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'zh-HK' 
                    ? '資料來源：PetSOS已驗證的24小時動物醫院資料庫。我們定期核實診所營業時間及聯絡資料，但建議您在前往前先致電確認。'
                    : 'Data source: PetSOS verified 24-hour animal hospital database. We regularly verify clinic hours and contact details, but recommend calling ahead to confirm before visiting.'
                  }
                </p>
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                  <Link href="/emergency-symptoms" data-testid="link-emergency-symptoms">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      {language === 'zh-HK' ? '緊急症狀指南' : 'Emergency Symptoms Guide'}
                    </Button>
                  </Link>
                  <Link href="/emergency-checklist" data-testid="link-emergency-checklist">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      {language === 'zh-HK' ? '急診準備清單' : 'Emergency Checklist'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
