const db = require('../config/db');
const {
  getFirstImageUrl,
  getImageUrlsFromDatabase,
} = require('../utils/imageHelpers');

const BookmarkModel = {
  // Tambah bookmark
  async addBookmark(userId, placeId) {
    try {
      // Cek apakah bookmark sudah ada
      const existing = await this.checkBookmarkExists(userId, placeId);
      if (existing) {
        throw new Error('Bookmark sudah ada');
      }

      const query = `
        INSERT INTO user_bookmarks (user_id, place_id, created_at) 
        VALUES (?, ?, NOW())
      `;
      const result = await db.execute(query, [userId, placeId]);
      
      return {
        id: result.insertId,
        user_id: userId,
        place_id: placeId,
        created_at: new Date()
      };
    } catch (error) {
      console.error('BookmarkModel.addBookmark error:', error);
      throw error;
    }
  },

  // Hapus bookmark
  async removeBookmark(userId, placeId) {
    try {
      const query = `
        DELETE FROM user_bookmarks 
        WHERE user_id = ? AND place_id = ?
      `;
      const result = await db.execute(query, [userId, placeId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Bookmark tidak ditemukan');
      }
      
      return { success: true, message: 'Bookmark berhasil dihapus' };
    } catch (error) {
      console.error('BookmarkModel.removeBookmark error:', error);
      throw error;
    }
  },

  // Cek apakah bookmark exists
  async checkBookmarkExists(userId, placeId) {
    try {
      const query = `
        SELECT id FROM user_bookmarks 
        WHERE user_id = ? AND place_id = ?
      `;
      const [rows] = await db.execute(query, [userId, placeId]);
      return rows.length > 0;
    } catch (error) {
      console.error('BookmarkModel.checkBookmarkExists error:', error);
      throw error;
    }
  },

  // Get all bookmarks untuk user dengan detail tempat
  async getUserBookmarks(userId) {
    try {
      const query = `
        SELECT 
          ub.id as bookmark_id,
          ub.place_id,
          ub.created_at as bookmarked_at,
          p.nama_tempat as name,
          p.alamat as location,
          p.gambar as image_raw,
          p.rating,
          p.kategori as category,
          p.deskripsi as description
        FROM user_bookmarks ub
        LEFT JOIN places p ON ub.place_id = p.id
        WHERE ub.user_id = ?
        ORDER BY ub.created_at DESC
      `;
      
      const [rows] = await db.execute(query, [userId]);
      
      console.log('=== BOOKMARK MODEL DEBUG ===');
      console.log('Raw bookmark rows:', rows.length);
      if (rows.length > 0) {
        console.log('Sample raw data:', {
          place_id: rows[0].place_id,
          name: rows[0].name,
          image_raw: rows[0].image_raw,
          location: rows[0].location
        });
      }
      
      return rows.map(r => {
        // FIXED: Better image handling with debugging
        let processedImage = '/api/placeholder/400/300'; // default
        
        try {
          if (r.image_raw) {
            console.log('Processing image for place:', r.place_id, 'Raw:', r.image_raw);
            
            // Try to get first image using helper
            const firstImage = getFirstImageUrl(r.image_raw);
            if (firstImage && firstImage !== '/api/placeholder/400/300') {
              processedImage = firstImage;
              console.log('✅ Image processed successfully:', processedImage);
            } else {
              console.log('⚠️ Image helper returned default/null for:', r.image_raw);
              // Fallback: try to process manually
              if (typeof r.image_raw === 'string') {
                // If it's JSON string, try to parse
                try {
                  const parsed = JSON.parse(r.image_raw);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    processedImage = parsed[0];
                  } else if (typeof parsed === 'string') {
                    processedImage = parsed;
                  }
                } catch {
                  // If not JSON, treat as direct URL
                  processedImage = r.image_raw;
                }
              }
            }
          } else {
            console.log('⚠️ No image_raw data for place:', r.place_id);
          }
        } catch (imageError) {
          console.error('❌ Error processing image for place:', r.place_id, imageError);
        }
        
        const result = {
          ...r,
          image: processedImage,
          gambar: r.image_raw, // Keep original for debugging
          allImages: r.image_raw ? getImageUrlsFromDatabase(r.image_raw) : [],
        };
        
        console.log('Final processed bookmark:', {
          place_id: result.place_id,
          name: result.name,
          image: result.image,
          image_raw: result.gambar
        });
        
        return result;
      });

    } catch (error) {
      console.error('BookmarkModel.getUserBookmarks error:', error);
      throw error;
    }
  },

  // Get bookmark status untuk multiple places
  async getBookmarkStatus(userId, placeIds) {
    try {
      if (!placeIds || placeIds.length === 0) {
        return {};
      }

      const placeholders = placeIds.map(() => '?').join(',');
      const query = `
        SELECT place_id FROM user_bookmarks 
        WHERE user_id = ? AND place_id IN (${placeholders})
      `;
      
      const [rows] = await db.execute(query, [userId, ...placeIds]);
      
      // Convert to object untuk easy lookup
      const bookmarkedPlaces = {};
      rows.forEach(row => {
        bookmarkedPlaces[row.place_id] = true;
      });
      
      return bookmarkedPlaces;
    } catch (error) {
      console.error('BookmarkModel.getBookmarkStatus error:', error);
      throw error;
    }
  }
};

module.exports = BookmarkModel;