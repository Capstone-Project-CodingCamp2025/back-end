const db = require('../config/db');
const {
  getFirstImageUrl,
  getImageUrlsFromDatabase,
  formatPrice
} = require('../utils/imageHelpers');

// Debug function to check database content
async function debugDatabase() {
  console.log('=== DATABASE DEBUG ===');
  
  try {
    // Check total places count
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM places');
    const totalPlaces = countResult[0]?.total || 0;
    console.log('Total places in database:', totalPlaces);
    
    // Check ID range
    const [rangeResult] = await db.query('SELECT MIN(id) as min_id, MAX(id) as max_id FROM places');
    const minId = rangeResult[0]?.min_id || 0;
    const maxId = rangeResult[0]?.max_id || 0;
    console.log('ID range:', { min: minId, max: maxId });
    
    // Get all available IDs
    const [idResult] = await db.query('SELECT id FROM places ORDER BY id');
    const availableIds = idResult.map(row => row.id);
    console.log('Available IDs (first 20):', availableIds.slice(0, 20));
    console.log('Available IDs (last 20):', availableIds.slice(-20));
    
    // Check some sample places
    const [sampleResult] = await db.query('SELECT id, nama_tempat FROM places ORDER BY id LIMIT 10');
    console.log('Sample places:', sampleResult);
    
    return {
      total: totalPlaces,
      range: { min: minId, max: maxId },
      availableIds: availableIds,
      samples: sampleResult
    };
  } catch (error) {
    console.error('❌ Database debug error:', error);
    return {
      total: 0,
      range: { min: 0, max: 0 },
      availableIds: [],
      samples: []
    };
  }
}

async function getPopularId(id) {
  console.log('=== GET PLACE BY ID MODEL DEBUG ===');
  console.log('Requested ID:', id, 'Type:', typeof id);
  
  // Convert to integer for safety
  const placeId = parseInt(id);
  if (isNaN(placeId)) {
    console.log('❌ Invalid ID format:', id);
    throw new Error('ID tempat harus berupa angka');
  }
  
  // Debug database first
  const dbInfo = await debugDatabase();
  console.log('Database info:', dbInfo);
  
  try {
    const sql = `
      SELECT id, nama_tempat, deskripsi, alamat, thumbnail, gambar,
             rating, jumlah_ulasan, kategori, link
      FROM places 
      WHERE id = ?`;
    
    console.log('Executing SQL:', sql);
    console.log('With parameter:', placeId);
    
    const [rows] = await db.query(sql, [placeId]);
    console.log('Query result rows:', rows.length);
    
    if (rows.length === 0) {
      console.log('❌ No place found with ID:', placeId);
      
      // Return error with helpful information
      const error = new Error(`Tempat dengan ID ${placeId} tidak ditemukan`);
      error.statusCode = 404;
      error.availableIds = dbInfo.availableIds.slice(0, 20); // First 20 IDs
      error.totalPlaces = dbInfo.total;
      error.idRange = dbInfo.range;
      throw error;
    }
    
    const place = rows[0];
    console.log('✅ Found place:', place.nama_tempat);
    
    // Handle image URLs safely
    let mainImage = '';
    let allImages = [];
    
    try {
      mainImage = getFirstImageUrl(place.gambar) || place.thumbnail || '';
      allImages = getImageUrlsFromDatabase(place.gambar) || [];
    } catch (imageError) {
      console.warn('⚠️ Image processing error:', imageError.message);
      mainImage = place.thumbnail || '';
      allImages = [];
    }
    
    return {
      id: place.id,
      name: place.nama_tempat,
      description: place.deskripsi || 'Deskripsi tidak tersedia',
      location: place.alamat,
      image: mainImage,
      gambar: mainImage, // For compatibility
      thumbnail: place.thumbnail,
      allImages: allImages,
      fullImage: place.gambar,
      rating: parseFloat(place.rating) || 0,
      reviewCount: parseInt(place.jumlah_ulasan) || 0,
      price: formatPrice ? formatPrice(place.kategori) : place.kategori,
      category: place.kategori,
      link: place.link || ''
    };
  } catch (error) {
    console.error('❌ Error in getPopularId:', error);
    
    // If it's already our custom error, rethrow it
    if (error.statusCode === 404) {
      throw error;
    }
    
    // For other errors, wrap them
    const wrappedError = new Error(`Database error: ${error.message}`);
    wrappedError.statusCode = 500;
    throw wrappedError;
  }
}

