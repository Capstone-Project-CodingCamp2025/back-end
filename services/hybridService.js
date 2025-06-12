const { computeCBF } = require('./cbfService');
const { computeCF } = require('./cfService');
const placeService = require('../models/placeModel');
const ratingService = require('../models/ratingModel');

/**
 * Configuration constants
 */
const CONFIG = {
  MINIMUM_RATINGS_FOR_HYBRID: 3,
  ALPHA_THRESHOLDS: {
    NEW_USER: { max: 5, alpha: 0.3 },      // 70% CBF, 30% CF
    REGULAR_USER: { max: 10, alpha: 0.5 }, // 50% CBF, 50% CF
    ACTIVE_USER: { max: 20, alpha: 0.7 },  // 30% CBF, 70% CF
    SUPER_USER: { max: Infinity, alpha: 0.8 } // 20% CBF, 80% CF
  },
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  DEFAULT_TOP_N: 10
};

/**
 * Simple in-memory cache
 */
const cache = new Map();

/**
 * Determine alpha coefficient based on user rating count
 */
function determineAlpha(userRatingCount) {
  const thresholds = CONFIG.ALPHA_THRESHOLDS;
  
  if (userRatingCount <= thresholds.NEW_USER.max) {
    return thresholds.NEW_USER.alpha;
  } else if (userRatingCount <= thresholds.REGULAR_USER.max) {
    return thresholds.REGULAR_USER.alpha;
  } else if (userRatingCount <= thresholds.ACTIVE_USER.max) {
    return thresholds.ACTIVE_USER.alpha;
  } else {
    return thresholds.SUPER_USER.alpha;
  }
}

/**
 * Normalize scores to [0,1] range
 */
function normalizeScores(scores) {
  if (scores.length === 0) return new Map();
  
  const scoreValues = Array.from(scores.values());
  const maxScore = Math.max(...scoreValues);
  const minScore = Math.min(...scoreValues);
  const scoreDiff = maxScore - minScore;
  
  const normalizedScores = new Map();
  
  for (const [id, score] of scores) {
    const normalizedScore = scoreDiff > 0 
      ? (score - minScore) / scoreDiff 
      : 0.5; // Default if all scores are equal
    normalizedScores.set(id, normalizedScore);
  }
  
  return normalizedScores;
}

/**
 * Compute Hybrid Recommendations - IMPROVED VERSION
 */
