import uuid
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import os
import shutil
import json
import math
import time
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
from pydantic import BaseModel
from fastapi import Form

# Configurations
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/fyp_new"
MODEL_DIR = "models/"
CLIPS_DIR = "segmented_clips/"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

os.makedirs(CLIPS_DIR, exist_ok=True)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DATABASE MODELS ---

class User(Base):
    __tablename__ = "users"
    user_id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="patient")
    first_name = Column(String(50))
    last_name = Column(String(50))

class Task(Base):
    __tablename__ = "tasks"
    task_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100))
    icon_name = Column(String(50))
    steps_json = Column(Text)

class UserTask(Base):
    __tablename__ = "user_tasks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    task_id = Column(Integer, ForeignKey("tasks.task_id", ondelete="CASCADE"))
    status = Column(String(20), default="available")
    training_graph = Column(Text, nullable=True)
    last_accessed = Column(String(50), default="Never")
    accuracy = Column(Float, default=0.0)
    sessions = Column(Integer, default=0)

class SessionLog(Base):
    __tablename__ = "session_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    task_name = Column(String(100))
    score = Column(Float)
    duration = Column(Float)
    anomalies_found = Column(Boolean)
    anomaly_detail = Column(String(255))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/clips", StaticFiles(directory=CLIPS_DIR), name="clips")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- GTRM & AI COMPONENTS ---
class GTRM_GraphBuilder:
    @staticmethod
    def build_graph(segments):
        nodes = []
        for idx, seg in enumerate(segments):
            duration = seg.get('end', 0) - seg.get('start', 0)
            nodes.append({
                "node_id": idx, "label": seg['label'], "avg_duration": round(duration, 2),
                "confidence": seg.get('confidence', 0.0), "start_time": seg.get('start', 0), "end_time": seg.get('end', 0)
            })
        edges = []
        for i in range(len(nodes) - 1):
            edges.append({"source": nodes[i]['node_id'], "target": nodes[i+1]['node_id'], "relation": "followed_by"})
        return {"nodes": nodes, "edges": edges}

    @staticmethod
    def compare_graphs(golden_graph, inference_graph):
        logs = []; anomalies_found = False
        expected_nodes = golden_graph['nodes']; actual_nodes = inference_graph['nodes']
        expected_labels = [n['label'] for n in expected_nodes]; actual_labels = [n['label'] for n in actual_nodes]

        exp_ptr, act_ptr = 0, 0
        while exp_ptr < len(expected_labels) or act_ptr < len(actual_labels):
            if exp_ptr >= len(expected_labels) and act_ptr >= len(actual_labels): break
            if exp_ptr >= len(expected_labels):
                node = actual_nodes[act_ptr]
                logs.append({"time": node['start_time'], "message": f"UNEXPECTED ACTION: {node['label']}", "type": "anomaly"})
                anomalies_found = True; act_ptr += 1; continue
            if act_ptr >= len(actual_labels):
                last_time = actual_nodes[-1]['end_time'] if actual_nodes else 0
                logs.append({"time": last_time, "message": f"CRITICAL: MISSED STEP '{expected_labels[exp_ptr]}'", "type": "anomaly"})
                anomalies_found = True; exp_ptr += 1; continue

            if expected_labels[exp_ptr] == actual_labels[act_ptr]:
                node = actual_nodes[act_ptr]
                logs.append({"time": node['start_time'], "message": f"DETECTED: {node['label']}", "type": "normal"})
                exp_ptr += 1; act_ptr += 1
            else:
                if expected_labels[exp_ptr] in actual_labels[act_ptr+1:]:
                    node = actual_nodes[act_ptr]
                    logs.append({"time": node['start_time'], "message": f"UNEXPECTED ACTION: {node['label']}", "type": "anomaly"})
                    anomalies_found = True; act_ptr += 1 
                else:
                    prev_time = actual_nodes[act_ptr]['start_time'] if act_ptr < len(actual_nodes) else 0
                    logs.append({"time": prev_time, "message": f"CRITICAL: MISSED STEP '{expected_labels[exp_ptr]}'", "type": "anomaly"})
                    anomalies_found = True; exp_ptr += 1 
        return logs, anomalies_found

