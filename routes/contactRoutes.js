// routes/contactRoutes.js
const Joi = require('joi');
const ContactPresenter = require('../presenters/contactPresenter');

const contactRoutes = {
  name: 'contact-routes',
  register: async (server) => {
    server.route([
      // ✅ Route: Kirim pesan kontak (public)
      {
        method: 'POST',
        path: '/api/contacts',
        handler: ContactPresenter.createContact,
        options: {
          auth: false,
          description: 'Kirim pesan kontak',
          tags: ['api', 'contact'],
          validate: {
            payload: Joi.object({
              nama: Joi.string().required(),
              email: Joi.string().email().required(),
              subjek: Joi.string().required(),
              pesan: Joi.string().required()
            })
          }
        }
      },

      // ✅ Route: Dapatkan semua pesan kontak (admin only)
      {
        method: 'GET',
        path: '/api/contacts',
        handler: ContactPresenter.getAllContacts,
        options: {
          auth: 'jwt',
          description: 'Dapatkan semua pesan kontak (admin)',
          tags: ['api', 'contact', 'admin'],
          validate: {
            query: Joi.object({
              page: Joi.number().integer().min(1).optional(),
              limit: Joi.number().integer().min(1).optional(),
              status: Joi.string().optional()
            })
          }
        }
      },

      // ✅ Route: Dapatkan pesan kontak berdasarkan ID (admin only)
      {
        method: 'GET',
        path: '/api/contacts/{id}',
        handler: ContactPresenter.getContactById,
        options: {
          auth: 'jwt',
          description: 'Dapatkan detail pesan kontak (admin)',
          tags: ['api', 'contact', 'admin'],
          validate: {
            params: Joi.object({
              id: Joi.number().integer().required()
            })
          }
        }
      },

      // ✅ Route: Update status pesan kontak (admin only)
      {
        method: 'PUT',
        path: '/api/contacts/{id}/status',
        handler: ContactPresenter.updateContactStatus,
        options: {
          auth: 'jwt',
          description: 'Update status pesan kontak (admin)',
          tags: ['api', 'contact', 'admin'],
          validate: {
            params: Joi.object({
              id: Joi.number().integer().required()
            }),
            payload: Joi.object({
              status: Joi.string().valid('pending', 'dibaca', 'ditindaklanjuti', 'selesai').required()
            })
          }
        }
      },

      // ✅ Route: Hapus pesan kontak (admin only)
      {
        method: 'DELETE',
        path: '/api/contacts/{id}',
        handler: ContactPresenter.deleteContact,
        options: {
          auth: 'jwt',
          description: 'Hapus pesan kontak (admin)',
          tags: ['api', 'contact', 'admin'],
          validate: {
            params: Joi.object({
              id: Joi.number().integer().required()
            })
          }
        }
      },

      // ✅ Route: Dapatkan statistik pesan kontak (admin only)
      {
        method: 'GET',
        path: '/api/contacts/stats',
        handler: ContactPresenter.getContactStats,
        options: {
          auth: 'jwt',
          description: 'Dapatkan statistik pesan kontak (admin)',
          tags: ['api', 'contact', 'admin']
          // Tidak ada payload/query, jadi tidak perlu validate
        }
      }
    ]);

    console.log('✅ Contact routes registered successfully');
  }
};

module.exports = contactRoutes;