async function getPopular(limit = 12) {
  console.log('=== GET POPULAR PLACES DEBUG ===');
  console.log('Limit:', limit);
  
  try {
    const sql = `
      SELECT id, nama_tempat, deskripsi, alamat, thumbnail, gambar,
             rating, jumlah_ulasan, kategori, link
      FROM places
      WHERE rating > 0
      ORDER BY rating DESC, jumlah_ulasan DESC
      LIMIT ?`;
    
    const [rows] = await db.query(sql, [limit]);
    console.log('Raw database rows:', rows.length);
    
    const formatted = rows.map(r => {
      let mainImage = '';
      let allImages = [];
      
      try {
        mainImage = getFirstImageUrl(r.gambar) || r.thumbnail || '';
        allImages = getImageUrlsFromDatabase(r.gambar) || [];
      } catch (imageError) {
        console.warn('⚠️ Image processing error for place', r.id, ':', imageError.message);
        mainImage = r.thumbnail || '';
        allImages = [];
      }
      
      return {
        id:          r.id,
        name:        r.nama_tempat,
        description: r.deskripsi || 'Deskripsi tidak tersedia',
        location:    r.alamat,
        image:       mainImage,
        gambar:      mainImage,
        thumbnail:   r.thumbnail,
        allImages:   allImages,
        fullImage:   r.gambar,
        rating:      parseFloat(r.rating) || 0,
        reviewCount: parseInt(r.jumlah_ulasan) || 0,
        price:       formatPrice ? formatPrice(r.kategori) : r.kategori,
        category:    r.kategori,
        link:        r.link || ''
      };
    });
    
    console.log('Formatted popular places:', formatted.length);
    return formatted;
  } catch (error) {
    console.error('❌ Error getting popular places:', error);
    return [];
  }
}

async function getAllPlaces() {
  console.log('=== GET ALL PLACES DEBUG ===');
  
  try {
    const sql = `
      SELECT id, nama_tempat, deskripsi, alamat, thumbnail, gambar,
             rating, jumlah_ulasan, kategori, link
      FROM places
      ORDER BY id ASC`;
    
    const [rows] = await db.query(sql);
    console.log('Total places in database:', rows.length);
    
    // Show ID distribution
    const ids = rows.map(r => r.id);
    console.log('Available IDs count:', ids.length);
    console.log('First 10 IDs:', ids.slice(0, 10));
    console.log('Last 10 IDs:', ids.slice(-10));
    console.log('ID range:', Math.min(...ids), 'to', Math.max(...ids));
    
    const formatted = rows.map(r => {
      let mainImage = '';
      let allImages = [];
      
      try {
        mainImage = getFirstImageUrl(r.gambar) || r.thumbnail || '';
        allImages = getImageUrlsFromDatabase(r.gambar) || [];
      } catch (imageError) {
        console.warn('⚠️ Image processing error for place', r.id, ':', imageError.message);
        mainImage = r.thumbnail || '';
        allImages = [];
      }
      
      return {
        id:          r.id,
        name:        r.nama_tempat,
        description: r.deskripsi || 'Deskripsi tidak tersedia',
        location:    r.alamat,
        image:       mainImage,
        gambar:      mainImage,
        thumbnail:   r.thumbnail,
        allImages:   allImages,
        fullImage:   r.gambar,
        rating:      parseFloat(r.rating) || 0,
        reviewCount: parseInt(r.jumlah_ulasan) || 0,
        price:       formatPrice ? formatPrice(r.kategori) : r.kategori,
        category:    r.kategori,
        link:        r.link || ''
      };
    });
    
    return formatted;
  } catch (error) {
    console.error('❌ Error getting all places:', error);
    return [];
  }
}

module.exports = {
  getPopular,
  getAllPlaces,
  getPopularId,
  debugDatabase
};