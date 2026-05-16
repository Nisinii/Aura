import torch
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import glob
import json
import os
import cv2
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
from torch.cuda.amp import GradScaler, autocast

VIDEO_DIR = "dataset_30fps/"
PSEUDO_LABELS_DIR = "pseudo_labels/" 
MODEL_SAVE_DIR = "models/"
FINETUNED_MODEL_SAVE_PATH = os.path.join(MODEL_SAVE_DIR, "finetuned_videomae/")
NUM_EPOCHS = 10
BATCH_SIZE = 8
LEARNING_RATE = 5e-5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class VideoFineTuneDataset(Dataset):
    def __init__(self, data_samples, processor):
        self.data_samples = data_samples
        self.processor = processor
        self.video_cache = {} 
    def __len__(self):
        return len(self.data_samples)
    def __getitem__(self, idx):
        video_path, chunk_index, label = self.data_samples[idx]
        if video_path not in self.video_cache:
            self.video_cache[video_path] = cv2.VideoCapture(video_path)
        cap = self.video_cache[video_path]
        start_frame = chunk_index * 16
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        frames = []
        for _ in range(16):
            ret, frame = cap.read()
            if not ret: break
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if len(frames) < 16:
            return self.__getitem__(0)
        processed_video = self.processor(list(frames), return_tensors="pt")
        pixel_values = processed_video["pixel_values"].squeeze(0)
        return pixel_values, torch.tensor(label, dtype=torch.long)

def main():
    if not os.path.exists(FINETUNED_MODEL_SAVE_PATH):
        os.makedirs(FINETUNED_MODEL_SAVE_PATH)

    with open(os.path.join(MODEL_SAVE_DIR, "action_map.json"), 'r') as f:
        action_to_idx = json.load(f)
    NUM_CLASSES = len(action_to_idx)

    all_data_samples = []
    label_files = sorted(glob.glob(os.path.join(PSEUDO_LABELS_DIR, "*.npy")))
    for label_path in label_files:
        basename = os.path.basename(label_path).split('.')[0]
        video_path = os.path.join(VIDEO_DIR, f"{basename}.mp4")
        if os.path.exists(video_path):
            labels = np.load(label_path)
            for chunk_index, label in enumerate(labels):
                all_data_samples.append((video_path, chunk_index, label))

    print(f"Created {len(all_data_samples)} total training samples for fine-tuning.")
    
    # Load the pretrained VideoMAE image processor
    processor = VideoMAEImageProcessor.from_pretrained("MCG-NJU/videomae-base")
    model = VideoMAEForVideoClassification.from_pretrained(
        "MCG-NJU/videomae-base", 
        num_labels=NUM_CLASSES,
        ignore_mismatched_sizes=True
    ).to(DEVICE)

    # Create dataset object that prepares video samples and applies preprocessing using the processor
    dataset = VideoFineTuneDataset(all_data_samples, processor)
    # DataLoader handles batching and shuffling during training
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)
    # Adam optimizer for updating model parameters
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scaler = GradScaler()
    
    print("\n--- Starting Fine-Tuning ---")
    # Training loop across epochs
    model.train()
    for epoch in range(NUM_EPOCHS):
        total_loss = 0
        for i, (pixel_values, labels) in enumerate(dataloader):
            pixel_values = pixel_values.to(DEVICE)
            labels = labels.to(DEVICE)
            optimizer.zero_grad()
            with autocast():
                outputs = model(pixel_values=pixel_values, labels=labels)
                loss = outputs.loss
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            total_loss += loss.item()
            print(f"Epoch [{epoch+1}/{NUM_EPOCHS}], Batch [{i+1}/{len(dataloader)}], Loss: {loss.item():.4f}", end='\r')

        # Compute average loss for the epoch
        avg_loss = total_loss / len(dataloader)
        print(f"\nEpoch [{epoch+1}/{NUM_EPOCHS}], Average Loss: {avg_loss:.4f}")

    # Save fine-tuned model weights
    model.save_pretrained(FINETUNED_MODEL_SAVE_PATH)
    processor.save_pretrained(FINETUNED_MODEL_SAVE_PATH)
    print(f"\n Model Saved Successfully ")

if __name__ == "__main__":
    main()