from flask import Flask, request, jsonify, render_template
import os
import base64
import numpy as np
import cv2
import tensorflow as tf
import string

from keras.layers import Dense

old_from_config = Dense.from_config

@classmethod
def custom_from_config(cls, config):
    config.pop("quantization_config", None)
    return old_from_config(config)

Dense.from_config = custom_from_config

from utils.preprocess_digits import preprocess_digit_letter
from utils.preprocess_letters import preprocess_letter
from utils.preprocess_signature import (
    preprocess_signature,
    preprocess_signature_compare
)

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

digit_model = tf.keras.models.load_model(
    os.path.join(MODELS_DIR, "digits_model.keras")
)

letter_model = tf.keras.models.load_model(
    os.path.join(MODELS_DIR, "letters_model.keras")
)

#signature_encoder = tf.keras.models.load_model(
#    os.path.join(MODELS_DIR, "signature_encoder.keras")
#)

letters = string.ascii_uppercase

def split_characters(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if np.mean(gray) > 127:
        gray = 255 - gray

    _, thresh = cv2.threshold(
        gray, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    contours, _ = cv2.findContours(
        thresh,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    boxes = []

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)

        if w > 5 and h > 10:
            boxes.append((x, y, w, h))

    boxes = sorted(boxes, key=lambda b: b[0])

    chars = []

    for x, y, w, h in boxes:
        char_img = img[y:y+h, x:x+w]
        chars.append(char_img)

    return chars

def read_uploaded_image(field_name="image"):
    if field_name not in request.files:
        return None, jsonify({"error": f"No file provided for {field_name}"}), 400

    file = request.files[field_name]

    if file.filename == "":
        return None, jsonify({"error": f"No file selected for {field_name}"}), 400

    file_bytes = file.read()

    if not file_bytes:
        return None, jsonify({"error": f"Uploaded file for {field_name} is empty"}), 400

    img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)

    if img is None:
        return None, jsonify({"error": f"Invalid image format in {field_name}"}), 400

    return img, None, None


def get_confidence(prediction):
    return float(np.max(prediction)) * 100.0


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict-digit", methods=["POST"])
def predict_digit():
    img, error_response, status_code = read_uploaded_image("image")
    if error_response:
        return error_response, status_code

    chars = split_characters(img)

    if len(chars) == 0:
        chars = [img]

    result_digits = []
    confidences = []

    for char_img in chars:
        processed = preprocess_digit_letter(char_img)
        prediction = digit_model.predict(processed, verbose=0)[0]

        predicted_digit = int(np.argmax(prediction))
        confidence = float(np.max(prediction)) * 100

        result_digits.append(str(predicted_digit))
        confidences.append(confidence)

    final_result = "".join(result_digits)
    avg_confidence = sum(confidences) / len(confidences)

    analysis = (
        f"The system detected {len(result_digits)} digit(s) and recognized them as {final_result}."
    )

    return jsonify({
        "prediction": final_result,
        "confidence": f"{avg_confidence:.2f}%",
        "analysis": analysis
    })


@app.route("/predict-letter", methods=["POST"])
def predict_letter():
    img, error_response, status_code = read_uploaded_image("image")
    if error_response:
        return error_response, status_code

    chars = split_characters(img)

    if len(chars) == 0:
        chars = [img]

    result_letters = []
    confidences = []

    for char_img in chars:
        processed = preprocess_letter(char_img)
        prediction = letter_model.predict(processed, verbose=0)[0]

        predicted_index = int(np.argmax(prediction))
        predicted_letter = letters[predicted_index]
        confidence = float(np.max(prediction)) * 100

        result_letters.append(predicted_letter)
        confidences.append(confidence)

    final_result = "".join(result_letters)
    avg_confidence = sum(confidences) / len(confidences)

    analysis = (
        f"The system detected {len(result_letters)} character(s) "
        f"and recognized the text as {final_result}."
    )

    return jsonify({
        "prediction": final_result,
        "confidence": f"{avg_confidence:.2f}%",
        "analysis": analysis
    })



@app.route("/compare-signatures", methods=["POST"])
def compare_signatures():
    import gc

    ref_img, error_response, status_code = read_uploaded_image("reference_image")
    if error_response:
        return error_response, status_code

    test_img, error_response, status_code = read_uploaded_image("test_image")
    if error_response:
        return error_response, status_code

    ref_processed = preprocess_signature(ref_img)
    test_processed = preprocess_signature(test_img)

    signature_encoder = tf.keras.models.load_model(
        os.path.join(MODELS_DIR, "signature_encoder.keras"),
        compile=False
    )

    ref_emb = signature_encoder.predict(ref_processed, verbose=0)
    test_emb = signature_encoder.predict(test_processed, verbose=0)

    distance = np.linalg.norm(ref_emb - test_emb)
    print("Distance:", distance)

    similarity = max(0, min(100, 100 - (distance * 5)))

    if similarity >= 85:
        result = "Genuine"
    elif similarity >= 75:
        result = "Suspicious"
    else:
        result = "Forged"

    analysis = (
        f"The signature similarity score is {similarity:.2f}%. "
        f"The system result is {result} based on the learned signature features."
    )

    ref_display = (ref_processed.reshape(128, 128) * 255).astype(np.uint8)
    test_display = (test_processed.reshape(128, 128) * 255).astype(np.uint8)

    diff_img = cv2.absdiff(ref_display, test_display)

    _, buffer = cv2.imencode(".png", diff_img)
    encoded_image = base64.b64encode(buffer).decode("utf-8")

    del signature_encoder
    gc.collect()

    return jsonify({
        "prediction": result,
        "confidence": f"{similarity:.2f}%",
        "analysis": analysis,
        "diff_image": encoded_image
    })

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)