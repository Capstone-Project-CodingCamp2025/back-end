const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');

// load CBF model once
let cbfModel, itemFeatures, placeNames;
(async () => {
  cbfModel = await tf.loadGraphModel('file:///mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/tfjs_model/model.json');
  itemFeatures = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/item_features.json'));
  placeNames   = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/place_names.json'));
  ratingNames   = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/place_ratings.json')); 
})();

// load CF model + maps
// load CF model + maps
let cfModel, userMap, itemMap;
(async () => {
  cfModel = await tf.loadGraphModel('file:///mnt/d/Projek/Capstone DBS/machine-learning/model/CF/tfjs_model/model.json');
  userMap = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CF/user_encoder.json'));
  itemMap = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CF/item_encoder.json'));
})();

function recommendCBF(topK = 5) {
  // contoh: random atau top global berdasarkan rata-rata rating
  const sims = itemFeatures.map(() => Math.random());
  return placeNames.slice(0, topK);
}

async function recommendHybrid(userId, topK = 5) {
  // panggil CF untuk tiap item lalu gabung dengan skor CBF
  const uIdx = userMap[userId];
  const itemIds = Object.keys(itemMap);
  const preds = await Promise.all(itemIds.map(async itemId => {
    const iIdx = itemMap[itemId];
    const pred = await cfModel.predict({ user_idx: tf.tensor([uIdx]), item_idx: tf.tensor([iIdx]) });
    return { itemId, score: pred.dataSync()[0] };
  }));
  // sorting & merging dengan CBF (contoh sederhana: rata-rata kedua skor)
  // ...
  return preds.sort((a,b) => b.score - a.score).slice(0, topK).map(p => p.itemId);
}

module.exports = { recommendCBF, recommendHybrid };
