import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple

def detect_table_grid(gray: np.ndarray) -> Tuple[List[Dict[str, int]], np.ndarray]:
    h, w = gray.shape[:2]

    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5
    )

    horiz_scale = max(20, int(w / 35))
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horiz_scale, 1))
    horiz_lines = cv2.erode(thresh, horiz_kernel, iterations=1)
    horiz_lines = cv2.dilate(horiz_lines, horiz_kernel, iterations=2)

    vert_scale = max(20, int(h / 35))
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vert_scale))
    vert_lines = cv2.erode(thresh, vert_kernel, iterations=1)
    vert_lines = cv2.dilate(vert_lines, vert_kernel, iterations=2)

    table_grid = cv2.add(horiz_lines, vert_lines)

    contours, _ = cv2.findContours(table_grid, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    tables: List[Dict[str, int]] = []

    for c in contours:
        x, y, tw, th = cv2.boundingRect(c)
        if tw > w * 0.55 and th > h * 0.10:
            tables.append({"x": x, "y": y, "w": tw, "h": th})

    tables.sort(key=lambda t: t["y"])
    return tables, table_grid

def segment_document_regions(
    gray: np.ndarray, detected_tables: List[Dict[str, int]]
) -> Dict[str, Tuple[int, int, int, int]]:
    h, w = gray.shape[:2]
    regions: Dict[str, Tuple[int, int, int, int]] = {}

    if len(detected_tables) >= 2:
        t1 = detected_tables[0]
        t2 = detected_tables[1]

        header_bottom = max(int(h * 0.15), t1["y"])
        regions["header"] = (0, 0, w, header_bottom)
        regions["upper_table"] = (t1["x"], t1["y"], t1["w"], t1["h"])
        regions["lower_table"] = (t2["x"], t2["y"], t2["w"], t2["h"])

        footer_top = min(int(h * 0.95), t2["y"] + t2["h"])
        regions["footer"] = (0, footer_top, w, h - footer_top)
    elif len(detected_tables) == 1:
        t = detected_tables[0]
        half_th = t["h"] // 2
        header_bottom = max(int(h * 0.15), t["y"])

        regions["header"] = (0, 0, w, header_bottom)
        regions["upper_table"] = (t["x"], t["y"], t["w"], half_th)
        regions["lower_table"] = (t["x"], t["y"] + half_th, t["w"], t["h"] - half_th)
        footer_top = t["y"] + t["h"]
        regions["footer"] = (0, footer_top, w, max(50, h - footer_top))
    else:
        regions["header"] = (0, 0, w, int(h * 0.32))
        regions["upper_table"] = (int(w * 0.02), int(h * 0.32), int(w * 0.96), int(h * 0.30))
        regions["lower_table"] = (int(w * 0.02), int(h * 0.63), int(w * 0.96), int(h * 0.25))
        regions["footer"] = (0, int(h * 0.88), w, int(h * 0.12))

    return regions

def extract_table_rows_and_cols(
    table_crop_gray: np.ndarray,
    expected_cols: int = 10,
    min_row_height: int = 20
) -> List[List[np.ndarray]]:
    th, tw = table_crop_gray.shape[:2]
    thresh = cv2.adaptiveThreshold(
        table_crop_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5
    )

    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (int(tw / 30), 1))
    h_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horiz_kernel)

    h_proj = np.sum(h_lines, axis=1)
    threshold_val = np.max(h_proj) * 0.25 if np.max(h_proj) > 0 else 10
    row_lines = np.where(h_proj > threshold_val)[0]

    row_boundaries = [0]
    for y in row_lines:
        if abs(y - row_boundaries[-1]) > min_row_height:
            row_boundaries.append(int(y))
    if row_boundaries[-1] < th - min_row_height:
        row_boundaries.append(th)

    if len(row_boundaries) < 3:
        num_splits = 5
        row_boundaries = [int(i * (th / num_splits)) for i in range(num_splits + 1)]

    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, int(th / 25)))
    v_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vert_kernel)

    v_proj = np.sum(v_lines, axis=0)
    v_thresh = np.max(v_proj) * 0.25 if np.max(v_proj) > 0 else 10
    col_lines = np.where(v_proj > v_thresh)[0]

    col_boundaries = [0]
    min_col_width = int(tw / (expected_cols * 2.5))
    for x in col_lines:
        if abs(x - col_boundaries[-1]) > min_col_width:
            col_boundaries.append(int(x))
    if col_boundaries[-1] < tw - min_col_width:
        col_boundaries.append(tw)

    if len(col_boundaries) < expected_cols:
        col_boundaries = [int(i * (tw / expected_cols)) for i in range(expected_cols + 1)]

    cell_grid: List[List[np.ndarray]] = []
    data_row_starts = 1 if len(row_boundaries) > 2 else 0

    for r in range(data_row_starts, len(row_boundaries) - 1):
        y1, y2 = row_boundaries[r], row_boundaries[r + 1]
        if y2 - y1 < 12:
            continue
        row_cells: List[np.ndarray] = []
        for c in range(len(col_boundaries) - 1):
            x1, x2 = col_boundaries[c], col_boundaries[c + 1]
            if x2 - x1 < 10:
                continue
            cell_crop = table_crop_gray[y1:y2, x1:x2]
            row_cells.append(cell_crop)
        if row_cells:
            cell_grid.append(row_cells)

    return cell_grid
