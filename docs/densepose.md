# DensePose from WiFi - Implementation Plan

## Overview
This document outlines the implementation plan for mapping WiFi Channel State Information (CSI) to DensePose UV coordinates for human body mapping in the NMAT application.

## Research Paper Summary
**Paper**: "DensePose From WiFi" (arXiv:2301.00250v1)
**Authors**: Jiaqi Geng, Dong Huang, Fernando De la Torre (Carnegie Mellon University)

### Key Findings:
- Uses standard WiFi routers (IEEE 802.11n/ac, 2.4GHz) instead of expensive LiDAR/radar
- Achieves dense pose estimation comparable to image-based approaches
- Hardware: 3 transmitter + 3 receiver antennas (~$60 total cost)
- Input: WiFi CSI amplitude + phase → Output: UV maps for 24 body parts

---

## Architecture Overview

### Paper Architecture vs. Proposed Enhancement

#### Original Paper Architecture:
```
WiFi CSI (150×3×3)
  ├─ Phase Sanitization
  └─ Amplitude Extraction
       ↓
Modality Translation Network (MLP-based)
  ├─ Amplitude Encoder (MLP)
  ├─ Phase Encoder (MLP)
  ├─ Feature Fusion (MLP)
  └─ Reshape + Conv-Deconv (→ 3×720×1280)
       ↓
WiFi-DensePose RCNN (ResNet-FPN + Mask-RCNN)
  ├─ ResNet-101 + FPN Backbone
  ├─ Region Proposal Network
  ├─ DensePose Head (UV maps 25×112×112)
  └─ Keypoint Head (heatmaps 17×56×56)
       ↓
Output: Dense Pose UV Maps + Keypoints
```

#### Proposed Enhanced Architecture:
```
WiFi CSI (150×3×3)
  ├─ Advanced Phase Sanitization (Kalman Filter)
  └─ Multi-scale Amplitude Features
       ↓
Enhanced Modality Translation Network
  ├─ Temporal Transformer Encoder (captures time-series patterns)
  ├─ Spatial Attention Module (3×3 antenna relationships)
  ├─ Multi-scale Feature Extraction
  └─ Progressive Upsampling (→ 3×720×1280)
       ↓
HRNet-Transformer Hybrid
  ├─ HRNet-W48 Backbone (maintains high-resolution)
  ├─ Multi-scale Feature Fusion
  ├─ Transformer Decoder (global context)
  ├─ DensePose Head (UV maps 25×112×112)
  └─ Keypoint Head (heatmaps 17×56×56)
       ↓
Output: Enhanced Dense Pose + Keypoints (5-10% better accuracy)
```

---

## Implementation Architecture

### Directory Structure
```
NMAT/
├── backend/
│   └── ml/                          # New ML backend
│       ├── densepose/
│       │   ├── __init__.py
│       │   ├── config/
│       │   │   ├── __init__.py
│       │   │   ├── model_config.py      # Model hyperparameters
│       │   │   └── training_config.py   # Training settings
│       │   ├── data/
│       │   │   ├── __init__.py
│       │   │   ├── csi_dataset.py       # WiFi CSI dataset loader
│       │   │   ├── phase_sanitization.py # Phase cleaning
│       │   │   └── data_augmentation.py  # Data augmentation
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   ├── modality_translation.py  # CSI → Image domain
│       │   │   ├── hrnet_backbone.py        # HRNet backbone
│       │   │   ├── transformer_decoder.py   # Transformer modules
│       │   │   ├── densepose_head.py        # UV map prediction
│       │   │   ├── keypoint_head.py         # Keypoint detection
│       │   │   └── wifi_densepose.py        # Main model
│       │   ├── training/
│       │   │   ├── __init__.py
│       │   │   ├── trainer.py           # Training loop
│       │   │   ├── losses.py            # Loss functions
│       │   │   ├── metrics.py           # Evaluation metrics
│       │   │   └── transfer_learning.py # Teacher-student
│       │   ├── inference/
│       │   │   ├── __init__.py
│       │   │   ├── predictor.py         # Inference engine
│       │   │   └── visualizer.py        # Result visualization
│       │   ├── utils/
│       │   │   ├── __init__.py
│       │   │   ├── checkpoint.py        # Model checkpointing
│       │   │   └── logger.py            # Training logger
│       │   └── api/
│       │       ├── __init__.py
│       │       └── densepose_api.py     # REST API endpoints
│       ├── weights/                     # Pre-trained weights
│       │   ├── teacher_model/           # Image-based DensePose
│       │   └── wifi_model/              # WiFi-based model
│       ├── data/                        # Training data
│       │   ├── raw/                     # Raw CSI samples
│       │   ├── processed/               # Processed data
│       │   └── annotations/             # Ground truth
│       └── experiments/                 # Experiment logs
│           └── runs/
├── src/
│   └── components/
│       └── ESPERPanel/              # New ESPER UI component
│           ├── ESPERPanel.tsx
│           ├── DensePoseVisualization.tsx
│           ├── WiFiSignalMonitor.tsx
│           └── BodyMappingCanvas.tsx
├── docs/
│   ├── densepose.md                 # This file
│   └── 2301.00250v1.pdf            # Research paper
└── scripts/
    └── ml/
        ├── setup_environment.sh     # Environment setup
        ├── download_pretrained.py   # Download weights
        └── train_model.py          # Training script
```

