// models/resetPasswordModel.js
const db = require("../config/db");

const ResetPasswordModel = {
  // Simpan OTP untuk reset password
  async createOtpReset({ email, otp, expiresAt }) {
    try {
      // Hapus OTP lama untuk email yang sama
      await db.query("DELETE FROM password_reset_tokens WHERE email = ?", [email]);
      
      // Insert OTP baru
      const [result] = await db.query(
        "INSERT INTO password_reset_tokens (email, otp, expires_at, created_at) VALUES (?, ?, ?, NOW())",
        [email, otp, expiresAt]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating OTP reset:', error);
      throw error;
    }
  },

  // Verifikasi OTP
  async verifyOtp({ email, otp }) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM password_reset_tokens WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = FALSE",
        [email, otp]
      );
      return rows[0];
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  },

  // Tandai OTP sebagai sudah digunakan
  async markOtpAsUsed({ email, otp }) {
    try {
      await db.query(
        "UPDATE password_reset_tokens SET used = TRUE WHERE email = ? AND otp = ?",
        [email, otp]
      );
    } catch (error) {
      console.error('Error marking OTP as used:', error);
      throw error;
    }
  },

  // Hapus semua OTP yang sudah expired
  async cleanupExpiredOtps() {
    try {
      await db.query("DELETE FROM password_reset_tokens WHERE expires_at < NOW()");
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      throw error;
    }
  },

  // Update password user
  async updateUserPassword({ email, hashedPassword }) {
    try {
      const [result] = await db.query(
        "UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?",
        [hashedPassword, email]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }
};

module.exports = ResetPasswordModel;