import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from rapidfuzz import process, fuzz

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

def clean_digits(text: str) -> str:
    if not text:
        return ""

    chars = []
    for ch in text.strip():
        if ch.isdigit():
            chars.append(ch)
        elif ch in CHAR_TO_DIGIT_MAP:
            chars.append(CHAR_TO_DIGIT_MAP[ch])

    return "".join(chars)

def clean_16_digits(text: str) -> Tuple[str, bool]:
    cleaned = clean_digits(text)
    if len(cleaned) == 16:
        return cleaned, True
    match = re.search(r"\d{16}", cleaned)
    if match:
        return match.group(0), True
    return cleaned, False

def decode_nik_structure(nik: str) -> Dict[str, Any]:
    nik_clean = clean_digits(nik)
    if len(nik_clean) != 16:
        return {"valid": False, "reason": "Panjang NIK bukan 16 digit"}

    prov = nik_clean[0:2]
    city = nik_clean[2:4]
    dist = nik_clean[4:6]
    day_raw = int(nik_clean[6:8])
    month_raw = int(nik_clean[8:10])
    year_raw = int(nik_clean[10:12])
    seq = nik_clean[12:16]

    if day_raw > 40:
        gender = "PEREMPUAN"
        real_day = day_raw - 40
    else:
        gender = "LAKI-LAKI"
        real_day = day_raw

    if not (1 <= real_day <= 31) or not (1 <= month_raw <= 12):
        return {
            "valid": False,
            "reason": f"Tanggal ({real_day}) atau bulan ({month_raw}) NIK tidak valid",
            "prov_code": prov,
            "city_code": city,
            "district_code": dist,
        }

    curr_yr_2d = datetime.now().year % 100
    century = 1900 if year_raw > curr_yr_2d else 2000
    full_year = century + year_raw

    try:
        birth_date_obj = datetime(full_year, month_raw, real_day).date()
        birth_date_str = birth_date_obj.strftime("%Y-%m-%d")
    except ValueError:
        birth_date_str = f"{full_year:04d}-{month_raw:02d}-{real_day:02d}"

    return {
        "valid": True,
        "nik": nik_clean,
        "prov_code": prov,
        "city_code": city,
        "district_code": dist,
        "gender": gender,
        "real_day": real_day,
        "month": month_raw,
        "year": full_year,
        "birth_date": birth_date_str,
        "sequence": seq,
    }

def cross_check_nik_with_member(
    nik: str, current_gender: str, current_birth_date: str
) -> Tuple[str, str, Dict[str, Any]]:
    nik_info = decode_nik_structure(nik)
    final_gender = current_gender
    final_birth_date = current_birth_date

    if nik_info.get("valid"):
        inferred_gender = nik_info["gender"]
        if not final_gender or final_gender not in GENDER_OPTIONS:
            final_gender = inferred_gender

        inferred_dob = nik_info["birth_date"]
        if not final_birth_date:
            final_birth_date = inferred_dob

    return final_gender, final_birth_date, nik_info

def normalize_date_string(text: str) -> Optional[str]:
    if not text:
        return None

    cleaned = text.strip()

    iso_match = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", cleaned)
    if iso_match:
        y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
        try:
            return datetime(y, m, d).strftime("%Y-%m-%d")
        except ValueError:
            pass

    dmy_match = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", cleaned)
    if dmy_match:
        d, m, y = int(dmy_match.group(1)), int(dmy_match.group(2)), int(dmy_match.group(3))
        try:
            return datetime(y, m, d).strftime("%Y-%m-%d")
        except ValueError:
            pass

    return None

def fuzzy_match_option(text: str, options: List[str], cutoff: float = 65.0) -> str:
    if not text or not text.strip():
        return ""

    query = text.strip().upper()
    match = process.extractOne(query, options, scorer=fuzz.WRatio)
    if match and match[1] >= cutoff:
        return match[0]
    return query

def parse_header_text(full_text: str) -> Dict[str, str]:
    result: Dict[str, str] = {
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
    }

    lines = [line.strip() for line in full_text.splitlines() if line.strip()]

    for idx, line in enumerate(lines):
        upper = line.upper()
        if "KARTU KELUARGA" in upper or "NO" in upper:
            for offset in range(3):
                if idx + offset < len(lines):
                    candidate = clean_digits(lines[idx + offset])
                    if len(candidate) == 16:
                        result["no_kk"] = candidate
                        break
                    match = re.search(r"\b\d{16}\b", lines[idx + offset])
                    if match:
                        result["no_kk"] = match.group(0)
                        break
        if result["no_kk"]:
            break

    if not result["no_kk"]:
        all_cleaned = clean_digits(full_text)
        match = re.search(r"\d{16}", all_cleaned)
        if match:
            result["no_kk"] = match.group(0)

    joined = "\n".join(lines)

    kk_match = re.search(
        r"NAMA\s+KEPALA\s+KELUARGA\s*[:;=.]?\s*([A-Z\s.,'-]+)", joined, re.IGNORECASE
    )
    if kk_match:
        result["nama_kepala_keluarga"] = kk_match.group(1).split("\n")[0].strip().upper()

    alamat_match = re.search(
        r"ALAMAT\s*[:;=.]?\s*([^\n]+)", joined, re.IGNORECASE
    )
    if alamat_match:
        result["alamat"] = alamat_match.group(1).strip()

    rtrw_match = re.search(
        r"RT\s*/\s*RW\s*[:;=.]?\s*([0-9]{1,3})\s*/\s*([0-9]{1,3})", joined, re.IGNORECASE
    )
    if rtrw_match:
        result["rt"] = rtrw_match.group(1).zfill(3)
        result["rw"] = rtrw_match.group(2).zfill(3)

    desa_match = re.search(
        r"(?:DESA|KELURAHAN|DESA\s*/\s*KELURAHAN)\s*[:;=.]?\s*([A-Z\s.,'-]+)", joined, re.IGNORECASE
    )
    if desa_match:
        result["desa_kelurahan"] = desa_match.group(1).split("\n")[0].strip().upper()

    kec_match = re.search(
        r"KECAMATAN\s*[:;=.]?\s*([A-Z\s.,'-]+)", joined, re.IGNORECASE
    )
    if kec_match:
        result["kecamatan"] = kec_match.group(1).split("\n")[0].strip().upper()

    kab_match = re.search(
        r"(?:KABUPATEN|KOTA|KABUPATEN\s*/\s*KOTA)\s*[:;=.]?\s*([A-Z\s.,'-]+)", joined, re.IGNORECASE
    )
    if kab_match:
        result["kabupaten_kota"] = kab_match.group(1).split("\n")[0].strip().upper()

    prov_match = re.search(
        r"PROVINSI\s*[:;=.]?\s*([A-Z\s.,'-]+)", joined, re.IGNORECASE
    )
    if prov_match:
        result["provinsi"] = prov_match.group(1).split("\n")[0].strip().upper()

    kodepos_match = re.search(
        r"(?:KODE\s*POS|KODEPOS)\s*[:;=.]?\s*([0-9]{5})", joined, re.IGNORECASE
    )
    if kodepos_match:
        result["kode_pos"] = kodepos_match.group(1).strip()

    return result
