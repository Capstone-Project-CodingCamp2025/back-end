const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByUsername } = require('../models/User');
const { JWT_SECRET } = process.env;

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (await findUserByUsername(username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await createUser({ username, passwordHash });
  res.status(201).json({ userId, username });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await findUserByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.pasword))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
};
