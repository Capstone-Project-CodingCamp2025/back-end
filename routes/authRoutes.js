const AuthPresenter = require('../presenters/authPresenter');

const authRoutes = [
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
];

module.exports = authRoutes;
