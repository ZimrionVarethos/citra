/**
 * Strict TypeScript Type Definitions for KK-SCANNER PRO
 * Sesuai Permendagri No. 109 Tahun 2019 & Database Schema
 */

export interface IdentitasKK {
  id?: number;
  no_kk: string;
  nama_kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  rt_rw?: string;
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  kode_pos: string;
  tanggal_dikeluarkan?: string | null;
  gambar?: string;
  gambar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  jumlah_anggota?: number;
}

export interface NikValidation {
  valid: boolean;
  reason?: string;
  prov_code?: string;
  city_code?: string;
  district_code?: string;
  gender?: "LAKI-LAKI" | "PEREMPUAN";
  birth_date?: string;
  real_day?: number;
  month?: number;
  year?: number;
  sequence?: string;
}

export interface AnggotaKeluarga {
  id?: number;
  id_kk?: number;
  no_urut: number;
  nama_lengkap: string;
  nik: string;
  jenis_kelamin: "LAKI-LAKI" | "PEREMPUAN" | string;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pendidikan: string;
  jenis_pekerjaan: string;
  golongan_darah: string;
  status_perkawinan: string;
  tanggal_perkawinan?: string | null;
  status_hubungan_dalam_keluarga: string;
  status_hubungan?: string;
  kewarganegaraan: string;
  no_paspor?: string | null;
  no_kitas_kitap?: string | null;
  nama_ayah: string;
  nama_ibu: string;
  created_at?: string;
  updated_at?: string;
  nik_validation?: NikValidation;
}

export interface OcrResult {
  identitas: IdentitasKK;
  anggota: AnggotaKeluarga[];
  engine?: string;
  catatan?: string[];
  zone_scores: number[];
  confidence: number;
  total_anggota: number;
  gambar?: string;
  gambar_url?: string | null;
  error?: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface KkListResponse {
  data: IdentitasKK[];
  pagination: Pagination;
}

export interface KkDetailResponse extends IdentitasKK {
  anggota: AnggotaKeluarga[];
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
