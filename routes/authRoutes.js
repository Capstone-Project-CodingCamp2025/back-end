const AuthPresenter = require('../presenters/authPresenter');

exports.plugin = {
  name: 'auth-routes',
  version: '1.0.0',
  register: async function (server, options) {
    server.route([
      {
        method: 'POST',
        path: '/api/register',
        handler: AuthPresenter.register
      },
      {
        method: 'POST',
        path: '/api/login',
        handler: AuthPresenter.login
      }
    ]);
  }
};
