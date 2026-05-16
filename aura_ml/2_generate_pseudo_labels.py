import os
import numpy as np
import glob
from dtw import dtw
from sklearn.cluster import KMeans
import json
import joblib
from scipy.spatial.distance import cdist
import cv2

FEATURES_DIR = "features/"
TRANSCRIPTS_DIR = "transcripts/"
VIDEO_DIR = "dataset_30fps/"
PSEUDO_LABELS_DIR = "pseudo_labels/"
MODEL_SAVE_DIR = "models/"
CLIPS_OUTPUT_DIR = "visual_verification_clips/"
TEMPORAL_PENALTY_WEIGHT = 3.0

def build_action_map(transcripts_dir):
    all_actions = set()
    transcript_files = glob.glob(os.path.join(transcripts_dir, "*.txt"))
    for file_path in transcript_files:
        with open(file_path, 'r') as f:
            actions = [line.strip() for line in f if line.strip()]
            all_actions.update(actions)
    
    action_list = sorted(list(all_actions))
    action_to_idx = {action: i for i, action in enumerate(action_list)}
    return action_to_idx

def generate_labels(feature_path, transcript_path, output_path, action_to_idx, kmeans_model):
    # Load extracted video features 
    video_features = np.load(feature_path)
    with open(transcript_path, 'r') as f:
        actions_in_transcript = [line.strip() for line in f if line.strip()]
    
    # Convert action names into numerical indices using the action map
    action_indices_in_transcript = [action_to_idx[action] for action in actions_in_transcript]

    num_video_chunks = video_features.shape[0]
    num_transcript_steps = len(action_indices_in_transcript)
    
    # Stores visual similarity cost between each video chunk and each transcript action prototype
    visual_cost_matrix = np.zeros((num_video_chunks, num_transcript_steps))
    for j in range(num_transcript_steps):
        action_idx = action_indices_in_transcript[j]
        action_prototype = kmeans_model.cluster_centers_[action_idx]
        distances = cdist(video_features, action_prototype.reshape(1, -1), metric='cosine')
        visual_cost_matrix[:, j] = distances.squeeze()

    # Penalizes mismatches in temporal ordering between video progression and transcript progression
    temporal_cost_matrix = np.zeros_like(visual_cost_matrix)
    for i in range(num_video_chunks):
        for j in range(num_transcript_steps):
            temporal_distance = abs(i / num_video_chunks - j / num_transcript_steps)
            temporal_cost_matrix[i, j] = temporal_distance
    combined_cost_matrix = visual_cost_matrix + TEMPORAL_PENALTY_WEIGHT * temporal_cost_matrix

    # Finds optimal alignment path between video chunks and transcript action steps
    alignment = dtw(combined_cost_matrix, keep_internals=True)
    path_x = alignment.index1
    path_y = alignment.index2

    # Assign an action label to each video chunk based on the closest DTW alignment step
    pseudo_labels = np.zeros(num_video_chunks, dtype=int)
    for i in range(num_video_chunks):
        closest_path_idx = np.argmin(np.abs(path_x - i))
        assigned_transcript_step_idx = path_y[closest_path_idx]
        pseudo_labels[i] = action_indices_in_transcript[assigned_transcript_step_idx]

    np.save(output_path, pseudo_labels)
    print(f"  -> Saved pseudo-labels to {output_path}")
    return pseudo_labels

