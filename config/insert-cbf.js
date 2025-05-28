const fs = require('fs');
const csv = require('csv-parser');
const pool = require('/mnt/d/Projek/Capstone DBS/back-end/config/db.js');

fs.createReadStream('/mnt/d/Projek/Capstone DBS/machine-learning/dataset/CBF_Cleaned.csv')
  .pipe(csv())
  .on('data', async row => {
    await pool.query(
      `INSERT INTO places 
        (nama_tempat, rating_avg, jumlah_ulasan, alamat, link, thumbnail, kategori, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.nama_tempat, row.rating, row.jumlah_ulasan, row.alamat,
       row.link, row.thumbnail, row.kategori, row.content]
    );
  });
