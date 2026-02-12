import cv2
import numpy as np
from rapidocr_onnxruntime import RapidOCR

# Lazy load the engine on first use
_engine = None


def get_engine():
    """Lazy load RapidOCR engine with optimized settings."""
    global _engine
    if _engine is None:
        print("Initializing RapidOCR engine with optimized settings...")
        # use_angle_cls helps with skewed/rotated scans common in medical reports
        _engine = RapidOCR(use_angle_cls=True)
    return _engine


def preprocess_image(img: np.ndarray) -> np.ndarray:
    """Minimal preprocessing. RapidOCR often works best on raw or simple grayscale."""
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # We remove CLAHE and Denoising as they can distort text features for ONNX models
    return gray


def process_image_ocr(image_path: str) -> str:
    # Use cv2.IMREAD_COLOR for the engine, or grayscale if preferred by engine
    img = cv2.imread(image_path)
    if img is None:
        return "Error: Could not read image."

    engine = get_engine()
    
    # Try with raw image first as RapidOCR (PaddleOCR) handles color well
    results, _ = engine(img)

    if results is None:
        # Fallback to grayscale if raw fails
        print("Raw OCR failed, trying grayscale...")
        gray = preprocess_image(img)
        results, _ = engine(gray)

    if results is None:
        return "No text detected (image might be too blurry or low quality)"

    # Filter by confidence score (> 0.1)
    filtered_results = [res for res in results if float(res[2]) > 0.1]
    
    if not filtered_results:
        return "No text detected (image might be too blurry or low quality)"

    # Sort results to maintain reading order: Primarily top-to-bottom (Y), then left-to-right (X)
    # res[0] is the box: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
    # Sort primarily by the average Y coordinate of the box
    filtered_results.sort(key=lambda x: (np.mean([p[1] for p in x[0]]), np.mean([p[0] for p in x[0]])))
    
    # Extract text
    raw_text = [res[1] for res in filtered_results]
    
    final_text = " ".join(raw_text)
    
    return final_text if final_text.strip() else "No text detected (image might be too blurry or low quality)"
