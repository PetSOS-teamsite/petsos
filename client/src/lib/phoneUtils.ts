/**
 * Phone number formatting utilities
 */

/**
 * Format phone number for display
 * Handles Hong Kong and international numbers
 * 
 * Examples:
 * - "65727136" -> "+852 6572 7136"
 * - "85265727136" -> "+852 6572 7136"
 * - "+85265727136" -> "+852 6572 7136"
 * - "+14155551234" -> "+1 415 555 1234"
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (!digits) return phone;
  
  // Hong Kong number with country code (852XXXXXXXX)
  if (digits.startsWith('852') && digits.length === 11) {
    return `+852 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  
  // Hong Kong number without country code (XXXXXXXX)
  if (digits.length === 8 && !digits.startsWith('0')) {
    return `+852 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  
  // China mobile (86XXXXXXXXXXX - 11 digits after country code)
  if (digits.startsWith('86') && digits.length === 13) {
    return `+86 ${digits.slice(2, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
  }
  
  // US/Canada number (1XXXXXXXXXX)
  if (digits.startsWith('1') && digits.length === 11) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  // UK number (44XXXXXXXXXX)
  if (digits.startsWith('44') && digits.length >= 12) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  
  // Generic international format with country code
  if (digits.length > 10) {
    // Extract country code (assume 1-3 digits)
    const countryCode = digits.slice(0, digits.length - 10);
    const localNumber = digits.slice(digits.length - 10);
    return `+${countryCode} ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`;
  }
  
  // Fallback: return with + if it looks international
  if (digits.length >= 10) {
    return `+${digits}`;
  }
  
  // Last resort: return original
  return phone;
}

/**
 * Format phone number for WhatsApp deep link
 * Removes all formatting and ensures proper country code
 * 
 * Example: "+852 6572 7136" -> "85265727136"
 */
export function formatPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // If it's already international format with country code, use as-is
  if (digits.length >= 10) {
    return digits;
  }
  
  // If it's a local HK number (8 digits), add 852
  if (digits.length === 8) {
    return `852${digits}`;
  }
  
  return digits;
}

/**
 * Create WhatsApp click-to-chat link
 * 
 * Example: formatWhatsAppLink("+852 6572 7136", "Hello") 
 *          -> "https://wa.me/85265727136?text=Hello"
 */
export function formatWhatsAppLink(phone: string | null | undefined, message?: string): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  if (!cleanPhone) return '#';
  
  let link = `https://wa.me/${cleanPhone}`;
  
  if (message) {
    link += `?text=${encodeURIComponent(message)}`;
  }
  
  return link;
}

/**
 * Validate if a phone number is valid
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, '');
  
  // Must have at least 8 digits
  return digits.length >= 8;
}
