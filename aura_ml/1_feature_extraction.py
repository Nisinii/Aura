import os
import cv2
import torch
import numpy as np
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
import glob

# Configurations
VIDEO_DIR = "dataset_30fps/"
FEATURES_DIR = "features/"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def extract_and_save_features(video_path, output_path, processor, model):
    # Extracts features for a single video and saves them
    cap = cv2.VideoCapture(video_path)
    frames = []
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()

    if not frames: return

    # Divide into specific number of chunks (16)
    num_chunks = len(frames) 
    feature_vectors = []
    for i in range(num_chunks):
        chunk_frames = frames[i*16 : (i+1)*16]
        inputs = processor(chunk_frames, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            outputs = model(**inputs, output_hidden_states=True)
            cls_feature = outputs.hidden_states[-1][:, 0, :].cpu().numpy()
            feature_vectors.append(cls_feature)

    if not feature_vectors: return
    
    # Saving feature vectors
    final_features = np.vstack(feature_vectors)
    np.save(output_path, final_features)
    print(f"  -> Saved features to {output_path}")

def main():
    print(f"Using device: {DEVICE}")
    print("Loading pre-trained VideoMAE model...")
    processor = VideoMAEImageProcessor.from_pretrained("MCG-NJU/videomae-base")
    model = VideoMAEForVideoClassification.from_pretrained("MCG-NJU/videomae-base").to(DEVICE)
    model.eval() # Set model to evaluation mode

    if not os.path.exists(FEATURES_DIR):
        os.makedirs(FEATURES_DIR)

    video_files = glob.glob(os.path.join(VIDEO_DIR, "*.mp4"))
    for video_file in video_files:
        basename = os.path.basename(video_file).split('.')[0]
        output_path = os.path.join(FEATURES_DIR, f"{basename}.npy")
        print(f"Processing {video_file}...")
        extract_and_save_features(video_file, output_path, processor, model)

if __name__ == "__main__":
    main()