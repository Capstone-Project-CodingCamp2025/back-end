const { saveInitialRatings } = require('../models/ratingModel');

exports.submitRatings = async (request, h) => {
  console.log('=== SUBMIT RATINGS VIEW DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  console.log('Request payload:', JSON.stringify(request.payload, null, 2));
  
  // Validasi auth
  if (!request.auth || !request.auth.credentials) {
    console.log('❌ No authentication found');
    return h.response({ message: 'Authentication required.' }).code(401);
  }
  
  const userId = request.auth.credentials.id;
  const ratings = request.payload;
  
  console.log('Extracted User ID:', userId);
  console.log('Extracted ratings:', JSON.stringify(ratings, null, 2));
  
  // Validasi userId
  if (!userId) {
    console.log('❌ No user ID found in credentials');
    return h.response({ message: 'User ID not found.' }).code(400);
  }
  
  // Validasi ratings
  if (!Array.isArray(ratings) || ratings.length < 3) {
    console.log('❌ Invalid ratings array');
    return h.response({ message: 'Minimal beri rating ke 3 tempat.' }).code(400);
  }
  
  // Validasi format ratings
  const validRatings = ratings.every(r => 
    r && typeof r.place_id === 'number' && typeof r.rating === 'number' &&
    r.rating >= 1 && r.rating <= 5
  );
  
  if (!validRatings) {
    console.log('❌ Invalid rating format');
    return h.response({ message: 'Format rating tidak valid.' }).code(400);
  }
  
  try {
    await saveInitialRatings(userId, ratings);
    console.log('✅ Ratings saved successfully');
    return h.response({ message: 'Ratings saved.' }).code(200);
  } catch (err) {
    console.error('❌ Error saving ratings:', err);
    return h.response({ message: 'Gagal menyimpan rating.' }).code(500);
  }
};