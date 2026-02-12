## OCR microservice (FastAPI + EasyOCR)

This optional service powers the **Prescription Scan → Advanced OCR** button in the main app.

### Install (Windows PowerShell)

```powershell
cd backend/ocr_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Configure keys (optional)

- Copy `.env.example` → `.env`
- Fill `OPENAI_API_KEY` and/or `GEMINI_API_KEY`

### Run

```powershell
cd backend/ocr_service
.\.venv\Scripts\Activate.ps1
uvicorn backend.ocr_service.main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

