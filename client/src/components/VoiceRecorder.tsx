import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, analyzedSymptoms: string) => void;
  language?: string;
}

// Symptom keywords for analysis (English and Chinese)
const SYMPTOM_KEYWORDS = {
  critical: {
    en: ['unconscious', 'not breathing', 'choking', 'bleeding heavily', 'seizure', 'convulsion', 'poisoned', 'hit by car', 'attacked'],
    zh: ['昏迷', '不呼吸', '窒息', '大出血', '抽搐', '痙攣', '中毒', '車撞', '被襲擊', '失去意識']
  },
  breathing: {
    en: ['difficulty breathing', 'gasping', 'panting heavily', 'blue gums', 'wheezing', 'coughing'],
    zh: ['呼吸困難', '喘氣', '喘得很厲害', '牙齦發藍', '氣喘', '咳嗽']
  },
  injury: {
    en: ['bleeding', 'wound', 'broken leg', 'broken bone', 'limping', 'cut', 'injured'],
    zh: ['流血', '傷口', '斷腿', '骨折', '跛行', '割傷', '受傷']
  },
  digestive: {
    en: ['vomiting', 'diarrhea', 'not eating', 'bloated', 'stomach pain'],
    zh: ['嘔吐', '腹瀉', '不吃', '腹脹', '肚子痛', '胃痛']
  },
  neurological: {
    en: ['seizure', 'shaking', 'trembling', 'paralyzed', 'cant walk', 'disoriented', 'confused'],
    zh: ['抽搐', '發抖', '顫抖', '癱瘓', '不能走', '迷失方向', '混亂']
  },
  pain: {
    en: ['crying', 'whimpering', 'pain', 'hurt', 'screaming', 'yelping'],
    zh: ['哭泣', '嗚咽', '痛', '疼', '尖叫', '哀號']
  }
};

function analyzeSymptoms(transcript: string): string {
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

export function VoiceRecorder({ onTranscriptComplete, language = 'en' }: VoiceRecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Voice recording is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'zh' ? 'zh-HK' : 'en-US';

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

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsRecording(false);

    if (transcript.trim()) {
      const analyzedSymptoms = analyzeSymptoms(transcript);
      onTranscriptComplete(transcript, analyzedSymptoms);
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('voice_recorder.analyzed', 'Analyzed symptoms:')} <span className="font-medium text-red-600 dark:text-red-400">{analyzeSymptoms(transcript)}</span>
                </p>
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
