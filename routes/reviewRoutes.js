const reviewView = require('../views/reviewView');

exports.plugin = {
  name: 'review-routes',
  version: '1.0.0',
  register: async (server) => {
    console.log('Registering review routes...');
    
    // Submit review untuk tempat tertentu
    server.route({
      method: 'POST',
      path: '/api/places/{placeId}/ratings',
      handler: reviewView.submitReview,
      options: { 
        auth: 'jwt',
        description: 'Submit review untuk tempat tertentu',
        tags: ['api', 'reviews'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    // Get reviews untuk tempat tertentu
    server.route({
      method: 'GET',
      path: '/api/places/{placeId}/reviews',
      handler: reviewView.getReviewsByPlace,
      options: {
        auth: false,
        description: 'Get semua reviews untuk tempat tertentu',
        tags: ['api', 'reviews'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });

    // Get ratings untuk tempat tertentu (alias untuk reviews)
    server.route({
      method: 'GET',
      path: '/api/places/{placeId}/ratings',
      handler: reviewView.getReviewsByPlace,
      options: {
        auth: false,
        description: 'Get semua ratings untuk tempat tertentu',
        tags: ['api', 'reviews'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    // Get reviews milik user
    server.route({
      method: 'GET',
      path: '/api/user/reviews',
      handler: reviewView.getUserReviews,
      options: { 
        auth: 'jwt',
        description: 'Get reviews milik user yang sedang login',
        tags: ['api', 'reviews', 'user'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    // Delete review
    server.route({
      method: 'DELETE',
      path: '/api/reviews/place/{placeId}',
      handler: reviewView.deleteReview,
      options: { 
        auth: 'jwt',
        description: 'Delete review milik user',
        tags: ['api', 'reviews'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    console.log('Review routes registered successfully');
  }
};