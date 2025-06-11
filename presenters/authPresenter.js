// presenters/authPresenter.js - Fixed with proper login/register separation

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const GoogleAuthService = require('../services/googleAuthService');

const AuthPresenter = {
  register: async (request, h) => {
    try {
      const { email, password, username, googleToken } = request.payload;

      // Handle Google Sign-Up
      if (googleToken) {
        return await AuthPresenter.handleGoogleTokenRegister(googleToken, h);
      }

      // Regular email/password registration
      if (!email || !password || !username) {
        return h.response({
          status: 'fail',
          message: 'Semua field harus diisi'
        }).code(400);
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return h.response({
          status: 'fail',
          message: 'Email sudah terdaftar'
        }).code(400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        username,
        created_at: new Date(),
        updated_at: new Date()
      };

      const userId = await UserModel.create(userData);

      return h.response({
        status: 'success',
        message: 'User berhasil didaftarkan',
        data: {
          userId,
          email,
          username
        }
      }).code(201);
    } catch (error) {
      console.error('Register error:', error);
      return h.response({
        status: 'error',
        message: 'Internal server error'
      }).code(500);
    }
  },

  login: async (request, h) => {
    try {
      const { email, password, googleToken } = request.payload;

      // Handle Google Sign-In
      if (googleToken) {
        return await AuthPresenter.handleGoogleTokenLogin(googleToken, h);
      }

      // Regular email/password login
      if (!email || !password) {
        return h.response({
          status: 'fail',
          message: 'Email dan password harus diisi'
        }).code(400);
      }

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return h.response({
          status: 'fail',
          message: 'Email atau password salah'
        }).code(401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return h.response({
          status: 'fail',
          message: 'Email atau password salah'
        }).code(401);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = h.response({
        status: 'success',
        message: 'Login berhasil',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          },
          token
        }
      }).code(200);

      // Set secure cookie
      response.state('token', token, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        isSecure: process.env.NODE_ENV === 'production',
        isHttpOnly: true,
        isSameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        clearInvalid: true,
        strictHeader: false
      });

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return h.response({
        status: 'error',
        message: 'Internal server error'
      }).code(500);
    }
  },

  // FIXED: Google Login - Only for existing users
  handleGoogleTokenLogin: async (googleToken, h) => {
    try {
      // Verify Google ID token
      const googleUser = await GoogleAuthService.verifyIdToken(googleToken);
      
      if (!googleUser) {
        return h.response({
          status: 'fail',
          message: 'Token Google tidak valid'
        }).code(400);
      }

      // FIXED: Only find existing user, don't create new one
      const user = await UserModel.findByEmail(googleUser.email);
      
      if (!user) {
        return h.response({
          status: 'fail',
          message: 'Akun dengan email ini belum terdaftar. Silakan daftar terlebih dahulu.'
        }).code(404);
      }

      // Update existing user with Google info if needed
      if (!user.google_id) {
        await UserModel.updateGoogleInfo(user.id, {
          google_id: googleUser.googleId,
          profile_picture: googleUser.picture
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = h.response({
        status: 'success',
        message: 'Login dengan Google berhasil',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture
          },
          token
        }
      }).code(200);

      // Set secure cookie
      response.state('token', token, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        isSecure: process.env.NODE_ENV === 'production',
        isHttpOnly: true,
        isSameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        clearInvalid: true,
        strictHeader: false
      });

      return response;
    } catch (error) {
      console.error('Google token login error:', error);
      return h.response({
        status: 'fail',
        message: error.message || 'Gagal login dengan Google'
      }).code(400);
    }
  },

  // NEW: Google Register - Only for new users
  handleGoogleTokenRegister: async (googleToken, h) => {
    try {
      // Verify Google ID token
      const googleUser = await GoogleAuthService.verifyIdToken(googleToken);
      
      if (!googleUser) {
        return h.response({
          status: 'fail',
          message: 'Token Google tidak valid'
        }).code(400);
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(googleUser.email);
      if (existingUser) {
        return h.response({
          status: 'fail',
          message: 'Email sudah terdaftar. Silakan login.'
        }).code(400);
      }

      // Create new user with Google info
      const userData = {
        email: googleUser.email,
        password: null, // No password for Google users
        username: googleUser.name,
        google_id: googleUser.googleId,
        profile_picture: googleUser.picture,
        created_at: new Date(),
        updated_at: new Date()
      };

      const userId = await UserModel.create(userData);

      return h.response({
        status: 'success',
        message: 'Registrasi dengan Google berhasil',
        data: {
          userId,
          email: googleUser.email,
          username: googleUser.name
        }
      }).code(201);
    } catch (error) {
      console.error('Google token register error:', error);
      return h.response({
        status: 'fail',
        message: error.message || 'Gagal registrasi dengan Google'
      }).code(400);
    }
  },

  // Google OAuth redirect login
  googleLogin: async (request, h) => {
    try {
      const authUrl = GoogleAuthService.generateAuthUrl();
      return h.redirect(authUrl);
    } catch (error) {
      console.error('Google login error:', error);
      return h.response({
        status: 'error',
        message: 'Gagal mengarahkan ke Google OAuth'
      }).code(500);
    }
  },

  // Google OAuth callback
  googleCallback: async (request, h) => {
    try {
      const { code, error, action = 'login' } = request.query;

      if (error) {
        return h.redirect(`${process.env.FRONTEND_URL}/${action}?error=google_auth_failed`);
      }

      if (!code) {
        return h.redirect(`${process.env.FRONTEND_URL}/${action}?error=no_auth_code`);
      }

      // Verify Google code and get user info
      const googleUser = await GoogleAuthService.verifyGoogleToken(code);
      
      if (action === 'register') {
        // Handle registration
        const existingUser = await UserModel.findByEmail(googleUser.email);
        if (existingUser) {
          return h.redirect(`${process.env.FRONTEND_URL}/register?error=email_exists`);
        }

        // Create new user
        const userData = {
          email: googleUser.email,
          password: null,
          username: googleUser.name,
          google_id: googleUser.googleId,
          profile_picture: googleUser.picture,
          created_at: new Date(),
          updated_at: new Date()
        };

        await UserModel.create(userData);
        return h.redirect(`${process.env.FRONTEND_URL}/login?success=registration_complete`);
      } else {
        // Handle login
        const user = await UserModel.findByEmail(googleUser.email);
        if (!user) {
          return h.redirect(`${process.env.FRONTEND_URL}/login?error=account_not_found`);
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email,
            username: user.username
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}&success=true`;
        return h.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Google callback error:', error);
      const action = request.query.action || 'login';
      return h.redirect(`${process.env.FRONTEND_URL}/${action}?error=callback_failed`);
    }
  },

  // Direct Google token login endpoint
  googleTokenLogin: async (request, h) => {
    try {
      const { idToken } = request.payload;
      
      if (!idToken) {
        return h.response({
          status: 'fail',
          message: 'Token Google diperlukan'
        }).code(400);
      }

      return await AuthPresenter.handleGoogleTokenLogin(idToken, h);
    } catch (error) {
      console.error('Google token login error:', error);
      return h.response({
        status: 'error',
        message: 'Internal server error'
      }).code(500);
    }
  },

  // NEW: Direct Google token register endpoint
  googleTokenRegister: async (request, h) => {
    try {
      const { idToken } = request.payload;
      
      if (!idToken) {
        return h.response({
          status: 'fail',
          message: 'Token Google diperlukan'
        }).code(400);
      }

      return await AuthPresenter.handleGoogleTokenRegister(idToken, h);
    } catch (error) {
      console.error('Google token register error:', error);
      return h.response({
        status: 'error',
        message: 'Internal server error'
      }).code(500);
    }
  },

  getCurrentUser: async (request, h) => {
    try {
      const userId = request.auth.credentials.userId;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return h.response({
          status: 'fail',
          message: 'User tidak ditemukan'
        }).code(404);
      }

      return h.response({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture
          }
        }
      }).code(200);
    } catch (error) {
      console.error('Get current user error:', error);
      return h.response({
        status: 'error',
        message: 'Internal server error'
      }).code(500);
    }
  },

  checkAuthStatus: async (request, h) => {
    try {
      const token = request.state.token || request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return h.response({
          status: 'fail',
          message: 'Token tidak ditemukan',
          isAuthenticated: false
        }).code(401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.userId);
      
      if (!user) {
        return h.response({
          status: 'fail',
          message: 'User tidak ditemukan',
          isAuthenticated: false
        }).code(401);
      }

      return h.response({
        status: 'success',
        isAuthenticated: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            profile_picture: user.profile_picture
          }
        }
      }).code(200);
    } catch (error) {
      return h.response({
        status: 'fail',
        message: 'Token tidak valid',
        isAuthenticated: false
      }).code(401);
    }
  },

  logout: async (request, h) => {
    try {
      const response = h.response({
        status: 'success',
        message: 'Logout berhasil'
      }).code(200);

      // Clear cookie
      response.unstate('token');
      
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      return h.response({
        status: 'error',
        message: 'Internal server error'
      }).code(500);
    }
  }
};

module.exports = AuthPresenter;