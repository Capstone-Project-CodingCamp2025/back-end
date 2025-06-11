// routes/authRoutes.js - Fixed with complete Google OAuth routes
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
          auth: false,
        }
      },
      {
        method: 'POST',
        path: '/api/login',
        handler: AuthPresenter.login,
        options: {
          auth: false,
        }
      },
      // Google OAuth routes
      {
        method: 'GET',
        path: '/api/auth/google',
        handler: AuthPresenter.googleLogin,
        options: {
          auth: false,
        }
      },
      {
        method: 'GET',
        path: '/api/auth/google/callback',
        handler: AuthPresenter.googleCallback,
        options: {
          auth: false,
        }
      },
      {
        method: 'POST',
        path: '/api/auth/google/token',
        handler: AuthPresenter.googleTokenLogin,
        options: {
          auth: false,
        }
      },
      // TAMBAHAN: Route yang hilang untuk Google Register
      {
        method: 'POST',
        path: '/api/auth/google/register',
        handler: AuthPresenter.googleTokenRegister,
        options: {
          auth: false,
        }
      },
      {
        method: 'GET',
        path: '/api/me',
        handler: AuthPresenter.getCurrentUser,
        options: {
          auth: 'jwt',
        }
      },
      {
        method: 'GET',
        path: '/api/check-auth',
        handler: AuthPresenter.checkAuthStatus,
        options: {
          auth: false,
        }
      },
      {
        method: 'POST',
        path: '/api/logout',
        handler: AuthPresenter.logout,
        options: {
          auth: false,
        }
      }
    ]);
  }
};