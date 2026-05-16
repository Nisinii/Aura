import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
import json
import math
import glob
# You need to install rapidfuzz: pip install rapidfuzz
from rapidfuzz.distance import Levenshtein

# --- CONFIGURATION ---
# Define where your test videos and corresponding ground truth .npy files are located
TEST_VIDEOS_DIR = "TestVideos/"
TEST_GT_DIR = "test_ground_truth_1/"

MODEL_SAVE_DIR = "models/"
FINETUNED_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, "finetuned_videomae/")
SAVED_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, "best_syntnet_model.pth")
ACTION_MAP_PATH = os.path.join(MODEL_SAVE_DIR, "action_map.json")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CHUNK_SIZE = 16 # Must match what was used during training/inference

# ==========================================
# --- MODEL DEFINITIONS (Must match exactly) ---
# ==========================================
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


# METRIC CALCULATION FUNCTIONS
def get_labels_start_end_time(frame_wise_labels, bg_class=["background"]):
    labels = []
    starts = []
    ends = []
    last_label = frame_wise_labels[0]
    if last_label not in bg_class:
        labels.append(last_label)
        starts.append(0)
    for i, label in enumerate(frame_wise_labels):
        if label != last_label:
            if last_label not in bg_class:
                ends.append(i)
            if label not in bg_class:
                labels.append(label)
                starts.append(i)
            last_label = label
    if last_label not in bg_class:
        ends.append(len(frame_wise_labels))
    return labels, starts, ends

def jaccard_index(pred_start, pred_end, gt_start, gt_end):
    # Intersection over Union (IoU)
    intersection = max(0, min(pred_end, gt_end) - max(pred_start, gt_start))
    union = max(pred_end, gt_end) - min(pred_start, gt_start)
    return float(intersection) / union if union > 0 else 0

def calculate_f1_at_k(pred_labels, gt_labels, k_thresholds=[0.1, 0.25, 0.50]):
    p_label, p_start, p_end = get_labels_start_end_time(pred_labels)
    y_label, y_start, y_end = get_labels_start_end_time(gt_labels)

    f1_scores = {}
    for k in k_thresholds:
        tp = 0
        fp = 0
        fn = 0

        hits = np.zeros(len(y_label))

        for j in range(len(p_label)):
            iou_max = -1
            hit_idx = -1 
            for i in range(len(y_label)):
                if p_label[j] == y_label[i]:
                    iou = jaccard_index(p_start[j], p_end[j], y_start[i], y_end[i])
                    if iou > iou_max:
                        iou_max = iou
                        hit_idx = i
            
            if iou_max >= k:
                if hits[hit_idx] == 0:
                    tp += 1
                    hits[hit_idx] = 1
                else:
                    fp += 1 # Already matched this GT segment
            else:
                fp += 1 # No overlap or wrong class

        fn = len(y_label) - sum(hits)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        f1_scores[k] = f1 * 100 # Convert to percentage

    return f1_scores

def calculate_edit_score(pred_labels, gt_labels):
    p_seq, _, _ = get_labels_start_end_time(pred_labels)
    y_seq, _, _ = get_labels_start_end_time(gt_labels)
    
    # Convert sequence of labels to string for rapidfuzz Levenshtein calculation
    p_str = "".join([chr(c + 1000) for c in p_seq])
    y_str = "".join([chr(c + 1000) for c in y_seq])
    
    edit_dist = Levenshtein.distance(p_str, y_str)
    max_len = max(len(p_seq), len(y_seq))
    
    if max_len == 0: return 100.0 # Both empty
    edit_score = (1 - edit_dist / max_len) * 100
    return edit_score

def calculate_accuracy(pred_labels, gt_labels):
    return np.mean(pred_labels == gt_labels) * 100

