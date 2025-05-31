const authHandler = require('../views/authView');

module.exports = {
  name: 'auth-routes',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/register',
        handler: authHandler.register,
      },
      {
        method: 'POST',
        path: '/login',
        handler: authHandler.login,
      },
      {
        method: 'POST',
        path: '/logout',
        handler: authHandler.logout,
      },
    ]);
  },
};
