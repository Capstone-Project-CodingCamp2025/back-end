// services/otpService.js
const crypto = require('crypto');

const OtpService = {
  /**
   * Generate 6-digit OTP menggunakan crypto.randomInt untuk keamanan yang lebih baik
   */
  generateOtp() {
    // Generate random 6-digit number (100000 - 999999)
    return crypto.randomInt(100000, 999999).toString();
  },

  /**
   * Generate expiry time (default: 10 minutes from now)
   * @param {number} minutesFromNow - Minutes from current time (default: 10)
   */
  generateExpiryTime(minutesFromNow = 10) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesFromNow);
    return now;
  },

  /**
   * Validate OTP format - must be exactly 6 digits
   * @param {string} otp - OTP to validate
   */
  isValidOtpFormat(otp) {
    // Check if OTP is exactly 6 digits
    return /^\d{6}$/.test(otp);
  },

  /**
   * Check if OTP is expired
   * @param {Date} expiryTime - Expiry time from database
   */
  isOtpExpired(expiryTime) {
    const now = new Date();
    return now > new Date(expiryTime);
  },

  /**
   * Generate secure random string for additional security
   * @param {number} length - Length of random string
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Hash OTP for additional security (optional - jika ingin menyimpan OTP dalam bentuk hash)
   * @param {string} otp - OTP to hash
   */
  hashOtp(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
  },

  /**
   * Verify hashed OTP
   * @param {string} otp - Plain OTP
   * @param {string} hashedOtp - Hashed OTP from database
   */
  verifyHashedOtp(otp, hashedOtp) {
    const otpHash = this.hashOtp(otp);
    return otpHash === hashedOtp;
  },

  /**
   * Generate OTP with custom length
   * @param {number} length - Length of OTP (default: 6)
   */
  generateCustomOtp(length = 6) {
    if (length < 4 || length > 10) {
      throw new Error('OTP length must be between 4 and 10 digits');
    }
    
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    
    return crypto.randomInt(min, max + 1).toString();
  },

  /**
   * Generate alphanumeric OTP (mix of letters and numbers)
   * @param {number} length - Length of OTP (default: 6)
   */
  generateAlphanumericOtp(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      result += chars[randomIndex];
    }
    
    return result;
  },

  /**
   * Get remaining time until OTP expires
   * @param {Date} expiryTime - Expiry time from database
   * @returns {Object} - Object with minutes and seconds remaining
   */
  getRemainingTime(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) {
      return { minutes: 0, seconds: 0, expired: true };
    }
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { minutes, seconds, expired: false };
  },

  /**
   * Format OTP for display (add spaces between digits for readability)
   * @param {string} otp - OTP to format
   */
  formatOtpForDisplay(otp) {
    return otp.split('').join(' ');
  },

  /**
   * Validate OTP strength (untuk custom OTP)
   * @param {string} otp - OTP to validate
   */
  validateOtpStrength(otp) {
    const validations = {
      isValidLength: otp.length >= 6,
      isNumeric: /^\d+$/.test(otp),
      hasNoSequential: !this.hasSequentialDigits(otp),
      hasNoRepeating: !this.hasRepeatingDigits(otp)
    };
    
    const isStrong = Object.values(validations).every(v => v);
    
    return {
      isStrong,
      validations
    };
  },

  /**
   * Check if OTP has sequential digits (123456, 654321)
   * @param {string} otp - OTP to check
   */
  hasSequentialDigits(otp) {
    for (let i = 0; i < otp.length - 2; i++) {
      const current = parseInt(otp[i]);
      const next1 = parseInt(otp[i + 1]);
      const next2 = parseInt(otp[i + 2]);
      
      // Check ascending or descending sequence
      if ((next1 === current + 1 && next2 === current + 2) ||
          (next1 === current - 1 && next2 === current - 2)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Check if OTP has too many repeating digits
   * @param {string} otp - OTP to check
   */
  hasRepeatingDigits(otp) {
    const digitCount = {};
    for (let digit of otp) {
      digitCount[digit] = (digitCount[digit] || 0) + 1;
      // If any digit appears more than half the length, it's too repetitive
      if (digitCount[digit] > Math.floor(otp.length / 2)) {
        return true;
      }
    }
    return false;
  }
};

module.exports = OtpService;