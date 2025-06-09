const pool = require('../config/db');

async function saveInitialRatings(userId, ratings) {
  console.log('=== SAVE INITIAL RATINGS DEBUG ===');
  console.log('User ID (type, value):', typeof userId, userId);
  console.log('Ratings to save:', JSON.stringify(ratings, null, 2));
  
  // Pastikan userId valid
  if (!userId || isNaN(userId)) {
    throw new Error(`Invalid user ID: ${userId}`);
  }
  
  // Validasi setiap rating
  const validatedRatings = ratings.map(r => {
    if (!r.place_id || !r.rating) {
      throw new Error(`Invalid rating object: ${JSON.stringify(r)}`);
    }
    return {
      place_id: parseInt(r.place_id),
      rating: parseInt(r.rating)
    };
  });
  
  console.log('Validated ratings:', JSON.stringify(validatedRatings, null, 2));
  
  const sql = `
    INSERT INTO user_preferences (user_id, place_id, rating, visited_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      visited_at = NOW()
  `;
  
  try {
    // Gunakan transaction untuk memastikan atomicity
    await pool.query('START TRANSACTION');
    
    const promises = validatedRatings.map(async (r) => {
      console.log(`💾 Saving: user_id=${userId}, place_id=${r.place_id}, rating=${r.rating}`);
      const [result] = await pool.query(sql, [userId, r.place_id, r.rating]);
      console.log(`✅ Saved rating for place ${r.place_id}:`, result.affectedRows, 'rows affected');
      return result;
    });
    
    const results = await Promise.all(promises);
    await pool.query('COMMIT');
    
    console.log('✅ All ratings saved successfully');
    
    // Verifikasi hasil penyimpanan
    const [verifyRows] = await pool.query(
      'SELECT user_id, place_id, rating, visited_at FROM user_preferences WHERE user_id = ? ORDER BY visited_at DESC',
      [userId]
    );
    console.log('📊 Verified saved ratings for user', userId, ':', JSON.stringify(verifyRows, null, 2));
    
    return results;
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error saving ratings:', error);
    throw error;
  }
}

async function countUserRatings(userId) {
  console.log('=== COUNT USER RATINGS DEBUG ===');
  console.log('User ID (type, value):', typeof userId, userId);
  
  if (!userId) {
    console.log('❌ No user ID provided');
    return 0;
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    const count = rows[0]?.cnt || 0;
    console.log('📊 User ratings count:', count);
    return count;
  } catch (error) {
    console.error('❌ Error counting ratings:', error);
    return 0;
  }
}

async function getUserRatings(userId) {
  console.log('=== GET USER RATINGS DEBUG ===');
  console.log('User ID (type, value):', typeof userId, userId);
  
  if (!userId) {
    console.log('❌ No user ID provided');
    return [];
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT place_id, rating FROM user_preferences WHERE user_id = ? ORDER BY visited_at DESC',
      [userId]
    );
    console.log('📊 User ratings retrieved:', JSON.stringify(rows, null, 2));
    return rows;
  } catch (error) {
    console.error('❌ Error getting user ratings:', error);
    return [];
  }
}

async function getAllRatings() {
  console.log('=== GET ALL RATINGS DEBUG ===');
  
  try {
    const [rows] = await pool.query(
      'SELECT user_id, place_id, rating FROM user_preferences ORDER BY visited_at DESC'
    );
    console.log('📊 Total ratings in database:', rows.length);
    console.log('Sample ratings:', JSON.stringify(rows.slice(0, 5), null, 2));
    return rows;
  } catch (error) {
    console.error('❌ Error getting all ratings:', error);
    return [];
  }
}

async function getPlaceDetails(placeId) {
  console.log('Getting place details for place ID:', placeId);
  
  try {
    // Ambil detail tempat dari tabel place
    const sql = `
      SELECT id, nama_tempat, deskripsi, alamat, thumbnail, gambar,
             rating, jumlah_ulasan, kategori, link
      FROM places
      WHERE id = ?`;
    
    const [rows] = await pool.query(sql, [placeId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const place = {
      id: rows[0].id,
      nama_tempat: rows[0].nama_tempat,
      rating: parseFloat(rows[0].rating) || 0,
      jumlah_ulasan: rows[0].jumlah_ulasan || 0,
      alamat: rows[0].alamat,
      link: rows[0].link,
      thumbnail: rows[0].thumbnail,
      kategori: rows[0].kategori,
      content: rows[0].content
    };
    
    console.log('Place details retrieved:', place.nama_tempat);
    return place;
  } catch (error) {
    console.error('Error getting place details from database:', error);
    throw error;
  }
}

module.exports = {
  saveInitialRatings,
  countUserRatings,
  getUserRatings,
  getAllRatings,
  getPlaceDetails  // Changed from getPlaceRatings to getPlaceDetails
};