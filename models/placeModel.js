// models/placeModel.js - Enhanced debugging
const db = require('../config/db');
const {
  generateImagePathWithFallback,
  formatPrice
} = require('../utils/imageHelpers');

async function getPopular(limit = 12) {
  console.log('=== GET POPULAR PLACES DEBUG ===');
  console.log('Limit:', limit);
  
  try {
    const sql = `
      SELECT id, nama_tempat, alamat, thumbnail, rating_avg, jumlah_ulasan, kategori, link
      FROM places
      WHERE rating_avg > 0
      ORDER BY rating_avg DESC, jumlah_ulasan DESC
      LIMIT ?`;
    
    const [rows] = await db.query(sql, [limit]);
    console.log('Raw database rows:', rows.length);
    
    const formatted = rows.map(r => ({
      id:          r.id,
      name:        r.nama_tempat,
      location:    r.alamat,
      image:       generateImagePathWithFallback ? generateImagePathWithFallback(r.nama_tempat, r.thumbnail) : r.thumbnail,
      rating:      parseFloat(r.rating_avg)  || 0,
      reviewCount: parseInt(r.jumlah_ulasan) || 0,
      price:       formatPrice ? formatPrice(r.kategori) : r.kategori,
      category:    r.kategori,
      link:        r.link || ''
    }));
    
    console.log('Formatted popular places:', formatted.length);
    console.log('Sample formatted places:', JSON.stringify(formatted.slice(0, 2), null, 2));
    
    return formatted;
  } catch (error) {
    console.error('❌ Error getting popular places:', error);
    return [];
  }
}

async function getAllPlaces() {
  console.log('=== GET ALL PLACES DEBUG ===');
  
  try {
    const sql = `SELECT id, nama_tempat, alamat, thumbnail, rating_avg, jumlah_ulasan, kategori, link FROM places ORDER BY id ASC`;
    const [rows] = await db.query(sql);
    
    console.log('Total places in database:', rows.length);
    
    const formatted = rows.map(r => ({
      id:          r.id,
      name:        r.nama_tempat,
      location:    r.alamat,
      thumbnail:   r.thumbnail,
      rating:      parseFloat(r.rating_avg)  || 0,
      reviewCount: parseInt(r.jumlah_ulasan) || 0,
      category:    r.kategori,
      link:        r.link || ''
    }));
    
    console.log('Sample places:', JSON.stringify(formatted.slice(0, 3), null, 2));
    return formatted;
  } catch (error) {
    console.error('❌ Error getting all places:', error);
    return [];
  }
}

module.exports = { getPopular, getAllPlaces };