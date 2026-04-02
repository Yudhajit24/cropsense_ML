# CropSense — AI-Powered Crop Intelligence Dashboard 🌾

CropSense is a full-stack Machine Learning web application designed to empower Indian smallholder farmers with data-driven agricultural decisions. The system analyzes soil parameters (N, P, K, pH) and climate sensors (Temperature, Humidity, Rainfall) to provide highly accurate crop recommendations, estimated yields, and soil profile clustering.

Built as an educational artifact for **Manipal University Jaipur — CSE3231 ML Lab**.

![App Screenshot Placeholder](https://via.placeholder.com/1200x600.png?text=CropSense+Dashboard)

---

## 🎯 Features

- **Optimal Crop Recommendation**: Powered by an advanced Soft Voting Ensemble (XGBoost, Random Forest, SVM).
- **Yield Estimation**: Linear Regression synthesis projecting yield in kg/ha based on nutrient density and rainfall.
- **Soil Mapping (K-Means)**: Segments input into 5 distinct soil clustering profiles.
- **Explainable AI (XAI)**: SHAP-powered feature importance visualization explaining exactly *why* a crop was recommended.
- **NLP Agronomy Expert**: An integrated LLM Assistant (Gemini 1.5 Flash) trained to advise on Indian farming conditions.
- **Graceful Mock Mode**: UI functions seamlessly with rich static data even when the backend API is unreachable.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Axios, Lucide Icons |
| **Backend API** | Python 3.11, FastAPI, Uvicorn |
| **ML Engine** | `scikit-learn`, `xgboost`, `shap`, `pandas`, `numpy`, `joblib` |
| **GenAI** | `google-generativeai` (Gemini 1.5 Flash) |

---

## 📊 The ML Pipeline Details

The `models/train.py` script encompasses the entire laboratory curriculum:
1. **EDA**: Missing value checks, correlation heatmaps.
2. **Preprocessing**: Label Encoding, Standard Scaling, 80/20 Stratified Split.
3. **Classifiers Trained**: 
   - Naive Bayes
   - Decision Tree (max_depth=10)
   - KNN (k=5)
   - SVM (RBF)
   - Random Forest (200 estimators)
   - XGBoost
   - *Final Predictor*: Soft Voting Classifier (RF + XGB + SVM)
4. **Regression**: Synthetic yield training via Multiple Linear Regression.
5. **Clustering**: K-Means (k=5) to label soil profiles.
6. **Interpretability**: SHAP (TreeExplainer) on the ensemble feature distributions.

> **Note on Lab Submission**: The `notebooks/eda_and_training.ipynb` contains the exact mirrored sequential execution of the ML pipeline for Jupyter environments.

---

## 🛠️ Setup Instructions

### 1. Dataset Preparation
This project requires the **Crop Recommendation Dataset**.
1. Download it from Kaggle: [Crop Recommendation Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)
2. Save the extracted `Crop_recommendation.csv` into the `backend/data/` folder and rename it to `crop_data.csv`.
*(Note: If the file is missing, the training script has a fallback to generate mock data to prevent crashes).*

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```
Install dependencies:
```bash
pip install -r requirements.txt
```
Set up your Environment Variables:
1. Copy `.env.example` to `.env`.
2. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Add the key to your `.env` file under `GEMINI_API_KEY`.

Train the ML Models (generates pickles inside `models/saved/`):
```bash
python models/train.py
```

Run the FastAPI Server:
```bash
uvicorn main:app --reload
```
The API will run at `http://localhost:8000`. API Docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```
Install Node modules:
```bash
npm install
```
Start the Vite Development Server:
```bash
npm run dev
```
The App will launch at `http://localhost:5173`.

---

## 🔗 API Documentation

| Endpoint | Method | Body | Description |
|---|---|---|---|
| `/health` | GET | `None` | Verifies server operational status. |
| `/predict`| POST| `{N, P, K, temp, humidity, ph, rainfall}` | Returns `{crop, yield, cluster}`. |
| `/stats` | GET | `None` | Gets dataset statistics for Analytics Panel. |
| `/model-comparison`| GET | `None` | Returns evaluation metrics for all trained models. |
| `/feature-importance`| GET | `None` | SHAP impact array for UI chart. |
| `/chat` | POST| `{message, history}` | Interfaces with Gemini Model. |

---

*CropSense — High-precision agronomy at your fingertips.*