class MultiHeadSelfAttention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.1):
        super(MultiHeadSelfAttention, self).__init__(); self.d_k = d_model // num_heads; self.num_heads = num_heads
        self.linears = nn.ModuleList([nn.Linear(d_model, d_model) for _ in range(4)]); self.dropout = nn.Dropout(dropout)
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0); query, key, value = [l(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2) for l, x in zip(self.linears, (query, key, value))]
        scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(self.d_k)
        p_attn = self.dropout(F.softmax(scores, dim=-1))
        return self.linears[-1](torch.matmul(p_attn, value).transpose(1, 2).contiguous().view(batch_size, -1, self.num_heads * self.d_k))

# STFB in SynT-Net
class SynergisticTemporalFusionBlock(nn.Module):
    def __init__(self, num_f_maps, dilation):
        super(SynergisticTemporalFusionBlock, self).__init__()
        self.tcn_layer = nn.Sequential(nn.Conv1d(num_f_maps, num_f_maps, 3, padding=dilation, dilation=dilation), nn.ReLU(), nn.Dropout(0.1))
        self.attention = MultiHeadSelfAttention(d_model=num_f_maps, num_heads=4)
        self.norm_attn = nn.LayerNorm(num_f_maps); self.gate_fc = nn.Sequential(nn.Linear(num_f_maps, num_f_maps // 2), nn.ReLU(), nn.Linear(num_f_maps // 2, num_f_maps), nn.Sigmoid())
        self.norm_final = nn.LayerNorm(num_f_maps)
    def forward(self, x_conv):
        x_attn = x_conv.transpose(1, 2); local_features = self.tcn_layer(x_conv)
        global_context = self.attention(x_attn, x_attn, x_attn)
        gate = self.gate_fc(self.norm_attn(x_attn + F.dropout(global_context, 0.1)).mean(dim=1)).unsqueeze(2)
        return self.norm_final((local_features * gate + local_features).transpose(1,2)).transpose(1, 2)

class SynTNet(nn.Module):
    def __init__(self, num_stages, num_layers, num_f_maps, dim, num_classes):
        super(SynTNet, self).__init__()
        self.conv_1x1_in = nn.Conv1d(dim, num_f_maps, 1); self.stages = nn.ModuleList(); self.conv_1x1_out = nn.Conv1d(num_f_maps, num_classes, 1)
        for _ in range(num_stages): self.stages.append(nn.Sequential(*[SynergisticTemporalFusionBlock(num_f_maps, 2**i) for i in range(num_layers)]))
    def forward(self, x):
        out = self.conv_1x1_in(x); outputs = []
        for stage in self.stages: out = stage(out); outputs.append(self.conv_1x1_out(out))
        return outputs

print("Loading AI Models")
try:
    with open(os.path.join(MODEL_DIR, "action_map.json"), 'r') as f: action_to_idx = json.load(f)
    idx_to_action = {str(i): action for action, i in action_to_idx.items()}
    processor = VideoMAEImageProcessor.from_pretrained(os.path.join(MODEL_DIR, "finetuned_videomae/"))
    feature_extractor = VideoMAEForVideoClassification.from_pretrained(os.path.join(MODEL_DIR, "finetuned_videomae/")).to(DEVICE).eval()
    segmentation_model = SynTNet(num_stages=2, num_layers=8, num_f_maps=64, dim=feature_extractor.config.hidden_size, num_classes=len(action_to_idx))
    segmentation_model.load_state_dict(torch.load(os.path.join(MODEL_DIR, "best_syntnet_model.pth"), map_location=DEVICE))
    segmentation_model.to(DEVICE).eval()
except Exception as e: print(f"Model Load Failed: {e} "); processor = None

def process_video_frames(video_path):
    cap = cv2.VideoCapture(video_path); fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []; 
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()
    if not frames: return None, 0
    
    feature_vectors = []; num_chunks = len(frames) // 16
    if num_chunks == 0: return None, fps

    for i in range(num_chunks):
        inputs = processor(frames[i*16 : (i+1)*16], return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            outputs = feature_extractor.videomae(**inputs)
            feature_vectors.append(outputs.last_hidden_state.mean(dim=1).cpu().numpy())
    
    return torch.tensor(np.vstack(feature_vectors).T, dtype=torch.float32).unsqueeze(0).to(DEVICE), fps

def get_segments_data(video_path):
    features_tensor, fps = process_video_frames(video_path)
    if features_tensor is None: return []

    with torch.no_grad():
        predictions = segmentation_model(features_tensor)
        predicted_labels = torch.argmax(predictions[-1], dim=1).squeeze().cpu().numpy()

    segments = []; current_label = -1; start_chunk = 0
    for i, label in enumerate(predicted_labels):
        if label != current_label:
            if current_label != -1:
                segments.append({"label": idx_to_action.get(str(current_label), "Unknown"), "start": round((start_chunk * 16) / fps, 2), "end": round((i * 16) / fps, 2), "confidence": 0.95})
            current_label = label; start_chunk = i
    if current_label != -1:
        segments.append({"label": idx_to_action.get(str(current_label), "Unknown"), "start": round((start_chunk * 16) / fps, 2), "end": round((len(predicted_labels) * 16) / fps, 2), "confidence": 0.95})
    
    return segments

def cut_clips(video_path, segments, output_dir):
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)); height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)); fps = cap.get(cv2.CAP_PROP_FPS)
    
    original_name = os.path.basename(video_path)
    if original_name.startswith("temp_"): original_name = original_name[5:]
    video_base_name = os.path.splitext(original_name)[0]
    
    final_segments = []
    
    for idx, seg in enumerate(segments):
        clean_name = "".join(c for c in seg['label'] if c.isalnum() or c in (' ', '_')).rstrip().replace(" ", "_")
        filename = f"{video_base_name}_step_{idx+1}_{clean_name}.mp4"
        out_path = os.path.join(output_dir, filename)
        
        start_frame = int(seg['start'] * fps)
        end_frame = int(seg['end'] * fps)
        
        writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        for _ in range(start_frame, end_frame):
            ret, frame = cap.read()
            if not ret: break
            writer.write(frame)
        writer.release()
        
        seg['filename'] = filename
        final_segments.append(seg)
        
    cap.release()
    return final_segments