---

## Phase 1: Environment Setup

### 1.1 Python Environment
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install core dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install detectron2 -f https://dl.fbaipublicfiles.com/detectron2/wheels/cu118/torch2.1/index.html
```

### 1.2 Required Libraries
```python
# requirements.txt
torch>=2.1.0
torchvision>=0.16.0
detectron2>=0.6
numpy>=1.24.0
scipy>=1.11.0
opencv-python>=4.8.0
pillow>=10.0.0
matplotlib>=3.8.0
tensorboard>=2.15.0
tqdm>=4.66.0
pycocotools>=2.0.7
einops>=0.7.0          # For transformer operations
timm>=0.9.0            # Pre-trained models
albumentations>=1.3.0  # Data augmentation
flask>=3.0.0           # API server
flask-cors>=4.0.0
pyyaml>=6.0
```

---

## Phase 2: Model Components

### 2.1 Phase Sanitization Module
**File**: `backend/ml/densepose/data/phase_sanitization.py`

```python
class PhaseSanitizer:
    """
    Advanced phase sanitization for WiFi CSI signals
    Based on paper Section 3.1 + Kalman filtering enhancement
    """

    def unwrap_phase(self, phase):
        """Unwrap phase discontinuities"""
        # Implements Equation (1) from paper
        pass

    def kalman_filter(self, phase):
        """Apply Kalman filter for temporal smoothing"""
        # Enhanced filtering beyond paper's median filter
        pass

    def linear_fit(self, phase):
        """Linear fitting to remove time-of-flight effects"""
        # Implements Equation (2) from paper
        pass

    def sanitize(self, raw_csi):
        """Complete sanitization pipeline"""
        pass
```

### 2.2 Modality Translation Network
**File**: `backend/ml/densepose/models/modality_translation.py`

```python
class EnhancedModalityTranslation(nn.Module):
    """
    Enhanced modality translation: CSI domain → Image domain

    Improvements over paper:
    - Temporal Transformer for time-series modeling
    - Spatial attention for 3×3 antenna relationships
    - Progressive upsampling instead of direct deconv
    """

    def __init__(self, config):
        super().__init__()
        # Input: (batch, 150, 3, 3) amplitude + phase
        # Output: (batch, 3, 720, 1280) image-like features

        # Temporal modeling
        self.temporal_transformer = TemporalTransformer(
            d_model=256,
            nhead=8,
            num_layers=4
        )

        # Spatial attention for antenna relationships
        self.spatial_attention = SpatialAttention(
            in_channels=256
        )

        # Progressive upsampling
        self.progressive_upsample = nn.Sequential(
            # 24×24 → 48×48 → 96×96 → 180×180 → 360×360 → 720×720
        )

    def forward(self, amplitude, phase):
        """Forward pass"""
        pass
