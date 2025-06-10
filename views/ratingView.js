const { saveInitialRatings } = require('../models/ratingModel');

const submitRatings = async (request, h) => {
  console.log('=== SUBMIT RATINGS VIEW DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  console.log('Request payload:', JSON.stringify(request.payload, null, 2));

  if (!request.auth || !request.auth.credentials) {
    console.log('❌ No authentication found');
    return h.response({ message: 'Authentication required.' }).code(401);
  }

  const userId = request.auth.credentials.id;
  const ratings = request.payload;

  console.log('Extracted User ID:', userId);
  console.log('Extracted ratings:', JSON.stringify(ratings, null, 2));

  if (!userId) {
    console.log('❌ No user ID found in credentials');
    return h.response({ message: 'User ID not found.' }).code(400);
  }

  if (!Array.isArray(ratings) || ratings.length < 3) {
    console.log('❌ Invalid ratings array');
    return h.response({ message: 'Minimal beri rating ke 3 tempat.' }).code(400);
  }

  const validRatings = ratings.every(r => 
    r && typeof r.place_id === 'number' &&
    typeof r.rating === 'number' &&
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

const initialRatings = async (request, h) => {
  console.log('=== INITIAL RATINGS PRESENTER DEBUG ===');
  console.log('Auth credentials:', request.auth?.credentials);
  console.log('Request payload:', JSON.stringify(request.payload, null, 2));

  if (!request.auth || !request.auth.credentials) {
    console.log('❌ No authentication found');
    return h.response({ message: 'Authentication required.' }).code(401);
  }

  const userId = request.auth.credentials.id;
  const ratings = request.payload;

  console.log('User ID:', userId);
  console.log('Ratings payload:', JSON.stringify(ratings, null, 2));

  if (!userId) {
    console.log('❌ No user ID found');
    return h.response({ message: 'User ID not found.' }).code(400);
  }

  if (!Array.isArray(ratings) || ratings.length < 3) {
    console.log('❌ Invalid ratings array');
    return h.response({ message: 'Minimal beri rating ke 3 tempat.' }).code(400);
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

module.exports = {
  submitRatings,
  initialRatings
};
