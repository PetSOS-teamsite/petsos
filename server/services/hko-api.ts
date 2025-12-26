const HKO_API_URL = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en';

export interface TyphoonWarningData {
  signalCode: string;
  signalName: string;
  signalNameZh: string;
  issuedAt: Date;
  severity: number;
  rawData?: any;
}

const SIGNAL_NAMES: Record<string, { en: string; zh: string; severity: number }> = {
  'TC1': { en: 'Standby Signal No. 1', zh: '一號戒備信號', severity: 1 },
  'TC3': { en: 'Strong Wind Signal No. 3', zh: '三號強風信號', severity: 3 },
  'TC8NE': { en: 'Gale or Storm Signal No. 8 NE', zh: '八號東北烈風或暴風信號', severity: 8 },
  'TC8NW': { en: 'Gale or Storm Signal No. 8 NW', zh: '八號西北烈風或暴風信號', severity: 8 },
  'TC8SE': { en: 'Gale or Storm Signal No. 8 SE', zh: '八號東南烈風或暴風信號', severity: 8 },
  'TC8SW': { en: 'Gale or Storm Signal No. 8 SW', zh: '八號西南烈風或暴風信號', severity: 8 },
  'TC9': { en: 'Increasing Gale or Storm Signal No. 9', zh: '九號烈風或暴風風力增強信號', severity: 9 },
  'TC10': { en: 'Hurricane Signal No. 10', zh: '十號颶風信號', severity: 10 },
};

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PetSOS/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error: any) {
      console.error(`[HKO API] Attempt ${attempt}/${retries} failed:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Failed to fetch HKO data after ${retries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('Unexpected error in fetchWithRetry');
}

function parseSignalCode(rawCode: string): string | null {
  if (!rawCode) return null;
  
  const normalized = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (normalized.startsWith('TC')) {
    return normalized;
  }
  
  const codeMap: Record<string, string> = {
    'WFIRE': null as any,
    'WFROST': null as any,
    'WHOT': null as any,
    'WCOLD': null as any,
    'WMSGNL': null as any,
    'WRAIN': null as any,
    'WFNTSA': null as any,
    'WL': null as any,
    'WTMW': null as any,
    'WTS': null as any,
  };
  
  if (normalized in codeMap) {
    return null;
  }
  
  return null;
}

export async function fetchTyphoonWarning(): Promise<TyphoonWarningData | null> {
  try {
    console.log('[HKO API] Fetching typhoon warning data...');
    
    const response = await fetchWithRetry(HKO_API_URL);
    const data = await response.json();
    
    console.log('[HKO API] Response received:', JSON.stringify(data).substring(0, 500));
    
    if (!data || typeof data !== 'object') {
      console.log('[HKO API] Invalid response format');
      return null;
    }
    
    const wtcsgnl = data.WTCSGNL;
    if (!wtcsgnl) {
      console.log('[HKO API] No WTCSGNL field - no typhoon signal active');
      return null;
    }
    
    const signalCode = wtcsgnl.code;
    if (!signalCode) {
      console.log('[HKO API] WTCSGNL present but no code field');
      return null;
    }
    
    const normalizedCode = signalCode.toUpperCase();
    const signalInfo = SIGNAL_NAMES[normalizedCode];
    
    if (!signalInfo) {
      console.warn(`[HKO API] Unknown signal code: ${signalCode}`);
      const severity = normalizedCode.includes('10') ? 10 :
                       normalizedCode.includes('9') ? 9 :
                       normalizedCode.includes('8') ? 8 :
                       normalizedCode.includes('3') ? 3 : 1;
      
      return {
        signalCode: normalizedCode,
        signalName: `Typhoon Signal ${normalizedCode}`,
        signalNameZh: `颱風信號 ${normalizedCode}`,
        issuedAt: wtcsgnl.issueTime ? new Date(wtcsgnl.issueTime) : new Date(),
        severity,
        rawData: wtcsgnl
      };
    }
    
    const issuedAt = wtcsgnl.issueTime ? new Date(wtcsgnl.issueTime) : 
                     wtcsgnl.updateTime ? new Date(wtcsgnl.updateTime) : new Date();
    
    console.log(`[HKO API] Active typhoon signal: ${normalizedCode} (${signalInfo.en}), issued at ${issuedAt.toISOString()}`);
    
    return {
      signalCode: normalizedCode,
      signalName: signalInfo.en,
      signalNameZh: signalInfo.zh,
      issuedAt,
      severity: signalInfo.severity,
      rawData: wtcsgnl
    };
  } catch (error: any) {
    console.error('[HKO API] Error fetching typhoon warning:', error.message);
    throw error;
  }
}

export function getSignalInfo(signalCode: string): { en: string; zh: string; severity: number } | null {
  return SIGNAL_NAMES[signalCode.toUpperCase()] || null;
}

export function getAllSignalCodes(): string[] {
  return Object.keys(SIGNAL_NAMES);
}
