import { fetchTyphoonWarning, TyphoonWarningData } from './hko-api';
import { storage } from '../storage';
import { queueTyphoonNotifications } from './notification-scheduler';

export interface TyphoonSyncResult {
  changed: boolean;
  action: 'none' | 'created' | 'updated' | 'lifted';
  previousSignal?: string;
  currentSignal?: string;
  alert?: any;
  error?: string;
}

let pollingInterval: NodeJS.Timeout | null = null;
const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// T8+ signals are severe weather warnings that require notifications
function isT8OrAbove(signalCode: string): boolean {
  const code = signalCode.toUpperCase();
  return code.includes('8') || code.includes('9') || code.includes('10') || 
         code === 'T8' || code === 'T9' || code === 'T10' ||
         code === 'SIGNAL_8' || code === 'SIGNAL_9' || code === 'SIGNAL_10';
}

export async function checkAndUpdateTyphoonStatus(): Promise<TyphoonSyncResult> {
  try {
    console.log('[Typhoon Monitor] Checking typhoon status...');
    
    const [hkoData, activeAlert] = await Promise.all([
      fetchTyphoonWarning().catch(err => {
        console.error('[Typhoon Monitor] Failed to fetch HKO data:', err.message);
        return null;
      }),
      storage.getActiveTyphoonAlert()
    ]);
    
    if (hkoData === null && activeAlert === null) {
      console.log('[Typhoon Monitor] No typhoon signal active, no alert in DB');
      return { changed: false, action: 'none' };
    }
    
    if (hkoData !== null && activeAlert === null) {
      console.log(`[Typhoon Monitor] New typhoon signal detected: ${hkoData.signalCode}`);
      const newAlert = await storage.createTyphoonAlert({
        signalCode: hkoData.signalCode,
        signalNameEn: hkoData.signalName,
        signalNameZh: hkoData.signalNameZh,
        issuedAt: hkoData.issuedAt,
        isActive: true,
        severityLevel: hkoData.severity,
        notes: hkoData.rawData ? JSON.stringify(hkoData.rawData) : null
      });
      
      console.log(`[Typhoon Monitor] Created new typhoon alert: ${newAlert.id}`);
      
      // Queue notifications for T8+ signals (signal 8, 9, 10)
      if (isT8OrAbove(hkoData.signalCode)) {
        console.log(`[Typhoon Monitor] T8+ signal detected, queueing notifications...`);
        await queueTyphoonNotifications(newAlert.id);
      }
      
      return {
        changed: true,
        action: 'created',
        currentSignal: hkoData.signalCode,
        alert: newAlert
      };
    }
    
    if (hkoData === null && activeAlert !== null) {
      console.log(`[Typhoon Monitor] Typhoon signal lifted (was: ${activeAlert.signalCode})`);
      const liftedAlert = await storage.liftTyphoonAlert(activeAlert.id);
      
      return {
        changed: true,
        action: 'lifted',
        previousSignal: activeAlert.signalCode,
        alert: liftedAlert
      };
    }
    
    if (hkoData !== null && activeAlert !== null) {
      if (hkoData.signalCode !== activeAlert.signalCode) {
        console.log(`[Typhoon Monitor] Typhoon signal changed: ${activeAlert.signalCode} -> ${hkoData.signalCode}`);
        
        await storage.liftTyphoonAlert(activeAlert.id);
        
        const newAlert = await storage.createTyphoonAlert({
          signalCode: hkoData.signalCode,
          signalNameEn: hkoData.signalName,
          signalNameZh: hkoData.signalNameZh,
          issuedAt: hkoData.issuedAt,
          isActive: true,
          severityLevel: hkoData.severity,
          notes: hkoData.rawData ? JSON.stringify(hkoData.rawData) : null
        });
        
        return {
          changed: true,
          action: 'updated',
          previousSignal: activeAlert.signalCode,
          currentSignal: hkoData.signalCode,
          alert: newAlert
        };
      }
      
      console.log(`[Typhoon Monitor] No change - signal still ${hkoData.signalCode}`);
      return {
        changed: false,
        action: 'none',
        currentSignal: hkoData.signalCode,
        alert: activeAlert
      };
    }
    
    return { changed: false, action: 'none' };
  } catch (error: any) {
    console.error('[Typhoon Monitor] Error checking typhoon status:', error.message);
    return {
      changed: false,
      action: 'none',
      error: error.message
    };
  }
}

export function startTyphoonPolling(): void {
  if (pollingInterval) {
    console.log('[Typhoon Monitor] Polling already running');
    return;
  }
  
  console.log(`[Typhoon Monitor] Starting background polling (every ${POLLING_INTERVAL_MS / 1000}s)`);
  
  checkAndUpdateTyphoonStatus()
    .then(result => {
      if (result.changed) {
        console.log(`[Typhoon Monitor] Initial check - ${result.action}: ${result.currentSignal || result.previousSignal}`);
      }
    })
    .catch(err => console.error('[Typhoon Monitor] Initial check failed:', err.message));
  
  pollingInterval = setInterval(async () => {
    try {
      const result = await checkAndUpdateTyphoonStatus();
      if (result.changed) {
        console.log(`[Typhoon Monitor] Status changed - ${result.action}: ${result.currentSignal || result.previousSignal}`);
      }
    } catch (error: any) {
      console.error('[Typhoon Monitor] Polling error:', error.message);
    }
  }, POLLING_INTERVAL_MS);
}

export function stopTyphoonPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Typhoon Monitor] Polling stopped');
  }
}

export function isPollingActive(): boolean {
  return pollingInterval !== null;
}
