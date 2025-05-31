const {
  getRecommendations,
  getPopular
} = require('../services/recommendationService');
const { getUserFromToken } = require('../plugins/jwt'); // sesuaikan jika ada

// Content-Based Filtering (tanpa login)
const contentBased = async (request, h) => {
  try {
    console.log('Content-based request received');
    const result = await getRecommendations(null, false);
    return h.response(result).code(200);
  } catch (err) {
    console.error('Error in contentBased:', err);
    return h.response({ 
      error: 'Failed to get content-based recommendations',
      message: err.message 
    }).code(500);
  }
};

// Collaborative Filtering (butuh login + cukup rating)
const collaborative = async (request, h) => {
  try {
    console.log('Collaborative request received');
    const user = request.auth.credentials;
    if (!user) {
      return h.response({ error: 'User authentication required' }).code(401);
    }
    
    const result = await getRecommendations(user, true);
    return h.response(result).code(200);
  } catch (err) {
    console.error('Error in collaborative:', err);
    return h.response({ 
      error: 'Failed to get collaborative recommendations',
      message: err.message 
    }).code(400);
  }
};

// Mengambil data dari table places
const getPopularDestinations = async (request, h) => {
  try {
    console.log('Popular destinations request received');
    console.log('Query params:', request.query);
    
    const limit = parseInt(request.query.limit) || 12;
    console.log('Using limit:', limit);

    const destinations = await getPopular(limit);
    console.log('Destinations fetched:', destinations.length);
    
    const response = { 
      recos: destinations,
      total: destinations.length,
      message: 'Popular destinations fetched successfully'
    };
    
    return h.response(response).code(200);
  } catch (err) {
    console.error('Error in getPopularDestinations:', err);
    return h.response({ 
      error: 'Failed to fetch popular destinations',
      message: err.message,
      details: err.stack
    }).code(500);
  }
};

module.exports = {
  contentBased,
  collaborative,
  getPopularDestinations,
};