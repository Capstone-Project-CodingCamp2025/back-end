// config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASS = '',
  DB_NAME = ''
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.on('connection', () => {
  console.log('New MySQL connection established');
});

pool.on('acquire', () => {
  console.log('Connection acquired from pool');
});

pool.on('release', () => {
  console.log('Connection released back to pool');
});

module.exports = pool;