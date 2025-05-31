// services/placeService.js

const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ================================================================
// normalizeFolderName:
//   - Hanya menghapus karakter non-alfanumerik (kecuali underscore/spasi),
//   - Ganti spasi → underscore,
//   - **Tidak men‐lowercase** agar case-sensitivity folder di Linux bisa match.
//   Misal: "Air Terjun Pelangi Indah" → "Air_Terjun_Pelangi_Indah"
// ================================================================
function normalizeFolderName(namaTempat) {
  if (!namaTempat || !namaTempat.trim()) {
    return 'default';
  }
  return namaTempat
    .replace(/[^a-zA-Z0-9\s_]/g, '')  // hanya a–z, A–Z, 0–9, spasi, underscore
    .replace(/\s+/g, '_')             // spasi → underscore
    .trim();
}

// ================================================================
// checkImageExists:
//   Cek apakah file fisik “public/<relativePath>” benar-benar ada.
//   imageUrlPath: misal "/image/FolderName/namafile.ext"
// ================================================================
function checkImageExists(imageUrlPath) {
  try {
    const relativePath = imageUrlPath.replace(/^\//, ''); // buang leading slash
    const fullPath = path.join(__dirname, '..', 'public', relativePath);
    return fs.existsSync(fullPath);
  } catch (err) {
    console.error('Error checking image existence:', err);
    return false;
  }
}

// ================================================================
// findFileByBasename:
//   Cari di folder <public>/image/<folderName>/ file yang basename-nya == baseName.
//   Contoh: baseName="AC9h4nrOJwOx9Jm3AZ4Vv4Nk1T9dI..."
//   Jika di folder ada "AC9h4nrOJwOx9Jm3AZ4Vv4Nk1T9dI....jpg" atau ".png", return nama file lengkapnya.
//   Jika banyak ekstensi, kita prioritaskan ".jpg" → ".jpeg" → ".png" → ".webp" → ... 
// ================================================================
function findFileByBasename(folderName, baseName) {
  try {
    const folderPath = path.join(__dirname, '..', 'public', 'image', folderName);
    if (!fs.existsSync(folderPath)) {
      return null;
    }

    const allFiles = fs.readdirSync(folderPath);
    // Filter hanya file gambar
    const imageFiles = allFiles.filter(fn =>
      /\.(jpe?g|png|gif|webp)$/i.test(fn)
    );

    // Buat map: key = lowercase basename tanpa ekstensi, value = array file‐nya
    const mapByBasename = {};
    imageFiles.forEach(file => {
      const ext = path.extname(file);              // ".jpg" / ".png"
      const nameOnly = path.basename(file, ext);   // e.g. "AC9h4nrOJwOx9Jm3AZ4Vv4Nk1T9dI..."
      const key = nameOnly.toLowerCase();
      if (!mapByBasename[key]) mapByBasename[key] = [];
      mapByBasename[key].push(file);
    });

    const targetKey = baseName.toLowerCase();
    if (!mapByBasename[targetKey]) {
      return null;
    }

    // Jika ada beberapa file dengan basename sama, pilih berdasarkan prioritas ekstensi
    const candidates = mapByBasename[targetKey];
    const priorityExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    for (const ext of priorityExt) {
      const found = candidates.find(fn => path.extname(fn).toLowerCase() === ext);
      if (found) return found;
    }
    // Jika tidak ada yang match prioritas, return file pertama saja
    return candidates[0];
  } catch (err) {
    console.error('Error in findFileByBasename:', err);
    return null;
  }
}

// ================================================================
// getFirstImageInFolder:
//   Jika tidak ada thumbnail, atau thumbnail tidak ditemukan, 
//   cari satu‐satu file gambar di folder <public>/image/<folderName>/
//   dan return URL "/image/<folderName>/<namaFilePertama>"
// ================================================================
function getFirstImageInFolder(namaTempat) {
  try {
    if (!namaTempat || !namaTempat.trim()) return null;

    const folderName = normalizeFolderName(namaTempat);
    const folderPath = path.join(__dirname, '..', 'public', 'image', folderName);

    if (!fs.existsSync(folderPath)) {
      return null;
    }

    const allFiles = fs.readdirSync(folderPath);
    const imageFiles = allFiles.filter(fn =>
      /\.(jpe?g|png|gif|webp)$/i.test(fn)
    );

    if (imageFiles.length > 0) {
      // Contohnya kita pakai file pertama:
      return `/image/${folderName}/${imageFiles[0]}`;
    }

    return null;
  } catch (err) {
    console.error('Error getting first image in folder:', err);
    return null;
  }
}

// ================================================================
// generateImagePathWithFallback:
//   1) Jika `thumbnail` ada di DB (walau tanpa ekstensi), 
//      coba findFileByBasename di folder.
//   2) Kalau ditemukan file → return "/image/<folderName>/<fileName>"
//   3) Kalau tidak, coba getFirstImageInFolder.
//   4) Kalau tetap null → return "/image/default/default.jpg"
// ================================================================
function generateImagePathWithFallback(namaTempat, thumbnail) {
  // 1) Jika ada field thumbnail (walau tanpa ekstensi), cari file di folder
  if (thumbnail && thumbnail.trim()) {
    const folderName = normalizeFolderName(namaTempat);
    const foundFileName = findFileByBasename(folderName, thumbnail.trim());

    if (foundFileName) {
      return `/image/${folderName}/${foundFileName}`;
    }
    // Jika findFileByBasename null, lanjut ke getFirstImageInFolder
  }

  // 2) Jika thumbnail kosong / not found → cari gambar pertama di folder
  if (namaTempat && namaTempat.trim()) {
    const firstImage = getFirstImageInFolder(namaTempat);
    if (firstImage) {
      return firstImage;
    }
  }

  // 3) Jika masih null → fallback default
  return '/image/default/default.jpg';
}

// ================================================================
// formatPrice: (sama seperti sebelumnya)
// ================================================================
const formatPrice = (kategori) => {
  const priceMap = {
    'Museum': 'Rp 5.000 - Rp 15.000',
    'Pantai': 'Gratis',
    'Gunung': 'Rp 10.000 - Rp 25.000',
    'Taman': 'Gratis',
    'Candi': 'Rp 5.000 - Rp 30.000',
    'Wisata Alam': 'Rp 5.000 - Rp 20.000'
  };
  return priceMap[kategori] || 'Gratis';
};

// ================================================================
// getPopular: query DB, lalu generate image via helper di atas
// ================================================================
const getPopular = (limit) => {
  return new Promise((resolve, reject) => {
    try {
      if (!limit || limit <= 0) limit = 12;
      const query = `
        SELECT
          id,
          nama_tempat,
          alamat,
          thumbnail,
          rating_avg,
          jumlah_ulasan,
          kategori,
          link
        FROM places
        WHERE rating_avg IS NOT NULL
          AND rating_avg > 0
          AND nama_tempat IS NOT NULL
        ORDER BY rating_avg DESC, jumlah_ulasan DESC
        LIMIT ?;
      `;

      db.query(query, [limit], (err, results) => {
        if (err) {
          console.error('Database query error:', err);
          return reject(new Error('Database query failed: ' + err.message));
        }
        if (results.length === 0) {
          return resolve([]);
        }

        const formatted = results.map(place => {
          const imageUrl = generateImagePathWithFallback(place.nama_tempat, place.thumbnail);
          const price = formatPrice(place.kategori);

          return {
            id: place.id,
            name: place.nama_tempat || 'Unknown Place',
            location: place.alamat || 'Unknown Location',
            image: imageUrl,              // misal: "/image/Adipura_Monument/foto1.jpg"
            rating: parseFloat(place.rating_avg) || 0,
            reviewCount: parseInt(place.jumlah_ulasan) || 0,
            price: price,
            category: place.kategori || 'Wisata',
            link: place.link || ''
          };
        });

        resolve(formatted);
      });
    } catch (err) {
      console.error('Error in getPopular service:', err);
      reject(new Error('Failed to fetch popular destinations: ' + err.message));
    }
  });
};

// ================================================================
// (BONUS) Fungsi rekomendasi CBF / CF / Hybrid tetap sama seperti sebelumnya.
// ================================================================

const tf = require('@tensorflow/tfjs-node');
let cbfModel, itemFeatures, placeNames, ratingNames;
(async () => {
  try {
    cbfModel = await tf.loadGraphModel('file:///mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/tfjs_model/model.json');
    itemFeatures = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/item_features.json'));
    placeNames   = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/place_names.json'));
    ratingNames  = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CBF/place_ratings.json'));
    console.log('CBF Model loaded successfully');
  } catch (e) {
    console.error('Error loading CBF model:', e);
  }
})();
let cfModel, userMap, itemMap;
(async () => {
  try {
    cfModel = await tf.loadGraphModel('file:///mnt/d/Projek/Capstone DBS/machine-learning/model/CF/tfjs_model/model.json');
    userMap = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CF/user_encoder.json'));
    itemMap = JSON.parse(fs.readFileSync('/mnt/d/Projek/Capstone DBS/machine-learning/model/CF/item_encoder.json'));
    console.log('CF Model loaded successfully');
  } catch (e) {
    console.error('Error loading CF model:', e);
  }
})();

function recommendCBF(topK = 5) {
  try {
    const sims = itemFeatures.map(() => Math.random());
    return placeNames.slice(0, topK);
  } catch (error) {
    console.error('Error in recommendCBF:', error);
    throw new Error('Failed to generate CBF recommendations');
  }
}

async function recommendHybrid(userId, topK = 5) {
  try {
    const uIdx = userMap[userId];
    if (uIdx === undefined) throw new Error('User not found in CF model');

    const itemIds = Object.keys(itemMap);
    const preds = await Promise.all(itemIds.map(async itemId => {
      const iIdx = itemMap[itemId];
      const pred = await cfModel.predict({
        user_idx: tf.tensor([uIdx]),
        item_idx: tf.tensor([iIdx])
      });
      return { itemId, score: pred.dataSync()[0] };
    }));

    return preds
      .sort((a,b) => b.score - a.score)
      .slice(0, topK)
      .map(p => p.itemId);
  } catch (error) {
    console.error('Error in recommendHybrid:', error);
    throw new Error('Failed to generate hybrid recommendations');
  }
}

const getRecommendations = async (user, useCollaborative = false) => {
  try {
    if (useCollaborative && user) {
      const recos = await recommendHybrid(user.id);
      return { recos, type: 'collaborative' };
    } else {
      const recos = recommendCBF();
      return { recos, type: 'content-based' };
    }
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    throw new Error('Failed to generate recommendations: ' + error.message);
  }
};

const testDatabaseConnection = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT COUNT(*) as total FROM places', (err, results) => {
      if (err) {
        console.error('Database test failed:', err);
        reject(err);
      } else {
        console.log('Database test successful. Total places:', results[0].total);
        resolve(results[0].total);
      }
    });
  });
};

module.exports = {
  recommendCBF,
  recommendHybrid,
  getPopular,
  getRecommendations,
  testDatabaseConnection
};
