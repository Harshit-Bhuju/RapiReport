import logging
import os
import shutil
import uuid
import mysql.connector
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .ocr_engine import process_image_ocr
from .refiner import refine_text

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rapireport.ocr_service")

app = FastAPI(title="RapiReport OCR Service", version="1.1.0")

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_SERVER", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASS", ""),
            database=os.getenv("DB_NAME", "rapireport")
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return None

def _parse_cors_origins() -> List[str]:
    raw = os.getenv("OCR_CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return ["*"] # Allow all for local dev if not specified

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)
# OCR images saved here (relative to backend root)
UPLOAD_DIR = BASE_DIR.parent / "uploads" / "ocr"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/health")
async def health_check():
    db_status = "ok" if get_db_connection() else "error"
    return {"status": "ok", "message": "OCR service is running", "database": db_status}

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user_id: Optional[int] = Form(None)
) -> Dict[str, str]:
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "Invalid image file. Please upload an image.")

    ext = Path(file.filename or "upload.jpg").suffix.lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"
    saved_filename = f"ocr_{uuid.uuid4().hex}{ext}"
    temp_path = TEMP_DIR / saved_filename

    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    logger.info(f"Processing image for user {user_id}: {saved_filename}")

    try:
        # 1. Run OCR
        raw_text = process_image_ocr(str(temp_path))
        if raw_text.startswith("Error:"):
            raise HTTPException(500, f"OCR failed: {raw_text}")

        # 2. Refine with AI
        refined_report = refine_text(raw_text, str(temp_path))

        # 3. Save OCR image to uploads/ocr/ (keep for display)
        full_upload_path = UPLOAD_DIR / saved_filename
        shutil.copy2(temp_path, full_upload_path)

        # 4. Store in Database if user_id is provided
        if user_id:
            conn = get_db_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    sql = "INSERT INTO ocr_history (user_id, image_path, raw_text, refined_text) VALUES (%s, %s, %s, %s)"
                    cursor.execute(sql, (user_id, saved_filename, raw_text, refined_report))
                    conn.commit()
                    logger.info(f"Stored OCR history for user {user_id}")
                except Exception as db_err:
                    logger.error(f"Failed to store in DB: {db_err}")
                finally:
                    conn.close()

        return {"raw": raw_text, "refined": refined_report, "imagePath": saved_filename}
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(500, str(e))
    finally:
        if temp_path.exists():
            temp_path.unlink()
