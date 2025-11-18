"""
Modality Translation Network: CSI Domain → Image Domain

Enhanced version of the paper's modality translation with:
- Temporal Transformer for time-series modeling
- Spatial attention for antenna relationships
- Progressive upsampling for better quality

Reference: "DensePose From WiFi" Section 3.2
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from einops import rearrange, repeat
from typing import Tuple


class TemporalTransformer(nn.Module):
    """
    Transformer encoder for temporal CSI modeling

    Input: (batch, seq_len, d_model)
    Output: (batch, seq_len, d_model)
    """

    def __init__(self, d_model: int = 256, nhead: int = 8,
                 num_layers: int = 4, dropout: float = 0.1):
        super().__init__()

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            activation='gelu',
            batch_first=True
        )

        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_layers
        )

        self.pos_embedding = nn.Parameter(torch.randn(1, 150, d_model))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, 150, d_model)

        Returns:
            out: (batch, 150, d_model)
        """
        # Add positional embedding
        x = x + self.pos_embedding

        # Transformer encoding
        out = self.transformer(x)

        return out


class SpatialAttention(nn.Module):
    """
    Spatial attention module for 3×3 antenna relationships

    This captures the spatial relationships between transmitter-receiver pairs.
    """

    def __init__(self, in_channels: int = 256, reduction: int = 16):
        super().__init__()

        self.attention = nn.Sequential(
            nn.Conv2d(in_channels, in_channels // reduction, 1),
            nn.ReLU(inplace=True),
            nn.Conv2d(in_channels // reduction, in_channels, 1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, channels, 3, 3)

        Returns:
            out: (batch, channels, 3, 3)
        """
        attn_weights = self.attention(x)
        return x * attn_weights


class ProgressiveUpsampling(nn.Module):
    """
    Progressive upsampling from 24×24 to 720×1280

    Stages: 24×24 → 48×48 → 96×96 → 180×180 → 360×360 → 720×1280
    """

    def __init__(self, in_channels: int = 256, out_channels: int = 3):
        super().__init__()

        # Stage 1: 24×24 → 48×48
        self.up1 = nn.Sequential(
            nn.Conv2d(in_channels, 256, 3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )

        # Stage 2: 48×48 → 96×96
        self.up2 = nn.Sequential(
            nn.Conv2d(256, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )

        # Stage 3: 96×96 → 180×180 (custom size)
        self.up3 = nn.Sequential(
            nn.Conv2d(128, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Upsample(size=(180, 180), mode='bilinear', align_corners=False)
        )

        # Stage 4: 180×180 → 360×360
        self.up4 = nn.Sequential(
            nn.Conv2d(64, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False)
        )

        # Stage 5: 360×360 → 720×1280 (custom size)
        self.up5 = nn.Sequential(
            nn.Conv2d(32, 16, 3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.Upsample(size=(720, 1280), mode='bilinear', align_corners=False)
        )

        # Final convolution
        self.final = nn.Conv2d(16, out_channels, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, in_channels, 24, 24)

        Returns:
            out: (batch, out_channels, 720, 1280)
        """
        x = self.up1(x)  # 48×48
        x = self.up2(x)  # 96×96
        x = self.up3(x)  # 180×180
        x = self.up4(x)  # 360×360
        x = self.up5(x)  # 720×1280
        x = self.final(x)

        return x


class EnhancedModalityTranslation(nn.Module):
    """
    Enhanced Modality Translation Network: CSI → Image Domain

    Architecture:
    1. Amplitude & Phase Encoders (MLP)
    2. Feature Fusion (MLP)
    3. Temporal Transformer (captures time-series patterns)
    4. Spatial Attention (captures antenna relationships)
    5. Reshape to 2D (24×24)
    6. Progressive Upsampling (→ 720×1280)
    """

    def __init__(self, config):
        super().__init__()

        self.config = config
        csi_input_dim = 150 * 3 * 3  # 5 samples × 30 freq × 3 TX × 3 RX (flattened)
        latent_dim = config.csi_latent_dim

        # Amplitude Encoder
        self.amplitude_encoder = nn.Sequential(
            nn.Linear(csi_input_dim, 1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(1024, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, latent_dim)
        )

        # Phase Encoder
        self.phase_encoder = nn.Sequential(
            nn.Linear(csi_input_dim, 1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(1024, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, latent_dim)
        )

        # Feature Fusion
        self.feature_fusion = nn.Sequential(
            nn.Linear(latent_dim * 2, latent_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(latent_dim, latent_dim)
        )

        # Temporal Transformer
        self.temporal_transformer = TemporalTransformer(
            d_model=config.temporal_d_model,
            nhead=config.temporal_nhead,
            num_layers=config.temporal_num_layers,
            dropout=config.temporal_dropout
        )

        # Reshape projection
        self.reshape_proj = nn.Linear(latent_dim, 256 * 24 * 24)

        # Spatial Attention
        self.spatial_attention = SpatialAttention(
            in_channels=256,
            reduction=config.spatial_reduction
        )

        # Progressive Upsampling
        self.progressive_upsample = ProgressiveUpsampling(
            in_channels=256,
            out_channels=config.output_channels
        )

    def forward(self, amplitude: torch.Tensor, phase: torch.Tensor) -> torch.Tensor:
        """
        Args:
            amplitude: (batch, 150, 3, 3) WiFi amplitude
            phase: (batch, 150, 3, 3) WiFi sanitized phase

        Returns:
            image_features: (batch, 3, 720, 1280) image-like features
        """
        batch_size = amplitude.shape[0]

        # Flatten inputs
        amplitude_flat = amplitude.view(batch_size, -1)  # (batch, 1350)
        phase_flat = phase.view(batch_size, -1)  # (batch, 1350)

        # Encode amplitude and phase separately
        amp_features = self.amplitude_encoder(amplitude_flat)  # (batch, latent_dim)
        phase_features = self.phase_encoder(phase_flat)  # (batch, latent_dim)

        # Fuse features
        fused = torch.cat([amp_features, phase_features], dim=1)  # (batch, 2*latent_dim)
        fused = self.feature_fusion(fused)  # (batch, latent_dim)

        # Reshape for temporal modeling
        # We treat the latent vector as a sequence for temporal processing
        fused_seq = fused.unsqueeze(1).expand(-1, 150, -1)  # (batch, 150, latent_dim)

        # Temporal transformer
        temporal_features = self.temporal_transformer(fused_seq)  # (batch, 150, latent_dim)

        # Pool temporal features
        temporal_pooled = torch.mean(temporal_features, dim=1)  # (batch, latent_dim)

        # Project to 2D feature map (24×24)
        features_2d = self.reshape_proj(temporal_pooled)  # (batch, 256*24*24)
        features_2d = features_2d.view(batch_size, 256, 24, 24)  # (batch, 256, 24, 24)

        # Spatial attention
        features_2d = self.spatial_attention(features_2d)  # (batch, 256, 24, 24)

        # Progressive upsampling to image size
        image_features = self.progressive_upsample(features_2d)  # (batch, 3, 720, 1280)

        return image_features


# Test function
def test_modality_translation():
    """Test the modality translation network"""
    from ..config.model_config import ModalityTranslationConfig

    config = ModalityTranslationConfig()

    model = EnhancedModalityTranslation(config)
    model.eval()

    # Create dummy input
    batch_size = 2
    amplitude = torch.randn(batch_size, 150, 3, 3)
    phase = torch.randn(batch_size, 150, 3, 3)

    # Forward pass
    with torch.no_grad():
        output = model(amplitude, phase)

    print(f"Input amplitude shape: {amplitude.shape}")
    print(f"Input phase shape: {phase.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Expected output shape: (2, 3, 720, 1280)")

    assert output.shape == (batch_size, 3, 720, 1280), "Output shape mismatch!"
    print("Test passed!")


if __name__ == '__main__':
    test_modality_translation()
