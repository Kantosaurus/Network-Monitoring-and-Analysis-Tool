"""
Visualization Utilities for WiFi-DensePose

Provides tools for visualizing:
- CSI signals (amplitude and phase)
- DensePose predictions
- 3D body mesh
- Training curves
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib.figure import Figure
import cv2
from typing import Optional, Tuple
import io
from PIL import Image


class DensePoseVisualizer:
    """
    Visualizer for DensePose predictions
    """

    def __init__(self):
        """Initialize visualizer"""
        self.body_part_colors = self._get_body_part_colors()
        self.keypoint_names = self._get_keypoint_names()

    def _get_body_part_colors(self) -> np.ndarray:
        """Get color map for 24 body parts"""
        colors = np.array([
            [255, 0, 0],      # 1: Torso
            [255, 85, 0],     # 2: Right Hand
            [255, 170, 0],    # 3: Left Hand
            [255, 255, 0],    # 4: Left Foot
            [170, 255, 0],    # 5: Right Foot
            [85, 255, 0],     # 6: Upper Right Leg
            [0, 255, 0],      # 7: Upper Left Leg
            [0, 255, 85],     # 8: Lower Right Leg
            [0, 255, 170],    # 9: Lower Left Leg
            [0, 255, 255],    # 10: Upper Left Arm
            [0, 170, 255],    # 11: Upper Right Arm
            [0, 85, 255],     # 12: Lower Left Arm
            [0, 0, 255],      # 13: Lower Right Arm
            [85, 0, 255],     # 14: Head
            [170, 0, 255],    # 15-24: Additional parts
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

    def _get_keypoint_names(self) -> list:
        """Get COCO keypoint names"""
        return [
            'Nose', 'Left Eye', 'Right Eye', 'Left Ear', 'Right Ear',
            'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
            'Left Wrist', 'Right Wrist', 'Left Hip', 'Right Hip',
            'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle'
        ]

    def visualize_segmentation(
        self,
        segmentation: np.ndarray,
        return_image: bool = True
    ) -> np.ndarray:
        """
        Visualize body part segmentation

        Args:
            segmentation: (25, H, W) segmentation logits
            return_image: Whether to return RGB image

        Returns:
            (H, W, 3) RGB image
        """
        # Get predicted parts
        part_ids = np.argmax(segmentation, axis=0)  # (H, W)
        H, W = part_ids.shape

        # Create RGB image
        vis = np.zeros((H, W, 3), dtype=np.uint8)

        # Color each pixel by body part
        for part_id in range(1, 25):  # Skip background
            mask = (part_ids == part_id)
            vis[mask] = self.body_part_colors[part_id - 1]

        return vis

    def visualize_uv_coordinates(
        self,
        uv_coords: np.ndarray,
        segmentation: np.ndarray
    ) -> np.ndarray:
        """
        Visualize UV coordinates as colored overlay

        Args:
            uv_coords: (24, 2, H, W) UV coordinates
            segmentation: (25, H, W) segmentation for masking

        Returns:
            (H, W, 3) RGB image
        """
        H, W = segmentation.shape[1:]
        vis = np.zeros((H, W, 3), dtype=np.uint8)

        # Get predicted parts
        part_ids = np.argmax(segmentation, axis=0)

        # For each body part
        for part_id in range(1, 25):
            mask = (part_ids == part_id)
            if not mask.any():
                continue

            # Get UV for this part
            u = uv_coords[part_id - 1, 0]  # (H, W)
            v = uv_coords[part_id - 1, 1]  # (H, W)

            # Normalize to [0, 255]
            u_norm = ((u - u.min()) / (u.max() - u.min() + 1e-8) * 255).astype(np.uint8)
            v_norm = ((v - v.min()) / (v.max() - v.min() + 1e-8) * 255).astype(np.uint8)

            # Assign to channels (U=Red, V=Green)
            vis[mask, 0] = u_norm[mask]
            vis[mask, 1] = v_norm[mask]

        return vis

    def visualize_keypoints(
        self,
        keypoints: np.ndarray,
        image_size: Tuple[int, int] = (112, 112),
        background: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        Visualize keypoints as overlay on image

        Args:
            keypoints: (17, 56, 56) keypoint heatmaps
            image_size: Output image size (H, W)
            background: Optional background image

        Returns:
            (H, W, 3) RGB image
        """
        H, W = image_size

        # Create or use background
        if background is None:
            vis = np.zeros((H, W, 3), dtype=np.uint8)
        else:
            vis = background.copy()

        # Extract keypoint coordinates from heatmaps
        coords = []
        for k in range(17):
            heatmap = keypoints[k]
            y, x = np.unravel_index(np.argmax(heatmap), heatmap.shape)

            # Scale to image size
            x_scaled = int(x / 56 * W)
            y_scaled = int(y / 56 * H)
            conf = heatmap[y, x]

            coords.append((x_scaled, y_scaled, conf))

        # Draw skeleton connections
        skeleton = [
            (0, 1), (0, 2), (1, 3), (2, 4),  # Head
            (5, 6), (5, 7), (7, 9), (6, 8), (8, 10),  # Arms
            (5, 11), (6, 12), (11, 13), (12, 14), (13, 15), (14, 16)  # Legs
        ]

        for i, j in skeleton:
            x1, y1, conf1 = coords[i]
            x2, y2, conf2 = coords[j]

            if conf1 > 0.3 and conf2 > 0.3:
                cv2.line(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Draw keypoints
        for k, (x, y, conf) in enumerate(coords):
            if conf > 0.3:
                cv2.circle(vis, (x, y), 5, (255, 0, 0), -1)
                cv2.circle(vis, (x, y), 5, (255, 255, 255), 2)

        return vis

    def visualize_complete(
        self,
        segmentation: np.ndarray,
        uv_coords: np.ndarray,
        keypoints: np.ndarray
    ) -> np.ndarray:
        """
        Create complete visualization with all components

        Args:
            segmentation: (25, H, W)
            uv_coords: (24, 2, H, W)
            keypoints: (17, 56, 56)

        Returns:
            (H, W, 3) combined visualization
        """
        # Visualize segmentation
        seg_vis = self.visualize_segmentation(segmentation)

        # Add keypoints overlay
        H, W = seg_vis.shape[:2]
        complete_vis = self.visualize_keypoints(keypoints, (H, W), background=seg_vis)

        return complete_vis


class CSIVisualizer:
    """
    Visualizer for WiFi CSI signals
    """

    def __init__(self):
        """Initialize CSI visualizer"""
        pass

    def visualize_csi_timeseries(
        self,
        amplitude: np.ndarray,
        phase: np.ndarray,
        antenna_pair: int = 0,
        figsize: Tuple[int, int] = (12, 6)
    ) -> Figure:
        """
        Visualize CSI amplitude and phase over time

        Args:
            amplitude: (num_samples, num_frequencies, num_tx, num_rx)
            phase: (num_samples, num_frequencies, num_tx, num_rx)
            antenna_pair: Which antenna pair to visualize (0-8)
            figsize: Figure size

        Returns:
            Matplotlib figure
        """
        # Extract data for selected antenna pair
        tx = antenna_pair // 3
        rx = antenna_pair % 3

        amp_data = amplitude[:, :, tx, rx]  # (num_samples, num_frequencies)
        phase_data = phase[:, :, tx, rx]

        # Create figure
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=figsize)

        # Plot amplitude
        im1 = ax1.imshow(
            amp_data.T,
            aspect='auto',
            cmap='viridis',
            origin='lower'
        )
        ax1.set_title(f'CSI Amplitude (TX{tx+1}-RX{rx+1})')
        ax1.set_xlabel('Time (samples)')
        ax1.set_ylabel('Subcarrier Index')
        plt.colorbar(im1, ax=ax1, label='Amplitude')

        # Plot phase
        im2 = ax2.imshow(
            phase_data.T,
            aspect='auto',
            cmap='twilight',
            origin='lower',
            vmin=-np.pi,
            vmax=np.pi
        )
        ax2.set_title(f'CSI Phase (TX{tx+1}-RX{rx+1})')
        ax2.set_xlabel('Time (samples)')
        ax2.set_ylabel('Subcarrier Index')
        plt.colorbar(im2, ax=ax2, label='Phase (radians)')

        plt.tight_layout()

        return fig

    def visualize_csi_3d(
        self,
        amplitude: np.ndarray,
        figsize: Tuple[int, int] = (10, 8)
    ) -> Figure:
        """
        Visualize CSI amplitude as 3D surface

        Args:
            amplitude: (num_frequencies, num_tx, num_rx)
            figsize: Figure size

        Returns:
            Matplotlib figure
        """
        from mpl_toolkits.mplot3d import Axes3D

        fig = plt.figure(figsize=figsize)
        ax = fig.add_subplot(111, projection='3d')

        # Create mesh grid
        num_freq, num_tx, num_rx = amplitude.shape
        X, Y = np.meshgrid(range(num_tx * num_rx), range(num_freq))

        # Reshape amplitude
        Z = amplitude.reshape(num_freq, -1)

        # Plot surface
        surf = ax.plot_surface(X, Y, Z, cmap='viridis', alpha=0.8)

        ax.set_xlabel('Antenna Pair')
        ax.set_ylabel('Subcarrier Index')
        ax.set_zlabel('Amplitude')
        ax.set_title('CSI Amplitude 3D View')

        fig.colorbar(surf, ax=ax, shrink=0.5)

        return fig


