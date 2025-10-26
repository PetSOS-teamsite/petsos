import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, analyzedSymptoms: string) => void;
  language?: string;
}

// Enhanced symptom keywords for analysis (English, Cantonese, and Mandarin)
// 300+ keywords covering common emergency scenarios with variations and synonyms
const SYMPTOM_KEYWORDS = {
  critical: {
    en: [
      // Breathing emergencies
      'unconscious', 'not breathing', 'stopped breathing', 'no breath', 'cant breathe', 'cannot breathe',
      'not responsive', 'unresponsive', 'passed out', 'fainted', 'collapsed',
      // Choking/airway
      'choking', 'choked', 'something stuck', 'stuck in throat', 'cant swallow',
      // Severe bleeding
      'bleeding heavily', 'massive bleeding', 'blood everywhere', 'wont stop bleeding', 'bleeding out',
      'hemorrhaging', 'massive blood loss', 'spurting blood', 'gushing blood',
      // Seizures
      'seizure', 'seizing', 'convulsion', 'convulsing', 'fitting', 'spasms',
      // Poisoning
      'poisoned', 'ate poison', 'toxic', 'ingested', 'swallowed something',
      // Trauma
      'hit by car', 'hit by vehicle', 'run over', 'car accident', 'vehicle accident',
      'attacked', 'bitten', 'mauled', 'fight', 'attacked by dog', 'attacked by animal',
      'fell from height', 'fell down stairs', 'fell from window',
      // Other critical
      'not moving', 'limp', 'lifeless', 'critical condition', 'dying', 'emergency'
    ],
    zh: [
      // Traditional Chinese (Cantonese/HK)
      '昏迷', '不呼吸', '停止呼吸', '失去意識', '昏倒', '暈倒', '倒下',
      '窒息', '哽住', '卡住', '喉嚨卡住',
      '大出血', '流血不止', '大量出血', '血流不停', '噴血',
      '抽搐', '痙攣', '抽筋', '全身抽搐',
      '中毒', '食錯嘢', '食咗毒', '誤食',
      '車撞', '被車撞', '撞車', '交通意外',
      '被襲擊', '被咬', '被打', '被狗咬', '被攻擊',
      '跌落', '從高處跌落', '跌落樓梯',
      '不動', '冇反應', '瀕死', '危急',
      // Simplified Chinese (Mandarin)
      '没呼吸', '停止呼吸', '失去意识', '昏倒', '晕倒',
      '窒息', '卡住', '喉咙卡住',
      '大出血', '流血不止', '大量出血',
      '抽搐', '痉挛', '抽筋',
      '中毒', '吃错东西', '吃了毒', '误食',
      '被车撞', '撞车', '交通意外',
      '被袭击', '被咬', '被狗咬', '被攻击',
      '跌落', '摔下来',
      '不动', '没反应', '濒死', '危急'
    ]
  },
  breathing: {
    en: [
      'difficulty breathing', 'trouble breathing', 'hard to breathe', 'struggling to breathe',
      'gasping', 'gasping for air', 'cant get air',
      'panting heavily', 'panting hard', 'breathing fast', 'rapid breathing',
      'blue gums', 'purple gums', 'pale gums', 'grey gums',
      'wheezing', 'whistling sound', 'noisy breathing',
      'coughing', 'coughing up blood', 'hacking', 'persistent cough',
      'labored breathing', 'shallow breathing', 'irregular breathing',
      'open mouth breathing', 'extended neck', 'flared nostrils'
    ],
    zh: [
      // Traditional
      '呼吸困難', '呼吸唔到', '唔夠氣', '氣促', '透唔到氣',
      '喘氣', '喘', '大力喘', '喘得好厲害',
      '牙齦發藍', '牙肉發紫', '牙齦變色',
      '氣喘', '有雜音', '呼吸有聲',
      '咳嗽', '咳血', '一直咳', '持續咳',
      '張口呼吸', '頸伸長', '鼻孔張大',
      // Simplified
      '呼吸困难', '呼吸不到', '不够气', '气促',
      '喘气', '喘', '喘得很厉害',
      '牙龈发蓝', '牙龈发紫',
      '气喘', '呼吸有声',
      '咳嗽', '咳血', '一直咳',
      '张口呼吸', '颈伸长', '鼻孔张大'
    ]
  },
  injury: {
    en: [
      'bleeding', 'blood', 'bloody', 'blood coming out',
      'wound', 'open wound', 'deep wound', 'laceration', 'gash', 'cut', 'slash',
      'broken leg', 'broken bone', 'fractured', 'broken limb', 'broken paw',
      'limping', 'cant put weight', 'not using leg', 'holding leg up', 'favoring leg',
      'injured', 'hurt', 'trauma', 'injured leg', 'injured paw',
      'swollen', 'swelling', 'lump', 'bump', 'bruise', 'bruised',
      'puncture wound', 'bite wound', 'scratch',
      'dislocated', 'out of place', 'joint problem',
      'exposed bone', 'bone sticking out'
    ],
    zh: [
      // Traditional
      '流血', '出血', '有血', '流緊血', '血流出來',
      '傷口', '開放性傷口', '深傷口', '刀傷', '割傷',
      '斷腿', '骨折', '骨裂', '斷骨', '爪斷',
      '跛行', '唔敢踩', '唔用隻腳', '抬住腳',
      '受傷', '整親', '創傷', '腳受傷', '爪受傷',
      '腫', '腫脹', '腫起', '瘀', '瘀傷',
      '咬傷', '抓傷', '穿刺傷',
      '脫臼', '移位', '關節問題',
      '骨頭露出', '骨頭突出',
      // Simplified
      '流血', '出血', '有血',
      '伤口', '开放性伤口', '深伤口', '刀伤', '割伤',
      '断腿', '骨折', '骨裂', '断骨',
      '跛行', '不敢踩', '不用脚', '抬着脚',
      '受伤', '创伤', '脚受伤',
      '肿', '肿胀', '肿起', '瘀伤',
      '咬伤', '抓伤',
      '脱臼', '移位', '关节问题',
      '骨头露出'
    ]
  },
  digestive: {
    en: [
      'vomiting', 'throwing up', 'puking', 'vomit', 'sick', 'retching',
      'vomiting blood', 'blood in vomit', 'dark vomit',
      'diarrhea', 'loose stool', 'watery stool', 'bloody stool', 'blood in stool',
      'not eating', 'wont eat', 'refusing food', 'no appetite', 'stopped eating',
      'bloated', 'swollen belly', 'distended stomach', 'tight belly', 'hard stomach',
      'stomach pain', 'abdominal pain', 'belly pain', 'tummy pain',
      'drooling', 'excessive drooling', 'salivating',
      'constipated', 'cant poop', 'straining', 'trying to poop',
      'eating grass', 'eating strange things'
    ],
    zh: [
      // Traditional
      '嘔吐', '嘔', '作嘔', '想嘔', '反胃',
      '嘔血', '吐血', '嘔啡色',
      '腹瀉', '屙嘔', '屙水', '屙血', '便血',
      '不吃', '唔食', '拒食', '冇胃口', '停止進食',
      '腹脹', '肚脹', '肚子脹', '肚子硬', '肚子大',
      '肚子痛', '肚痛', '腹痛', '胃痛',
      '流口水', '口水多', '不停流口水',
      '便秘', '屙唔出', '用力屙', '好辛苦屙',
      '食草', '食怪嘢',
      // Simplified
      '呕吐', '呕', '作呕', '想吐', '反胃',
      '呕血', '吐血',
      '腹泻', '拉肚子', '拉水', '拉血', '便血',
      '不吃', '不吃东西', '拒食', '没胃口',
      '腹胀', '肚子胀', '肚子硬', '肚子大',
      '肚子疼', '肚子痛', '腹痛', '胃疼',
      '流口水', '口水多',
      '便秘', '拉不出', '用力拉',
      '吃草', '吃奇怪的东西'
    ]
  },
  neurological: {
    en: [
      'seizure', 'seizing', 'convulsion', 'convulsing', 'fit', 'fitting',
      'shaking', 'trembling', 'tremors', 'shivering', 'twitching',
      'paralyzed', 'cant move', 'cant stand', 'cant walk', 'legs gave out',
      'disoriented', 'confused', 'dazed', 'lost', 'wandering',
      'walking in circles', 'head tilt', 'tilting head', 'head pressing',
      'blind', 'cant see', 'bumping into things',
      'circling', 'pacing', 'restless',
      'weakness', 'weak', 'wobbly', 'unsteady', 'staggering',
      'loss of balance', 'falling over', 'tilting'
    ],
    zh: [
      // Traditional
      '抽搐', '抽筋', '痙攣', '發作',
      '發抖', '震', '顫抖', '抖', '不停抖',
      '癱瘓', '不能動', '不能企', '不能走', '腳軟',
      '迷失方向', '混亂', '糊塗', '失方向', '亂行',
      '行圈', '頭側', '頭歪', '頭撞牆',
      '盲', '看不見', '撞到嘢',
      '行來行去', '不停行', '不安',
      '無力', '軟弱', '搖晃', '企唔穩', '行唔穩',
      '失平衡', '跌倒', '側',
      // Simplified
      '抽搐', '抽筋', '痉挛', '发作',
      '发抖', '震', '颤抖', '抖',
      '瘫痪', '不能动', '不能站', '不能走', '腿软',
      '迷失方向', '混乱', '糊涂', '失方向',
      '走圈', '头侧', '头歪', '头撞墙',
      '盲', '看不见', '撞到东西',
      '走来走去', '不停走', '不安',
      '无力', '软弱', '摇晃', '站不稳', '走不稳',
      '失平衡', '跌倒'
    ]
  },
  pain: {
    en: [
      'crying', 'whimpering', 'whining', 'yelping', 'howling',
      'pain', 'in pain', 'painful', 'hurts', 'hurt', 'sore',
      'screaming', 'screeching', 'shrieking',
      'aggressive', 'biting', 'snapping', 'growling when touched',
      'sensitive', 'touchy', 'flinches', 'pulls away',
      'restless', 'cant settle', 'pacing', 'cant get comfortable',
      'hiding', 'withdrawn', 'acting strange',
      'licking', 'biting at', 'chewing at area'
    ],
    zh: [
      // Traditional
      '哭泣', '嗚咽', '哀鳴', '哀叫', '嗥叫',
      '痛', '好痛', '痛苦', '疼', '痛楚',
      '尖叫', '慘叫', '叫',
      '攻擊性', '咬', '想咬', '摸就嘈',
      '敏感', '一摸就縮', '避開',
      '不安', '安定唔到', '行來行去', '唔舒服',
      '收埋', '躲藏', '行為怪',
      '舔', '咬住', '啃',
      // Simplified
      '哭泣', '呜咽', '哀鸣', '哀叫', '嚎叫',
      '痛', '好痛', '痛苦', '疼', '痛楚',
      '尖叫', '惨叫', '叫',
      '攻击性', '咬', '想咬', '摸就叫',
      '敏感', '一摸就缩', '避开',
      '不安', '安定不了', '走来走去', '不舒服',
      '躲藏', '行为怪',
      '舔', '咬着', '啃'
    ]
  }
};

