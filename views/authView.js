const AuthPresenter = require('../presenters/authPresenter');

module.exports = {
  register: async (request, h) => {
    try {
      const result = await AuthPresenter.register(request.payload);
      return h.response({ message: 'User registered', data: result }).code(201);
    } catch (err) {
      return h.response({ message: 'Failed to register', error: err.message }).code(500);
    }
  },

  login: async (request, h) => {
    try {
      const result = await AuthPresenter.login(request.payload);
      return h.response({ token: result.token }).code(200);
    } catch (err) {
      return h.response({ message: 'Login failed', error: err.message }).code(401);
    }
  },

  logout: async (request, h) => {
    return h.response({ message: 'Logout success' }).code(200);
  },
};
