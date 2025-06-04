// services/placeService.js

const fs = require('fs');
const path = require('path');
const db = require('../config/db'); // Ini adalah Promise Pool

// Utility functions (tetap sama)
function normalizeFolderName(namaTempat) {
  if (!namaTempat || !namaTempat.trim()) {
    return 'default';
  }
  return namaTempat
    .replace(/[^a-zA-Z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function checkImageExists(imageUrlPath) {
  try {
    const relativePath = imageUrlPath.replace(/^\//, '');
    const fullPath = path.join(__dirname, '..', 'public', relativePath);
    return fs.existsSync(fullPath);
  } catch (err) {
    console.error('Error checking image existence:', err);
    return false;
  }
}

function findFileByBasename(folderName, baseName) {
  try {
    const folderPath = path.join(__dirname, '..', 'public', 'image', folderName);
    if (!fs.existsSync(folderPath)) {
      return null;
    }

    const allFiles = fs.readdirSync(folderPath);
    const imageFiles = allFiles.filter(fn =>
      /\.(jpe?g|png|gif|webp)$/i.test(fn)
    );

    const mapByBasename = {};
    imageFiles.forEach(file => {
      const ext = path.extname(file);
      const nameOnly = path.basename(file, ext);
      const key = nameOnly.toLowerCase();
      if (!mapByBasename[key]) mapByBasename[key] = [];
      mapByBasename[key].push(file);
    });

    const targetKey = baseName.toLowerCase();
    if (!mapByBasename[targetKey]) {
      return null;
    }

    const candidates = mapByBasename[targetKey];
    const priorityExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    for (const ext of priorityExt) {
      const found = candidates.find(fn => path.extname(fn).toLowerCase() === ext);
      if (found) return found;
    }
    return candidates[0];
  } catch (err) {
    console.error('Error in findFileByBasename:', err);
    return null;
  }
}

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
      return `/image/${folderName}/${imageFiles[0]}`;
    }

    return null;
  } catch (err) {
    console.error('Error getting first image in folder:', err);
    return null;
  }
}

function generateImagePathWithFallback(namaTempat, thumbnail) {
  if (thumbnail && thumbnail.trim()) {
    const folderName = normalizeFolderName(namaTempat);
    const foundFileName = findFileByBasename(folderName, thumbnail.trim());

    if (foundFileName) {
      return `/image/${folderName}/${foundFileName}`;
    }
  }

  if (namaTempat && namaTempat.trim()) {
    const firstImage = getFirstImageInFolder(namaTempat);
    if (firstImage) {
      return firstImage;
    }
  }

  return '/image/default/default.jpg';
}

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

// PERBAIKAN UTAMA: Gunakan Promise Pool (tanpa callback)
const getPopular = async (limit = 12) => {
  try {
    console.log('Executing database query with limit:', limit);
    
    // Test koneksi database terlebih dahulu
    await testDatabaseConnection();
    
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

    // Gunakan promise pool - TIDAK PAKAI CALLBACK!
    const [results] = await db.query(query, [limit]);

    console.log('Raw database results:', results.length, 'rows');
    
    if (results.length === 0) {
      console.log('No results found from database');
      return [];
    }

    console.log('Sample raw result:', results[0]);

    const formatted = results.map(place => {
      const imageUrl = generateImagePathWithFallback(place.nama_tempat, place.thumbnail);
      const price = formatPrice(place.kategori);

      const formattedPlace = {
        id: place.id,
        name: place.nama_tempat || 'Unknown Place',
        location: place.alamat || 'Unknown Location',
        image: imageUrl,
        rating: parseFloat(place.rating_avg) || 0,
        reviewCount: parseInt(place.jumlah_ulasan) || 0,
        price: price,
        category: place.kategori || 'Wisata',
        link: place.link || ''
      };
      
      return formattedPlace;
    });

    console.log('Formatted results:', formatted.length, 'items');
    console.log('Sample formatted result:', formatted[0]);

    return formatted;
  } catch (err) {
    console.error('Error in getPopular service:', err);
    throw new Error('Failed to fetch popular destinations: ' + err.message);
  }
};

// Test database connection function - GUNAKAN PROMISE POOL
const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Gunakan promise pool - TIDAK PAKAI CALLBACK!
    const [result] = await db.query('SELECT COUNT(*) as total FROM places');

    console.log('Database test successful. Total places:', result[0].total);
    
    if (result[0].total === 0) {
      console.warn('WARNING: No data found in places table!');
    }
    
    return result[0].total;
  } catch (err) {
    console.error('Database connection test failed:', err);
    throw new Error('Database connection failed: ' + err.message);
  }
};

// Recommendation functions (simplified for debugging)
const recommendCBF = (topK = 5) => {
  try {
    // Simplified implementation for testing
    console.log('CBF recommendation called');
    return ['Place 1', 'Place 2', 'Place 3', 'Place 4', 'Place 5'].slice(0, topK);
  } catch (error) {
    console.error('Error in recommendCBF:', error);
    throw new Error('Failed to generate CBF recommendations');
  }
};

const getRecommendations = async (user, useCollaborative = false) => {
  try {
    console.log('getRecommendations called with:', { user: !!user, useCollaborative });
    
    if (useCollaborative && user) {
      // For now, return CBF as hybrid is complex
      const recos = recommendCBF();
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

module.exports = {
  recommendCBF,
  getPopular,
  getRecommendations,
  testDatabaseConnection
};