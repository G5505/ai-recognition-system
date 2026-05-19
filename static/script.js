const imageInput = document.getElementById("imageInput");
const referenceImage = document.getElementById("referenceImage");
const testImage = document.getElementById("testImage");

const predictBtn = document.getElementById("predictBtn");
const resetBtn = document.getElementById("resetBtn");

const resultText = document.getElementById("resultText");
const confidenceText = document.getElementById("confidenceText");
const confidenceBar = document.getElementById("confidenceBar");
const analysisText = document.getElementById("analysisText");
const diffImage = document.getElementById("diffImage");

const previewImage = document.getElementById("previewImage");
const previewPlaceholder = document.getElementById("previewPlaceholder");

const referencePreview = document.getElementById("referencePreview");
const testPreview = document.getElementById("testPreview");

const referencePlaceholder = document.getElementById("referencePlaceholder");
const testPlaceholder = document.getElementById("testPlaceholder");

const singlePreviewBox = document.getElementById("singlePreviewBox");
const comparePreviewBox = document.getElementById("comparePreviewBox");

const statusBox = document.getElementById("statusBox");
const taskSelect = document.getElementById("taskSelect");
const tabButtons = document.querySelectorAll(".tab-btn");

const singleInputWrapper = document.getElementById("singleInputWrapper");
const signatureInputs = document.getElementById("signatureInputs");

const drawCanvas = document.getElementById("drawCanvas");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const ctx = drawCanvas.getContext("2d");

const referenceCanvas = document.getElementById("referenceCanvas");
const testCanvas = document.getElementById("testCanvas");

const clearReferenceCanvasBtn = document.getElementById("clearReferenceCanvasBtn");
const clearTestCanvasBtn = document.getElementById("clearTestCanvasBtn");

const refCtx = referenceCanvas.getContext("2d");
const testCtx = testCanvas.getContext("2d");

let isDrawing = false;
let hasDrawing = false;

let hasReferenceDrawing = false;
let hasTestDrawing = false;

/* =========================
   Main digit/letter canvas
========================= */

function initMainCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
}

initMainCanvas();

drawCanvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  hasDrawing = true;

  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

drawCanvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

drawCanvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

drawCanvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

clearCanvasBtn.addEventListener("click", () => {
  clearCanvas();
});

function clearCanvas() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
  hasDrawing = false;

  previewImage.src = "";
  previewImage.style.display = "none";
  drawCanvas.style.display = "block";
  previewPlaceholder.style.display = "flex";
}

/* =========================
   Signature canvases
========================= */

function initSignatureCanvas(canvas, ctxObj) {
  ctxObj.fillStyle = "white";
  ctxObj.fillRect(0, 0, canvas.width, canvas.height);

  ctxObj.lineWidth = 4;
  ctxObj.lineCap = "round";
  ctxObj.strokeStyle = "black";
}

initSignatureCanvas(referenceCanvas, refCtx);
initSignatureCanvas(testCanvas, testCtx);

function setupSignatureCanvas(canvas, ctxObj, placeholder, imagePreview, type) {
  let drawing = false;

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;

    if (type === "reference") {
      hasReferenceDrawing = true;
      referenceImage.value = "";
    } else {
      hasTestDrawing = true;
      testImage.value = "";
    }

    imagePreview.src = "";
    imagePreview.style.display = "none";
    canvas.style.display = "block";
    placeholder.style.display = "none";

    const rect = canvas.getBoundingClientRect();
    ctxObj.beginPath();
    ctxObj.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    ctxObj.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxObj.stroke();
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
  });

  canvas.addEventListener("mouseleave", () => {
    drawing = false;
  });
}

setupSignatureCanvas(
  referenceCanvas,
  refCtx,
  referencePlaceholder,
  referencePreview,
  "reference"
);

setupSignatureCanvas(
  testCanvas,
  testCtx,
  testPlaceholder,
  testPreview,
  "test"
);

function clearReferenceSignature() {
  referenceImage.value = "";
  referencePreview.src = "";
  referencePreview.style.display = "none";

  referenceCanvas.style.display = "block";
  initSignatureCanvas(referenceCanvas, refCtx);

  referencePlaceholder.style.display = "flex";
  hasReferenceDrawing = false;
}

function clearTestSignature() {
  testImage.value = "";
  testPreview.src = "";
  testPreview.style.display = "none";

  testCanvas.style.display = "block";
  initSignatureCanvas(testCanvas, testCtx);

  testPlaceholder.style.display = "flex";
  hasTestDrawing = false;
}

clearReferenceCanvasBtn.addEventListener("click", clearReferenceSignature);
clearTestCanvasBtn.addEventListener("click", clearTestSignature);

/* =========================
   UI modes
========================= */

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    taskSelect.value = button.dataset.task;

    updateModeUI();
    setTaskMessage();
    clearAllResults();
  });
});

function updateModeUI() {
  const task = taskSelect.value;

  if (task === "signature") {
    singleInputWrapper.style.display = "none";
    signatureInputs.style.display = "block";

    singlePreviewBox.style.display = "none";
    comparePreviewBox.style.display = "block";
  } else {
    singleInputWrapper.style.display = "block";
    signatureInputs.style.display = "none";

    singlePreviewBox.style.display = "flex";
    comparePreviewBox.style.display = "none";
  }
}

