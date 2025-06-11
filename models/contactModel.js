// models/contactModel.js
const db = require('../config/db');

class ContactModel {
  // Menyimpan pesan kontak baru
  static async create(contactData) {
    const { nama, email, subjek, pesan } = contactData;
    
    const query = `
      INSERT INTO contacts (nama, email, subjek, pesan)
      VALUES (?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.execute(query, [nama, email, subjek, pesan]);
      return { id: result.insertId, ...contactData };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  // Mendapatkan semua pesan kontak (untuk admin)
  static async getAll(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM contacts';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const [rows] = await db.execute(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM contacts';
      const countParams = [];
      
      if (status) {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await db.execute(countQuery, countParams);
      
      return {
        data: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  // Mendapatkan pesan kontak berdasarkan ID
  static async getById(id) {
    const query = 'SELECT * FROM contacts WHERE id = ?';
    
    try {
      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error getting contact by id:', error);
      throw error;
    }
  }

  // Update status pesan kontak
  static async updateStatus(id, status) {
    const query = 'UPDATE contacts SET status = ?, updated_at = NOW() WHERE id = ?';
    
    try {
      const [result] = await db.execute(query, [status, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating contact status:', error);
      throw error;
    }
  }

  // Hapus pesan kontak
  static async delete(id) {
    const query = 'DELETE FROM contacts WHERE id = ?';
    
    try {
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Mendapatkan statistik pesan kontak
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied
      FROM contacts
    `;
    
    try {
      const [rows] = await db.execute(query);
      return rows[0];
    } catch (error) {
      console.error('Error getting contact stats:', error);
      throw error;
    }
  }
}

module.exports = ContactModel;