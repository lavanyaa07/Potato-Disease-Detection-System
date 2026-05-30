# 🌿 AgriVision AI — Potato Disease Detection System

> **AI-powered plant pathology for precision agriculture**  
> Built with TensorFlow 2.13 · FastAPI · React 17 · Python 3.10

---

## 📋 Project Overview

AgriVision AI uses a deep Convolutional Neural Network (CNN) trained on the PlantVillage dataset to classify potato leaf images into three categories:

| Class | Description |
|-------|-------------|
| 🟤 Early Blight | Alternaria solani fungal infection |
| 🔵 Late Blight | Phytophthora infestans (caused Irish famine) |
| 🟢 Healthy | No disease detected |

**Architecture:** React frontend → FastAPI backend → TensorFlow CNN model

---

## 🛠️ Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Python | **3.10.x** | [python.org](https://python.org) |
| Node.js | 16+ | [nodejs.org](https://nodejs.org) |
| npm | 8+ | Bundled with Node.js |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## ⚡ Quick Start (Local)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/potato-disease-classification.git
cd potato-disease-classification
```

### 2. Backend Setup (FastAPI + TensorFlow)

```bash
# Create virtual environment using Python 3.10
py -3.10 -m venv venv310

# Activate it (Windows)
venv310\Scripts\activate

# Install dependencies
pip install -r api/requirements.txt

# Start the API server
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API is now live at: **http://localhost:8000**
- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 3. Frontend Setup (React)

```bash
# Open a new terminal in project root
cd frontend
npm install
npm start
```

Frontend is now live at: **http://localhost:3000**

---

## 🔬 Testing Predictions

Use the test images in `test_images_from_internet/`:

```powershell
# Test Early Blight
curl -X POST http://localhost:8000/predict -F "file=@test_images_from_internet/early_blight_1.jpg"

# Test Late Blight  
curl -X POST http://localhost:8000/predict -F "file=@test_images_from_internet/late_blight_1.jpg"
```

Expected response:
```json
{
  "class": "Early Blight",
  "confidence": 0.987,
  "all_predictions": {
    "Early Blight": 0.987,
    "Late Blight": 0.008,
    "Healthy": 0.005
  }
}
```

---

## 🚀 Deployment

### Backend → Render

1. Push your repository to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repository
4. Render auto-detects `render.yaml` — click **Deploy**
5. Set environment variable:
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Set environment variable:
   - `REACT_APP_API_URL` = `https://your-api.onrender.com/predict`
5. Click **Deploy**

---

## 📁 Project Structure

```
potato-disease-classification/
├── api/
│   ├── main.py              # FastAPI backend (fixed preprocessing + CORS)
│   └── requirements.txt     # Python deps (TF 2.13, FastAPI 0.103)
├── frontend/
│   ├── public/
│   │   └── index.html       # Updated title/meta (AgriVision AI)
│   ├── src/
│   │   ├── App.js           # Root component
│   │   ├── home.js          # Main UI (AgriVision AI theme)
│   │   └── index.css        # Global styles (dark ag + AI theme)
│   ├── .env                 # Local API URL
│   ├── .env.production      # Production API URL (Render)
│   └── vercel.json          # Vercel SPA routing config
├── training/
│   └── *.ipynb              # Training notebooks (CNN model)
├── saved_models/3/          # TF SavedModel format (fallback)
├── potatoes.h5              # Primary model file (2.2 MB)
├── test_images_from_internet/  # Test images for validation
├── Dockerfile               # Docker container for Render
├── render.yaml              # Render deployment config
├── RUN.md                   # Exact run commands
└── VIVA.md                  # Architecture + 30 viva Q&A
```

---

## 🔑 Environment Variables

### Backend (`api/`)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

### Frontend (`frontend/`)
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:8000/predict` | Backend API endpoint |

---

## 🧠 Key Technical Fixes

| Issue | Fix Applied |
|-------|-------------|
| `tensorflow==2.5.0` incompatible | Upgraded to `tensorflow==2.13.1` |
| Missing `/255.0` normalization | Added in `read_file_as_image()` |
| Relative model path breaking | Fixed with `Path(__file__).resolve().parent` |
| CORS only allowed `localhost:3000` | Made configurable via `ALLOWED_ORIGINS` env var |
| No error handling in frontend | Added full try/catch with user-visible error cards |
| CodeBasics branding | Removed all references; replaced with AgriVision AI |

---

## 📄 License

This project is for educational and portfolio purposes.
