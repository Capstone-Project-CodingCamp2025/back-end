const { saveInitialRatings, countUserRatings, getUserRatings } = require('../models/ratingModel');
const { getCBFRecommendations, getCFRecommendations, getPopular } = require('../services/recommendationService');
const { getPopularId: getPlaceById, getAllPlaces: getAllPlacesModel } = require('../models/placeModel');
const { getPlaceDetails } = require('../models/ratingModel');

async function initialRatings(request, h) {
  console.log('=== INITIAL RATINGS PRESENTER DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  console.log('Request payload:', JSON.stringify(request.payload, null, 2));
  
  if (!request.auth || !request.auth.credentials) {
    console.log('❌ No authentication found');
    return h.response({ message: 'Authentication required.' }).code(401);
  }
  
  const userId = request.auth.credentials.id;
  const ratings = request.payload;
  
  console.log('User ID:', userId);
  console.log('Ratings payload:', JSON.stringify(ratings, null, 2));
  
  if (!userId) {
    console.log('❌ No user ID found');
    return h.response({ message: 'User ID not found.' }).code(400);
  }
  
  if (!Array.isArray(ratings) || ratings.length < 3) {
    console.log('❌ Invalid ratings array');
    return h.response({ message: 'Minimal beri rating ke 3 tempat.' }).code(400);
  }
  
  try {
    await saveInitialRatings(userId, ratings);
    console.log('✅ Ratings saved successfully');
    return h.response({ message: 'Ratings saved.' }).code(200);
  } catch (err) {
    console.error('❌ Error saving ratings:', err);
    return h.response({ message: 'Gagal menyimpan rating.' }).code(500);
  }
}

async function recommendations(request, h) {
  console.log('=== RECOMMENDATIONS PRESENTER DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  
  if (!request.auth || !request.auth.credentials) {
    console.log('❌ No authentication found');
    return h.response({ message: 'Authentication required.' }).code(401);
  }
  
  const userId = request.auth.credentials.id;
  console.log('User ID:', userId);
  
  if (!userId) {
    console.log('❌ No user ID found');
    return h.response({ 
      destinations: [],
      message: 'User ID not found.' 
    }).code(400);
  }
  
  try {
    const count = await countUserRatings(userId);
    console.log('User ratings count:', count);
    
    let destinations = [];
    
    if (count < 5) {
      console.log('Using CBF (Content-Based Filtering)');
      
      const ratings = await getUserRatings(userId);
      console.log('User ratings for CBF:', JSON.stringify(ratings, null, 2));
      
      if (!ratings || ratings.length === 0) {
        console.log('❌ No user ratings found');
        return h.response({ 
          destinations: [],
          message: 'No ratings found. Please submit ratings first.' 
        }).code(200);
      }
      
      destinations = await getCBFRecommendations(ratings, 10);
      console.log('CBF recommendations received:', destinations.length);
      
    } else {
      console.log('Using CF (Collaborative Filtering)');
      destinations = await getCFRecommendations(userId, 10);
      console.log('CF recommendations received:', destinations.length);
    }
    
    if (!destinations) {
      destinations = [];
    }
    
    console.log('Final destinations to return:', destinations.length);
    console.log('Sample destinations:', JSON.stringify(destinations.slice(0, 2), null, 2));
    
    return h.response({ destinations }).code(200);
    
  } catch (err) {
    console.error('❌ Error getting recommendations:', err);
    console.error('Error stack:', err.stack);
    return h.response({ 
      destinations: [],
      message: 'Gagal mendapat rekomendasi.',
      error: err.message 
    }).code(500);
  }
}

async function popular(request, h) {
  const limit = parseInt(request.query.limit, 10) || 12;
  
  console.log('=== POPULAR DESTINATIONS PRESENTER DEBUG ===');
  console.log('Limit:', limit);
  
  try {
    const destinations = await getPopular(limit);
    console.log('Popular destinations count:', destinations.length);
    return h.response({ destinations }).code(200);
  } catch (err) {
    console.error('❌ Error loading popular destinations:', err);
    return h.response({ 
      destinations: [],
      message: 'Gagal memuat popular destinations.' 
    }).code(500);
  }
}

// NEW: Add getAllPlaces handler
async function getAllPlaces(request, h) {
  console.log('=== GET ALL PLACES PRESENTER DEBUG ===');
  
  try {
    const places = await getAllPlacesModel();
    console.log('All places count:', places.length);
    return h.response(places).code(200);
  } catch (err) {
    console.error('❌ Error loading all places:', err);
    return h.response({ 
      statusCode: 500,
      error: "Internal Server Error",
      message: 'Gagal memuat semua tempat.' 
    }).code(500);
  }
}

async function getPopularId(request, h) {
  const placeId = parseInt(request.params.id);
  
  try {
    const place = await getPlaceById(placeId);
    
    if (!place) {
      return h.response({ 
        statusCode: 404, 
        error: "Not Found", 
        message: "Place not found" 
      }).code(404);
    }
    
    return h.response(place).code(200);
  } catch (error) {
    console.error('Error getting place by ID:', error);
    return h.response({ 
      statusCode: 500, 
      error: "Internal Server Error", 
      message: "Failed to get place details" 
    }).code(500);
  }
}

async function getPlaceRatings(request, h) {
  const placeId = parseInt(request.params.id);
  
  console.log('Getting place details for place ID:', placeId);
  
  try {
    const place = await getPlaceDetails(placeId);
    
    if (!place) {
      return h.response({ 
        statusCode: 404,
        error: "Not Found",
        message: 'No place found with this ID' 
      }).code(404);
    }
    
    return h.response(place).code(200);
  } catch (error) {
    console.error('Error getting place details:', error);
    return h.response({ 
      statusCode: 500, 
      error: "Internal Server Error", 
      message: "Failed to get place details" 
    }).code(500);
  }
}

module.exports = { 
  initialRatings, 
  recommendations, 
  popular, 
  getAllPlaces,  // ADD THIS EXPORT
  getPopularId, 
  getPlaceRatings 
};