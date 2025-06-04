const ratingHandler = require('../views/ratingView'); // pastikan file ini ada

exports.plugin = {
  name: 'rating-routes',
  register: async (server) => {
    server.route([
      {
        method: 'POST',
        path: '/ratings',
        handler: ratingHandler.submitRatings,
      },
    ]);
  },
};
