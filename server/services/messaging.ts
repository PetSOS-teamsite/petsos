import { storage } from "../storage";
import type { InsertMessage, Message } from "@shared/schema";
import { sendGmailEmail } from "../gmail-client";
import { Client as LineClient } from '@line/bot-sdk';

// WhatsApp Business API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// LINE Messaging API configuration
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// Email configuration (will be set up via integration)
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@petemergency.com';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// ⚠️ TESTING MODE - REMOVE AFTER TESTING
// When enabled, all WhatsApp messages will be sent to these test numbers instead of actual clinic numbers
const TESTING_MODE = false; // Disabled for App Review video recording
const TEST_PHONE_NUMBERS = ['85265727136', '85255375152']; // Format: country code + number (no + or -)
let testNumberIndex = 0;

interface SendMessageOptions {
  emergencyRequestId: string;
  hospitalId: string;
  recipient: string;
  messageType: 'whatsapp' | 'email' | 'line';
  content: string;
}

export class MessagingService {
  
  /**
   * Send a WhatsApp template message using approved Meta templates
   */
  private async sendWhatsAppTemplateMessage(
    phoneNumber: string,
    templateName: string,
    templateVariables: string[]
  ): Promise<boolean> {
    console.log('[WhatsApp Template] Attempting to send template message...');
    console.log('[WhatsApp Template] Template:', templateName);
    console.log('[WhatsApp Template] Variables count:', templateVariables.length);
    console.log('[WhatsApp Template] Has Access Token:', !!WHATSAPP_ACCESS_TOKEN);
    console.log('[WhatsApp Template] Has Phone Number ID:', !!WHATSAPP_PHONE_NUMBER_ID);
    
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('[WhatsApp Template] Credentials not configured - missing token or phone number ID');
      return false;
    }

