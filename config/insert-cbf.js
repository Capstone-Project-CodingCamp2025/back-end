const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db'); // pastikan db.js ada di folder yang sama

const rows = [];

// Langkah 1: Baca CSV
fs.createReadStream('/mnt/d/Projek/Capstone DBS/machine-learning/dataset/CBF_Cleaned.csv')
  .pipe(csv())
  .on('data', (row) => {
    rows.push(row);
  })
  .on('end', () => {
    // Langkah 2: Buat tabel jika belum ada
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS places (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_tempat VARCHAR(255),
        rating_avg FLOAT,
        jumlah_ulasan INT,
        alamat TEXT,
        link TEXT,
        thumbnail TEXT,
        kategori VARCHAR(100),
        content TEXT
      )
    `;

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error('Gagal membuat tabel:', err);
        db.end();
        return;
      }

      console.log('Tabel `places` siap.');

      // Langkah 3: Masukkan data CSV ke tabel
      let inserted = 0;

      rows.forEach((row, index) => {
        const query = `
          INSERT INTO places 
            (nama_tempat, rating_avg, jumlah_ulasan, alamat, link, thumbnail, kategori, content)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          row.nama_tempat,
          parseFloat(row.rating),
          parseInt(row.jumlah_ulasan),
          row.alamat,
          row.link,
          row.thumbnail,
          row.kategori,
          row.content,
        ];

        db.query(query, values, (err) => {
          if (err) {
            console.error(`Gagal insert data baris ${index + 1}:`, err);
          } else {
            inserted++;
            if (inserted === rows.length) {
              console.log(`✅ Selesai insert ${inserted} data ke tabel places.`);
              db.end(); // tutup koneksi
            }
          }
        });
      });
    });
  });
