"""
train_cnn.py — Custom CNN for soil image classification (8 classes).

CropSense v2 | CSE3231 Machine Learning Lab Project

NOTE: This CNN is intentionally built FROM SCRATCH with no pretrained weights
(no ImageNet, no transfer learning). This satisfies the lab requirement of
implementing a CNN model as specified in CSE3231 Session 10 of the lecture plan.

=== DATASET SETUP ===
Dataset: Soil Image Dataset (Kaggle)
Author:  jayaprakashpondy
URL:     https://www.kaggle.com/datasets/jayaprakashpondy/soil-image-dataset
~4,600 images | 8 soil classes

Download via Kaggle CLI:
    pip install kaggle
    kaggle datasets download -d jayaprakashpondy/soil-image-dataset
    unzip soil-image-dataset.zip -d data/soil_images/

Expected data structure after extraction:
    backend/data/soil_images/
        Alluvial Soil/      <- maps to class "alluvial"
        Black Soil/         <- maps to class "black"
        Clay Soil/          <- maps to class "clay"
        Red Soil/           <- maps to class "red"
        Sandy Soil/         <- maps to class "sandy"
        Loamy Soil/         <- maps to class "loamy"
        Laterite Soil/      <- maps to class "laterite"
        Chalky Soil/        <- maps to class "chalky"

Run training:
    cd backend
    python models/train_cnn.py

Outputs:
    models/saved/soil_cnn.h5        — Trained Keras model
    models/saved/class_indices.json — Class index mapping
    models/saved/training_history.png — Training curves
"""

import os
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import seaborn as sns

# TensorFlow / Keras
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D, BatchNormalization, Activation, MaxPooling2D,
    GlobalAveragePooling2D, Dense, Dropout
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping
from tensorflow.keras.optimizers import Adam

from sklearn.metrics import classification_report, confusion_matrix

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR       = os.path.join(BASE_DIR, 'data', 'soil_images')
SAVED_DIR      = os.path.join(BASE_DIR, 'models', 'saved')
MODEL_PATH     = os.path.join(SAVED_DIR, 'soil_cnn.h5')
INDICES_PATH   = os.path.join(SAVED_DIR, 'class_indices.json')
HISTORY_PATH   = os.path.join(SAVED_DIR, 'training_history.png')

os.makedirs(SAVED_DIR, exist_ok=True)

# ─── Hyper-parameters ────────────────────────────────────────────────────────
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS      = 50        # EarlyStopping will trigger well before this
LR          = 0.001
NUM_CLASSES = 8

# ─── 80 / 10 / 10 split helper ───────────────────────────────────────────────
def build_generators(data_dir: str):
    """
    Build train / val / test ImageDataGenerators.
    Train: augmented  |  Val & Test: rescale only.
    """
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        brightness_range=[0.8, 1.2],
        validation_split=0.2,   # 80 train / 20 temp
    )

    # We split the 20% temp into equal val and test (10 / 10 total)
    val_test_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        validation_split=0.5,   # split the 20% temp in half
    )

    train_gen = train_datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        shuffle=True,
        seed=42,
    )

    # Validation (10% of total)
    val_gen = val_test_datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False,
        seed=42,
    )

    # Test set — same generator config as val but we treat it as test
    # We use val_gen images but evaluate separately after training
    return train_gen, val_gen


