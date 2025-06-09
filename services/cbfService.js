// services/cbfService.js - FIXED IMAGE HANDLING
const fs = require('fs');
const path = require('path');
const numpy = require('numpy-parser');
const { getFirstImageUrl, getImageUrlsFromDatabase, formatPrice } = require('../utils/imageHelpers');

// Load model data...
const modelPath = path.join(__dirname, '../data/cbf');
const modelJSON = JSON.parse(
  fs.readFileSync(path.join(modelPath, 'tourism_recommendation_model.json'), 'utf8')
);

// Load numpy data...
const npyBuffer = fs.readFileSync(path.join(modelPath, 'cosine_similarity_matrix.npy'));
const arrayBuffer = npyBuffer.buffer.slice(npyBuffer.byteOffset, npyBuffer.byteOffset + npyBuffer.byteLength);
const parsed = numpy.fromArrayBuffer(arrayBuffer);
const flatArray = parsed.data;
const [nRows, nCols] = parsed.shape;

const allPlaces = modelJSON.places_data;
if (nRows !== nCols || nRows !== allPlaces.length) {
  throw new Error(`Invalid cosine matrix shape ${parsed.shape}, expected ${allPlaces.length}×${allPlaces.length}`);
}

const n = nRows;
const cosineMatrix = Array.from({ length: n }, (_, i) =>
  flatArray.slice(i * n, (i + 1) * n)
);

// FIXED: Better image handling for model data
function formatPlaceForFrontend(place) {
  console.log('🔍 Formatting place from model:', {
    id: place.id,
    name: place.nama_tempat || place.name,
    gambar: place.gambar,
    fullImage: place.fullImage,
    thumbnail: place.thumbnail
  });

  // Try multiple possible image field names from model
  let imageSource = place.gambar || place.fullImage || place.thumbnail || place.image || place.images;
  
  // If no image found in model, try to get from database
  if (!imageSource) {
    console.log('⚠️ No image found in model data for place:', place.id);
    // You might want to fetch from database here as fallback
    imageSource = null;
  }

  const mainImage = imageSource ? getFirstImageUrl(imageSource) : '/gambar_data/default/default.jpg';
  const allImages = imageSource ? getImageUrlsFromDatabase(imageSource) : [];
  
  console.log('🖼️ Image processing result:', {
    placeId: place.id,
    imageSource,
    mainImage,
    allImagesCount: allImages.length
  });
  
  return {
    id: place.id,
    name: place.nama_tempat || place.name,
    description: place.deskripsi || place.description || 'Deskripsi tidak tersedia',
    location: place.alamat || place.location,
    image: mainImage,
    gambar: mainImage,
    thumbnail: place.thumbnail,
    allImages: allImages,
    fullImage: imageSource, // Original image source
    rating: parseFloat(place.rating) || 0,
    reviewCount: parseInt(place.jumlah_ulasan || place.reviewCount) || 0,
    price: formatPrice(place.kategori || place.category),
    category: place.kategori || place.category,
    link: place.link || '',
    score: place.score || 0
  };
}

// Alternative solution: Merge model data with database data
async function formatPlaceWithDatabaseFallback(modelPlace, databasePlaces) {
  // Find corresponding place in database
  const dbPlace = databasePlaces.find(p => p.id === modelPlace.id);
  
  if (dbPlace) {
    console.log('✅ Found database match for model place:', modelPlace.id);
    // Use database image data but keep model's other data
    return {
      ...modelPlace,
      image: dbPlace.image,
      gambar: dbPlace.gambar,
      thumbnail: dbPlace.thumbnail,
      allImages: dbPlace.allImages,
      fullImage: dbPlace.fullImage
    };
  } else {
    console.log('❌ No database match found for model place:', modelPlace.id);
    return formatPlaceForFrontend(modelPlace);
  }
}

// FIXED: computeCBF with better image handling
function computeCBF(databasePlaces, ratings, topN = 5) {
  console.log('📊 Computing CBF Recommendations');

  if (!ratings || ratings.length === 0) {
    console.log('❌ No ratings provided');
    return [];
  }

  const likedIds = ratings.filter(r => r.rating >= 3).map(r => r.place_id);
  if (likedIds.length === 0) {
    console.log('⚠️ No liked places. Fallback popular.');
    return getPopularFallback(databasePlaces, ratings, topN);
  }

  const scores = new Array(n).fill(0);
  likedIds.forEach(id => {
    const idx = allPlaces.findIndex(p => p.id === id);
    if (idx !== -1) {
      for (let j = 0; j < n; j++) {
        scores[j] += cosineMatrix[idx][j];
      }
    }
  });

  const ratedSet = new Set(ratings.map(r => r.place_id));

  // FIXED: Use database places for image data
  const recs = allPlaces
    .map((place, i) => ({ ...place, score: scores[i] }))
    .filter(p => !ratedSet.has(p.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(modelPlace => {
      // Find corresponding database place for proper image handling
      const dbPlace = databasePlaces.find(p => p.id === modelPlace.id);
      if (dbPlace) {
        // Merge: use database image data + model score
        return {
          ...dbPlace,
          score: modelPlace.score
        };
      } else {
        // Fallback to model data only
        return formatPlaceForFrontend(modelPlace);
      }
    });

  console.log('✅ Final CBF Recommendations:', recs.length);
  console.log('Sample CBF recommendation images:', recs.slice(0, 1).map(p => ({
    name: p.name,
    mainImage: p.image,
    allImages: p.allImages?.length || 0,
    fromDatabase: !!databasePlaces.find(db => db.id === p.id)
  })));
  
  return recs;
}

function getPopularFallback(databasePlaces, ratings, topN = 5) {
  const ratedSet = new Set(ratings.map(r => r.place_id));
  
  // Use database places directly for fallback (they have proper images)
  const popular = databasePlaces
    .filter(p => !ratedSet.has(p.id))
    .sort((a, b) => {
      if (Math.abs(a.rating - b.rating) < 0.1) {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      return b.rating - a.rating;
    })
    .slice(0, topN);

  console.log('✅ Popular fallback recommendations:', popular.length);
  return popular;
}

module.exports = { computeCBF };