const recPres = require('../presenters/recommendationPresenter');
const { getUserRatings } = require('../models/ratingModel');

exports.plugin = {
  name: 'recommendation-routes',
  register: async (server) => {
    // Register server method FIRST
    server.method('getUserRatings', async (userId) => {
      console.log('Server method getUserRatings called with userId:', userId);
      try {
        const ratings = await getUserRatings(userId);
        console.log('Server method getUserRatings result:', ratings.length);
        return ratings;
      } catch (error) {
        console.error('Error in server method getUserRatings:', error);
        return [];
      }
    });

    // Register routes
    server.route([
      { 
        method: 'GET',  
        path: '/api/recommendations',       
        handler: recPres.recommendations,   
        options: { auth: 'jwt' } 
      },
      { 
        method: 'GET',  
        path: '/api/recommendations/popular',
        handler: recPres.popular,          
        options: { auth: false } 
      },
      { 
        method: 'GET',  
        path: '/api/recommendations/hybrid',       
        handler: recPres.getHybridRecommendations,   
        options: { auth: 'jwt' } 
      },
      { 
        method: 'GET',  
        path: '/api/user/rating-status',       
        handler: recPres.checkUserRatingStatus,   
        options: { auth: 'jwt' } 
      },
    ]);
    
    console.log('✅ Recommendation routes and methods registered');
  }
};