// views/bookmarkView.js - Fixed data structure mapping
const BookmarkView = {
  // Response untuk add bookmark
  addBookmarkResponse(bookmark) {
    return {
      success: true,
      message: 'Bookmark berhasil ditambahkan',
      data: {
        id: bookmark.id,
        user_id: bookmark.user_id,
        place_id: bookmark.place_id,
        created_at: bookmark.created_at
      }
    };
  },

  // Response untuk remove bookmark
  removeBookmarkResponse() {
    return {
      success: true,
      message: 'Bookmark berhasil dihapus'
    };
  },

  // FIXED: Response untuk get user bookmarks - consistent with frontend expectations
  userBookmarksResponse(bookmarks) {
    return {
      success: true,
      message: 'Bookmark berhasil diambil',
      data: bookmarks.map(bookmark => ({
        // FIXED: Map fields to match frontend expectations
        id: bookmark.place_id,              // Frontend expects 'id'
        bookmark_id: bookmark.bookmark_id,
        place_id: bookmark.place_id,
        bookmarked_at: bookmark.bookmarked_at,
        
        // FIXED: Flatten the place data structure
        name: bookmark.name,
        nama_tempat: bookmark.name,
        location: bookmark.location,
        alamat: bookmark.location,
        image: bookmark.image,
        gambar: bookmark.image,
        rating: bookmark.rating,
        category: bookmark.category,
        kategori: bookmark.category,
        description: bookmark.description,
        deskripsi: bookmark.description,
        
        // FIXED: Keep nested structure for compatibility
        place: {
          id: bookmark.place_id,
          name: bookmark.name,
          location: bookmark.location,
          image: bookmark.image,
          rating: bookmark.rating,
          category: bookmark.category,
          description: bookmark.description
        }
      })),
      total: bookmarks.length
    };
  },

  // Response untuk check bookmark status
  bookmarkStatusResponse(placeId, isBookmarked) {
    return {
      success: true,
      data: {
        place_id: placeId,
        is_bookmarked: isBookmarked
      }
    };
  },

  // Response untuk multiple bookmark status
  multipleBookmarkStatusResponse(bookmarkStatus) {
    return {
      success: true,
      data: bookmarkStatus
    };
  },

  // Error response
  errorResponse(message, statusCode = 500) {
    return {
      success: false,
      message: message,
      statusCode: statusCode
    };
  }
};

module.exports = BookmarkView;