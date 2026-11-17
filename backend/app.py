import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from models import db
from routes import register_routes

# Configure structured logging (ensuring NO sensitive NIK / KK data is logged)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kk_scanner_app")


def create_app(config_class=Config) -> Flask:
    """Application factory for KK-SCANNER PRO Backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    # Enable CORS for allowed origins
    allowed_origins = app.config.get("ALLOWED_ORIGINS", ["http://localhost:3000"])
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    )

    # Register API blueprints under /api prefix
    register_routes(app)

    # Global HTTP error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request payload.", "fields": {"message": str(e)}}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint atau sumber daya tidak ditemukan.", "fields": {"url": str(e)}}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Metode HTTP tidak diizinkan pada endpoint ini.", "fields": {}}), 405

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"error": "Ukuran berkas melebihi batas maksimal 8 MB.", "fields": {"size": "Max 8MB"}}), 413

    @app.errorhandler(500)
    def internal_server_error(e):
        logger.error("Internal Server Error: %s", e, exc_info=True)
        return jsonify({"error": "Terjadi kesalahan internal pada peladen.", "fields": {}}), 500

    # Flask CLI command: flask init-db
    @app.cli.command("init-db")
    def init_db():
        """Creates tables in the target database from schema / models."""
        with app.app_context():
            db.create_all()
            print("[+] Berhasil menginisialisasi tabel database ('tbl_identitasKK' & 'tbl_anggotaKeluargaKK').")

    return app


# Production / Gunicorn entrypoint
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