function setTaskMessage() {
  const task = taskSelect.value;

  if (task === "digit") {
    statusBox.textContent =
      "Digit mode selected. Upload or draw a handwritten number.";
  } else if (task === "letter") {
    statusBox.textContent =
      "Letter mode selected. Upload or draw separated handwritten characters.";
  } else {
    statusBox.textContent =
      "Signature comparison selected. Upload or draw both signatures.";
  }
}

function setConfidence(valueText) {
  confidenceText.textContent = valueText || "--";

  if (!valueText || valueText === "--") {
    confidenceBar.style.width = "0%";
    return;
  }

  const numericValue = parseFloat(valueText.replace("%", ""));
  confidenceBar.style.width = numericValue + "%";

  if (numericValue < 50) {
    confidenceBar.style.background = "#e74c3c";
  } else if (numericValue < 80) {
    confidenceBar.style.background = "#f1c40f";
  } else {
    confidenceBar.style.background = "#2ecc71";
  }
}

function clearAllResults() {
  resultText.textContent = "No result yet.";
  resultText.className = "result-main";

  setConfidence("--");

  analysisText.textContent =
    "Upload an image or draw, then press predict.";

  diffImage.src = "";
  diffImage.style.display = "none";
}

function resetEverything() {
  imageInput.value = "";
  referenceImage.value = "";
  testImage.value = "";

  clearCanvas();
  clearReferenceSignature();
  clearTestSignature();
  clearAllResults();
  setTaskMessage();
}

resetBtn.addEventListener("click", resetEverything);

/* =========================
   Upload previews
========================= */

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (file) {
    previewImage.src = URL.createObjectURL(file);
    previewImage.style.display = "block";

    drawCanvas.style.display = "none";
    previewPlaceholder.style.display = "none";

    hasDrawing = false;
    statusBox.textContent = `Selected file: ${file.name}`;
  } else {
    clearCanvas();
  }
});

referenceImage.addEventListener("change", () => {
  const file = referenceImage.files[0];

  if (file) {
    referencePreview.src = URL.createObjectURL(file);
    referencePreview.style.display = "block";

    referenceCanvas.style.display = "none";
    referencePlaceholder.style.display = "none";

    initSignatureCanvas(referenceCanvas, refCtx);
    hasReferenceDrawing = false;
  }
});

testImage.addEventListener("change", () => {
  const file = testImage.files[0];

  if (file) {
    testPreview.src = URL.createObjectURL(file);
    testPreview.style.display = "block";

    testCanvas.style.display = "none";
    testPlaceholder.style.display = "none";

    initSignatureCanvas(testCanvas, testCtx);
    hasTestDrawing = false;
  }
});

/* =========================
   Helpers
========================= */

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

/* =========================
   Prediction
========================= */

predictBtn.addEventListener("click", async () => {
  const task = taskSelect.value;
  const formData = new FormData();
  let endpoint = "";

  if (task === "digit" || task === "letter") {
    const file = imageInput.files[0];

    if (!file && !hasDrawing) {
      resultText.textContent = "No input selected";
      resultText.className = "result-main error-text";
      analysisText.textContent = "Please upload an image or draw first.";
      return;
    }

    if (file) {
      formData.append("image", file);
    } else {
      const blob = await canvasToBlob(drawCanvas);
      formData.append("image", blob, "drawing.png");
    }

    endpoint = task === "digit" ? "/predict-digit" : "/predict-letter";
  }

  else if (task === "signature") {
    const refFile = referenceImage.files[0];
    const testFile = testImage.files[0];

    if (!refFile && !hasReferenceDrawing) {
      resultText.textContent = "Missing reference signature";
      resultText.className = "result-main error-text";
      analysisText.textContent = "Please upload or draw the reference signature.";
      return;
    }

    if (!testFile && !hasTestDrawing) {
      resultText.textContent = "Missing test signature";
      resultText.className = "result-main error-text";
      analysisText.textContent = "Please upload or draw the test signature.";
      return;
    }

    if (refFile) {
      formData.append("reference_image", refFile);
    } else {
      const refBlob = await canvasToBlob(referenceCanvas);
      formData.append("reference_image", refBlob, "reference_drawing.png");
    }

    if (testFile) {
      formData.append("test_image", testFile);
    } else {
      const testBlob = await canvasToBlob(testCanvas);
      formData.append("test_image", testBlob, "test_drawing.png");
    }

    endpoint = "/compare-signatures";
  }

  resultText.textContent = "Processing...";
  analysisText.textContent = "Please wait while the system analyzes the input.";
  setConfidence("--");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    resultText.textContent = data.prediction || "No prediction";
    resultText.className = "result-main";

    setConfidence(data.confidence || "--");
    analysisText.textContent = data.analysis || "No analysis available.";

    if (data.diff_image) {
      diffImage.src = "data:image/png;base64," + data.diff_image;
      diffImage.style.display = "block";
    } else {
      diffImage.style.display = "none";
    }
  } catch (error) {
    resultText.textContent = "Error";
    resultText.className = "result-main error-text";
    analysisText.textContent = "Failed to connect to the server.";
    console.error(error);
  }
});

updateModeUI();
setTaskMessage();