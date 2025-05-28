const pool = require('../config/db');

const addRatings = async (userId, ratings) => {
  // ratings: array of { item_id, rating }
  const values = ratings.map(r => [userId, r.item_id, r.rating]);
  await pool.query(
    'INSERT INTO ratings (user_id, item_id, rating) VALUES ?',
    [values]
  );
};

const countUserRatings = async (userId) => {
  const [[{ cnt }]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM ratings WHERE user_id = ?',
    [userId]
  );
  return cnt;
};

module.exports = { addRatings, countUserRatings };