    // Validate phone number
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanedNumber || cleanedNumber.length < 8) {
      console.error('[WhatsApp Template] Invalid phone number:', phoneNumber);
      return false;
    }

    try {
      const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      
      // Build template component parameters
      const parameters = templateVariables.map(value => ({
        type: 'text',
        text: value
      }));
      
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanedNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: templateName.endsWith('_zh_hk') ? 'zh_HK' : 'en'
          },
          components: [
            {
              type: 'body',
              parameters: parameters
            }
          ]
        }
      };
      
      console.log('[WhatsApp Template] Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[WhatsApp Template] Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[WhatsApp Template] API error response:', error);
        try {
          const errorJson = JSON.parse(error);
          console.error('[WhatsApp Template] Parsed error:', JSON.stringify(errorJson, null, 2));
        } catch (e) {
          // Error wasn't JSON
        }
        return false;
      }

      const result = await response.json();
      console.log('[WhatsApp Template] Message sent successfully!');
      console.log('[WhatsApp Template] API Response:', JSON.stringify(result, null, 2));
      console.log('[WhatsApp Template] Message ID:', result.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error('[WhatsApp Template] Error sending message:', error);
      return false;
    }
  }

  /**
   * Send a message via WhatsApp Business API (legacy plain text - for fallback only)
   */
  private async sendWhatsAppMessage(phoneNumber: string, content: string): Promise<boolean> {
    console.log('[WhatsApp] Attempting to send message...');
    console.log('[WhatsApp] Has Access Token:', !!WHATSAPP_ACCESS_TOKEN);
    console.log('[WhatsApp] Has Phone Number ID:', !!WHATSAPP_PHONE_NUMBER_ID);
    console.log('[WhatsApp] API URL:', WHATSAPP_API_URL);
    
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('[WhatsApp] Credentials not configured - missing token or phone number ID');
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

    // Validate phone number (must be non-empty and contain only digits after removing common formatting)
    const cleanedNumber = actualRecipient.replace(/[^0-9]/g, '');
    if (!cleanedNumber || cleanedNumber.length < 8) {
      console.error('[WhatsApp] Invalid phone number:', actualRecipient);
      return false;
    }

    try {
      const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      console.log('[WhatsApp] Sending to URL:', url);
      console.log('[WhatsApp] Recipient (original):', phoneNumber);
      console.log('[WhatsApp] Recipient (cleaned):', cleanedNumber);
      console.log('[WhatsApp] Actual recipient:', actualRecipient);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: cleanedNumber, // Use cleaned number without dashes
        type: 'text',
        text: { body: content },
      };
      
      console.log('[WhatsApp] Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[WhatsApp] Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[WhatsApp] API error response:', error);
        try {
          const errorJson = JSON.parse(error);
          console.error('[WhatsApp] Parsed error:', JSON.stringify(errorJson, null, 2));
        } catch (e) {
          // Error wasn't JSON
        }
        return false;
      }

      const result = await response.json();
      console.log('[WhatsApp] Message sent successfully!');
      console.log('[WhatsApp] API Response:', JSON.stringify(result, null, 2));
      console.log('[WhatsApp] Message ID:', result.messages?.[0]?.id);
      console.log('[WhatsApp] WhatsApp ID:', result.contacts?.[0]?.wa_id);
      return true;
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
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
   * Send a LINE message using LINE Messaging API
   */
  private async sendLineMessage(lineUserId: string, content: string): Promise<boolean> {
    console.log('[LINE] Attempting to send message...');
    console.log('[LINE] Has Access Token:', !!LINE_CHANNEL_ACCESS_TOKEN);
    console.log('[LINE] Has Channel Secret:', !!LINE_CHANNEL_SECRET);
    
    if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_CHANNEL_SECRET) {
      console.error('[LINE] Credentials not configured - missing token or secret');
      return false;
    }

    // Validate LINE user ID
    if (!lineUserId || lineUserId.trim().length === 0) {
      console.error('[LINE] Invalid LINE user ID:', lineUserId);
      return false;
    }

    try {
      // Initialize LINE client
      const lineClient = new LineClient({
        channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: LINE_CHANNEL_SECRET,
      });

      // Send text message
      await lineClient.pushMessage(lineUserId, {
        type: 'text',
        text: content,
      });

      console.log('[LINE] Message sent successfully!');
      console.log('[LINE] Recipient User ID:', lineUserId);
      return true;
    } catch (error) {
      console.error('[LINE] Error sending message:', error);
      return false;
    }
  }

  /**
   * Send a message with automatic fallback
   */
  async sendMessage(options: SendMessageOptions): Promise<Message> {
    const { emergencyRequestId, hospitalId, recipient, messageType, content } = options;

    // Create message record
    const message = await storage.createMessage({
      emergencyRequestId,
      hospitalId,
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
        // Check if this is a template message (content starts with "[Template: ")
        if (message.content.startsWith('[Template: ')) {
          // Extract template name from content
          const templateMatch = message.content.match(/\[Template: ([^\]]+)\]/);
          if (templateMatch) {
            const templateName = templateMatch[1];
            
            // Rebuild template data from emergency request
            const emergencyRequestId = message.emergencyRequestId;
            const templateData = await this.buildTemplateMessage(emergencyRequestId);
            
            if (templateData && templateData.templateName === templateName) {
              success = await this.sendWhatsAppTemplateMessage(
                message.recipient,
                templateData.templateName,
                templateData.variables
              );
            } else {
              console.error('[Process Message] Failed to rebuild template data');
              success = false;
            }
          }
        } else {
          // Legacy plain text message
          success = await this.sendWhatsAppMessage(message.recipient, message.content);
        }
        
        // If WhatsApp fails, try email fallback
        if (!success) {
          console.log('WhatsApp failed, trying email fallback...');
          const hospital = await storage.getHospital(message.hospitalId);
          if (hospital?.email) {
            const emailSuccess = await this.sendEmail(
              hospital.email,
              'Emergency Pet Request',
              message.content.replace(/\[Template: [^\]]+\]\s*/, '') // Remove template prefix for email
            );
            
            if (emailSuccess) {
              // Update message to reflect email fallback
              await storage.updateMessage(messageId, {
                messageType: 'email',
                recipient: hospital.email,
                status: 'sent',
                sentAt: new Date(),
              });
              return;
            }
          }
        }
      } else if (message.messageType === 'email') {
        success = await this.sendEmail(message.recipient, 'Emergency Pet Request', message.content);
      } else if (message.messageType === 'line') {
        // Send LINE message
        const cleanContent = message.content.replace(/\[Template: [^\]]+\]\s*/, ''); // Remove template prefix for LINE
        success = await this.sendLineMessage(message.recipient, cleanContent);
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
   * Build WhatsApp template message based on emergency request data
   */
  private async buildTemplateMessage(
    emergencyRequestId: string,
    language: string = 'en'
  ): Promise<{ templateName: string; variables: string[]; fallbackText: string } | null> {
    // Fetch emergency request with related data
    const emergencyRequest = await storage.getEmergencyRequest(emergencyRequestId);
    if (!emergencyRequest) {
      console.error('[Template Builder] Emergency request not found:', emergencyRequestId);
      return null;
    }

    // Fetch pet data if available
    let pet = null;
    if (emergencyRequest.petId) {
      pet = await storage.getPet(emergencyRequest.petId);
    }

    // Fetch user data for language preference
    let user = null;
    if (emergencyRequest.userId) {
      user = await storage.getUser(emergencyRequest.userId);
    }

    // Fetch medical records and consent if user has consented to sharing
    let medicalRecordsSummary = '';
    if (emergencyRequest.petId && emergencyRequest.userId) {
      // Check if user has consented to emergency sharing
      const consents = await storage.getMedicalSharingConsentsByPetId(emergencyRequest.petId);
      const emergencyConsent = consents.find(c => c.consentType === 'emergency_broadcast' && c.enabled);
      
      if (emergencyConsent) {
        // Fetch medical records
        const records = await storage.getMedicalRecordsByPetId(emergencyRequest.petId);
        if (records && records.length > 0) {
          const isZh = (user?.languagePreference === 'zh-HK');
          
          // Build a summary of medical records
          const recordTypes = records.map(r => {
            const typeLabels: Record<string, { en: string; zh: string }> = {
              'blood_test': { en: 'Blood Test', zh: '血液檢查' },
              'xray': { en: 'X-Ray', zh: 'X光' },
              'vaccination': { en: 'Vaccination', zh: '疫苗記錄' },
              'surgery_report': { en: 'Surgery Report', zh: '手術報告' },
              'prescription': { en: 'Prescription', zh: '處方' },
              'other': { en: 'Document', zh: '文件' },
            };
            const label = typeLabels[r.documentType] || typeLabels['other'];
            return isZh ? label.zh : label.en;
          });
          
          const uniqueTypes = Array.from(new Set(recordTypes));
          medicalRecordsSummary = isZh 
            ? `\n📋 醫療記錄: ${uniqueTypes.join(', ')} (${records.length}份)`
            : `\n📋 Medical Records: ${uniqueTypes.join(', ')} (${records.length} file${records.length > 1 ? 's' : ''})`;
        }
      }
    }

    // Determine language (user preference > parameter > default)
    const userLanguage = user?.languagePreference || language || 'en';
    const isZhHk = userLanguage === 'zh-HK';
    const langSuffix = isZhHk ? '_zh_hk' : '_en';

    // Determine which template to use
    let templateName: string;
    let variables: string[] = [];
    let fallbackText = '';

    // Check if pet has visit history (registered pet with medical history)
    if (pet && pet.lastVisitHospitalId) {
      templateName = `emergency_pet_alert_full${langSuffix}`;
      
      // Fetch last visited hospital name
      const lastHospital = await storage.getHospital(pet.lastVisitHospitalId);
      const lastHospitalName = lastHospital ? (isZhHk && lastHospital.nameZh ? lastHospital.nameZh : lastHospital.nameEn) : (isZhHk ? '不詳' : 'Unknown');
      
      // Build 11 variables for full template
      variables = [
        lastHospitalName, // {{1}} Last visited hospital
        pet.name || (isZhHk ? '未命名' : 'Unnamed'), // {{2}} Pet name
        emergencyRequest.petSpecies || (isZhHk ? '不詳' : 'Unknown'), // {{3}} Species
        emergencyRequest.petBreed || (isZhHk ? '不詳' : 'Unknown'), // {{4}} Breed
        emergencyRequest.petAge ? `${emergencyRequest.petAge} ${isZhHk ? '歲' : 'years'}` : (isZhHk ? '不詳' : 'Unknown'), // {{5}} Age
        pet.weight ? `${pet.weight}${isZhHk ? '公斤' : 'kg'}` : (isZhHk ? '不詳' : 'Unknown'), // {{6}} Weight
        emergencyRequest.symptom || (isZhHk ? '緊急情況' : 'Emergency situation'), // {{7}} Critical symptom
        pet.medicalNotes || (isZhHk ? '無' : 'None'), // {{8}} Medical notes
        emergencyRequest.manualLocation || (isZhHk ? '不詳' : 'Unknown'), // {{9}} Location
        emergencyRequest.contactName || (isZhHk ? '寵物主人' : 'Pet Owner'), // {{10}} Owner name
        emergencyRequest.contactPhone || (isZhHk ? '不詳' : 'Unknown'), // {{11}} Owner phone
      ];
      
      fallbackText = `🚨 ${isZhHk ? '緊急寵物求助' : 'EMERGENCY PET ALERT'}\n\n` +
        `${isZhHk ? '已登記寵物（有醫療記錄）' : 'REGISTERED PET WITH MEDICAL HISTORY'}\n` +
        `${isZhHk ? '名稱' : 'Name'}: ${variables[1]}\n` +
        `${isZhHk ? '物種' : 'Species'}: ${variables[2]}\n` +
        `${isZhHk ? '緊急症狀' : 'Emergency'}: ${variables[6]}\n` +
        `${isZhHk ? '聯絡' : 'Contact'}: ${variables[9]} (${variables[10]})` +
        medicalRecordsSummary;
      
    } else if (pet) {
      // New registered pet (no visit history)
      templateName = `emergency_pet_alert_new${langSuffix}`;
      
      // Build 10 variables for new template
      variables = [
        pet.name || (isZhHk ? '未命名' : 'Unnamed'), // {{1}} Pet name
        emergencyRequest.petSpecies || (isZhHk ? '不詳' : 'Unknown'), // {{2}} Species
        emergencyRequest.petBreed || (isZhHk ? '不詳' : 'Unknown'), // {{3}} Breed
        emergencyRequest.petAge ? `${emergencyRequest.petAge} ${isZhHk ? '歲' : 'years'}` : (isZhHk ? '不詳' : 'Unknown'), // {{4}} Age
        pet.weight ? `${pet.weight}${isZhHk ? '公斤' : 'kg'}` : (isZhHk ? '不詳' : 'Unknown'), // {{5}} Weight
        emergencyRequest.symptom || (isZhHk ? '緊急情況' : 'Emergency situation'), // {{6}} Critical symptom
        pet.medicalNotes || (isZhHk ? '無' : 'None'), // {{7}} Medical notes
        emergencyRequest.manualLocation || (isZhHk ? '不詳' : 'Unknown'), // {{8}} Location
        emergencyRequest.contactName || (isZhHk ? '寵物主人' : 'Pet Owner'), // {{9}} Owner name
        emergencyRequest.contactPhone || (isZhHk ? '不詳' : 'Unknown'), // {{10}} Owner phone
      ];
      
      fallbackText = `🚨 ${isZhHk ? '緊急寵物求助' : 'EMERGENCY PET ALERT'}\n\n` +
        `${isZhHk ? '名稱' : 'Name'}: ${variables[0]}\n` +
        `${isZhHk ? '物種' : 'Species'}: ${variables[1]}\n` +
        `${isZhHk ? '緊急症狀' : 'Emergency'}: ${variables[5]}\n` +
        `${isZhHk ? '聯絡' : 'Contact'}: ${variables[8]} (${variables[9]})` +
        medicalRecordsSummary;
      
    } else {
      // Anonymous user (basic template)
      templateName = `emergency_pet_alert_basic${langSuffix}`;
      
      // Build 7 variables for basic template
      variables = [
        emergencyRequest.petSpecies || (isZhHk ? '不詳' : 'Unknown'), // {{1}} Species
        emergencyRequest.petBreed || (isZhHk ? '不詳' : 'Unknown'), // {{2}} Breed
        emergencyRequest.petAge ? `${emergencyRequest.petAge} ${isZhHk ? '歲' : 'years'}` : (isZhHk ? '不詳' : 'Unknown'), // {{3}} Age
        emergencyRequest.symptom || (isZhHk ? '緊急情況' : 'Emergency situation'), // {{4}} Critical symptom
        emergencyRequest.manualLocation || (isZhHk ? '不詳' : 'Unknown'), // {{5}} Location
        emergencyRequest.contactName || (isZhHk ? '寵物主人' : 'Pet Owner'), // {{6}} Owner name
        emergencyRequest.contactPhone || (isZhHk ? '不詳' : 'Unknown'), // {{7}} Owner phone
      ];
      
      fallbackText = `🚨 ${isZhHk ? '緊急寵物求助' : 'EMERGENCY PET ALERT'}\n\n` +
        `${isZhHk ? '物種' : 'Species'}: ${variables[0]}\n` +
        `${isZhHk ? '緊急症狀' : 'Emergency'}: ${variables[3]}\n` +
        `${isZhHk ? '聯絡' : 'Contact'}: ${variables[5]} (${variables[6]})`;
    }

    console.log('[Template Builder] Selected template:', templateName);
    console.log('[Template Builder] Variables count:', variables.length);
    
    return { templateName, variables, fallbackText };
  }

  /**
   * Broadcast emergency to multiple hospitals
   */
  async broadcastEmergency(
    emergencyRequestId: string,
    hospitalIds: string[],
    message: string
  ): Promise<Message[]> {
    const messages: Message[] = [];

    // Build template message once for all hospitals
    const templateData = await this.buildTemplateMessage(emergencyRequestId);
    if (!templateData) {
      console.error('[Broadcast] Failed to build template message');
      throw new Error('Failed to build emergency message template');
    }

    const { templateName, variables, fallbackText } = templateData;

    for (const hospitalId of hospitalIds) {
      const hospital = await storage.getHospital(hospitalId);
      if (!hospital) {
        console.warn(`Hospital not found: ${hospitalId}`);
        continue;
      }

      // Determine message type and recipient based on available contact methods
      // Priority: WhatsApp > Email (hospitals don't have LINE integration)
      let messageType: 'whatsapp' | 'email' | 'line';
      let recipient: string;
      let contentToStore: string;

      if (hospital.whatsapp) {
        messageType = 'whatsapp';
        recipient = hospital.whatsapp;
        contentToStore = `[Template: ${templateName}] ${fallbackText}`;
      } else if (hospital.email) {
        messageType = 'email';
        recipient = hospital.email;
        contentToStore = fallbackText; // Email uses fallback text
      } else {
        console.warn(`No valid contact method (WhatsApp or Email) for hospital ${hospitalId}`);
        
        // Create failed message record for tracking
        await storage.createMessage({
          emergencyRequestId,
          hospitalId,
          recipient: hospital.phone || 'unknown',
          messageType: 'whatsapp',
          content: fallbackText,
          status: 'failed',
          errorMessage: 'No valid WhatsApp or Email contact available',
          failedAt: new Date(),
        });
        
        continue;
      }

      // Create message record with template info embedded in content
      const msg = await storage.createMessage({
        emergencyRequestId,
        hospitalId,
        recipient,
        messageType,
        content: contentToStore,
        status: 'queued',
      });

      // Try to send immediately
      await this.processMessage(msg.id);
      
      // Reload message to get updated status
      const updatedMsg = await storage.getMessage(msg.id);
      if (updatedMsg) {
        messages.push(updatedMsg);
      }
    }

    return messages;
  }
}

export const messagingService = new MessagingService();

// Start background queue processor
setInterval(() => {
  messagingService.processQueue().catch(console.error);
}, 30000); // Process queue every 30 seconds
