import tensorflow as tf
import numpy as np
import os
from tensorflow.keras.utils import load_img, img_to_array
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# --- Налаштування ---
MODEL_PATH = 'my_breed_model.keras'
LABELS_PATH = 'labels.txt'
IMAGE_TO_TEST = 'D:/Users/Oleg/Desktop/3.jpg'  # Вкажіть шлях

IMG_SIZE = 160

# ⚙️ НАЛАШТУВАННЯ БАЄСА
MC_SAMPLES = 20  # Скільки разів прогнати зображення (більше = точніше, але повільніше)
ENTROPY_THRESHOLD = 1.5  # Поріг "хаосу". 0 = впевнений, > 1.5 = не знаю

# 1. ЗАВАНТАЖЕННЯ
if not os.path.exists(LABELS_PATH):
    print("Помилка: labels.txt не знайдено.")
    exit()

with open(LABELS_PATH, "r") as f:
    class_names = [line.strip() for line in f.readlines()]

print(f"Завантаження моделі...")
model = tf.keras.models.load_model(MODEL_PATH)


# 2. ПІДГОТОВКА
def preprocess_image(image_path):
    try:
        img = load_img(image_path, target_size=(IMG_SIZE, IMG_SIZE))
        img_array = img_to_array(img)
        img_batch = np.expand_dims(img_array, axis=0)
        processed_img = preprocess_input(img_batch)
        return processed_img
    except Exception as e:
        print(f"Помилка: {e}")
        return None


# 3. БАЄСІВСЬКИЙ ПРОГНОЗ (MC DROPOUT)
processed_image = preprocess_image(IMAGE_TO_TEST)

if processed_image is not None:
    print(f"🔬 Запускаю Баєсівський аналіз ({MC_SAMPLES} ітерацій)...")

    # Створюємо список для збереження всіх прогнозів
    predictions_list = []

    # Проганяємо зображення N разів
    for i in range(MC_SAMPLES):
        # ❗️ training=True змушує Dropout працювати під час прогнозу
        # Це створює ефект "ансамблю" моделей
        pred = model(processed_image, training=True)
        predictions_list.append(pred)

    # Перетворюємо в один великий тензор (20, 37)
    predictions_stack = tf.stack(predictions_list)

    # --- МАТЕМАТИКА ---

    # 1. Середній прогноз (Mean) - це найточніший результат
    mean_prediction = tf.reduce_mean(predictions_stack, axis=0)  # shape (1, 37)
    probabilities = tf.nn.softmax(mean_prediction).numpy()[0]

    # 2. Обчислення Ентропії (Міра невизначеності)
    # Формула Шеннона: -sum(p * log(p))
    # Низька ентропія (близько 0) = Модель впевнена
    # Висока ентропія (> 1) = Модель плутається (рівномірний розподіл)
    entropy = -np.sum(probabilities * np.log(probabilities + 1e-9))

    # Знаходимо переможця
    predicted_index = np.argmax(probabilities)
    predicted_breed = class_names[predicted_index]
    confidence_percent = probabilities[predicted_index] * 100

    print("\n--- 📊 РЕЗУЛЬТАТИ АНАЛІЗУ ---")
    print(f"Ентропія (Рівень сумніву): {entropy:.4f}")
    print(f"Поріг відсіювання: {ENTROPY_THRESHOLD}")

    print("-" * 30)

    # Логіка прийняття рішення
    if entropy > ENTROPY_THRESHOLD:
        print("❌ НЕВІДОМИЙ ОБ'ЄКТ")
        print("Модель занадто сумнівається (висока ентропія).")
        print(f"Вона думає, що це може бути '{predicted_breed}', але впевненість розмита.")
    else:
        breed_clean = predicted_breed.replace('_', ' ').title()
        print(f"✅ Це: {breed_clean}")
        print(f"Впевненість: {confidence_percent:.2f}%")

    # Візуалізація розподілу (текстова)
    print("\n--- Топ-3 гіпотези моделі ---")
    top_3_indices = np.argsort(probabilities)[-3:][::-1]
    for i in top_3_indices:
        name = class_names[i]
        prob = probabilities[i] * 100
        # Малюємо простий графік
        bar = "█" * int(prob / 5)
        print(f"{name:20} | {prob:5.1f}% {bar}")