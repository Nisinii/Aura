import torch
import numpy as np
import os
import cv2
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
import glob

# Configuration
VIDEO_DIR = "dataset_30fps/"
FINETUNED_MODEL_PATH = "models/finetuned_videomae/" 
SPECIALIZED_FEATURES_DIR = "features_finetuned/" 
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def main():
    if not os.path.exists(SPECIALIZED_FEATURES_DIR):
        os.makedirs(SPECIALIZED_FEATURES_DIR)

    # Laoding the fune tuned model
    print(f"Loading SPECIALIZED model from '{FINETUNED_MODEL_PATH}'...")
    processor = VideoMAEImageProcessor.from_pretrained(FINETUNED_MODEL_PATH)
    model = VideoMAEForVideoClassification.from_pretrained(FINETUNED_MODEL_PATH).to(DEVICE)
    model.eval()

    video_files = sorted(glob.glob(os.path.join(VIDEO_DIR, "*.mp4")))
    print(f"Found {len(video_files)} videos to process.")

    for video_path in video_files:
        basename = os.path.basename(video_path).split('.')[0]
        print(f"Processing {basename}...")
        
        cap = cv2.VideoCapture(video_path)
        frames = []
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        cap.release()

        if not frames: continue
        num_chunks = len(frames) // 16
        if num_chunks == 0: continue

        feature_vectors = []
        for i in range(num_chunks):
            chunk_frames = frames[i*16 : (i+1)*16]
            inputs = processor(chunk_frames, return_tensors="pt").to(DEVICE)
            with torch.no_grad():
                outputs = model.videomae(**inputs)
                last_hidden_state = outputs.last_hidden_state
                pooled_features = last_hidden_state.mean(dim=1).cpu().numpy()
                feature_vectors.append(pooled_features)
        
        if feature_vectors:
            output_path = os.path.join(SPECIALIZED_FEATURES_DIR, f"{basename}.npy")
            np.save(output_path, np.vstack(feature_vectors))
            print(f" -> Saved specialized features to {output_path}")

    print("\n--- ✅ Step 4 Complete ---")

if __name__ == "__main__":
    main()
