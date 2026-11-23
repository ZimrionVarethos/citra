from typing import Dict, List

GENDER_OPTIONS: List[str] = ["LAKI-LAKI", "PEREMPUAN"]

RELIGION_OPTIONS: List[str] = [
    "ISLAM",
    "KRISTEN",
    "KATHOLIK",
    "HINDU",
    "BUDDHA",
    "KONGHUCU",
    "PENGHAYAT KEPERCAYAAN",
]

EDUCATION_OPTIONS: List[str] = [
    "TIDAK / BELUM SEKOLAH",
    "BELUM TAMAT SD/SEDERAJAT",
    "TAMAT SD / SEDERAJAT",
    "SLTP/SEDERAJAT",
    "SLTA / SEDERAJAT",
    "DIPLOMA I / II",
    "AKADEMI/ DIPLOMA III/S. MUDA",
    "DIPLOMA IV/ STRATA I",
    "STRATA II",
    "STRATA III",
]

MARITAL_OPTIONS: List[str] = [
    "BELUM KAWIN",
    "KAWIN TERCATAT",
    "KAWIN BELUM TERCATAT",
    "CERAI HIDUP",
    "CERAI MATI",
]

RELATION_OPTIONS: List[str] = [
    "KEPALA KELUARGA",
    "SUAMI",
    "ISTRI",
    "ANAK",
    "MENANTU",
    "CUCU",
    "ORANG TUA",
    "MERTUA",
    "FAMILI LAIN",
    "PEMBANTU",
    "LAINNYA",
]

BLOOD_TYPE_OPTIONS: List[str] = [
    "A",
    "B",
    "AB",
    "O",
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "-",
]

CITIZENSHIP_OPTIONS: List[str] = ["WNI", "WNA"]

OCCUPATION_OPTIONS: List[str] = [
    "BELUM/TIDAK BEKERJA",
    "MENGURUS RUMAH TANGGA",
    "PELAJAR/MAHASISWA",
    "PENSIUNAN",
    "PEGAWAI NEGERI SIPIL",
    "TENTARA NASIONAL INDONESIA",
    "KEPOLISIAN RI",
    "PETANI/PEKEBUN",
    "NELAYAN/PERIKANAN",
    "KARYAWAN SWASTA",
    "KARYAWAN BUMN",
    "WIRASWASTA",
    "BURUH HARIAN LEPAS",
    "GURU",
    "DOSEN",
    "PEDAGANG",
    "SOPIR",
    "TUKANG BANGUNAN",
    "LAINNYA",
]

CHAR_TO_DIGIT_MAP: Dict[str, str] = {
    "O": "0",
    "o": "0",
    "D": "0",
    "Q": "0",
    "I": "1",
    "l": "1",
    "i": "1",
    "|": "1",
    "!": "1",
    "Z": "2",
    "z": "2",
    "E": "3",
    "A": "4",
    "S": "5",
    "s": "5",
    "G": "6",
    "b": "6",
    "T": "7",
    "B": "8",
    "g": "9",
    "q": "9",
}

HEADER_LABEL_KEYWORDS = {
    "no_kk": ["NO.", "NO", "NOMOR", "KARTU KELUARGA"],
    "nama_kepala_keluarga": ["NAMA KEPALA KELUARGA", "KEPALA KELUARGA"],
    "alamat": ["ALAMAT"],
    "rt_rw": ["RT/RW", "RT / RW", "RT", "RW"],
    "desa_kelurahan": ["DESA/KELURAHAN", "DESA / KELURAHAN", "KELURAHAN", "DESA"],
    "kecamatan": ["KECAMATAN", "KEC."],
    "kabupaten_kota": ["KABUPATEN/KOTA", "KABUPATEN", "KOTA"],
    "kode_pos": ["KODE POS", "KODEPOS"],
    "provinsi": ["PROVINSI", "PROP."],
}
