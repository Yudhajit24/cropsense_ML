from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import os
import json

from models.predict import load_models, predict_crop, predict_yield, predict_cluster, chat

app = FastAPI(title="CropSense API")

# Setup CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'crop_data.csv')
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'models', 'saved')

class CropInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    message: str
    history: List[ChatMessage] = []

@app.on_event("startup")
async def startup_event():
    print("Starting up CropSense API...")
    load_models()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/predict")
def predict(data: CropInput):
    crop_res = predict_crop(data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall)
    if isinstance(crop_res, dict) and "error" in crop_res:
        raise HTTPException(status_code=500, detail=crop_res["error"])
        
    yield_res = predict_yield(data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall)
    
    cluster_res = predict_cluster(data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall)
    if isinstance(cluster_res, tuple):
        cluster_res = {"cluster_id": 0, "soil_profile_label": "Unknown"}
        
    return {
        "crop_recommendation": crop_res,
        "estimated_yield_kg_ha": yield_res,
        "soil_cluster": cluster_res
    }

@app.get("/stats")
def get_stats():
    if not os.path.exists(DATA_PATH):
        return {"error": "Dataset not found. Please place crop_data.csv in data/ directory or run train.py to generate mock data."}
        
    df = pd.read_csv(DATA_PATH)
    stats = {}
    
    # Dataset Overview
    stats['total_samples'] = len(df)
    stats['num_features'] = len(df.columns) - 1
    stats['num_crops'] = df['label'].nunique()
    
    # Feature ranges and stats per crop
    crop_means = df.groupby('label').mean().to_dict(orient='index')
    stats['crop_profiles'] = crop_means
    
    return stats

@app.get("/model-comparison")
def get_model_comparison():
    path = os.path.join(SAVED_MODELS_DIR, 'model_comparison.csv')
    if not os.path.exists(path):
        return {"error": "Comparison not found. Train models first."}
    df = pd.read_csv(path)
    return df.to_dict(orient='records')

@app.get("/feature-importance")
def get_feature_importance():
    path = os.path.join(SAVED_MODELS_DIR, 'feature_importance.json')
    if not os.path.exists(path):
        return {"error": "Feature importance not found."}
    with open(path, 'r') as f:
        data = json.load(f)
    return data

@app.post("/chat")
def chat_endpoint(data: ChatInput):
    history = [{"role": msg.role, "content": msg.content} for msg in data.history]
    response = chat(data.message, history)
    return {"response": response}
