import cv2
import numpy as np

def preprocess_signature(img):
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    img = cv2.GaussianBlur(img, (5, 5), 0)

    _, img = cv2.threshold(
        img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    if np.mean(img) > 127:
        img = 255 - img

    coords = np.column_stack(np.where(img > 0))
    if coords.size == 0:
        return np.zeros((1, 128, 128, 1), dtype=np.float32)

    y, x = coords[:, 0], coords[:, 1]
    x1, x2 = x.min(), x.max()
    y1, y2 = y.min(), y.max()

    img = img[y1:y2+1, x1:x2+1]

    h, w = img.shape
    target = 110

    if h > w:
        new_h = target
        new_w = max(1, int(w * target / h))
    else:
        new_w = target
        new_h = max(1, int(h * target / w))

    img = cv2.resize(img, (new_w, new_h))

    canvas = np.zeros((128, 128), dtype=np.uint8)
    x_offset = (128 - new_w) // 2
    y_offset = (128 - new_h) // 2
    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img

    canvas = canvas.astype("float32") / 255.0
    canvas = canvas.reshape(1, 128, 128, 1)

    return canvas


def preprocess_signature_compare(img):
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    img = cv2.GaussianBlur(img, (5, 5), 0)

    _, img = cv2.threshold(
        img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    if np.mean(img) > 127:
        img = 255 - img

    coords = np.column_stack(np.where(img > 0))
    if coords.size == 0:
        return np.zeros((128, 128), dtype=np.uint8)

    y, x = coords[:, 0], coords[:, 1]
    x1, x2 = x.min(), x.max()
    y1, y2 = y.min(), y.max()

    img = img[y1:y2+1, x1:x2+1]

    h, w = img.shape
    target = 110

    if h > w:
        new_h = target
        new_w = max(1, int(w * target / h))
    else:
        new_w = target
        new_h = max(1, int(h * target / w))

    img = cv2.resize(img, (new_w, new_h))

    canvas = np.ones((128, 128), dtype=np.uint8) * 255
    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img
    canvas = 255 - canvas
    x_offset = (128 - new_w) // 2
    y_offset = (128 - new_h) // 2
    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = img

    return canvas