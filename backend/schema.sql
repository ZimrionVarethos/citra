-- =============================================================================
-- Skema Database: KK-SCANNER PRO (PostgreSQL / Supabase)
-- Tabel: "tbl_identitasKK" & "tbl_anggotaKeluargaKK"
-- Sesuai Permendagri No. 109 Tahun 2019
-- =============================================================================

-- 1. Tabel Identitas Kartu Keluarga
CREATE TABLE IF NOT EXISTS "tbl_identitasKK" (
    id BIGSERIAL PRIMARY KEY,
    no_kk VARCHAR(16) NOT NULL UNIQUE,
    nama_kepala_keluarga VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL,
    rt VARCHAR(10) DEFAULT '',
    rw VARCHAR(10) DEFAULT '',
    desa_kelurahan VARCHAR(100) DEFAULT '',
    kecamatan VARCHAR(100) DEFAULT '',
    kabupaten_kota VARCHAR(100) DEFAULT '',
    provinsi VARCHAR(100) DEFAULT '',
    kode_pos VARCHAR(10) DEFAULT '',
    tanggal_dikeluarkan DATE NULL,
    gambar VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pencarian no_kk dan nama kepala keluarga
CREATE INDEX IF NOT EXISTS idx_identitas_no_kk ON "tbl_identitasKK" (no_kk);
CREATE INDEX IF NOT EXISTS idx_identitas_kepala_keluarga ON "tbl_identitasKK" (nama_kepala_keluarga);

-- 2. Tabel Anggota Keluarga Kartu Keluarga
CREATE TABLE IF NOT EXISTS "tbl_anggotaKeluargaKK" (
    id BIGSERIAL PRIMARY KEY,
    id_kk BIGINT NOT NULL,
    no_urut INT NOT NULL DEFAULT 1,
    nama_lengkap VARCHAR(255) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL,
    tempat_lahir VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    agama VARCHAR(50) DEFAULT '',
    pendidikan VARCHAR(100) DEFAULT '',
    jenis_pekerjaan VARCHAR(100) DEFAULT '',
    golongan_darah VARCHAR(10) DEFAULT '-',
    status_perkawinan VARCHAR(50) DEFAULT '',
    tanggal_perkawinan DATE NULL,
    status_hubungan_dalam_keluarga VARCHAR(50) NOT NULL,
    kewarganegaraan VARCHAR(10) DEFAULT 'WNI',
    no_paspor VARCHAR(50) NULL,
    no_kitas_kitap VARCHAR(50) NULL,
    nama_ayah VARCHAR(255) DEFAULT '',
    nama_ibu VARCHAR(255) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anggota_identitas_kk
        FOREIGN KEY (id_kk)
        REFERENCES "tbl_identitasKK" (id)
        ON DELETE CASCADE
);

-- Index pencarian anggota berdasarkan id_kk dan NIK
CREATE INDEX IF NOT EXISTS idx_anggota_id_kk ON "tbl_anggotaKeluargaKK" (id_kk);
CREATE INDEX IF NOT EXISTS idx_anggota_nik ON "tbl_anggotaKeluargaKK" (nik);

-- 3. Row Level Security (RLS) diaktifkan tanpa policy
-- Backend mengakses database lewat pooler connection string dengan user postgres (service role/superuser)
ALTER TABLE "tbl_identitasKK" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tbl_anggotaKeluargaKK" ENABLE ROW LEVEL SECURITY;
