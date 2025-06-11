// routes/resetPasswordRoutes.js
const ResetPasswordPresenter = require('../presenters/resetPasswordPresenter');

exports.plugin = {
  name: 'reset-password-routes',
  version: '1.0.0',
  register: async function (server, options) {
    server.route([
      {
        method: 'POST',
        path: '/api/forgot-password',
        handler: ResetPasswordPresenter.forgotPassword,
        options: {
          auth: false, // Tidak perlu autentikasi
        }
      },
      {
        method: 'POST',
        path: '/api/verify-otp',
        handler: ResetPasswordPresenter.verifyOtp,
        options: {
          auth: false, // Tidak perlu autentikasi
        }
      },
      {
        method: 'POST',
        path: '/api/reset-password',
        handler: ResetPasswordPresenter.resetPassword,
        options: {
          auth: false, // Tidak perlu autentikasi
        }
      },
      {
        method: 'POST',
        path: '/api/resend-otp',
        handler: ResetPasswordPresenter.resendOtp,
        options: {
          auth: false, // Tidak perlu autentikasi
        }
      }
    ]);
  }
};