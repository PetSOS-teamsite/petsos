import { storage } from "../storage";
import { sendBroadcastNotification } from "./fcm";

const SCHEDULER_INTERVAL_MS = 60 * 1000;

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

async function processScheduledNotifications(): Promise<void> {
  if (isProcessing) {
    console.log('[NotificationScheduler] Previous run still in progress, skipping...');
    return;
  }

  isProcessing = true;

  try {
    const dueNotifications = await storage.getScheduledNotifications();

    if (dueNotifications.length === 0) {
      return;
    }

    console.log(`[NotificationScheduler] Found ${dueNotifications.length} scheduled notifications to send`);

    for (const notification of dueNotifications) {
      try {
        console.log(`[NotificationScheduler] Processing notification ${notification.id}: "${notification.title}"`);

        await storage.updateNotificationBroadcastStatus(notification.id, 'pending');

        const tokens = await storage.getActiveTokens(
          notification.targetLanguage || undefined,
          notification.targetRole || undefined
        );

        if (tokens.length === 0) {
          await storage.updateNotificationBroadcast(notification.id, {
            status: 'sent',
            recipientCount: 0,
            providerResponse: {
              message: 'No active subscriptions found',
              url: notification.url || null
            },
            sentAt: new Date()
          });

          console.log(`[NotificationScheduler] Notification ${notification.id} sent to 0 recipients (no active subscriptions)`);
          continue;
        }

        const result = await sendBroadcastNotification(tokens, {
          title: notification.title,
          message: notification.message,
          url: notification.url || undefined
        });

        if (result.failedTokens && result.failedTokens.length > 0) {
          await storage.deactivatePushSubscriptions(result.failedTokens);
        }

        await storage.updateNotificationBroadcast(notification.id, {
          status: result.success ? 'sent' : 'failed',
          recipientCount: result.successCount || 0,
          providerResponse: {
            successCount: result.successCount || 0,
            failureCount: result.failureCount || 0,
            url: notification.url || null,
            error: result.error || null
          },
          sentAt: result.success ? new Date() : null
        });

        await storage.createAuditLog({
          entityType: 'notification_broadcast',
          entityId: notification.id,
          action: 'send_scheduled',
          userId: notification.adminId,
          changes: {
            title: notification.title,
            scheduledFor: notification.scheduledFor,
            recipientCount: result.successCount || 0,
            success: result.success
          }
        });

        console.log(`[NotificationScheduler] Notification ${notification.id} sent: ${result.successCount} success, ${result.failureCount} failed`);

      } catch (error) {
        console.error(`[NotificationScheduler] Error processing notification ${notification.id}:`, error);

        await storage.updateNotificationBroadcast(notification.id, {
          status: 'failed',
          providerResponse: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
  } catch (error) {
    console.error('[NotificationScheduler] Error in scheduler run:', error);
  } finally {
    isProcessing = false;
  }
}

export function startNotificationScheduler(): void {
  if (schedulerInterval) {
    console.log('[NotificationScheduler] Scheduler already running');
    return;
  }

  console.log('[NotificationScheduler] Starting notification scheduler (checking every minute)');

  processScheduledNotifications();

  schedulerInterval = setInterval(processScheduledNotifications, SCHEDULER_INTERVAL_MS);
}

export function stopNotificationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[NotificationScheduler] Scheduler stopped');
  }
}

export async function runSchedulerOnce(): Promise<void> {
  await processScheduledNotifications();
}
