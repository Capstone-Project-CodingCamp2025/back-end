const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, username }
    next();
  } catch {
    res.status(403).json({ message: 'Forbidden' });
  }
};

module.exports = authenticateJWT;
