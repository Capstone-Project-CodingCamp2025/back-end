// services/recommendationService.js
const placeService = require('../models/placeModel');

// Wrapper untuk getPopular dari placeService
const getPopular = async (limit = 12) => {
  try {
    console.log('recommendationService.getPopular called with limit:', limit);
    const result = await placeService.getPopular(limit);
    console.log('recommendationService.getPopular result:', result.length, 'items');
    return result;
  } catch (error) {
    console.error('Error in recommendationService.getPopular:', error);
    throw error;
  }
};

// Wrapper untuk getRecommendations dari placeService
const getRecommendations = async (user, useCollaborative = false) => {
  try {
    console.log('recommendationService.getRecommendations called');
    const result = await placeService.getRecommendations(user, useCollaborative);
    console.log('recommendationService.getRecommendations result:', result);
    return result;
  } catch (error) {
    console.error('Error in recommendationService.getRecommendations:', error);
    throw error;
  }
};

module.exports = {
  getPopular,
  getRecommendations
};