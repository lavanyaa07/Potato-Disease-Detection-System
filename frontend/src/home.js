import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./index.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/predict";

const DISEASE_INFO = {
  "Early Blight": {
    icon: "🟤",
    color: "#c0392b",
    gradient: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
    badge: "bg-danger",
    severity: "Moderate",
    description:
      "Caused by Alternaria solani fungus. Appears as dark brown spots with concentric rings forming a 'target' pattern. Primarily affects older leaves first.",
    treatment:
      "Apply copper-based fungicides. Remove and destroy infected leaves. Ensure proper plant spacing for air circulation.",
    prevention: "Crop rotation, resistant varieties, avoid overhead irrigation.",
  },
  "Late Blight": {
    icon: "🔵",
    color: "#2471a3",
    gradient: "linear-gradient(135deg, #1a5276 0%, #2980b9 100%)",
    badge: "bg-primary",
    severity: "Severe",
    description:
      "Caused by Phytophthora infestans – the same pathogen behind the 1840s Irish potato famine. Creates water-soaked, dark lesions spreading rapidly.",
    treatment:
      "Apply systemic fungicides (metalaxyl). Remove infected plants immediately. Do not compost infected material.",
    prevention: "Plant certified disease-free seeds, avoid wet foliage, destroy volunteer plants.",
  },
  Healthy: {
    icon: "🟢",
    color: "#27ae60",
    gradient: "linear-gradient(135deg, #1e8449 0%, #2ecc71 100%)",
    badge: "bg-success",
    severity: "None",
    description:
      "The leaf appears healthy with no signs of fungal or pathogenic infection. Normal green coloration, no spots or lesions detected.",
    treatment: "No treatment required. Continue regular crop maintenance practices.",
    prevention: "Maintain balanced fertilization, proper watering schedules, and periodic scouting.",
  },
};

