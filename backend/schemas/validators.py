from datetime import datetime, date
import re
from typing import Any, Dict, List, Optional, Tuple

def validate_date(date_str: Optional[str], field_name: str, required: bool = True) -> Tuple[Optional[date], Optional[str]]:
    if not date_str or not str(date_str).strip():
        if required:
            return None, f"Field {field_name} wajib diisi."
        return None, None

    val = str(date_str).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            parsed = datetime.strptime(val, fmt).date()
            return parsed, None
        except ValueError:
            continue

    return None, f"Format tanggal {field_name} tidak valid, gunakan YYYY-MM-DD."

def validate_identitas_kk(data: Dict[str, Any], is_update: bool = False) -> Tuple[Dict[str, Any], Dict[str, str]]:
    errors: Dict[str, str] = {}
    cleaned: Dict[str, Any] = {}

    no_kk = str(data.get("no_kk", "")).strip()
    if not no_kk and not is_update:
        errors["no_kk"] = "Nomor KK wajib diisi."
    elif no_kk:
        clean_no_kk = re.sub(r"\D", "", no_kk)
        if len(clean_no_kk) != 16:
            errors["no_kk"] = "Nomor KK harus tepat 16 digit angka."
        else:
            cleaned["no_kk"] = clean_no_kk

    nama = str(data.get("nama_kepala_keluarga", "")).strip()
    if not nama and not is_update:
        errors["nama_kepala_keluarga"] = "Nama kepala keluarga wajib diisi."
    elif nama:
        cleaned["nama_kepala_keluarga"] = nama.upper()

    alamat = str(data.get("alamat", "")).strip()
    if not alamat and not is_update:
        errors["alamat"] = "Alamat wajib diisi."
    elif alamat:
        cleaned["alamat"] = alamat

    for field in ["rt", "rw", "desa_kelurahan", "kecamatan", "kabupaten_kota", "provinsi", "kode_pos"]:
        if field in data:
            cleaned[field] = str(data.get(field, "") or "").strip()

    if "tanggal_dikeluarkan" in data:
        tgl_val = data.get("tanggal_dikeluarkan")
        tgl_obj, err = validate_date(tgl_val, "tanggal_dikeluarkan", required=False)
        if err:
            errors["tanggal_dikeluarkan"] = err
        else:
            cleaned["tanggal_dikeluarkan"] = tgl_obj

    return cleaned, errors

def validate_anggota(data: Dict[str, Any], is_update: bool = False) -> Tuple[Dict[str, Any], Dict[str, str]]:
    errors: Dict[str, str] = {}
    cleaned: Dict[str, Any] = {}

    if "no_urut" in data:
        try:
            cleaned["no_urut"] = int(data["no_urut"])
        except (ValueError, TypeError):
            cleaned["no_urut"] = 1
    elif not is_update:
        cleaned["no_urut"] = 1

    nama = str(data.get("nama_lengkap", "")).strip()
    if not nama and not is_update:
        errors["nama_lengkap"] = "Nama lengkap anggota wajib diisi."
    elif nama:
        cleaned["nama_lengkap"] = nama.upper()

    nik = str(data.get("nik", "")).strip()
    if not nik and not is_update:
        errors["nik"] = "NIK anggota wajib diisi."
    elif nik:
        clean_nik = re.sub(r"\D", "", nik)
        if len(clean_nik) != 16:
            errors["nik"] = "NIK harus tepat 16 digit angka."
        else:
            cleaned["nik"] = clean_nik

    jk = str(data.get("jenis_kelamin", "")).strip().upper()
    if not jk and not is_update:
        errors["jenis_kelamin"] = "Jenis kelamin wajib diisi."
    elif jk:
        if jk in ("L", "LAKI-LAKI", "PRIA"):
            cleaned["jenis_kelamin"] = "LAKI-LAKI"
        elif jk in ("P", "PEREMPUAN", "WANITA"):
            cleaned["jenis_kelamin"] = "PEREMPUAN"
        else:
            errors["jenis_kelamin"] = "Jenis kelamin harus LAKI-LAKI atau PEREMPUAN."

    tempat = str(data.get("tempat_lahir", "")).strip()
    if not tempat and not is_update:
        errors["tempat_lahir"] = "Tempat lahir wajib diisi."
    elif tempat:
        cleaned["tempat_lahir"] = tempat.upper()

    if "tanggal_lahir" in data or not is_update:
        tgl_obj, err = validate_date(data.get("tanggal_lahir"), "tanggal_lahir", required=not is_update)
        if err:
            errors["tanggal_lahir"] = err
        else:
            cleaned["tanggal_lahir"] = tgl_obj

    hub = str(data.get("status_hubungan_dalam_keluarga", "")).strip().upper()
    if not hub and not is_update:
        errors["status_hubungan_dalam_keluarga"] = "Status hubungan dalam keluarga wajib diisi."
    elif hub:
        cleaned["status_hubungan_dalam_keluarga"] = hub

    string_fields = [
        "agama",
        "pendidikan",
        "jenis_pekerjaan",
        "golongan_darah",
        "status_perkawinan",
        "kewarganegaraan",
        "no_paspor",
        "no_kitas_kitap",
        "nama_ayah",
        "nama_ibu",
    ]
    for sf in string_fields:
        if sf in data:
            cleaned[sf] = str(data.get(sf, "") or "").strip()

    if "tanggal_perkawinan" in data:
        tp_val = data.get("tanggal_perkawinan")
        tp_obj, err = validate_date(tp_val, "tanggal_perkawinan", required=False)
        if err:
            errors["tanggal_perkawinan"] = err
        else:
            cleaned["tanggal_perkawinan"] = tp_obj

    return cleaned, errors