# ==========================================
# --- INFERENCE PIPELINE ---
# ==========================================
def run_inference_and_get_frame_labels(video_path, processor, feature_model, segmentation_model):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): return None, 0
    
    total_frames_video = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()

    if not frames or len(frames) < CHUNK_SIZE: return None, total_frames_video

    # 1. Extract Features (Chunk-wise)
    num_chunks = len(frames) // CHUNK_SIZE
    feature_vectors = []
    for i in range(num_chunks):
        chunk_frames = frames[i*CHUNK_SIZE : (i+1)*CHUNK_SIZE]
        inputs = processor(chunk_frames, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            outputs = feature_model.videomae(**inputs)
            pooled_features = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
            feature_vectors.append(pooled_features)
            
    if not feature_vectors: return None, total_frames_video
    
    # Stack and transpose for SynT-Net: (C, T_chunks)
    features = np.vstack(feature_vectors).T
    features_tensor = torch.tensor(features, dtype=torch.float32).unsqueeze(0).to(DEVICE)

    # 2. Segmentation Inference (Returns chunk-wise predictions)
    with torch.no_grad():
        predictions = segmentation_model(features_tensor, None)
        final_predictions = predictions[-1]
        chunk_labels = torch.argmax(final_predictions, dim=1).squeeze().cpu().numpy()

    # 3. Upsample chunk predictions to frame predictions
    # Repeat each chunk label 16 times
    frame_labels = np.repeat(chunk_labels, CHUNK_SIZE)
    
    # Handle edge cases where video length isn't perfectly divisible by 16
    if len(frame_labels) > total_frames_video:
        # Truncate extra frames
        frame_labels = frame_labels[:total_frames_video]
    elif len(frame_labels) < total_frames_video:
        # Pad the end with the last predicted label
        pad_amount = total_frames_video - len(frame_labels)
        frame_labels = np.pad(frame_labels, (0, pad_amount), 'edge')
        
    return frame_labels, total_frames_video

# ==========================================
# --- MAIN EVALUATION LOOP ---
# ==========================================
def main():
    # Check directories
    if not os.path.exists(TEST_VIDEOS_DIR) or not os.path.exists(TEST_GT_DIR):
        print(f"Error: Test data directories not found. Please create '{TEST_VIDEOS_DIR}' and '{TEST_GT_DIR}'.")
        return

    # Load Resources
    print("--- Loading Models and Maps ---")
    with open(ACTION_MAP_PATH, 'r') as f: action_to_idx = json.load(f)
    NUM_CLASSES = len(action_to_idx)
    
    processor = VideoMAEImageProcessor.from_pretrained(FINETUNED_MODEL_PATH)
    feature_model = VideoMAEForVideoClassification.from_pretrained(FINETUNED_MODEL_PATH).to(DEVICE).eval()
    NUM_FEATURE_DIM = feature_model.config.hidden_size

    # Note: num_layers=8 must match training script
    segmentation_model = SynTNet(num_stages=2, num_layers=8, num_f_maps=64, dim=NUM_FEATURE_DIM, num_classes=NUM_CLASSES)
    segmentation_model.load_state_dict(torch.load(SAVED_MODEL_PATH, map_location=DEVICE))
    segmentation_model.to(DEVICE).eval()

    # Get list of test videos
    test_videos = sorted(glob.glob(os.path.join(TEST_VIDEOS_DIR, "*.mp4")))
    print(f"Found {len(test_videos)} test videos.")

    results = {'Acc': [], 'Edit': [], 'F1@10': [], 'F1@25': [], 'F1@50': []}

    print("\n--- Starting Evaluation ---")
    print(f"{'Video Name':<30} | {'Acc':<6} | {'Edit':<6} | {'F1@10':<6} | {'F1@25':<6} | {'F1@50':<6}")
    print("-" * 80)

    for video_path in test_videos:
        basename = os.path.splitext(os.path.basename(video_path))[0]
        gt_path = os.path.join(TEST_GT_DIR, f"{basename}.npy")

        if not os.path.exists(gt_path):
            print(f"{basename:<30} | Error: GT file not found at {gt_path}")
            continue

        # 1. Load Ground Truth
        gt_labels = np.load(gt_path)

        # 2. Run Inference
        pred_labels, video_len = run_inference_and_get_frame_labels(video_path, processor, feature_model, segmentation_model)
        
        if pred_labels is None:
             print(f"{basename:<30} | Error during inference (video too short?)")
             continue

        # 3. Ensure shapes match (Crucial step)
        # Due to chunking/padding, pred length might differ slightly from GT length.
        # Crop to the minimum common length for fair frame-wise comparison.
        min_len = min(len(pred_labels), len(gt_labels))
        if len(pred_labels) != len(gt_labels):
            # print(f"Debug: Resizing {basename} from Pred:{len(pred_labels)}/GT:{len(gt_labels)} to {min_len}")
            pred_labels = pred_labels[:min_len]
            gt_labels = gt_labels[:min_len]
            
        # 4. Calculate Metrics
        acc = calculate_accuracy(pred_labels, gt_labels)
        edit = calculate_edit_score(pred_labels, gt_labels)
        f1_scores = calculate_f1_at_k(pred_labels, gt_labels)

        # Store results
        results['Acc'].append(acc)
        results['Edit'].append(edit)
        results['F1@10'].append(f1_scores[0.1])
        results['F1@25'].append(f1_scores[0.25])
        results['F1@50'].append(f1_scores[0.50])

        # Print video results
        print(f"{basename:<30} | {acc:6.2f} | {edit:6.2f} | {f1_scores[0.1]:6.2f} | {f1_scores[0.25]:6.2f} | {f1_scores[0.50]:6.2f}")

    # --- Final Averages ---
    print("-" * 80)
    if len(results['Acc']) > 0:
        print(f"FINAL AVERAGES (across {len(results['Acc'])} videos):")
        print(f"  Frame Accuracy: {np.mean(results['Acc']):.2f}%")
        print(f"  Edit Score:     {np.mean(results['Edit']):.2f}")
        print(f"  F1@10:          {np.mean(results['F1@10']):.2f}%")
        print(f"  F1@25:          {np.mean(results['F1@25']):.2f}%")
        print(f"  F1@50:          {np.mean(results['F1@50']):.2f}%")
    else:
        print("No videos were evaluated successfully.")

if __name__ == "__main__":
    main()