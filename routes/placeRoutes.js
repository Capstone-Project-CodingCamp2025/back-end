const placeView = require('../views/placeView');
const reviewView = require('../views/reviewView');

exports.plugin = {
  name: 'place-routes',
  version: '1.0.0',
  register: async (server) => {
    console.log('Registering place routes...');
    
    // Get all places
    server.route({
      method: 'GET',
      path: '/api/places',
      handler: placeView.getAllPlaces,
      options: {
        auth: false,
        description: 'Get all places',
        tags: ['api', 'places'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    // Get place by ID
    server.route({
      method: 'GET',
      path: '/api/places/{id}',
      handler: placeView.getPlaceById,
      options: {
        auth: false,
        description: 'Get place by ID',
        tags: ['api', 'places'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    // TAMBAHAN: Endpoint details yang mengembalikan place info + reviews
    server.route({
      method: 'GET',
      path: '/api/places/{id}/details',
      handler: async (request, h) => {
        console.log('=== GET PLACE DETAILS WITH REVIEWS ===');
        console.log('Place ID:', request.params.id);
        
        try {
          // Get place details
          const placeResponse = await placeView.getPlaceById(request, h);
          
          // Get reviews for the place
          const reviewsResponse = await reviewView.getReviewsByPlace(request, h);
          
          // Combine data
          const placeData = placeResponse.source || placeResponse;
          const reviewsData = reviewsResponse.source || reviewsResponse || [];
          
          console.log('✅ Place details with reviews retrieved');
          console.log('Place:', placeData?.name);
          console.log('Reviews count:', Array.isArray(reviewsData) ? reviewsData.length : 0);
          
          return h.response({
            place: placeData,
            reviews: Array.isArray(reviewsData) ? reviewsData : []
          }).code(200);
          
        } catch (error) {
          console.error('❌ Error getting place details:', error);
          return h.response({ 
            message: 'Gagal mengambil detail tempat', 
            error: error.message 
          }).code(500);
        }
      },
      options: {
        auth: false,
        description: 'Get place details with reviews',
        tags: ['api', 'places', 'reviews'],
        cors: {
          origin: ['http://localhost:5173'],
          credentials: true
        }
      }
    });
    
    console.log('Place routes registered successfully');
  }
};