AI Recognition System

An AI-powered web application for recognizing handwritten digits, handwritten letters, and verifying offline signatures using deep learning models.

Features
Handwritten Digit Recognition
Handwritten Letter Recognition
Offline Signature Verification
Real-time AI Prediction
Web-based Interactive Interface
Image Upload and Drawing Support
AI Models

The project integrates three AI models:

Model	Purpose
CNN Model	Handwritten Digit Recognition
CNN Model	Handwritten Letter Recognition
Siamese Neural Network	Offline Signature Verification
Datasets Used
Dataset	Purpose
MNIST	Digit Recognition
EMNIST Letters	Letter Recognition
A-Z Handwritten Characters Dataset	Alphabet Recognition
CEDAR Signature Dataset	Signature Verification
BHSig260	Signature Verification
Technologies Used
Python
TensorFlow / Keras
OpenCV
Flask
HTML / CSS / JavaScript
NumPy
Google Colab
GitHub
Render
System Architecture

Frontend:

HTML
CSS
JavaScript

Backend:

Flask

AI Engine:

TensorFlow / Keras Models


Module	Accuracy
Digit Recognition	99.24%
Letter Recognition	91.72%
Signature Verification	76.51%
Preprocessing Techniques

The system applies several preprocessing steps before prediction:

Grayscale Conversion
Noise Reduction
Image Thresholding
Resizing
Normalization

Additional preprocessing is applied for signature comparison.


Live Demo:

https://ai-recognition-system.onrender.com
Future Improvements
Improve signature verification accuracy
Add Arabic handwriting recognition
Mobile application support
Real-time camera recognition
Advanced transformer-based AI models
