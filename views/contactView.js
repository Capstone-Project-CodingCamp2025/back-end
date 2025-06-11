// views/contactView.js
class ContactView {
  // Response untuk sukses membuat pesan kontak
  static createSuccess(data) {
    return {
      status: 'success',
      message: 'Pesan kontak berhasil dikirim',
      data: {
        id: data.id,
        nama: data.nama,
        email: data.email,
        subjek: data.subjek,
        created_at: new Date().toISOString()
      }
    };
  }

  // Response untuk gagal membuat pesan kontak
  static createError(message = 'Gagal mengirim pesan kontak') {
    return {
      status: 'fail',
      message
    };
  }

  // Response untuk validasi error
  static validationError(errors) {
    return {
      status: 'fail',
      message: 'Data tidak valid',
      errors
    };
  }

  // Response untuk mendapatkan semua pesan kontak (admin)
  static getAllSuccess(contactData) {
    return {
      status: 'success',
      message: 'Data pesan kontak berhasil diambil',
      data: contactData.data,
      pagination: {
        page: contactData.page,
        limit: contactData.limit,
        total: contactData.total,
        totalPages: contactData.totalPages
      }
    };
  }

  // Response untuk mendapatkan pesan kontak berdasarkan ID
  static getByIdSuccess(contact) {
    return {
      status: 'success',
      message: 'Detail pesan kontak berhasil diambil',
      data: contact
    };
  }

  // Response untuk pesan kontak tidak ditemukan
  static notFound(message = 'Pesan kontak tidak ditemukan') {
    return {
      status: 'fail',
      message
    };
  }

  // Response untuk sukses update status
  static updateStatusSuccess(message = 'Status pesan kontak berhasil diubah') {
    return {
      status: 'success',
      message
    };
  }

  // Response untuk sukses delete
  static deleteSuccess(message = 'Pesan kontak berhasil dihapus') {
    return {
      status: 'success',
      message
    };
  }

  // Response untuk mendapatkan statistik
  static getStatsSuccess(stats) {
    return {
      status: 'success',
      message: 'Statistik pesan kontak berhasil diambil',
      data: stats
    };
  }

  // Response untuk server error
  static serverError(message = 'Terjadi kesalahan pada server') {
    return {
      status: 'error',
      message
    };
  }

  // Response untuk unauthorized
  static unauthorized(message = 'Anda tidak memiliki akses') {
    return {
      status: 'fail',
      message
    };
  }
}

module.exports = ContactView;