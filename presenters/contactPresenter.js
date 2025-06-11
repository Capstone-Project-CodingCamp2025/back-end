// presenter/contactPresenter.js
const ContactService = require('../services/contactService');
const ContactView = require('../views/contactView');

class ContactPresenter {
  // Handler untuk membuat pesan kontak baru
  static async createContact(request, h) {
    try {
      const contactData = request.payload;
      const contact = await ContactService.createContact(contactData);
      
      return h.response(ContactView.createSuccess(contact)).code(201);
    } catch (error) {
      console.error('ContactPresenter - createContact error:', error);
      
      if (error.type === 'validation') {
        return h.response(ContactView.validationError(error.errors)).code(400);
      }
      
      if (error.type === 'database') {
        return h.response(ContactView.createError(error.message)).code(500);
      }
      
      return h.response(ContactView.serverError()).code(500);
    }
  }

  // Handler untuk mendapatkan semua pesan kontak (admin only)
  static async getAllContacts(request, h) {
    try {
      const { page, limit, status } = request.query;
      const contacts = await ContactService.getAllContacts(page, limit, status);
      
      return h.response(ContactView.getAllSuccess(contacts)).code(200);
    } catch (error) {
      console.error('ContactPresenter - getAllContacts error:', error);
      
      if (error.type === 'database') {
        return h.response(ContactView.serverError(error.message)).code(500);
      }
      
      return h.response(ContactView.serverError()).code(500);
    }
  }

  // Handler untuk mendapatkan pesan kontak berdasarkan ID (admin only)
  static async getContactById(request, h) {
    try {
      const { id } = request.params;
      const contact = await ContactService.getContactById(id);
      
      return h.response(ContactView.getByIdSuccess(contact)).code(200);
    } catch (error) {
      console.error('ContactPresenter - getContactById error:', error);
      
      if (error.type === 'validation') {
        return h.response(ContactView.validationError(error.errors)).code(400);
      }
      
      if (error.type === 'not_found') {
        return h.response(ContactView.notFound(error.message)).code(404);
      }
      
      if (error.type === 'database') {
        return h.response(ContactView.serverError(error.message)).code(500);
      }
      
      return h.response(ContactView.serverError()).code(500);
    }
  }

  // Handler untuk update status pesan kontak (admin only)
  static async updateContactStatus(request, h) {
    try {
      const { id } = request.params;
      const { status } = request.payload;
      
      await ContactService.updateContactStatus(id, status);
      
      return h.response(ContactView.updateStatusSuccess()).code(200);
    } catch (error) {
      console.error('ContactPresenter - updateContactStatus error:', error);
      
      if (error.type === 'validation') {
        return h.response(ContactView.validationError(error.errors)).code(400);
      }
      
      if (error.type === 'not_found') {
        return h.response(ContactView.notFound(error.message)).code(404);
      }
      
      if (error.type === 'database') {
        return h.response(ContactView.serverError(error.message)).code(500);
      }
      
      return h.response(ContactView.serverError()).code(500);
    }
  }

  // Handler untuk menghapus pesan kontak (admin only)
  static async deleteContact(request, h) {
    try {
      const { id } = request.params;
      await ContactService.deleteContact(id);
      
      return h.response(ContactView.deleteSuccess()).code(200);
    } catch (error) {
      console.error('ContactPresenter - deleteContact error:', error);
      
      if (error.type === 'validation') {
        return h.response(ContactView.validationError(error.errors)).code(400);
      }
      
      if (error.type === 'not_found') {
        return h.response(ContactView.notFound(error.message)).code(404);
      }
      
      if (error.type === 'database') {
        return h.response(ContactView.serverError(error.message)).code(500);
      }
      
      return h.response(ContactView.serverError()).code(500);
    }
  }

  // Handler untuk mendapatkan statistik pesan kontak (admin only)
  static async getContactStats(request, h) {
    try {
      const stats = await ContactService.getContactStats();
      
      return h.response(ContactView.getStatsSuccess(stats)).code(200);
    } catch (error) {
      console.error('ContactPresenter - getContactStats error:', error);
      
      if (error.type === 'database') {
        return h.response(ContactView.serverError(error.message)).code(500);
      }
      
      return h.response(ContactView.serverError()).code(500);
    }
  }
}

module.exports = ContactPresenter;