# interactive_annotator_v2.py
import cv2
import numpy as np
import os
import json
import glob
import sys
import string

# --- CONFIGURATION ---
VIDEO_DIR = "TestVid/"
GT_OUTPUT_DIR = "test_ground_truth_1/"
MODEL_DIR = "models/"
CHUNK_SIZE = 4
WINDOW_NAME = "Interactive Annotator - Press ESC to input key"

def load_action_map():
    map_path = os.path.join(MODEL_DIR, "action_map.json")
    try:
        with open(map_path, 'r') as f:
            action_to_idx = json.load(f)
        return action_to_idx
    except FileNotFoundError:
        print(f"Error: {map_path} not found.")
        sys.exit(1)

def create_key_map(action_to_idx):
    # Generate a list of available keys: a-z, then A-Z, then 0-9
    keys = list(string.ascii_lowercase + string.ascii_uppercase + string.digits)
    
    key_to_idx = {}
    idx_to_key_action = {}
    
    sorted_actions = sorted(action_to_idx.items(), key=lambda item: item[1])
    
    for i, (action, idx) in enumerate(sorted_actions):
        if i >= len(keys):
            print(f"Error: Too many actions ({len(sorted_actions)}) for available keys.")
            sys.exit(1)
        key = keys[i]
        key_to_idx[key] = idx
        idx_to_key_action[idx] = (key, action)
        
    return key_to_idx, idx_to_key_action

def print_instructions(idx_to_key_action):
    print("\n" + "="*50)
    print("   INTERACTIVE VIDEO ANNOTATOR (KEY MODE)   ")
    print("="*50)
    print("Instructions:")
    print("1. A video window will loop a 16-frame chunk.")
    print("2. Look at the KEY MAPPING below.")
    print("3. Type the SINGLE CHARACTER key in THIS CONSOLE and press ENTER.")
    print("4. The next chunk will load automatically.")
    print("5. Type 'QUIT' (full word) to stop annotating video.")
    print("-" * 50)
    print("KEY MAPPING:")
    sorted_indices = sorted(idx_to_key_action.keys())
    for idx in sorted_indices:
        key, action = idx_to_key_action[idx]
        print(f"  [{key}] : {action:<25} (ID: {idx})")
    print("="*50 + "\n")

def annotate_single_video(video_path, key_to_idx, idx_to_key_action):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened(): print(f"Error opening {video_path}"); return False
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    total_chunks = total_frames // CHUNK_SIZE
    basename = os.path.splitext(os.path.basename(video_path))[0]
    
    print(f"\nStarting Annotation: {basename}.mp4 ({total_frames} frames, ~{total_chunks} chunks)")
    
    chunk_labels = []
    chunk_counter = 0

    while True:
        frames_buffer = []
        for _ in range(CHUNK_SIZE):
            ret, frame = cap.read()
            if not ret: break
            height, width = frame.shape[:2]
            if width > 1280: frame = cv2.resize(frame, (1280, 720))
            frames_buffer.append(frame)

        if not frames_buffer: break 
        
        chunk_counter += 1
        chunk_valid_input = False
        
        while not chunk_valid_input:
            for frame in frames_buffer:
                cv2.imshow(WINDOW_NAME, frame)
                if cv2.waitKey(40) & 0xFF == 27: break 
            
            prompt = f"Chunk {chunk_counter}/{total_chunks+1}. Enter KEY (or 'QUIT'): "
            user_input = input(prompt).strip()
            
            if user_input == 'QUIT':
                print("Quitting video annotation early.")
                cap.release()
                cv2.destroyAllWindows()
                return False

            if len(user_input) == 1 and user_input in key_to_idx:
                label_idx = key_to_idx[user_input]
                _, action_name = idx_to_key_action[label_idx]
                chunk_labels.append(label_idx)
                print(f" -> Labeled as: [{user_input}] {action_name}")
                chunk_valid_input = True
            else:
                print(f"Invalid key: '{user_input}'. Please check the mapping list.")

    cap.release()
    cv2.destroyAllWindows()

    if not chunk_labels: return False

    # Expand chunks to frames
    frame_labels_extended = np.repeat(chunk_labels, CHUNK_SIZE)
    final_gt_labels = frame_labels_extended[:total_frames]
    
    if len(final_gt_labels) != total_frames:
        pad_amount = total_frames - len(final_gt_labels)
        final_gt_labels = np.pad(final_gt_labels, (0, pad_amount), 'edge')
        # print(f"Debug: Padded GT by {pad_amount} frames.")

    output_path = os.path.join(GT_OUTPUT_DIR, f"{basename}_gt.npy")
    np.save(output_path, final_gt_labels)
    print(f"\nSUCCESS: Saved GT to {output_path}")
    return True

def main():
    os.makedirs(GT_OUTPUT_DIR, exist_ok=True)
    action_to_idx = load_action_map()
    key_to_idx, idx_to_key_action = create_key_map(action_to_idx)
    print_instructions(idx_to_key_action)

    video_files = sorted(glob.glob(os.path.join(VIDEO_DIR, "*.mp4")))
    if not video_files: print(f"No videos found in {VIDEO_DIR}"); return

    print(f"Found {len(video_files)} videos to annotate.")
    
    for i, video_path in enumerate(video_files):
        basename = os.path.basename(video_path)
        gt_path = os.path.join(GT_OUTPUT_DIR, f"{os.path.splitext(basename)[0]}_gt.npy")
        
        if os.path.exists(gt_path):
            print(f"\n[{i+1}/{len(video_files)}] Skipping {basename} (GT exists).")
            continue
            
        print(f"\n[{i+1}/{len(video_files)}] Processing {basename}...")
        completed = annotate_single_video(video_path, key_to_idx, idx_to_key_action)
        
        if not completed:
            cont = input("\nVideo annotation aborted. Continue to next video? (y/n): ")
            if cont.lower() != 'y': break
    
    print("\nAnnotation session finished.")

if __name__ == "__main__":
    cv2.namedWindow(WINDOW_NAME)
    cv2.moveWindow(WINDOW_NAME, 0, 0)
    main()