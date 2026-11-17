# KK-SCANNER PRO: Sistem Ekstraksi OCR & Validasi Kartu Keluarga

Web App Full-Stack otomatis untuk memindai, mengekstraksi, memvalidasi struktur 16-digit, dan mengelola dokumen **Kartu Keluarga (KK) Republik Indonesia** sesuai standar regulasi **Permendagri No. 109 Tahun 2019**.

Sistem ini menggunakan **manual computer vision pipeline** (OpenCV + Tesseract OCR lokal + RapidFuzz) **tanpa API LLM / Cloud OCR berbayar**, dirancang hemat memori (< 512 MB RAM) agar dapat berjalan mulus di tier gratis Cloud hosting (Render & Supabase).

---

## 1. Daftar Isi
- [Arsitektur & Tech Stack](#2-arsitektur--tech-stack)
- [Struktur Folder](#3-struktur-folder)
- [Skema Database (PostgreSQL / Supabase)](#4-skema-database-postgresql--supabase)
- [Panduan Jalankan Lokal](#5-panduan-jalankan-lokal)
- [Panduan Setup Supabase](#6-panduan-setup-supabase)
- [Panduan Deploy Backend ke Render (Docker)](#7-panduan-deploy-backend-ke-render-docker)
- [Panduan Deploy Frontend ke Vercel](#8-panduan-deploy-frontend-ke-vercel)
- [Daftar Endpoint REST API & Contoh Response JSON](#9-daftar-endpoint-rest-api--contoh-response-json)
- [Panduan Troubleshooting & Tips Optimasi](#10-panduan-troubleshooting--tips-optimasi)

---

## 2. Arsitektur & Tech Stack

```mermaid
flowchart LR
    Browser["Client Browser (Next.js 14)"] -- "1. Compress citra (<2000px, Q:0.8)" --> Browser
    Browser -- "2. Direct Multipart Upload (POST /api/ocr)" --> Flask["Flask Backend (Render Docker)"]
    Flask -- "In-Memory OCR (OpenCV + Tesseract)" --> Flask
    Flask -- "JSON {identitas, anggota}" --> Browser
    Browser -- "3. Edit / Konfirmasi & POST /api/kk" --> Flask
    Flask -- "4. SQLAlchemy Transaction (Pooler Port 6543)" --> Supabase[("PostgreSQL (Supabase)")]
```

- **Frontend**: Next.js 14 (App Router, TypeScript Strict, Tailwind CSS).
  - Mengadopsi **Monochrome Swiss-Archival Design System** (Achromatik: `#FFFFFF`, `#F4F4F5`, `#09090B`).
  - Dilengkapi Interactive KK Sheet Facsimile, animasi pemindai laser, dekoder 16-digit interaktif, dan toast alerts (tanpa `alert()` bawaan browser).
  - Kompresi sisi klien menggunakan HTML5 Canvas sebelum upload untuk menghemat bandwidth dan memori.
  - Memanggil backend langsung (`NEXT_PUBLIC_API_BASE_URL`), sehingga upload tidak terhambat limit request body Vercel (~4.5 MB).
- **Backend**: Python 3.11, Flask, Flask-SQLAlchemy, Flask-CORS, Gunicorn.
  - Berbasis Docker container di Render Web Service.
  - OCR Engine: **Tesseract OCR (Bahasa Indonesia `ind`)** + **OpenCV Headless** + **RapidFuzz**.
  - Perlindungan Memori 512 MB RAM: Proses 1 citra per request, pembersihan array numpy besar (`del` + `gc.collect()`), tanpa dependensi berat (Torch / EasyOCR / PaddleOCR).
- **Database**: PostgreSQL di Supabase.
  - Diakses **HANYA** dari Backend Flask melalui connection pooler (Supavisor IPv4 port 6543/5432).
  - Row Level Security (RLS) diaktifkan untuk keamanan data kependudukan.

---

## 3. Struktur Folder

```text
kartukeluarga/
├── README.md
├── .gitignore
├── kk_scanner_pro_sistem_ekstraksi_ocr_validasi_kartu_keluarga.html  # Desain acuan
├── backend/
│   ├── Dockerfile                   # Multi-stage/Slim Docker image untuk Render
│   ├── .dockerignore
│   ├── requirements.txt             # Dependensi Python
│   ├── .env.example                 # Template environment variable backend
│   ├── app.py                       # Application factory, CORS, error handling, CLI init-db
│   ├── config.py                    # Konfigurasi SQLAlchemy, CORS origins, limit 8MB
│   ├── models.py                    # Model ORM "tbl_identitasKK" & "tbl_anggotaKeluargaKK"
│   ├── schema.sql                   # File DDL SQL PostgreSQL murni + RLS
│   ├── ocr_cli.py                   # Script CLI mandiri untuk menguji gambar
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── validators.py            # Validasi 16-digit angka, tanggal ISO, mandatory fields
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── ocr.py                   # /api/health dan /api/ocr (In-memory pipeline)
│   │   ├── kk.py                    # /api/kk CRUD (Atomic transaction & search)
│   │   └── anggota.py               # /api/kk/<id>/anggota & /api/anggota/<id>
│   └── services/
│       ├── __init__.py
│       ├── constants.py             # Lookup enumerasi Agama, Pendidikan, Relasi, dll.
│       ├── preprocessing.py         # Decode bytes, resize, deskew, perspective warp, binarize
│       ├── segmentation.py          # Morfologi deteksi garis tabel & sel
│       ├── parsing.py               # Pembersihan 16-digit, dekoder NIK, rapidfuzz
│       └── ocr_service.py           # Orkestrasi pipeline Tesseract + memori cleanup
└── frontend/
    ├── package.json
    ├── tsconfig.json                # TypeScript strict mode
    ├── tailwind.config.ts           # Konfigurasi Monochrome Archival theme
    ├── postcss.config.mjs
    ├── next.config.mjs
    ├── types.ts                     # Strict TypeScript interfaces
    ├── .env.example                 # Template environment variable frontend
    ├── lib/
    │   ├── api.ts                   # Modul terpusat seluruh pemanggilan REST API
    │   └── utils.ts                 # Kompresi canvas client & dekoder NIK
    ├── components/
    │   ├── Navbar.tsx               # Header navigasi & server health badge
    │   ├── Footer.tsx               # Footer monokromatik
    │   ├── Toast.tsx                # Toast notifikasi responsif
    │   ├── InteractiveKkSheet.tsx   # Facsimile lembar KK & laser scanner
    │   ├── EditIdentitasModal.tsx   # Dialog modal edit kepala keluarga/alamat
    │   ├── EditMemberModal.tsx      # Dialog modal edit/tambah anggota keluarga
    │   └── ConfirmDeleteModal.tsx   # Dialog konfirmasi hapus aman
    └── app/
        ├── layout.tsx
        ├── globals.css              # Variabel CSS tema terang/gelap & laser anim
        ├── page.tsx                 # [Halaman 1] Meja Pemindai & Upload
        ├── konfirmasi/
        │   └── page.tsx             # [Halaman 2] Form Konfirmasi & Edit sebelum simpan
        └── kk/
            ├── page.tsx             # [Halaman 3] Penelusuran & Tabel Data KK
            └── [id]/
                └── page.tsx         # [Halaman 4] Detail Identitas & Anggota Keluarga
```

---

## 4. Skema Database (PostgreSQL / Supabase)

Kedua tabel menggunakan case-sensitive quotes (`"tbl_identitasKK"` dan `"tbl_anggotaKeluargaKK"`) dengan relasi `ON DELETE CASCADE`.

### 1. `tbl_identitasKK`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGSERIAL PK | Primary key autoincrement |
| `no_kk` | VARCHAR(16) | Nomor KK 16 digit, UNIQUE, NOT NULL |
| `nama_kepala_keluarga` | VARCHAR(255) | Nama Kepala Keluarga, NOT NULL |
| `alamat` | TEXT | Alamat domisili lengkap |
| `rt`, `rw` | VARCHAR(10) | Nomor RT dan RW |
| `desa_kelurahan` | VARCHAR(100) | Nama Desa / Kelurahan |
| `kecamatan` | VARCHAR(100) | Nama Kecamatan |
| `kabupaten_kota` | VARCHAR(100) | Nama Kabupaten atau Kota |
| `provinsi` | VARCHAR(100) | Nama Provinsi |
| `kode_pos` | VARCHAR(10) | Kode pos 5 digit |
| `tanggal_dikeluarkan` | DATE | Tanggal penerbitan KK (nullable) |
| `created_at`, `updated_at`| TIMESTAMPTZ | Waktu simpan dan modifikasi |

### 2. `tbl_anggotaKeluargaKK`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | BIGSERIAL PK | Primary key autoincrement |
| `id_kk` | BIGINT FK | FK ke `tbl_identitasKK.id` ON DELETE CASCADE |
| `no_urut` | INT | Nomor urut anggota dalam KK |
| `nama_lengkap` | VARCHAR(255) | Nama lengkap anggota keluarga |
| `nik` | VARCHAR(16) | NIK 16 digit angka |
| `jenis_kelamin` | VARCHAR(20) | `LAKI-LAKI` atau `PEREMPUAN` |
| `tempat_lahir` | VARCHAR(100) | Kota/Kabupaten tempat lahir |
| `tanggal_lahir` | DATE | Tanggal lahir format YYYY-MM-DD |
| `agama` | VARCHAR(50) | Agama yang diakui |
| `pendidikan` | VARCHAR(100) | Jenjang pendidikan terakhir |
| `jenis_pekerjaan` | VARCHAR(100) | Profesi / pekerjaan |
| `golongan_darah` | VARCHAR(10) | A / B / AB / O / - |
| `status_perkawinan` | VARCHAR(50) | BELUM KAWIN / KAWIN TERCATAT / dll. |
| `tanggal_perkawinan` | DATE | Nullable jika belum kawin |
| `status_hubungan_dalam_keluarga`| VARCHAR(50)| KEPALA KELUARGA / ISTRI / ANAK / dll. |
| `kewarganegaraan` | VARCHAR(10) | WNI / WNA |
| `no_paspor`, `no_kitas_kitap` | VARCHAR(50) | Nullable |
| `nama_ayah`, `nama_ibu` | VARCHAR(255) | Nama orang tua kandung |
| `created_at`, `updated_at`| TIMESTAMPTZ | Waktu simpan dan modifikasi |

---

## 5. Panduan Jalankan Lokal

### Prasyarat
1. **Python 3.11 atau 3.12**
2. **Node.js 18+ & npm**
3. **Tesseract OCR (dengan data bahasa Indonesia `ind`)**:
   - **Windows**:
     1. Unduh installer Tesseract dari [UB-Mannheim Tesseract Releases](https://github.com/UB-Mannheim/tesseract/wiki).
     2. Saat instalasi, centang pilihan **Additional language data (download)** -> pilih **Indonesian**.
     3. Tambahkan path `C:\Program Files\Tesseract-OCR` ke System PATH Windows, atau set variabel env `TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe`.
   - **Ubuntu/Debian**:
     ```bash
     sudo apt-get update
     sudo apt-get install -y tesseract-ocr tesseract-ocr-ind
     ```
   - **macOS (Homebrew)**:
     ```bash
     brew install tesseract tesseract-lang
     ```

### Jalankan Backend Flask
1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Buat virtual environment & aktifkan:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Konfigurasi file `.env`:
   Salin `.env.example` menjadi `.env`. Jika ingin menguji lokal tanpa koneksi Supabase, kosongkan `DATABASE_URL` (backend otomatis menggunakan SQLite lokal `kk_scanner.db`):
   ```env
   FLASK_ENV=development
   DATABASE_URL=
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   DEBUG_OCR=0
   ```
5. Inisialisasi tabel database:
   ```bash
   flask init-db
   ```
6. Jalankan server Flask:
   ```bash
   python app.py
   # Server berjalan di http://localhost:5000
   ```

### Jalankan Script OCR Mandiri (CLI)
Anda dapat menguji pembacaan gambar Kartu Keluarga langsung dari terminal tanpa membuka web browser:
```bash
cd backend
python ocr_cli.py path/ke/kartu_keluarga.jpg
```
Untuk menyimpan gambar prapemrosesan (deskew, binarize, crop):
```bash
# Windows PowerShell:
$env:DEBUG_OCR="1"; python ocr_cli.py sample.jpg
# Linux/macOS:
DEBUG_OCR=1 python ocr_cli.py sample.jpg
```
Hasil pemrosesan gambar akan tersimpan di folder `backend/debug_ocr/`.

### Jalankan Frontend Next.js
1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi file `.env.local`:
   Salin `.env.example` menjadi `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```
4. Jalankan development server:
   ```bash
   npm run dev
   ```
5. Buka peramban di `http://localhost:3000`.

---

## 6. Panduan Setup Supabase

Aplikasi mengakses database Supabase **HANYA** melalui backend Python menggunakan connection string pooler (Supavisor) dengan format `postgresql+psycopg2://`. Frontend **TIDAK** mengakses Supabase secara langsung.

### Langkah-langkah:
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru (atau buka project yang sudah ada).
2. Ambil **Connection String Pooler (Supavisor)**:
   - Masuk ke menu **Project Settings** (ikon gerigi) -> **Database**.
   - Gulir ke bagian **Connection Pooling** (Supavisor).
   - Mode: Pilih **Transaction Mode (Port 6543)** atau **Session Mode (Port 5432)**.
   - Pilih tab **URI**.
   - Format URI Supavisor biasanya:
     ```text
     postgres://postgres.[PROJECT_REF]:[PASSWORD]@[POOLER_HOST]:6543/postgres
     ```
   - Di file konfigurasi backend / Render, ubah protokolnya menjadi `postgresql+psycopg2://` dan tambahkan `?sslmode=require`:
     ```text
     postgresql+psycopg2://postgres.yhmqyymadyltgwvogfvw:0004025438Zimrion@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
     ```
3. Eksekusi Skema DDL & Aktifkan RLS:
   - Buka menu **SQL Editor** pada navigasi Supabase.
   - Salin seluruh isi berkas [backend/schema.sql](file:///d:/kartukeluarga/backend/schema.sql).
   - Klik tombol **Run**.
   - Perintah ini akan:
     - Membuat tabel `"tbl_identitasKK"` dan `"tbl_anggotaKeluargaKK"`.
     - Membuat index pada `no_kk`, `nama_kepala_keluarga`, `id_kk`, dan `nik`.
     - Menjalankan `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` pada kedua tabel.
4. Verifikasi:
   - Buka menu **Table Editor** di Supabase.
   - Pastikan kedua tabel muncul dan memiliki tag status `RLS enabled`.

---

## 7. Panduan Deploy Backend ke Render (Docker)

Backend dideploy sebagai **Web Service** berbasis **Docker** pada [Render](https://render.com).

### Langkah-langkah:
1. Pastikan seluruh kode sudah ter-push ke GitHub:
   ```bash
   git push origin main
   ```
2. Buka dashboard Render -> klik **New +** -> pilih **Web Service**.
3. Hubungkan repositori GitHub Anda (`https://github.com/ZimrionVarethos/citra.git`).
4. Atur konfigurasi service:
   - **Name**: `kk-scanner-backend` (atau nama pilihan Anda)
   - **Region**: Singapore (Southeast Asia) atau region terdekat dengan Supabase Anda
   - **Root Directory**: `backend` *(Penting: arahkan ke subfolder backend)*
   - **Environment**: **Docker**
   - **Docker Context**: `.` *(atau `backend` jika Root Directory kosong)*
   - **Docker Command**: *(Biarkan kosong, Dockerfile sudah memiliki CMD)*
   - **Instance Type**: **Free (512 MB RAM)**
5. Atur **Environment Variables** di Render:
   | Key | Value Contoh |
   |---|---|
   | `DATABASE_URL` | `postgresql+psycopg2://postgres.yhmqyymadyltgwvogfvw:0004025438Zimrion@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require` |
   | `ALLOWED_ORIGINS` | `http://localhost:3000,https://kk-scanner-pro.vercel.app` *(Nanti diperbarui dengan domain Vercel Anda)* |
   | `FLASK_ENV` | `production` |
   | `DEBUG_OCR` | `0` |
   | `SECRET_KEY` | *(Generate 32 karakter acak)* |
6. Atur **Health Check Path**:
   - Di tab **Health & Metrics**, set Health Check Path ke: `/api/health`.
7. Klik **Create Web Service**.
8. Setelah status `Live`, uji endpoint health check menggunakan `curl`:
   ```bash
   curl https://kk-scanner-backend.onrender.com/api/health
   # Response: {"service":"KK-SCANNER PRO OCR Backend","status":"healthy","version":"1.0.0"}
   ```

---

## 8. Panduan Deploy Frontend ke Vercel

Frontend dideploy ke [Vercel](https://vercel.com).

### Langkah-langkah:
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) -> klik **Add New...** -> **Project**.
2. Impor repositori GitHub `ZimrionVarethos/citra`.
3. Pada halaman konfigurasi project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Klik **Edit** dan pilih `frontend`.
4. Tambahkan **Environment Variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: URL backend Render Anda (contoh: `https://kk-scanner-backend.onrender.com` tanpa garis miring penutup).
5. Klik **Deploy**.
6. Setelah deployment selesai, salin URL domain yang diberikan Vercel (contoh: `https://citra-frontend.vercel.app`).
7. **Sinkronisasi CORS di Render**:
   - Buka service Render backend Anda -> masuk ke tab **Environment**.
   - Perbarui nilai `ALLOWED_ORIGINS` dengan menyertakan domain Vercel Anda:
     ```text
     http://localhost:3000,https://citra-frontend.vercel.app
     ```
   - Klik **Save Changes** (Render akan redeploy otomatis dalam beberapa detik).

---

## 9. Daftar Endpoint REST API & Contoh Response JSON

Semua response bertipe `application/json` dengan prefix `/api`.

### 1. `GET /api/health`
Ping cold-start dan uptime monitoring.
```json
{
  "service": "KK-SCANNER PRO OCR Backend",
  "status": "healthy",
  "version": "1.0.0"
}
```

### 2. `POST /api/ocr`
Menerima file gambar via `multipart/form-data` (field `image`). Memproses citra di memori tanpa menyimpan file ke disk atau database.
```json
{
  "identitas": {
    "no_kk": "3271041508190004",
    "nama_kepala_keluarga": "HENDRA WIJAYA, S.T.",
    "alamat": "JL. SURYAKENCANA NO. 48",
    "rt": "003",
    "rw": "005",
    "desa_kelurahan": "BABAKAN PASAR",
    "kecamatan": "BOGOR TENGAH",
    "kabupaten_kota": "KOTA BOGOR",
    "provinsi": "JAWA BARAT",
    "kode_pos": "16126",
    "tanggal_dikeluarkan": "2023-08-15"
  },
  "anggota": [
    {
      "no_urut": 1,
      "nama_lengkap": "HENDRA WIJAYA, S.T.",
      "nik": "3271041205850001",
      "jenis_kelamin": "LAKI-LAKI",
      "tempat_lahir": "BOGOR",
      "tanggal_lahir": "1985-05-12",
      "agama": "ISLAM",
      "pendidikan": "DIPLOMA IV / STRATA I",
      "jenis_pekerjaan": "KARYAWAN SWASTA",
      "golongan_darah": "O",
      "status_perkawinan": "KAWIN TERCATAT",
      "tanggal_perkawinan": "2010-06-20",
      "status_hubungan_dalam_keluarga": "KEPALA KELUARGA",
      "kewarganegaraan": "WNI",
      "no_paspor": "",
      "no_kitas_kitap": "",
      "nama_ayah": "DARMAWAN WIJAYA",
      "nama_ibu": "SITI AMINAH",
      "nik_validation": {
        "valid": true,
        "prov_code": "32",
        "city_code": "71",
        "district_code": "04",
        "gender": "LAKI-LAKI",
        "birth_date": "1985-05-12"
      }
    }
  ],
  "zone_scores": [99.4, 98.8, 98.2, 97.5, 99.0],
  "confidence": 98.6,
  "total_anggota": 1
}
```

### 3. `POST /api/kk`
Menyimpan identitas KK dan daftar anggota dalam satu transaksi database atomik.
**Payload:**
```json
{
  "identitas": {
    "no_kk": "3271041508190004",
    "nama_kepala_keluarga": "HENDRA WIJAYA",
    "alamat": "JL. SURYAKENCANA NO. 48",
    "rt": "003",
    "rw": "005",
    "desa_kelurahan": "BABAKAN PASAR",
    "kecamatan": "BOGOR TENGAH",
    "kabupaten_kota": "KOTA BOGOR",
    "provinsi": "JAWA BARAT",
    "kode_pos": "16126",
    "tanggal_dikeluarkan": "2023-08-15"
  },
  "anggota": [
    {
      "no_urut": 1,
      "nama_lengkap": "HENDRA WIJAYA",
      "nik": "3271041205850001",
      "jenis_kelamin": "LAKI-LAKI",
      "tempat_lahir": "BOGOR",
      "tanggal_lahir": "1985-05-12",
      "agama": "ISLAM",
      "pendidikan": "DIPLOMA IV / STRATA I",
      "jenis_pekerjaan": "KARYAWAN SWASTA",
      "golongan_darah": "O",
      "status_perkawinan": "KAWIN TERCATAT",
      "status_hubungan_dalam_keluarga": "KEPALA KELUARGA",
      "kewarganegaraan": "WNI",
      "nama_ayah": "DARMAWAN WIJAYA",
      "nama_ibu": "SITI AMINAH"
    }
  ]
}
```
**Response (201 Created):**
```json
{
  "message": "Kartu Keluarga dan seluruh anggota berhasil disimpan.",
  "data": {
    "id": 1,
    "no_kk": "3271041508190004",
    "nama_kepala_keluarga": "HENDRA WIJAYA",
    "alamat": "JL. SURYAKENCANA NO. 48",
    "jumlah_anggota": 1,
    "created_at": "2024-11-17T15:30:00Z"
  }
}
```

Jika `no_kk` sudah terdaftar **(409 Conflict)**:
```json
{
  "error": "Nomor KK 3271041508190004 sudah terdaftar dalam sistem.",
  "fields": {
    "no_kk": "Nomor KK ini telah terdaftar sebelumnya."
  }
}
```

### 4. `GET /api/kk?q=&page=1&per_page=10`
Daftar ringkas KK dengan filter pencarian dan pagination.
```json
{
  "data": [
    {
      "id": 1,
      "no_kk": "3271041508190004",
      "nama_kepala_keluarga": "HENDRA WIJAYA",
      "alamat": "JL. SURYAKENCANA NO. 48",
      "rt": "003",
      "rw": "005",
      "desa_kelurahan": "BABAKAN PASAR",
      "kecamatan": "BOGOR TENGAH",
      "kabupaten_kota": "KOTA BOGOR",
      "provinsi": "JAWA BARAT",
      "kode_pos": "16126",
      "tanggal_dikeluarkan": "2023-08-15",
      "jumlah_anggota": 4,
      "created_at": "2024-11-17T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 1,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### 5. `GET /api/kk/<id>`
Detail lengkap satu KK beserta seluruh anggota keluarga.
```json
{
  "id": 1,
  "no_kk": "3271041508190004",
  "nama_kepala_keluarga": "HENDRA WIJAYA",
  "alamat": "JL. SURYAKENCANA NO. 48",
  "rt": "003",
  "rw": "005",
  "desa_kelurahan": "BABAKAN PASAR",
  "kecamatan": "BOGOR TENGAH",
  "kabupaten_kota": "KOTA BOGOR",
  "provinsi": "JAWA BARAT",
  "kode_pos": "16126",
  "tanggal_dikeluarkan": "2023-08-15",
  "anggota": [
    {
      "id": 1,
      "id_kk": 1,
      "no_urut": 1,
      "nama_lengkap": "HENDRA WIJAYA",
      "nik": "3271041205850001",
      "jenis_kelamin": "LAKI-LAKI",
      "tempat_lahir": "BOGOR",
      "tanggal_lahir": "1985-05-12",
      "agama": "ISLAM",
      "pendidikan": "DIPLOMA IV / STRATA I",
      "jenis_pekerjaan": "KARYAWAN SWASTA",
      "golongan_darah": "O",
      "status_perkawinan": "KAWIN TERCATAT",
      "status_hubungan_dalam_keluarga": "KEPALA KELUARGA",
      "kewarganegaraan": "WNI",
      "nama_ayah": "DARMAWAN WIJAYA",
      "nama_ibu": "SITI AMINAH"
    }
  ]
}
```

### 6. `PUT /api/kk/<id>`
Memperbarui metadata kepala keluarga dan alamat domisili.
```json
{
  "message": "Identitas Kartu Keluarga berhasil diperbarui.",
  "data": { "id": 1, "no_kk": "3271041508190004", "..." : "..." }
}
```

### 7. `DELETE /api/kk/<id>`
Menghapus data KK dan seluruh anggotanya secara kaskade.
```json
{
  "deleted_id": 1,
  "message": "Kartu Keluarga No. 3271041508190004 dan seluruh anggotanya berhasil dihapus."
}
```

### 8. `POST /api/kk/<id>/anggota`
Menambahkan anggota keluarga baru ke KK tertentu.
```json
{
  "message": "Anggota keluarga berhasil ditambahkan.",
  "data": { "id": 5, "id_kk": 1, "nama_lengkap": "ANAK BARU", "nik": "3271042501240001", "..." : "..." }
}
```

### 9. `PUT /api/anggota/<id>`
Memperbarui biodata satu anggota keluarga.
```json
{
  "message": "Data anggota keluarga berhasil diperbarui.",
  "data": { "id": 1, "nama_lengkap": "HENDRA WIJAYA, S.T.", "..." : "..." }
}
```

### 10. `DELETE /api/anggota/<id>`
Menghapus satu baris anggota keluarga.
```json
{
  "deleted_id": 1,
  "message": "Anggota keluarga 'HENDRA WIJAYA' berhasil dihapus."
}
```

---

## 10. Panduan Troubleshooting & Tips Optimasi

### 1. Error CORS (Cross-Origin Resource Sharing)
- **Gejala**: Browser memunculkan pesan `Access to fetch at ... from origin 'https://...' has been blocked by CORS policy`.
- **Penyebab**: Domain frontend Vercel belum didaftarkan pada variabel `ALLOWED_ORIGINS` di Render.
- **Solusi**: Di dashboard Render -> Web Service -> Environment, ubah:
  ```text
  ALLOWED_ORIGINS=http://localhost:3000,https://domain-kamu.vercel.app
  ```
  *(Catatan: Jangan tambahkan trailing slash `/` di akhir domain).*

### 2. Cold Start pada Render Free Tier (~30 - 60 Detik)
- **Gejala**: Permintaan pertama kali terasa sangat lambat atau loading berputar lama.
- **Penyebab**: Render free tier menonaktifkan (*spin down*) container yang tidak aktif selama 15 menit untuk menghemat resource.
- **Solusi**:
  - Aplikasi frontend secara proaktif memanggil `/api/health` saat halaman web dibuka pertama kali untuk membangunkan backend (*warm up*).
  - Badge status peladen di Navbar akan menampilkan indikator `WARMING UP` berwarna kuning yang kemudian berubah menjadi hijau `SERVER ONLINE`.

### 3. Masalah Limit Ukuran File (Request Entity Too Large / 413)
- **Penyebab**: Vercel Serverless Function membatasi payload request sebesar ~4.5 MB.
- **Solusi Arsitektur**:
  - Frontend **TIDAK** mengirim gambar melalui Next.js API Routes. Frontend mengunggah langsung dari browser via `fetch()` ke Render backend (`NEXT_PUBLIC_API_BASE_URL/api/ocr`).
  - Frontend melakukan **kompresi kanvas sisi klien** (`compressImageClientSide`), mengubah resolusi ke sisi terpanjang maksimal 2000px dengan JPEG quality 0.8. Hasil kompresi biasanya berukuran ~300 KB - 800 KB, sangat aman dari batas 8 MB backend dan memori 512 MB.

### 4. Masalah Koneksi Database Supabase (IPv6 vs Pooler Supavisor)
- **Penyebab**: Host direct Supabase (`db.[PROJECT_REF].supabase.co`) hanya mendukung protokol IPv6 secara default. Layanan cloud seperti Render seringkali hanya memiliki konektivitas IPv4 keluar.
- **Solusi**:
  - Selalu gunakan **Supavisor connection pooler host** yang mendukung IPv4 (contoh: `aws-0-[REGION].pooler.supabase.com:6543/postgres`).
  - Tambahkan parameter `?sslmode=require` pada connection string `postgresql+psycopg2://`.

### 5. Out Of Memory (OOM) pada RAM 512 MB Render
- **Pencegahan yang Diterapkan**:
  - Gunicorn dijalankan hanya dengan **1 worker** (`--workers 1 --threads 2`).
  - Gambar di-resize ke maksimal 2000 px sebelum diproses oleh OpenCV.
  - Memori array citra dibersihkan secara eksplisit menggunakan `del` dan `gc.collect()`.
  - Menggunakan Tesseract OCR bawaan OS Linux (C++) alih-alih model deep learning berbasis PyTorch/Transformers yang memakan RAM 1.5 - 2 GB.

### 6. Tips Tuning Kualitas Pembacaan OCR Kartu Keluarga
- **Pencahayaan**: Hindari bayangan tangan atau pantulan lampu (*glare*) pada plastik laminasi KK.
- **Orientasi**: Ambil foto tegak lurus (tegak/landscape sesuai lembaran). Algoritma deskew otomatis mampu mengoreksi kemiringan hingga ±30 derajat.
- **Biner B/W**: Fitur binerisasi adaptif mengubah lembar menjadi hitam-putih murni, sangat efektif untuk blangko HVS A4 standar Dukcapil.
- **Validasi Silang NIK**: Jika digit NIK perempuan memiliki angka tanggal > 40 (misal `55`), sistem secara cerdas mengenali bahwa pemiliknya adalah perempuan yang lahir pada tanggal `15` (`55 - 40`), sehingga jenis kelamin dan tanggal lahir terverifikasi otomatis.
