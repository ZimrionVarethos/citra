"""
Layout-Aware Spatial Parser for Indonesian Kartu Keluarga.
Menggabungkan pembacaan spasial berbasis koordinat blangko standar Dukcapil
(Permendagri 109/2019) dengan koreksi OCR cerdas dan validasi silang NIK.
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
    RELATION_OPTIONS,
    RELIGION_OPTIONS,
)

# Batas kolom proporsional (x-koordinat terhadap lebar citra w)
KOLOM_TABEL_ATAS: List[Tuple[float, str]] = [
    (0.045, "nama_lengkap"),
    (0.225, "nik"),
    (0.315, "jenis_kelamin"),
    (0.360, "tempat_lahir"),
    (0.505, "tanggal_lahir"),
    (0.550, "agama"),
    (0.635, "pendidikan"),
    (0.775, "jenis_pekerjaan"),
    (0.920, "golongan_darah"),
]

KOLOM_TABEL_BAWAH: List[Tuple[float, str]] = [
    (0.045, "status_perkawinan"),
    (0.175, "tanggal_perkawinan"),
    (0.235, "status_hubungan_dalam_keluarga"),
    (0.345, "kewarganegaraan"),
    (0.435, "no_paspor"),
    (0.510, "no_kitas_kitap"),
    (0.585, "nama_ayah"),
    (0.795, "nama_ibu"),
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


def fuzzy_match_canonical(field: str, val: str, cutoff: float = 60.0) -> str:
    """Pencocokan nilai baku menggunakan rapidfuzz."""
    v = clean_str(val).upper()
    if not v:
        return ""

    if field == "jenis_kelamin":
        if v.startswith("L") or "PRIA" in v or "LAKI" in v:
            return "LAKI-LAKI"
        if v.startswith("P") or "WANITA" in v or "PEREMPUAN" in v:
            return "PEREMPUAN"
        return v

    lookup_map = {
        "agama": RELIGION_OPTIONS,
        "pendidikan": EDUCATION_OPTIONS,
        "golongan_darah": BLOOD_TYPE_OPTIONS,
        "status_perkawinan": MARITAL_OPTIONS,
        "status_hubungan_dalam_keluarga": RELATION_OPTIONS,
        "status_hubungan": RELATION_OPTIONS,
        "kewarganegaraan": CITIZENSHIP_OPTIONS,
    }

    options = lookup_map.get(field)
    if not options:
        return v

    match = process.extractOne(v, options, scorer=fuzz.WRatio)
    if match and match[1] >= cutoff:
        return match[0]
    return v


def is_keyword_similar(text: str, keywords: List[str], cutoff: float = 0.6) -> bool:
    """Memeriksa kemiripan string dengan daftar kata kunci."""
    t = text.lower()
    for kw in keywords:
        k = kw.lower()
        if k in t or t in k:
            return True
        if difflib.SequenceMatcher(None, t, k).ratio() >= cutoff:
            return True
    return False


def cluster_boxes_into_lines(boxes: List[Dict[str, Any]], y_tolerance: float = 0.012) -> List[List[Dict[str, Any]]]:
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

    # 1. Cari Nomor KK di bagian atas (y0 < 0.22)
    no_kk = ""
    for b in sorted(boxes, key=lambda b: b["y0"]):
        if b["y0"] < 0.22:
            d = correct_digits(b["txt"])
            if len(d) >= 15:
                no_kk = d[-16:]
                break

    # 2. Cari batas vertikal dinamis (y_t1: header tabel 1, y_t2: header tabel 2, y_ft: footer)
    def find_vertical_y(keywords: List[str], min_y: float = 0.0, default: float = 0.5) -> float:
        candidates = [b["y0"] for b in boxes if b["y0"] > min_y and is_keyword_similar(b["txt"], keywords)]
        return min(candidates) if candidates else default

    y_t1 = find_vertical_y(
        ["agama", "pendidikan", "tempat lahir", "nama lengkap", "jenis pekerjaan"],
        min_y=0.10,
        default=0.22,
    )
    y_t2 = find_vertical_y(
        ["kewarganegaraan", "status hubungan", "dokumen imigrasi", "nama orang tua", "status perkawinan"],
        min_y=y_t1 + 0.10,
        default=0.48,
    )
    y_ft = find_vertical_y(
        ["dikeluarkan tanggal", "kepala keluarga", "lembar", "dukcapil"],
        min_y=y_t2 + 0.10,
        default=0.82,
    )

    # 3. Ekstraksi Blok Identitas (antara No KK dan Header Tabel 1)
    header_boxes = [b for b in boxes if 0.08 < b["y0"] < y_t1 - 0.005]
    left_boxes = [b for b in header_boxes if 0.22 < b["x0"] < 0.62]
    right_boxes = [b for b in header_boxes if b["x0"] >= 0.70]

    left_lines = cluster_boxes_into_lines(left_boxes, y_tolerance=0.015)
    right_lines = cluster_boxes_into_lines(right_boxes, y_tolerance=0.015)

    line_to_text = lambda line: " ".join(b["txt"] for b in line).strip()

    left_fields = ["nama_kepala_keluarga", "alamat", "rt_rw", "kode_pos"]
    right_fields = ["desa_kelurahan", "kecamatan", "kabupaten_kota", "provinsi"]

    identitas: Dict[str, Any] = {
        "no_kk": no_kk,
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

    for f, line in zip(left_fields, left_lines):
        txt = line_to_text(line)
        if f == "rt_rw":
            # Pisahkan RT dan RW
            m_rtrw = re.search(r"(\d{1,3})\s*[/_\\<>\s]\s*(\d{1,3})", txt)
            if m_rtrw:
                identitas["rt"] = m_rtrw.group(1).zfill(3)
                identitas["rw"] = m_rtrw.group(2).zfill(3)
            else:
                identitas["rt"] = correct_digits(txt[:3])
                identitas["rw"] = correct_digits(txt[3:6])
        else:
            identitas[f] = txt

    for f, line in zip(right_fields, right_lines):
        identitas[f] = line_to_text(line)

    # 4. Tanggal Dikeluarkan dari area footer
    for b in boxes:
        if b["y0"] > y_ft - 0.05 and b["x0"] < 0.40:
            parsed_tgl = parse_normalized_date(b["txt"])
            if parsed_tgl:
                identitas["tanggal_dikeluarkan"] = parsed_tgl
                break

    # 5. Ekstraksi Baris Data Tabel
    def extract_table_rows(y_start: float, y_end: float, col_specs: List[Tuple[float, str]], header_ratio: float = 0.17):
        y_data_start = y_start + header_ratio * (y_end - y_start)
        table_boxes = [
            b for b in boxes
            if y_data_start < (b["y0"] + b["y1"]) / 2 < y_end - 0.005
            and not re.fullmatch(r"\(?\d{1,2}\)?", b["txt"])  # lewati nomor kolom (1)..(17)
        ]
        lines = cluster_boxes_into_lines(table_boxes, y_tolerance=0.012)
        rows: List[Dict[str, str]] = []
        for line in lines:
            col_data = map_line_to_columns(line, col_specs)
            if any(clean_str(v) for v in col_data.values()):
                rows.append(col_data)
        return rows

    rows_t1 = extract_table_rows(y_t1, y_t2, KOLOM_TABEL_ATAS, header_ratio=0.17)
    rows_t2 = extract_table_rows(y_t2, y_ft, KOLOM_TABEL_BAWAH, header_ratio=0.20)

    # 6. Gabungkan Tabel Atas dan Tabel Bawah berdasarkan indeks baris (no_urut)
    merged_anggota: List[Dict[str, Any]] = []
    total_rows = max(len(rows_t1), len(rows_t2))

    for idx in range(total_rows):
        t1_item = rows_t1[idx] if idx < len(rows_t1) else {}
        t2_item = rows_t2[idx] if idx < len(rows_t2) else {}

        item: Dict[str, Any] = {
            "no_urut": idx + 1,
            "nama_lengkap": clean_str(t1_item.get("nama_lengkap", "")).upper(),
            "nik": correct_digits(t1_item.get("nik", ""), 16),
            "jenis_kelamin": fuzzy_match_canonical("jenis_kelamin", t1_item.get("jenis_kelamin", "")),
            "tempat_lahir": clean_str(t1_item.get("tempat_lahir", "")).upper(),
            "tanggal_lahir": parse_normalized_date(t1_item.get("tanggal_lahir", "")) or "1990-01-01",
            "agama": fuzzy_match_canonical("agama", t1_item.get("agama", "")),
            "pendidikan": fuzzy_match_canonical("pendidikan", t1_item.get("pendidikan", "")),
            "jenis_pekerjaan": clean_str(t1_item.get("jenis_pekerjaan", "")).upper(),
            "golongan_darah": fuzzy_match_canonical("golongan_darah", t1_item.get("golongan_darah", "-")),
            "status_perkawinan": fuzzy_match_canonical("status_perkawinan", t2_item.get("status_perkawinan", "")),
            "tanggal_perkawinan": parse_normalized_date(t2_item.get("tanggal_perkawinan", "")),
            "status_hubungan_dalam_keluarga": fuzzy_match_canonical(
                "status_hubungan_dalam_keluarga",
                t2_item.get("status_hubungan_dalam_keluarga", "") or ("KEPALA KELUARGA" if idx == 0 else "ANGGOTA"),
            ),
            "kewarganegaraan": fuzzy_match_canonical("kewarganegaraan", t2_item.get("kewarganegaraan", "WNI")),
            "no_paspor": clean_str(t2_item.get("no_paspor", "")),
            "no_kitas_kitap": clean_str(t2_item.get("no_kitas_kitap", "")),
            "nama_ayah": clean_str(t2_item.get("nama_ayah", "")).upper(),
            "nama_ibu": clean_str(t2_item.get("nama_ibu", "")).upper(),
        }

        # Validasi silang NIK untuk verifikasi jenis kelamin & tanggal lahir
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

        if not item["nama_lengkap"]:
            item["nama_lengkap"] = f"ANGGOTA KELUARGA #{idx + 1}"

        merged_anggota.append(item)

    # 7. Sinkronisasi Nama Kepala Keluarga jika belum terbaca di header
    if not clean_str(identitas.get("nama_kepala_keluarga")):
        kepala = next((a for a in merged_anggota if a["status_hubungan_dalam_keluarga"] == "KEPALA KELUARGA"), None)
        if kepala and kepala.get("nama_lengkap"):
            identitas["nama_kepala_keluarga"] = kepala["nama_lengkap"]
        elif merged_anggota and merged_anggota[0].get("nama_lengkap"):
            identitas["nama_kepala_keluarga"] = merged_anggota[0]["nama_lengkap"]

    # 8. Susun Catatan Evaluasi & Peringatan untuk Pengguna
    if len(identitas["no_kk"]) != 16:
        catatan.append("Nomor KK belum lengkap (harus 16 digit angka) — mohon periksa kembali pada form.")
    for a in merged_anggota:
        if a["nik"] and len(a["nik"]) != 16:
            catatan.append(f"NIK '{a['nama_lengkap']}' tidak 16 digit ({len(a['nik'])} digit) — mohon koreksi.")

    # Bersihkan string identitas
    for key in ("nama_kepala_keluarga", "alamat", "desa_kelurahan", "kecamatan", "kabupaten_kota", "provinsi"):
        if identitas.get(key):
            identitas[key] = identitas[key].upper()

    return {
        "identitas": identitas,
        "anggota": merged_anggota,
        "catatan": catatan,
    }
