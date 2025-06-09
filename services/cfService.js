// services/cfService.js - FIXED VERSION
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const encoders = require('../data/cf/encoders.json');
const { getFirstImageUrl, getImageUrlsFromDatabase, formatPrice } = require('../utils/imageHelpers');

const { user_to_user_encoded, place_to_place_encoded } = encoders;

// Load CF model sekali
const MODEL_PATH = path.join(__dirname, '../data/cf/tfjs_model/model.json');
let cfModel;
(async () => {
  console.log('Loading CF model from', MODEL_PATH);
  cfModel = await tf.loadGraphModel(`file://${MODEL_PATH}`);
  console.log('✅ CF model loaded');
})();

// Helper function to format place data like database
function formatPlaceForFrontend(place) {
  const mainImage = getFirstImageUrl(place.gambar || place.fullImage);
  const allImages = getImageUrlsFromDatabase(place.gambar || place.fullImage);
  
  return {
    id: place.id,
    name: place.nama_tempat || place.name,
    description: place.deskripsi || place.description || 'Deskripsi tidak tersedia',
    location: place.alamat || place.location,
    image: mainImage,        // ✅ Main image for display
    gambar: mainImage,       // ✅ For compatibility with frontend
    thumbnail: place.thumbnail,
    allImages: allImages,    // ✅ All available images
    fullImage: place.gambar || place.fullImage, // Original database string
    rating: parseFloat(place.rating) || 0,
    reviewCount: parseInt(place.jumlah_ulasan || place.reviewCount) || 0,
    price: formatPrice(place.kategori || place.category),
    category: place.kategori || place.category,
    link: place.link || '',
    cfScore: place.cfScore || 0  // CF prediction score
  };
}

/**
 * Compute CF recommendations via TFJS model.
 * @param {number} userId
 * @param {Array<{user_id:number,place_id:number,rating:number}>} allRatings
 * @param {number} topN
 * @returns {Promise<Array>}  array of formatted place objects
 */
async function computeCF(userId, allRatings, topN = 5) {
  if (!cfModel) {
    throw new Error('CF model belum siap—tunggu load selesai.');
  }

  // Unique place IDs
  const placeIds = Array.from(new Set(allRatings.map(r => r.place_id)));

  // Encode user
  const userEnc = user_to_user_encoded[userId];
  if (userEnc == null) {
    throw new Error(`User ${userId} tidak ada di encoder.`);
  }

  // Kandidat: belum dirating user
  const ratedSet = new Set(
    allRatings.filter(r => r.user_id === userId).map(r => r.place_id)
  );
  const candidates = placeIds.filter(pid => !ratedSet.has(pid));
  if (candidates.length === 0) return [];

  // Encode input
  const inputArray = candidates.map(pid => {
    const placeEnc = place_to_place_encoded[pid];
    return [userEnc, placeEnc];
  });

  // Predict
  const inputTensor = tf.tensor2d(inputArray, [inputArray.length, 2], 'float32');
  const predsTensor = cfModel.predict(inputTensor);
  const preds = await predsTensor.data();
  tf.dispose([inputTensor, predsTensor]);

  // Pair, sort, slice topN - return place IDs with scores
  const scored = candidates
    .map((pid, i) => ({ pid, cfScore: preds[i] }))
    .sort((a, b) => b.cfScore - a.cfScore)
    .slice(0, topN);

  return scored;
}

module.exports = { computeCF, formatPlaceForFrontend };