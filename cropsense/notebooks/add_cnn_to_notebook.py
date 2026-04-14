"""
add_cnn_to_notebook.py — Appends the Part 2 CNN section to the existing notebook.
Run once from the project root:
    python notebooks/add_cnn_to_notebook.py
"""
import json, os

NB_PATH = os.path.join(os.path.dirname(__file__), 'eda_and_training.ipynb')

CNN_CELLS = [
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
      "---\n",
      "## Part 2: CNN Soil Classification\n",
      "\n",
      "**CropSense v2 — CSE3231 Session 10 Lab Requirement**\n",
      "\n",
      "This section trains a custom 4-block Convolutional Neural Network **from scratch** (no pretrained weights, "
      "no transfer learning) to classify soil images into 8 soil types.\n",
      "\n",
      "The CNN output feeds an agronomic lookup table (NPK/pH midpoints), which combines with region climate "
      "data to form the full 7-feature vector passed to the ensemble recommender above.\n",
      "\n",
      "### Dataset\n",
      "- **Source**: Soil Image Dataset (Kaggle) by jayaprakashpondy\n",
      "- **URL**: https://www.kaggle.com/datasets/jayaprakashpondy/soil-image-dataset\n",
      "- **~4,600 images** | **8 classes**: alluvial, black, clay, red, sandy, loamy, laterite, chalky\n",
      "\n",
      "```bash\n",
      "# Download via Kaggle CLI\n",
      "kaggle datasets download -d jayaprakashpondy/soil-image-dataset\n",
      "unzip soil-image-dataset.zip -d ../backend/data/soil_images/\n",
      "```"
    ]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "# CNN Imports\n",
      "import os, json, random\n",
      "import numpy as np\n",
      "import matplotlib.pyplot as plt\n",
      "import seaborn as sns\n",
      "from PIL import Image\n",
      "\n",
      "import tensorflow as tf\n",
      "from tensorflow.keras.models import Sequential\n",
      "from tensorflow.keras.layers import (\n",
      "    Conv2D, BatchNormalization, Activation, MaxPooling2D,\n",
      "    GlobalAveragePooling2D, Dense, Dropout\n",
      ")\n",
      "from tensorflow.keras.preprocessing.image import ImageDataGenerator\n",
      "from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping\n",
      "from tensorflow.keras.optimizers import Adam\n",
      "from sklearn.metrics import classification_report, confusion_matrix\n",
      "\n",
      "print(f'TensorFlow: {tf.__version__}')\n",
      "print(f'GPU available: {len(tf.config.list_physical_devices(\"GPU\")) > 0}')\n",
      "\n",
      "DATA_DIR = '../backend/data/soil_images/'\n",
      "IMG_SIZE = (224, 224)\n",
      "BATCH_SIZE = 32\n"
    ]
  },
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": ["### 2.1 Explore Dataset — Sample Images per Soil Class"]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "SOIL_CLASSES = ['Alluvial Soil','Black Soil','Clay Soil','Red Soil',\n",
      "                'Sandy Soil','Loamy Soil','Laterite Soil','Chalky Soil']\n",
      "\n",
      "fig, axes = plt.subplots(2, 4, figsize=(16, 8))\n",
      "fig.suptitle('Sample Images per Soil Class', fontsize=16, fontweight='bold')\n",
      "\n",
      "for ax, cls in zip(axes.flatten(), SOIL_CLASSES):\n",
      "    cls_dir = os.path.join(DATA_DIR, cls)\n",
      "    if os.path.isdir(cls_dir):\n",
      "        imgs = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))]\n",
      "        if imgs:\n",
      "            img = Image.open(os.path.join(cls_dir, random.choice(imgs))).resize((224,224))\n",
      "            ax.imshow(img)\n",
      "            ax.set_title(cls.replace(' Soil',''), fontsize=10, fontweight='bold')\n",
      "        else:\n",
      "            ax.text(0.5,0.5,'No images',ha='center',va='center',transform=ax.transAxes)\n",
      "    else:\n",
      "        ax.text(0.5,0.5,'Path not found',ha='center',va='center',transform=ax.transAxes)\n",
      "    ax.axis('off')\n",
      "\n",
      "plt.tight_layout(); plt.show()\n",
      "\n",
      "print('\\nClass Image Counts:')\n",
      "for cls in SOIL_CLASSES:\n",
      "    d = os.path.join(DATA_DIR, cls)\n",
      "    count = len(os.listdir(d)) if os.path.isdir(d) else 0\n",
      "    print(f'  {cls:20s}: {count} images')\n"
    ]
  },
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": [
      "### 2.2 CNN Architecture (from scratch — no pretrained weights)\n",
      "\n",
      "4-block architecture as specified in **CSE3231 Session 10** lab requirements:"
    ]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "def build_cnn(num_classes=8):\n",
      "    \"\"\"\n",
      "    Custom 4-block CNN — built from scratch.\n",
      "    No pretrained weights (no ImageNet, no transfer learning).\n",
      "    Satisfies CSE3231 Session 10 lab requirement.\n",
      "    \"\"\"\n",
      "    model = Sequential([\n",
      "        # Block 1\n",
      "        Conv2D(32, (3,3), padding='same', input_shape=(224,224,3)),\n",
      "        BatchNormalization(), Activation('relu'), MaxPooling2D(2,2),\n",
      "        # Block 2\n",
      "        Conv2D(64, (3,3), padding='same'),\n",
      "        BatchNormalization(), Activation('relu'), MaxPooling2D(2,2),\n",
      "        # Block 3\n",
      "        Conv2D(128, (3,3), padding='same'),\n",
      "        BatchNormalization(), Activation('relu'), MaxPooling2D(2,2),\n",
      "        # Block 4\n",
      "        Conv2D(256, (3,3), padding='same'),\n",
      "        BatchNormalization(), Activation('relu'), GlobalAveragePooling2D(),\n",
      "        # Head\n",
      "        Dense(256, activation='relu'), Dropout(0.4),\n",
      "        Dense(num_classes, activation='softmax'),\n",
      "    ], name='soil_cnn_v2')\n",
      "    return model\n",
      "\n",
      "model = build_cnn()\n",
      "model.compile(optimizer=Adam(learning_rate=0.001),\n",
      "              loss='categorical_crossentropy', metrics=['accuracy'])\n",
      "model.summary()\n"
    ]
  },
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": ["### 2.3 Data Generators (80 / 10 / 10 split)"]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "train_datagen = ImageDataGenerator(\n",
      "    rescale=1./255, rotation_range=20, width_shift_range=0.2,\n",
      "    height_shift_range=0.2, horizontal_flip=True, zoom_range=0.2,\n",
      "    brightness_range=[0.8,1.2], validation_split=0.2\n",
      ")\n",
      "val_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.5)\n",
      "\n",
      "train_gen = train_datagen.flow_from_directory(\n",
      "    DATA_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,\n",
      "    class_mode='categorical', subset='training', shuffle=True, seed=42\n",
      ")\n",
      "val_gen = val_datagen.flow_from_directory(\n",
      "    DATA_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,\n",
      "    class_mode='categorical', subset='validation', shuffle=False, seed=42\n",
      ")\n",
      "print(f'Train: {train_gen.samples} | Val: {val_gen.samples}')\n",
      "print(f'Classes: {list(train_gen.class_indices.keys())}')\n"
    ]
  },
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": ["### 2.4 Train CNN"]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "callbacks = [\n",
      "    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1, min_lr=1e-6),\n",
      "    EarlyStopping(monitor='val_accuracy', patience=8, restore_best_weights=True, verbose=1),\n",
      "]\n",
      "\n",
      "history = model.fit(\n",
      "    train_gen, validation_data=val_gen, epochs=50, callbacks=callbacks, verbose=1\n",
      ")\n",
      "\n",
      "val_gen.reset()\n",
      "loss, acc = model.evaluate(val_gen, verbose=0)\n",
      "print(f'\\n=== Final Test Accuracy: {acc*100:.2f}% | Loss: {loss:.4f} ===')\n"
    ]
  },
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": ["### 2.5 Training Curves"]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))\n",
      "fig.suptitle('CNN Soil Classifier — Training History', fontsize=14, fontweight='bold')\n",
      "\n",
      "ax1.plot(history.history['accuracy'], label='Train', linewidth=2)\n",
      "ax1.plot(history.history['val_accuracy'], label='Val', linewidth=2, linestyle='--')\n",
      "ax1.set_title('Accuracy Curves'); ax1.set_xlabel('Epoch'); ax1.set_ylabel('Accuracy')\n",
      "ax1.legend(); ax1.grid(True, alpha=0.3); ax1.set_ylim([0,1])\n",
      "\n",
      "ax2.plot(history.history['loss'], label='Train', linewidth=2, color='coral')\n",
      "ax2.plot(history.history['val_loss'], label='Val', linewidth=2, linestyle='--', color='darkred')\n",
      "ax2.set_title('Loss Curves'); ax2.set_xlabel('Epoch'); ax2.set_ylabel('Loss')\n",
      "ax2.legend(); ax2.grid(True, alpha=0.3)\n",
      "\n",
      "plt.tight_layout(); plt.show()\n"
    ]
  },
  {
    "cell_type": "markdown",
    "metadata": {},
    "source": ["### 2.6 Confusion Matrix Heatmap"]
  },
  {
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [
      "val_gen.reset()\n",
      "y_pred = np.argmax(model.predict(val_gen, verbose=0), axis=1)\n",
      "y_true = val_gen.classes\n",
      "idx_to_class = {v: k for k, v in train_gen.class_indices.items()}\n",
      "class_names = [idx_to_class[i] for i in sorted(idx_to_class)]\n",
      "\n",
      "print('Classification Report:')\n",
      "print(classification_report(y_true, y_pred, target_names=class_names))\n",
      "\n",
      "cm = confusion_matrix(y_true, y_pred)\n",
      "cm_norm = cm.astype('float') / (cm.sum(axis=1, keepdims=True) + 1e-8)\n",
      "\n",
      "plt.figure(figsize=(10, 8))\n",
      "sns.heatmap(cm_norm, annot=True, fmt='.2f', cmap='Greens',\n",
      "            xticklabels=class_names, yticklabels=class_names, linewidths=0.5)\n",
      "plt.title('CNN Confusion Matrix — 8 Soil Classes (Normalised)', fontsize=13, fontweight='bold')\n",
      "plt.xlabel('Predicted'); plt.ylabel('True')\n",
      "plt.xticks(rotation=45, ha='right'); plt.tight_layout(); plt.show()\n",
      "\n",
      "# Save model + class indices\n",
      "model.save('../backend/models/saved/soil_cnn.h5')\n",
      "with open('../backend/models/saved/class_indices.json', 'w') as f:\n",
      "    json.dump(train_gen.class_indices, f, indent=2)\n",
      "print('Model saved → backend/models/saved/soil_cnn.h5')\n"
    ]
  }
]

def main():
    with open(NB_PATH, 'r') as f:
        nb = json.load(f)

    # Avoid double-appending
    existing_sources = [
        ''.join(c.get('source', []))
        for c in nb['cells']
    ]
    if any('Part 2: CNN Soil Classification' in s for s in existing_sources):
        print("CNN section already present in notebook — skipping.")
        return

    nb['cells'].extend(CNN_CELLS)

    with open(NB_PATH, 'w') as f:
        json.dump(nb, f, indent=1)

    print(f"✅ Added {len(CNN_CELLS)} CNN cells to {NB_PATH}")

if __name__ == '__main__':
    main()
