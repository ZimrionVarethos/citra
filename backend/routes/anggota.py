import logging
from flask import Blueprint, jsonify, request

from models import AnggotaKeluargaKK, IdentitasKK, db
from schemas.validators import validate_anggota

anggota_bp = Blueprint("anggota", __name__)
logger = logging.getLogger(__name__)


@anggota_bp.route("/kk/<int:kk_id>/anggota", methods=["POST"])
def add_anggota(kk_id: int):
    """Adds a new family member to an existing Kartu Keluarga."""
    kk = IdentitasKK.query.get(kk_id)
    if not kk:
        return jsonify({
            "error": f"Kartu Keluarga dengan ID {kk_id} tidak ditemukan.",
            "fields": {"kk_id": "Data KK tidak ditemukan."}
        }), 404

    data = request.get_json(silent=True) or {}
    cleaned, errors = validate_anggota(data, is_update=False)
    if errors:
        return jsonify({
            "error": "Validasi data anggota baru gagal.",
            "fields": errors
        }), 422

    try:
        # Determine no_urut if not specified
        if "no_urut" not in cleaned or not cleaned["no_urut"]:
            max_urut = db.session.query(db.func.max(AnggotaKeluargaKK.no_urut)).filter_by(id_kk=kk_id).scalar() or 0
            cleaned["no_urut"] = max_urut + 1

        new_member = AnggotaKeluargaKK(id_kk=kk_id, **cleaned)
        db.session.add(new_member)
        db.session.commit()

        return jsonify({
            "message": "Anggota keluarga berhasil ditambahkan.",
            "data": new_member.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal menambahkan anggota ke KK ID %s: %s", kk_id, e)
        return jsonify({
            "error": "Terjadi kesalahan internal saat menambahkan anggota.",
            "fields": {"database": str(e)}
        }), 500


@anggota_bp.route("/anggota/<int:anggota_id>", methods=["PUT"])
def update_anggota(anggota_id: int):
    """Updates an existing family member record."""
    member = AnggotaKeluargaKK.query.get(anggota_id)
    if not member:
        return jsonify({
            "error": f"Anggota keluarga dengan ID {anggota_id} tidak ditemukan.",
            "fields": {"id": "Data anggota tidak ditemukan."}
        }), 404

    data = request.get_json(silent=True) or {}
    cleaned, errors = validate_anggota(data, is_update=True)
    if errors:
        return jsonify({
            "error": "Validasi data anggota gagal.",
            "fields": errors
        }), 422

    try:
        for key, val in cleaned.items():
            setattr(member, key, val)

        db.session.commit()
        return jsonify({
            "message": "Data anggota keluarga berhasil diperbarui.",
            "data": member.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal memperbarui anggota ID %s: %s", anggota_id, e)
        return jsonify({
            "error": "Terjadi kesalahan internal saat memperbarui anggota.",
            "fields": {"database": str(e)}
        }), 500


@anggota_bp.route("/anggota/<int:anggota_id>", methods=["DELETE"])
def delete_anggota(anggota_id: int):
    """Deletes an individual family member record."""
    member = AnggotaKeluargaKK.query.get(anggota_id)
    if not member:
        return jsonify({
            "error": f"Anggota keluarga dengan ID {anggota_id} tidak ditemukan.",
            "fields": {"id": "Data anggota tidak ditemukan."}
        }), 404

    try:
        nama = member.nama_lengkap
        db.session.delete(member)
        db.session.commit()
        return jsonify({
            "message": f"Anggota keluarga '{nama}' berhasil dihapus.",
            "deleted_id": anggota_id
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal menghapus anggota ID %s: %s", anggota_id, e)
        return jsonify({
            "error": "Terjadi kesalahan internal saat menghapus anggota.",
            "fields": {"database": str(e)}
        }), 500