```

### 2.3 HRNet-Transformer Hybrid
**File**: `backend/ml/densepose/models/hrnet_backbone.py`

```python
class HRNetTransformerBackbone(nn.Module):
    """
    HRNet-W48 + Transformer hybrid backbone

    Why HRNet over ResNet:
    - Maintains high-resolution representations
    - Better for dense prediction tasks
    - 5-10% accuracy improvement on keypoint detection

    Why add Transformer:
    - Captures global context
    - Better multi-person reasoning
    - Handles occlusions better
    """

    def __init__(self, config):
        super().__init__()
        # HRNet backbone
        self.hrnet = HRNetW48(pretrained=True)

        # Transformer decoder for global context
        self.transformer_decoder = TransformerDecoder(
            d_model=512,
            nhead=8,
            num_layers=6
        )

        # Multi-scale feature fusion
        self.fusion = MultiScaleFusion()

    def forward(self, x):
        """
        Args:
            x: (B, 3, 720, 1280) image-like features
        Returns:
            features: Multi-scale feature pyramid
        """
        pass
```

### 2.4 WiFi DensePose Model
**File**: `backend/ml/densepose/models/wifi_densepose.py`

```python
class WiFiDensePose(nn.Module):
    """
    Complete WiFi-to-DensePose model

    Pipeline:
    1. Phase Sanitization (preprocessing)
    2. Modality Translation Network
    3. HRNet-Transformer Backbone
    4. DensePose + Keypoint Heads
    """

    def __init__(self, config):
        super().__init__()
        self.modality_translation = EnhancedModalityTranslation(config)
        self.backbone = HRNetTransformerBackbone(config)
        self.densepose_head = DensePoseHead(config)
        self.keypoint_head = KeypointHead(config)

    def forward(self, csi_amplitude, csi_phase):
        """
        Args:
            csi_amplitude: (B, 150, 3, 3) WiFi amplitude
            csi_phase: (B, 150, 3, 3) WiFi sanitized phase
        Returns:
            densepose_output: (B, 25, 112, 112) UV maps
            keypoint_output: (B, 17, 56, 56) keypoint heatmaps
            bboxes: (B, N, 4) bounding boxes
        """
        # Translate to image domain
        image_features = self.modality_translation(
            csi_amplitude,
            csi_phase
        )

        # Extract spatial features
        backbone_features = self.backbone(image_features)

        # Predict dense pose and keypoints
        densepose_out = self.densepose_head(backbone_features)
        keypoint_out = self.keypoint_head(backbone_features)

        return densepose_out, keypoint_out
```

---

## Phase 3: Training Pipeline

### 3.1 Loss Functions
**File**: `backend/ml/densepose/training/losses.py`

```python
class DensePoseLoss(nn.Module):
    """
    Combined loss function from paper Section 3.5

    L = L_cls + L_box + λ_dp*L_dp + λ_kp*L_kp + λ_tr*L_tr

    Where:
    - L_cls: Classification loss (person/background)
    - L_box: Bounding box regression loss
    - L_dp: DensePose loss (segmentation + UV regression)
    - L_kp: Keypoint loss (heatmap cross-entropy)
    - L_tr: Transfer learning loss (MSE with teacher)
    """

    def __init__(self, lambda_dp=0.6, lambda_kp=0.3, lambda_tr=0.1):
        super().__init__()
        self.lambda_dp = lambda_dp
        self.lambda_kp = lambda_kp
        self.lambda_tr = lambda_tr

    def compute_densepose_loss(self, pred, target):
        """
        DensePose loss consists of:
        1. Coarse segmentation (24 body parts + background)
        2. Body part classification
        3. UV coordinate regression (smooth L1)
        """
        pass

    def compute_transfer_loss(self, student_features, teacher_features):
        """
        Transfer learning loss from paper Section 3.4
        MSE between multi-level feature maps (P2, P3, P4, P5)
        """
        pass
```

### 3.2 Training Configuration
**File**: `backend/ml/densepose/config/training_config.py`

```yaml
# training_config.yaml
training:
  # Paper settings
  batch_size: 16
  num_epochs: 100
  num_iterations: 145000

  # Optimizer
  optimizer:
    type: "SGD"
    lr: 0.001
    momentum: 0.9
    weight_decay: 0.0001

  # Learning rate schedule
  lr_scheduler:
    type: "MultiStepLR"
    warmup_iters: 2000
    warmup_factor: 0.001
    milestones: [48000, 96000]
    gamma: 0.1

  # Loss weights (from paper)
  loss_weights:
    lambda_dp: 0.6
    lambda_kp: 0.3
    lambda_tr: 0.1

  # Data
  data:
    num_csi_samples: 5  # 5 consecutive CSI samples @ 100Hz
    num_frequencies: 30  # IEEE 802.11n/ac subcarriers
    num_tx_antennas: 3
    num_rx_antennas: 3
    image_size: [720, 1280]

  # Hardware
  gpus: [0, 1, 2, 3]  # 4 GPUs (paper used 4x Titan X)
  num_workers: 8

  # Checkpointing
  checkpoint_interval: 5000
  evaluation_interval: 2000
