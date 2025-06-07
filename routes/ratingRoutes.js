const ratingView = require('../views/ratingView');

exports.plugin = {
  name: 'rating-routes',
  register: async (server) => {
    server.route({
      method: 'POST', path: '/api/ratings', handler: ratingView.submitRatings, options: { auth: 'jwt' }
    });
  }
};