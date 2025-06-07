// services/jwtService.js
const jwt = require('jsonwebtoken');

// Add fallback and validation
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not found in environment variables, using fallback');
}

const generateToken = (payload) => {
  console.log('Generating token with payload:', payload);
  console.log('Using JWT_SECRET length:', JWT_SECRET.length);
  
  const token = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h' 
  });
  
  console.log('Generated token:', token.substring(0, 50) + '...');
  return token;
};

const verifyToken = (token) => {
  console.log('Verifying token:', token.substring(0, 50) + '...');
  console.log('Using JWT_SECRET length:', JWT_SECRET.length);
  
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken };