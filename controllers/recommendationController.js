const { recommendCBF, recommendHybrid } = require('../services/recommendationService');
const pool = require('../config/db'); // tambahkan koneksi db

exports.getRecommendations = async (req, res) => {
  if (!req.user) {
    // guest: pure CBF
    const names = recommendCBF(); // misalnya: ["Wisata Alam Datuk", "Taman Wisata...", ...]

    // ambil detail dari database berdasarkan nama_tempat
    const placeholders = names.map(() => '?').join(','); // ?,?,?
    const [rows] = await pool.query(
      `SELECT 
         id,
         nama_tempat AS name,
         thumbnail AS image,
         rating_avg AS rating,
         alamat AS location
       FROM places
       WHERE nama_tempat IN (${placeholders})`,
      names
    );

    // urutkan sesuai urutan dari model
    const ordered = names.map(name => rows.find(r => r.name === name)).filter(Boolean);

    return res.json({ mode: 'CBF', recos: ordered });
  }

  if (!req.hasEnoughRatings) {
    return res.status(400).json({ message: 'Submit ratings for 5 places first.' });
  }

  // hybrid
  const itemNames = await recommendHybrid(req.user.userId); // hasil: ["Wisata Alam Datuk", ...] juga
  const placeholders = itemNames.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT 
       id,
       nama_tempat AS name,
       thumbnail AS image,
       rating_avg AS rating,
       alamat AS location
     FROM places
     WHERE nama_tempat IN (${placeholders})`,
    itemNames
  );

  const ordered = itemNames.map(name => rows.find(r => r.name === name)).filter(Boolean);
  res.json({ mode: 'Hybrid CBF+CF', recos: ordered });
};
