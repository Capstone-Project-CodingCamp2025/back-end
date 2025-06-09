const db = require('../config/db');
const {
  getFirstImageUrl,
  getImageUrlsFromDatabase,
  formatPrice
} = require('../utils/imageHelpers');

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
      const mainImage = getFirstImageUrl(r.gambar);
      const allImages = getImageUrlsFromDatabase(r.gambar);
      
      return {
        id:          r.id,
        name:        r.nama_tempat,
        description: r.deskripsi || 'Deskripsi tidak tersedia',
        location:    r.alamat,
        image:       mainImage, // Main image for display
        gambar:      mainImage, // For compatibility with frontend
        thumbnail:   r.thumbnail,
        allImages:   allImages, // All available images
        fullImage:   r.gambar, // Original database string
        rating:      parseFloat(r.rating) || 0,
        reviewCount: parseInt(r.jumlah_ulasan) || 0,
        price:       formatPrice(r.kategori),
        category:    r.kategori,
        link:        r.link || ''
      };
    });
    
    console.log('Formatted popular places:', formatted.length);
    console.log('Sample image URLs:', formatted.slice(0, 1).map(p => ({
      name: p.name,
      mainImage: p.image,
      allImages: p.allImages
    })));
    
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
    
    const formatted = rows.map(r => {
      const mainImage = getFirstImageUrl(r.gambar);
      const allImages = getImageUrlsFromDatabase(r.gambar);
      
      return {
        id:          r.id,
        name:        r.nama_tempat,
        description: r.deskripsi || 'Deskripsi tidak tersedia',
        location:    r.alamat,
        image:       mainImage, // Main image for display
        gambar:      mainImage, // For compatibility with frontend
        thumbnail:   r.thumbnail,
        allImages:   allImages, // All available images
        fullImage:   r.gambar, // Original database string
        rating:      parseFloat(r.rating) || 0,
        reviewCount: parseInt(r.jumlah_ulasan) || 0,
        price:       formatPrice(r.kategori),
        category:    r.kategori,
        link:        r.link || ''
      };
    });
    
    console.log('Sample places with images:', formatted.slice(0, 2).map(p => ({
      name: p.name,
      mainImage: p.image,
      imageCount: p.allImages.length
    })));
    
    return formatted;
  } catch (error) {
    console.error('❌ Error getting all places:', error);
    return [];
  }
}

async function getPopularId(id) {
  console.log('Getting place by ID:', id);
  
  try {
    const sql = `
      SELECT id, nama_tempat, deskripsi, alamat, thumbnail, gambar,
             rating, jumlah_ulasan, kategori, link
      FROM places 
      WHERE id = ?`;
    
    const [rows] = await db.query(sql, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const place = rows[0];
    const mainImage = getFirstImageUrl(place.gambar);
    const allImages = getImageUrlsFromDatabase(place.gambar);
    
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
      price: formatPrice(place.kategori),
      category: place.kategori,
      link: place.link || ''
    };
  } catch (error) {
    console.error('Error in getPopularId:', error);
    throw error;
  }
}

module.exports = {
  getPopular,
  getAllPlaces,
  getPopularId
};