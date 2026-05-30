import os
import sys
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf

# ── App Setup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AgriVision AI – Potato Disease Detection API",
    description="Deep learning API for potato leaf disease classification using CNN.",
    version="2.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allow local dev + Vercel frontend + Render frontend (override via env var)
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost,http://localhost:3000,http://localhost:5173"
)
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Loading ──────────────────────────────────────────────────────────────
# Resolve model path relative to this file so it works from any working directory
BASE_DIR = Path(__file__).resolve().parent

# Local development
MODEL_PATH = BASE_DIR.parent / "potatoes.h5"

# Render Docker deployment
if not MODEL_PATH.exists():
    MODEL_PATH = Path("/potatoes.h5")

if not MODEL_PATH.exists():
    print(f"[ERROR] Model not found: {MODEL_PATH}", file=sys.stderr)
    sys.exit(1)

if not MODEL_PATH.exists():
    # Fallback: look for SavedModel format
    saved_model_path = BASE_DIR.parent / "saved_models" / "3"
    if saved_model_path.exists():
        MODEL_PATH = saved_model_path
        print(f"[INFO] Using SavedModel fallback at: {MODEL_PATH}")
    else:
        print(f"[ERROR] No model found at {MODEL_PATH} or {saved_model_path}", file=sys.stderr)
        sys.exit(1)

print(f"[INFO] Loading model from: {MODEL_PATH}")
MODEL = tf.keras.models.load_model(str(MODEL_PATH), compile=False)
print(f"[INFO] Model loaded successfully. Input shape: {MODEL.input_shape}")

# ── Class Labels ───────────────────────────────────────────────────────────────
# Order must match training: image_dataset_from_directory loads alphabetically:
#   Potato___Early_blight → 0
#   Potato___Late_blight  → 1
#   Potato___healthy      → 2
CLASS_NAMES = ["Early Blight", "Late Blight", "Healthy"]


# ── Preprocessing ──────────────────────────────────────────────────────────────
def read_file_as_image(data: bytes) -> np.ndarray:
    """
    Load image from bytes, resize to 256×256 (matches training),
    and normalise pixel values to [0, 1] (matches training rescale=1/255).
    """
    image = Image.open(BytesIO(data)).convert("RGB")  # ensure 3 channels
    image = image.resize((256, 256))
    image = np.array(image, dtype=np.float32)
    image = image / 255.0   # ← CRITICAL: training used rescale=1/255
    return image


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/ping")
async def ping():
    """Health check – confirms the server is alive."""
    return {"status": "alive", "message": "AgriVision AI API is running"}


@app.get("/health")
async def health():
    """Render/Vercel health check endpoint."""
    return {"status": "healthy", "model": str(MODEL_PATH.name), "classes": CLASS_NAMES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accept a potato leaf image and return predicted disease class + confidence.

    Returns:
        class (str): One of 'Early Blight', 'Late Blight', 'Healthy'
        confidence (float): Prediction confidence 0–1
        all_predictions (dict): Softmax probabilities for all classes
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        contents = await file.read()
        image = read_file_as_image(contents)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not process image: {str(e)}")

    # Add batch dimension: (256, 256, 3) → (1, 256, 256, 3)
    img_batch = np.expand_dims(image, axis=0)

    try:
        predictions = MODEL.predict(img_batch, verbose=0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    predicted_idx = int(np.argmax(predictions[0]))
    predicted_class = CLASS_NAMES[predicted_idx]
    confidence = float(np.max(predictions[0]))
    all_preds = {CLASS_NAMES[i]: float(predictions[0][i]) for i in range(len(CLASS_NAMES))}

    print(f"[PREDICT] class={predicted_class}, confidence={confidence:.4f}, all={all_preds}")

    return {
        "class": predicted_class,
        "confidence": confidence,
        "all_predictions": all_preds,
    }


# ── Entry Point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
    )
