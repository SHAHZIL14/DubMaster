# 🎬 DubMaster AI – Multilingual Video Dubbing System

An AI-powered video processing system that transforms short user-uploaded videos into **multilingual dubbed outputs** using a fully automated pipeline.

> 🚀 Built to demonstrate real-world backend engineering, system design, and AI pipeline integration — not just features.

---

## 📌 Overview

**DubMaster AI** is a cost-efficient, scalable (within constraints), and legally safe application that allows approved users to:

* Upload short videos (5–10 seconds)
* Automatically extract speech (STT)
* Translate content into another language
* Generate subtitles
* Create AI voice dubbing (TTS)
* Merge audio with video for final output

All processing is handled asynchronously using a **queue-based architecture**.

---

## 🎯 Project Goals

This project is designed to showcase:

* End-to-end system design
* Backend architecture & API design
* MongoDB data modeling
* AI pipeline integration (STT → Translation → TTS)
* Async job processing & queue management
* Real-world engineering trade-offs

> ⚠️ This is a **portfolio project**, not a production SaaS product.

---

## 🧱 System Architecture

```text
Client (React Native)
        ↓
Upload API (Node.js Backend)
        ↓
Cloudinary Storage
        ↓
Job Queue System
        ↓
Worker Processing Pipeline
        ↓
STT → Translation → TTS → Sync → Merge
        ↓
Processed Video (Cloudinary)
```

---

## ⚙️ Tech Stack

### 📱 Frontend

* React Native (Expo)
* REST API integration
* JWT Authentication

### 🧠 Backend

* Node.js (Primary Implementation)
* FFmpeg (media processing)
* Async job queue system

### 🗄️ Database

* MongoDB Atlas (M0 Free Tier)
* TTL Indexes for auto-cleanup

### ☁️ Storage

* Cloudinary (Free Tier)
* Temporary storage (auto-deleted after 3 hours)

### 🤖 AI Components (Open Source)

* Speech-to-Text: Whisper
* Translation: Marian / NLLB
* Text-to-Speech: Coqui TTS

---

## 🔐 User Access Model

This system is **restricted by design**:

* 👤 Users must be **admin-approved**
* 🚫 Unapproved users cannot process videos
* 👑 Admin role controls access

### Why?

* Prevent abuse
* Maintain predictable compute usage
* Stay within free-tier limits

---

## 📊 Core Features

* ✅ Secure JWT Authentication
* ✅ Admin Approval System
* ✅ Video Upload & Validation
* ✅ AI Processing Pipeline
* ✅ Subtitle Generation (.srt/.vtt)
* ✅ AI Voice Dubbing (TTS)
* ✅ Audio-Video Synchronization
* ✅ Final Video Rendering
* ✅ Cloud Storage Integration
* ✅ Auto Cleanup with TTL

---

## ⏳ Data Lifecycle

* All videos expire after **3 hours**
* MongoDB TTL removes expired records automatically
* Cloudinary assets are deleted via backend cleanup
* Users are warned to download before expiry

> 🔒 No long-term storage. Privacy-first design.

---

## ⚠️ Constraints (Intentional Design)

| Constraint       | Limit    | Reason                   |
| ---------------- | -------- | ------------------------ |
| Active Users     | Max 20   | Cost & abuse control     |
| Video Length     | 5–10 sec | CPU & storage efficiency |
| Storage Duration | 3 hours  | Privacy & cost control   |
| Access           | Approved | Predictable usage        |

> These are **design decisions**, not limitations.

---

## 🔄 Processing Pipeline

```text
Upload Video
   ↓
Extract Audio
   ↓
Generate Captions (STT)
   ↓
Translate Text
   ↓
Generate TTS Audio
   ↓
Synchronize Audio with Video
   ↓
Merge Audio + Video
   ↓
Upload Final Output
```

---

## 🧪 Scrum Execution

### 🟦 Sprint 1

* Authentication (JWT)
* User approval system
* Video upload API

### 🟦 Sprint 2

* AI processing pipeline
* MongoDB integration
* Job tracking system

### 🟦 Sprint 3

* Cloudinary integration
* Cleanup automation
* Error handling & stability

### 🟦 Sprint 4

* UI polish
* Documentation
* Demo readiness

---

## 💰 Cost Strategy (100% Free Tier)

| Component | Strategy               |
| --------- | ---------------------- |
| Storage   | Cloudinary Free Tier   |
| Compute   | CPU-only, short videos |
| Database  | MongoDB Atlas M0       |
| Auth      | Custom JWT             |
| Hosting   | Free-tier backend      |

> Designed to run **indefinitely at zero cost**

---

## ⚖️ Legal & Compliance

* Only user-uploaded content allowed
* No external video downloading
* Temporary storage only
* No redistribution
* Explicit user warnings

---

## 🚀 Success Criteria

* End-to-end video processing works reliably
* Clean and maintainable codebase
* Strong architectural clarity
* Demonstrates real-world engineering skills

---

## 🏁 Final Note

This project is intentionally **not built for scale**.

Instead, it focuses on:

* clarity of design
* correctness of implementation
* and strong engineering fundamentals

> 💡 *The goal is not scale — the goal is engineering clarity.*

---

## 📬 Author

Built by **Mohd Shazil Raza**
For learning, showcasing, and pushing backend engineering skills 🚀

---

## ⭐ If You Like This Project

Give it a ⭐ on GitHub and feel free to fork or explore!

---
