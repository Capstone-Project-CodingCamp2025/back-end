const recommendationPresenter = require('../presenters/recommendationPresenter');

exports.getRecommendations = async (req, res) => {
  try {
    const user = req.user || null;
    const hasRatings = req.hasEnoughRatings || false;

    const result = await recommendationPresenter.getRecommendations(user, hasRatings);
    res.json(result);
  } catch (err) {
    if (err.message.includes('Submit ratings')) {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to get recommendations.' });
  }
};

exports.getPopularDestinations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await recommendationPresenter.getPopular(limit);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load popular destinations.' });
  }
};
