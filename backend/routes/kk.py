import logging
import os
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import or_

from models import AnggotaKeluargaKK, IdentitasKK, db
from schemas.validators import validate_anggota, validate_identitas_kk

kk_bp = Blueprint("kk", __name__)
logger = logging.getLogger(__name__)


@kk_bp.route("/kk", methods=["POST"])
def create_kk():
    """
    Creates a new Kartu Keluarga document along with all its family members
    in a single atomic database transaction.
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({
            "error": "Payload JSON tidak valid.",
            "fields": {}
        }), 400

    identitas_data = data.get("identitas", {})
    anggota_list_data = data.get("anggota", [])
    gambar = data.get("gambar", "") or identitas_data.get("gambar", "")

    # 1. Validate Identitas
    cleaned_identitas, identitas_errors = validate_identitas_kk(identitas_data)
    if identitas_errors:
        return jsonify({
            "error": "Validasi identitas Kartu Keluarga gagal.",
            "fields": identitas_errors
        }), 422

    # 2. Check for duplicate no_kk
    existing = IdentitasKK.query.filter_by(no_kk=cleaned_identitas["no_kk"]).first()
    if existing:
        return jsonify({
            "error": f"Nomor KK {cleaned_identitas['no_kk']} sudah terdaftar dalam sistem.",
            "fields": {"no_kk": "Nomor KK ini telah terdaftar sebelumnya."}
        }), 409

    # 3. Validate each Anggota and check for duplicate NIKs within same KK
    cleaned_anggota_list = []
    all_anggota_errors = {}
    seen_niks = set()

    for idx, raw_anggota in enumerate(anggota_list_data):
        c_ang, ang_err = validate_anggota(raw_anggota)
        nik = c_ang.get("nik", "")

        if nik:
            if nik in seen_niks:
                ang_err["nik"] = f"NIK {nik} muncul lebih dari satu kali dalam KK ini."
            seen_niks.add(nik)

            # Cek NIK di database
            db_nik_exists = AnggotaKeluargaKK.query.filter_by(nik=nik).first()
            if db_nik_exists:
                ang_err["nik"] = f"NIK {nik} sudah terdaftar pada Kartu Keluarga lain di database."

        if ang_err:
            all_anggota_errors[f"anggota_{idx}"] = ang_err
        else:
            cleaned_anggota_list.append(c_ang)

    if all_anggota_errors:
        return jsonify({
            "error": "Validasi data anggota keluarga gagal.",
            "fields": all_anggota_errors
        }), 422

    # 4. Atomic transaction
    try:
        if gambar:
            cleaned_identitas["gambar"] = os.path.basename(gambar)

        new_kk = IdentitasKK(**cleaned_identitas)
        db.session.add(new_kk)
        db.session.flush()  # Populates new_kk.id

        for idx, ang_data in enumerate(cleaned_anggota_list):
            if "no_urut" not in ang_data or not ang_data["no_urut"]:
                ang_data["no_urut"] = idx + 1
            member = AnggotaKeluargaKK(id_kk=new_kk.id, **ang_data)
            db.session.add(member)

        db.session.commit()
        host = request.host_url.rstrip("/")
        return jsonify({
            "message": "Kartu Keluarga dan seluruh anggota berhasil disimpan.",
            "data": new_kk.to_dict(include_anggota=True, base_url=host)
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error("Gagal menyimpan KK ke database: %s", e, exc_info=True)
        return jsonify({
            "error": "Terjadi kesalahan internal saat menyimpan ke basis data.",
            "fields": {"database": str(e)}
        }), 500


@kk_bp.route("/kk", methods=["GET"])
def list_kk():
    """
    List KK records with search filter and pagination.
    """
    q = request.args.get("q", "").strip()
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 10))))
    except ValueError:
        page = 1
        per_page = 10

    query = IdentitasKK.query

    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            or_(
                IdentitasKK.no_kk.ilike(search_filter),
                IdentitasKK.nama_kepala_keluarga.ilike(search_filter),
                IdentitasKK.alamat.ilike(search_filter),
                IdentitasKK.desa_kelurahan.ilike(search_filter),
                IdentitasKK.kecamatan.ilike(search_filter),
                IdentitasKK.kabupaten_kota.ilike(search_filter),
                IdentitasKK.anggota.any(or_(
                    AnggotaKeluargaKK.nik.ilike(search_filter),
                    AnggotaKeluargaKK.nama_lengkap.ilike(search_filter)
                )),
            )
        )

    # Order newest first
    query = query.order_by(IdentitasKK.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    host = request.host_url.rstrip("/")
    return jsonify({
        "data": [item.to_dict(include_anggota=False, base_url=host) for item in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        }
    }), 200


@kk_bp.route("/kk/<int:kk_id>", methods=["GET"])
def get_kk_detail(kk_id: int):
    """Retrieves full Kartu Keluarga details including all members."""
    kk = IdentitasKK.query.get(kk_id)
    if not kk:
        return jsonify({
            "error": f"Kartu Keluarga dengan ID {kk_id} tidak ditemukan.",
            "fields": {"id": "Data tidak ditemukan."}
        }), 404

    host = request.host_url.rstrip("/")
    return jsonify(kk.to_dict(include_anggota=True, base_url=host)), 200


@kk_bp.route("/kk/<int:kk_id>", methods=["PUT"])
def update_kk(kk_id: int):
    """Updates Identitas KK header and address fields."""
    kk = IdentitasKK.query.get(kk_id)
    if not kk:
        return jsonify({
            "error": f"Kartu Keluarga dengan ID {kk_id} tidak ditemukan.",
            "fields": {"id": "Data tidak ditemukan."}
        }), 404

    data = request.get_json(silent=True) or {}
    cleaned, errors = validate_identitas_kk(data, is_update=True)
    if errors:
        return jsonify({
            "error": "Validasi perbaruan Identitas KK gagal.",
            "fields": errors
        }), 422

    # Check no_kk uniqueness if changed
    if "no_kk" in cleaned and cleaned["no_kk"] != kk.no_kk:
        existing = IdentitasKK.query.filter_by(no_kk=cleaned["no_kk"]).first()
        if existing and existing.id != kk.id:
            return jsonify({
                "error": f"Nomor KK {cleaned['no_kk']} sudah digunakan oleh data lain.",
                "fields": {"no_kk": "Nomor KK sudah terdaftar."}
            }), 409

    try:
        for key, val in cleaned.items():
            setattr(kk, key, val)

        db.session.commit()
        host = request.host_url.rstrip("/")
        return jsonify({
            "message": "Identitas Kartu Keluarga berhasil diperbarui.",
            "data": kk.to_dict(include_anggota=True, base_url=host)
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal memperbarui KK ID %s: %s", kk_id, e)
        return jsonify({
            "error": "Terjadi kesalahan internal saat memperbarui data.",
            "fields": {"database": str(e)}
        }), 500


@kk_bp.route("/kk/<int:kk_id>", methods=["DELETE"])
def delete_kk(kk_id: int):
    """
    Deletes Kartu Keluarga and cascades to all its members.
    Also cleans up associated local uploaded image.
    """
    kk = IdentitasKK.query.get(kk_id)
    if not kk:
        return jsonify({
            "error": f"Kartu Keluarga dengan ID {kk_id} tidak ditemukan.",
            "fields": {"id": "Data tidak ditemukan."}
        }), 404

    try:
        no_kk_deleted = kk.no_kk
        gambar = kk.gambar
        upload_folder = current_app.config.get("UPLOAD_FOLDER")

        db.session.delete(kk)
        db.session.commit()

        # Remove image file if exists
        if gambar and upload_folder:
            img_path = os.path.join(upload_folder, gambar)
            if os.path.exists(img_path):
                try:
                    os.remove(img_path)
                except Exception:
                    pass

        return jsonify({
            "message": f"Kartu Keluarga No. {no_kk_deleted} dan seluruh anggotanya berhasil dihapus.",
            "deleted_id": kk_id
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal menghapus KK ID %s: %s", kk_id, e)
        return jsonify({
            "error": "Terjadi kesalahan internal saat menghapus data.",
            "fields": {"database": str(e)}
        }), 500
