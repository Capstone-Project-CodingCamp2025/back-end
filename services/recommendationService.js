const { computeCBF } = require('./cbfService');
const { computeCF } = require('./cfService');
const { getHybridRecommendations, clearUserCache } = require('./hybridService');
const placeService = require('../models/placeModel');
const ratingService = require('../models/ratingModel');

/**
 * Get CBF recommendations
 */
async function getCBFRecommendations(userRatings, topN = 5) {
  try {
    const allPlaces = await placeService.getAllPlaces();
    return computeCBF(allPlaces, userRatings, topN);
  } catch (error) {
    console.error('Error in getCBFRecommendations:', error);
    throw error;
  }
}

/**
 * Get CF recommendations
 */
async function getCFRecommendations(userId, topN = 5) {
  try {
    const allRatings = await ratingService.getAllRatings();
    return await computeCF(userId, allRatings, topN);
  } catch (error) {
    console.error('Error in getCFRecommendations:', error);
    throw error;
  }
}

/**
 * Get hybrid recommendations - IMPROVED VERSION
 */
async function getHybridRecommendationsService(userId, topN = 5) {
  console.log('🔄 Getting hybrid recommendations for user:', userId);
  
  try {
    const recommendations = await getHybridRecommendations(userId, topN);
    
    // Ensure consistent data format
    const formattedRecommendations = recommendations.map(place => ({
      id: place.id,
      name: place.name || place.nama_tempat,
      description: place.description || place.deskripsi || 'Deskripsi tidak tersedia',
      location: place.location || place.alamat,
      image: place.image || place.gambar || '/gambar_data/default/default.jpg',
      gambar: place.image || place.gambar || '/gambar_data/default/default.jpg',
      thumbnail: place.thumbnail,
      rating: parseFloat(place.rating) || 0,
      reviewCount: parseInt(place.reviewCount || place.jumlah_ulasan) || 0,
      category: place.category || place.kategori,
      kategori: place.category || place.kategori,
      alamat: place.location || place.alamat,
      // Hybrid specific fields
      hybridScore: place.hybridScore,
      scoreCBF: place.scoreCBF,
      scoreCF: place.scoreCF,
      alpha: place.alpha,
      source: place.source
    }));
    
    console.log('✅ Hybrid recommendations formatted:', formattedRecommendations.length);
    return formattedRecommendations;
    
  } catch (error) {
    console.error('❌ Error in getHybridRecommendationsService:', error);
    throw error;
  }
}

/**
 * Get popular destinations
 */
async function getPopular(limit = 20) {
  try {
    return await placeService.getPopular(limit);
  } catch (error) {
    console.error('Error in getPopular:', error);
    throw error;
  }
}

/**
 * Clear cache when user adds new rating
 */
function invalidateUserRecommendations(userId) {
  clearUserCache(userId);
}

module.exports = {
  getCBFRecommendations,
  getCFRecommendations,
  getHybridRecommendationsService,
  getPopular,
  invalidateUserRecommendations
};