export interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  targetLanguage?: string;
}

export interface SendNotificationResult {
  success: boolean;
  recipientCount?: number;
  onesignalId?: string;
  error?: string;
}

class OneSignalService {
  private appId: string;
  private restApiKey: string;
  private apiUrl = 'https://onesignal.com/api/v1/notifications';

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || '';
    this.restApiKey = process.env.ONESIGNAL_REST_API_KEY || '';

    if (!this.appId || !this.restApiKey) {
      console.warn('⚠️ OneSignal credentials not set - push notifications will be simulated');
    }
  }

  isAvailable(): boolean {
    return !!(this.appId && this.restApiKey);
  }

  async sendBroadcastNotification(payload: NotificationPayload): Promise<SendNotificationResult> {
    if (!this.isAvailable()) {
      console.log('📱 [OneSignal Simulation] Would send notification:', {
        title: payload.title,
        message: payload.message,
        targetLanguage: payload.targetLanguage || 'all',
        url: payload.url
      });
      
      return {
        success: true,
        recipientCount: 0,
        onesignalId: `simulated-${Date.now()}`,
        error: undefined
      };
    }

    try {
      const notificationData: Record<string, unknown> = {
        app_id: this.appId,
        headings: { en: payload.title },
        contents: { en: payload.message },
      };

      if (payload.targetLanguage) {
        notificationData.filters = [
          { field: 'tag', key: 'language', relation: '=', value: payload.targetLanguage }
        ];
      } else {
        notificationData.included_segments = ['All'];
      }

      if (payload.url) {
        notificationData.url = payload.url;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OneSignal API error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.errors?.join(', ') || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        console.error('OneSignal API error:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        recipientCount: data.recipients || 0,
        onesignalId: data.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OneSignal send error:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async sendTargetedNotification(
    playerIds: string[],
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    if (!this.isAvailable()) {
      console.log('📱 [OneSignal Simulation] Would send targeted notification to', playerIds.length, 'users');
      return {
        success: true,
        recipientCount: playerIds.length,
        onesignalId: `simulated-targeted-${Date.now()}`
      };
    }

    if (playerIds.length === 0) {
      return {
        success: false,
        error: 'No player IDs provided'
      };
    }

    try {
      const notificationData = {
        app_id: this.appId,
        include_player_ids: playerIds,
        headings: { en: payload.title },
        contents: { en: payload.message },
        ...(payload.url && { url: payload.url })
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OneSignal targeted API error:', errorText);
        return {
          success: false,
          error: `OneSignal API error: ${response.status}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        recipientCount: data.recipients || 0,
        onesignalId: data.id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OneSignal targeted send error:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const oneSignalService = new OneSignalService();
export const sendBroadcastNotification = (payload: NotificationPayload) => 
  oneSignalService.sendBroadcastNotification(payload);