// Keyword-based fallback analysis (used when DeepSeek API is unavailable)
function analyzeSymptomsFallback(transcript: string): string {
  const lowerTranscript = transcript.toLowerCase();
  const detectedCategories: string[] = [];
  const detectedKeywords: string[] = [];

  // Check each category
  Object.entries(SYMPTOM_KEYWORDS).forEach(([category, keywords]) => {
    const allKeywords = [...keywords.en, ...keywords.zh];
    const foundKeywords = allKeywords.filter(keyword => 
      lowerTranscript.includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      detectedCategories.push(category);
      detectedKeywords.push(...foundKeywords);
    }
  });

  // Generate analysis summary
  if (detectedCategories.length === 0) {
    return 'General emergency';
  }

  if (detectedCategories.includes('critical')) {
    return `CRITICAL: ${detectedKeywords.slice(0, 3).join(', ')}`;
  }

  return detectedKeywords.slice(0, 3).join(', ');
}

// Enhanced AI analysis using DeepSeek (with fallback to keyword detection)
async function analyzeSymptoms(
  transcript: string, 
  language: string = 'en',
  onFallback?: (reason: string) => void
): Promise<string> {
  try {
    // Set up abort controller with 12 second timeout (slightly longer than server-side 10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Try DeepSeek AI analysis first
    const response = await fetch('/api/voice/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.analysis) {
        // Format DeepSeek analysis result
        const { severity, primarySymptoms, confidence } = data.analysis;
        const severityLabel = severity.toUpperCase();
        const confidencePercent = Math.round(confidence * 100);
        
        if (primarySymptoms && primarySymptoms.length > 0) {
          const symptoms = primarySymptoms.slice(0, 3).map((s: any) => s.symptom).join(', ');
          return `${severityLabel} (${confidencePercent}%): ${symptoms}`;
        }
        
        return `${severityLabel} (${confidencePercent}%)`;
      }
    }

    // Handle specific error cases
    if (response.status === 503) {
      onFallback?.('AI service not configured');
    } else if (response.status === 429) {
      onFallback?.('Rate limit exceeded');
    } else if (response.status === 504) {
      onFallback?.('AI analysis timeout');
    } else {
      onFallback?.('AI service unavailable');
    }

    // Fallback to keyword-based analysis
    console.log('DeepSeek not available, using keyword-based analysis');
    return analyzeSymptomsFallback(transcript);

  } catch (error) {
    // Handle timeout and network errors
    if (error instanceof Error && error.name === 'AbortError') {
      onFallback?.('AI analysis timeout');
    } else {
      onFallback?.('Network error');
    }
    
    console.error('AI analysis error, using fallback:', error);
    // Fallback to keyword-based analysis on error
    return analyzeSymptomsFallback(transcript);
  }
}

