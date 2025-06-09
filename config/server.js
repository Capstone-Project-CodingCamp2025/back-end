require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert'); // ADD THIS for static files
const path = require('path');

const authRoutes = require('../routes/authRoutes');
const ratingRoutes = require('../routes/ratingRoutes');
const recommendationRoutes = require('../routes/recommendationRoutes');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:5175'],
        credentials: true
      }
    },
  });

  // Register plugins
  await server.register([
    Jwt,
    Inert // ADD THIS - needed for static file serving
  ]);

  // Configure static file serving for images
  server.route({
    method: 'GET',
    path: '/gambar_data/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '../public/gambar_data'), // Adjust path as needed
        redirectToSlash: true,
        index: false
      }
    }
  });

  // Register jwt strategy
  server.auth.strategy('jwt', 'jwt', {
    keys: process.env.JWT_SECRET,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      nbf: true,
      exp: true,
      maxAgeSec: 14400,
      timeSkewSec: 15,
    },
    validate: async (artifacts, request, h) => {
      return {
        isValid: true,
        credentials: artifacts.decoded.payload,
      };
    },
  });

  // Register route groups
  await server.register([
    { plugin: authRoutes },
    { plugin: ratingRoutes },
    { plugin: recommendationRoutes },
  ]);

  return server;
};

module.exports = createServer;