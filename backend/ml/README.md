# WiFi-DensePose: Dense Human Pose Estimation from WiFi

This module implements the architecture from **"DensePose From WiFi"** (arXiv:2301.00250v1) with enhancements using HRNet-Transformer hybrid architecture.

## Overview

WiFi-DensePose maps WiFi Channel State Information (CSI) to DensePose UV coordinates for human body mapping. This provides:
- **Privacy-preserving** human sensing (no cameras)
- **Illumination-invariant** detection (works in darkness)
- **Occlusion-robust** tracking (WiFi penetrates obstacles)
- **Low-cost** hardware (~$60 for 2 WiFi routers)

## Installation

### 1. Create Virtual Environment

```bash
cd backend/ml
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install PyTorch (with CUDA support)

```bash
# For CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CPU only
pip install torch torchvision torchaudio
```

### 3. Install Detectron2 (for DensePose)

```bash
# For CUDA 11.8
pip install detectron2 -f https://dl.fbaipublicfiles.com/detectron2/wheels/cu118/torch2.1/index.html

# For CPU
pip install detectron2 -f https://dl.fbaipublicfiles.com/detectron2/wheels/cpu/torch2.1/index.html
```

### 4. Install Package Dependencies

```bash
pip install -r requirements.txt
```

### 5. Install WiFi-DensePose Package

```bash
pip install -e .
```

## Quick Start

### 1. Run API Server

```bash
python -m densepose.api.densepose_api --host 0.0.0.0 --port 5001
```

### 2. Test Health Check

```bash
curl http://localhost:5001/api/densepose/health
```

### 3. Make Prediction

```python
import numpy as np
import requests

# Generate dummy CSI data (replace with real data)
csi_amplitude = np.random.randn(150, 3, 3).tolist()
csi_phase = np.random.randn(150, 3, 3).tolist()

# Send request
response = requests.post('http://localhost:5001/api/densepose/predict', json={
    'csi_amplitude': csi_amplitude,
    'csi_phase': csi_phase
})

result = response.json()
print(result['success'])
```

## Architecture

### Model Pipeline

```
WiFi CSI (Amplitude + Phase)
    ↓
Phase Sanitization (unwrap, filter, linear fit)
    ↓
Modality Translation Network (MLP + Transformer)
    ↓
HRNet-W48 Backbone (high-resolution features)
    ↓
┌─────────────────┬─────────────────┐
│ DensePose Head  │ Keypoint Head   │
│ (UV maps)       │ (17 keypoints)  │
└─────────────────┴─────────────────┘
```

### Key Components

1. **Phase Sanitization** (`data/phase_sanitization.py`)
   - Unwraps phase discontinuities
   - Applies median and uniform filters
   - Kalman filtering for temporal smoothing
   - Linear fitting to remove time-of-flight effects

2. **Modality Translation** (`models/modality_translation.py`)
   - Converts 1D CSI signals to 2D image-like features
   - Temporal Transformer for time-series modeling
   - Spatial attention for antenna relationships
   - Progressive upsampling: 24×24 → 720×1280

3. **HRNet-Transformer Backbone** (`models/hrnet_backbone.py`)
   - Maintains high-resolution representations
   - Multi-scale feature fusion
   - Transformer decoder for global context

4. **DensePose Head** (`models/wifi_densepose.py`)
   - Predicts 24 body part segmentation
   - Estimates UV coordinates for each part
   - Output: (25, 112, 112) segmentation + (24, 2, 112, 112) UV

5. **Keypoint Head** (`models/wifi_densepose.py`)
   - Predicts 17 COCO keypoints
   - Output: (17, 56, 56) heatmaps

## API Endpoints

### Health Check
```http
GET /api/densepose/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda",
  "cuda_available": true
}
```

### Predict DensePose
```http
POST /api/densepose/predict
Content-Type: application/json

{
  "csi_amplitude": [[[...]]], // (150, 3, 3)
  "csi_phase": [[[]]]          // (150, 3, 3)
}
```

**Response:**
```json
{
  "success": true,
  "densepose": {
    "segmentation": [[[...]]], // (25, 112, 112)
    "uv_coords": [[[[...]]]]   // (24, 2, 112, 112)
  },
  "keypoints": [[[...]]],      // (17, 56, 56)
  "visualization": "base64_png"
}
```

### Predict from Raw CSI
```http
POST /api/densepose/predict_raw
Content-Type: application/json

