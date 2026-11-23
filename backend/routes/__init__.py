from flask import Flask
from routes.anggota import anggota_bp
from routes.kk import kk_bp
from routes.ocr import ocr_bp

def register_routes(app: Flask) -> None:
    app.register_blueprint(ocr_bp, url_prefix="/api")
    app.register_blueprint(kk_bp, url_prefix="/api")
    app.register_blueprint(anggota_bp, url_prefix="/api")
