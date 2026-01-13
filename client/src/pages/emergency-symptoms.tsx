import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Heart, 
  Wind, 
  Droplets, 
  Brain,
  Bone,
  Eye,
  Thermometer,
  Clock,
  Phone,
  ArrowRight,
  Ship,
  MapPin,
  Mountain,
  CheckCircle
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";

interface VerificationData {
  contentSlug: string;
  contentType: string;
  titleEn: string;
  titleZh: string;
  isVerified: boolean;
  verifier: {
    id: string;
    nameEn: string;
    nameZh: string;
    titleEn: string;
    titleZh: string;
    specialtyEn: string;
    specialtyZh: string;
    photoUrl: string | null;
  } | null;
  verifiedAt: string | null;
}

function VerificationBadge({ contentSlug }: { contentSlug: string }) {
  const { language } = useLanguage();
  
  const { data: verification, isLoading } = useQuery<VerificationData>({
    queryKey: ['/api/content', contentSlug, 'verification'],
    enabled: !!contentSlug,
  });

  if (isLoading) {
    return (
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <div className="h-3 w-3 bg-muted rounded-full" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  if (verification.isVerified && verification.verifier) {
    const verifierName = language === 'zh-HK' ? verification.verifier.nameZh : verification.verifier.nameEn;
    const verifierTitle = language === 'zh-HK' ? verification.verifier.titleZh : verification.verifier.titleEn;
    const verifiedDate = verification.verifiedAt 
      ? new Date(verification.verifiedAt).toLocaleDateString(language === 'zh-HK' ? 'zh-HK' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : null;

    return (
      <div className="mt-4 pt-3 border-t border-border/50">
        <Link href="/consultants" data-testid={`link-verifier-${contentSlug}`}>
          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors cursor-pointer">
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {language === 'zh-HK' 
                ? `已認證 by ${verifierTitle} ${verifierName}`
                : `Verified by ${verifierTitle} ${verifierName}`
              }
              {verifiedDate && (
                <span className="text-muted-foreground ml-1">
                  ({verifiedDate})
                </span>
              )}
            </span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          {language === 'zh-HK' 
            ? '等待專業驗證'
            : 'Pending expert verification'
          }
        </span>
      </div>
    </div>
  );
}

interface SymptomSnippet {
  id: string;
  questionEn: string;
  questionZh: string;
  answerEn: string;
  answerZh: string;
  severityEn: string;
  severityZh: string;
  severity: 'critical' | 'urgent' | 'moderate';
  icon: typeof AlertTriangle;
  actionEn: string;
  actionZh: string;
  infoToShare: { en: string[], zh: string[] };
}

const SYMPTOM_SNIPPETS: SymptomSnippet[] = [
  {
    id: "cat-panting",
    questionEn: "What to do if your cat is panting?",
    questionZh: "如果你的貓在喘氣該怎麼辦？",
    answerEn: "Cat panting is often a sign of respiratory distress, heart problems, or overheating. Unlike dogs, cats rarely pant normally. Move your cat to a cool, quiet area immediately. If panting continues for more than 5 minutes, is accompanied by blue gums, or your cat seems distressed, seek emergency veterinary care immediately.",
    answerZh: "貓喘氣通常是呼吸困難、心臟問題或過熱的徵兆。與狗不同，貓正常情況下很少喘氣。立即將貓移到陰涼安靜的地方。如果喘氣持續超過5分鐘、伴隨牙齦發藍，或貓看起來痛苦，請立即尋求緊急獸醫護理。",
    severityEn: "URGENT - Seek vet care within 30 minutes",
    severityZh: "緊急 - 30分鐘內就醫",
    severity: 'urgent',
    icon: Wind,
    actionEn: "Keep cat cool, minimize stress, call 24hr vet immediately",
    actionZh: "保持貓涼爽，減少壓力，立即致電24小時獸醫",
    infoToShare: {
      en: ["Breathing rate per minute", "Duration of panting", "Gum color (pink/blue/gray)", "Recent activity or stress"],
      zh: ["每分鐘呼吸次數", "喘氣持續時間", "牙齦顏色（粉紅/藍/灰）", "最近活動或壓力"]
    }
  },
  {
    id: "dog-bloat",
    questionEn: "What are the signs of bloat (GDV) in dogs?",
    questionZh: "狗胃扭轉（GDV）的症狀是什麼？",
    answerEn: "Bloat or Gastric Dilatation-Volvulus (GDV) is a life-threatening emergency. Signs include: distended/swollen abdomen, unproductive retching (trying to vomit but nothing comes out), restlessness, drooling, rapid breathing, weakness, and collapse. Large breed dogs are at higher risk. GDV can be fatal within hours without surgery.",
    answerZh: "胃扭轉（GDV）是危及生命的緊急情況。症狀包括：腹部腫脹、乾嘔（嘗試嘔吐但吐不出來）、煩躁不安、流口水、呼吸急促、虛弱和倒地。大型犬風險較高。GDV如不手術可在數小時內致命。",
    severityEn: "CRITICAL - Life-threatening, go to vet NOW",
    severityZh: "危急 - 危及生命，立即就醫",
    severity: 'critical',
    icon: AlertTriangle,
    actionEn: "Do NOT wait - drive to nearest 24hr emergency vet immediately",
    actionZh: "不要等待 - 立即駕車前往最近的24小時緊急獸醫",
    infoToShare: {
      en: ["Time symptoms started", "Last meal time", "Attempted vomiting count", "Abdomen size change"],
      zh: ["症狀開始時間", "最後進食時間", "嘗試嘔吐次數", "腹部大小變化"]
    }
  },
  {
    id: "pet-poisoning",
    questionEn: "What to do if your pet ate something poisonous?",
    questionZh: "如果你的寵物吃了有毒的東西該怎麼辦？",
    answerEn: "If you suspect poisoning, note what was eaten and how much. Common toxins include chocolate, xylitol (sweetener), grapes/raisins, medications, rat poison, and certain plants. Do NOT induce vomiting unless instructed by a vet. Call a 24-hour emergency vet immediately with information about the substance, your pet's weight, and time of ingestion.",
    answerZh: "如果懷疑中毒，記錄吃了什麼和吃了多少。常見毒素包括巧克力、木糖醇（甜味劑）、葡萄/葡萄乾、藥物、老鼠藥和某些植物。除非獸醫指示，否則不要催吐。立即致電24小時緊急獸醫，提供物質資訊、寵物體重和攝入時間。",
    severityEn: "CRITICAL - Call vet immediately, time is crucial",
    severityZh: "危急 - 立即致電獸醫，時間至關重要",
    severity: 'critical',
    icon: Droplets,
    actionEn: "Identify poison, do NOT induce vomiting, call 24hr vet NOW",
    actionZh: "識別毒物，不要催吐，立即致電24小時獸醫",
    infoToShare: {
      en: ["Substance ingested", "Amount eaten", "Pet's weight", "Time of ingestion"],
      zh: ["攝入物質", "攝入量", "寵物體重", "攝入時間"]
    }
  },
  {
    id: "pet-seizure",
    questionEn: "What to do when your pet is having a seizure?",
    questionZh: "當你的寵物癲癇發作時該怎麼辦？",
    answerEn: "During a seizure: Stay calm, move away sharp objects, do NOT put anything in their mouth, do NOT restrain them, time the seizure. After: Keep environment quiet and dark, comfort your pet gently. A single seizure under 2 minutes may not require emergency care, but multiple seizures, seizures lasting over 3 minutes, or first-time seizures warrant immediate vet attention.",
    answerZh: "癲癇發作期間：保持冷靜，移開尖銳物品，不要把任何東西放進嘴裡，不要約束牠們，記錄發作時間。發作後：保持環境安靜和黑暗，輕輕安撫寵物。單次少於2分鐘的發作可能不需要緊急護理，但多次發作、持續超過3分鐘的發作或首次發作需要立即就醫。",
    severityEn: "URGENT - Vet care needed if >3 min or repeated",
    severityZh: "緊急 - 超過3分鐘或反復發作需就醫",
    severity: 'urgent',
    icon: Brain,
    actionEn: "Keep pet safe, time the seizure, call vet if prolonged",
    actionZh: "保護寵物安全，記錄發作時間，如持續時間長請致電獸醫",
    infoToShare: {
      en: ["Seizure duration", "Number of seizures", "Time between seizures", "Pet's behavior after"],
      zh: ["發作持續時間", "發作次數", "發作間隔時間", "發作後行為"]
    }
  },
  {
    id: "dog-limping",
    questionEn: "When is dog limping an emergency?",
    questionZh: "狗跛行什麼時候是緊急情況？",
    answerEn: "Limping is an emergency if: the leg is at an abnormal angle (possible fracture), there is heavy bleeding, you can see bone, your dog can't bear any weight on the leg, there's severe swelling, or your dog is showing signs of extreme pain (whimpering, aggression, refusing to move). Mild limping after exercise can often wait for regular vet hours.",
    answerZh: "跛行是緊急情況如果：腿部呈異常角度（可能骨折）、大量出血、可以看到骨頭、狗無法用腿承重、嚴重腫脹，或狗表現出極度疼痛的跡象（嗚咽、攻擊性、拒絕移動）。運動後輕微跛行通常可以等到正常獸醫營業時間。",
    severityEn: "VARIES - Emergency if fracture or severe pain",
    severityZh: "視情況而定 - 骨折或劇烈疼痛為緊急",
    severity: 'moderate',
    icon: Bone,
    actionEn: "Assess severity, limit movement, seek care based on symptoms",
    actionZh: "評估嚴重程度，限制活動，根據症狀決定就醫",
    infoToShare: {
      en: ["Which leg affected", "When injury occurred", "Weight bearing ability", "Visible swelling or wound"],
      zh: ["受傷的腿", "受傷時間", "承重能力", "可見腫脹或傷口"]
    }
  },
  {
    id: "pet-not-eating",
    questionEn: "When is a pet not eating an emergency?",
    questionZh: "寵物不吃東西什麼時候是緊急情況？",
    answerEn: "Loss of appetite is an emergency if: your pet hasn't eaten for 24+ hours (12+ hours for puppies/kittens), is also vomiting or having diarrhea, shows lethargy or weakness, has a distended abdomen, or is a diabetic pet that has received insulin. Cats are particularly sensitive - they can develop hepatic lipidosis (fatty liver) after just 2-3 days without food.",
    answerZh: "食慾不振是緊急情況如果：寵物超過24小時未進食（幼犬/幼貓超過12小時）、同時嘔吐或腹瀉、表現出昏睡或虛弱、腹部腫脹，或是已接受胰島素的糖尿病寵物。貓特別敏感——牠們僅2-3天不進食就可能發展為肝脂肪變性（脂肪肝）。",
    severityEn: "URGENT - Especially critical for cats and young pets",
    severityZh: "緊急 - 對貓和幼年寵物尤其危急",
    severity: 'urgent',
    icon: Clock,
    actionEn: "Monitor closely, seek vet care if 24+ hours or other symptoms",
    actionZh: "密切監測，如超過24小時或有其他症狀請就醫",
    infoToShare: {
      en: ["Hours since last meal", "Water intake", "Vomiting or diarrhea", "Energy level changes"],
      zh: ["距上次進食時間", "飲水量", "嘔吐或腹瀉", "精力變化"]
    }
  },
  {
    id: "pet-eye-injury",
    questionEn: "What to do if your pet has an eye injury?",
    questionZh: "如果你的寵物眼睛受傷該怎麼辦？",
    answerEn: "Eye injuries are always urgent. Signs include: squinting or keeping eye closed, excessive tearing, redness, visible scratch or foreign object, cloudiness, bleeding, or rubbing at the eye. Do NOT try to remove embedded objects. Prevent your pet from rubbing the eye (use an e-collar if possible). Seek veterinary care within 1-2 hours to prevent permanent vision damage.",
    answerZh: "眼部受傷總是緊急的。症狀包括：瞇眼或保持眼睛閉合、過度流淚、發紅、可見的劃痕或異物、混濁、出血或揉眼睛。不要嘗試取出嵌入的物體。防止寵物揉眼睛（如可能請使用伊麗莎白圈）。在1-2小時內就醫以防止永久性視力損傷。",
    severityEn: "URGENT - Eye injuries need prompt treatment",
    severityZh: "緊急 - 眼部受傷需要及時治療",
    severity: 'urgent',
    icon: Eye,
    actionEn: "Prevent rubbing, don't remove objects, see vet within 1-2 hours",
    actionZh: "防止揉眼，不要取出異物，1-2小時內就醫",
    infoToShare: {
      en: ["When injury occurred", "Cause if known", "Discharge color", "Vision affected"],
      zh: ["受傷時間", "原因（如知道）", "分泌物顏色", "視力是否受影響"]
    }
  },
  {
    id: "pet-heatstroke",
    questionEn: "What are the signs of heatstroke in pets?",
    questionZh: "寵物中暑的症狀是什麼？",
    answerEn: "Heatstroke signs include: excessive panting, drooling, bright red tongue/gums, vomiting, diarrhea, weakness, stumbling, collapse, and seizures. Brachycephalic breeds (flat-faced), elderly, and overweight pets are at higher risk. Start cooling immediately: move to shade, apply cool (not cold) water to paws, belly, and ears. Do NOT use ice water. Seek emergency vet care immediately.",
    answerZh: "中暑症狀包括：過度喘氣、流口水、舌頭/牙齦鮮紅、嘔吐、腹瀉、虛弱、踉蹌、倒地和癲癇發作。短頭品種（扁臉）、老年和超重寵物風險較高。立即開始降溫：移到陰涼處，用涼水（非冰水）敷爪子、腹部和耳朵。不要使用冰水。立即尋求緊急獸醫護理。",
    severityEn: "CRITICAL - Life-threatening, cool and go to vet NOW",
    severityZh: "危急 - 危及生命，降溫並立即就醫",
    severity: 'critical',
    icon: Thermometer,
    actionEn: "Cool with water (not ice), get to emergency vet immediately",
    actionZh: "用水（非冰）降溫，立即前往緊急獸醫",
    infoToShare: {
      en: ["Duration of heat exposure", "Environment temperature", "Cooling measures taken", "Current body temperature"],
      zh: ["暴露於高溫的時間", "環境溫度", "已採取的降溫措施", "目前體溫"]
    }
  },
  {
    id: "cat-urinary-block",
    questionEn: "What are signs of urinary blockage in cats?",
    questionZh: "貓尿路阻塞的症狀是什麼？",
    answerEn: "Urinary blockage is a life-threatening emergency in cats (especially males). Signs include: straining to urinate with little or no urine produced, crying in the litter box, frequent trips to litter box, blood in urine, licking genitals, vomiting, lethargy. Without treatment, cats can die within 24-48 hours from kidney failure and toxin buildup.",
    answerZh: "尿路阻塞對貓（尤其是公貓）是危及生命的緊急情況。症狀包括：用力排尿但只有很少或沒有尿液排出、在貓砂盆中哭叫、頻繁去貓砂盆、尿中帶血、舔生殖器、嘔吐、昏睡。如不治療，貓可能在24-48小時內因腎衰竭和毒素積累而死亡。",
    severityEn: "CRITICAL - Can be fatal within 24-48 hours",
    severityZh: "危急 - 可在24-48小時內致命",
    severity: 'critical',
    icon: AlertTriangle,
    actionEn: "Emergency - go to 24hr vet immediately, do not wait",
    actionZh: "緊急情況 - 立即前往24小時獸醫，不要等待",
    infoToShare: {
      en: ["Last successful urination", "Litter box visit frequency", "Blood in urine", "Cat's gender and age"],
      zh: ["最後成功排尿時間", "去貓砂盆頻率", "尿中有血", "貓的性別和年齡"]
    }
  },
  {
    id: "dog-difficulty-breathing",
    questionEn: "What to do if your dog has difficulty breathing?",
    questionZh: "如果你的狗呼吸困難該怎麼辦？",
    answerEn: "Difficulty breathing is always an emergency. Signs include: noisy breathing, labored breathing, extended neck, blue or gray gums/tongue, excessive panting at rest, standing with elbows wide apart. Keep your dog calm, ensure airway is not obstructed, use AC in car if transporting. Call the emergency vet en route so they can prepare.",
    answerZh: "呼吸困難始終是緊急情況。症狀包括：呼吸有聲音、呼吸費力、頸部伸展、牙齦/舌頭發藍或灰色、靜止時過度喘氣、雙肘張開站立。保持狗冷靜，確保氣道暢通，運輸時使用汽車空調。在途中致電緊急獸醫讓他們做好準備。",
    severityEn: "CRITICAL - Life-threatening, immediate vet care needed",
    severityZh: "危急 - 危及生命，需要立即就醫",
    severity: 'critical',
    icon: Wind,
    actionEn: "Keep calm, ensure airway clear, get to vet immediately",
    actionZh: "保持冷靜，確保氣道暢通，立即前往獸醫",
    infoToShare: {
      en: ["When breathing difficulty started", "Gum/tongue color", "Breathing rate", "Any known allergies or conditions"],
      zh: ["呼吸困難開始時間", "牙齦/舌頭顏色", "呼吸頻率", "已知過敏或疾病"]
    }
  }
];

export default function EmergencySymptomsPage() {
  const { language } = useLanguage();

  const createFAQSchema = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": SYMPTOM_SNIPPETS.map(item => ({
      "@type": "Question",
      "name": language === 'zh-HK' ? item.questionZh : item.questionEn,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": language === 'zh-HK' ? item.answerZh : item.answerEn
      }
    }))
  });

  const createMedicalWebPageSchema = () => ({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": language === 'zh-HK' ? "寵物緊急症狀指南" : "Pet Emergency Symptom Guide",
    "description": language === 'zh-HK' 
      ? "香港寵物緊急症狀識別指南。了解何時需要立即就醫，包括呼吸困難、中毒、癲癇等危急情況的處理方法。"
      : "Hong Kong pet emergency symptom recognition guide. Learn when immediate vet care is needed, including how to handle critical situations like breathing difficulty, poisoning, and seizures.",
    "url": "https://petsos.site/emergency-symptoms",
    "medicalAudience": {
      "@type": "PetOwner"
    },
    "specialty": "VeterinaryMedicine",
    "lastReviewed": new Date().toISOString().split('T')[0]
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
        "name": language === 'zh-HK' ? "緊急症狀" : "Emergency Symptoms",
        "item": "https://petsos.site/emergency-symptoms"
      }
    ]
  });

  const createMedicalConditionListSchema = () => ({
    "@context": "https://schema.org",
    "@graph": SYMPTOM_SNIPPETS.map(symptom => ({
      "@type": "MedicalCondition",
      "name": language === 'zh-HK' ? symptom.questionZh : symptom.questionEn,
      "description": language === 'zh-HK' ? symptom.answerZh : symptom.answerEn,
      "signOrSymptom": {
        "@type": "MedicalSignOrSymptom",
        "name": language === 'zh-HK' ? symptom.questionZh : symptom.questionEn
      },
      "possibleTreatment": {
        "@type": "MedicalTherapy",
        "name": language === 'zh-HK' ? symptom.actionZh : symptom.actionEn
      },
      "status": symptom.severity === 'critical' ? 'http://schema.org/MedicalConditionStage' : undefined
    }))
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-100';
      case 'urgent': return 'bg-amber-100 dark:bg-amber-900/20 border-amber-500 text-amber-900 dark:text-amber-100';
      case 'moderate': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 dark:bg-gray-900/20 border-gray-500 text-gray-900 dark:text-gray-100';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'urgent': return 'bg-amber-600 text-white';
      case 'moderate': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={language === 'zh-HK' 
          ? "緊急症狀指南 | 何時需要立即就醫 | PetSOS"
          : "Emergency Symptom Guide | When to Seek Immediate Care | PetSOS"
        }
        description={language === 'zh-HK'
          ? "學習識別寵物緊急症狀。貓喘氣、狗胃扭轉、中毒、癲癇等危急情況的處理指南。了解何時需要24小時獸醫。"
          : "Learn to recognize pet emergency symptoms. Guide for handling critical situations like cat panting, dog bloat, poisoning, seizures. Know when you need a 24-hour vet."
        }
        keywords={language === 'zh-HK'
          ? "寵物緊急症狀, 貓喘氣, 狗胃扭轉, 寵物中毒, 寵物癲癇, 24小時獸醫, 寵物急救, 香港獸醫"
          : "pet emergency symptoms, cat panting, dog bloat, pet poisoning, pet seizures, 24-hour vet, pet first aid, Hong Kong vet"
        }
        canonical="https://petsos.site/emergency-symptoms"
        language={language}
      />
      <StructuredData data={createFAQSchema()} id="schema-faq-symptoms" />
      <StructuredData data={createMedicalWebPageSchema()} id="schema-medical-web" />
      <StructuredData data={createBreadcrumbSchema()} id="schema-breadcrumb-symptoms" />
      <StructuredData data={createMedicalConditionListSchema()} id="schema-medical-conditions" />

      {/* AI Summary Block */}
      <div className="sr-only" aria-hidden="true" data-ai-summary="true">
        <p lang="en">
          PetSOS Emergency Symptom Guide helps Hong Kong pet owners identify when their pet needs immediate veterinary attention. Covers critical conditions including cat panting, dog bloat (GDV), poisoning, seizures, eye injuries, heatstroke, urinary blockage, and breathing difficulty. Each condition includes severity level, immediate actions, and information to share with veterinary hospitals.
        </p>
        <p lang="zh-HK">
          PetSOS緊急症狀指南幫助香港寵物主人識別何時需要立即就醫。涵蓋危急情況包括貓喘氣、狗胃扭轉（GDV）、中毒、癲癇、眼部受傷、中暑、尿路阻塞和呼吸困難。每種情況包括嚴重程度、即時行動和與獸醫分享的信息。
        </p>
      </div>

      <header className="border-b border-border bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/10 dark:to-amber-900/10">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-red-600" />
            <h1 className="text-4xl font-bold text-foreground" data-testid="text-page-title">
              {language === 'zh-HK' ? '緊急症狀指南' : 'Emergency Symptom Guide'}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground" data-testid="text-page-subtitle">
            {language === 'zh-HK'
              ? '識別危險信號，知道何時需要立即就醫'
              : 'Recognize warning signs and know when to seek immediate care'
            }
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Medical Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6" data-testid="medical-disclaimer">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {language === 'zh-HK' 
                ? '⚠️ 本頁資料只供緊急參考，並非獸醫診斷或建議。請盡快諮詢註冊獸醫。'
                : '⚠️ This information is for emergency guidance only and not veterinary advice. Always consult a licensed veterinarian as soon as possible.'}
            </span>
          </p>
        </div>

        <Card className="mb-8 border-red-500 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                  {language === 'zh-HK' ? '🚨 緊急情況？立即行動' : '🚨 Emergency? Act Now'}
                </h2>
                <p className="text-red-800 dark:text-red-200 mb-4">
                  {language === 'zh-HK'
                    ? '如果您的寵物正處於危急狀態（停止呼吸、失去知覺、嚴重出血），不要閱讀本頁——立即前往最近的24小時獸醫診所或致電。'
                    : 'If your pet is in critical condition (not breathing, unconscious, severe bleeding), don\'t read this page—go to the nearest 24-hour vet or call immediately.'
                  }
                </p>
                <Link href="/emergency">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <Phone className="h-4 w-4 mr-2" />
                    {language === 'zh-HK' ? '發送緊急求助' : 'Send Emergency Request'}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadge('critical')}`}>
            {language === 'zh-HK' ? '危急 - 立即就醫' : 'CRITICAL - Immediate'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadge('urgent')}`}>
            {language === 'zh-HK' ? '緊急 - 1-2小時內' : 'URGENT - Within 1-2 hours'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadge('moderate')}`}>
            {language === 'zh-HK' ? '視情況 - 評估後決定' : 'VARIES - Assess & decide'}
          </span>
        </div>

        <div className="space-y-6">
          {SYMPTOM_SNIPPETS.map((symptom) => (
            <Card 
              key={symptom.id} 
              className={`border-l-4 ${getSeverityColor(symptom.severity)}`}
              data-testid={`card-symptom-${symptom.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full flex-shrink-0 ${symptom.severity === 'critical' ? 'bg-red-600' : symptom.severity === 'urgent' ? 'bg-amber-600' : 'bg-blue-600'}`}>
                    <symptom.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {language === 'zh-HK' ? symptom.questionZh : symptom.questionEn}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getSeverityBadge(symptom.severity)}`}>
                        {language === 'zh-HK' ? symptom.severityZh : symptom.severityEn}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {language === 'zh-HK' ? symptom.answerZh : symptom.answerEn}
                    </p>
                    <div className={`p-3 rounded-lg ${symptom.severity === 'critical' ? 'bg-red-200 dark:bg-red-800/30' : symptom.severity === 'urgent' ? 'bg-amber-200 dark:bg-amber-800/30' : 'bg-blue-200 dark:bg-blue-800/30'}`}>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm">
                          {language === 'zh-HK' ? symptom.actionZh : symptom.actionEn}
                        </span>
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {symptom.infoToShare[language === 'zh-HK' ? 'zh' : 'en'].map((info, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <dt className="sr-only">Information to share</dt>
                          <dd className="flex items-center gap-1 text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                            {info}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <VerificationBadge contentSlug={`symptom-${symptom.id}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* District Transport Warnings */}
        <Card className="mt-8 border-amber-500 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Ship className="h-6 w-6 text-amber-600" />
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
                {language === 'zh-HK' ? '⚠️ 偏遠地區交通警告' : '⚠️ Remote District Transport Warnings'}
              </h2>
            </div>
            <p className="text-amber-800 dark:text-amber-200 mb-4">
              {language === 'zh-HK'
                ? '以下地區的寵物主人在緊急情況下可能面臨交通限制。請提前了解您所在地區的24小時獸醫選項和交通安排。'
                : 'Pet owners in these areas may face transportation limitations during emergencies. Please familiarize yourself with 24-hour vet options and transport arrangements in your area.'
              }
            </p>
            
            <div className="space-y-4">
              {/* Outlying Islands */}
              <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-foreground">
                    {language === 'zh-HK' ? '離島地區' : 'Outlying Islands'}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm">
                    {language === 'zh-HK' ? '長洲' : 'Cheung Chau'}
                  </span>
                  <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm">
                    {language === 'zh-HK' ? '南丫島' : 'Lamma Island'}
                  </span>
                  <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm">
                    {language === 'zh-HK' ? '坪洲' : 'Peng Chau'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'zh-HK'
                    ? '⚓ 渡輪服務在T8或以上信號時暫停。最後班次通常在發出信號前1-2小時開出。'
                    : '⚓ Ferry services suspend during T8 or above signals. Last ferries typically depart 1-2 hours before signal issuance.'
                  }
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>{language === 'zh-HK' ? '建議：' : 'Advice: '}</strong>
                  {language === 'zh-HK'
                    ? '颱風季節請儲備基本急救用品，並預先記下島上可能的緊急聯絡人。'
                    : 'Stock basic first aid supplies during typhoon season and note emergency contacts on the island.'
                  }
                </p>
              </div>

              {/* Lantau Island */}
              <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2 mb-2">
                  <Mountain className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-foreground">
                    {language === 'zh-HK' ? '大嶼山偏遠區域' : 'Remote Lantau Areas'}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                    {language === 'zh-HK' ? '大澳' : 'Tai O'}
                  </span>
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                    {language === 'zh-HK' ? '梅窩' : 'Mui Wo'}
                  </span>
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                    {language === 'zh-HK' ? '塘福' : 'Tong Fuk'}
                  </span>
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                    {language === 'zh-HK' ? '貝澳' : 'Pui O'}
                  </span>
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                    {language === 'zh-HK' ? '東涌部分地區' : 'Parts of Tung Chung'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh-HK'
                    ? '🚌 巴士服務在惡劣天氣下可能中斷。大澳和梅窩居民請確保有備用交通安排。'
                    : '🚌 Bus services may be disrupted during severe weather. Tai O and Mui Wo residents should ensure backup transportation.'
                  }
                </p>
              </div>

              {/* North District */}
              <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-foreground">
                    {language === 'zh-HK' ? '北區' : 'North District'}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm">
                    {language === 'zh-HK' ? '上水鄉郊' : 'Sheung Shui Rural'}
                  </span>
                  <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm">
                    {language === 'zh-HK' ? '沙頭角' : 'Sha Tau Kok'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh-HK'
                    ? '🚗 偏遠地區在惡劣天氣下道路可能受阻。建議提前確認最近的24小時獸醫診所位置。'
                    : '🚗 Remote areas may have road access issues during severe weather. Confirm nearest 24-hour vet location in advance.'
                  }
                </p>
              </div>

              {/* Other Remote Areas */}
              <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <h3 className="font-bold text-foreground">
                    {language === 'zh-HK' ? '其他偏僻區域' : 'Other Remote Areas'}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-sm">
                    {language === 'zh-HK' ? '馬灣' : 'Ma Wan'}
                  </span>
                  <span className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-sm">
                    {language === 'zh-HK' ? '愉景灣' : 'Discovery Bay'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'zh-HK'
                    ? '🚢 愉景灣渡輪在颱風期間暫停。馬灣居民請確認青馬大橋通行狀況。'
                    : '🚢 Discovery Bay ferries suspend during typhoons. Ma Wan residents should check Tsing Ma Bridge accessibility.'
                  }
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        <Card className="mt-8 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {language === 'zh-HK' ? '📚 需要更多資訊？' : '📚 Need More Information?'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'zh-HK'
                ? '瀏覽我們的資源中心了解更多寵物護理和緊急應對知識'
                : 'Browse our resources center for more pet care and emergency response knowledge'
              }
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/resources">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  {language === 'zh-HK' ? '緊急護理資源' : 'Emergency Care Resources'}
                </Button>
              </Link>
              <Link href="/medical-advisory">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                  {language === 'zh-HK' ? '醫療顧問' : 'Medical Advisory'}
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" className="border-gray-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20">
                  {language === 'zh-HK' ? '常見問題' : 'FAQ'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground mt-8 pb-4">
          {language === 'zh-HK' 
            ? '由獸醫專業人員審閱 — 2026年1月'
            : 'Reviewed by veterinary professionals — January 2026'}
        </div>
      </main>
    </div>
  );
}
