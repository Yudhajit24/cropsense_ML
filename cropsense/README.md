# CropSense v2 — AI-Powered Crop Intelligence Dashboard 🌾

> **CropSense v2 — Multimodal AI crop advisory platform. Trained a custom 4-block CNN on 4,600+ soil images (8 soil types, ~87% test accuracy). CNN output feeds an agronomic lookup layer, which combines with region climate data to construct a full soil feature vector. That vector is scored by an XGBoost + Random Forest + SVM soft-voting ensemble (99%+ accuracy on Kaggle Crop Recommendation dataset) to produce crop recommendations with SHAP explainability, yield estimates, and a Gemini NLP advisory layer. Built with TensorFlow, scikit-learn, FastAPI, React. <2s end-to-end latency.**

CropSense is a full-stack Machine Learning web application designed to empower Indian smallholder farmers with data-driven agricultural decisions. In v2, the manual soil parameter form is replaced by a **soil photo upload + region selector**: a CNN trained from scratch classifies the image into one of 8 soil types, maps it to NPK/pH ranges via an agronomic lookup table, combines with regional climate data, and passes the full feature vector to the existing ensemble crop recommender.

Built as an educational artifact for **Manipal University Jaipur — CSE3231 ML Lab**.

---

## 🎯 Features (v2)

- **📷 Soil Photo Classification (NEW)**: Upload a soil photo → custom 4-block CNN classifies into 8 soil types (alluvial, black, clay, red, sandy, loamy, laterite, chalky) with confidence score.
- **🗺️ Region-Aware Climate (NEW)**: Select any of 20 Indian states → temperature, humidity, rainfall auto-filled from IMD agronomic data.
- **🧪 Agronomic Lookup Layer (NEW)**: CNN soil type → deterministic NPK/pH midpoint values for explainability.
- **Optimal Crop Recommendation**: Powered by a Soft Voting Ensemble (XGBoost + Random Forest + SVM).
- **Yield Estimation**: Linear Regression projecting yield in kg/ha.
- **Soil Mapping (K-Means)**: 5 distinct soil clustering profiles.
- **Explainable AI (SHAP)**: Feature importance visualization explaining *why* a crop was recommended.
- **NLP Agronomy Expert**: Integrated LLM Assistant for farm advisory.
- **Graceful Mock Mode**: Full UI demo without backend (CNN mock: loamy, 91% confidence).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Axios, Lucide Icons |
| **Backend API** | Python 3.11, FastAPI, Uvicorn |
| **CNN (v2)** | TensorFlow/Keras, Pillow — custom 4-block CNN from scratch |
| **ML Engine** | `scikit-learn`, `xgboost`, `shap`, `pandas`, `numpy`, `joblib` |
| **GenAI** | Hugging Face Inference API (LLaMA 3 8B) |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React + Vite Frontend                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Image Upload  │  │  Analytics   │  │   LLM Chat Assistant   │ │
│  │    + Region   │  │  Dashboard   │  │    (LLaMA 3 8B)        │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────┘ │
└─────────┼──────────────────┼──────────────────────┼─────────────┘
          │ POST /predict-image  GET /stats         │ POST /chat
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Uvicorn)                     │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  CNN Soil     │───▶│  Agronomic   │───▶│  Voting Ensemble │   │
│  │  Classifier   │    │  Lookup      │    │  (RF+XGB+SVM)    │   │
│  │  (TensorFlow) │    │  (NPK + pH)  │    │                  │   │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘   │
│                                                    │             │
│  ┌──────────────┐    ┌──────────────┐    ┌────────▼─────────┐   │
│  │  Region →     │───▶│  7-Feature   │    │  SHAP + K-Means  │   │
│  │  Climate Map  │    │  Vector      │    │  + Yield LR      │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---


## 📊 The ML Pipeline

### Part 1 — Ensemble Crop Recommender (v1)
1. **EDA**: Correlation heatmaps, class distribution.
2. **Preprocessing**: Label Encoding, Standard Scaling, 80/20 stratified split.
3. **Classifiers**: Naive Bayes, Decision Tree, KNN, SVM, Random Forest, XGBoost.
4. **Ensemble**: Soft Voting (RF + XGB + SVM) — 99.3% accuracy.
5. **Regression**: Synthetic yield via Multiple Linear Regression.
6. **Clustering**: K-Means (k=5) soil profiles.
7. **SHAP**: TreeExplainer feature importance.

### Part 2 — CNN Soil Classifier (v2)
1. **Dataset**: [Soil Image Dataset](https://www.kaggle.com/datasets/jayaprakashpondy/soil-image-dataset) (~4,600 images, 8 classes).
2. **Architecture**: 4 conv blocks (32→64→128→256 filters) + GlobalAvgPool + Dense(256) + Dropout(0.4) + Softmax(8). **Trained from scratch — no pretrained weights.** (CSE3231 Session 10)
3. **Training**: Adam(lr=0.001) + ReduceLROnPlateau + EarlyStopping. ImageDataGenerator with augmentation.
4. **~87% test accuracy** on held-out validation set.

---

## 🛠️ Setup Instructions

### 1. Backend Setup
```bash
cd cropsense/backend
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and add your `HUGGINGFACE_API_KEY`.

Train the ensemble models (generates pickles in `models/saved/`):
```bash
python models/train.py
```

*(Optional) Train the CNN — requires Kaggle dataset download first:*
```bash
kaggle datasets download -d jayaprakashpondy/soil-image-dataset
unzip soil-image-dataset.zip -d data/soil_images/
python models/train_cnn.py
```
> Without `soil_cnn.h5`, the backend uses a mock CNN response (loamy, 91% confidence) so the full UI pipeline still works.

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

---

## 🔗 API Reference (v2)

| Endpoint | Method | Body | Description |
|---|---|---|---|
| `/health` | GET | — | Server status |
| `/predict` | POST | `{N,P,K,temp,humidity,ph,rainfall}` | Ensemble crop recommendation (v1) |
| `/predict-image` | POST | Multipart: `file` + `region` | CNN → lookup → ensemble (v2) |
| `/soil-types` | GET | — | 8 soil types with NPK/pH ranges |
| `/regions` | GET | — | 20 supported Indian state names |
| `/stats` | GET | — | Dataset statistics |
| `/model-comparison` | GET | — | Model evaluation metrics |
| `/feature-importance` | GET | — | SHAP values array |
| `/chat` | POST | `{message, history}` | LLM farm advisory |

---

*CropSense v2 — Multimodal AI agronomy at your fingertips.*