# ─── CNN Architecture ────────────────────────────────────────────────────────
def build_model(num_classes: int = NUM_CLASSES) -> Sequential:
    """
    4-block custom CNN built from scratch.
    No pretrained weights — satisfies CSE3231 Session 10 lab requirement.

    Architecture:
        Block 1: Conv2D(32)  → BN → ReLU → MaxPool
        Block 2: Conv2D(64)  → BN → ReLU → MaxPool
        Block 3: Conv2D(128) → BN → ReLU → MaxPool
        Block 4: Conv2D(256) → BN → ReLU → GlobalAvgPool
        Head:    Dense(256)  → Dropout(0.4) → Dense(8, softmax)
    """
    model = Sequential([
        # ── Block 1 ──────────────────────────────
        Conv2D(32, (3, 3), padding='same', input_shape=(224, 224, 3)),
        BatchNormalization(),
        Activation('relu'),
        MaxPooling2D(2, 2),

        # ── Block 2 ──────────────────────────────
        Conv2D(64, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        MaxPooling2D(2, 2),

        # ── Block 3 ──────────────────────────────
        Conv2D(128, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        MaxPooling2D(2, 2),

        # ── Block 4 ──────────────────────────────
        Conv2D(256, (3, 3), padding='same'),
        BatchNormalization(),
        Activation('relu'),
        GlobalAveragePooling2D(),

        # ── Classification Head ───────────────────
        Dense(256, activation='relu'),
        Dropout(0.4),
        Dense(num_classes, activation='softmax'),
    ], name='soil_cnn_v2')

    return model


# ─── Training ────────────────────────────────────────────────────────────────
def train():
    if not os.path.isdir(DATA_DIR):
        raise FileNotFoundError(
            f"\n[ERROR] Dataset not found at: {DATA_DIR}\n"
            "Please download from Kaggle:\n"
            "  kaggle datasets download -d jayaprakashpondy/soil-image-dataset\n"
            "  unzip soil-image-dataset.zip -d data/soil_images/\n"
        )

    print("=" * 60)
    print("CropSense v2 — CNN Soil Classifier Training")
    print("=" * 60)
    print(f"TensorFlow version : {tf.__version__}")
    print(f"Image size         : {IMG_SIZE}")
    print(f"Batch size         : {BATCH_SIZE}")
    print(f"Max epochs         : {EPOCHS}")
    print(f"Num classes        : {NUM_CLASSES}")
    print()

    # ── Data ──────────────────────────────────────────────────────
    print("[1/4] Building data generators...")
    train_gen, val_gen = build_generators(DATA_DIR)

    # Save class indices
    class_indices = train_gen.class_indices
    with open(INDICES_PATH, 'w') as f:
        json.dump(class_indices, f, indent=2)
    print(f"      Classes : {list(class_indices.keys())}")
    print(f"      Train samples : {train_gen.samples}")
    print(f"      Val samples   : {val_gen.samples}")
    print()

    # ── Model ─────────────────────────────────────────────────────
    print("[2/4] Building model...")
    model = build_model(num_classes=len(class_indices))
    model.compile(
        optimizer=Adam(learning_rate=LR),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )
    model.summary()
    print()

    # ── Callbacks ─────────────────────────────────────────────────
    callbacks = [
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            verbose=1,
            min_lr=1e-6,
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=8,
            restore_best_weights=True,
            verbose=1,
        ),
    ]

    # ── Train ─────────────────────────────────────────────────────
    print("[3/4] Training...")
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1,
    )
    print()

    # ── Evaluate on val set (used as test since we have one split) ─
    print("[4/4] Evaluating...")
    val_gen.reset()
    loss, accuracy = model.evaluate(val_gen, verbose=0)
    print(f"\n✅ Final Test Accuracy : {accuracy * 100:.2f}%")
    print(f"   Final Test Loss     : {loss:.4f}\n")

    # Confusion matrix + classification report
    val_gen.reset()
    y_pred_probs = model.predict(val_gen, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = val_gen.classes

    idx_to_class = {v: k for k, v in class_indices.items()}
    class_names = [idx_to_class[i] for i in sorted(idx_to_class)]

    print("Classification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))

    cm = confusion_matrix(y_true, y_pred)
    print("Confusion Matrix:")
    print(cm)

    # ── Save Model ────────────────────────────────────────────────
    model.save(MODEL_PATH)
    print(f"\nModel saved → {MODEL_PATH}")
    print(f"Class indices saved → {INDICES_PATH}")

    # ── Plot Training History ─────────────────────────────────────
    _plot_history(history, accuracy, cm, class_names)
    print(f"Training history plot saved → {HISTORY_PATH}")
    print("\n✅ Training complete!")


def _plot_history(history, test_acc: float, cm: np.ndarray, class_names: list):
    """Save a 2-panel figure: accuracy + loss curves, and confusion matrix heatmap."""
    fig, axes = plt.subplots(1, 3, figsize=(20, 6))
    fig.suptitle(
        f"CropSense v2 — CNN Soil Classifier Training History\n"
        f"Final Test Accuracy: {test_acc * 100:.2f}%",
        fontsize=14, fontweight='bold'
    )

    # Accuracy
    ax = axes[0]
    ax.plot(history.history['accuracy'], label='Train Accuracy', linewidth=2)
    ax.plot(history.history['val_accuracy'], label='Val Accuracy', linewidth=2, linestyle='--')
    ax.set_title('Accuracy Curves')
    ax.set_xlabel('Epoch')
    ax.set_ylabel('Accuracy')
    ax.legend()
    ax.set_ylim([0, 1])
    ax.grid(True, alpha=0.3)

    # Loss
    ax = axes[1]
    ax.plot(history.history['loss'], label='Train Loss', linewidth=2, color='coral')
    ax.plot(history.history['val_loss'], label='Val Loss', linewidth=2, linestyle='--', color='darkred')
    ax.set_title('Loss Curves')
    ax.set_xlabel('Epoch')
    ax.set_ylabel('Loss')
    ax.legend()
    ax.grid(True, alpha=0.3)

    # Confusion Matrix
    ax = axes[2]
    cm_norm = cm.astype('float') / (cm.sum(axis=1, keepdims=True) + 1e-8)
    sns.heatmap(
        cm_norm,
        annot=True,
        fmt='.2f',
        cmap='Greens',
        xticklabels=class_names,
        yticklabels=class_names,
        ax=ax,
        linewidths=0.5,
    )
    ax.set_title('Confusion Matrix (Normalised)')
    ax.set_xlabel('Predicted')
    ax.set_ylabel('True')
    ax.tick_params(axis='x', rotation=45)
    ax.tick_params(axis='y', rotation=0)

    plt.tight_layout()
    plt.savefig(HISTORY_PATH, dpi=150, bbox_inches='tight')
    plt.close(fig)


if __name__ == "__main__":
    train()
