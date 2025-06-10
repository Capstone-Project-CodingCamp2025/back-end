const Joi = require('joi');
const BookmarkModel = require('../models/bookmarkModel');
const BookmarkView = require('../views/bookmarkView');

const bookmarkRoutes = {
  name: 'bookmarkRoutes',
  register: async (server) => {
    
    // POST /api/bookmarks - Add bookmark
    server.route({
      method: 'POST',
      path: '/api/bookmarks',
      options: {
        auth: 'jwt',
        validate: {
          payload: Joi.object({
            place_id: Joi.number().integer().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const { place_id } = request.payload;
          const userId = request.auth.credentials.id;

          const bookmark = await BookmarkModel.addBookmark(userId, place_id);
          const response = BookmarkView.addBookmarkResponse(bookmark);
          
          return h.response(response).code(201);
        } catch (error) {
          console.error('Add bookmark error:', error);
          
          if (error.message === 'Bookmark sudah ada') {
            const response = BookmarkView.errorResponse('Tempat sudah ada di bookmark Anda', 409);
            return h.response(response).code(409);
          }
          
          const response = BookmarkView.errorResponse('Gagal menambah bookmark');
          return h.response(response).code(500);
        }
      }
    });

    // DELETE /api/bookmarks/{placeId} - Remove bookmark
    server.route({
      method: 'DELETE',
      path: '/api/bookmarks/{placeId}',
      options: {
        auth: 'jwt',
        validate: {
          params: Joi.object({
            placeId: Joi.number().integer().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const placeId = request.params.placeId;
          const userId = request.auth.credentials.id;

          await BookmarkModel.removeBookmark(userId, placeId);
          const response = BookmarkView.removeBookmarkResponse();
          
          return h.response(response).code(200);
        } catch (error) {
          console.error('Remove bookmark error:', error);
          
          if (error.message === 'Bookmark tidak ditemukan') {
            const response = BookmarkView.errorResponse('Bookmark tidak ditemukan', 404);
            return h.response(response).code(404);
          }
          
          const response = BookmarkView.errorResponse('Gagal menghapus bookmark');
          return h.response(response).code(500);
        }
      }
    });

    // GET /api/bookmarks - Get user bookmarks
    server.route({
      method: 'GET',
      path: '/api/bookmarks',
      options: {
        auth: 'jwt'
      },
      handler: async (request, h) => {
        try {
          const userId = request.auth.credentials.id;
          const bookmarks = await BookmarkModel.getUserBookmarks(userId);
          const response = BookmarkView.userBookmarksResponse(bookmarks);
          
          return h.response(response).code(200);
        } catch (error) {
          console.error('Get bookmarks error:', error);
          const response = BookmarkView.errorResponse('Gagal mengambil bookmark');
          return h.response(response).code(500);
        }
      }
    });

    // GET /api/bookmarks/check/{placeId} - Check bookmark status
    server.route({
      method: 'GET',
      path: '/api/bookmarks/check/{placeId}',
      options: {
        auth: 'jwt',
        validate: {
          params: Joi.object({
            placeId: Joi.number().integer().required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const placeId = request.params.placeId;
          const userId = request.auth.credentials.id;

          const isBookmarked = await BookmarkModel.checkBookmarkExists(userId, placeId);
          const response = BookmarkView.bookmarkStatusResponse(placeId, isBookmarked);
          
          return h.response(response).code(200);
        } catch (error) {
          console.error('Check bookmark error:', error);
          const response = BookmarkView.errorResponse('Gagal mengecek status bookmark');
          return h.response(response).code(500);
        }
      }
    });

    // POST /api/bookmarks/status - Check multiple bookmark status
    server.route({
      method: 'POST',
      path: '/api/bookmarks/status',
      options: {
        auth: 'jwt',
        validate: {
          payload: Joi.object({
            place_ids: Joi.array().items(Joi.number().integer()).required()
          })
        }
      },
      handler: async (request, h) => {
        try {
          const { place_ids } = request.payload;
          const userId = request.auth.credentials.id;

          const bookmarkStatus = await BookmarkModel.getBookmarkStatus(userId, place_ids);
          const response = BookmarkView.multipleBookmarkStatusResponse(bookmarkStatus);
          
          return h.response(response).code(200);
        } catch (error) {
          console.error('Check multiple bookmarks error:', error);
          const response = BookmarkView.errorResponse('Gagal mengecek status bookmark');
          return h.response(response).code(500);
        }
      }
    });

  }
};

module.exports = bookmarkRoutes;