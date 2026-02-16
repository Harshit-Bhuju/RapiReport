import os
import base64
import logging
from typing import Tuple, Optional

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file (repo already ignores .env)
load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """You are a medical pharmacist. Your goal is to convert messy OCR text into a clean, structured medical report.

### INSTRUCTIONS:
1. **Identify Medications**: Extract names, dosages, and frequencies (e.g., Paracetamol 500mg, twice a day).
2. **Fix Spelling**: Fix spelling for common medicines (e.g., 'Paracetmol' -> 'Paracetamol').
3. **Medical Context**: Use medical context to infer the most likely word if the OCR/image is unclear.
4. **Structure**: Format the output clearly with sections like:
   - Patient Information (if any)
   - Prescribed Medications
   - Instructions
   - Additional Notes
5. **Tone**: Maintain a professional, clinical tone."""


def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def simple_text_cleanup(raw_text: str) -> str:
    """Simple fallback text processor when APIs are unavailable."""
    lines = raw_text.strip().split("\n")
    cleaned = []
    for line in lines:
        line = line.strip()
        if line:
            cleaned.append(line)
    return "\n\n".join(f"• {line}" for line in cleaned if len(line) > 3)


def refine_with_openai(raw_text: str, image_path: str = None) -> Tuple[Optional[str], Optional[str]]:
    """Refine text using OpenAI. Returns (result, error_msg)."""
    if not OPENAI_KEY or OPENAI_KEY == "your_openai_api_key_here":
        return None, "OpenAI API key not configured"

    try:
        # Import lazily to avoid hard dependency errors until actually used
        from openai import OpenAI

        openai_client = OpenAI(api_key=OPENAI_KEY)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        user_content = []
        if raw_text:
            user_content.append({"type": "text", "text": f"Here is the raw OCR text:\n{raw_text}"})

        if image_path and os.path.exists(image_path):
            base64_image = encode_image(image_path)
            user_content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                }
            )
            user_content.append(
                {
                    "type": "text",
                    "text": "Please use this image to correct any errors in the OCR text or extract information directly if the OCR is poor.",
                }
            )

        messages.append({"role": "user", "content": user_content})

        response = openai_client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL") or "gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.3,
        )
        result = response.choices[0].message.content
        logger.info("✓ OpenAI refinement successful")
        return result, None
    except Exception as e:
        error_msg = str(e)
        logger.error(f"✗ OpenAI refinement failed: {error_msg}")
        return None, error_msg


def refine_with_gemini(raw_text: str) -> Tuple[Optional[str], Optional[str]]:
    """Refine text using Google Gemini API. Returns (result, error_msg)."""
    if not GEMINI_KEY or GEMINI_KEY == "your_gemini_api_key_here":
        return None, "Gemini API key not configured"

    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_KEY)

        # Your key supports gemini-2.x only (no gemini-pro or 1.5)
        model_names = [
            os.getenv("GEMINI_MODEL"),
            "gemini-2.0-flash",
            "gemini-2.0-flash-001",
            "gemini-2.0-flash-lite",
            "gemini-flash-latest",
        ]

        for model_name in [m for m in model_names if m]:
            try:
                model = genai.GenerativeModel(model_name)
                prompt = f"""{SYSTEM_PROMPT}

Raw OCR text:
{raw_text}

Please process this prescription text and return a clean, structured medical report."""
                response = model.generate_content(prompt)
                result = getattr(response, "text", None) or ""
                if result.strip():
                    logger.info(f"✓ Gemini refinement successful using {model_name}")
                    return result, None
            except Exception as model_err:
                logger.warning(f"Model {model_name} failed: {model_err}")
                continue

        return None, "No available Gemini models"
    except Exception as e:
        error_msg = str(e)
        logger.error(f"✗ Gemini refinement failed: {error_msg}")
        return None, error_msg


def refine_text(raw_text: str, image_path: str = None) -> str:
    """Refine OCR text using Gemini, with OpenAI and simple fallback."""
    logger.info("Starting text refinement...")

    # Try Gemini first as requested
    logger.info("Attempting Gemini refinement...")
    result, gemini_err = refine_with_gemini(raw_text)
    if result:
        return result

    # Fallback to OpenAI
    logger.info("Attempting OpenAI refinement...")
    result, openai_err = refine_with_openai(raw_text, image_path)
    if result:
        return result

    # Last resort: simple cleanup
    logger.warning("Both APIs failed, using simple text cleanup as fallback")
    fallback = simple_text_cleanup(raw_text)
    if fallback:
        return f"[Fallback: APIs unavailable]\n\n{fallback}"

    error_details = f"Gemini: {gemini_err}\nOpenAI: {openai_err}"
    logger.error(f"All refinement methods failed:\n{error_details}")
    return f"Error: Could not refine text. Both APIs failed:\n{error_details}"