```

### 3.3 Training Script
**File**: `backend/ml/densepose/training/trainer.py`

```python
class DensePoseTrainer:
    """
    Training pipeline for WiFi-DensePose model

    Features:
    - Multi-GPU distributed training
    - Transfer learning from image-based teacher
    - Automatic checkpointing
    - TensorBoard logging
    """

    def __init__(self, config, model, train_loader, val_loader):
        self.config = config
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader

        # Setup teacher model for transfer learning
        self.teacher_model = self._load_teacher_model()

        # Optimizer and scheduler
        self.optimizer = self._build_optimizer()
        self.scheduler = self._build_scheduler()

        # Loss function
        self.criterion = DensePoseLoss(
            lambda_dp=config.loss_weights.lambda_dp,
            lambda_kp=config.loss_weights.lambda_kp,
            lambda_tr=config.loss_weights.lambda_tr
        )

    def train(self):
        """Main training loop"""
        for iteration in range(self.config.num_iterations):
            # Training step
            loss = self.train_step()

            # Validation
            if iteration % self.config.evaluation_interval == 0:
                metrics = self.validate()
                self.log_metrics(metrics)

            # Checkpointing
            if iteration % self.config.checkpoint_interval == 0:
                self.save_checkpoint(iteration)

    def train_step(self):
        """Single training step"""
        pass

    def validate(self):
        """Validation on held-out set"""
        pass
```

---

## Phase 4: Data Preparation

### 4.1 Dataset Format
The paper uses synchronized WiFi CSI and RGB video data:

```python
# Dataset structure
data/
├── raw/
│   ├── lab_office/          # 6 captures
│   │   ├── capture_01/
│   │   │   ├── csi_samples.npy       # (N, 5, 30, 3, 3) complex
│   │   │   ├── video.mp4             # 20 FPS
│   │   │   └── timestamps.json       # Synchronization
│   │   └── ...
│   └── classroom/           # 10 captures
│       └── ...
└── processed/
    ├── train/
    │   ├── csi_amplitude/    # (N, 150, 3, 3) float32
    │   ├── csi_phase/        # (N, 150, 3, 3) float32
    │   └── annotations/      # DensePose ground truth
    └── val/
        └── ...
```

### 4.2 Data Loading
**File**: `backend/ml/densepose/data/csi_dataset.py`

```python
class WiFiDensePoseDataset(Dataset):
    """
    Dataset for WiFi CSI → DensePose mapping

    Each sample contains:
    - CSI amplitude: (150, 3, 3) from 5 consecutive samples
    - CSI phase: (150, 3, 3) sanitized phase
    - DensePose ground truth: UV maps (25, 112, 112)
    - Keypoint ground truth: (17, 56, 56)
    - Bounding boxes: (N, 4)
    """

    def __init__(self, data_dir, split='train', transform=None):
        self.data_dir = data_dir
        self.split = split
        self.transform = transform

        # Load file paths
        self.csi_files = self._load_csi_paths()
        self.annotation_files = self._load_annotation_paths()

    def __getitem__(self, idx):
        # Load CSI data
        csi_raw = np.load(self.csi_files[idx])

        # Phase sanitization
        sanitizer = PhaseSanitizer()
        amplitude, phase = sanitizer.sanitize(csi_raw)

        # Load ground truth
        annotations = self._load_annotations(idx)

        return {
            'csi_amplitude': amplitude,
            'csi_phase': phase,
            'densepose_gt': annotations['densepose'],
            'keypoints_gt': annotations['keypoints'],
            'bboxes': annotations['bboxes']
        }
