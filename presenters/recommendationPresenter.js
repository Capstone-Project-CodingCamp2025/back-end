const {
  getRecommendations,
  getPopular
} = require('../services/recommendationService'); // atau service yg benar
const { getUserFromToken } = require('../plugins/jwt'); // sesuaikan jika ada

// Content-Based Filtering (tanpa login)
const contentBased = async (request, h) => {
  try {
    const result = await getRecommendations(null, false);
    return h.response(result).code(200);
  } catch (err) {
    return h.response({ error: err.message }).code(500);
  }
};

// Collaborative Filtering (butuh login + cukup rating)
const collaborative = async (request, h) => {
  try {
    const user = request.auth.credentials;
    const result = await getRecommendations(user, true);
    return h.response(result).code(200);
  } catch (err) {
    return h.response({ error: err.message }).code(400);
  }
};

module.exports = {
  contentBased,
  collaborative,
};
