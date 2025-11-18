"""
DensePose Predictor for inference

This module handles inference for the WiFi-DensePose model.
"""

import torch
import numpy as np
from typing import Dict, Optional, Tuple
import cv2
from ..models.wifi_densepose import WiFiDensePose
from ..data.phase_sanitization import PhaseSanitizer
from ..config.model_config import ModelConfig


class DensePosePredictor:
    """
    Predictor class for WiFi-DensePose inference

    Usage:
        predictor = DensePosePredictor('path/to/checkpoint.pth')
        result = predictor.predict(csi_amplitude, csi_phase)
    """

    def __init__(self, checkpoint_path: str, device: str = 'cuda',
                 config: Optional[ModelConfig] = None):
        """
        Args:
            checkpoint_path: Path to model checkpoint
            device: Device to run inference on ('cuda' or 'cpu')
            config: Model configuration (optional, will be loaded from checkpoint)
        """
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')

        # Load checkpoint
        checkpoint = torch.load(checkpoint_path, map_location=self.device)

        # Load config from checkpoint if not provided
        if config is None:
            config_dict = checkpoint.get('config', {})
            config = ModelConfig()
            # Update config with checkpoint values if available

        self.config = config

        # Initialize model
        self.model = WiFiDensePose(config)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.to(self.device)
        self.model.eval()

        # Phase sanitizer
        self.phase_sanitizer = PhaseSanitizer()

        print(f"Loaded model from {checkpoint_path}")
        print(f"Running on device: {self.device}")

    @torch.no_grad()
    def predict(self, csi_amplitude: np.ndarray, csi_phase: np.ndarray,
                return_visualization: bool = True) -> Dict:
        """
        Predict DensePose from WiFi CSI

        Args:
            csi_amplitude: (num_samples, num_frequencies, num_tx, num_rx) amplitude
            csi_phase: (num_samples, num_frequencies, num_tx, num_rx) phase
            return_visualization: Whether to generate visualization

        Returns:
            dict with:
                - 'segmentation': (25, H, W) body part segmentation
                - 'uv_coords': (24, 2, H, W) UV coordinates
                - 'keypoints': (17, 56, 56) keypoint heatmaps
                - 'visualization': visualization image (if requested)
        """
        # Ensure correct shape (150, 3, 3)
        if csi_amplitude.shape[0] * csi_amplitude.shape[1] != 150:
            raise ValueError(f"Expected 150 CSI samples (5 × 30), got {csi_amplitude.shape}")

        # Reshape to (150, 3, 3)
        csi_amplitude = csi_amplitude.reshape(150, 3, 3)
        csi_phase = csi_phase.reshape(150, 3, 3)

        # Convert to tensor
        amplitude_tensor = torch.from_numpy(csi_amplitude).float().unsqueeze(0)  # (1, 150, 3, 3)
        phase_tensor = torch.from_numpy(csi_phase).float().unsqueeze(0)  # (1, 150, 3, 3)

        # Move to device
        amplitude_tensor = amplitude_tensor.to(self.device)
        phase_tensor = phase_tensor.to(self.device)

        # Forward pass
        output = self.model(amplitude_tensor, phase_tensor, return_features=False)

        # Extract predictions
        segmentation = output['densepose']['segmentation'][0].cpu().numpy()  # (25, H, W)
        uv_coords = output['densepose']['uv_coords'][0].cpu().numpy()  # (24, 2, H, W)
        keypoints = output['keypoints'][0].cpu().numpy()  # (17, 56, 56)

        result = {
            'segmentation': segmentation,
            'uv_coords': uv_coords,
            'keypoints': keypoints
        }

        # Generate visualization
        if return_visualization:
            visualization = self.visualize_result(segmentation, uv_coords, keypoints)
            result['visualization'] = visualization

        return result

    def predict_from_raw_csi(self, csi_complex: np.ndarray,
                            return_visualization: bool = True) -> Dict:
        """
        Predict from raw complex CSI (includes phase sanitization)

        Args:
            csi_complex: (num_samples, num_frequencies, num_tx, num_rx) complex CSI
            return_visualization: Whether to generate visualization

        Returns:
            Same as predict()
        """
        # Sanitize phase
        amplitude, phase = self.phase_sanitizer.sanitize(csi_complex)

        # Predict
        return self.predict(amplitude, phase, return_visualization)

    def visualize_result(self, segmentation: np.ndarray, uv_coords: np.ndarray,
                        keypoints: np.ndarray) -> np.ndarray:
        """
        Visualize DensePose result

        Args:
            segmentation: (25, H, W) body part segmentation
            uv_coords: (24, 2, H, W) UV coordinates
            keypoints: (17, 56, 56) keypoint heatmaps

        Returns:
            visualization: (H, W, 3) RGB image
        """
        H, W = segmentation.shape[1:]

        # Create visualization canvas
        vis = np.zeros((H, W, 3), dtype=np.uint8)

        # Color map for body parts
        colors = self._get_body_part_colors()

        # Get predicted body part for each pixel
        part_ids = np.argmax(segmentation, axis=0)  # (H, W)

        # Color each pixel by body part
        for part_id in range(1, 25):  # Skip background (0)
            mask = (part_ids == part_id)
            vis[mask] = colors[part_id - 1]

        # Overlay UV coordinates as texture (optional enhancement)
        # This can be more sophisticated with actual UV texture mapping

        # Draw keypoints
        keypoint_coords = self._extract_keypoint_coordinates(keypoints)
        vis = self._draw_keypoints(vis, keypoint_coords)

        return vis

    def _get_body_part_colors(self) -> np.ndarray:
        """Get color map for 24 body parts"""
        # COCO DensePose body part colors
        colors = np.array([
            [255, 0, 0],    # 1: Torso
            [255, 85, 0],   # 2: Right Hand
            [255, 170, 0],  # 3: Left Hand
            [255, 255, 0],  # 4: Left Foot
            [170, 255, 0],  # 5: Right Foot
            [85, 255, 0],   # 6: Upper Right Leg
            [0, 255, 0],    # 7: Upper Left Leg
            [0, 255, 85],   # 8: Lower Right Leg
            [0, 255, 170],  # 9: Lower Left Leg
            [0, 255, 255],  # 10: Upper Left Arm
            [0, 170, 255],  # 11: Upper Right Arm
            [0, 85, 255],   # 12: Lower Left Arm
            [0, 0, 255],    # 13: Lower Right Arm
            [85, 0, 255],   # 14: Head
            [170, 0, 255],  # 15-24: Additional parts
            [255, 0, 255],
            [255, 0, 170],
            [255, 0, 85],
            [127, 127, 0],
            [127, 0, 127],
            [0, 127, 127],
            [127, 127, 127],
            [64, 64, 64],
            [192, 192, 192]
        ], dtype=np.uint8)

        return colors

    def _extract_keypoint_coordinates(self, keypoint_heatmaps: np.ndarray) -> np.ndarray:
        """
        Extract keypoint coordinates from heatmaps

        Args:
            keypoint_heatmaps: (17, 56, 56) heatmaps

        Returns:
            coordinates: (17, 2) (x, y) coordinates
        """
        num_keypoints = keypoint_heatmaps.shape[0]
        coords = np.zeros((num_keypoints, 2))

        for i in range(num_keypoints):
            heatmap = keypoint_heatmaps[i]
            # Find maximum location
            y, x = np.unravel_index(np.argmax(heatmap), heatmap.shape)
            coords[i] = [x, y]

        return coords

    def _draw_keypoints(self, image: np.ndarray, keypoints: np.ndarray) -> np.ndarray:
        """
        Draw keypoints on image

        Args:
            image: (H, W, 3) image
            keypoints: (17, 2) keypoint coordinates

        Returns:
            image: Image with keypoints drawn
        """
        image = image.copy()
        H, W = image.shape[:2]

        # Scale keypoints to image size
        scale_x = W / 56
        scale_y = H / 56

        # COCO keypoint connections (skeleton)
        skeleton = [
            (0, 1), (0, 2), (1, 3), (2, 4),  # Head
            (5, 6), (5, 7), (7, 9), (6, 8), (8, 10),  # Arms
            (5, 11), (6, 12), (11, 13), (12, 14), (13, 15), (14, 16)  # Legs
        ]

        # Draw skeleton
        for i, j in skeleton:
            pt1 = (int(keypoints[i, 0] * scale_x), int(keypoints[i, 1] * scale_y))
            pt2 = (int(keypoints[j, 0] * scale_x), int(keypoints[j, 1] * scale_y))
            cv2.line(image, pt1, pt2, (0, 255, 0), 2)

        # Draw keypoints
        for i in range(17):
            x = int(keypoints[i, 0] * scale_x)
            y = int(keypoints[i, 1] * scale_y)
            cv2.circle(image, (x, y), 4, (255, 0, 0), -1)

        return image

    def batch_predict(self, csi_amplitude_batch: np.ndarray,
                     csi_phase_batch: np.ndarray) -> list:
        """
        Predict on a batch of CSI samples

        Args:
            csi_amplitude_batch: (batch, 150, 3, 3)
            csi_phase_batch: (batch, 150, 3, 3)

        Returns:
            list of prediction dicts
        """
        results = []

        for i in range(len(csi_amplitude_batch)):
            result = self.predict(
                csi_amplitude_batch[i],
                csi_phase_batch[i],
                return_visualization=True
            )
            results.append(result)

        return results
