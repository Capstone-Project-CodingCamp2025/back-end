const pool = require('../config/db');

async function submitReview(userId, placeId, rating, comment, userName) {
  console.log('=== SUBMIT REVIEW DEBUG ===');
  console.log('User ID:', userId, 'Place ID:', placeId, 'Rating:', rating, 'UserName:', userName);
  
  try {
    // Cek apakah user sudah pernah review tempat ini
    const [existingReview] = await pool.query(
      'SELECT id FROM user_reviews WHERE user_id = ? AND place_id = ?',
      [userId, placeId]
    );
    
    if (existingReview.length > 0) {
      throw new Error('Anda sudah pernah memberikan ulasan untuk destinasi ini.');
    }
    
    // Insert review baru
    const sql = `
      INSERT INTO user_reviews (user_id, place_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const [result] = await pool.query(sql, [userId, placeId, rating, comment]);
    
    console.log('✅ Review inserted with ID:', result.insertId);
    
    // Return review data lengkap
    const newReview = {
      id: result.insertId,
      user_id: userId,
      place_id: placeId,
      rating: parseFloat(rating),
      comment: comment,
      userName: userName,
      created_at: new Date()
    };
    
    // Update rata-rata rating tempat
    await updatePlaceRating(placeId);
    
    return newReview;
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    throw error;
  }
}

async function getReviewsByPlaceId(placeId) {
  console.log('=== GET REVIEWS DEBUG ===');
  console.log('Place ID:', placeId);
  
  try {
    const sql = `
      SELECT ur.id, ur.user_id, ur.place_id, ur.rating, ur.comment, ur.created_at,
             u.name as userName, u.username
      FROM user_reviews ur
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE ur.place_id = ?
      ORDER BY ur.created_at DESC
    `;
    
    const [rows] = await pool.query(sql, [placeId]);
    
    const reviews = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      place_id: row.place_id,
      rating: parseFloat(row.rating),
      review: row.comment, // Menggunakan 'review' untuk kompatibilitas frontend
      comment: row.comment,
      userName: row.userName || row.username || 'Anonim',
      name: row.userName || row.username || 'Anonim',
      created_at: row.created_at
    }));
    
    console.log('✅ Retrieved', reviews.length, 'reviews for place', placeId);
    return reviews;
  } catch (error) {
    console.error('❌ Error getting reviews:', error);
    throw error;
  }
}

async function updatePlaceRating(placeId) {
  console.log('=== UPDATE PLACE RATING DEBUG ===');
  console.log('Place ID:', placeId);
  
  try {
    // Hitung rata-rata rating dan jumlah ulasan
    const [stats] = await pool.query(`
      SELECT 
        AVG(rating) as avgRating,
        COUNT(*) as reviewCount
      FROM user_reviews 
      WHERE place_id = ?
    `, [placeId]);
    
    const avgRating = parseFloat(stats[0].avgRating) || 0;
    const reviewCount = parseInt(stats[0].reviewCount) || 0;
    
    // Update tabel places
    await pool.query(`
      UPDATE places 
      SET rating = ?, jumlah_ulasan = ?
      WHERE id = ?
    `, [avgRating.toFixed(1), reviewCount, placeId]);
    
    console.log('✅ Updated place rating:', avgRating.toFixed(1), 'with', reviewCount, 'reviews');
    
    return { avgRating, reviewCount };
  } catch (error) {
    console.error('❌ Error updating place rating:', error);
    throw error;
  }
}

async function getUserReviews(userId) {
  console.log('=== GET USER REVIEWS DEBUG ===');
  console.log('User ID:', userId);
  
  try {
    const sql = `
      SELECT ur.id, ur.user_id, ur.place_id, ur.rating, ur.comment, ur.created_at,
             p.nama_tempat as placeName
      FROM user_reviews ur
      LEFT JOIN places p ON ur.place_id = p.id
      WHERE ur.user_id = ?
      ORDER BY ur.created_at DESC
    `;
    
    const [rows] = await pool.query(sql, [userId]);
    
    const reviews = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      place_id: row.place_id,
      rating: parseFloat(row.rating),
      comment: row.comment,
      placeName: row.placeName,
      created_at: row.created_at
    }));
    
    console.log('✅ Retrieved', reviews.length, 'reviews for user', userId);
    return reviews;
  } catch (error) {
    console.error('❌ Error getting user reviews:', error);
    throw error;
  }
}

async function deleteReview(reviewId, userId) {
  console.log('=== DELETE REVIEW DEBUG ===');
  console.log('Review ID:', reviewId, 'User ID:', userId);
  
  try {
    // Cek apakah review milik user
    const [reviewCheck] = await pool.query(
      'SELECT place_id FROM user_reviews WHERE id = ? AND user_id = ?',
      [reviewId, userId]
    );
    
    if (reviewCheck.length === 0) {
      throw new Error('Review tidak ditemukan atau bukan milik Anda.');
    }
    
    const placeId = reviewCheck[0].place_id;
    
    // Hapus review
    await pool.query('DELETE FROM user_reviews WHERE id = ? AND user_id = ?', [reviewId, userId]);
    
    // Update rating tempat
    await updatePlaceRating(placeId);
    
    console.log('✅ Review deleted successfully');
    return { success: true, message: 'Review berhasil dihapus' };
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    throw error;
  }
}

module.exports = {
  submitReview,
  getReviewsByPlaceId,
  updatePlaceRating,
  getUserReviews,
  deleteReview
};