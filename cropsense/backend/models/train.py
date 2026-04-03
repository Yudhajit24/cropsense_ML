import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import shap
import joblib

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'crop_data.csv')
SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'models', 'saved')

os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

def generate_mock_data():
    """Fallback if data is missing, so code doesn't crash."""
    print("WARNING: crop_data.csv not found. Generating mock data for demonstration.")
    np.random.seed(42)
    crops = ['rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas', 'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate', 'banana', 'mango', 'grapes', 'watermelon', 'muskmelon', 'apple', 'orange', 'papaya', 'coconut', 'cotton', 'jute', 'coffee']
    data = []
    for crop in crops:
        for _ in range(100):
            data.append([
                np.random.uniform(0, 140), # N
                np.random.uniform(5, 145), # P
                np.random.uniform(5, 205), # K
                np.random.uniform(8, 44),  # temp
                np.random.uniform(14, 100),# humidity
                np.random.uniform(3.5, 10),# pH
                np.random.uniform(20, 300),# rainfall
                crop
            ])
    df = pd.DataFrame(data, columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label'])
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    df.to_csv(DATA_PATH, index=False)

def main():
    if not os.path.exists(DATA_PATH):
        generate_mock_data()

    print("--- Loading Data ---")
    df = pd.read_csv(DATA_PATH)
    
    # 1. EDA
    print("\n--- Exploratory Data Analysis ---")
    print(f"Shape: {df.shape}")
    print(f"\nData Types:\n{df.dtypes}")
    print(f"\nDescribe:\n{df.describe()}")
    print(f"\nNull Values:\n{df.isnull().sum()}")

    # Correlation Matrix Heatmap
    plt.figure(figsize=(10, 8))
    # Select only numeric columns for correlation matrix
    numeric_df = df.select_dtypes(include=[np.number])
    corr_matrix = numeric_df.corr()
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt='.2f')
    plt.title('Feature Correlation Matrix')
    heatmap_path = os.path.join(SAVED_MODELS_DIR, 'correlation_heatmap.png')
    plt.savefig(heatmap_path)
    plt.close()
    print(f"Saved correlation heatmap: {heatmap_path}")

    # 2. Preprocessing
    print("\n--- Preprocessing ---")
    X = df.drop('label', axis=1)
    y = df['label']

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    joblib.dump(label_encoder, os.path.join(SAVED_MODELS_DIR, 'label_encoder.pkl'))

    # Train test split (80/20, stratified)
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    joblib.dump(scaler, os.path.join(SAVED_MODELS_DIR, 'scaler.pkl'))

    # 3. Training Models
    print("\n--- Training Classifiers ---")
    models = {
        'Naive Bayes': GaussianNB(),
        'Decision Tree': DecisionTreeClassifier(max_depth=10, random_state=42), # Prevent overfitting
        'KNN': KNeighborsClassifier(n_neighbors=5), # Standard k value
        'SVM': SVC(kernel='rbf', probability=True, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=200, random_state=42),
        'XGBoost': XGBClassifier(n_estimators=200, learning_rate=0.1, use_label_encoder=False, eval_metric='mlogloss', random_state=42)
    }

    # Soft Voting Ensemble (RF + XGBoost + SVM)
    voting_clf = VotingClassifier(
        estimators=[
            ('rf', RandomForestClassifier(n_estimators=200, random_state=42)),
            ('xgb', XGBClassifier(n_estimators=200, learning_rate=0.1, use_label_encoder=False, eval_metric='mlogloss', random_state=42)),
            ('svm', SVC(kernel='rbf', probability=True, random_state=42))
        ],
        voting='soft'
    )
    models['Voting Ensemble'] = voting_clf

    results = []
    
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
        rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
        
        results.append({
            'Model': name,
            'Accuracy': acc,
            'Precision': prec,
            'Recall': rec,
            'F1': f1
        })
        
        # Save model
        filename = f"{name.replace(' ', '_').lower()}.pkl"
        joblib.dump(model, os.path.join(SAVED_MODELS_DIR, filename))

    # Save model comparison
    results_df = pd.DataFrame(results)
    results_df.to_csv(os.path.join(SAVED_MODELS_DIR, 'model_comparison.csv'), index=False)
    print("\nModel Comparison:\n", results_df)

    # 4. Synthesizing Yield and Linear Regression
    print("\n--- Training Linear Regression for Yield ---")
    # Synthetic yield column based on inputs
    df['synthetic_yield'] = (df['N'] * 0.4) + (df['K'] * 0.3) + (df['rainfall'] * 0.002) + np.random.normal(0, 10, size=len(df))
    df['synthetic_yield'] = df['synthetic_yield'].apply(lambda x: max(x, 10)) # minimum yield guard
    
    X_yield = df.drop(['label', 'synthetic_yield'], axis=1)
    y_yield = df['synthetic_yield']
    
    X_yield_train, X_yield_test, y_yield_train, y_yield_test = train_test_split(X_yield, y_yield, test_size=0.2, random_state=42)
    yield_scaler = StandardScaler()
    X_yts = yield_scaler.fit_transform(X_yield_train)
    yield_model = LinearRegression()
    yield_model.fit(X_yts, y_yield_train)
    
    joblib.dump(yield_scaler, os.path.join(SAVED_MODELS_DIR, 'yield_scaler.pkl'))
    joblib.dump(yield_model, os.path.join(SAVED_MODELS_DIR, 'yield_model.pkl'))
    print("Linear Regression target: Estimated Crop Yield (kg/ha)")

    # 5. K-Means Clustering for Soil Profiles
    print("\n--- Training K-Means Clustering ---")
    # k=5 based on lab specification
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    # Fit on all numeric features
    X_cluster_scaled = scaler.transform(X)
    kmeans.fit(X_cluster_scaled)
    joblib.dump(kmeans, os.path.join(SAVED_MODELS_DIR, 'kmeans_model.pkl'))
    
    # 6. SHAP feature importance mapping
    print("\n--- Computing SHAP Values ---")
    # Using RandomForest for SHAP as it's cleaner than VotingClassifier
    rf_model = models['Random Forest']
    explainer = shap.TreeExplainer(rf_model)
    # Just take background sample to make it fast
    sample_size = min(100, X_train_scaled.shape[0])
    shap_values = explainer.shap_values(X_train_scaled[:sample_size])
    
    # Calculate mean absolute SHAP value for each feature
    # SHAP for multiclass is shape (n_classes, n_samples, n_features) or (n_samples, n_features, n_classes) depending on version
    if isinstance(shap_values, list):
        # average over classes and samples
        mean_shap = np.mean(np.mean(np.array([np.abs(sv) for sv in shap_values]), axis=1), axis=0)
    else:
        # shap_values is probably shape (n_samples, n_features) or (n_samples, n_features, n_classes)
        if len(shap_values.shape) == 3:
            mean_shap = np.mean(np.abs(shap_values), axis=(0, 2))
        else:
            mean_shap = np.mean(np.abs(shap_values), axis=0)
            
    importance_df = pd.DataFrame({
        'feature': X.columns,
        'importance': mean_shap.tolist()
    }).sort_values('importance', ascending=False)
    
    importance_df.to_json(os.path.join(SAVED_MODELS_DIR, 'feature_importance.json'), orient='records')
    print("Saved feature importances.")
    
    print("\n✅ Training Complete. All models saved successfully.")

if __name__ == "__main__":
    main()
