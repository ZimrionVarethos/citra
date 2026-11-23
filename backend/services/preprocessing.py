import os
import cv2
import numpy as np
from typing import Optional, Tuple

def validate_image_bytes(image_bytes: bytes) -> Tuple[bool, str]:
    if not image_bytes or len(image_bytes) < 12:
        return False, "File gambar kosong atau terlalu kecil."

    if image_bytes[:3] == b"\xff\xd8\xff":
        return True, "image/jpeg"

    if image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return True, "image/png"

    if image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP":
        return True, "image/webp"

    return False, "Format file tidak didukung. Unggah gambar JPG atau PNG."

def decode_image(image_bytes: bytes) -> Optional[np.ndarray]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return image

def resize_image_max_dim(image: np.ndarray, max_dim: int = 2000) -> np.ndarray:
    h, w = image.shape[:2]
    longest = max(h, w)
    if longest <= max_dim:
        return image

    scale = max_dim / float(longest)
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

def to_grayscale(image: np.ndarray) -> np.ndarray:
    if len(image.shape) == 2:
        return image
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def lightweight_denoise(gray: np.ndarray) -> np.ndarray:
    return cv2.GaussianBlur(gray, (3, 3), 0)

def deskew(gray: np.ndarray) -> Tuple[np.ndarray, float]:
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 100:
        return gray, 0.0

    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    elif angle > 45:
        angle = 90 - angle

    if abs(angle) < 0.4 or abs(angle) > 30:
        return gray, 0.0

    (h, w) = gray.shape[:2]
    center = (w // 2, h // 2)
    m = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        gray, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )
    return rotated, angle

def order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def detect_and_warp_perspective(color_img: np.ndarray, gray: np.ndarray) -> Tuple[np.ndarray, np.ndarray, bool]:
    h, w = gray.shape[:2]
    total_area = h * w

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 40, 150)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edged, kernel, iterations=1)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    for c in contours:
        area = cv2.contourArea(c)
        if area < total_area * 0.30:
            continue

        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)

        if len(approx) == 4:
            pts = approx.reshape(4, 2)
            rect = order_points(pts)
            (tl, tr, br, bl) = rect

            width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
            width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
            max_width = max(int(width_a), int(width_b))

            height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
            height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
            max_height = max(int(height_a), int(height_b))

            if max_width < 200 or max_height < 200:
                continue

            dst = np.array([
                [0, 0],
                [max_width - 1, 0],
                [max_width - 1, max_height - 1],
                [0, max_height - 1]
            ], dtype="float32")

            m = cv2.getPerspectiveTransform(rect, dst)
            warped_color = cv2.warpPerspective(color_img, m, (max_width, max_height))
            warped_gray = cv2.warpPerspective(gray, m, (max_width, max_height))
            return warped_color, warped_gray, True

    return color_img, gray, False

def binarize(gray: np.ndarray) -> np.ndarray:
    filtered = cv2.bilateralFilter(gray, 7, 50, 50)
    binary = cv2.adaptiveThreshold(
        filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10
    )
    return binary

def save_debug_image(img: np.ndarray, name: str, folder: str = "debug_ocr") -> None:
    try:
        os.makedirs(folder, exist_ok=True)
        cv2.imwrite(os.path.join(folder, f"{name}.png"), img)
    except Exception:
        pass