class TrainingVisualizer:
    """
    Visualizer for training curves and metrics
    """

    def __init__(self):
        """Initialize training visualizer"""
        pass

    def plot_training_curves(
        self,
        train_losses: list,
        val_losses: list,
        figsize: Tuple[int, int] = (10, 6)
    ) -> Figure:
        """
        Plot training and validation loss curves

        Args:
            train_losses: List of training losses
            val_losses: List of validation losses
            figsize: Figure size

        Returns:
            Matplotlib figure
        """
        fig, ax = plt.subplots(figsize=figsize)

        ax.plot(train_losses, label='Train Loss', linewidth=2)
        ax.plot(val_losses, label='Val Loss', linewidth=2)

        ax.set_xlabel('Iteration')
        ax.set_ylabel('Loss')
        ax.set_title('Training Curves')
        ax.legend()
        ax.grid(True, alpha=0.3)

        return fig

    def plot_metrics_comparison(
        self,
        metrics_dict: dict,
        figsize: Tuple[int, int] = (12, 6)
    ) -> Figure:
        """
        Plot comparison of multiple metrics

        Args:
            metrics_dict: Dict of metric_name: values
            figsize: Figure size

        Returns:
            Matplotlib figure
        """
        fig, axes = plt.subplots(1, len(metrics_dict), figsize=figsize)

        if len(metrics_dict) == 1:
            axes = [axes]

        for idx, (name, values) in enumerate(metrics_dict.items()):
            axes[idx].plot(values, linewidth=2)
            axes[idx].set_title(name)
            axes[idx].set_xlabel('Iteration')
            axes[idx].grid(True, alpha=0.3)

        plt.tight_layout()

        return fig


def fig_to_array(fig: Figure) -> np.ndarray:
    """
    Convert matplotlib figure to numpy array

    Args:
        fig: Matplotlib figure

    Returns:
        (H, W, 3) RGB image array
    """
    # Save figure to buffer
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)

    # Load image from buffer
    img = Image.open(buf)
    img_array = np.array(img)

    plt.close(fig)

    return img_array[:, :, :3]  # Remove alpha channel if present


# Example usage
if __name__ == "__main__":
    # Create dummy data
    segmentation = np.random.randn(25, 112, 112)
    uv_coords = np.random.randn(24, 2, 112, 112)
    keypoints = np.random.randn(17, 56, 56)

    # Visualize DensePose
    densepose_viz = DensePoseVisualizer()
    result = densepose_viz.visualize_complete(segmentation, uv_coords, keypoints)

    # Save
    Image.fromarray(result).save('densepose_visualization.png')
    print("Visualization saved to densepose_visualization.png")
