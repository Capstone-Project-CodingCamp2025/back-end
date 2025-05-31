const ratingHandler = require('../views/ratingView'); // pastikan file ini ada

module.exports = {
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
