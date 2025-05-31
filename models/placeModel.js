const pool = require('../config/db');

const getPlacesByNames = async (names) => {
  const placeholders = names.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, nama_tempat AS name, thumbnail AS image, rating_avg AS rating, alamat AS location
     FROM places WHERE nama_tempat IN (${placeholders})`,
    names
  );
  return rows;
};

const getPopularPlaces = async (limit = 20) => {
  const [rows] = await pool.query(
    `SELECT id, nama_tempat AS name, thumbnail AS image, rating_avg AS rating,
            jumlah_ulasan AS reviewCount, alamat AS location, price
     FROM places
     ORDER BY rating_avg DESC, jumlah_ulasan DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
};

module.exports = { getPlacesByNames, getPopularPlaces };