async function computeHybridRecommendations(userId, allRatings, allPlaces, topN = CONFIG.DEFAULT_TOP_N) {
  console.log('=== HYBRID RECOMMENDATIONS COMPUTATION ===');
  console.log(`User ID: ${userId}, Total Places: ${allPlaces.length}, Target: ${topN}`);
  
  try {
    // 1. Validate input data
    if (!allRatings || allRatings.length === 0) {
      throw new Error('No ratings data available');
    }
    
    if (!allPlaces || allPlaces.length === 0) {
      throw new Error('No places data available');
    }
    
    // 2. Get user ratings and validate eligibility
    const userRatings = allRatings.filter(r => r.user_id === userId);
    const userRatingCount = userRatings.length;
    
    console.log(`📊 User has ${userRatingCount} ratings`);
    
    if (userRatingCount < CONFIG.MINIMUM_RATINGS_FOR_HYBRID) {
      throw new Error(`Insufficient ratings. User has ${userRatingCount} ratings, minimum ${CONFIG.MINIMUM_RATINGS_FOR_HYBRID} required.`);
    }
    
    // 3. Determine alpha coefficient
    const alpha = determineAlpha(userRatingCount);
    console.log(`🎯 Alpha coefficient: ${alpha} (CBF: ${1-alpha}, CF: ${alpha})`);
    
    // 4. Compute CBF recommendations
    console.log('🔄 Computing CBF recommendations...');
    const cbfResults = await computeCBF(allPlaces, userRatings, topN * 2);
    
    // Create CBF scores map
    const cbfScores = new Map();
    cbfResults.forEach(place => {
      cbfScores.set(place.id, place.score || 0);
    });
    
    // Normalize CBF scores
    const normalizedCBFScores = normalizeScores(cbfScores);
    console.log(`✅ CBF computed: ${cbfResults.length} places`);
    
    // 5. Compute CF recommendations
    console.log('🔄 Computing CF recommendations...');
    const cfResults = await computeCF(userId, allRatings, topN * 2);
    
    // Create CF scores map
    const cfScores = new Map();
    cfResults.forEach(place => {
      cfScores.set(place.id, place.cfScore || 0);
    });
    
    // Normalize CF scores
    const normalizedCFScores = normalizeScores(cfScores);
    console.log(`✅ CF computed: ${cfResults.length} places`);
    
    // 6. Combine candidates and compute hybrid scores
    const candidateIds = new Set([
      ...cbfResults.map(p => p.id),
      ...cfResults.map(p => p.id)
    ]);
    
    console.log(`🔄 Processing ${candidateIds.size} unique candidates...`);
    
    // Filter out already rated places
    const ratedPlaceIds = new Set(userRatings.map(r => r.place_id));
    const unratedCandidates = Array.from(candidateIds).filter(id => !ratedPlaceIds.has(id));
    
    console.log(`📋 Unrated candidates: ${unratedCandidates.length}`);
    
    // 7. Calculate hybrid scores for each candidate
    const hybridResults = [];
    
    for (const placeId of unratedCandidates) {
      const scoreCBF = normalizedCBFScores.get(placeId) || 0;
      const scoreCF = normalizedCFScores.get(placeId) || 0;
      
      // Hybrid score calculation
      const hybridScore = alpha * scoreCF + (1 - alpha) * scoreCBF;
      
      // Find place data (prefer database data for images)
      let placeData = allPlaces.find(p => p.id === placeId);
      
      if (!placeData) {
        // Fallback to CBF or CF results
        placeData = cbfResults.find(p => p.id === placeId) || 
                   cfResults.find(p => p.id === placeId);
      }
      
      if (placeData) {
        hybridResults.push({
          ...placeData,
          hybridScore,
          scoreCBF,
          scoreCF,
          alpha,
          source: normalizedCBFScores.has(placeId) && normalizedCFScores.has(placeId) ? 'both' : 
                  normalizedCBFScores.has(placeId) ? 'cbf' : 'cf',
          userRatingCount // For debugging
        });
      }
    }
    
    // 8. Sort by hybrid score and return top N
    const finalRecommendations = hybridResults
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, topN);
    
    console.log('✅ Hybrid recommendations computed successfully');
    console.log(`📈 Final results: ${finalRecommendations.length} recommendations`);
    
    // Debug sample
    if (finalRecommendations.length > 0) {
      const sample = finalRecommendations[0];
      console.log('📊 Sample hybrid recommendation:');
      console.log(`  - Name: ${sample.name || sample.nama_tempat}`);
      console.log(`  - Hybrid Score: ${sample.hybridScore.toFixed(4)}`);
      console.log(`  - CBF Score: ${sample.scoreCBF.toFixed(4)}`);
      console.log(`  - CF Score: ${sample.scoreCF.toFixed(4)}`);
      console.log(`  - Alpha: ${sample.alpha}`);
      console.log(`  - Source: ${sample.source}`);
    }
    
    return finalRecommendations;
    
  } catch (error) {
    console.error('❌ Error in computeHybridRecommendations:', error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Get hybrid recommendations with caching and error handling
 */
async function getHybridRecommendations(userId, topN = CONFIG.DEFAULT_TOP_N) {
  console.log('=== GET HYBRID RECOMMENDATIONS ===');
  console.log(`User ID: ${userId}, Top N: ${topN}`);
  
  try {
    // Check cache first
    const cacheKey = `hybrid_${userId}_${topN}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
      console.log('✅ Returning cached recommendations');
      return cached.data;
    }
    
    // Load data
    const [allRatings, allPlaces] = await Promise.all([
      ratingService.getAllRatings(),
      placeService.getAllPlaces()
    ]);
    
    console.log(`📊 Loaded ${allRatings.length} ratings and ${allPlaces.length} places`);
    
    // Validate data
    if (!allRatings || allRatings.length === 0) {
      throw new Error('No ratings data available in system');
    }
    
    if (!allPlaces || allPlaces.length === 0) {
      throw new Error('No places data available in system');
    }
    
    // Check user eligibility
    const userRatings = allRatings.filter(r => r.user_id === userId);
    if (userRatings.length < CONFIG.MINIMUM_RATINGS_FOR_HYBRID) {
      throw new Error(`User needs ${CONFIG.MINIMUM_RATINGS_FOR_HYBRID - userRatings.length} more ratings for hybrid recommendations`);
    }
    
    // Compute recommendations
    const recommendations = await computeHybridRecommendations(userId, allRatings, allPlaces, topN);
    
    // Format for frontend
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
    
    // Cache the results
    cache.set(cacheKey, {
      data: formattedRecommendations,
      timestamp: Date.now()
    });
    
    console.log(`✅ Hybrid recommendations ready: ${formattedRecommendations.length} items`);
    return formattedRecommendations;
    
  } catch (error) {
    console.error('❌ Error in getHybridRecommendations:', error);
    throw error;
  }
}

/**
 * Check if user is eligible for hybrid recommendations
 */
async function isUserEligibleForHybrid(userId) {
  try {
    const allRatings = await ratingService.getAllRatings();
    const userRatings = allRatings.filter(r => r.user_id === userId);
    
    const isEligible = userRatings.length >= CONFIG.MINIMUM_RATINGS_FOR_HYBRID;
    
    return {
      eligible: isEligible,
      ratingsCount: userRatings.length,
      minimumRequired: CONFIG.MINIMUM_RATINGS_FOR_HYBRID,
      ratingsNeeded: Math.max(0, CONFIG.MINIMUM_RATINGS_FOR_HYBRID - userRatings.length)
    };
  } catch (error) {
    console.error('Error checking hybrid eligibility:', error);
    return {
      eligible: false,
      ratingsCount: 0,
      minimumRequired: CONFIG.MINIMUM_RATINGS_FOR_HYBRID,
      ratingsNeeded: CONFIG.MINIMUM_RATINGS_FOR_HYBRID
    };
  }
}

/**
 * Clear cache for specific user (call this when user adds new rating)
 */
function clearUserCache(userId) {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.startsWith(`hybrid_${userId}_`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🗑️ Cleared ${keysToDelete.length} cache entries for user ${userId}`);
}

/**
 * Get cache statistics (for monitoring)
 */
function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    oldestEntry: Math.min(...Array.from(cache.values()).map(v => v.timestamp)),
    newestEntry: Math.max(...Array.from(cache.values()).map(v => v.timestamp))
  };
}

module.exports = {
  computeHybridRecommendations,
  getHybridRecommendations,
  isUserEligibleForHybrid,
  clearUserCache,
  getCacheStats,
  CONFIG
};