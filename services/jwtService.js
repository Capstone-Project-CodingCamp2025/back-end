const jwt = require('jsonwebtoken');
const { accessTokenSecret, tokenAge } = require('../config/jwt');

module.exports = {
  generateToken: (payload) => jwt.sign(payload, accessTokenSecret, { expiresIn: tokenAge }),
  verifyToken: (token) => jwt.verify(token, accessTokenSecret),
};
