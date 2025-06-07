// utils/imageHelpers.js
const fs = require('fs');
const path = require('path');

function normalizeFolderName(namaTempat) {
  if (!namaTempat || !namaTempat.trim()) return 'default';
  return namaTempat
    .replace(/[^a-zA-Z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function findFileByBasename(folderName, baseName) {
  const folderPath = path.join(__dirname, '..', 'public', 'image', folderName);
  if (!fs.existsSync(folderPath)) return null;

  const candidates = fs.readdirSync(folderPath)
    .filter(fn => /\.(jpe?g|png|gif|webp)$/i.test(fn))
    .filter(fn => path.basename(fn, path.extname(fn)).toLowerCase() === baseName.toLowerCase());
  return candidates.length ? candidates[0] : null;
}

function getFirstImageInFolder(namaTempat) {
  const folderName = normalizeFolderName(namaTempat);
  const folderPath = path.join(__dirname, '..', 'public', 'image', folderName);
  if (!fs.existsSync(folderPath)) return null;

  const pics = fs.readdirSync(folderPath)
    .filter(fn => /\.(jpe?g|png|gif|webp)$/i.test(fn));
  return pics.length ? `/image/${folderName}/${pics[0]}` : null;
}

function generateImagePathWithFallback(namaTempat, thumbnail) {
  const folder = normalizeFolderName(namaTempat);
  if (thumbnail) {
    const file = findFileByBasename(folder, thumbnail);
    if (file) return `/image/${folder}/${file}`;
  }
  const first = getFirstImageInFolder(namaTempat);
  return first || '/image/default/default.jpg';
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

module.exports = {
  normalizeFolderName,
  findFileByBasename,
  getFirstImageInFolder,
  generateImagePathWithFallback,
  formatPrice,
};
