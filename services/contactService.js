// service/contactService.js
const ContactModel = require('../models/contactModel');

class ContactService {
  // Validasi data kontak
  static validateContactData(data) {
    const errors = [];
    const { nama, email, subjek, pesan } = data;

    // Validasi nama
    if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
      errors.push('Nama wajib diisi');
    } else if (nama.trim().length < 2) {
      errors.push('Nama minimal 2 karakter');
    } else if (nama.trim().length > 255) {
      errors.push('Nama maksimal 255 karakter');
    }

    // Validasi email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.push('Email wajib diisi');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Format email tidak valid');
      } else if (email.trim().length > 255) {
        errors.push('Email maksimal 255 karakter');
      }
    }

    // Validasi subjek
    if (!subjek || typeof subjek !== 'string' || subjek.trim().length === 0) {
      errors.push('Subjek wajib diisi');
    } else if (subjek.trim().length < 5) {
      errors.push('Subjek minimal 5 karakter');
    } else if (subjek.trim().length > 500) {
      errors.push('Subjek maksimal 500 karakter');
    }

    // Validasi pesan
    if (!pesan || typeof pesan !== 'string' || pesan.trim().length === 0) {
      errors.push('Pesan wajib diisi');
    } else if (pesan.trim().length < 10) {
      errors.push('Pesan minimal 10 karakter');
    } else if (pesan.trim().length > 5000) {
      errors.push('Pesan maksimal 5000 karakter');
    }

    return errors;
  }

  // Membersihkan data input
  static sanitizeContactData(data) {
    return {
      nama: data.nama?.trim(),
      email: data.email?.trim().toLowerCase(),
      subjek: data.subjek?.trim(),
      pesan: data.pesan?.trim()
    };
  }

  // Membuat pesan kontak baru
  static async createContact(data) {
    // Sanitize data
    const sanitizedData = this.sanitizeContactData(data);
    
    // Validasi data
    const validationErrors = this.validateContactData(sanitizedData);
    if (validationErrors.length > 0) {
      throw { type: 'validation', errors: validationErrors };
    }

    try {
      const contact = await ContactModel.create(sanitizedData);
      return contact;
    } catch (error) {
      console.error('ContactService - createContact error:', error);
      throw { type: 'database', message: 'Gagal menyimpan pesan kontak' };
    }
  }

  // Mendapatkan semua pesan kontak dengan pagination
  static async getAllContacts(page = 1, limit = 10, status = null) {
    // Validasi parameter
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const validStatuses = ['unread', 'read', 'replied'];
    const validStatus = validStatuses.includes(status) ? status : null;

    try {
      return await ContactModel.getAll(validPage, validLimit, validStatus);
    } catch (error) {
      console.error('ContactService - getAllContacts error:', error);
      throw { type: 'database', message: 'Gagal mengambil data pesan kontak' };
    }
  }

  // Mendapatkan pesan kontak berdasarkan ID
  static async getContactById(id) {
    if (!id || isNaN(parseInt(id))) {
      throw { type: 'validation', errors: ['ID tidak valid'] };
    }

    try {
      const contact = await ContactModel.getById(parseInt(id));
      if (!contact) {
        throw { type: 'not_found', message: 'Pesan kontak tidak ditemukan' };
      }
      return contact;
    } catch (error) {
      if (error.type) throw error;
      console.error('ContactService - getContactById error:', error);
      throw { type: 'database', message: 'Gagal mengambil detail pesan kontak' };
    }
  }

  // Update status pesan kontak
  static async updateContactStatus(id, status) {
    if (!id || isNaN(parseInt(id))) {
      throw { type: 'validation', errors: ['ID tidak valid'] };
    }

    const validStatuses = ['unread', 'read', 'replied'];
    if (!validStatuses.includes(status)) {
      throw { type: 'validation', errors: ['Status tidak valid'] };
    }

    try {
      // Cek apakah contact exists
      await this.getContactById(id);
      
      const updated = await ContactModel.updateStatus(parseInt(id), status);
      if (!updated) {
        throw { type: 'not_found', message: 'Pesan kontak tidak ditemukan' };
      }
      return true;
    } catch (error) {
      if (error.type) throw error;
      console.error('ContactService - updateContactStatus error:', error);
      throw { type: 'database', message: 'Gagal mengubah status pesan kontak' };
    }
  }

  // Hapus pesan kontak
  static async deleteContact(id) {
    if (!id || isNaN(parseInt(id))) {
      throw { type: 'validation', errors: ['ID tidak valid'] };
    }

    try {
      // Cek apakah contact exists
      await this.getContactById(id);
      
      const deleted = await ContactModel.delete(parseInt(id));
      if (!deleted) {
        throw { type: 'not_found', message: 'Pesan kontak tidak ditemukan' };
      }
      return true;
    } catch (error) {
      if (error.type) throw error;
      console.error('ContactService - deleteContact error:', error);
      throw { type: 'database', message: 'Gagal menghapus pesan kontak' };
    }
  }

  // Mendapatkan statistik pesan kontak
  static async getContactStats() {
    try {
      return await ContactModel.getStats();
    } catch (error) {
      console.error('ContactService - getContactStats error:', error);
      throw { type: 'database', message: 'Gagal mengambil statistik pesan kontak' };
    }
  }
}

module.exports = ContactService;