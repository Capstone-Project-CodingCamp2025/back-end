const reviewModel = require('../models/reviewModel');

// Submit review baru
exports.submitReview = async (request, h) => {
  console.log('=== SUBMIT REVIEW VIEW DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  console.log('Request payload:', JSON.stringify(request.payload, null, 2));
  console.log('Request params:', request.params);
  
  try {
    // Validasi auth
    if (!request.auth || !request.auth.credentials) {
      console.log('❌ No authentication found');
      return h.response({ message: 'Authentication required.' }).code(401);
    }
    
    const userId = request.auth.credentials.id;
    const placeId = request.params.placeId;
    const { rating, review, userName } = request.payload;
    
    console.log('Extracted data:', { userId, placeId, rating, review, userName });
    
    // Validasi input
    if (!placeId || !rating || !review) {
      return h.response({ 
        message: 'Place ID, rating, dan review wajib diisi.' 
      }).code(400);
    }
    
    if (rating < 1 || rating > 5) {
      return h.response({ 
        message: 'Rating harus antara 1-5.' 
      }).code(400);
    }
    
    // Submit review
    const newReview = await reviewModel.submitReview(
      userId, 
      placeId, 
      rating, 
      review, 
      userName || 'Anonim'
    );
    
    console.log('✅ Review submitted successfully');
    return h.response(newReview).code(201);
    
  } catch (error) {
    console.error('❌ Error in submitReview view:', error);
    
    if (error.message.includes('sudah pernah memberikan ulasan')) {
      return h.response({ message: error.message }).code(409);
    }
    
    return h.response({ 
      message: 'Gagal mengirim ulasan.', 
      error: error.message 
    }).code(500);
  }
};

// Get reviews untuk tempat tertentu
exports.getReviewsByPlace = async (request, h) => {
  console.log('=== GET REVIEWS VIEW DEBUG ===');
  console.log('Request params:', request.params);
  
  try {
    const placeId = request.params.placeId;
    
    if (!placeId) {
      return h.response({ message: 'Place ID wajib diisi.' }).code(400);
    }
    
    const reviews = await reviewModel.getReviewsByPlaceId(placeId);
    
    console.log('✅ Reviews retrieved successfully');
    return h.response(reviews).code(200);
    
  } catch (error) {
    console.error('❌ Error in getReviewsByPlace view:', error);
    return h.response({ 
      message: 'Gagal mengambil ulasan.', 
      error: error.message 
    }).code(500);
  }
};

// Get reviews milik user
exports.getUserReviews = async (request, h) => {
  console.log('=== GET USER REVIEWS VIEW DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  
  try {
    if (!request.auth || !request.auth.credentials) {
      return h.response({ message: 'Authentication required.' }).code(401);
    }
    
    const userId = request.auth.credentials.id;
    const reviews = await reviewModel.getUserReviews(userId);
    
    console.log('✅ User reviews retrieved successfully');
    return h.response(reviews).code(200);
    
  } catch (error) {
    console.error('❌ Error in getUserReviews view:', error);
    return h.response({ 
      message: 'Gagal mengambil ulasan pengguna.', 
      error: error.message 
    }).code(500);
  }
};

// Delete review
exports.deleteReview = async (request, h) => {
  try {
    const userId = request.auth.credentials.id;
    const placeId = request.params.placeId;

    const result = await reviewModel.deleteReview(userId, placeId);
    return h.response(result).code(200);
  } catch (error) {
    return h.response({ message: 'Gagal menghapus ulasan.', error: error.message }).code(500);
  }
};
