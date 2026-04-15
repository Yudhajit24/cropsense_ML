# CropSense — AI-Powered Crop Intelligence Dashboard 🌾

[![Backend CI](https://github.com/Yudhajit24/cropsense_ML/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Yudhajit24/cropsense_ML/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Yudhajit24/cropsense_ML/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Yudhajit24/cropsense_ML/actions/workflows/frontend-ci.yml)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.13+-FF6F00?logo=tensorflow&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

CropSense is a full-stack Machine Learning web application designed to empower Indian smallholder farmers with data-driven agricultural decisions. The system analyzes soil parameters (N, P, K, pH) and climate sensors (Temperature, Humidity, Rainfall) to provide highly accurate crop recommendations, estimated yields, and soil profile clustering.

In **v2**, the manual soil parameter form is replaced by a **soil photo upload + region selector**: a CNN trained from scratch classifies the image into one of 8 soil types, maps it to NPK/pH ranges via an agronomic lookup table, combines with regional climate data, and passes the full feature vector to the existing ensemble crop recommender.

Built as an educational artifact for **Manipal University Jaipur — CSE3231 ML Lab**.

---

## 🎯 Features

- **📷 Soil Photo Classification**: CNN classifies soil images into 8 types (~87% accuracy)
- **🗺️ Region-Aware Climate**: 20 Indian states with auto-filled IMD climate data
- **🧪 Agronomic Lookup**: Soil type → deterministic NPK/pH feature vector
- **🌾 Crop Recommendation**: Soft Voting Ensemble (XGBoost + RF + SVM) — 99.3% accuracy
- **📈 Yield Estimation**: Linear Regression projecting yield in kg/ha
- **🔬 Explainable AI**: SHAP feature importance visualization
- **🤖 NLP Agronomy Expert**: LLaMA 3 8B via Hugging Face Inference API
- **🎨 Graceful Mock Mode**: Full UI demo without backend

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Axios, Lucide Icons |
| **Backend API** | Python 3.11, FastAPI, Uvicorn |
| **CNN (v2)** | TensorFlow/Keras, Pillow — custom 4-block CNN from scratch |
| **ML Engine** | `scikit-learn`, `xgboost`, `shap`, `pandas`, `numpy`, `joblib` |
| **GenAI** | Hugging Face Inference API (LLaMA 3 8B) |
| **CI/CD** | GitHub Actions (Python + Node.js matrix) |
| **Containerization** | Docker, Docker Compose |

---

## 📊 The ML Pipeline

### Part 1 — Ensemble Crop Recommender (v1)
1. **EDA**: Correlation heatmaps, class distribution
2. **Preprocessing**: Label Encoding, Standard Scaling, 80/20 stratified split
3. **Classifiers**: Naive Bayes, Decision Tree, KNN, SVM, Random Forest, XGBoost
4. **Ensemble**: Soft Voting (RF + XGB + SVM) — **99.3% accuracy**
5. **Regression**: Synthetic yield via Multiple Linear Regression
6. **Clustering**: K-Means (k=5) soil profiles
7. **SHAP**: TreeExplainer feature importance

### Part 2 — CNN Soil Classifier (v2)
1. **Dataset**: [Soil Image Dataset](https://www.kaggle.com/datasets/jayaprakashpondy/soil-image-dataset) (~4,600 images, 8 classes)
2. **Architecture**: 4 conv blocks (32→64→128→256) + GlobalAvgPool + Dense(256) + Dropout(0.4) + Softmax(8)
3. **Training**: Adam + ReduceLROnPlateau + EarlyStopping. Trained from scratch (no pretrained weights)
4. **Result**: **~87% test accuracy** on held-out validation set

---

## 🛠️ Setup Instructions

### 1. Backend Setup
```bash
cd cropsense/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and add your `HUGGINGFACE_API_KEY` ([get one here](https://huggingface.co/settings/tokens)).

Train the ML models:
```bash
python models/train.py
```

Start the API:
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd cropsense/frontend
npm install
npm run dev
```

### 3. Quick Start (both servers)
```bash
cd cropsense
./run_all.sh
```

---

## 🔗 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Server status + uptime diagnostics |
| `/metrics` | GET | Model metadata and loaded model info |
| `/predict` | POST | Ensemble crop recommendation (v1) |
| `/predict-image` | POST | CNN → lookup → ensemble (v2) |
| `/soil-types` | GET | 8 soil types with NPK/pH ranges |
| `/regions` | GET | 20 supported Indian state names |
| `/stats` | GET | Dataset statistics |
| `/model-comparison` | GET | Model evaluation metrics |
| `/feature-importance` | GET | SHAP values array |
| `/chat` | POST | LLM farm advisory |

---

## 🐳 Docker

```bash
# Build and run both services
docker compose up --build

# Backend only
cd cropsense/backend
docker build -t cropsense-backend .
docker run -p 8000:8000 --env-file .env cropsense-backend
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*CropSense v2 — Multimodal AI agronomy at your fingertips.*
