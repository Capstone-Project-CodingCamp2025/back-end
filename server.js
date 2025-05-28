require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('./controllers/authController');
const ratingController = require('./controllers/ratingController');
const recommendationController = require('./controllers/recommendationController');
const optionalAuth = require('./middleware/optionalAuth');
const authenticateJWT = require('./middleware/auth');

const app = express();
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

app.post('/register', authRouter.register);
app.post('/login',    authRouter.login);

app.post(
  '/ratings',
  authenticateJWT,
  ratingController.submitRatings
);

app.get(
  '/recommendations',
  optionalAuth,  
  ratingController.checkRatingsCount,
  recommendationController.getRecommendations
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
