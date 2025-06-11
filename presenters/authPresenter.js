const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
const { generateToken, verifyToken } = require("../services/jwtService");
const AuthView = require("../views/authView");

const AuthPresenter = {
  async register(request, h) {
    try {
      const { email, password, username } = request.payload;

      // Validasi input
      if (!email || !password || !username) {
        return h
          .response(AuthView.error("Email, password, dan username wajib diisi"))
          .code(400);
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return h
          .response(AuthView.error("Format email tidak valid"))
          .code(400);
      }

      // Validasi panjang password
      if (password.length < 6) {
        return h
          .response(AuthView.error("Password minimal 6 karakter"))
          .code(400);
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return h.response(AuthView.error("Email sudah digunakan")).code(400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await UserModel.createUser({
        email,
        password: hashedPassword,
        username,
      });

      return h
        .response(AuthView.success("Registrasi berhasil", { userId }))
        .code(201);
    } catch (error) {
      console.error("Register error:", error);
      return h
        .response(AuthView.error("Terjadi kesalahan server"))
        .code(500);
    }
  },

  async login(request, h) {
    try {
      const { email, password } = request.payload || {};
      
      if (!email || !password) {
        return h
          .response(AuthView.error("Email dan password wajib diisi"))
          .code(400);
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return h.response(AuthView.error("Email tidak ditemukan")).code(404);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Password match result:", isMatch);

      if (!isMatch) {
        return h.response(AuthView.error("Password salah")).code(401);
      }

      const token = generateToken({ 
        id: user.id, 
        email: user.email 
      });
      
      console.log('Login successful, token generated:', token.substring(0, 50) + '...');
      
      // Return token di root level untuk kemudahan
      return h.response({
        status: "success",
        message: "Login berhasil",
        token: token,  // Token di root level
        data: {
          token: token,  // Token juga di data (backward compatibility)
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          }
        }
      }).code(200);
    } catch (err) {
      console.error("Login error:", err);
      return h.response(AuthView.error("Terjadi kesalahan server")).code(500);
    }
  },

  async getCurrentUser(request, h) {
    console.log('All headers:', request.headers);
    
    const authHeader = request.headers.authorization;
    console.log('Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log('No authorization header found');
      return h.response({ message: 'No authorization header' }).code(401);
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization format');
      return h.response({ message: 'Invalid authorization format' }).code(401);
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token);
    
    if (!token || token === 'undefined') {
      console.log('Token is undefined or empty');
      return h.response({ message: 'Token is undefined' }).code(401);
    }

    try {
      const decoded = verifyToken(token);
      console.log('Token decoded successfully:', decoded);
      
      const user = await UserModel.findById(decoded.id);
      
      if (!user) {
        return h.response({ message: 'User not found' }).code(404);
      }

      return h.response({ 
        id: user.id, 
        email: user.email, 
        username: user.username 
      }).code(200);
    } catch (error) {
      console.error('Token verification error:', error);
      return h.response({ message: 'Invalid token' }).code(403);
    }
  },

  // Method logout yang hilang
  async logout(request, h) {
    try {
      // Untuk JWT stateless, logout biasanya dilakukan di client side
      // dengan menghapus token dari storage
      // Di server side, kita bisa log aktivitas logout
      
      const authHeader = request.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        try {
          const decoded = verifyToken(token);
          console.log('User logged out:', decoded.email);
          
          // Optional: Bisa menambahkan blacklist token jika diperlukan
          // await TokenBlacklistModel.addToBlacklist(token);
          
        } catch (error) {
          console.log('Invalid token during logout:', error.message);
        }
      }

      return h
        .response(AuthView.success("Logout berhasil"))
        .code(200);
        
    } catch (error) {
      console.error("Logout error:", error);
      return h
        .response(AuthView.error("Terjadi kesalahan server"))
        .code(500);
    }
  },

  // Method tambahan untuk check auth status
  async checkAuthStatus(request, h) {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
          isAuthenticated: false,
          message: 'No valid token found'
        }).code(200);
      }

      const token = authHeader.split(' ')[1];
      
      if (!token || token === 'undefined') {
        return h.response({
          isAuthenticated: false,
          message: 'Invalid token'
        }).code(200);
      }

      try {
        const decoded = verifyToken(token);
        const user = await UserModel.findById(decoded.id);
        
        if (!user) {
          return h.response({
            isAuthenticated: false,
            message: 'User not found'
          }).code(200);
        }

        return h.response({
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username
          }
        }).code(200);
        
      } catch (error) {
        return h.response({
          isAuthenticated: false,
          message: 'Invalid or expired token'
        }).code(200);
      }
      
    } catch (error) {
      console.error("Check auth status error:", error);
      return h.response({
        isAuthenticated: false,
        message: 'Server error'
      }).code(500);
    }
  }
};

module.exports = AuthPresenter;