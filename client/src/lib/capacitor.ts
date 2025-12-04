import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { Geolocation } from '@capacitor/geolocation';

export const isNativePlatform = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

export function getApiBaseUrl(): string {
  if (isNativePlatform) {
    return import.meta.env.VITE_API_URL || 'https://petsos.site';
  }
  return '';
}

export async function initializeCapacitor() {
  if (!isNativePlatform) {
    console.log('Running in web mode');
    return;
  }

  console.log(`Running on ${platform} native platform`);

  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#EF4444' });
  } catch (e) {
    console.log('StatusBar not available:', e);
  }

  try {
    await SplashScreen.hide();
  } catch (e) {
    console.log('SplashScreen not available:', e);
  }

  try {
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.paddingBottom = `${info.keyboardHeight}px`;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0px';
    });
  } catch (e) {
    console.log('Keyboard listeners not available:', e);
  }

  App.addListener('appUrlOpen', (event) => {
    console.log('Deep link received:', event.url);
    const url = new URL(event.url);
    const path = url.pathname;
    
    if (path.startsWith('/emergency')) {
      window.location.href = path;
    } else if (path.startsWith('/clinics')) {
      window.location.href = path;
    } else if (path.startsWith('/hospitals')) {
      window.location.href = path;
    }
  });

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}

export async function requestPushNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform) {
    return false;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      savePushToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
      const data = notification.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });

    return true;
  } catch (e) {
    console.error('Failed to setup push notifications:', e);
    return false;
  }
}

async function savePushToken(token: string) {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/push/register-native`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        token, 
        platform,
        deviceInfo: {
          platform,
          isNative: true,
        }
      }),
    });
    
    if (!response.ok) {
      console.error('Push token registration failed:', response.status, await response.text());
    } else {
      console.log('Push token registered successfully');
    }
  } catch (e) {
    console.error('Failed to save push token:', e);
  }
}

export async function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (isNativePlatform) {
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          return null;
        }
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (e) {
    console.error('Failed to get location:', e);
    return null;
  }
}

export async function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!isNativePlatform) return;

  try {
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }[style];

    await Haptics.impact({ style: impactStyle });
  } catch (e) {
    console.log('Haptics not available:', e);
  }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!isNativePlatform) return;

  try {
    const notificationTypeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };

    await Haptics.notification({ type: notificationTypeMap[type] });
  } catch (e) {
    console.log('Haptics not available:', e);
  }
}

export async function hideKeyboard() {
  if (!isNativePlatform) return;

  try {
    await Keyboard.hide();
  } catch (e) {
    console.log('Keyboard hide not available:', e);
  }
}

export function getAppInfo() {
  return {
    platform,
    isNative: isNativePlatform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
}
