// presenters/resetPasswordPresenter.js
const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel");
const ResetPasswordModel = require("../models/resetPasswordModel");
const EmailService = require("../services/emailService");
const OtpService = require("../services/otpService");
const AuthView = require("../views/authView");

const ResetPasswordPresenter = {
  // Endpoint untuk mengirim OTP ke email
  async forgotPassword(request, h) {
    try {
      const { email } = request.payload;

      if (!email) {
        return h
          .response(AuthView.error("Email wajib diisi"))
          .code(400);
      }

      // Cek apakah user dengan email tersebut ada
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Untuk keamanan, kita tidak memberitahu bahwa email tidak terdaftar
        return h
          .response(AuthView.success("Jika email terdaftar, kode OTP akan dikirim"))
          .code(200);
      }

      // Generate OTP
      const otp = OtpService.generateOtp();
      const expiresAt = OtpService.generateExpiryTime();

      // Simpan OTP ke database
      await ResetPasswordModel.createOtpReset({
        email,
        otp,
        expiresAt,
      });

      // Kirim OTP ke email
      await EmailService.sendOtpEmail(email, otp);

      return h
        .response(AuthView.success("Kode OTP telah dikirim ke email Anda"))
        .code(200);

    } catch (error) {
      console.error("Forgot password error:", error);
      return h
        .response(AuthView.error("Terjadi kesalahan server"))
        .code(500);
    }
  },

  // Endpoint untuk verifikasi OTP
  async verifyOtp(request, h) {
    try {
      const { email, otp } = request.payload;

      if (!email || !otp) {
        return h
          .response(AuthView.error("Email dan OTP wajib diisi"))
          .code(400);
      }

      if (!OtpService.isValidOtpFormat(otp)) {
        return h
          .response(AuthView.error("Format OTP tidak valid"))
          .code(400);
      }

      // Verifikasi OTP
      const otpRecord = await ResetPasswordModel.verifyOtp({ email, otp });
      
      if (!otpRecord) {
        return h
          .response(AuthView.error("OTP tidak valid atau sudah expired"))
          .code(400);
      }

      return h
        .response(AuthView.success("OTP berhasil diverifikasi"))
        .code(200);

    } catch (error) {
      console.error("Verify OTP error:", error);
      return h
        .response(AuthView.error("Terjadi kesalahan server"))
        .code(500);
    }
  },

  // Endpoint untuk reset password
  async resetPassword(request, h) {
    try {
      const { email, newPassword, otp } = request.payload;

      if (!email || !newPassword || !otp) {
        return h
          .response(AuthView.error("Email, password baru, dan OTP wajib diisi"))
          .code(400);
      }

      if (newPassword.length < 6) {
        return h
          .response(AuthView.error("Password minimal 6 karakter"))
          .code(400);
      }

      if (!OtpService.isValidOtpFormat(otp)) {
        return h
          .response(AuthView.error("Format OTP tidak valid"))
          .code(400);
      }

      // Verifikasi OTP sekali lagi
      const otpRecord = await ResetPasswordModel.verifyOtp({ email, otp });
      
      if (!otpRecord) {
        return h
          .response(AuthView.error("OTP tidak valid atau sudah expired"))
          .code(400);
      }

      // Cek apakah user masih ada
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return h
          .response(AuthView.error("User tidak ditemukan"))
          .code(404);
      }

      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const success = await ResetPasswordModel.updateUserPassword({
        email,
        hashedPassword,
      });

      if (!success) {
        return h
          .response(AuthView.error("Gagal mengupdate password"))
          .code(500);
      }

      // Tandai OTP sebagai sudah digunakan
      await ResetPasswordModel.markOtpAsUsed({ email, otp });

      return h
        .response(AuthView.success("Password berhasil direset"))
        .code(200);

    } catch (error) {
      console.error("Reset password error:", error);
      return h
        .response(AuthView.error("Terjadi kesalahan server"))
        .code(500);
    }
  },

  // Endpoint untuk kirim ulang OTP
  async resendOtp(request, h) {
    try {
      const { email } = request.payload;

      if (!email) {
        return h
          .response(AuthView.error("Email wajib diisi"))
          .code(400);
      }

      // Cek apakah user dengan email tersebut ada
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return h
          .response(AuthView.success("Jika email terdaftar, kode OTP akan dikirim"))
          .code(200);
      }

      // Generate OTP baru
      const otp = OtpService.generateOtp();
      const expiresAt = OtpService.generateExpiryTime();

      // Simpan OTP baru ke database (otomatis menghapus yang lama)
      await ResetPasswordModel.createOtpReset({
        email,
        otp,
        expiresAt,
      });

      // Kirim OTP ke email
      await EmailService.sendOtpEmail(email, otp);

      return h
        .response(AuthView.success("Kode OTP baru telah dikirim"))
        .code(200);

    } catch (error) {
      console.error("Resend OTP error:", error);
      return h
        .response(AuthView.error("Terjadi kesalahan server"))
        .code(500);
    }
  },
};

module.exports = ResetPasswordPresenter;