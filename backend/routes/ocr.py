import logging
from flask import Blueprint, current_app, jsonify, request
from services.ocr_service import OcrPipeline
from services.preprocessing import validate_image_bytes

ocr_bp = Blueprint("ocr", __name__)
logger = logging.getLogger(__name__)


@ocr_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for Render cold-start ping and uptime monitoring."""
    return jsonify({
        "status": "healthy",
        "service": "KK-SCANNER PRO OCR Backend",
        "version": "1.0.0"
    }), 200


@ocr_bp.route("/ocr", methods=["POST"])
def run_ocr():
    """
    Accepts multipart/form-data with 'image' file field.
    Validates magic bytes & file size (<= 8MB).
    Runs OpenCV + Tesseract OCR in-memory (no file saved to disk or DB).
    Returns extracted {identitas, anggota, zone_scores, confidence}.
    """
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

    # Read bytes into memory
    image_bytes = file.read()
    if len(image_bytes) == 0:
        return jsonify({
            "error": "File gambar kosong (0 bytes).",
            "fields": {"image": "Ukuran berkas 0 bytes."}
        }), 400

    if len(image_bytes) > current_app.config.get("MAX_CONTENT_LENGTH", 8 * 1024 * 1024):
        return jsonify({
            "error": "Ukuran gambar melebihi batas maksimal 8 MB.",
            "fields": {"image": "Batas ukuran file adalah 8 MB."}
        }), 413

    # Magic byte validation
    is_valid, mime_or_err = validate_image_bytes(image_bytes)
    if not is_valid:
        return jsonify({
            "error": mime_or_err,
            "fields": {"image": mime_or_err}
        }), 422

    debug = current_app.config.get("DEBUG_OCR", False)
    pipeline = OcrPipeline(debug=debug)

    try:
        result = pipeline.process(image_bytes)
        return jsonify(result), 200
    except ValueError as ve:
        logger.warning("OCR processing warning: %s", ve)
        return jsonify({
            "error": str(ve),
            "fields": {"image": str(ve)}
        }), 422
    except Exception as e:
        logger.error("OCR unexpected error: %s", e, exc_info=True)
        # Never crash the API: return safe empty schema with error note
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
            "zone_scores": [0, 0, 0, 0, 0],
            "confidence": 0.0,
            "total_anggota": 0,
        }), 200
