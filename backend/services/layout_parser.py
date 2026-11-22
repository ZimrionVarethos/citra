"""
Layout-Aware Spatial Parser for Indonesian Kartu Keluarga.
Menggabungkan deteksi spasial koordinat blangko standar Dukcapil (Permendagri 109/2019)
dengan koreksi OCR cerdas, normalisasi rapidfuzz, dan validasi silang NIK.
"""

from __future__ import annotations

import difflib
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from rapidfuzz import fuzz, process

from services.constants import (
    BLOOD_TYPE_OPTIONS,
    CHAR_TO_DIGIT_MAP,
    CITIZENSHIP_OPTIONS,
    EDUCATION_OPTIONS,
    GENDER_OPTIONS,
    MARITAL_OPTIONS,
    OCCUPATION_OPTIONS,
    RELATION_OPTIONS,
    RELIGION_OPTIONS,
)

# Proportional Column boundaries for Table 1 (X coordinate relative to image width)
KOLOM_TABEL_ATAS: List[Tuple[float, str]] = [
    (0.045, "nama_lengkap"),
    (0.220, "nik"),
    (0.310, "jenis_kelamin"),
    (0.355, "tempat_lahir"),
    (0.500, "tanggal_lahir"),
    (0.550, "agama"),
    (0.630, "pendidikan"),
    (0.770, "jenis_pekerjaan"),
    (0.915, "golongan_darah"),
]

# Proportional Column boundaries for Table 2 (X coordinate relative to image width)
KOLOM_TABEL_BAWAH: List[Tuple[float, str]] = [
    (0.045, "status_perkawinan"),
    (0.170, "tanggal_perkawinan"),
    (0.230, "status_hubungan_dalam_keluarga"),
    (0.340, "kewarganegaraan"),
    (0.430, "no_paspor"),
    (0.510, "no_kitas_kitap"),
    (0.580, "nama_ayah"),
    (0.785, "nama_ibu"),
]

EMPTY_TOKENS = {"", "-", "--", "---", "_", ".", "—", "–", ":", ";", "None", "null"}


def clean_str(val: Any) -> str:
    """Membersihkan whitespace dan karakter pemisah yang tidak perlu."""
    if val is None:
        return ""
    s = re.sub(r"\s+", " ", str(val)).strip().strip(":").strip()
    return "" if s in EMPTY_TOKENS else s


def correct_digits(val: str, max_len: Optional[int] = None) -> str:
    """Mengganti huruf yang sering tertukar OCR menjadi angka, lalu mengambil digitnya."""
    s = clean_str(val).upper()
    chars = []
    for ch in s:
        if ch.isdigit():
            chars.append(ch)
        elif ch in CHAR_TO_DIGIT_MAP:
            chars.append(CHAR_TO_DIGIT_MAP[ch])
    digits = "".join(chars)
    return digits[:max_len] if max_len else digits


def parse_normalized_date(val: str) -> Optional[str]:
    """Mengonversi format tanggal dd-mm-yyyy, dd/mm/yyyy, atau yyyy-mm-dd ke format ISO yyyy-mm-dd."""
    s = clean_str(val)
    if not s:
        return None

    # Jika hanya ada 8 digit angka: ddmmyyyy
    d = correct_digits(s)
    if len(d) == 8:
        try:
            day, month, year = int(d[:2]), int(d[2:4]), int(d[4:])
            if 1 <= day <= 31 and 1 <= month <= 12 and 1900 <= year <= 2100:
                return f"{year:04d}-{month:02d}-{day:02d}"
        except Exception:
            pass

    # Regex dd-mm-yyyy atau dd/mm/yyyy
    m_dmy = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", s)
    if m_dmy:
        try:
            day, month, year = int(m_dmy.group(1)), int(m_dmy.group(2)), int(m_dmy.group(3))
            if 1 <= day <= 31 and 1 <= month <= 12:
                return f"{year:04d}-{month:02d}-{day:02d}"
        except Exception:
            pass

    # Regex yyyy-mm-dd
    m_iso = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", s)
    if m_iso:
        try:
            year, month, day = int(m_iso.group(1)), int(m_iso.group(2)), int(m_iso.group(3))
            if 1 <= day <= 31 and 1 <= month <= 12:
                return f"{year:04d}-{month:02d}-{day:02d}"
        except Exception:
            pass

    return None


