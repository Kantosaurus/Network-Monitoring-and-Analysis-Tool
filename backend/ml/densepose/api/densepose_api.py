"""
REST API Server for WiFi-DensePose

This Flask server provides API endpoints for the NMAT Electron app
to interact with the DensePose model.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import torch
import numpy as np
import base64
import io
from PIL import Image
import traceback
import os
from pathlib import Path

# Import the predictor
import sys
sys.path.append(str(Path(__file__).parent.parent))
from inference.predictor import DensePosePredictor
from config.model_config import ModelConfig


# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Electron app

# Global predictor instance
predictor = None
MODEL_PATH = os.environ.get('DENSEPOSE_MODEL_PATH', 'weights/wifi_model/best.pth')


def initialize_predictor():
    """Initialize the DensePose predictor"""
    global predictor

    if predictor is None:
        try:
            if os.path.exists(MODEL_PATH):
                print(f"Loading model from {MODEL_PATH}...")
                predictor = DensePosePredictor(
                    checkpoint_path=MODEL_PATH,
                    device='cuda' if torch.cuda.is_available() else 'cpu'
                )
                print("Model loaded successfully!")
            else:
                print(f"Warning: Model checkpoint not found at {MODEL_PATH}")
                print("Using dummy mode for API testing...")
                predictor = None
        except Exception as e:
            print(f"Error loading model: {e}")
            print(traceback.format_exc())
            predictor = None


def numpy_to_base64(image: np.ndarray) -> str:
    """Convert numpy image to base64 string"""
    # Convert to PIL Image
    if image.dtype != np.uint8:
        image = (image * 255).astype(np.uint8)

    pil_image = Image.fromarray(image)

    # Convert to base64
    buffered = io.BytesIO()
    pil_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return img_str


@app.route('/api/densepose/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor is not None,
        'device': 'cuda' if torch.cuda.is_available() else 'cpu',
        'cuda_available': torch.cuda.is_available()
    })


@app.route('/api/densepose/predict', methods=['POST'])
def predict_densepose():
    """
    Predict DensePose from WiFi CSI

    Request JSON:
    {
        "csi_amplitude": [[[...]]], // (150, 3, 3) or (5, 30, 3, 3)
        "csi_phase": [[[...]]]      // (150, 3, 3) or (5, 30, 3, 3)
    }

    Response JSON:
    {
        "success": true,
        "densepose": {
            "segmentation": [[[...]]], // (25, 112, 112)
            "uv_coords": [[[[...]]]]   // (24, 2, 112, 112)
        },
        "keypoints": [[[...]]],        // (17, 56, 56)
        "visualization": "base64_image"
    }
    """
    try:
        # Check if model is loaded
        if predictor is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please check model path and restart server.'
            }), 503

        # Get request data
        data = request.json

        if 'csi_amplitude' not in data or 'csi_phase' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing csi_amplitude or csi_phase in request'
            }), 400

        # Convert to numpy arrays
        csi_amplitude = np.array(data['csi_amplitude'], dtype=np.float32)
        csi_phase = np.array(data['csi_phase'], dtype=np.float32)

        # Validate shapes
        if csi_amplitude.shape != csi_phase.shape:
            return jsonify({
                'success': False,
                'error': f'Shape mismatch: amplitude {csi_amplitude.shape} vs phase {csi_phase.shape}'
            }), 400

        # Run prediction
        result = predictor.predict(
            csi_amplitude,
            csi_phase,
            return_visualization=True
        )

        # Convert visualization to base64
        visualization_b64 = numpy_to_base64(result['visualization'])

        # Prepare response
        response = {
            'success': True,
            'densepose': {
                'segmentation': result['segmentation'].tolist(),
                'uv_coords': result['uv_coords'].tolist()
            },
            'keypoints': result['keypoints'].tolist(),
            'visualization': visualization_b64
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error in prediction: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/api/densepose/predict_raw', methods=['POST'])
def predict_from_raw():
    """
    Predict from raw complex CSI (includes phase sanitization)

    Request JSON:
    {
        "csi_complex_real": [[[...]]], // (5, 30, 3, 3) real part
        "csi_complex_imag": [[[...]]]  // (5, 30, 3, 3) imaginary part
    }

    Response: Same as /predict
    """
    try:
        if predictor is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 503

        data = request.json

        # Convert to complex array
        real = np.array(data['csi_complex_real'], dtype=np.float32)
        imag = np.array(data['csi_complex_imag'], dtype=np.float32)
        csi_complex = real + 1j * imag

        # Run prediction (includes phase sanitization)
        result = predictor.predict_from_raw_csi(
            csi_complex,
            return_visualization=True
        )

        # Convert visualization to base64
        visualization_b64 = numpy_to_base64(result['visualization'])

        response = {
            'success': True,
            'densepose': {
                'segmentation': result['segmentation'].tolist(),
                'uv_coords': result['uv_coords'].tolist()
            },
            'keypoints': result['keypoints'].tolist(),
            'visualization': visualization_b64
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error in prediction: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/densepose/info', methods=['GET'])
def model_info():
    """Get model information"""
    if predictor is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 503

    return jsonify({
        'success': True,
        'config': {
            'num_body_parts': 24,
            'num_keypoints': 17,
            'uv_resolution': predictor.config.densepose_head.uv_resolution,
            'keypoint_resolution': predictor.config.keypoint_head.keypoint_resolution
        },
        'input_shape': {
            'csi_samples': predictor.config.csi.num_samples,
            'frequencies': predictor.config.csi.num_frequencies,
            'tx_antennas': predictor.config.csi.num_tx_antennas,
            'rx_antennas': predictor.config.csi.num_rx_antennas
        }
    })


@app.route('/api/densepose/visualize', methods=['POST'])
def visualize_only():
    """
    Visualize existing DensePose prediction

    Request JSON:
    {
        "segmentation": [[[...]]],
        "uv_coords": [[[...]]],
        "keypoints": [[...]]
    }

    Response:
    {
        "success": true,
        "visualization": "base64_image"
    }
    """
    try:
        data = request.json

        segmentation = np.array(data['segmentation'], dtype=np.float32)
        uv_coords = np.array(data['uv_coords'], dtype=np.float32)
        keypoints = np.array(data['keypoints'], dtype=np.float32)

        # Generate visualization
        if predictor is not None:
            visualization = predictor.visualize_result(segmentation, uv_coords, keypoints)
        else:
            # Dummy visualization if model not loaded
            H, W = segmentation.shape[1:]
            visualization = np.zeros((H, W, 3), dtype=np.uint8)

        visualization_b64 = numpy_to_base64(visualization)

        return jsonify({
            'success': True,
            'visualization': visualization_b64
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='DensePose API Server')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5001, help='Port to bind to')
    parser.add_argument('--model-path', type=str, default=MODEL_PATH,
                       help='Path to model checkpoint')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')

    args = parser.parse_args()

    # Update model path
    global MODEL_PATH
    MODEL_PATH = args.model_path

    # Initialize predictor
    print("Initializing DensePose API Server...")
    print(f"Model path: {MODEL_PATH}")
    initialize_predictor()

    # Start server
    print(f"\nStarting server on {args.host}:{args.port}")
    print(f"API endpoints:")
    print(f"  - GET  {args.host}:{args.port}/api/densepose/health")
    print(f"  - POST {args.host}:{args.port}/api/densepose/predict")
    print(f"  - POST {args.host}:{args.port}/api/densepose/predict_raw")
    print(f"  - GET  {args.host}:{args.port}/api/densepose/info")
    print(f"  - POST {args.host}:{args.port}/api/densepose/visualize")

    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug,
        threaded=True
    )


if __name__ == '__main__':
    main()
