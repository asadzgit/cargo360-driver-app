/**
 * Validates Pakistani phone numbers
 * Valid formats:
 * - Starting with 0: 11 digits total (e.g., 03001234567)
 * - Starting with 92: 12 digits total (e.g., 923001234567)
 * - Starting with +92: 13 digits total (e.g., +923001234567)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePakistaniPhone(phone: string): PhoneValidationResult {
  // Remove any whitespace
  const cleanedPhone = phone.trim();

  // Check if empty
  if (!cleanedPhone) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  // Check format starting with 0 (11 digits)
  if (cleanedPhone.startsWith('0')) {
    if (cleanedPhone.length === 11 && /^0\d{10}$/.test(cleanedPhone)) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: 'Phone number starting with 0 must have exactly 11 digits (e.g., 03001234567)',
      };
    }
  }

  // Check format starting with 92 (12 digits)
  if (cleanedPhone.startsWith('92')) {
    if (cleanedPhone.length === 12 && /^92\d{10}$/.test(cleanedPhone)) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: 'Phone number starting with 92 must have exactly 12 digits (e.g., 923001234567)',
      };
    }
  }

  // Check format starting with +92 (13 digits)
  if (cleanedPhone.startsWith('+92')) {
    if (cleanedPhone.length === 13 && /^\+92\d{10}$/.test(cleanedPhone)) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        error: 'Phone number starting with +92 must have exactly 13 digits (e.g., +923001234567)',
      };
    }
  }

  // If none of the valid formats match
  return {
    isValid: false,
    error: 'Invalid phone number format. Please enter a Pakistani phone number starting with 0, 92, or +92',
  };
}

