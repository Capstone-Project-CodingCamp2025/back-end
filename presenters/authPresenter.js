const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwtService = require('../services/jwtService');
const AuthView = require('../views/authView');

module.exports = {
  register: async (req, h) => {
    const { email, password } = req.payload;
    const hashed = await bcrypt.hash(password, 10);
    await UserModel.create({ email, password: hashed });
    return AuthView.success('User registered');
  },

  login: async (req, h) => {
    const { email, password } = req.payload;
    const user = await UserModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return AuthView.fail('Invalid credentials');
    }

    const token = jwtService.generateToken({ id: user.id, email: user.email });
    return AuthView.success('Login successful', { token });
  },

  logout: async (req, h) => {
    // optional: handle blacklist, etc.
    return AuthView.success('Logout success');
  },
};
