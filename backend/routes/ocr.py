import logging
import os
from flask import Blueprint, current_app, jsonify, request, send_from_directory
from services.ocr_service import OcrPipeline
from services.preprocessing import validate_image_bytes

ocr_bp = Blueprint("ocr", __name__)
logger = logging.getLogger(__name__)

@ocr_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "KK Scanner OCR Backend",
        "version": "1.2.0"
    }), 200

@ocr_bp.route("/ocr", methods=["POST"])
def run_ocr():
    if request.form.get("manual"):
        return jsonify({
            "identitas": {
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
            },
            "anggota": [],
            "engine": "manual",
            "catatan": ["Mode input manual diaktifkan."],
            "zone_scores": [100, 100, 100, 100, 100],
            "confidence": 100.0,
            "total_anggota": 0,
            "gambar": "",
            "gambar_url": None,
        }), 200

    if "image" not in request.files:
        return jsonify({
            "error": "Field 'image' wajib disertakan dalam form data multipart.",
            "fields": {"image": "File gambar tidak ditemukan dalam request."}
        }), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({
            "error": "Nama file gambar tidak boleh kosong.",
            "fields": {"image": "File belum dipilih."}
        }), 400

    image_bytes = file.read()
    if len(image_bytes) == 0:
        return jsonify({
            "error": "File gambar kosong (0 bytes).",
            "fields": {"image": "Ukuran berkas 0 bytes."}
        }), 400

    max_len = current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)
    if len(image_bytes) > max_len:
        return jsonify({
            "error": "Ukuran gambar melebihi batas maksimal 10 MB.",
            "fields": {"image": "Batas ukuran file adalah 10 MB."}
        }), 413

    is_valid, mime_or_err = validate_image_bytes(image_bytes)
    if not is_valid:
        return jsonify({
            "error": mime_or_err,
            "fields": {"image": mime_or_err}
        }), 422

    debug = current_app.config.get("DEBUG_OCR", False)
    upload_folder = current_app.config.get("UPLOAD_FOLDER")
    engine = request.form.get("engine", "auto")

    pipeline = OcrPipeline(debug=debug, upload_folder=upload_folder)

    try:
        result = pipeline.process(
            image_bytes=image_bytes,
            engine=engine,
            original_filename=file.filename or "kk.jpg"
        )
        if result.get("gambar"):
            host = request.host_url.rstrip("/")
            result["gambar_url"] = f"{host}/api/uploads/{result['gambar']}"

        return jsonify(result), 200

    except ValueError as ve:
        logger.warning("OCR processing warning: %s", ve)
        return jsonify({
            "error": str(ve),
            "fields": {"image": str(ve)}
        }), 422
    except Exception as e:
        logger.error("OCR unexpected error: %s", e, exc_info=True)
        return jsonify({
            "error": "Citra terlalu buram atau gagal diproses oleh mesin OCR.",
            "identitas": {
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
            },
            "anggota": [],
            "engine": "gagal",
            "catatan": [f"Terjadi kesalahan saat pemrosesan OCR: {str(e)}"],
            "zone_scores": [0, 0, 0, 0, 0],
            "confidence": 0.0,
            "total_anggota": 0,
            "gambar": "",
            "gambar_url": None,
        }), 200

@ocr_bp.route("/uploads/<path:filename>", methods=["GET"])
def get_uploaded_image(filename: str):
    upload_folder = current_app.config.get("UPLOAD_FOLDER")
    if not upload_folder or not os.path.exists(os.path.join(upload_folder, filename)):
        return jsonify({"error": "Berkas citra tidak ditemukan."}), 404
    return send_from_directory(upload_folder, filename)
