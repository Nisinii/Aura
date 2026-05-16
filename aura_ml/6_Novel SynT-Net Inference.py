import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
import json
import math

VIDEO_TO_SEGMENT = "G:\\IIT\\FYP\\FYP Project\\UseLaptopTest_3.mp4" # <-- Put the full path to your video file here.
CLIPS_OUTPUT_DIR = "final_segmented_clips_syntnet/"
MODEL_SAVE_DIR = "models/"
FINETUNED_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, "finetuned_videomae/")
SAVED_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, "best_syntnet_model.pth")
ACTION_MAP_PATH = os.path.join(MODEL_SAVE_DIR, "action_map.json")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class MultiHeadSelfAttention(nn.Module):
    def __init__(self, d_model, num_heads, dropout=0.1):
        super(MultiHeadSelfAttention, self).__init__(); assert d_model % num_heads == 0; self.d_k = d_model // num_heads; self.num_heads = num_heads
        self.linears = nn.ModuleList([nn.Linear(d_model, d_model) for _ in range(4)]); self.dropout = nn.Dropout(dropout)
    def forward(self, query, key, value, mask=None):
        batch_size = query.size(0)
        query, key, value = [l(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2) for l, x in zip(self.linears, (query, key, value))]
        scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None: scores = scores.masked_fill(mask == 0, -1e9)
        p_attn = self.dropout(F.softmax(scores, dim=-1))
        x = torch.matmul(p_attn, value).transpose(1, 2).contiguous().view(batch_size, -1, self.num_heads * self.d_k)
        return self.linears[-1](x)

class SynergisticTemporalFusionBlock(nn.Module):
    def __init__(self, num_f_maps, dilation):
        super(SynergisticTemporalFusionBlock, self).__init__()
        self.tcn_layer = nn.Sequential(nn.Conv1d(num_f_maps, num_f_maps, 3, padding=dilation, dilation=dilation), nn.ReLU(), nn.Dropout(0.1))
        self.attention = MultiHeadSelfAttention(d_model=num_f_maps, num_heads=4)
        self.norm_attn = nn.LayerNorm(num_f_maps)
        self.gate_fc = nn.Sequential(nn.Linear(num_f_maps, num_f_maps // 2), nn.ReLU(), nn.Linear(num_f_maps // 2, num_f_maps), nn.Sigmoid())
        self.norm_final = nn.LayerNorm(num_f_maps)
    def forward(self, x_conv):
        x_attn = x_conv.transpose(1, 2)
        local_features = self.tcn_layer(x_conv)
        global_context = self.attention(x_attn, x_attn, x_attn)
        global_context = self.norm_attn(x_attn + F.dropout(global_context, 0.1))
        global_context_vector = global_context.mean(dim=1) 
        gate = self.gate_fc(global_context_vector).unsqueeze(2)
        gated_local_features = local_features * gate
        final_features = self.norm_final((gated_local_features + local_features).transpose(1,2))
        return final_features.transpose(1, 2)

class SynTNet(nn.Module):
    def __init__(self, num_stages, num_layers, num_f_maps, dim, num_classes):
        super(SynTNet, self).__init__()
        self.conv_1x1_in = nn.Conv1d(dim, num_f_maps, 1)
        self.stages = nn.ModuleList()
        for _ in range(num_stages):
            layers = [SynergisticTemporalFusionBlock(num_f_maps, 2**i) for i in range(num_layers)]
            self.stages.append(nn.Sequential(*layers))
        self.conv_1x1_out = nn.Conv1d(num_f_maps, num_classes, 1)
    def forward(self, x, mask=None):
        out = self.conv_1x1_in(x)
        outputs = []
        for stage in self.stages:
            out = stage(out)
            outputs.append(self.conv_1x1_out(out))
        return outputs

def extract_features(video_path, processor, model):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): return None, None
    fps = cap.get(cv2.CAP_PROP_FPS); frames = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()
    if not frames: return None, None
    num_chunks = len(frames) // 16
    if num_chunks == 0: return None, None
    feature_vectors = []
    for i in range(num_chunks):
        chunk_frames = frames[i*16 : (i+1)*16]
        inputs = processor(chunk_frames, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            outputs = model.videomae(**inputs)
            pooled_features = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
            feature_vectors.append(pooled_features)
    return np.vstack(feature_vectors), fps

def save_clips(original_video_path, predictions, idx_to_action, fps, output_dir):
    print(f"\n-> Generating final segmented clips...")
    cap = cv2.VideoCapture(original_video_path);
    if not cap.isOpened(): return
    current_action_idx, start_chunk, step_counter = -1, 0, 0
    all_segments = []
    for i, label_idx in enumerate(predictions):
        if label_idx != current_action_idx:
            if current_action_idx != -1: all_segments.append((start_chunk * 16, i * 16, current_action_idx))
            current_action_idx = label_idx; start_chunk = i
    if current_action_idx != -1: all_segments.append((start_chunk * 16, len(predictions) * 16, current_action_idx))
    print(f"   Found {len(all_segments)} action segments to save.")
    for start_frame, end_frame, action_idx in all_segments:
        step_counter += 1
        action_name = idx_to_action.get(str(action_idx), "Unknown")
        clean_action_name = "".join(c for c in action_name if c.isalnum() or c in (' ', '_')).rstrip().replace(" ", "_")
        clip_filename = f"{os.path.splitext(os.path.basename(original_video_path))[0]}_step_{step_counter}_{clean_action_name}.mp4"
        clip_path = os.path.join(output_dir, clip_filename)
        writer = None; cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); end_frame = min(end_frame, total_frames)
        for frame_idx in range(start_frame, end_frame):
            ret, frame = cap.read()
            if not ret: break
            if writer is None:
                h, w, _ = frame.shape; writer = cv2.VideoWriter(clip_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))
            writer.write(frame)
        if writer: writer.release()
    cap.release(); print(f"   Done. Clips saved in '{output_dir}'")

