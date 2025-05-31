const db = require("../config/db");

const findUserByUsername = (username, callback) => {
  db.query("SELECT * FROM users WHERE username = ?", [username], callback);
};

const createUser = (username, password, callback) => {
  db.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    callback
  );
};

module.exports = {
  findUserByUsername,
  createUser,
};
