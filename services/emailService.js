// services/emailService.js
const nodemailer = require('nodemailer');

// Konfigurasi email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const EmailService = {
  async sendOtpEmail(email, otp) {
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"SIRESITA" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Kode Reset Password - SIRESITA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Reset Password - SIRESITA</h2>
            <p>Halo,</p>
            <p>Anda telah meminta untuk reset password akun SIRESITA Anda.</p>
            <p>Gunakan kode OTP berikut untuk memverifikasi identitas Anda:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="font-size: 32px; margin: 0; color: #1f2937; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>Penting:</strong></p>
            <ul>
              <li>Kode ini berlaku selama 10 menit</li>
              <li>Jangan bagikan kode ini kepada siapapun</li>
              <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
            </ul>
            <p>Terima kasih,<br>Tim SIRESITA</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">
              Email ini dikirim secara otomatis, mohon tidak membalas email ini.
            </p>
          </div>
        `,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  },
};

module.exports = EmailService;