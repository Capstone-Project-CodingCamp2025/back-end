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

### 🔧 Runtime & Framework
- **Node.js** – Runtime environment JavaScript untuk sisi server.
- **Hapi.js** – Framework backend ringan untuk membangun RESTful API.
- **@hapi/bell**, **@hapi/inert**, **@hapi/jwt** – Plugin resmi Hapi untuk OAuth, file serving, dan autentikasi JWT.

### 🤖 Machine Learning & Data
- **@tensorflow/tfjs-node** – TensorFlow.js untuk menjalankan model AI di sisi server.
- **compute-cosine-similarity** – Untuk perhitungan kemiripan konten berbasis vektor.
- **numpy-parser** – Untuk membaca file `.npy` (NumPy) di Node.js.

### 🔐 Autentikasi & Keamanan
- **bcrypt**, **bcryptjs** – Enkripsi password.
- **jsonwebtoken (JWT)** – Untuk otorisasi via token.
- **passport**, **passport-google-oauth20** – Otentikasi pengguna via Google OAuth.

### 📡 Networking & API
- **axios** – HTTP client untuk konsumsi API eksternal.
- **cors** – Middleware untuk mengatur kebijakan CORS (Cross-Origin Resource Sharing).

### 📂 File Handling & Data
- **fs**, **fs-extra** – Akses dan manipulasi file sistem.
- **csv-parser** – Membaca data dari file CSV.
- **dotenv** – Mengelola variabel lingkungan melalui file `.env`.

### 📧 Komunikasi
- **nodemailer** – Untuk mengirim email (OTP, reset password, dll).

### 🗃️ Database
- **mysql**, **mysql2** – Klien untuk koneksi ke database MySQL/MariaDB.

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
| `POST` | `/api/register` | Registrasi pengguna manual |
| `POST` | `/api/login` | Login pengguna manual |
| `GET`  | `/api/auth/google` | Redirect ke Google OAuth |
| `GET`  | `/api/auth/google/callback` | Callback setelah login Google |
| `POST` | `/api/auth/google/token` | Login menggunakan token Google |
| `POST` | `/api/auth/google/register` | Registrasi pengguna via Google |
| `GET`  | `/api/me` | Mendapatkan data user saat ini |
| `GET`  | `/api/check-auth` | Mengecek status autentikasi |
| `POST` | `/api/logout` | Logout pengguna |
| `POST` | `/api/forgot-password` | Lupa password - kirim OTP |
| `POST` | `/api/verify-otp` | Verifikasi OTP |
| `POST` | `/api/reset-password` | Reset password baru |
| `POST` | `/api/resend-otp` | Kirim ulang OTP |
| `GET`  | `/api/places` | Mendapatkan semua tempat wisata |
| `GET`  | `/api/places/{id}` | Mendapatkan tempat wisata berdasarkan ID |
| `GET`  | `/api/places/{id}/details` | Mendapatkan detail tempat & review |
| `GET`  | `/api/places/{placeId}/reviews` | Mendapatkan semua review tempat |
| `GET`  | `/api/places/{placeId}/ratings` | Mendapatkan semua rating tempat |
| `POST` | `/api/places/{placeId}/ratings` | Submit review dan rating |
| `POST` | `/api/ratings` | Submit rating (umum) |
| `POST` | `/api/initial-ratings` | Submit rating awal saat registrasi |
| `GET`  | `/api/bookmarks` | Mendapatkan semua bookmark pengguna |
| `POST` | `/api/bookmarks` | Menambahkan bookmark |
| `DELETE` | `/api/bookmarks/{placeId}` | Menghapus bookmark berdasarkan ID tempat |
| `GET`  | `/api/bookmarks/check/{placeId}` | Mengecek apakah tempat dibookmark |
| `POST` | `/api/bookmarks/status` | Mengecek status bookmark untuk banyak tempat |
| `POST` | `/api/contacts` | Kirim pesan ke kontak |
| `GET`  | `/api/contacts` | (Admin) Mendapatkan semua pesan kontak |
| `GET`  | `/api/contacts/{id}` | (Admin) Mendapatkan pesan berdasarkan ID |
| `PUT`  | `/api/contacts/{id}/status` | (Admin) Update status pesan kontak |
| `DELETE` | `/api/contacts/{id}` | (Admin) Hapus pesan kontak |
| `GET`  | `/api/contacts/stats` | (Admin) Statistik pesan kontak |
| `GET`  | `/api/recommendations` | Rekomendasi untuk pengguna (umum) |
| `GET`  | `/api/recommendations/popular` | Rekomendasi tempat populer |
| `GET`  | `/api/recommendations/hybrid` | Hybrid rekomendasi |
| `GET`  | `/api/user/rating-status` | Mengecek status rating user |
| `GET`  | `/api/cbf/{placeName}` | Rekomendasi wisata (Content-Based Filtering) |
| `POST` | `/api/cf/recommend` | Rekomendasi wisata (Collaborative Filtering) |

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
