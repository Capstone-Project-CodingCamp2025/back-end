const pool = require('../config/db');

// Submit review baru ke user_preferences
async function submitReview(userId, placeId, rating, review, userName) {
  console.log('=== SUBMIT REVIEW MODEL DEBUG ===');
  console.log('Input:', { userId, placeId, rating, review, userName });
  
  try {
    // Cek apakah user sudah pernah review tempat ini
    const [existingReview] = await pool.query(
      'SELECT id FROM user_preferences WHERE user_id = ? AND place_id = ?',
      [userId, placeId]
    );
    
    if (existingReview.length > 0) {
      // Update existing review
      const sql = `
        UPDATE user_preferences 
        SET rating = ?, comment = ?, visited_at = NOW(), created_at = NOW()
        WHERE user_id = ? AND place_id = ?
      `;
      
      await pool.query(sql, [rating, review, userId, placeId]);
      
      // Return updated review
      const [updatedReview] = await pool.query(`
        SELECT up.id, up.user_id, up.place_id, up.rating, up.comment as review, 
               up.created_at, u.username
        FROM user_preferences up
        LEFT JOIN users u ON up.user_id = u.id
        WHERE up.user_id = ? AND up.place_id = ?
      `, [userId, placeId]);
      
      console.log('✅ Review updated successfully');
      return {
        id: updatedReview[0].id,
        user_id: userId,
        place_id: parseInt(placeId),
        rating: parseFloat(rating),
        review: review,
        userName: userName || updatedReview[0].userName || 'Anonim',
        created_at: updatedReview[0].created_at
      };
    } else {
      // Insert new review
      const sql = `
        INSERT INTO user_preferences (user_id, place_id, rating, comment, visited_at, created_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await pool.query(sql, [userId, placeId, rating, review]);
      
      console.log('✅ New review inserted successfully');
      return {
        id: result.insertId,
        user_id: userId,
        place_id: parseInt(placeId),
        rating: parseFloat(rating),
        review: review,
        userName: userName || 'Anonim',
        created_at: new Date()
      };
    }
  } catch (error) {
    console.error('❌ Error in submitReview model:', error);
    throw error;
  }
}

// Get reviews untuk tempat tertentu
async function getReviewsByPlaceId(placeId) {
  console.log('=== GET REVIEWS BY PLACE ID MODEL DEBUG ===');
  console.log('Place ID:', placeId);
  
  try {
    const sql = `
      SELECT up.id, up.user_id, up.place_id, up.rating, up.comment as review, 
             up.created_at, u.username
      FROM user_preferences up
      LEFT JOIN users u ON up.user_id = u.id
      WHERE up.place_id = ? AND up.comment IS NOT NULL AND up.comment != ''
      ORDER BY up.created_at DESC
    `;
    
    const [rows] = await pool.query(sql, [placeId]);
    
    const reviews = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      place_id: row.place_id,
      rating: parseFloat(row.rating),
      review: row.review,
      userName: row.userName || row.username || 'Anonim',
      name: row.userName || row.username || 'Anonim',
      created_at: row.created_at
    }));
    
    console.log('✅ Retrieved', reviews.length, 'reviews for place', placeId);
    console.log('Sample reviews:', reviews.slice(0, 2));
    
    return reviews;
  } catch (error) {
    console.error('❌ Error getting reviews by place id:', error);
    throw error;
  }
}

// Get reviews milik user
async function getUserReviews(userId) {
  console.log('=== GET USER REVIEWS MODEL DEBUG ===');
  console.log('User ID:', userId);
  
  try {
    const sql = `
      SELECT up.id, up.user_id, up.place_id, up.rating, up.comment as review, 
             up.created_at, p.nama_tempat as placeName
      FROM user_preferences up
      LEFT JOIN users u ON up.user_id = u.id
      LEFT JOIN places p ON up.place_id = p.id
      WHERE up.user_id = ? AND up.comment IS NOT NULL AND up.comment != ''
      ORDER BY up.created_at DESC
    `;
    
    const [rows] = await pool.query(sql, [userId]);
    
    const reviews = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      place_id: row.place_id,
      rating: parseFloat(row.rating),
      review: row.review,
      userName: row.userName || 'Anonim',
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

// Delete review
async function deleteReview(userId, placeId) {
  console.log('=== DELETE REVIEW MODEL DEBUG ===');
  console.log('User ID:', userId, 'Place ID:', placeId);
  
  try {
    const sql = `
      UPDATE user_preferences 
      SET comment = NULL 
      WHERE user_id = ? AND place_id = ?
    `;
    
    const [result] = await pool.query(sql, [userId, placeId]);
    
    if (result.affectedRows === 0) {
      throw new Error('Review tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya.');
    }
    
    console.log('✅ Review deleted successfully');
    return { message: 'Review berhasil dihapus.' };
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    throw error;
  }
}

module.exports = {
  submitReview,
  getReviewsByPlaceId,
  getUserReviews,
  deleteReview
};