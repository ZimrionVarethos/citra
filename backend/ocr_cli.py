import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.ocr_service import OcrPipeline

def main():
    if len(sys.argv) < 2:
        print("Penggunaan: python ocr_cli.py <path_ke_file_gambar_kk>", file=sys.stderr)
        print("Contoh: python ocr_cli.py sample_kk.jpg", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: File '{image_path}' tidak ditemukan.", file=sys.stderr)
        sys.exit(1)

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    debug = os.getenv("DEBUG_OCR", "0").lower() in ("1", "true", "yes")
    print(f"[*] Menjalankan OCR Pipeline pada '{image_path}' (DEBUG_OCR={debug})...", file=sys.stderr)

    pipeline = OcrPipeline(debug=debug)
    try:
        result = pipeline.process(image_bytes)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"[!] Error saat memproses OCR: {e}", file=sys.stderr)
        sys.exit(2)

if __name__ == "__main__":
    main()
