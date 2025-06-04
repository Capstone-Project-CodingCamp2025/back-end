// presenters/recommendationPresenter.js
const {
  getRecommendations,
  getPopular
} = require('../services/recommendationService');

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

    // Pastikan limit adalah number yang valid
    if (isNaN(limit) || limit <= 0) {
      return h.response({ 
        error: 'Invalid limit parameter',
        message: 'Limit must be a positive number'
      }).code(400);
    }

    console.log('Calling getPopular service...');
    const destinations = await getPopular(limit);
    console.log('Destinations fetched successfully:', destinations.length);
    
    // Debug: tampilkan sample data
    if (destinations.length > 0) {
      console.log('Sample destination:', JSON.stringify(destinations[0], null, 2));
    }
    
    const response = { 
      destinations: destinations, // Ubah dari 'recos' ke 'destinations' sesuai frontend
      total: destinations.length,
      message: 'Popular destinations fetched successfully'
    };
    
    console.log('Sending response with', destinations.length, 'destinations');
    return h.response(response).code(200);
  } catch (err) {
    console.error('Error in getPopularDestinations:', err);
    console.error('Error stack:', err.stack);
    
    return h.response({ 
      error: 'Failed to fetch popular destinations',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }).code(500);
  }
};

module.exports = {
  contentBased,
  collaborative,
  getPopularDestinations,
};