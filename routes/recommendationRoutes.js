const RekomPresenter = require('../presenters/recommendationPresenter');

module.exports = {
  name: 'recommendation-routes',
  register: async (server) => {
    server.route([
      {
        method: 'GET',
        path: '/rekomendasi/cbf',
        handler: RekomPresenter.contentBased,
        options: { auth: 'jwt' },
      },
      {
        method: 'GET',
        path: '/rekomendasi/cf',
        handler: RekomPresenter.collaborative,
        options: { auth: 'jwt' },
      },
      {
        method: 'GET',
        path: '/recommendations/popular',
        handler: RekomPresenter.getPopularDestinations,
        options: {
          auth: false // Tidak perlu login
        },
      },
    ]);
  },
};
