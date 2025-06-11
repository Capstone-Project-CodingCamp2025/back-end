// models/userModel.js - Fixed with correct column names
const db = require("../config/db");

const UserModel = {
  async findByEmail(email) {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  async findByGoogleId(googleId) {
    const [rows] = await db.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
    return rows[0];
  },

  // FIXED: Using 'username' instead of 'fullname' to match database schema
  async create(userData) {
    const { email, password, username, google_id, profile_picture, created_at, updated_at } = userData;
    
    const [result] = await db.query(
      "INSERT INTO users (email, password, username, google_id, profile_picture, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, password, username, google_id || null, profile_picture || null, created_at, updated_at]
    );
    return result.insertId;
  },

  async createGoogleUser({ googleId, email, username, profilePicture }) {
    const [result] = await db.query(
      "INSERT INTO users (username, email, google_id, profile_picture, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, email, googleId, profilePicture, null, new Date(), new Date()]
    );
    return result.insertId;
  },

  async updateUser(id, updates) {
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (fields.length === 0) return false;
    
    values.push(id);
    
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  },

  async updateGoogleInfo(userId, googleInfo) {
    const { google_id, profile_picture } = googleInfo;
    const [result] = await db.query(
      "UPDATE users SET google_id = ?, profile_picture = ?, updated_at = ? WHERE id = ?",
      [google_id, profile_picture, new Date(), userId]
    );
    return result.affectedRows > 0;
  },

  async linkGoogleAccount(userId, googleId, profilePicture) {
    const [result] = await db.query(
      "UPDATE users SET google_id = ?, profile_picture = ?, updated_at = ? WHERE id = ?",
      [googleId, profilePicture, new Date(), userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = UserModel;