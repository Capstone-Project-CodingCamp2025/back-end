const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel");
const { generateToken } = require("../services/jwtService");
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
      username, // tambahkan username di sini
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
      console.log("Login input:", email, password);
      console.log("User found:", user);
      console.log("Stored hash:", user.password);
      console.log("Password match result:", isMatch);

      if (!isMatch) {
        return h.response(AuthView.error("Password salah")).code(401);
      }

      const token = generateToken({ id: user.id, email: user.email });
      return h
        .response(AuthView.success("Login berhasil", { token }))
        .code(200);
    } catch (err) {
      console.error("Login error:", err);
      return h.response(AuthView.error("Terjadi kesalahan server")).code(500);
    }
  },
};

module.exports = AuthPresenter;