# AURA

> **Adaptive Understanding & Recognition of Activities.** > An AI-powered cognitive health assistant that monitors, segments, and evaluates daily living tasks to support patients with Mild Cognitive Impairment — in real-time.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Python AI](https://img.shields.io/badge/Python_AI-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## The Concept

**Aura** is an intelligent clinical support platform designed to assist patients with **Mild Cognitive Impairment (MCI)** in performing and monitoring Activities of Daily Living (ADLs). It acts as a **digital cognitive therapist**, leveraging a novel deep learning pipeline to analyze patient video submissions and detect procedural errors in real-time.

While traditional monitoring methods are manual and reactive, Aura uses AI to:
- Automatically **segment and classify actions** within patient-submitted task videos.
- Build a personalised **Golden Task Reference Model (GTRM)** for every enrolled routine.
- Detect **procedural anomalies** (missed, skipped, or unexpected steps) and surface them to clinicians on a live dashboard.

---

## Key Features

- **Novel SynT-Net Architecture:** A custom deep learning model built on **Synergistic Temporal Fusion Blocks (STFBs)** that combine dilated temporal convolutions with multi-head self-attention and a learned gating mechanism for frame-level action segmentation.
- **Golden Task Reference Model (GTRM):** When a patient enrolls in a task, Aura builds a personalised reference graph of expected action sequences. During inference, the live graph is compared against this golden model to precisely localise errors.
- **VideoMAE Feature Extraction:** Uses a fine-tuned **VideoMAE** transformer to extract rich, 768-dimensional spatiotemporal feature vectors from 16-frame video chunks.
- **Multi-Role Dashboard:** Separate, role-gated interfaces for **Patients** (personal task tracking and performance analytics) and **Clinicians** (global patient oversight, anomaly auditing, and cognitive load assessment).
- **Automatic Video Segmentation & Clipping:** Segments uploaded task videos into labelled clips, automatically cutting and archiving each action step for review.
- **Task Validation Guard:** Prevents mismatched video uploads by verifying that detected action steps overlap with the enrolled task's expected step vocabulary before committing to the database.

---

## How It Works

### 1. The ML Pipeline (`aura_ml`)

The machine learning pipeline follows a numbered, sequential workflow:

1. **Feature Extraction** (`1_feature_extraction.py`): Uses a pre-trained `VideoMAE` model to process video datasets and extract `[CLS]` token embeddings per 16-frame chunk, saving them as `.npy` feature files.
2. **Pseudo-Label Generation** (`2_generate_pseudo_labels.py`): Generates weakly-supervised training labels from the raw feature space.
3. **Feature Extractor Fine-Tuning** (`3_finetune_feature_extractor.py`): Fine-tunes the VideoMAE backbone on the task-specific dataset for domain-adapted features.
4. **Specialized Feature Re-Extraction** (`4_extract_specialized_features.py`): Re-extracts features using the fine-tuned model to the `features_finetuned/` directory.
5. **SynT-Net Training** (`5_Novel SynT-Net Training Script.py`): Trains the custom SynTNet model using the specialized features, with early stopping (patience=10) and manual validation splits across activity classes (`GettingUp`, `GoingToBed`, `UseLaptop`).
6. **Inference** (`6_Novel SynT-Net Inference.py`): Runs the trained model on new videos to produce frame-level action label sequences.

### 2. The Intelligence Server (`aura_server`)

The FastAPI server (`main.py`) is the operational backbone of the system, serving both the ML models and the full business logic:
- Loads the **fine-tuned VideoMAE** and the **trained SynT-Net** model at startup.
- Exposes a `/api/segment` endpoint that accepts raw video files, runs the full AI inference pipeline, and returns timestamped, labelled action segments.
- On `/api/train`, builds the patient's **personalised GTRM graph** (nodes = action steps, edges = `followed_by` transitions) and persists it in MySQL.
- On `/api/inference`, runs a new video against the stored golden graph using the `GTRM_GraphBuilder.compare_graphs()` method to produce an event log of normal detections and anomalies.

### 3. The Visual Interface (`aura_client`)

The Next.js frontend consumes the server's data to:
- Provide role-based routing — **patient** and **clinician** views with separate KPI dashboards.
- Display live session logs, task adherence rates, cognitive load heuristics, and incident timelines for clinicians.
- Allow patients to upload task videos, view segmented clips, and track their personal accuracy scores over time.

---

## Project Structure

```bash
Aura/
├── aura_client/             # Next.js (App Router) + Tailwind CSS
│   ├── public/              # Static assets
│   └── src/                 # Pages, components, and API hooks
│       └── app/             # Next.js App Router pages
├── aura_ml/                 # Offline ML Training Pipeline
│   ├── features/            # Raw VideoMAE feature vectors (.npy)
│   ├── features_finetuned/  # Fine-tuned feature vectors (.npy)
│   ├── models/              # Saved model checkpoints & action_map.json
│   ├── pseudo_labels/       # Weakly-supervised training labels
│   ├── transcripts/         # Ground truth transcript annotations
│   ├── 1_feature_extraction.py
│   ├── 2_generate_pseudo_labels.py
│   ├── 3_finetune_feature_extractor.py
│   ├── 4_extract_specialized_features.py
│   ├── 5_Novel SynT-Net Training Script.py
│   ├── 6_Novel SynT-Net Inference.py
│   ├── Evaluation.py
│   └── GroundTruthAnotater.py
└── aura_server/             # FastAPI (Intelligence & Business Logic)
    ├── models/              # Trained model files (VideoMAE + SynT-Net)
    └── main.py              # All API endpoints & AI inference logic
```

---

## Tech Stack

### Frontend
- **Next.js** (App Router) & **Tailwind CSS**
- **React** component architecture

### Backend & AI Server
- **Python 3.10 / FastAPI** (Intelligence & Business Logic)
- **MySQL** with **SQLAlchemy** ORM (Relational Data Persistence)

### AI & Computer Vision
- **VideoMAE** (`MCG-NJU/videomae-base`) — Spatiotemporal Feature Extraction
- **SynT-Net** (Novel Architecture) — Temporal Action Segmentation
- **OpenCV** — Video processing and clip extraction
- **PyTorch** — Model training, fine-tuning, and inference
- **Scikit-Learn** — Data utilities and train/validation splitting

---

## Getting Started

Follow these steps to run the complete Aura ecosystem.

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL server running locally
- CUDA-compatible GPU recommended (CPU fallback supported)

### 1. Clone the Repository

```bash
git clone https://github.com/Nisinii/Aura.git
cd Aura
```

### 2. Prepare the Database

Create a MySQL database named `fyp_new`. The server will auto-create all tables on first run via SQLAlchemy.

```sql
CREATE DATABASE fyp_new;
```

### 3. Start the Intelligence Server (FastAPI)

```bash
cd aura_server

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy pymysql opencv-python torch transformers numpy pydantic

# Start the server
uvicorn main:app --reload --port 8000
```

### 4. Run the ML Training Pipeline (Optional)

```bash
cd aura_ml
python 1_feature_extraction.py
python 2_generate_pseudo_labels.py
python 3_finetune_feature_extractor.py
python 4_extract_specialized_features.py
python "5_Novel SynT-Net Training Script.py"
```

The best model checkpoint will be saved to `aura_ml/models/best_syntnet_model.pth`.

### 5. Launch the Client (Next.js)

```bash
cd aura_client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Author

**Nisini Niketha** — *Software Engineer & AI Developer*

- [GitHub](https://github.com/Nisinii)
- [LinkedIn](https://www.linkedin.com/in/nisini-niketha/)
- [Contact](mailto:wnisini.niketha@gmail.com)