def save_clips_for_verification(original_video_path, pseudo_labels, idx_to_action, output_dir):
    print(f"  -> Generating verification clips for {os.path.basename(original_video_path)}...")
    
    cap = cv2.VideoCapture(original_video_path)
    if not cap.isOpened():
        print(f"     Error: Could not open video file {original_video_path}")
        return
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    current_action_idx = -1
    start_chunk = 0
    step_counter = 0
    for i, label_idx in enumerate(pseudo_labels):
        if label_idx != current_action_idx:
            if current_action_idx != -1:
                step_counter += 1
                start_frame = start_chunk * 16
                end_frame = i * 16
                action_name = idx_to_action.get(current_action_idx, "Unknown")
                
                clean_action_name = "".join(c for c in action_name if c.isalnum() or c in (' ', '_')).rstrip()
                clip_filename = f"{os.path.basename(original_video_path).split('.')[0]}_step_{step_counter}_{clean_action_name}.mp4"
                clip_path = os.path.join(output_dir, clip_filename)

                writer = None
                cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
                for frame_idx in range(start_frame, end_frame):
                    ret, frame = cap.read()
                    if not ret: break
                    if writer is None:
                        h, w, _ = frame.shape
                        writer = cv2.VideoWriter(clip_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))
                    writer.write(frame)
                if writer: writer.release()
                
            current_action_idx = label_idx
            start_chunk = i
            
    step_counter += 1
    start_frame = start_chunk * 16
    end_frame = len(pseudo_labels) * 16
    action_name = idx_to_action.get(current_action_idx, "Unknown")
    clean_action_name = "".join(c for c in action_name if c.isalnum() or c in (' ', '_')).rstrip()
    clip_filename = f"{os.path.basename(original_video_path).split('.')[0]}_step_{step_counter}_{clean_action_name}.mp4"
    clip_path = os.path.join(output_dir, clip_filename)
    
    writer = None
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    for frame_idx in range(start_frame, end_frame):
        ret, frame = cap.read()
        if not ret: break
        if writer is None:
            h, w, _ = frame.shape
            writer = cv2.VideoWriter(clip_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (w, h))
        writer.write(frame)
    if writer: writer.release()
    
    cap.release()
    print(f"     Done. Clips saved in '{output_dir}'")


def main():
    for dir_path in [PSEUDO_LABELS_DIR, MODEL_SAVE_DIR, CLIPS_OUTPUT_DIR]:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

    print("Building action map from all transcripts...")
    action_to_idx = build_action_map(TRANSCRIPTS_DIR)
    idx_to_action = {i: action for action, i in action_to_idx.items()}
    num_unique_actions = len(action_to_idx)
    
    action_map_path = os.path.join(MODEL_SAVE_DIR, "action_map.json")
    with open(action_map_path, 'w') as f:
        json.dump(action_to_idx, f, indent=4)
    print(f"Action map saved. Total unique actions: {num_unique_actions}")

    print("Loading all features to create action prototypes...")
    all_features = []
    feature_files = glob.glob(os.path.join(FEATURES_DIR, "*.npy"))
    for feature_file in feature_files:
        features = np.load(feature_file)
        all_features.append(features)
    
    if not all_features:
        print("Error: No feature files found. Please run script 1 first.")
        return
        
    stacked_features = np.vstack(all_features)

    print(f"Training K-Means model with K={num_unique_actions}...")
    kmeans = KMeans(n_clusters=num_unique_actions, random_state=42, n_init=10)
    kmeans.fit(stacked_features)
    
    kmeans_path = os.path.join(MODEL_SAVE_DIR, "kmeans_prototypes.joblib")
    joblib.dump(kmeans, kmeans_path)
    print(f"K-Means model saved to {kmeans_path}")

    for feature_file in feature_files:
        basename = os.path.basename(feature_file).split('.')[0]
        transcript_path = os.path.join(TRANSCRIPTS_DIR, f"{basename}.txt")
        original_video_path = os.path.join(VIDEO_DIR, f"{basename}.mp4")
        output_path = os.path.join(PSEUDO_LABELS_DIR, f"{basename}.npy")

        if os.path.exists(transcript_path) and os.path.exists(original_video_path):
            print(f"\nProcessing {basename}...")
            pseudo_labels = generate_labels(feature_file, transcript_path, output_path, action_to_idx, kmeans)
            save_clips_for_verification(original_video_path, pseudo_labels, idx_to_action, CLIPS_OUTPUT_DIR)
        else:
            if not os.path.exists(transcript_path):
                print(f"Warning: Transcript not found for {basename}")
            if not os.path.exists(original_video_path):
                print(f"Warning: Original video not found for {basename}")

if __name__ == "__main__":
    main()
