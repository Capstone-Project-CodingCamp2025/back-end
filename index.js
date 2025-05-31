const createServer = require('./config/server');

const startServer = async () => {
  const server = await createServer();
  await server.start();
  console.log(`✅ Server running on ${server.info.uri}`);
};

startServer();
