const { countUserRatings, getUserRatings } = require('../models/ratingModel');
const { getCBFRecommendations, getCFRecommendations, getPopular, getHybridRecommendationsService } = require('../services/recommendationService');
const { getPopularId: getPlaceById, getAllPlaces: getAllPlacesModel } = require('../models/placeModel');
const { getPlaceDetails } = require('../models/ratingModel');
const { isUserEligibleForHybrid, clearUserCache, CONFIG } = require('../services/hybridService');

/**
 * Enhanced recommendation presenter with better error handling
 */
async function recommendations(request, h) {
  console.log('=== RECOMMENDATIONS PRESENTER ===');
  
  try {
    // Validate authentication
    if (!request.auth?.credentials) {
      return h.response({ 
        destinations: [],
        message: 'Authentication required.',
        requiresAuth: true
      }).code(401);
    }
    
    const userId = request.auth.credentials.userId || request.auth.credentials.id;
    
    if (!userId) {
      return h.response({ 
        destinations: [],
        message: 'Invalid user credentials.',
        requiresAuth: true
      }).code(400);
    }
    
    console.log('🔍 Getting recommendations for userId:', userId);
    
    // Add small delay to ensure recent ratings are saved
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get user rating count
    const ratingsCount = await countUserRatings(userId);
    console.log('📊 User has', ratingsCount, 'ratings');
    
    let destinations = [];
    let algorithm = 'none';
    let message = '';
    
    if (ratingsCount === 0) {
      // No ratings - return empty with message
      return h.response({
        destinations: [],
        message: 'Berikan rating pada beberapa tempat untuk mendapatkan rekomendasi personal',
        requiresInitialRating: true,
        algorithm: 'none',
        meta: { ratingsCount: 0 }
      }).code(200);
      
    } else if (ratingsCount < CONFIG.MINIMUM_RATINGS_FOR_HYBRID) {
      // Use CBF for users with few ratings
      console.log('Using CBF (Content-Based Filtering)');
      algorithm = 'cbf';
      
      const ratings = await getUserRatings(userId);
      if (ratings && ratings.length > 0) {
        destinations = await getCBFRecommendations(ratings, 10);
        message = `Rekomendasi berdasarkan preferensi Anda (${ratingsCount} rating)`;
      }
      
    } else {
      // Use Hybrid for users with sufficient ratings
      console.log('Using Hybrid (CBF + CF)');
      algorithm = 'hybrid';
      
      try {
        destinations = await getHybridRecommendationsService(userId, 10);
        message = `Rekomendasi personal hybrid (${ratingsCount} rating)`;
      } catch (hybridError) {
        console.log('Hybrid failed, falling back to CBF:', hybridError.message);
        // Fallback to CBF
        const ratings = await getUserRatings(userId);
        destinations = await getCBFRecommendations(ratings, 10);
        algorithm = 'cbf_fallback';
        message = `Rekomendasi berdasarkan preferensi Anda (fallback)`;
      }
    }
    
    return h.response({
      destinations: destinations || [],
      message,
      algorithm,
      meta: {
        ratingsCount,
        minimumForHybrid: CONFIG.MINIMUM_RATINGS_FOR_HYBRID,
        count: destinations?.length || 0
      }
    }).code(200);
    
  } catch (error) {
    console.error('❌ Error in recommendations:', error);
    return h.response({ 
      destinations: [],
      message: 'Gagal mendapatkan rekomendasi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }).code(500);
  }
}

/**
 * Enhanced hybrid recommendations with better validation
 */
async function getHybridRecommendations(request, h) {
  console.log('=== HYBRID RECOMMENDATIONS PRESENTER ===');
  
  try {
    // Validate authentication
    if (!request.auth?.credentials) {
      return h.response({ 
        destinations: [],
        message: 'Authentication required.',
        requiresInitialRating: true
      }).code(401);
    }
    
    const userId = request.auth.credentials.userId || request.auth.credentials.id;
    
    if (!userId) {
      return h.response({ 
        destinations: [],
        message: 'Invalid user credentials.',
        requiresInitialRating: true
      }).code(400);
    }
    
    console.log('🔍 Checking hybrid eligibility for userId:', userId);
    
    // Check eligibility first
    const eligibility = await isUserEligibleForHybrid(userId);
    
    if (!eligibility.eligible) {
      return h.response({
        destinations: [],
        message: `Berikan rating pada ${eligibility.ratingsNeeded} tempat lagi untuk mendapatkan rekomendasi hybrid`,
        requiresInitialRating: true,
        type: 'insufficient_ratings',
        meta: {
          algorithm: 'hybrid',
          ratingsCount: eligibility.ratingsCount,
          minimumRequired: eligibility.minimumRequired,
          ratingsNeeded: eligibility.ratingsNeeded
        }
      }).code(200);
    }
    
    // Get hybrid recommendations
    console.log('🔄 Getting hybrid recommendations...');
    const recommendations = await getHybridRecommendationsService(userId, 10);
    
    if (!recommendations || recommendations.length === 0) {
      return h.response({
        destinations: [],
        message: 'Tidak ada rekomendasi yang tersedia saat ini',
        requiresInitialRating: false,
        type: 'no_recommendations',
        meta: {
          algorithm: 'hybrid',
          ratingsCount: eligibility.ratingsCount
        }
      }).code(200);
    }

    return h.response({
      destinations: recommendations,
      message: 'Rekomendasi hybrid berhasil dimuat',
      requiresInitialRating: false,
      type: 'hybrid_success',
      meta: {
        algorithm: 'hybrid',
        count: recommendations.length,
        alpha: recommendations[0]?.alpha || 0.5,
        ratingsCount: eligibility.ratingsCount
      }
    }).code(200);
    
  } catch (error) {
    console.error('❌ Error in getHybridRecommendations:', error);
    return h.response({ 
      destinations: [],
      message: 'Gagal mendapatkan rekomendasi hybrid',
      requiresInitialRating: true,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }).code(500);
  }
}

/**
 * Check user rating status
 */
async function checkUserRatingStatus(request, h) {
  try {
    const userId = request.auth.credentials.userId || request.auth.credentials.id;
    
    if (!userId) {
      return h.response({
        needsInitialRating: true,
        ratingsCount: 0,
        minimumRequired: CONFIG.MINIMUM_RATINGS_FOR_HYBRID
      }).code(400);
    }
    
    const eligibility = await isUserEligibleForHybrid(userId);
    
    return h.response({
      needsInitialRating: !eligibility.eligible,
      ratingsCount: eligibility.ratingsCount,
      minimumRequired: eligibility.minimumRequired,
      ratingsNeeded: eligibility.ratingsNeeded,
      eligible: eligibility.eligible
    }).code(200);
    
  } catch (error) {
    console.error('Error checking user rating status:', error);
    return h.response({
      needsInitialRating: true,
      ratingsCount: 0,
      minimumRequired: CONFIG.MINIMUM_RATINGS_FOR_HYBRID,
      error: 'Failed to check status'
    }).code(500);
  }
}

/**
 * Popular destinations (unchanged)
 */
async function popular(request, h) {
  const limit = parseInt(request.query.limit, 10) || 12;
  
  try {
    const destinations = await getPopular(limit);
    return h.response({ destinations }).code(200);
  } catch (error) {
    console.error('Error loading popular destinations:', error);
    return h.response({ 
      destinations: [],
      message: 'Failed to load popular destinations'
    }).code(500);
  }
}

// Other functions remain the same...
async function getAllPlaces(request, h) {
  try {
    const places = await getAllPlacesModel();
    return h.response(places).code(200);
  } catch (error) {
    console.error('Error loading all places:', error);
    return h.response({ 
      statusCode: 500,
      error: "Internal Server Error",
      message: 'Failed to load places'
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
  
  try {
    const place = await getPlaceDetails(placeId);
    
    if (!place) {
      return h.response({ 
        statusCode: 404,
        error: "Not Found",
        message: 'Place not found'
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
  recommendations, 
  popular, 
  getAllPlaces,
  getPopularId, 
  getPlaceRatings,
  getHybridRecommendations,
  checkUserRatingStatus
};