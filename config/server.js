// server.js - Fixed JWT strategy configuration
require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

const authRoutes = require('../routes/authRoutes');
const resetPasswordRoutes = require('../routes/resetPasswordRoutes');
const ratingRoutes = require('../routes/ratingRoutes');
const reviewRoutes = require('../routes/reviewRoutes');
const recommendationRoutes = require('../routes/recommendationRoutes');
const placeRoutes = require('../routes/placeRoutes');
const bookmarkRoutes = require('../routes/bookmarkRoutes');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: [
          'http://localhost:3000',  // React dev server
          'http://localhost:5173',  // Vite dev server
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173'
        ],
        credentials: true,
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'Cookie'],
        additionalHeaders: ['X-Requested-With'],
        exposedHeaders: ['Set-Cookie']
      }
    },
    state: {
      strictHeader: false,
      ignoreErrors: true,
      clearInvalid: true
    }
  });

  // Register plugins
  await server.register([
    Jwt,
    Inert
  ]);

  // Configure static file serving for images
  server.route({
    method: 'GET',
    path: '/gambar_data/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '../public/gambar_data'),
        redirectToSlash: true,
        index: false
      }
    }
  });

  // FIXED: Proper JWT strategy configuration with consistent credential mapping
  server.auth.strategy('jwt', 'jwt', {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 86400, // 24 hours
      timeSkewSec: 15,
    },
    validate: async (artifacts, request, h) => {
      try {
        console.log('JWT validation - full artifacts:', JSON.stringify(artifacts, null, 2));
        console.log('JWT validation - payload:', artifacts.decoded.payload);
        
        const payload = artifacts.decoded.payload;
        
        // Ensure we have required fields
        if (!payload.userId) {
          console.error('JWT validation failed: No userId in token payload');
          return { isValid: false };
        }

        console.log('JWT validation successful - userId:', payload.userId);

        // FIXED: Set credentials with consistent mapping
        // Make sure both 'id' and 'userId' are available for compatibility
        return {
          isValid: true,
          credentials: {
            id: payload.userId,        // Map userId to id for compatibility
            userId: payload.userId,    // Keep original userId
            email: payload.email,
            username: payload.username,
            // Keep the full payload for any legacy code
            user: payload
          }
        };
      } catch (error) {
        console.error('JWT validation error:', error);
        return { isValid: false };
      }
    },
  });

  // Extract token from Authorization header
  server.ext('onRequest', (request, h) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      request.headers.authorization = `Bearer ${token}`;
      console.log('Token extracted from Authorization header');
    }
    return h.continue;
  });

  // Add error handling for invalid cookies
  server.ext('onPreAuth', (request, h) => {
    if (request.state && Object.keys(request.state).length > 0) {
      try {
        const testState = request.state;
      } catch (error) {
        console.warn('Invalid cookie detected, clearing:', error.message);
        request.state = {};
      }
    }
    return h.continue;
  });

  // Enhanced error handling with detailed logging
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    
    if (response.isBoom) {
      // Log authentication errors specifically
      if (response.output.statusCode === 401) {
        console.error('Authentication error:', {
          path: request.path,
          method: request.method,
          headers: request.headers.authorization ? 'Bearer present' : 'No auth header',
          error: response.message
        });
      }
      
      // Handle JWT validation errors specifically
      if (response.message && (response.message.includes('Invalid token') || response.message.includes('Missing authentication'))) {
        console.warn('JWT validation failed:', response.message);
        return h.response({
          status: 'fail',
          message: 'User ID not found.'
        }).code(400);
      }
      
      console.error('Server error:', {
        statusCode: response.output.statusCode,
        error: response.output.payload.error,
        message: response.message,
        path: request.path,
        method: request.method
      });
      
      return h.response({
        status: 'error',
        message: response.message || 'Internal server error'
      }).code(response.output.statusCode || 500);
    }
    
    return h.continue;
  });

  // Register route groups
  await server.register([
    { plugin: authRoutes },
    { plugin: resetPasswordRoutes },
    { plugin: ratingRoutes },
    { plugin: reviewRoutes },
    { plugin: recommendationRoutes },
    { plugin: placeRoutes },
    { plugin: bookmarkRoutes },
  ]);

  console.log('✅ Server configured with fixed JWT strategy');
  return server;
};

module.exports = createServer;