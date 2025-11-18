"""
WiFi-DensePose: Dense Human Pose Estimation from WiFi Signals

This package implements the architecture from "DensePose From WiFi" (arXiv:2301.00250v1)
with enhancements using HRNet-Transformer hybrid architecture.

Author: NMAT Team
Date: 2025-01-19
"""

__version__ = "1.0.0"
__author__ = "NMAT Team"

from .models.wifi_densepose import WiFiDensePose
from .inference.predictor import DensePosePredictor

__all__ = ['WiFiDensePose', 'DensePosePredictor']