const ConfidenceBar = ({ label, value, color }) => (
  <div className="conf-row">
    <div className="conf-label">
      <span>{label}</span>
      <span className="conf-pct">{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="conf-track">
      <div
        className="conf-fill"
        style={{
          width: `${(value * 100).toFixed(1)}%`,
          background: color,
          transition: "width 1s ease",
        }}
      />
    </div>
  </div>
);

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking"); // checking | online | offline
  const fileRef = useRef();

  // Check API health on mount
  useEffect(() => {
    const healthUrl = API_URL.replace("/predict", "/health");
    axios
      .get(healthUrl, { timeout: 5000 })
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  // Preview URL management
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
  }, []);

  const onInputChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const analyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(API_URL, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      setResult(res.data);
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        setError("Request timed out. Make sure the backend server is running.");
      } else if (err.response) {
        setError(`API Error ${err.response.status}: ${err.response.data?.detail || "Unknown error"}`);
      } else {
        setError("Cannot reach the API. Make sure the backend is running on port 8000.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const info = result ? DISEASE_INFO[result.class] : null;

  return (
    <div className="app">
      {/* ── NAV ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">🌿</span>
          <div className="nav-title-block">
            <span className="nav-title">AgriVision AI</span>
            <span className="nav-subtitle">Potato Disease Detection System</span>
          </div>
        </div>
        <div className="nav-right">
          <span className={`api-badge ${apiStatus}`}>
            <span className="api-dot" />
            {apiStatus === "checking" ? "Checking…" : apiStatus === "online" ? "API Online" : "API Offline"}
          </span>
          <span className="nav-tag">v2.0 · CNN Model</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🔬 AI-Powered Plant Pathology</div>
          <h1 className="hero-title">
            Detect Potato Diseases<br />
            <span className="hero-accent">Instantly with AI</span>
          </h1>
          <p className="hero-desc">
            Upload a potato leaf image and our Convolutional Neural Network model will classify it as
            <strong> Early Blight</strong>, <strong>Late Blight</strong>, or <strong>Healthy</strong> in seconds.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">3</span>
              <span className="stat-label">Disease Classes</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">256×256</span>
              <span className="stat-label">Input Resolution</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">CNN</span>
              <span className="stat-label">Deep Learning</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
          <span className="hero-icon-main">🥔</span>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <div className="content-grid">
          {/* ── UPLOAD PANEL ── */}
          <div className="panel upload-panel">
            <div className="panel-header">
              <span className="panel-icon">📷</span>
              <div>
                <h2 className="panel-title">Upload Leaf Image</h2>
                <p className="panel-sub">JPG, PNG, WEBP · Max 10 MB</p>
              </div>
            </div>

            {!preview ? (
              <div
                className={`dropzone ${dragOver ? "drag-active" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div className="drop-icon">🍃</div>
                <p className="drop-title">Drag &amp; drop your image here</p>
                <p className="drop-sub">or click to browse files</p>
                <button className="drop-btn" type="button">Choose Image</button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onInputChange}
                  style={{ display: "none" }}
                />
              </div>
            ) : (
              <div className="preview-block">
                <div className="preview-img-wrap">
                  <img src={preview} alt="Uploaded leaf" className="preview-img" />
                  <div className="preview-overlay">
                    <span>🔍 Ready to Analyse</span>
                  </div>
                </div>
                <div className="preview-meta">
                  <span className="preview-filename">📄 {file?.name}</span>
                  <span className="preview-size">{(file?.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="preview-actions">
                  <button
                    className="btn-primary"
                    onClick={analyse}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="btn-spinner" /> Analysing…</>
                    ) : (
                      <><span>🔬</span> Analyse Disease</>
                    )}
                  </button>
                  <button className="btn-secondary" onClick={reset}>
                    ↩ Reset
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-card">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* ── RESULT PANEL ── */}
          <div className="panel result-panel">
            <div className="panel-header">
              <span className="panel-icon">📊</span>
              <div>
                <h2 className="panel-title">Detection Results</h2>
                <p className="panel-sub">CNN model prediction output</p>
              </div>
            </div>

            {!result && !loading && (
              <div className="result-placeholder">
                <div className="placeholder-icon">🌱</div>
                <p className="placeholder-title">Awaiting Analysis</p>
                <p className="placeholder-sub">Upload a potato leaf image to get started.</p>
                <div className="class-pills">
                  {Object.entries(DISEASE_INFO).map(([name, d]) => (
                    <span key={name} className="class-pill" style={{ borderColor: d.color, color: d.color }}>
                      {d.icon} {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-block">
                <div className="loading-spinner" />
                <p className="loading-title">Analysing Leaf…</p>
                <p className="loading-sub">Running CNN inference on your image</p>
                <div className="loading-steps">
                  <span className="step done">✓ Image preprocessed</span>
                  <span className="step done">✓ Normalised to [0,1]</span>
                  <span className="step active">⟳ Running model inference</span>
                </div>
              </div>
            )}

            {result && info && (
              <div className="result-content">
                {/* Main result card */}
                <div className="result-card" style={{ background: info.gradient }}>
                  <div className="result-icon">{info.icon}</div>
                  <div className="result-body">
                    <span className="result-label">Detected Disease</span>
                    <h3 className="result-class">{result.class}</h3>
                    <div className="result-meta">
                      <span className="severity-tag">
                        Severity: {info.severity}
                      </span>
                      <span className="confidence-tag">
                        {(result.confidence * 100).toFixed(2)}% confidence
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence breakdown */}
                {result.all_predictions && (
                  <div className="conf-section">
                    <h4 className="conf-heading">Class Probabilities</h4>
                    {Object.entries(result.all_predictions).map(([cls, val]) => (
                      <ConfidenceBar
                        key={cls}
                        label={`${DISEASE_INFO[cls]?.icon} ${cls}`}
                        value={val}
                        color={DISEASE_INFO[cls]?.color}
                      />
                    ))}
                  </div>
                )}

                {/* Disease info */}
                <div className="disease-info">
                  <div className="info-section">
                    <h4>📋 Description</h4>
                    <p>{info.description}</p>
                  </div>
                  <div className="info-section">
                    <h4>💊 Treatment</h4>
                    <p>{info.treatment}</p>
                  </div>
                  <div className="info-section">
                    <h4>🛡️ Prevention</h4>
                    <p>{info.prevention}</p>
                  </div>
                </div>

                <button className="btn-reset-full" onClick={reset}>
                  ↩ Analyse Another Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            {[
              { num: "01", icon: "📸", title: "Upload Image", desc: "Drag & drop or select a potato leaf photo. Any format (JPG, PNG, WEBP)." },
              { num: "02", icon: "⚙️", title: "Preprocessing", desc: "Image is resized to 256×256 and pixel values are normalised to [0, 1]." },
              { num: "03", icon: "🧠", title: "CNN Inference", desc: "A deep Convolutional Neural Network analyses spatial features across layers." },
              { num: "04", icon: "📊", title: "Results", desc: "Softmax output returns class probabilities. Top prediction with confidence shown." },
            ].map((s) => (
              <div className="step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                <div className="step-icon-wrap">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── DISEASE CARDS ── */}
        <section className="disease-section">
          <h2 className="section-title">Detectable Conditions</h2>
          <div className="disease-grid">
            {Object.entries(DISEASE_INFO).map(([name, d]) => (
              <div className="disease-card" key={name} style={{ borderTopColor: d.color }}>
                <div className="dc-icon" style={{ color: d.color }}>{d.icon}</div>
                <h3 className="dc-name" style={{ color: d.color }}>{name}</h3>
                <span className="dc-severity" style={{ background: d.color }}>
                  Severity: {d.severity}
                </span>
                <p className="dc-desc">{d.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">🌿</span>
            <div>
              <span className="footer-name">AgriVision AI</span>
              <span className="footer-tagline">Potato Disease Detection · Built with CNN + FastAPI + React</span>
            </div>
          </div>
          <div className="footer-tech">
            <span className="tech-pill">TensorFlow 2.13</span>
            <span className="tech-pill">FastAPI</span>
            <span className="tech-pill">React 17</span>
            <span className="tech-pill">Python 3.10</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
