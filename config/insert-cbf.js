const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db'); // pastikan ini adalah mysql2/promise
const rows = [];

// Baca file CSV
fs.createReadStream('/mnt/d/Projek/Capstone DBS/machine-learning/etl_pipeline/transformed.csv')
  .pipe(csv())
  .on('data', (row) => {
    rows.push(row);
  })
  .on('end', async () => {
    try {
      // Buat tabel places
      const createPlacesTableQuery = `
        CREATE TABLE IF NOT EXISTS places (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama_tempat VARCHAR(255),
          deskripsi TEXT,
          kategori VARCHAR(100),
          rating FLOAT,
          jumlah_ulasan INT,
          alamat TEXT,
          link TEXT,
          thumbnail TEXT,
          gambar TEXT
        )
      `;

      await db.query(createPlacesTableQuery);
      console.log('Tabel `places` siap.');

      // Buat tabel user_place_interactions
      const createInteractionsTableQuery = `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          place_id INT NOT NULL,
          rating INT DEFAULT NULL,
          liked TINYINT(1) DEFAULT NULL,
          visited_at DATE DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id),
          INDEX (place_id)
        )
      `;

      await db.query(createInteractionsTableQuery);
      console.log('Tabel `user_place_interactions` siap.');

      // Masukkan data ke tabel places
      let inserted = 0;
      for (const [index, row] of rows.entries()) {
        const insertQuery = `
          INSERT INTO places 
            (nama_tempat, deskripsi, kategori, rating, jumlah_ulasan, alamat, link, thumbnail, gambar)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          row.nama_tempat,
          row.deskripsi,
          row.kategori,
          parseFloat(row.rating),
          parseInt(row.jumlah_ulasan),
          row.alamat,
          row.link,
          row.thumbnail,
          row.gambar
        ];

        try {
          await db.query(insertQuery, values);
          inserted++;
        } catch (err) {
          console.error(`Gagal insert data baris ${index + 1}:`, err.message);
        }
      }

      console.log(`✅ Selesai insert ${inserted} data ke tabel places.`);
    } catch (err) {
      console.error('Terjadi error:', err.message);
    } finally {
      await db.end();
    }
  });