```

---

## Phase 5: API Integration

### 5.1 REST API Server
**File**: `backend/ml/densepose/api/densepose_api.py`

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model
model = WiFiDensePose.load_from_checkpoint('weights/wifi_model/best.pth')
model.eval()

@app.route('/api/densepose/predict', methods=['POST'])
def predict_densepose():
    """
    Predict DensePose from WiFi CSI

    Request:
    {
        "csi_amplitude": [[...]], # (150, 3, 3)
        "csi_phase": [[...]]      # (150, 3, 3)
    }

    Response:
    {
        "densepose": [[...]],     # (25, 112, 112) UV maps
        "keypoints": [[...]],     # (17, 56, 56) heatmaps
        "bboxes": [[...]],        # (N, 4) bounding boxes
        "visualization": "base64_image"
    }
    """
    data = request.json

    # Prepare input
    amplitude = torch.tensor(data['csi_amplitude']).float()
    phase = torch.tensor(data['csi_phase']).float()

    # Inference
    with torch.no_grad():
        densepose, keypoints = model(amplitude, phase)

    # Visualize
    vis_image = visualize_densepose(densepose, keypoints)

    return jsonify({
        'densepose': densepose.cpu().numpy().tolist(),
        'keypoints': keypoints.cpu().numpy().tolist(),
        'visualization': vis_image
    })

@app.route('/api/densepose/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

### 5.2 Electron Integration
**File**: `src/services/densePoseService.ts`

```typescript
export class DensePoseService {
  private apiUrl = 'http://localhost:5001/api/densepose';

  async predictDensePose(
    csiAmplitude: number[][][],
    csiPhase: number[][][]
  ): Promise<DensePoseResult> {
    const response = await fetch(`${this.apiUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csi_amplitude: csiAmplitude,
        csi_phase: csiPhase
      })
    });

    return await response.json();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }
}
```

---

## Phase 6: Frontend UI (ESPER Panel)

### 6.1 Component Structure
**File**: `src/components/ESPERPanel/ESPERPanel.tsx`

```typescript
export const ESPERPanel: React.FC = () => {
  const [wifiData, setWifiData] = useState<WiFiData | null>(null);
  const [densePose, setDensePose] = useState<DensePoseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWiFiCapture = async () => {
    setIsProcessing(true);

    // Capture WiFi CSI data
    const csiData = await captureWiFiCSI();

    // Send to ML backend
    const densePoseService = new DensePoseService();
    const result = await densePoseService.predictDensePose(
      csiData.amplitude,
      csiData.phase
    );

    setDensePose(result);
    setIsProcessing(false);
  };

  return (
    <div className="esper-panel">
      <WiFiSignalMonitor data={wifiData} />
      <DensePoseVisualization result={densePose} />
      <BodyMappingCanvas densepose={densePose} />
    </div>
  );
};
```

---

## Phase 7: Performance Metrics

### Expected Performance
Based on paper results and proposed enhancements:

| Metric | Paper (ResNet-FPN) | Proposed (HRNet-Transformer) |
|--------|-------------------|------------------------------|
| AP (bbox) | 43.5 | 48-50 (estimated) |
| AP@50 | 87.2 | 90+ |
| AP@75 | 44.6 | 50+ |
| dpAP·GPS | 45.3 | 50-52 |
| dpAP·GPS@50 | 79.3 | 83-85 |
| Training Time | ~80 hours | ~60 hours (with transfer learning) |

---

## Phase 8: Deployment Checklist

- [ ] Environment setup complete
- [ ] Dataset prepared and validated
- [ ] Phase sanitization implemented
- [ ] Modality translation network trained
- [ ] HRNet-Transformer backbone integrated
- [ ] DensePose and Keypoint heads working
- [ ] Transfer learning from teacher model
- [ ] Training pipeline validated
- [ ] API server deployed
- [ ] Frontend integration complete
- [ ] Performance benchmarks met
- [ ] Documentation complete

---

## References

1. **Paper**: Geng et al., "DensePose From WiFi" (2022)
2. **DensePose**: Güler et al., "DensePose: Dense Human Pose Estimation In The Wild" (2018)
3. **HRNet**: Sun et al., "Deep High-Resolution Representation Learning" (2019)
4. **Detectron2**: https://github.com/facebookresearch/detectron2
5. **WiFi CSI**: IEEE 802.11n/ac Channel State Information

---

## Contact & Support

For questions or issues:
- Review paper: `docs/2301.00250v1.pdf`
- Check implementation: `backend/ml/densepose/`
- API documentation: See Phase 5 above

---

**Last Updated**: 2025-01-19
**Status**: Implementation Plan Complete ✓
