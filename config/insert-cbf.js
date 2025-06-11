const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db'); // mysql2/promise
const rows = [];

// Baca file CSV
fs.createReadStream('/mnt/d/Projek/Capstone DBS/machine-learning/etl_pipeline/transformed.csv')
  .pipe(csv())
  .on('data', (row) => rows.push(row))
  .on('end', async () => {
    try {
      // Tabel places
      const createPlacesTableQuery = `
        CREATE TABLE IF NOT EXISTS places (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama_tempat VARCHAR(255) DEFAULT NULL,
          deskripsi TEXT DEFAULT NULL,
          kategori VARCHAR(100) DEFAULT NULL,
          rating FLOAT DEFAULT NULL,
          jumlah_ulasan INT DEFAULT NULL,
          alamat TEXT DEFAULT NULL,
          link TEXT DEFAULT NULL,
          thumbnail TEXT DEFAULT NULL,
          gambar TEXT DEFAULT NULL
        )
      `;
      await db.query(createPlacesTableQuery);
      console.log('✅ Tabel `places` siap.');

      // Tabel users
      const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX (username),
          INDEX (email)
        )
      `;
      await db.query(createUsersTableQuery);
      console.log('✅ Tabel `users` siap.');

      // Tabel user_bookmarks
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
      console.log('✅ Tabel `user_bookmarks` siap.');

      // Tabel user_preferences
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
      console.log('✅ Tabel `user_preferences` siap.');

      // Tabel password_reset_tokens
      const createPasswordTokensQuery = `
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          expires_at DATETIME NOT NULL,
          used TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX (email),
          INDEX (otp),
          INDEX (expires_at)
        )
      `;
      await db.query(createPasswordTokensQuery);
      console.log('✅ Tabel `password_reset_tokens` siap.');

      // Insert data ke tabel places
      let inserted = 0;
      for (const [index, row] of rows.entries()) {
        const insertQuery = `
          INSERT INTO places 
            (nama_tempat, deskripsi, kategori, rating, jumlah_ulasan, alamat, link, thumbnail, gambar)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          row.nama_tempat || null,
          row.deskripsi || null,
          row.kategori || null,
          parseFloat(row.rating) || null,
          parseInt(row.jumlah_ulasan) || null,
          row.alamat || null,
          row.link || null,
          row.thumbnail || null,
          row.gambar || null
        ];

        try {
          await db.query(insertQuery, values);
          inserted++;
        } catch (err) {
          console.error(`❌ Gagal insert data baris ${index + 1}:`, err.message);
        }
      }

      console.log(`✅ Selesai insert ${inserted} data ke tabel places.`);
    } catch (err) {
      console.error('❌ Terjadi error:', err.message);
    } finally {
      await db.end();
    }
  });
