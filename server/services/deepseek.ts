/**
 * DeepSeek AI Service
 * Enhanced voice transcript analysis using DeepSeek's language model
 * Provides context-aware symptom detection and severity scoring
 */

interface DeepSeekAnalysisResult {
  severity: 'critical' | 'urgent' | 'moderate' | 'general';
  confidence: number; // 0-1
  primarySymptoms: Array<{
    symptom: string;
    category: string;
    bodyPart?: string;
  }>;
  summary: string; // Short summary for broadcast
  detectedKeywords: string[]; // Keywords detected
  language: string; // Detected language
  timestamp: string;
}

export class DeepSeekService {
  private apiKey: string;
  private apiUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY not set - AI analysis will use fallback keyword detection');
    }
  }

  /**
   * Check if DeepSeek API is configured
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Analyze voice transcript using DeepSeek AI
   */
  async analyzeVoiceTranscript(transcript: string, language: string = 'en'): Promise<DeepSeekAnalysisResult> {
    if (!this.isAvailable()) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(transcript, language);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent medical analysis
          max_tokens: 500,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from DeepSeek API');
      }

      const analysis = JSON.parse(content);
      
      return {
        severity: analysis.severity || 'general',
        confidence: analysis.confidence || 0.5,
        primarySymptoms: analysis.primarySymptoms || [],
        summary: analysis.summary || 'Emergency situation detected',
        detectedKeywords: analysis.detectedKeywords || [],
        language: analysis.language || language,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      console.error('DeepSeek analysis error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt for DeepSeek
   */
  private buildSystemPrompt(language: string): string {
    return `You are a veterinary triage assistant analyzing pet emergency descriptions.

Your task:
1. Analyze the pet owner's description of their emergency
2. Identify symptoms and their severity
3. Categorize the emergency level
4. Extract key information for veterinary clinics

Categories of symptoms:
- Critical: Life-threatening (unconscious, not breathing, severe bleeding, poisoning, trauma)
- Urgent: Serious but stable (difficulty breathing, seizures, severe pain, acute injury)
- Moderate: Concerning but not immediately life-threatening (vomiting, diarrhea, limping)
- General: Non-specific emergency

Return ONLY a JSON object with this exact structure:
{
  "severity": "critical" | "urgent" | "moderate" | "general",
  "confidence": 0.0-1.0,
  "primarySymptoms": [
    {
      "symptom": "difficulty breathing",
      "category": "breathing",
      "bodyPart": "respiratory system"
    }
  ],
  "summary": "Brief description (max 50 words) suitable for emergency broadcast",
  "detectedKeywords": ["keyword1", "keyword2"],
  "language": "${language}"
}

Be concise, accurate, and prioritize life-threatening conditions.`;
  }

  /**
   * Build user prompt for DeepSeek
   */
  private buildUserPrompt(transcript: string, language: string): string {
    const langNote = language === 'zh-HK' || language === 'zh' 
      ? ' (Note: This may be in Cantonese or mixed Cantonese/English)'
      : language === 'zh-CN'
      ? ' (Note: This may be in Mandarin Chinese)'
      : '';

    return `Analyze this pet emergency description${langNote}:

"${transcript}"

Provide JSON analysis with severity, symptoms, and a brief summary for veterinary clinics.`;
  }

  /**
   * Generate broadcast-ready message from analysis
   */
  formatForBroadcast(analysis: DeepSeekAnalysisResult, transcript: string): string {
    const severityEmoji = {
      critical: '🔴',
      urgent: '⚠️',
      moderate: '🟡',
      general: 'ℹ️'
    };

    const emoji = severityEmoji[analysis.severity];
    const confidencePercent = Math.round(analysis.confidence * 100);

    let message = `${emoji} AI EMERGENCY ANALYSIS\n`;
    message += `═══════════════════════════\n`;
    message += `Severity: ${analysis.severity.toUpperCase()}\n`;
    message += `Confidence: ${confidencePercent}%\n\n`;

    if (analysis.primarySymptoms.length > 0) {
      message += `Primary Concerns:\n`;
      analysis.primarySymptoms.forEach(symptom => {
        message += `  • ${symptom.symptom}`;
        if (symptom.bodyPart) {
          message += ` (${symptom.bodyPart})`;
        }
        message += `\n`;
      });
      message += `\n`;
    }

    message += `Summary:\n${analysis.summary}\n\n`;
    message += `═══════════════════════════\n`;
    message += `🎤 OWNER'S DESCRIPTION\n`;
    message += `═══════════════════════════\n`;
    message += `"${transcript}"\n\n`;
    message += `Analyzed: ${new Date(analysis.timestamp).toLocaleString()}\n`;

    return message;
  }
}

// Singleton instance
export const deepseekService = new DeepSeekService();