def main():
    os.makedirs(CLIPS_OUTPUT_DIR, exist_ok=True)
    video_path = VIDEO_TO_SEGMENT
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at '{video_path}'"); return
    
    with open(ACTION_MAP_PATH, 'r') as f: action_to_idx = json.load(f)
    idx_to_action = {str(i): action for action, i in action_to_idx.items()}
    NUM_CLASSES = len(action_to_idx)
    
    # Loading fine tuned feature extractor
    print("--- Loading Models ---")
    print("1. Loading fine-tuned feature extractor..."); processor = VideoMAEImageProcessor.from_pretrained(FINETUNED_MODEL_PATH)
    feature_extractor_model = VideoMAEForVideoClassification.from_pretrained(FINETUNED_MODEL_PATH).to(DEVICE).eval()
    NUM_FEATURE_DIM = feature_extractor_model.config.hidden_size

    # Loading trained SynT-Net model
    print("2. Loading trained SynT-Net segmentation model...");
    segmentation_model = SynTNet(num_stages=2, num_layers=8, num_f_maps=64, dim=NUM_FEATURE_DIM, num_classes=NUM_CLASSES)
    segmentation_model.load_state_dict(torch.load(SAVED_MODEL_PATH, map_location=DEVICE)); segmentation_model.to(DEVICE).eval()

    # Feature extraction
    print(f"\n--- Processing Video: {os.path.basename(video_path)} ---")
    features, fps = extract_features(video_path, processor, feature_extractor_model)
    if features is None: return

    print(f"   Extracted {features.shape[0]} feature chunks.")
    features_tensor = torch.tensor(features.T, dtype=torch.float32).unsqueeze(0).to(DEVICE)
    
    print("   Running segmentation...")
    with torch.no_grad():
        # Executing the sequence prediction
        predictions = segmentation_model(features_tensor, None)
        final_predictions = predictions[-1]
        predicted_labels = torch.argmax(final_predictions, dim=1).squeeze().cpu().numpy()

    # Segmented clips saving for confirmation
    save_clips(video_path, predicted_labels, idx_to_action, fps, CLIPS_OUTPUT_DIR)
    
    print("\n--- ✅ Inference Complete ---")

if __name__ == "__main__":
    main()
