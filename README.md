# VisionTF - Real-Time In-Browser TensorFlow Object & Sock Detector

A 100% front-end, client-side real-time computer vision application powered by **TensorFlow.js**, **React**, and **Tailwind CSS**.

---

## 🚀 Key Features

1. **Everyday Object & Sock Recognition (MobileNet ImageNet - 1,000 Classes)**:
   - Detects everyday items including **socks (`sock`)**, shoes, shirts, cups, bottles, tools, and electronics.
   - Shows top-5 predictions with animated confidence meters.
   - Displays a celebratory banner and confetti when a sock is detected!

2. **Spatial Object Detection (COCO-SSD - 80 Standard Categories)**:
   - Real-time bounding boxes drawn directly onto an HTML5 canvas overlay.
   - Identifies objects (person, chair, laptop, cell phone, cup, backpack, etc.).

3. **Interactive Custom Learner (In-Browser Teachable Machine / Transfer Learning)**:
   - Uses MobileNet feature embeddings + KNN Classifier.
   - Hold down **"Hold to Train"** for 3–5 seconds to train the neural network on your specific sock or any custom object on the fly!
   - Real-time match percentage for your custom-trained objects.

4. **Speech & Audio Feedback (Web Speech API + Web Audio API)**:
   - Natural voice announcements when items are recognized (e.g. *"Sock detected!"* or *"I see a coffee mug"*).
   - Futuristic synthesizer chime on detection.
   - Cooldown timer to prevent repetitive speech.

5. **Snapshot Gallery**:
   - Capture high-resolution snapshots with bounding box overlays and confidence timestamps.
   - Download snapshots directly to your device.

6. **0 Server Latency / 100% Privacy**:
   - Hardware-accelerated via **WebGL**.
   - Your webcam video **never leaves your browser**.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + Lucide Icons
- **Machine Learning**:
  - `@tensorflow/tfjs` (Core & WebGL backend)
  - `@tensorflow-models/mobilenet` (1,000 everyday classes)
  - `@tensorflow-models/coco-ssd` (80 object bounding boxes)
  - `@tensorflow-models/knn-classifier` (On-device custom transfer learning)
- **Audio**: Web Speech Synthesis API & Web Audio API

---

## 🏃 Getting Started

### 1. Start the Development Server

In PowerShell / Terminal:
```bash
npm.cmd run dev
```

Or:
```bash
npx.cmd vite
```

### 2. Open in Browser

Open your browser at:
```
http://localhost:3000
```

Allow webcam permissions when prompted, and point your camera at any object (or hold up a sock!).
