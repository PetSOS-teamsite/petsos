import { useOfflineEmergency } from "@/hooks/useOfflineEmergency";
import { useTranslation } from "@/hooks/useTranslation";
import { WifiOff, Wifi, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, queuedCount, processQueue } = useOfflineEmergency();
  const { t } = useTranslation();

  if (isOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 rounded-lg shadow-lg z-50 transition-all duration-300",
        isOnline
          ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
          : "bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
      )}
      data-testid="offline-indicator"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isOnline ? (
            queuedCount > 0 ? (
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
            )
          ) : (
            <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium text-sm",
              isOnline
                ? "text-green-800 dark:text-green-200"
                : "text-amber-800 dark:text-amber-200"
            )}
          >
            {isOnline
              ? queuedCount > 0
                ? t("offline.syncing", "Syncing queued requests...")
                : t("offline.connected", "Connected")
              : t("offline.disconnected", "You're offline")}
          </p>
          <p
            className={cn(
              "text-xs mt-1",
              isOnline
                ? "text-green-700 dark:text-green-300"
                : "text-amber-700 dark:text-amber-300"
            )}
          >
            {isOnline && queuedCount > 0
              ? t(
                  "offline.queue_processing",
                  "{count} request(s) will be sent automatically"
                ).replace("{count}", String(queuedCount))
              : !isOnline
              ? t(
                  "offline.queue_info",
                  "Emergency requests will be saved and sent when you're back online"
                )
              : null}
          </p>
          {isOnline && queuedCount > 0 && (
            <button
              onClick={processQueue}
              className="mt-2 text-xs font-medium text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 underline"
              data-testid="button-retry-queue"
            >
              {t("offline.retry_now", "Retry now")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OfflineBadge() {
  const { isOnline } = useOfflineEmergency();
  const { t } = useTranslation();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-medium"
      data-testid="offline-badge"
    >
      <WifiOff className="w-3 h-3" />
      <span>{t("offline.badge", "Offline Mode")}</span>
    </div>
  );
}

export function QueuedRequestsBadge() {
  const { queuedCount } = useOfflineEmergency();
  const { t } = useTranslation();

  if (queuedCount === 0) {
    return null;
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-medium"
      data-testid="queued-requests-badge"
    >
      <Clock className="w-3 h-3" />
      <span>
        {t("offline.queued_badge", "{count} queued").replace(
          "{count}",
          String(queuedCount)
        )}
      </span>
    </div>
  );
}
