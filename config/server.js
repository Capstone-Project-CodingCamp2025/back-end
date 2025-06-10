// Update file server utama Anda (biasanya server.js atau index.js)
require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');

const authRoutes = require('../routes/authRoutes');
const ratingRoutes = require('../routes/ratingRoutes');
const reviewRoutes = require('../routes/reviewRoutes');
const recommendationRoutes = require('../routes/recommendationRoutes');
const placeRoutes = require('../routes/placeRoutes');
const bookmarkRoutes = require('../routes/bookmarkRoutes'); // TAMBAHKAN INI

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:5173'],
        credentials: true,
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['X-Requested-With']
      }
    },
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
    { plugin: reviewRoutes },
    { plugin: recommendationRoutes },
    { plugin: placeRoutes },
    { plugin: bookmarkRoutes }, // TAMBAHKAN INI
  ]);

  return server;
};

module.exports = createServer;