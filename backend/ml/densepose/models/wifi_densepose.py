"""
WiFi-DensePose: Complete Model for Dense Human Pose from WiFi

This is the main model that integrates:
1. Modality Translation (CSI → Image domain)
2. HRNet-Transformer Backbone
3. DensePose Head (UV maps)
4. Keypoint Head (17 keypoints)

Reference: "DensePose From WiFi" with HRNet-Transformer enhancements
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, Optional
from .modality_translation import EnhancedModalityTranslation


class HRNetBackbone(nn.Module):
    """
    HRNet-W48 backbone for maintaining high-resolution features

    This is a simplified implementation. For production, use:
    - timm.create_model('hrnet_w48', pretrained=True)
    - Or the official HRNet implementation
    """

    def __init__(self, pretrained: bool = True):
        super().__init__()

        # For now, using a simplified ResNet-like structure
        # Replace with actual HRNet for production
        self.stem = nn.Sequential(
            nn.Conv2d(3, 64, 7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(3, stride=2, padding=1)
        )

        # Stage 1: High resolution (180x320)
        self.stage1 = self._make_stage(64, 48, 4)

        # Stage 2: Multi-resolution (180x320, 90x160)
        self.stage2 = self._make_stage(48, 96, 4)

        # Stage 3: Multi-resolution (180x320, 90x160, 45x80)
        self.stage3 = self._make_stage(96, 192, 4)

        # Stage 4: Multi-resolution (180x320, 90x160, 45x80, 23x40)
        self.stage4 = self._make_stage(192, 384, 4)

        # Feature fusion
        self.fusion = nn.Sequential(
            nn.Conv2d(384, 512, 1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True)
        )

    def _make_stage(self, in_channels, out_channels, num_blocks):
        """Create a stage with multiple residual blocks"""
        layers = []
        for i in range(num_blocks):
            layers.append(nn.Sequential(
                nn.Conv2d(in_channels if i == 0 else out_channels, out_channels, 3, padding=1),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True),
                nn.Conv2d(out_channels, out_channels, 3, padding=1),
                nn.BatchNorm2d(out_channels)
            ))
        return nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, 3, 720, 1280) image-like features

        Returns:
            features: (batch, 512, 180, 320) high-resolution features
        """
        x = self.stem(x)  # (batch, 64, 180, 320)
        x = self.stage1(x)  # (batch, 48, 180, 320)
        x = self.stage2(x)  # (batch, 96, 180, 320)
        x = self.stage3(x)  # (batch, 192, 180, 320)
        x = self.stage4(x)  # (batch, 384, 180, 320)
        x = self.fusion(x)  # (batch, 512, 180, 320)

        return x


