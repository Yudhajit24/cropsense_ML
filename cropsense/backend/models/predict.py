import os
import joblib
import json
import numpy as np
import pandas as pd
from groq import Groq
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'models', 'saved')

# Global variables to hold loaded models
models = {}

CLUSTER_LABELS = {
    0: "Dry Alkaline Plains",
    1: "Tropical High-Humidity",
    2: "Temperate Acidic Soil",
    3: "Nutrient-Rich Alluvial",
    4: "Arid Low-Nutrient"
}

def load_models():
    """Load all saved models into memory at startup."""
    global models
    required_files = [
        'scaler.pkl', 'label_encoder.pkl', 'yield_scaler.pkl', 
        'yield_model.pkl', 'kmeans_model.pkl', 'voting_ensemble.pkl'
    ]
    
    for req in required_files:
        path = os.path.join(SAVED_MODELS_DIR, req)
        if not os.path.exists(path):
            print(f"WARNING: Model file {req} not found. Run train.py first.")
            return False
            
    try:
        models['scaler'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'scaler.pkl'))
        models['label_encoder'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'label_encoder.pkl'))
        models['yield_scaler'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'yield_scaler.pkl'))
        models['yield_model'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'yield_model.pkl'))
        models['kmeans'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'kmeans_model.pkl'))
        models['classifier'] = joblib.load(os.path.join(SAVED_MODELS_DIR, 'voting_ensemble.pkl'))
        
        # Load SHAP importances
        with open(os.path.join(SAVED_MODELS_DIR, 'feature_importance.json'), 'r') as f:
            models['feature_importance'] = json.load(f)
            
        print("✅ Models loaded successfully.")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

def predict_crop(N, P, K, temp, humidity, ph, rainfall):
    """Predict crop and return top 3 with probabilities."""
    if 'classifier' not in models:
        return {"error": "Models not loaded. Call load_models() first."}
        
    features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    features_scaled = models['scaler'].transform(features)
    
    probas = models['classifier'].predict_proba(features_scaled)[0]
    top3_idx = np.argsort(probas)[-3:][::-1]
    
    top3_crops = [
        {
            "crop": models['label_encoder'].inverse_transform([idx])[0].capitalize(),
            "probability": float(f"{float(probas[idx] * 100):.1f}")
        }
        for idx in top3_idx
    ]
    
    # Send simple SHAP-like dummy values customized for this input specifically,
    # or just return the static global SHAP values since explaining single ensemble pred is slow
    
    return {
        "crop": top3_crops[0]["crop"],
        "confidence": top3_crops[0]["probability"],
        "top3": top3_crops,
        "shap_values": models.get('feature_importance', [])
    }

def predict_yield(N, P, K, temp, humidity, ph, rainfall):
    """Predict estimated yield using Linear Regression"""
    if 'yield_model' not in models:
        return 0.0
    features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    features_scaled = models['yield_scaler'].transform(features)
    predicted_yield = models['yield_model'].predict(features_scaled)[0]
    return float(f"{float(predicted_yield):.2f}")

def predict_cluster(N, P, K, temp, humidity, ph, rainfall):
    """Predict soil profile cluster and logical label"""
    if 'kmeans' not in models:
        return 0, "Unknown"
    features = np.array([[N, P, K, temp, humidity, ph, rainfall]])
    features_scaled = models['scaler'].transform(features)
    cluster_id = int(models['kmeans'].predict(features_scaled)[0])
    
    return {
        "cluster_id": cluster_id,
        "soil_profile_label": CLUSTER_LABELS.get(cluster_id, "Unknown Profile")
    }

def chat(user_message, conversation_history):
    """Farm expert chatbot using Groq (Mixtral 8x7B)"""
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        return "System notice: Groq API key is not configured. Please add it to the .env file."
        
    try:
        client = Groq(api_key=api_key)
        
        system_prompt = "You are an expert Indian agricultural scientist with 20 years of experience advising smallholder farmers. You give practical, actionable advice in simple language. When users provide soil parameters, give crop-specific guidance."
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            messages.append({"role": role, "content": content})
            
        messages.append({"role": "user", "content": user_message})
        
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq error: {e}")
        return "I'm having trouble connecting to my knowledge base right now. Please try again later."
