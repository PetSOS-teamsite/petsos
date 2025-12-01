import admin from 'firebase-admin';

export interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  targetLanguage?: string;
  icon?: string;
  image?: string;
}

export interface SendNotificationResult {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  failedTokens?: string[];
  error?: string;
}

class FCMService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set - push notifications will be simulated');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      
      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    }
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  async sendToTokens(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    if (!this.isAvailable()) {
      console.log('📱 [FCM Simulation] Would send notification to', tokens.length, 'devices:', {
        title: payload.title,
        message: payload.message,
        url: payload.url
      });
      
      return {
        success: true,
        successCount: tokens.length,
        failureCount: 0,
        failedTokens: []
      };
    }

    if (tokens.length === 0) {
      return {
        success: false,
        error: 'No tokens provided',
        successCount: 0,
        failureCount: 0
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.message,
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.message,
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            ...(payload.image && { image: payload.image }),
          },
          fcmOptions: {
            link: payload.url || '/',
          },
        },
        data: {
          url: payload.url || '/',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          console.error(`FCM send failed for token ${tokens[idx]}:`, resp.error.message);
          if (resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered') {
            failedTokens.push(tokens[idx]);
          }
        }
      });

      console.log(`📱 FCM sent: ${response.successCount} success, ${response.failureCount} failed`);

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('FCM send error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        successCount: 0,
        failureCount: tokens.length
      };
    }
  }

  async sendBroadcast(
    tokens: string[],
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    return this.sendToTokens(tokens, payload);
  }
}

export const fcmService = new FCMService();

export const sendPushNotification = async (
  tokens: string[],
  payload: NotificationPayload
): Promise<SendNotificationResult> => {
  return fcmService.sendToTokens(tokens, payload);
};

export const sendBroadcastNotification = async (
  tokens: string[],
  payload: NotificationPayload
): Promise<SendNotificationResult> => {
  return fcmService.sendBroadcast(tokens, payload);
};
