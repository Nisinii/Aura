import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import glob
import json
# Note: train_test_split is imported but not used in manual mode
from sklearn.model_selection import train_test_split
import math

FEATURES_DIR = "features_finetuned/" 
PSEUDO_LABELS_DIR = "pseudo_labels/"
MODEL_SAVE_DIR = "models/"
NUM_EPOCHS = 100
BATCH_SIZE = 1
LEARNING_RATE = 0.0005
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
PATIENCE = 10
BEST_MODEL_SAVE_PATH = os.path.join(MODEL_SAVE_DIR, "best_syntnet_model.pth")

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

class VideoActionDataset(Dataset):
    def __init__(self, file_pairs): self.file_pairs = file_pairs
    def __len__(self): return len(self.file_pairs)
    def __getitem__(self, idx):
        feature_path, label_path = self.file_pairs[idx]
        features = np.load(feature_path)
        labels = np.load(label_path)
        return torch.tensor(features.T, dtype=torch.float32), torch.tensor(labels, dtype=torch.long)

def main():
    with open(os.path.join(MODEL_SAVE_DIR, "action_map.json"), 'r') as f: NUM_CLASSES = len(json.load(f))
    
    all_file_pairs = []
    all_basenames = []

    print("--- Gathering data files ---")
    for label_path in glob.glob(os.path.join(PSEUDO_LABELS_DIR, "*.npy")):
        basename = os.path.splitext(os.path.basename(label_path))[0]
        feature_path = os.path.join(FEATURES_DIR, f"{basename}.npy")
        if os.path.exists(feature_path):
            all_file_pairs.append((feature_path, label_path))
            all_basenames.append(basename)
    
    print(f"Found {len(all_file_pairs)} total video feature/label pairs.")

    # --- MANUAL VALIDATION SPLIT ---
    validation_basenames = [
         "GettingUp_07",
         "GettingUp_08",
         "GettingUp_09",
         "GettingUp_10",
         "GettingUp_11",
         "GettingUp_12",
         "GoingToBed_19",
         "GoingToBed_21",
         "GoingToBed_20",
         "GoingToBed_22",
         "GoingToBed_23",
         "GoingToBed_24",
         "UseLaptop_07",
         "UseLaptop_08",
         "UseLaptop_09",
         "UseLaptop_10",
         "UseLaptop_11",
         "UseLaptop_12",
    ]
    
    if not validation_basenames:
        print("\nERROR: The 'validation_basenames' list is empty.")
        print("Please edit the script to manually specify the validation videos.")
        return

    train_files = []
    val_files = []
    val_basenames_found = []
    
    print("\nApplying manual train/validation split...")
    for i, (feature_path, label_path) in enumerate(all_file_pairs):
        basename = all_basenames[i]
        if basename in validation_basenames:
            val_files.append((feature_path, label_path))
            val_basenames_found.append(basename)
        else:
            train_files.append((feature_path, label_path))

    print(f"\n--- Data Split Results (Manual) ---")
    print(f"Training set size: {len(train_files)} videos")
    print(f"Validation set size: {len(val_files)} videos")
    
    found_set = set(val_basenames_found)
    requested_set = set(validation_basenames)
    missing_videos = requested_set - found_set
    if missing_videos:
        print("\nWARNING: The following specified validation videos were NOT found in the data directory:")
        for v in missing_videos:
            print(f" - {v}")
        print("Please check your spelling in the 'validation_basenames' list.")
        if len(val_files) == 0:
             print("Error: Validation set is empty after manual split. Exiting.")
             return

    print("\nVideos selected for Validation:")
    print("---------------------------------")
    task_counts = {"GettingUp": 0, "GoingToBed": 0, "UseLaptop": 0}
    for name in sorted(val_basenames_found):
        print(f" - {name}")
        if name.startswith("GettingUp"): task_counts["GettingUp"] += 1
        elif name.startswith("GoingToBed"): task_counts["GoingToBed"] += 1
        elif name.startswith("UseLaptop"): task_counts["UseLaptop"] += 1
        elif name.startswith("Laptop_"): task_counts["UseLaptop"] += 1 
        
    print("---------------------------------")
    print(f"Validation Task Balance: {task_counts}\n")

    train_dataset = VideoActionDataset(train_files); val_dataset = VideoActionDataset(val_files)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True); val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    sample_features = np.load(all_file_pairs[0][0])
    NUM_FEATURE_DIM = sample_features.shape[1]
    print(f"Correctly detected feature dimension: {NUM_FEATURE_DIM}")
    
    model = SynTNet(num_stages=2, num_layers=8, num_f_maps=64, dim=NUM_FEATURE_DIM, num_classes=NUM_CLASSES)
    model.to(DEVICE)
    
    criterion = nn.CrossEntropyLoss(); 
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)

    print("--- Starting Training with Novel SynT-Net Model ---")
    best_val_loss = float('inf'); epochs_no_improve = 0
    for epoch in range(NUM_EPOCHS):
        model.train(); train_loss = 0
        for features, labels in train_loader:
            features, labels = features.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            predictions = model(features, None)
            loss = sum(criterion(p, labels) for p in predictions)
            loss.backward(); optimizer.step()
            train_loss += loss.item()
        avg_train_loss = train_loss / len(train_loader)
        
        model.eval(); val_loss = 0
        with torch.no_grad():
            for features, labels in val_loader:
                features, labels = features.to(DEVICE), labels.to(DEVICE)
                predictions = model(features, None)
                loss = sum(criterion(p, labels) for p in predictions)
                val_loss += loss.item()
        avg_val_loss = val_loss / len(val_loader)
        
        print(f"Epoch [{epoch+1}/{NUM_EPOCHS}], Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss; epochs_no_improve = 0
            torch.save(model.state_dict(), BEST_MODEL_SAVE_PATH)
            print(" -> Val loss improved. Saving best SynT-Net model.")
        else:
            epochs_no_improve += 1
        if epochs_no_improve >= PATIENCE: print(f"\n--- Early stopping triggered. ---"); break
            
    print(f"final Training Complete")

if __name__ == "__main__":
    main()

