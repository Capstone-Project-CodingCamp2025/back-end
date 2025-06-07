// services/recommendationService.js - Fixed version
const placeService = require('../models/placeModel');
const ratingService = require('../models/ratingModel');
const { computeCBF } = require('./cbfService');
const { computeCF } = require('./cfService');

async function getCBFRecommendations(ratings, topN = 5) {
  console.log('=== CBF RECOMMENDATIONS SERVICE ===');
  console.log('Ratings input:', JSON.stringify(ratings, null, 2));
  
  try {
    const allPlaces = await placeService.getAllPlaces();
    console.log('All places loaded:', allPlaces.length);
    
    if (!allPlaces || allPlaces.length === 0) {
      console.log('❌ No places found in database');
      return [];
    }
    
    const recommendations = computeCBF(allPlaces, ratings, topN);
    console.log('CBF recommendations result:', recommendations.length);
    
    return recommendations;
  } catch (error) {
    console.error('❌ Error in getCBFRecommendations:', error);
    return [];
  }
}

async function getCFRecommendations(userId, topN = 5) {
  console.log('=== CF RECOMMENDATIONS SERVICE ===');
  console.log('User ID:', userId);
  
  try {
    const allRatings = await ratingService.getAllRatings();
    console.log('All ratings loaded:', allRatings.length);
    
    if (!allRatings || allRatings.length === 0) {
      console.log('❌ No ratings found in database');
      return [];
    }
    
    const placeIds = computeCF(userId, allRatings, topN);
    console.log('CF place IDs:', placeIds);
    
    if (!placeIds || placeIds.length === 0) {
      console.log('❌ No CF recommendations generated');
      return [];
    }
    
    // Get place details
    const allPlaces = await placeService.getAllPlaces();
    const recommendations = placeIds
      .map(id => allPlaces.find(p => p.id === id))
      .filter(place => place != null);
    
    console.log('CF recommendations result:', recommendations.length);
    return recommendations;
  } catch (error) {
    console.error('❌ Error in getCFRecommendations:', error);
    return [];
  }
}

async function getPopular(limit = 12) {
  console.log('=== POPULAR SERVICE ===');
  console.log('Limit:', limit);
  
  try {
    const popular = await placeService.getPopular(limit);
    console.log('Popular places loaded:', popular.length);
    return popular;
  } catch (error) {
    console.error('❌ Error in getPopular:', error);
    return [];
  }
}

module.exports = { getCBFRecommendations, getCFRecommendations, getPopular };