const placeModel = require('../models/placeModel');

// Get all places
exports.getAllPlaces = async (request, h) => {
  console.log('=== GET ALL PLACES VIEW DEBUG ===');
  
  try {
    const places = await placeModel.getAllPlaces();
    console.log('✅ All places retrieved successfully:', places.length);
    
    // Log some sample places for debugging
    if (places.length > 0) {
      console.log('Sample places (first 3):');
      places.slice(0, 3).forEach(place => {
        console.log(`- ID: ${place.id}, Name: ${place.name}`);
      });
    }
    
    return h.response(places).code(200);
  } catch (error) {
    console.error('❌ Error in getAllPlaces view:', error);
    return h.response({ 
      message: 'Gagal mengambil daftar tempat.', 
      error: error.message 
    }).code(500);
  }
};

// Get place by ID
exports.getPlaceById = async (request, h) => {
  console.log('=== GET PLACE BY ID VIEW DEBUG ===');
  console.log('Requested Place ID:', request.params.id);
  console.log('Request params:', request.params);
  
  try {
    const placeId = request.params.id;
    
    // Validasi ID - pastikan ada dan bisa dikonversi ke number
    if (!placeId) {
      console.log('❌ Missing place ID');
      return h.response({ 
        message: 'ID tempat tidak boleh kosong.' 
      }).code(400);
    }
    
    const numericId = parseInt(placeId);
    if (isNaN(numericId)) {
      console.log('❌ Invalid place ID format:', placeId);
      return h.response({ 
        message: 'ID tempat harus berupa angka yang valid.' 
      }).code(400);
    }
    
    console.log('Processing place ID:', numericId);
    
    const place = await placeModel.getPopularId(numericId);
    
    if (!place) {
      console.log('❌ Place not found with ID:', numericId);
      
      // Get some sample available IDs for helpful error message
      try {
        const allPlaces = await placeModel.getAllPlaces();
        const availableIds = allPlaces.map(p => p.id).slice(0, 20);
        
        return h.response({ 
          statusCode: 404,
          error: "Not Found",
          message: "Not Found",
          details: `Tempat dengan ID ${numericId} tidak ditemukan.`,
          availableIds: availableIds,
          totalPlaces: allPlaces.length,
          suggestion: `Coba gunakan ID: ${availableIds.slice(0, 5).join(', ')}`
        }).code(404);
      } catch (debugError) {
        console.error('Error getting debug info:', debugError);
        return h.response({ 
          statusCode: 404,
          error: "Not Found",
          message: "Not Found",
          details: `Tempat dengan ID ${numericId} tidak ditemukan.`
        }).code(404);
      }
    }
    
    console.log('✅ Place found:', place.name);
    console.log('Place details:', {
      id: place.id,
      name: place.name,
      hasImage: !!place.image,
      imageUrl: place.image
    });
    
    return h.response(place).code(200);
    
  } catch (error) {
    console.error('❌ Error in getPlaceById view:', error);
    
    // Handle our custom 404 errors
    if (error.statusCode === 404) {
      return h.response({ 
        statusCode: 404,
        error: "Not Found",
        message: "Not Found",
        details: error.message,
        availableIds: error.availableIds,
        totalPlaces: error.totalPlaces,
        idRange: error.idRange
      }).code(404);
    }
    
    // Handle other errors
    return h.response({ 
      message: 'Gagal mengambil detail tempat.', 
      error: error.message,
      statusCode: error.statusCode || 500
    }).code(error.statusCode || 500);
  }
};