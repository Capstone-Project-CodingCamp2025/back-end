const submitRatings = async (request, h) => {
  // Logika menyimpan rating user (dummy dulu)
  return h.response({ message: 'Rating submitted successfully' }).code(201);
};

module.exports = {
  submitRatings,
};
