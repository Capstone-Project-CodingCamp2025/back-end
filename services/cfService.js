const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const placeModel = require('../models/placeModel');
const encoders = require('../data/cf/encoders.json');
const { user_to_user_encoded, place_to_place_encoded } = encoders;

// Load CF model once
tf.loadGraphModel(`file://${path.join(__dirname, '../data/cf/tfjs_model/model.json')}`)
  .then(model => {
    cfModel = model;
    console.log('✅ CF model loaded');
  })
  .catch(err => {
    console.error('❌ Failed to load CF model:', err);
  });

let cfModel;

/**
 * Compute CF recommendations via TFJS model.
 * @param {number} userId
 * @param {Array<{user_id:number, place_id:number, rating:number}>} allRatings
 * @param {number} topN
 * @returns {Promise<Array>} array of formatted place objects
 */
async function computeCF(userId, allRatings, topN = 5) {
  if (!cfModel) {
    throw new Error('CF model belum siap—tunggu load selesai.');
  }

  // 1. Load all places to build mapping place_id -> index
  const allPlaces = await placeModel.getAllPlaces();
  if (!allPlaces || allPlaces.length === 0) {
    console.log('❌ No places found in database for CF mapping');
    return [];
  }
  const id2idx = {};
  allPlaces.forEach((p, idx) => {
    id2idx[p.id] = idx;
  });

  // 2. Prepare candidates: places user hasn't rated
  const ratedSet = new Set(
    allRatings.filter(r => r.user_id === userId).map(r => r.place_id)
  );
  // Filter out any candidate without encoder mapping
  const candidates = allPlaces
    .map(p => p.id)
    .filter(pid => !ratedSet.has(pid) && place_to_place_encoded[pid] != null);
  if (candidates.length === 0) {
    console.log('❌ No valid candidates for CF after filtering unmapped');
    return [];
  }

  // 3. Encode user and places
  const userEnc = user_to_user_encoded[userId];
  if (userEnc == null) {
    throw new Error(`User ${userId} tidak ada di encoder.`);
  }

  // Build input array only for mapped candidates
  const inputArray = candidates.map(pid => [
    userEnc,
    place_to_place_encoded[pid]
  ]);

  // 4. Create input tensor and predict
  const inputTensor = tf.tensor2d(inputArray, [inputArray.length, 2], 'float32');
  const predsTensor = cfModel.predict(inputTensor);
  const predsData = await predsTensor.data();
  tf.dispose([inputTensor, predsTensor]);

  // 5. Pair candidates with scores
  const scored = candidates.map((pid, i) => ({ pid, cfScore: predsData[i] }));

  // 6. Sort by score desc and take topN
  const topScored = scored.sort((a, b) => b.cfScore - a.cfScore).slice(0, topN);

  // 7. Map back to place objects with details and images
  const recommendations = topScored
    .map(({ pid, cfScore }) => {
      const place = allPlaces.find(p => p.id === pid);
      return {
        ...place,
        cfScore
      };
    })
    .filter(Boolean);

  console.log('CF recommendations result:', recommendations.length);
  return recommendations;
}

module.exports = { computeCF };