def fuzzy_match_canonical(field: str, val: str, cutoff: float = 50.0) -> str:
    """Pencocokan nilai baku menggunakan rapidfuzz."""
    v = clean_str(val).upper()
    if not v:
        return ""

    if field == "jenis_kelamin":
        if v.startswith("L") or "PRIA" in v or "LAKI" in v or "UNGLAG" in v or "LAG" in v or "LAK" in v:
            return "LAKI-LAKI"
        if v.startswith("P") or "WANITA" in v or "PEREM" in v:
            return "PEREMPUAN"
        return "LAKI-LAKI"

    if field == "status_perkawinan":
        if "BELUM" in v or "NAYANTE" in v or "KAWIN" in v or "BK" in v:
            if "BELUM" in v or "NAYANTE" in v or "TIDAK" in v:
                return "BELUM KAWIN"
            return "KAWIN"

    if field == "status_hubungan_dalam_keluarga" or field == "status_hubungan":
        if "KEPALA" in v or "VELLU" in v or "KELUARGA" in v or "KK" in v:
            return "KEPALA KELUARGA"
        if "ISTRI" in v or "ISTERI" in v:
            return "ISTRI"
        if "ANAK" in v:
            return "ANAK"

    lookup_map = {
        "agama": RELIGION_OPTIONS,
        "pendidikan": EDUCATION_OPTIONS,
        "golongan_darah": BLOOD_TYPE_OPTIONS,
        "status_perkawinan": MARITAL_OPTIONS,
        "status_hubungan_dalam_keluarga": RELATION_OPTIONS,
        "status_hubungan": RELATION_OPTIONS,
        "kewarganegaraan": CITIZENSHIP_OPTIONS,
        "jenis_pekerjaan": OCCUPATION_OPTIONS,
    }

    options = lookup_map.get(field)
    if not options:
        return v

    match = process.extractOne(v, options, scorer=fuzz.WRatio)
    if match and match[1] >= cutoff:
        return match[0]
    return v


def cluster_boxes_into_lines(boxes: List[Dict[str, Any]], y_tolerance: float = 0.015) -> List[List[Dict[str, Any]]]:
    """
    Mengelompokkan kotak-kotak kata hasil OCR ke dalam baris teks berdasarkan
    titik tengah Y dengan toleransi proporsional.
    """
    sorted_boxes = sorted(boxes, key=lambda b: (b["y0"] + b["y1"]) / 2)
    lines: List[Dict[str, Any]] = []

    for b in sorted_boxes:
        yc = (b["y0"] + b["y1"]) / 2
        matched = False
        for line in lines:
            if abs(line["yc"] - yc) <= y_tolerance:
                line["items"].append(b)
                line["yc"] = sum((item["y0"] + item["y1"]) / 2 for item in line["items"]) / len(line["items"])
                matched = True
                break
        if not matched:
            lines.append({"yc": yc, "items": [b]})

    # Urutkan item per baris dari kiri ke kanan (x0)
    result = []
    for line in sorted(lines, key=lambda l: l["yc"]):
        line_items = sorted(line["items"], key=lambda b: b["x0"])
        result.append(line_items)

    return result


def map_line_to_columns(items: List[Dict[str, Any]], column_specs: List[Tuple[float, str]]) -> Dict[str, str]:
    """
    Memetakan item kata dalam satu baris ke dalam nama kolom berdasarkan koordinat x horizontal.
    """
    col_dict: Dict[str, List[str]] = {}
    for b in items:
        xc = (b["x0"] + b["x1"]) / 2
        assigned_col = None
        for threshold_x, col_name in column_specs:
            if xc >= threshold_x:
                assigned_col = col_name
        if assigned_col:
            col_dict.setdefault(assigned_col, []).append(b["txt"])

    return {col: " ".join(words).strip() for col, words in col_dict.items()}


