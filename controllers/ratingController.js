const { addRatings, countUserRatings } = require('../models/Rating');

exports.submitRatings = async (req, res) => {
  const userId = req.user.userId;
  const ratings = req.body.ratings; // array of { item_id, rating }
  if (!Array.isArray(ratings) || ratings.length < 5) {
    return res.status(400).json({ message: 'Please rate at least 5 places.' });
  }
  await addRatings(userId, ratings);
  res.json({ message: 'Ratings saved.' });
};

exports.checkRatingsCount = async (req, res, next) => {
  if (!req.user) {
    req.hasEnoughRatings = false;
    return next();
  }

  const userId = req.user.userId;
  const cnt = await countUserRatings(userId);
  req.hasEnoughRatings = cnt >= 5;
  next();
};