# --- API ENDPOINTS ---

@app.post("/register")
def register(user: dict, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.get("username")).first(): 
        raise HTTPException(400, "Username Taken")
    
    # 1. Create User
    new_user = User(
        username=user.get("username"), 
        password=user.get("password"), 
        role=user.get("role", "patient"),
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", "")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 2. Automatically map all global tasks to this new user!
    all_tasks = db.query(Task).all()
    for task in all_tasks:
        new_user_task = UserTask(
            user_id=new_user.user_id,
            task_id=task.task_id,
            status="available",
            accuracy=0.0,
            sessions=0,
            last_accessed="Never"
        )
        db.add(new_user_task)
    db.commit()

    return {"status": "success", "user_id": new_user.user_id, "role": new_user.role}

@app.post("/login")
def login(user: dict, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.username == user.get("username")).first()
    if u and u.password == user.get("password"): 
        return {
            "role": u.role, 
            "username": u.username, 
            "user_id": u.user_id, # Frontend needs to save this in localStorage!
            "first_name": u.first_name,
            "last_name": u.last_name
        }
    raise HTTPException(401, "Invalid Credentials")

@app.get("/tasks")
def get_tasks(user_id: str, db: Session = Depends(get_db)):
    # Join UserTask with Global Task to get full details for THIS user
    user_tasks = db.query(UserTask, Task).join(Task, UserTask.task_id == Task.task_id).filter(UserTask.user_id == user_id).all()
    
    result = []
    for ut, t in user_tasks:
        result.append({
            "id": t.task_id, 
            "title": t.title, 
            "icon_name": t.icon_name,
            "status": ut.status, 
            "last_accessed": ut.last_accessed,
            "accuracy": ut.accuracy, 
            "sessions": ut.sessions,
            "steps": json.loads(t.steps_json) if t.steps_json else []
        })
    return result

@app.post("/api/segment")
async def segment_video_training(
    task_name: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer: 
        shutil.copyfileobj(file.file, buffer)
        
    try:
        raw_segments = get_segments_data(temp_path)
        
        # --- NEW: VALIDATION LOGIC ---
        task = db.query(Task).filter(Task.title == task_name).first()
        
        if task and task.steps_json and len(raw_segments) > 0:
            expected_steps = set(step.lower() for step in json.loads(task.steps_json))
            extracted_steps = set(seg['label'].lower() for seg in raw_segments)
            
            # If there is absolutely no overlap between expected and extracted steps
            if len(expected_steps.intersection(extracted_steps)) == 0:
                detected_example = list(extracted_steps)[0].title()
                raise HTTPException(
                    status_code=400, 
                    detail=f"Video mismatch! You are enrolling for '{task_name}' task, but the system detected another task. Please upload the correct video."
                )

        # If validation passes, create the final clips
        final_segments = cut_clips(temp_path, raw_segments, CLIPS_DIR) 
        os.remove(temp_path)
        return {"filename": file.filename, "segments": final_segments}
        
    except HTTPException:
        # Re-raise HTTP exceptions so they reach the frontend
        if os.path.exists(temp_path): os.remove(temp_path)
        raise
    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))