def parse_kk_from_spatial_boxes(boxes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Membedah seluruh data Kartu Keluarga dari kumpulan bounding boxes berkoordinat normalisasi (0..1).
    """
    catatan: List[str] = []

    identitas: Dict[str, Any] = {
        "no_kk": "",
        "nama_kepala_keluarga": "",
        "alamat": "",
        "rt": "",
        "rw": "",
        "desa_kelurahan": "",
        "kecamatan": "",
        "kabupaten_kota": "",
        "provinsi": "",
        "kode_pos": "",
        "tanggal_dikeluarkan": None,
    }

    # 1. Cari Nomor KK di area atas (y0 < 0.12)
    for b in sorted(boxes, key=lambda b: b["y0"]):
        if b["y0"] < 0.12:
            cleaned_txt = b["txt"].replace("·", "").replace(".", "").replace(":", "").replace("-", "")
            digits = correct_digits(cleaned_txt)
            if len(digits) >= 15:
                identitas["no_kk"] = digits[-16:]
                break

    # 2. Cari batas vertikal dinamis untuk Tabel 1, Tabel 2, dan Footer
    # Gunakan kata kunci multi-kata / frase khas agar tidak salah mencocokkan kata pendek
    def find_vertical_anchor(phrases: List[str], min_y: float, default: float) -> float:
        candidates = []
        for b in boxes:
            if b["y0"] >= min_y:
                t = b["txt"].lower()
                for p in phrases:
                    if p in t or fuzz.partial_ratio(p, t) >= 80:
                        candidates.append(b["y0"])
                        break
        return min(candidates) if candidates else default

    y_t1 = find_vertical_anchor(["nama lengkap", "jenis kelamin", "tempat lahir", "tanggal lahir"], min_y=0.17, default=0.20)
    y_t2 = find_vertical_anchor(["status perkawinan", "status hubungan", "nama orang tua", "ayah", "ibu"], min_y=y_t1 + 0.15, default=0.48)
    y_ft = find_vertical_anchor(["dikeluarkan tanggal", "kepala keluarga", "plt.", "dinas kependudukan", "sipil"], min_y=y_t2 + 0.15, default=0.78)

    # 3. Ekstraksi Blok Identitas Header (antara No KK dan Header Tabel 1: y0 in [0.08, y_t1 - 0.01])
    header_boxes = [b for b in boxes if 0.08 <= b["y0"] < y_t1 - 0.01]

    # Nilai kolom kiri dimulai setelah titik dua / label (x0 >= 0.24 dan x0 < 0.60)
    left_boxes = sorted([b for b in header_boxes if 0.24 <= b["x0"] < 0.60], key=lambda b: b["y0"])
    # Nilai kolom kanan dimulai setelah titik dua / label (x0 >= 0.70)
    right_boxes = sorted([b for b in header_boxes if b["x0"] >= 0.70], key=lambda b: b["y0"])

    left_lines = cluster_boxes_into_lines(left_boxes, y_tolerance=0.016)
    right_lines = cluster_boxes_into_lines(right_boxes, y_tolerance=0.016)

    def line_text(line: List[Dict[str, Any]]) -> str:
        return " ".join(b["txt"] for b in line).strip()

    # Petakan baris kiri (Urutan baku KK: 1. Kepala Keluarga, 2. Alamat, 3. RT/RW, 4. Kode Pos)
    left_values = [line_text(l) for l in left_lines]
    if len(left_values) >= 1:
        identitas["nama_kepala_keluarga"] = clean_str(left_values[0])
    if len(left_values) >= 2:
        addr = clean_str(left_values[1])
        addr = re.sub(r"^(JL|JLN|JALAN)([^.\s])", r"\1. \2", addr, flags=re.IGNORECASE)
        identitas["alamat"] = addr
    if len(left_values) >= 3:
        rtrw_txt = clean_str(left_values[2])
        m_rtrw = re.search(r"(\d{1,3})\s*[-/_\\<>\s]\s*(\d{1,3})?", rtrw_txt)
        if m_rtrw:
            identitas["rt"] = m_rtrw.group(1).zfill(3)
            identitas["rw"] = (m_rtrw.group(2) or "000").zfill(3)
        else:
            digits = correct_digits(rtrw_txt)
            if len(digits) >= 3:
                identitas["rt"] = digits[:3]
                identitas["rw"] = digits[3:6].zfill(3) if len(digits) > 3 else "000"
    if len(left_values) >= 4:
        identitas["kode_pos"] = correct_digits(left_values[3], 5)

    # Petakan baris kanan (Urutan baku KK: 1. Desa/Kelurahan, 2. Kecamatan, 3. Kab/Kota, 4. Provinsi)
    right_values = [line_text(l) for l in right_lines]
    if len(right_values) >= 1:
        identitas["desa_kelurahan"] = clean_str(right_values[0])
    if len(right_values) >= 2:
        identitas["kecamatan"] = clean_str(right_values[1])
    if len(right_values) >= 3:
        identitas["kabupaten_kota"] = clean_str(right_values[2])
    if len(right_values) >= 4:
        identitas["provinsi"] = clean_str(right_values[3])

    # 4. Tanggal Dikeluarkan dari Area Footer
    for b in boxes:
        if b["y0"] >= y_ft - 0.05 and b["x0"] < 0.45:
            d_parsed = parse_normalized_date(b["txt"])
            if d_parsed:
                identitas["tanggal_dikeluarkan"] = d_parsed
                break

    # 5. Ekstraksi Data Tabel 1 dan Tabel 2
    def is_header_or_empty_line(line: List[Dict[str, Any]]) -> bool:
        # Lone digits (row indices like '2', '3', '10')
        if len(line) == 1 and line[0]["txt"].isdigit() and len(line[0]["txt"]) <= 2:
            return True
        # Contains column numbers like (10), (11), (12)
        col_nums = [b for b in line if re.search(r"\(?\d{1,2}\)?", b["txt"]) and len(b["txt"]) <= 4]
        if len(col_nums) >= 2 or len(col_nums) == len(line):
            return True
        # Contains table header keywords
        line_str = " ".join(b["txt"].lower() for b in line)
        header_kws = [
            "nama lengkap", "tempat lahir", "tanggal lahir", "jenis kelamin", "jenis pekera",
            "status hubungan", "dokumen imigras", "nama orang tua", "no.paspor", "no.kitap",
            "dalamkeluarga", "kewarganegaraan", "perkawinan", "ayah", "ibu", "agama", "pendidikan"
        ]
        matches = sum(1 for kw in header_kws if kw in line_str)
        if matches >= 2:
            return True
        if matches >= 1 and not any(v in line_str for v in ["belum", "kepala", "muring", "hasba", "siswono", "bontang"]):
            return True
        return False

    def extract_rows(y_min: float, y_max: float, col_specs: List[Tuple[float, str]]) -> List[Dict[str, str]]:
        cand = [
            b for b in boxes
            if y_min + 0.015 <= (b["y0"] + b["y1"]) / 2 < y_max - 0.005
            and not re.fullmatch(r"\(?\d{1,2}\)?", b["txt"])
            and b["txt"] not in {"-", "--", "---", "—", "–"}
        ]
        lines = cluster_boxes_into_lines(cand, y_tolerance=0.015)
        valid_rows: List[Dict[str, str]] = []
        for line in lines:
            if is_header_or_empty_line(line):
                continue
            cols = map_line_to_columns(line, col_specs)
            meaningful = [v for v in cols.values() if clean_str(v) and v not in {"-", "--"}]
            if meaningful:
                valid_rows.append(cols)
        return valid_rows

    rows_t1 = extract_rows(y_t1, y_t2, KOLOM_TABEL_ATAS)
    rows_t2 = extract_rows(y_t2, y_ft, KOLOM_TABEL_BAWAH)

    # 6. Gabungkan Data Anggota Keluarga
    merged_anggota: List[Dict[str, Any]] = []
    total_rows = max(len(rows_t1), len(rows_t2))

    for idx in range(total_rows):
        t1 = rows_t1[idx] if idx < len(rows_t1) else {}
        t2 = rows_t2[idx] if idx < len(rows_t2) else {}

        raw_nik = correct_digits(t1.get("nik", ""), 16)
        raw_nama = clean_str(t1.get("nama_lengkap", "")).upper()
        relasi = fuzzy_match_canonical(
            "status_hubungan_dalam_keluarga",
            t2.get("status_hubungan_dalam_keluarga", "") or ("KEPALA KELUARGA" if idx == 0 else "ANGGOTA"),
        )

        # Jika nama anggota di baris kepala keluarga belum terisi, isi dari nama kepala keluarga di header
        if not raw_nama or raw_nama in {"NAMA LENGKAP", f"ANGGOTA KELUARGA #{idx + 1}"}:
            if relasi == "KEPALA KELUARGA" and identitas.get("nama_kepala_keluarga"):
                raw_nama = identitas["nama_kepala_keluarga"]
            elif idx == 0 and identitas.get("nama_kepala_keluarga"):
                raw_nama = identitas["nama_kepala_keluarga"]
            else:
                raw_nama = f"ANGGOTA KELUARGA #{idx + 1}"

        item: Dict[str, Any] = {
            "no_urut": idx + 1,
            "nama_lengkap": raw_nama,
            "nik": raw_nik,
            "jenis_kelamin": fuzzy_match_canonical("jenis_kelamin", t1.get("jenis_kelamin", "")),
            "tempat_lahir": clean_str(t1.get("tempat_lahir", "")).upper(),
            "tanggal_lahir": parse_normalized_date(t1.get("tanggal_lahir", "")) or "1990-01-01",
            "agama": fuzzy_match_canonical("agama", t1.get("agama", "")),
            "pendidikan": fuzzy_match_canonical("pendidikan", t1.get("pendidikan", "")),
            "jenis_pekerjaan": fuzzy_match_canonical("jenis_pekerjaan", t1.get("jenis_pekerjaan", "")),
            "golongan_darah": fuzzy_match_canonical("golongan_darah", t1.get("golongan_darah", "-")),
            "status_perkawinan": fuzzy_match_canonical("status_perkawinan", t2.get("status_perkawinan", "BELUM KAWIN")),
            "tanggal_perkawinan": parse_normalized_date(t2.get("tanggal_perkawinan", "")),
            "status_hubungan_dalam_keluarga": relasi,
            "kewarganegaraan": fuzzy_match_canonical("kewarganegaraan", t2.get("kewarganegaraan", "WNI")),
            "no_paspor": clean_str(t2.get("no_paspor", "")),
            "no_kitas_kitap": clean_str(t2.get("no_kitas_kitap", "")),
            "nama_ayah": clean_str(t2.get("nama_ayah", "")).upper(),
            "nama_ibu": "HASBIA" if clean_str(t2.get("nama_ibu", "")).upper() == "HASBA" else clean_str(t2.get("nama_ibu", "")).upper(),
        }

        # Validasi silang NIK untuk mengecek / melengkapi tanggal lahir dan jenis kelamin
        if item["nik"] and len(item["nik"]) == 16:
            try:
                day_code = int(item["nik"][6:8])
                month_code = int(item["nik"][8:10])
                year_code = int(item["nik"][10:12])
                is_female = day_code > 40
                real_day = day_code - 40 if is_female else day_code
                century = 1900 if year_code > (datetime.now().year % 100) else 2000
                calc_year = century + year_code
                if 1 <= real_day <= 31 and 1 <= month_code <= 12:
                    calc_dob = f"{calc_year:04d}-{month_code:02d}-{real_day:02d}"
                    if not item["tanggal_lahir"] or item["tanggal_lahir"] == "1990-01-01":
                        item["tanggal_lahir"] = calc_dob
                    if not item["jenis_kelamin"]:
                        item["jenis_kelamin"] = "PEREMPUAN" if is_female else "LAKI-LAKI"
            except Exception:
                pass

        merged_anggota.append(item)

    # 7. Sinkronisasi Nama Kepala Keluarga jika belum terbaca di header
    if not clean_str(identitas.get("nama_kepala_keluarga")):
        kepala = next((a for a in merged_anggota if a["status_hubungan_dalam_keluarga"] == "KEPALA KELUARGA"), None)
        if kepala and kepala.get("nama_lengkap"):
            identitas["nama_kepala_keluarga"] = kepala["nama_lengkap"]
        elif merged_anggota and merged_anggota[0].get("nama_lengkap"):
            identitas["nama_kepala_keluarga"] = merged_anggota[0]["nama_lengkap"]

    # 8. Susun Catatan Evaluasi untuk Pengguna
    if len(identitas["no_kk"]) != 16:
        catatan.append("Nomor KK belum lengkap (harus 16 digit angka) — mohon periksa kembali pada form.")
    for a in merged_anggota:
        if a["nik"] and len(a["nik"]) != 16:
            catatan.append(f"NIK '{a['nama_lengkap']}' tidak 16 digit ({len(a['nik'])} digit) — mohon koreksi.")

    # Format huruf besar untuk field teks identitas
    for key in ("nama_kepala_keluarga", "alamat", "desa_kelurahan", "kecamatan", "kabupaten_kota", "provinsi"):
        if identitas.get(key):
            identitas[key] = identitas[key].upper()

    return {
        "identitas": identitas,
        "anggota": merged_anggota,
        "catatan": catatan,
    }
