"""
Create Synthetic Dataset for Testing

Generates fake CSI data and DensePose annotations for testing the pipeline.
For real applications, you need to collect actual CSI data!
"""

import numpy as np
import torch
import os
from pathlib import Path
import pickle
import json
from tqdm import tqdm

# Add parent directory to path
import sys
sys.path.append(str(Path(__file__).parent.parent))

from config.model_config import ModelConfig


def generate_synthetic_csi(num_samples=5, num_frequencies=30, num_tx=3, num_rx=3):
    """
    Generate synthetic CSI data

    In reality, this would come from actual WiFi hardware
    """
    # Amplitude: typically 0-30 dB
    amplitude = np.random.uniform(0, 30, (num_samples, num_frequencies, num_tx, num_rx))

    # Phase: -π to π
    phase = np.random.uniform(-np.pi, np.pi, (num_samples, num_frequencies, num_tx, num_rx))

    return amplitude.astype(np.float32), phase.astype(np.float32)


def generate_synthetic_densepose(image_height=720, image_width=1280):
    """
    Generate synthetic DensePose annotations

    In reality, these would come from labeled data
    """
    # Segmentation: 25 classes (24 body parts + background)
    # Create a simple human silhouette
    segmentation = np.zeros((image_height, image_width), dtype=np.int64)

    # Create a simple standing person in center
    center_x, center_y = image_width // 2, image_height // 2

    # Head (class 1)
    for i in range(-30, 30):
        for j in range(-30, 30):
            if i**2 + j**2 < 900:  # Circle
                y, x = center_y - 200 + i, center_x + j
                if 0 <= y < image_height and 0 <= x < image_width:
                    segmentation[y, x] = 1

    # Torso (class 2)
    for i in range(-50, 100):
        for j in range(-40, 40):
            y, x = center_y - 150 + i, center_x + j
            if 0 <= y < image_height and 0 <= x < image_width:
                segmentation[y, x] = 2

    # Arms (classes 3-6)
    # Left upper arm (class 3)
    for i in range(0, 60):
        for j in range(-15, 0):
            y, x = center_y - 100 + i, center_x - 40 + j
            if 0 <= y < image_height and 0 <= x < image_width:
                segmentation[y, x] = 3

    # Right upper arm (class 4)
    for i in range(0, 60):
        for j in range(0, 15):
            y, x = center_y - 100 + i, center_x + 40 + j
            if 0 <= y < image_height and 0 <= x < image_width:
                segmentation[y, x] = 4

    # Legs (classes 7-10)
    # Left thigh (class 7)
    for i in range(0, 100):
        for j in range(-20, 0):
            y, x = center_y - 50 + i, center_x - 10 + j
            if 0 <= y < image_height and 0 <= x < image_width:
                segmentation[y, x] = 7

    # Right thigh (class 8)
    for i in range(0, 100):
        for j in range(0, 20):
            y, x = center_y - 50 + i, center_x + 10 + j
            if 0 <= y < image_height and 0 <= x < image_width:
                segmentation[y, x] = 8

    # UV coordinates: (2, H, W) for U and V
    # Initialize to -1 (background)
    uv_coords = np.full((2, image_height, image_width), -1.0, dtype=np.float32)

    # Assign UV coordinates to body parts (0-1 range)
    for i in range(image_height):
        for j in range(image_width):
            if segmentation[i, j] > 0:  # Not background
                # Simplified UV mapping (in reality, this is complex)
                uv_coords[0, i, j] = (j / image_width)  # U
                uv_coords[1, i, j] = (i / image_height)  # V

    return segmentation, uv_coords


