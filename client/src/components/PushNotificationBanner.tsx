import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from '@/hooks/useTranslation';

export function PushNotificationBanner() {
  const { isSupported, isInitialized, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const { language } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('push-banner-dismissed');
    const prompted = localStorage.getItem('push-prompt-shown');
    if (dismissed) setIsDismissed(true);
    if (prompted) setHasShownPrompt(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('push-banner-dismissed', 'true');
  };

  const handleSubscribe = async () => {
    await subscribe();
    setHasShownPrompt(true);
    localStorage.setItem('push-prompt-shown', 'true');
    handleDismiss();
  };

  if (!isSupported || !isInitialized || isSubscribed || isDismissed || hasShownPrompt || isLoading) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
      data-testid="push-notification-banner"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
        data-testid="button-dismiss-banner"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {language === 'zh-HK' ? '接收緊急通知' : 'Get Emergency Alerts'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {language === 'zh-HK' 
              ? '啟用推送通知，即時收到緊急更新及寵物護理資訊。'
              : 'Enable push notifications for instant emergency updates and pet care tips.'}
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubscribe}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
              data-testid="button-enable-notifications"
            >
              {language === 'zh-HK' ? '啟用通知' : 'Enable'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs"
              data-testid="button-not-now"
            >
              {language === 'zh-HK' ? '稍後' : 'Not now'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
