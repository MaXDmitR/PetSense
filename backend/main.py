import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
import tensorflow as tf
import numpy as np
from PIL import Image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import io
import os

app = FastAPI()


MODEL_PATH = "my_breed_model.keras"
LABELS_PATH = "labels.txt"
IMG_SIZE = 160


class_names = []
if os.path.exists(LABELS_PATH):
    with open(LABELS_PATH, "r") as f:
        
        class_names = [line.strip() for line in f.readlines()]
    print(f"✅ Завантажено {len(class_names)} порід.")
else:
    print(f"❌ ПОМИЛКА: Не знайдено файл {LABELS_PATH}")

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Модель завантажено!")
except Exception as e:
    print("❌ ПОМИЛКА ЗАВАНТАЖЕННЯ МОДЕЛІ:", e)
    model = None


def prepare_image(image_bytes):
    """Читає байти, конвертує в RGB, змінює розмір і препроцесить для MobileNetV2"""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img)
        img_batch = np.expand_dims(img_array, axis=0)
        return preprocess_input(img_batch)
    except Exception as e:
        print("❌ ERROR prepare_image:", e)
        return None


@app.post("/upload-photo/")
async def upload_photo(file: UploadFile = File(...)):
   
    if model is None:
        raise HTTPException(status_code=500, detail="Модель не завантажена")
    if not class_names:
         raise HTTPException(status_code=500, detail="Список порід не завантажено")

   
    image_bytes = await file.read()

  
    processed = prepare_image(image_bytes)
    if processed is None:
        return {"status": "error", "message": "Невірний формат зображення"}

    try:
     
        predictions = model.predict(processed, verbose=0)
        logits = predictions[0]

       
        probabilities = tf.nn.softmax(logits).numpy()

       
        predicted_index = np.argmax(probabilities)
        max_probability = probabilities[predicted_index]
        predicted_breed_raw = class_names[predicted_index]

        
        breed_clean = predicted_breed_raw.replace("_", " ").title()
        
       
        confidence_percent = float(round(max_probability * 100, 2))

        return {
            "status": "success",
            "class": breed_clean,       
            "probability": confidence_percent  
        }

    except Exception as e:
        print("❌ ERROR during prediction:", e)
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)