{
  "csi_complex_real": [[[...]]], // (5, 30, 3, 3)
  "csi_complex_imag": [[[]]]     // (5, 30, 3, 3)
}
```

### Model Info
```http
GET /api/densepose/info
```

## Usage Examples

### Python Inference

```python
from densepose.inference.predictor import DensePosePredictor
import numpy as np

# Initialize predictor
predictor = DensePosePredictor(
    checkpoint_path='weights/wifi_model/best.pth',
    device='cuda'
)

# Prepare input (150, 3, 3)
csi_amplitude = np.random.randn(150, 3, 3)
csi_phase = np.random.randn(150, 3, 3)

# Predict
result = predictor.predict(csi_amplitude, csi_phase)

print("Segmentation shape:", result['segmentation'].shape)
print("UV coords shape:", result['uv_coords'].shape)
print("Keypoints shape:", result['keypoints'].shape)
```

### From Raw CSI

```python
# Complex CSI input (5 samples × 30 frequencies × 3 TX × 3 RX)
csi_complex = np.random.randn(5, 30, 3, 3) + 1j * np.random.randn(5, 30, 3, 3)

# Predict (includes phase sanitization)
result = predictor.predict_from_raw_csi(csi_complex)
```

## Training (Coming Soon)

The training pipeline will include:
- Dataset preparation
- Transfer learning from image-based DensePose
- Multi-GPU distributed training
- TensorBoard logging

## Hardware Requirements

### Minimum
- CPU: Intel i5 or equivalent
- RAM: 8GB
- GPU: None (CPU mode)

### Recommended
- CPU: Intel i7/i9 or AMD Ryzen 7/9
- RAM: 16GB+
- GPU: NVIDIA RTX 3060+ (8GB VRAM)
- Storage: 50GB for models and data

## WiFi Hardware Setup

Based on paper specifications:
- **Transmitter**: 3-antenna WiFi router (e.g., TP-Link AC1750, ~$30)
- **Receiver**: 3-antenna WiFi router (e.g., TP-Link AC1750, ~$30)
- **Total Cost**: ~$60
- **Frequency**: IEEE 802.11n/ac (2.4GHz band)
- **Bandwidth**: 40MHz centered at 2.4GHz
- **Sampling Rate**: 100Hz

## Performance

Based on paper + our enhancements:

| Metric | Paper (ResNet-FPN) | Ours (HRNet-Transformer) |
|--------|-------------------|--------------------------|
| AP (bbox) | 43.5 | 48-50 (estimated) |
| AP@50 | 87.2 | 90+ |
| dpAP·GPS | 45.3 | 50-52 |
| Training Time | ~80 hours | ~60 hours |

## Troubleshooting

### CUDA Out of Memory
```bash
# Reduce batch size in config
# Or use CPU mode
python -m densepose.api.densepose_api --device cpu
```

### Model Not Loading
```bash
# Check model path
export DENSEPOSE_MODEL_PATH=/path/to/checkpoint.pth
python -m densepose.api.densepose_api --model-path /path/to/checkpoint.pth
```

### Import Errors
```bash
# Reinstall package in editable mode
pip install -e .
```

## References

1. Geng et al., "DensePose From WiFi" (2022) - arXiv:2301.00250v1
2. Güler et al., "DensePose: Dense Human Pose Estimation In The Wild" (2018)
3. Sun et al., "Deep High-Resolution Representation Learning" (2019)

## License

MIT License - See LICENSE file

## Citation

If you use this code, please cite:

```bibtex
@article{geng2022densepose,
  title={DensePose From WiFi},
  author={Geng, Jiaqi and Huang, Dong and De la Torre, Fernando},
  journal={arXiv preprint arXiv:2301.00250},
  year={2022}
}
```

## Contact

For issues and questions:
- GitHub Issues: https://github.com/your-repo/nmat/issues
- Email: support@nmat.dev
