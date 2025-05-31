const Jwt = require('@hapi/jwt');
const { accessTokenSecret } = require('../config/jwt');

const registerJwtStrategy = async (server) => {
  await server.register(Jwt);

  server.auth.strategy('jwt', 'jwt', {
    keys: accessTokenSecret,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: 3600,
    },
    validate: (artifacts) => {
      return {
        isValid: true,
        credentials: { user: artifacts.decoded.payload },
      };
    },
  });

  server.auth.default('jwt');
};

module.exports = registerJwtStrategy;
