import cv2
import numpy as np

def preprocess_letter(img):
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    img = cv2.GaussianBlur(img, (3, 3), 0)

    img = img.astype("float32") / 255.0

    if np.mean(img) > 0.5:
        img = 1.0 - img

    img = (img * 255).astype(np.uint8)

    coords = np.column_stack(np.where(img > 30))
    if coords.size == 0:
        return np.zeros((1, 28, 28, 1), dtype=np.float32)

    y, x = coords[:, 0], coords[:, 1]
    x1, x2 = x.min(), x.max()
    y1, y2 = y.min(), y.max()

    img = img[y1:y2+1, x1:x2+1]

    h, w = img.shape
    target = 22

    if h > w:
        new_h = target
        new_w = max(1, int(w * target / h))
    else:
        new_w = target
        new_h = max(1, int(h * target / w))

    img = cv2.resize(img, (new_w, new_h))

    canvas = np.zeros((28, 28), dtype=np.uint8)
    x_offset = (28 - new_w) // 2
    y_offset = (28 - new_h) // 2
    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img

    canvas = canvas.astype("float32") / 255.0
    canvas = canvas.reshape(1, 28, 28, 1)

    return canvas