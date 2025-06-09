const fs = require('fs');
const path = require('path');

function normalizeFolderName(namaTempat) {
  if (!namaTempat || !namaTempat.trim()) return 'default';
  return namaTempat
    .replace(/[^a-zA-Z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function parseImagePaths(imagePathString) {
  if (!imagePathString) return [];
  
  try {
    let cleanString = imagePathString;
    
    // Remove array brackets if present
    if (cleanString.startsWith('[') && cleanString.endsWith(']')) {
      cleanString = cleanString.slice(1, -1);
    }
    
    // Split by comma and clean up each path
    const paths = cleanString
      .split(',')
      .map(path => path.trim().replace(/^['"]|['"]$/g, '')) // Remove quotes
      .filter(path => path.length > 0);
    
    return paths;
  } catch (error) {
    console.error('Error parsing image paths:', error);
    return [];
  }
}

function convertDatabasePathToPublicPath(dbPath) {
  if (!dbPath) return null;
  
  // Convert backslashes to forward slashes
  let cleanPath = dbPath.replace(/\\/g, '/');
  
  // Remove 'gambar_data/' prefix if present
  if (cleanPath.startsWith('gambar_data/')) {
    cleanPath = cleanPath.substring('gambar_data/'.length);
  }
  
  // FIXED: Remove double slashes and normalize path
  cleanPath = cleanPath.replace(/\/+/g, '/'); // Replace multiple slashes with single slash
  
  // Remove leading slash if present
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  // Return as public URL path
  return `/gambar_data/${cleanPath}`;
}

function getImageUrlsFromDatabase(imagePathString) {
  const paths = parseImagePaths(imagePathString);
  return paths
    .map(path => convertDatabasePathToPublicPath(path))
    .filter(url => url !== null);
}

function getFirstImageUrl(imagePathString) {
  const urls = getImageUrlsFromDatabase(imagePathString);
  return urls.length > 0 ? urls[0] : '/gambar_data/default/default.jpg';
}

function formatPrice(kategori) {
  const map = {
    Museum: 'Rp 5.000 - Rp 15.000',
    Pantai: 'Gratis',
    Gunung: 'Rp 10.000 - Rp 25.000', 
    Taman: 'Gratis',
    Candi: 'Rp 5.000 - Rp 30.000',
    'Wisata Alam': 'Rp 5.000 - Rp 20.000',
  };
  return map[kategori] || 'Gratis';
}

// ADDED: Function to check if image file exists
function checkImageExists(imagePath) {
  try {
    const fullPath = path.join(__dirname, '../public', imagePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
}

// ADDED: Function to get fallback image if main image doesn't exist
function getImageWithFallback(imagePath) {
  if (checkImageExists(imagePath)) {
    return imagePath;
  }
  
  // Return placeholder if image doesn't exist
  return '/gambar_data/default/default.jpg';
}

// Legacy function for backward compatibility
function generateImagePathWithFallback(namaTempat, thumbnail) {
  const folder = normalizeFolderName(namaTempat);
  if (thumbnail) {
    return `/image/${folder}/${thumbnail}`;
  }
  return '/image/default/default.jpg';
}

module.exports = {
  normalizeFolderName,
  parseImagePaths,
  convertDatabasePathToPublicPath,
  getImageUrlsFromDatabase,
  getFirstImageUrl,
  generateImagePathWithFallback,
  formatPrice,
  checkImageExists,        // NEW
  getImageWithFallback,    // NEW
};