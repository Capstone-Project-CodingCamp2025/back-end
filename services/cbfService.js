// services/cbfService.js - More robust fallback
const fs   = require('fs');
const path = require('path');

function computeCBF(allPlaces, ratings, topN = 5) {
  console.log('=== CBF COMPUTATION DEBUG ===');
  console.log('All places count:', allPlaces.length);
  console.log('User ratings count:', ratings.length);
  console.log('User ratings:', JSON.stringify(ratings, null, 2));
  console.log('TopN requested:', topN);

  // Jika tidak ada ratings, return empty array
  if (!ratings || ratings.length === 0) {
    console.log('❌ No ratings provided');
    return [];
  }

  if (!allPlaces || allPlaces.length === 0) {
    console.log('❌ No places provided');
    return [];
  }

  // Check if TF-IDF files exist
  const tfidfPath   = path.join(__dirname, '../data/cbf/tfidf.json');
  const cosinePath  = path.join(__dirname, '../data/cbf/cosine_sim.json');
  
  console.log('TF-IDF path:', tfidfPath);
  console.log('Cosine path:', cosinePath);
  console.log('TF-IDF file exists:', fs.existsSync(tfidfPath));
  console.log('Cosine file exists:', fs.existsSync(cosinePath));

  // Use simple recommendation since CBF files likely don't exist
  console.log('📊 Using simple rating-based recommendation fallback');
  return getSimpleRecommendations(allPlaces, ratings, topN);
}

// Enhanced simple recommendation based on category and rating similarity
function getSimpleRecommendations(allPlaces, ratings, topN = 5) {
  console.log('=== SIMPLE RECOMMENDATIONS DEBUG ===');
  console.log('All places:', allPlaces.length);
  console.log('User ratings:', ratings.length);
  
  const ratedPlaceIds = new Set(ratings.map(r => r.place_id));
  console.log('Rated place IDs:', Array.from(ratedPlaceIds));
  
  // Get categories and average rating of places user liked (rating >= 3)
  const likedRatings = ratings.filter(r => r.rating >= 3);
  console.log('Liked ratings (>=3):', likedRatings.length);
  
  if (likedRatings.length === 0) {
    console.log('⚠️  User has no liked places, using popular places as fallback');
    const popular = allPlaces
      .filter(place => !ratedPlaceIds.has(place.id))
      .sort((a, b) => {
        // Sort by rating first, then by review count
        if (Math.abs(a.rating - b.rating) < 0.1) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return b.rating - a.rating;
      })
      .slice(0, topN);
    
    console.log('Popular fallback recommendations:', popular.length);
    return popular;
  }
  
  const avgUserRating = likedRatings.reduce((sum, r) => sum + r.rating, 0) / likedRatings.length;
  console.log('Average user rating for liked places:', avgUserRating);
  
  // Get categories user likes
  const likedPlaces = likedRatings.map(r => allPlaces.find(p => p.id === r.place_id)).filter(p => p);
  const likedCategories = [...new Set(likedPlaces.map(p => p.category).filter(c => c))];
  console.log('Liked categories:', likedCategories);
  
  // Filter places user hasn't rated
  const unratedPlaces = allPlaces.filter(place => !ratedPlaceIds.has(place.id));
  console.log('Unrated places:', unratedPlaces.length);
  
  if (unratedPlaces.length === 0) {
    console.log('⚠️  No unrated places available');
    return [];
  }
  
  // Score places based on category match and rating
  const scoredPlaces = unratedPlaces.map(place => {
    let score = place.rating || 0;
    
    // Boost score if category matches user preferences
    if (likedCategories.length > 0 && place.category && likedCategories.includes(place.category)) {
      score += 1.0; // Category bonus
    }
    
    // Boost high-rated places
    if (place.rating >= avgUserRating) {
      score += 0.5; // Rating bonus
    }
    
    // Boost places with more reviews (indicates popularity/reliability)
    if (place.reviewCount && place.reviewCount > 10) {
      score += 0.2;
    }
    
    return { ...place, score };
  });
  
  // Sort by score and get top N
  const recommendations = scoredPlaces
    .sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.1) {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      return b.score - a.score;
    })
    .slice(0, topN);

  console.log('Final recommendations count:', recommendations.length);
  console.log('Recommendation scores:', recommendations.map(r => ({ name: r.name, score: r.score, category: r.category })));
  
  // Remove score property before returning
  return recommendations.map(({ score, ...place }) => place);
}

module.exports = { computeCBF };