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

      // Buat tabel users
      const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX (username),
          INDEX (email)
        )
      `;
      await db.query(createUsersTableQuery);
      console.log('Tabel `users` siap.');

      // Buat tabel user_bookmarks
      const createBookmarksTableQuery = `
        CREATE TABLE IF NOT EXISTS user_bookmarks (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          place_id INT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id),
          INDEX (place_id)
        )
      `;
      await db.query(createBookmarksTableQuery);
      console.log('Tabel `user_bookmarks` siap.');

      // Buat tabel user_preferences
      const createPreferencesTableQuery = `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          place_id INT NOT NULL,
          rating INT DEFAULT NULL,
          comment TEXT DEFAULT NULL,
          visited_at DATE DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX (user_id),
          INDEX (place_id)
        )
      `;
      await db.query(createPreferencesTableQuery);
      console.log('Tabel `user_preferences` siap.');

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
