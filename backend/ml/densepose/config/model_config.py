"""
Model Configuration for WiFi-DensePose

This file contains all hyperparameters and configuration for the model architecture.
"""

from dataclasses import dataclass, field
from typing import List, Tuple


@dataclass
class CSIConfig:
    """WiFi CSI input configuration"""
    num_samples: int = 5  # Consecutive CSI samples
    num_frequencies: int = 30  # IEEE 802.11n/ac subcarriers
    num_tx_antennas: int = 3
    num_rx_antennas: int = 3
    sampling_rate: int = 100  # Hz

    @property
    def input_shape(self) -> Tuple[int, int, int]:
        """Returns (num_samples * num_frequencies, num_tx, num_rx)"""
        return (self.num_samples * self.num_frequencies,
                self.num_tx_antennas,
                self.num_rx_antennas)


@dataclass
class ModalityTranslationConfig:
    """Modality Translation Network configuration"""
    # Input dimensions
    csi_latent_dim: int = 256

    # Temporal Transformer
    temporal_d_model: int = 256
    temporal_nhead: int = 8
    temporal_num_layers: int = 4
    temporal_dropout: float = 0.1

    # Spatial Attention
    spatial_channels: int = 256
    spatial_reduction: int = 16

    # Progressive Upsampling
    initial_size: Tuple[int, int] = (24, 24)
    upsample_stages: List[Tuple[int, int]] = field(default_factory=lambda: [
        (48, 48),
        (96, 96),
        (180, 180),
        (360, 360),
        (720, 1280)
    ])

    # Output
    output_channels: int = 3
    output_size: Tuple[int, int] = (720, 1280)


@dataclass
class HRNetConfig:
    """HRNet backbone configuration"""
    # Model architecture
    model_name: str = "hrnet_w48"  # hrnet_w32, hrnet_w48
    pretrained: bool = True

    # HRNet specific
    num_stages: int = 4
    num_modules: List[int] = field(default_factory=lambda: [1, 4, 3])
    num_branches: List[int] = field(default_factory=lambda: [2, 3, 4])
    num_blocks: List[int] = field(default_factory=lambda: [4, 4, 4, 4])
    num_channels: List[int] = field(default_factory=lambda: [48, 96, 192, 384])

    # Feature extraction
    feature_channels: List[int] = field(default_factory=lambda: [48, 96, 192, 384])


@dataclass
class TransformerConfig:
    """Transformer decoder configuration"""
    d_model: int = 512
    nhead: int = 8
    num_encoder_layers: int = 6
    num_decoder_layers: int = 6
    dim_feedforward: int = 2048
    dropout: float = 0.1
    activation: str = "relu"
    normalize_before: bool = False


@dataclass
class DensePoseHeadConfig:
    """DensePose head configuration"""
    # Input
    in_channels: int = 512

    # Body parts
    num_body_parts: int = 24  # COCO DensePose standard
    num_classes: int = 25  # 24 parts + 1 background

    # UV coordinates
    uv_channels: int = 2  # U and V coordinates
    uv_resolution: int = 112  # Output resolution

    # Architecture
    hidden_channels: int = 512
    num_conv_layers: int = 8

    # Loss weights
    segmentation_weight: float = 1.0
    uv_weight: float = 1.0


@dataclass
class KeypointHeadConfig:
    """Keypoint detection head configuration"""
    # Input
    in_channels: int = 512

    # Keypoints (COCO format)
    num_keypoints: int = 17
    keypoint_resolution: int = 56

    # Architecture
    hidden_channels: int = 512
    num_conv_layers: int = 8

    # Heatmap generation
    heatmap_sigma: float = 2.0


@dataclass
class ModelConfig:
    """Complete model configuration"""
    # Sub-configurations
    csi: CSIConfig = field(default_factory=CSIConfig)
    modality_translation: ModalityTranslationConfig = field(
        default_factory=ModalityTranslationConfig
    )
    hrnet: HRNetConfig = field(default_factory=HRNetConfig)
    transformer: TransformerConfig = field(default_factory=TransformerConfig)
    densepose_head: DensePoseHeadConfig = field(
        default_factory=DensePoseHeadConfig
    )
    keypoint_head: KeypointHeadConfig = field(
        default_factory=KeypointHeadConfig
    )

    # Model settings
    freeze_backbone: bool = False
    use_transfer_learning: bool = True

    # Device
    device: str = "cuda"  # cuda or cpu

    def to_dict(self):
        """Convert config to dictionary"""
        return {
            'csi': vars(self.csi),
            'modality_translation': vars(self.modality_translation),
            'hrnet': vars(self.hrnet),
            'transformer': vars(self.transformer),
            'densepose_head': vars(self.densepose_head),
            'keypoint_head': vars(self.keypoint_head),
            'freeze_backbone': self.freeze_backbone,
            'use_transfer_learning': self.use_transfer_learning,
            'device': self.device
        }


# Default configuration instance
DEFAULT_CONFIG = ModelConfig()
