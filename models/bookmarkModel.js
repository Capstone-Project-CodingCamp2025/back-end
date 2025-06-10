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
          p.gambar as image,
          p.rating,
          p.kategori as category,
          p.deskripsi as description
        FROM user_bookmarks ub
        LEFT JOIN places p ON ub.place_id = p.id
        WHERE ub.user_id = ?
        ORDER BY ub.created_at DESC
      `;
      
      const [rows] = await db.execute(query, [userId]);
      return rows.map(r => {
        const firstImage = getFirstImageUrl(r.gambar);
        return {
          ...r,
          image: firstImage,
          gambar: r.gambar,          // kalau butuh
          allImages: getImageUrlsFromDatabase(r.gambar),
        };
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