# @app.post("/api/segment")
# async def segment_video_training(file: UploadFile = File(...)):
#     temp_path = f"temp_{file.filename}"
#     with open(temp_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
#     try:
#         raw_segments = get_segments_data(temp_path)
#         final_segments = cut_clips(temp_path, raw_segments, CLIPS_DIR) 
#         os.remove(temp_path)
#         return {"filename": file.filename, "segments": final_segments}
#     except Exception as e:
#         if os.path.exists(temp_path): os.remove(temp_path)
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train")
async def save_graph(payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    task_name = payload.get("task_name")
    segments = payload.get("steps", [])
    
    graph = GTRM_GraphBuilder.build_graph(segments)
    graph_json = json.dumps(graph)
    
    # Find the specific user_task mapping
    task = db.query(Task).filter(Task.title == task_name).first()
    if not task: raise HTTPException(status_code=404, detail="Task not found")

    user_task = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.task_id == task.task_id).first()
    if user_task:
        user_task.training_graph = graph_json
        user_task.status = "enrolled"
        user_task.last_accessed = "Just Now"
        db.commit()
        return {"status": "success", "graph": graph}
    
    raise HTTPException(status_code=404, detail="User task mapping not found")

@app.post("/api/inference")
async def run_inference(task_name: str, user_id: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.title == task_name).first()
    if not task: raise HTTPException(status_code=404, detail="Task not found")

    user_task = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.task_id == task.task_id).first()
    
    if not user_task or not user_task.training_graph:
        return {"status": "error", "message": "Task not enrolled."}
        
    golden_graph = json.loads(user_task.training_graph)
    temp_path = f"temp_inf_{file.filename}"
    with open(temp_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    
    try:
        current_segments = get_segments_data(temp_path)
        
        # --- NEW: VALIDATION LOGIC FOR INFERENCE ---
        if len(current_segments) > 0:
            expected_steps = set(n['label'].lower() for n in golden_graph['nodes'])
            extracted_steps = set(seg['label'].lower() for seg in current_segments)
            
            # If there is absolutely no overlap between expected and extracted steps
            if len(expected_steps.intersection(extracted_steps)) == 0:
                detected_example = list(extracted_steps)[0].title()
                raise HTTPException(
                    status_code=400, 
                    detail=f"Video mismatch! You are monitoring '{task_name}' task, but the system detected another task. Please upload the correct video."
                )
        # -------------------------------------------

        inference_graph = GTRM_GraphBuilder.build_graph(current_segments)
        logs, anomalies = GTRM_GraphBuilder.compare_graphs(golden_graph, inference_graph)
        
        os.remove(temp_path)
        
        return {
            "status": "complete", "anomalies_found": anomalies, "logs": logs,
            "duration": current_segments[-1]['end'] if current_segments else 0
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like our 400 error) so they reach the frontend
        if os.path.exists(temp_path): os.remove(temp_path)
        raise
    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/api/inference")
# async def run_inference(task_name: str, user_id: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
#     task = db.query(Task).filter(Task.title == task_name).first()
#     if not task: raise HTTPException(status_code=404, detail="Task not found")

#     user_task = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.task_id == task.task_id).first()
    
#     if not user_task or not user_task.training_graph:
#         return {"status": "error", "message": "Task not enrolled."}
        
#     golden_graph = json.loads(user_task.training_graph)
#     temp_path = f"temp_inf_{file.filename}"
#     with open(temp_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    
#     try:
#         current_segments = get_segments_data(temp_path)
#         os.remove(temp_path)
#         inference_graph = GTRM_GraphBuilder.build_graph(current_segments)
#         logs, anomalies = GTRM_GraphBuilder.compare_graphs(golden_graph, inference_graph)
        
#         return {
#             "status": "complete", "anomalies_found": anomalies, "logs": logs,
#             "duration": current_segments[-1]['end'] if current_segments else 0
#         }
#     except Exception as e:
#         if os.path.exists(temp_path): os.remove(temp_path)
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/session/complete")
async def complete_session(payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    task_name = payload.get("task_name")
    score = payload.get("score", 0)

    # 1. Save global session log
    new_log = SessionLog(
        user_id=user_id,
        task_name=task_name,
        score=score,
        duration=payload.get("duration", 0),
        anomalies_found=payload.get("anomalies_found", False),
        anomaly_detail=payload.get("anomaly_detail", "Success")
    )
    db.add(new_log)

    # 2. Update specific user_task stats
    task = db.query(Task).filter(Task.title == task_name).first()
    if task:
        user_task = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.task_id == task.task_id).first()
        if user_task:
            current_total = user_task.accuracy * user_task.sessions
            new_total = current_total + score
            user_task.sessions += 1
            user_task.accuracy = new_total / user_task.sessions
            user_task.last_accessed = "Just Now"
    
    db.commit()
    return {"status": "success"}

@app.post("/api/tasks/reset")
async def reset_task(payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    task_name = payload.get("task_name")
    
    task = db.query(Task).filter(Task.title == task_name).first()
    if not task: raise HTTPException(status_code=404, detail="Task not found")

    user_task = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.task_id == task.task_id).first()
    if user_task:
        user_task.status = "available"
        user_task.training_graph = None
        user_task.accuracy = 0.0
        user_task.sessions = 0
        user_task.last_accessed = "Never"
        db.commit()
        return {"status": "success", "message": "Reset complete."}
        
    raise HTTPException(status_code=404, detail="Mapping not found")


# Clinician Global Analytics API (Single-Table Architecture)
@app.get("/api/clinician/analytics")
async def get_clinician_analytics(db: Session = Depends(get_db)):
    # 1. Fetch all session logs globally
    logs = db.query(SessionLog).order_by(SessionLog.timestamp.desc()).all()
    
    total_sessions = len(logs)
    avg_score = sum([l.score for l in logs]) / total_sessions if total_sessions > 0 else 0
    total_anomalies = sum(1 for l in logs if l.anomalies_found)
    
    # Count active enrolled tasks from the global Task table
    active_routines = db.query(Task).filter(Task.status == 'enrolled').count()

    # Determine Cognitive Load (Heuristic based on accuracy)
    cog_load = "Low" if avg_score > 85 else ("Medium" if avg_score > 60 else "High")

    # 2. Format the Session History for the Doctor's Table
    history_list = []
    for log in logs:
        # Categorize the result for the UI badges
        if not log.anomalies_found:
            result_badge = "Success"
        elif "CRITICAL" in str(log.anomaly_detail).upper() or "LEFT ON" in str(log.anomaly_detail).upper():
            result_badge = "Critical"
        else:
            result_badge = "Anomaly"

        history_list.append({
            "timestamp": log.timestamp.strftime("%b %d, %I:%M %p") if log.timestamp else "Just now",
            "task": log.task_name,
            "result": result_badge,
            "errors": log.anomaly_detail if log.anomalies_found else "-",
            "action": "Review Video" if log.anomalies_found else "Archived"
        })

    return {
        "patient": {
            "id": "9281",
            "name": "Yaween De Silva",
            "age": 72, 
            "diagnosis": "Mild Cognitive Impairment (MCI)" 
        },
        "kpi": {
            "adherence_rate": round(avg_score, 1),
            "cognitive_load": cog_load,
            "critical_errors": total_anomalies,
            "active_routines": active_routines
        },
        "history": history_list
    }

# # Patient Analytics API
# @app.get("/api/analytics")
# async def get_analytics(db: Session = Depends(get_db)):
#     total_sessions = db.query(SessionLog).count()
#     logs = db.query(SessionLog).all()
#     avg_score = sum([l.score for l in logs]) / len(logs) if logs else 0
#     total_anomalies = db.query(SessionLog).filter(SessionLog.anomalies_found == True).count()
#     tasks_tracked = db.query(Task).filter(Task.sessions > 0).count()

#     incidents = db.query(SessionLog).filter(SessionLog.anomalies_found == True)\
#         .order_by(SessionLog.timestamp.desc()).limit(5).all()
    
#     incident_list = []
#     for inc in incidents:
#         incident_list.append({
#             "task": inc.task_name,
#             "detail": inc.anomaly_detail,
#             "time": inc.timestamp.strftime("%Y-%m-%d %H:%M") if inc.timestamp else "Just now"
#         })

#     return {
#         "kpi": {
#             "score": round(avg_score, 1),
#             "anomalies": total_anomalies,
#             "tasks_tracked": tasks_tracked,
#             "total_sessions": total_sessions
#         },
#         "incidents": incident_list
#     }

# Patient Analytics API
@app.get("/api/analytics")
async def get_analytics(user_id: str, db: Session = Depends(get_db)):
    # 1. Filter sessions and logs by the specific user_id
    total_sessions = db.query(SessionLog).filter(SessionLog.user_id == user_id).count()
    logs = db.query(SessionLog).filter(SessionLog.user_id == user_id).all()
    
    # 2. Calculate the average score
    avg_score = sum([l.score for l in logs]) / len(logs) if logs else 0
    
    # 3. Filter total anomalies for this specific user
    total_anomalies = db.query(SessionLog).filter(
        SessionLog.user_id == user_id, 
        SessionLog.anomalies_found == True
    ).count()
    
    # 4. CRITICAL FIX: Query UserTask instead of Task to see this user's active tasks
    tasks_tracked = db.query(UserTask).filter(
        UserTask.user_id == user_id, 
        UserTask.sessions > 0
    ).count()

    # 5. Get recent incidents just for this user
    incidents = db.query(SessionLog).filter(
        SessionLog.user_id == user_id, 
        SessionLog.anomalies_found == True
    ).order_by(SessionLog.timestamp.desc()).limit(5).all()
    
    incident_list = []
    for inc in incidents:
        incident_list.append({
            "task": inc.task_name,
            "detail": inc.anomaly_detail,
            "time": inc.timestamp.strftime("%Y-%m-%d %H:%M") if inc.timestamp else "Just now"
        })

    return {
        "kpi": {
            "score": round(avg_score, 1),
            "anomalies": total_anomalies,
            "tasks_tracked": tasks_tracked,
            "total_sessions": total_sessions
        },
        "incidents": incident_list
    }