import { storage } from "../storage";
import type { InsertMessage, Message } from "@shared/schema";
import { sendGmailEmail } from "../gmail-client";

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Email configuration (will be set up via integration)
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@petemergency.com';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// ⚠️ TESTING MODE - REMOVE AFTER TESTING
// When enabled, all WhatsApp messages will be sent to these test numbers instead of actual clinic numbers
const TESTING_MODE = true;
const TEST_PHONE_NUMBERS = ['+85265727136', '+85255375152'];
let testNumberIndex = 0;

interface SendMessageOptions {
  emergencyRequestId: string;
  clinicId: string;
  recipient: string;
  messageType: 'whatsapp' | 'email';
  content: string;
}

export class MessagingService {
  
  /**
   * Send a message via WhatsApp Business API
   */
  private async sendWhatsAppMessage(phoneNumber: string, content: string): Promise<boolean> {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    // ⚠️ TESTING MODE: Override recipient with test numbers
    let actualRecipient = phoneNumber;
    if (TESTING_MODE) {
      actualRecipient = TEST_PHONE_NUMBERS[testNumberIndex % TEST_PHONE_NUMBERS.length];
      testNumberIndex++;
      console.log(`[TESTING MODE] Redirecting WhatsApp from ${phoneNumber} to test number: ${actualRecipient}`);
      
      // Add note to message content that this is a test
      content = `[TEST MESSAGE]\nOriginal recipient: ${phoneNumber}\n\n${content}`;
    }

    try {
      const response = await fetch(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: actualRecipient,
            type: 'text',
            text: { body: content },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('WhatsApp API error:', error);
        return false;
      }

      const result = await response.json();
      console.log('WhatsApp message sent:', result);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send an email (fallback method) using Gmail
   */
  private async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('Invalid email address:', to);
      return false;
    }
    
    try {
      // Use Gmail integration to send email
      return await sendGmailEmail(to, subject, content, EMAIL_FROM);
    } catch (error) {
      console.error('[EMAIL] Gmail send error:', error);
      return false;
    }
  }

  /**
   * Send a message with automatic fallback
   */
  async sendMessage(options: SendMessageOptions): Promise<Message> {
    const { emergencyRequestId, clinicId, recipient, messageType, content } = options;

    // Create message record
    const message = await storage.createMessage({
      emergencyRequestId,
      clinicId,
      recipient,
      messageType,
      content,
      status: 'queued',
    });

    // Try to send immediately
    await this.processMessage(message.id);

    return message;
  }

  /**
   * Process a queued message
   */
  async processMessage(messageId: string): Promise<void> {
    const message = await storage.getMessage(messageId);
    if (!message) {
      console.error('Message not found:', messageId);
      return;
    }

    if (message.status !== 'queued' && message.retryCount >= MAX_RETRIES) {
      return;
    }

    try {
      let success = false;

      if (message.messageType === 'whatsapp') {
        success = await this.sendWhatsAppMessage(message.recipient, message.content);
        
        // If WhatsApp fails, try email fallback
        if (!success) {
          console.log('WhatsApp failed, trying email fallback...');
          const clinic = await storage.getClinic(message.clinicId);
          if (clinic?.email) {
            const emailSuccess = await this.sendEmail(
              clinic.email,
              'Emergency Pet Request',
              message.content
            );
            
            if (emailSuccess) {
              // Update message to reflect email fallback
              await storage.updateMessage(messageId, {
                messageType: 'email',
                recipient: clinic.email,
                status: 'sent',
                sentAt: new Date(),
              });
              return;
            }
          }
        }
      } else if (message.messageType === 'email') {
        success = await this.sendEmail(message.recipient, 'Emergency Pet Request', message.content);
      }

      if (success) {
        await storage.updateMessage(messageId, {
          status: 'sent',
          sentAt: new Date(),
        });
      } else {
        // Retry logic
        const newRetryCount = message.retryCount + 1;
        
        if (newRetryCount >= MAX_RETRIES) {
          await storage.updateMessage(messageId, {
            status: 'failed',
            failedAt: new Date(),
            errorMessage: 'Max retries exceeded',
            retryCount: newRetryCount,
          });
        } else {
          await storage.updateMessage(messageId, {
            retryCount: newRetryCount,
          });
          
          // Schedule retry
          setTimeout(() => {
            this.processMessage(messageId);
          }, RETRY_DELAY_MS * newRetryCount);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      const newRetryCount = message.retryCount + 1;
      await storage.updateMessage(messageId, {
        status: newRetryCount >= MAX_RETRIES ? 'failed' : 'queued',
        failedAt: newRetryCount >= MAX_RETRIES ? new Date() : null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: newRetryCount,
      });

      if (newRetryCount < MAX_RETRIES) {
        setTimeout(() => {
          this.processMessage(messageId);
        }, RETRY_DELAY_MS * newRetryCount);
      }
    }
  }

  /**
   * Process all queued messages (for background job)
   */
  async processQueue(): Promise<void> {
    const queuedMessages = await storage.getQueuedMessages();
    
    for (const message of queuedMessages) {
      await this.processMessage(message.id);
    }
  }

  /**
   * Broadcast emergency to multiple clinics
   */
  async broadcastEmergency(
    emergencyRequestId: string,
    clinicIds: string[],
    message: string
  ): Promise<Message[]> {
    const messages: Message[] = [];

    for (const clinicId of clinicIds) {
      const clinic = await storage.getClinic(clinicId);
      if (!clinic) {
        console.warn(`Clinic not found: ${clinicId}`);
        continue;
      }

      // Determine message type and recipient based on available contact methods
      let messageType: 'whatsapp' | 'email';
      let recipient: string;

      if (clinic.whatsapp) {
        messageType = 'whatsapp';
        recipient = clinic.whatsapp;
      } else if (clinic.email) {
        messageType = 'email';
        recipient = clinic.email;
      } else {
        console.warn(`No valid contact method (WhatsApp or email) for clinic ${clinicId}`);
        
        // Create failed message record for tracking
        await storage.createMessage({
          emergencyRequestId,
          clinicId,
          recipient: clinic.phone || 'unknown',
          messageType: 'whatsapp',
          content: message,
          status: 'failed',
          errorMessage: 'No valid WhatsApp or email contact available',
          failedAt: new Date(),
        });
        
        continue;
      }

      const msg = await this.sendMessage({
        emergencyRequestId,
        clinicId,
        recipient,
        messageType,
        content: message,
      });

      messages.push(msg);
    }

    return messages;
  }
}

export const messagingService = new MessagingService();

// Start background queue processor
setInterval(() => {
  messagingService.processQueue().catch(console.error);
}, 30000); // Process queue every 30 seconds
