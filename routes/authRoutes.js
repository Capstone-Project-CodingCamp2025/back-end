// routes/authRoutes.js
const AuthPresenter = require('../presenters/authPresenter');

exports.plugin = {
  name: 'auth-routes',
  version: '1.0.0',
  register: async function (server, options) {
    server.route([
      {
        method: 'POST',
        path: '/api/register',
        handler: AuthPresenter.register,
        options: {
          auth: false, // Tidak perlu autentikasi
        }
      },
      {
        method: 'POST',
        path: '/api/login',
        handler: AuthPresenter.login,
        options: {
          auth: false, // Tidak perlu autentikasi
        }
      },
      {
        method: 'GET',
        path: '/api/me',
        handler: AuthPresenter.getCurrentUser,
        options: {
          auth: 'jwt', // Perlu autentikasi
        }
      },
      {
        method: 'GET',
        path: '/api/check-auth',
        handler: AuthPresenter.checkAuthStatus, // Menggunakan method yang lebih spesifik
        options: {
          auth: false, // Tidak perlu auth untuk cek status
        }
      },
      {
        method: 'POST',
        path: '/api/logout',
        handler: AuthPresenter.logout, // Handler yang sekarang sudah ada
        options: {
          auth: false, // Tidak wajib auth karena logout bisa dipanggil kapan saja
        }
      }
    ]);
  }
};