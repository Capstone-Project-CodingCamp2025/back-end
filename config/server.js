require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

const authRoutes = require('../routes/authRoutes');
const ratingRoutes = require('../routes/ratingRoutes');
const recommendationRoutes = require('../routes/recommendationRoutes');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:5173'],
        credentials: true
      }
    },
  });

  // Register plugin jwt dulu
  await server.register(Jwt);

  // Daftarkan strategy jwt
  server.auth.strategy('jwt', 'jwt', {
    keys: process.env.JWT_SECRET, // pastikan .env ada JWT_SECRET
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
        credentials: artifacts.decoded.payload, // bisa kamu sesuaikan
      };
    },
  });

  // Kalau mau semua route pakai jwt auth secara default:
  // server.auth.default('jwt');

  // Register route groups
  await server.register([
    { plugin: authRoutes },
    { plugin: ratingRoutes },
    { plugin: recommendationRoutes },
  ]);

  return server;
};

module.exports = createServer;
