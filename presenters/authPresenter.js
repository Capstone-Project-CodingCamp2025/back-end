const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Tambahkan ini
const UserModel = require("../models/userModel");
const { generateToken, verifyToken } = require("../services/jwtService");
const AuthView = require("../views/authView");

const AuthPresenter = {
  async register(request, h) {
    const { email, password, username } = request.payload;

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
    console.log('All headers:', request.headers); // Debug semua headers
    
    const authHeader = request.headers.authorization;
    console.log('Authorization header:', authHeader); // Debug header
    
    if (!authHeader) {
      console.log('No authorization header found');
      return h.response({ message: 'No authorization header' }).code(401);
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization format');
      return h.response({ message: 'Invalid authorization format' }).code(401);
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token); // Debug token yang diekstrak
    
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
  }

};

module.exports = AuthPresenter;
