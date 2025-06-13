# 🧠 SIRESITA - Backend Sistem Rekomendasi Wisata Sumatera Utara

**Proyek Capstone - Coding Camp 2025**  
**ID Tim:** CC25-CF119

## 📌 Deskripsi Proyek

Backend proyek **SIRESITA** dibangun menggunakan **Node.js** dan **Express.js**. Sistem ini bertugas untuk:
- Melayani permintaan RESTful API dari frontend.
- Menyediakan endpoint rekomendasi wisata berbasis **Content-Based Filtering (CBF)** dan **Collaborative Filtering (CF)**.
- Menyimpan dan mengelola data pengguna, rating, serta metadata wisata.
- Mengakses model machine learning yang telah diekspor (SavedModel TensorFlow dan TF.js).

---

## 🛠️ Teknologi yang Digunakan

- **Node.js**
- **Hapi.js**
- **TensorFlow.js**
- **dotenv**
- **CORS**
- **Body-Parser**
- **Custom Middleware (auth.js)**

---

## 📁 Struktur Direktori

```
back-end/
├── .env
├── index.js
├── package.json
├── package-lock.json
├── config/
│   ├── createDatabase.js
│   ├── db.js
│   ├── server.js
│   └── verifyDatabase.js
├── middleware/
│   └── auth.js
├── dataset/
│   └── transformed.csv
├── data/
│   ├── cbf/
│   │   ├── cosine_similarity_matrix.npy
│   │   ├── tfidf_parameters.json
│   │   └── tourism_recommendation_model.json
│   └── cf/
│       ├── encoders.json
│       ├── cf/  # TensorFlow SavedModel
│       └── tfjs_model/  # TensorFlow.js export
```

---

## ⚙️ Instalasi & Setup

### 1. Clone Repo dan Install Dependency
```bash
git clone <repo-url>
cd back-end
npm install
```

### 2. Konfigurasi Environment
Buat file `.env` berdasarkan kebutuhan koneksi database dan port:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=siresita
```

### 3. Jalankan Server
```bash
npm start
```

---

## 🔌 Endpoint API

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET`  | `/api/cbf/:placeName` | Mendapatkan rekomendasi wisata berbasis content-based |
| `POST` | `/api/cf/recommend`  | Rekomendasi wisata berbasis rating pengguna |
| `POST` | `/api/user/login`    | Login pengguna |
| `POST` | `/api/user/register` | Registrasi pengguna |
| `GET`  | `/api/places`        | Mendapatkan daftar tempat wisata |
| `POST` | `/api/rating`        | Menambahkan rating pengguna |

---

## 📡 Integrasi Model Machine Learning

- **CBF**: Model disimpan sebagai `cosine_similarity_matrix.npy`, parameter TF-IDF, dan metadata dalam JSON.
- **CF**: Model SavedModel TensorFlow (`cf/`) dan versi TensorFlow.js (`tfjs_model/`) untuk keperluan frontend/browser.

Backend ini akan melakukan:
- Load model saat server dijalankan (atau saat diperlukan).
- Kirim hasil prediksi melalui endpoint API.

---

## 🧪 Pengujian & Validasi

- Gunakan `Postman` atau `curl` untuk menguji setiap endpoint.
- Validasi input untuk user & rating.
- Gunakan log untuk debug jika model gagal loading (misal path salah atau format tidak dikenali).

---

## 📍 Tim Backend

- Ferri Krisdiantoro – Setup Server, API Handler, Routing, Auth Middleware, Integrasi Model ke API + Database
- Diah Putri Kartikasari – API Handler (Login and Register), JWT Auth

---

## 📄 Lisensi

Proyek ini dibuat untuk kebutuhan Capstone **Coding Camp 2025**.  
Lisensi: MIT.
