// middleware/optionalAuth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload; // bisa dipakai di controller
    } catch (err) {
      // Token tidak valid, anggap saja belum login
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = optionalAuth;
