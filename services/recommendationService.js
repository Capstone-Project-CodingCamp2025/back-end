// services/recommendationService.js - FIXED
const placeService = require('../models/placeModel');
const ratingService = require('../models/ratingModel');
const { computeCBF } = require('./cbfService');
const { computeCF, formatPlaceForFrontend } = require('./cfService');

async function getCBFRecommendations(ratings, topN = 5) {
  console.log('=== CBF RECOMMENDATIONS SERVICE ===');
  console.log('Ratings input:', JSON.stringify(ratings, null, 2));
  
  try {
    // FIXED: Get database places for proper image handling
    const allPlaces = await placeService.getAllPlaces();
    console.log('All places loaded from database:', allPlaces.length);
    
    if (!allPlaces || allPlaces.length === 0) {
      console.log('❌ No places found in database');
      return [];
    }

    // FIXED: Pass database places to CBF for image merging
    const recommendations = computeCBF(allPlaces, ratings, topN);
    console.log('CBF recommendations result:', recommendations.length);
    
    console.log('Sample CBF image check:', recommendations.slice(0, 1).map(r => ({
      name: r.name,
      hasImage: !!r.image,
      hasGambar: !!r.gambar,
      imageUrl: r.image,
      hasAllImages: r.allImages?.length > 0,
      fromDatabase: r.fromDatabase || 'merged'
    })));
    
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
    
    const scoredPlaces = await computeCF(userId, allRatings, topN);
    console.log('CF scored places:', scoredPlaces.length);
    
    if (!scoredPlaces || scoredPlaces.length === 0) {
      console.log('❌ No CF recommendations generated');
      return [];
    }
    
    // Get place details from database (already properly formatted with images)
    const allPlaces = await placeService.getAllPlaces();
    const recommendations = scoredPlaces
      .map(scored => {
        const place = allPlaces.find(p => p.id === scored.pid);
        if (place) {
          return { ...place, cfScore: scored.cfScore };
        }
        return null;
      })
      .filter(place => place != null);
    
    console.log('CF recommendations result:', recommendations.length);
    console.log('Sample CF image check:', recommendations.slice(0, 1).map(r => ({
      name: r.name,
      hasImage: !!r.image,
      hasGambar: !!r.gambar,
      imageUrl: r.image,
      cfScore: r.cfScore
    })));
    
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
    console.log('Sample popular image check:', popular.slice(0, 1).map(p => ({
      name: p.name,
      hasImage: !!p.image,
      hasGambar: !!p.gambar,
      imageUrl: p.image
    })));
    return popular;
  } catch (error) {
    console.error('❌ Error in getPopular:', error);
    return [];
  }
}

module.exports = { getCBFRecommendations, getCFRecommendations, getPopular };