export function VoiceRecorder({ onTranscriptComplete, language = 'en' }: VoiceRecorderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Voice recording is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    // Initialize speech recognition with multi-language support
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set language based on user preference
    // Supports: English (en-US), Cantonese (zh-HK), Mandarin (zh-CN)
    if (language === 'zh-HK' || language === 'zh') {
      recognition.lang = 'zh-HK'; // Cantonese for Hong Kong users
    } else if (language === 'zh-CN') {
      recognition.lang = 'zh-CN'; // Mandarin Chinese
    } else {
      recognition.lang = 'en-US'; // English (default)
    }

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }

      // Update transcript with both final and interim results
      setTranscript(prev => {
        const newTranscript = prev + finalTranscript;
        return newTranscript || interimTranscript;
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please speak clearly and try again.');
      } else {
        setError(`Error: ${event.error}`);
      }
      
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    
    setTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsRecording(false);

    if (transcript.trim()) {
      setIsAnalyzing(true);
      try {
        // Pass callback to show toast when fallback is used
        const analyzedSymptoms = await analyzeSymptoms(transcript, language, (reason: string) => {
          // Show user-friendly message when AI analysis falls back to keyword detection
          toast({
            title: t('voice_recorder.using_offline_analysis', 'Using offline analysis'),
            description: t('voice_recorder.fallback_message', 'AI analysis unavailable. Using enhanced keyword detection.'),
            variant: 'default',
          });
        });
        onTranscriptComplete(transcript, analyzedSymptoms);
        
        // Show success feedback
        toast({
          title: t('voice_recorder.success', 'Voice recording complete'),
          description: t('voice_recorder.success_description', 'Your symptoms have been analyzed successfully'),
        });
      } catch (error) {
        console.error('Analysis failed:', error);
        // Fallback to keyword analysis
        const fallbackAnalysis = analyzeSymptomsFallback(transcript);
        onTranscriptComplete(transcript, fallbackAnalysis);
        
        toast({
          title: t('voice_recorder.analysis_error', 'Analysis completed'),
          description: t('voice_recorder.fallback_used', 'Using offline symptom detection.'),
          variant: 'default',
        });
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      // No transcript recorded
      setError(t('voice_recorder.no_transcript', 'No speech detected. Please try again.'));
      toast({
        title: t('voice_recorder.error_no_speech', 'No speech detected'),
        description: t('voice_recorder.error_no_speech_description', 'Please speak clearly and try recording again.'),
        variant: 'destructive',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isRecording ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Recording Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <>
                  <div className="relative">
                    <Mic className="h-6 w-6 text-red-600 dark:text-red-400" />
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {t('voice_recorder.recording', 'Recording... Speak now')}
                  </p>
                </>
              ) : transcript ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {t('voice_recorder.recorded', 'Voice recorded successfully')}
                  </p>
                </>
              ) : (
                <>
                  <MicOff className="h-6 w-6 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('voice_recorder.ready', 'Ready to record')}
                  </p>
                </>
              )}
            </div>

            {/* Record Button */}
            {isRecording ? (
              <Button
                onClick={stopRecording}
                variant="destructive"
                data-testid="button-stop-recording"
              >
                <MicOff className="h-4 w-4 mr-2" />
                {t('voice_recorder.stop', 'Stop')}
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-start-recording"
              >
                <Mic className="h-4 w-4 mr-2" />
                {t('voice_recorder.start', 'Start Recording')}
              </Button>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4" data-testid="voice-transcript">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('voice_recorder.transcript', 'Transcript:')}
              </p>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {transcript}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{t('voice_recorder.analyzing', 'Analyzing with AI...')}</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('voice_recorder.analyzed', 'Analyzed symptoms:')} <span className="font-medium text-red-600 dark:text-red-400">{analyzeSymptomsFallback(transcript)}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 {t('voice_recorder.tip', 'Tip: Speak clearly and describe your pet\'s symptoms. The system will automatically analyze and categorize the emergency.')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
