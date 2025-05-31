const Hapi = require("@hapi/hapi");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: "localhost",
        routes: {
            cors: {
                origin: ["*"],
            },
            payload: {
                parse: true,
                allow: 'application/json'
            }
            },
        });

  server.route(authRoutes);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

init();