def generate_synthetic_keypoints(image_height=720, image_width=1280, num_keypoints=17):
    """
    Generate synthetic keypoint annotations

    17 COCO keypoints: nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles
    """
    keypoints = np.zeros((num_keypoints, 3), dtype=np.float32)  # (x, y, visibility)

    center_x, center_y = image_width // 2, image_height // 2

    # Simple standing pose
    keypoint_positions = [
        (center_x, center_y - 200),      # 0: nose
        (center_x - 10, center_y - 215), # 1: left eye
        (center_x + 10, center_y - 215), # 2: right eye
        (center_x - 15, center_y - 205), # 3: left ear
        (center_x + 15, center_y - 205), # 4: right ear
        (center_x - 40, center_y - 100), # 5: left shoulder
        (center_x + 40, center_y - 100), # 6: right shoulder
        (center_x - 55, center_y - 40),  # 7: left elbow
        (center_x + 55, center_y - 40),  # 8: right elbow
        (center_x - 60, center_y + 20),  # 9: left wrist
        (center_x + 60, center_y + 20),  # 10: right wrist
        (center_x - 20, center_y - 50),  # 11: left hip
        (center_x + 20, center_y - 50),  # 12: right hip
        (center_x - 20, center_y + 50),  # 13: left knee
        (center_x + 20, center_y + 50),  # 14: right knee
        (center_x - 20, center_y + 150), # 15: left ankle
        (center_x + 20, center_y + 150), # 16: right ankle
    ]

    for i, (x, y) in enumerate(keypoint_positions):
        keypoints[i] = [x, y, 2]  # visibility=2 (visible)

    return keypoints


def create_dataset(output_dir, num_samples=1000, split='train'):
    """
    Create a synthetic dataset

    Args:
        output_dir: Directory to save dataset
        num_samples: Number of samples to generate
        split: 'train', 'val', or 'test'
    """
    output_path = Path(output_dir) / split
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"Creating {num_samples} synthetic samples for {split} set...")

    samples = []

    for i in tqdm(range(num_samples)):
        # Generate CSI
        amplitude, phase = generate_synthetic_csi()

        # Generate DensePose
        segmentation, uv_coords = generate_synthetic_densepose()

        # Generate keypoints
        keypoints = generate_synthetic_keypoints()

        # Create sample
        sample = {
            'csi_amplitude': amplitude,
            'csi_phase': phase,
            'densepose_segmentation': segmentation,
            'densepose_uv': uv_coords,
            'keypoints': keypoints,
            'image_height': 720,
            'image_width': 1280,
            'sample_id': f'{split}_{i:06d}'
        }

        # Save sample
        sample_path = output_path / f'sample_{i:06d}.pkl'
        with open(sample_path, 'wb') as f:
            pickle.dump(sample, f)

        samples.append({
            'sample_id': sample['sample_id'],
            'file_path': str(sample_path)
        })

    # Save index
    index_path = output_path / 'index.json'
    with open(index_path, 'w') as f:
        json.dump({
            'split': split,
            'num_samples': num_samples,
            'samples': samples
        }, f, indent=2)

    print(f"✓ Created {num_samples} samples in {output_path}")
    print(f"✓ Index saved to {index_path}")


def main():
    """Create synthetic datasets"""

    # Configuration
    dataset_dir = Path(__file__).parent.parent.parent.parent / 'data' / 'wifi_densepose'

    print("="*60)
    print("Creating Synthetic WiFi DensePose Dataset")
    print("="*60)
    print()
    print("⚠️  WARNING: This is SYNTHETIC data for testing only!")
    print("For real applications, you need to collect actual CSI data.")
    print()

    # Create datasets
    create_dataset(dataset_dir, num_samples=1000, split='train')
    create_dataset(dataset_dir, num_samples=200, split='val')
    create_dataset(dataset_dir, num_samples=100, split='test')

    print()
    print("="*60)
    print("✓ Dataset creation complete!")
    print("="*60)
    print()
    print(f"Dataset location: {dataset_dir}")
    print()
    print("Next steps:")
    print("1. Review the generated data")
    print("2. Run training: python scripts/train_model.py")
    print()
    print("For production:")
    print("- Replace synthetic data with real CSI measurements")
    print("- Collect data from actual WiFi hardware (Intel 5300, ESP32, etc.)")
    print("- Pair with real DensePose annotations from images")
    print()


if __name__ == '__main__':
    main()