class DensePoseHead(nn.Module):
    """
    DensePose head for predicting UV maps

    Outputs:
    - Body part segmentation: (batch, 25, H, W) - 24 parts + background
    - UV coordinates: (batch, 24, 2, H, W) - U and V for each part
    """

    def __init__(self, in_channels: int = 512, num_classes: int = 25,
                 uv_resolution: int = 112):
        super().__init__()

        self.num_classes = num_classes
        self.uv_resolution = uv_resolution

        # Deconvolution layers to increase resolution
        self.deconv = nn.Sequential(
            nn.ConvTranspose2d(in_channels, 512, 4, stride=2, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(512, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True)
        )

        # Coarse segmentation (24 parts + background)
        self.segmentation_head = nn.Sequential(
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, num_classes, 1)
        )

        # UV coordinate regression for each body part
        self.uv_head = nn.Sequential(
            nn.Conv2d(256, 512, 3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.Conv2d(512, (num_classes - 1) * 2, 1)  # 24 parts × 2 (U, V)
        )

    def forward(self, features: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Args:
            features: (batch, 512, 180, 320) high-resolution features

        Returns:
            dict with:
                - 'segmentation': (batch, 25, H, W)
                - 'uv_coords': (batch, 24, 2, H, W)
        """
        # Upsample features
        x = self.deconv(features)  # (batch, 256, 720, 1280)

        # Resize to target resolution
        x = F.interpolate(x, size=(self.uv_resolution, self.uv_resolution),
                         mode='bilinear', align_corners=False)

        # Segmentation
        segmentation = self.segmentation_head(x)  # (batch, 25, 112, 112)

        # UV coordinates
        uv_coords = self.uv_head(x)  # (batch, 48, 112, 112)
        # Reshape to (batch, 24, 2, 112, 112)
        batch_size = uv_coords.shape[0]
        uv_coords = uv_coords.view(batch_size, 24, 2, self.uv_resolution, self.uv_resolution)

        return {
            'segmentation': segmentation,
            'uv_coords': uv_coords
        }


class KeypointHead(nn.Module):
    """
    Keypoint detection head for predicting 17 COCO keypoints

    Outputs:
    - Keypoint heatmaps: (batch, 17, 56, 56)
    """

    def __init__(self, in_channels: int = 512, num_keypoints: int = 17,
                 keypoint_resolution: int = 56):
        super().__init__()

        self.num_keypoints = num_keypoints
        self.keypoint_resolution = keypoint_resolution

        # Deconvolution layers
        self.deconv = nn.Sequential(
            nn.ConvTranspose2d(in_channels, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.ConvTranspose2d(256, 256, 4, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True)
        )

        # Keypoint heatmap prediction
        self.keypoint_head = nn.Sequential(
            nn.Conv2d(256, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, num_keypoints, 1)
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        """
        Args:
            features: (batch, 512, 180, 320) high-resolution features

        Returns:
            keypoint_heatmaps: (batch, 17, 56, 56)
        """
        # Upsample features
        x = self.deconv(features)  # (batch, 256, 720, 1280)

        # Resize to target resolution
        x = F.interpolate(x, size=(self.keypoint_resolution, self.keypoint_resolution),
                         mode='bilinear', align_corners=False)

        # Keypoint heatmaps
        heatmaps = self.keypoint_head(x)  # (batch, 17, 56, 56)

        return heatmaps


class WiFiDensePose(nn.Module):
    """
    Complete WiFi-to-DensePose Model

    Pipeline:
    WiFi CSI (Amplitude + Phase)
        ↓
    Modality Translation Network
        ↓
    HRNet Backbone
        ↓
    ┌─────────────┬─────────────┐
    │ DensePose   │  Keypoint   │
    │ Head        │  Head       │
    └─────────────┴─────────────┘
    """

    def __init__(self, config):
        super().__init__()

        self.config = config

        # Modality Translation: CSI → Image domain
        self.modality_translation = EnhancedModalityTranslation(
            config.modality_translation
        )

        # Backbone: HRNet for high-resolution features
        self.backbone = HRNetBackbone(pretrained=config.hrnet.pretrained)

        # DensePose Head
        self.densepose_head = DensePoseHead(
            in_channels=512,
            num_classes=config.densepose_head.num_classes,
            uv_resolution=config.densepose_head.uv_resolution
        )

        # Keypoint Head
        self.keypoint_head = KeypointHead(
            in_channels=512,
            num_keypoints=config.keypoint_head.num_keypoints,
            keypoint_resolution=config.keypoint_head.keypoint_resolution
        )

    def forward(self, csi_amplitude: torch.Tensor, csi_phase: torch.Tensor,
                return_features: bool = False) -> Dict[str, torch.Tensor]:
        """
        Forward pass

        Args:
            csi_amplitude: (batch, 150, 3, 3) WiFi amplitude
            csi_phase: (batch, 150, 3, 3) WiFi sanitized phase
            return_features: Whether to return intermediate features

        Returns:
            dict with:
                - 'densepose': dict with 'segmentation' and 'uv_coords'
                - 'keypoints': (batch, 17, 56, 56) heatmaps
                - 'image_features': (batch, 3, 720, 1280) if return_features
                - 'backbone_features': (batch, 512, 180, 320) if return_features
        """
        # Step 1: Modality Translation (CSI → Image domain)
        image_features = self.modality_translation(
            csi_amplitude,
            csi_phase
        )  # (batch, 3, 720, 1280)

        # Step 2: Backbone feature extraction
        backbone_features = self.backbone(image_features)  # (batch, 512, 180, 320)

        # Step 3: DensePose prediction
        densepose_output = self.densepose_head(backbone_features)

        # Step 4: Keypoint prediction
        keypoint_output = self.keypoint_head(backbone_features)

        # Prepare output
        output = {
            'densepose': densepose_output,
            'keypoints': keypoint_output
        }

        if return_features:
            output['image_features'] = image_features
            output['backbone_features'] = backbone_features

        return output

    def load_pretrained(self, checkpoint_path: str):
        """Load pretrained weights"""
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        self.load_state_dict(checkpoint['model_state_dict'])
        print(f"Loaded pretrained model from {checkpoint_path}")

    def save_checkpoint(self, path: str, epoch: int, optimizer_state: Optional[dict] = None):
        """Save model checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.state_dict(),
            'config': self.config.to_dict()
        }
        if optimizer_state is not None:
            checkpoint['optimizer_state_dict'] = optimizer_state

        torch.save(checkpoint, path)
        print(f"Saved checkpoint to {path}")


# Test function
def test_wifi_densepose():
    """Test the complete WiFi-DensePose model"""
    from ..config.model_config import ModelConfig

    config = ModelConfig()
    model = WiFiDensePose(config)
    model.eval()

    # Create dummy input
    batch_size = 2
    amplitude = torch.randn(batch_size, 150, 3, 3)
    phase = torch.randn(batch_size, 150, 3, 3)

    # Forward pass
    with torch.no_grad():
        output = model(amplitude, phase, return_features=True)

    print("=" * 60)
    print("WiFi-DensePose Model Test")
    print("=" * 60)
    print(f"Input amplitude shape: {amplitude.shape}")
    print(f"Input phase shape: {phase.shape}")
    print(f"\nOutput shapes:")
    print(f"  - Segmentation: {output['densepose']['segmentation'].shape}")
    print(f"  - UV coords: {output['densepose']['uv_coords'].shape}")
    print(f"  - Keypoints: {output['keypoints'].shape}")
    print(f"  - Image features: {output['image_features'].shape}")
    print(f"  - Backbone features: {output['backbone_features'].shape}")

    # Verify shapes
    assert output['densepose']['segmentation'].shape == (batch_size, 25, 112, 112)
    assert output['densepose']['uv_coords'].shape == (batch_size, 24, 2, 112, 112)
    assert output['keypoints'].shape == (batch_size, 17, 56, 56)
    print("\nAll shape tests passed!")


if __name__ == '__main__':
    test_wifi_densepose()
