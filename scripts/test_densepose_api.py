"""
Test script for WiFi-DensePose API

This script tests all API endpoints to ensure the server is working correctly.
"""

import requests
import numpy as np
import json
import base64
from PIL import Image
import io


API_BASE_URL = "http://localhost:5001/api/densepose"


def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("Testing Health Check Endpoint")
    print("="*60)

    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("✓ Health check passed!")
            return True
        else:
            print("✗ Health check failed!")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_model_info():
    """Test the model info endpoint"""
    print("\n" + "="*60)
    print("Testing Model Info Endpoint")
    print("="*60)

    try:
        response = requests.get(f"{API_BASE_URL}/info")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("✓ Model info retrieved!")
            return True
        else:
            print("✗ Model info failed!")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_prediction():
    """Test the prediction endpoint with dummy data"""
    print("\n" + "="*60)
    print("Testing Prediction Endpoint")
    print("="*60)

    try:
        # Generate dummy CSI data
        print("Generating dummy CSI data (150, 3, 3)...")
        csi_amplitude = np.random.randn(150, 3, 3).tolist()
        csi_phase = np.random.randn(150, 3, 3).tolist()

        # Send request
        print("Sending POST request...")
        response = requests.post(
            f"{API_BASE_URL}/predict",
            json={
                "csi_amplitude": csi_amplitude,
                "csi_phase": csi_phase
            },
            timeout=30
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ Prediction successful!")
                print(f"  - Segmentation shape: {np.array(result['densepose']['segmentation']).shape}")
                print(f"  - UV coords shape: {np.array(result['densepose']['uv_coords']).shape}")
                print(f"  - Keypoints shape: {np.array(result['keypoints']).shape}")

                # Save visualization if available
                if 'visualization' in result:
                    try:
                        img_data = base64.b64decode(result['visualization'])
                        img = Image.open(io.BytesIO(img_data))
                        img.save('test_visualization.png')
                        print(f"  - Visualization saved to: test_visualization.png")
                    except Exception as e:
                        print(f"  - Could not save visualization: {e}")

                return True
            else:
                print(f"✗ Prediction failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"✗ Request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("✗ Request timed out (server might be processing)")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_raw_csi_prediction():
    """Test prediction from raw complex CSI"""
    print("\n" + "="*60)
    print("Testing Raw CSI Prediction Endpoint")
    print("="*60)

    try:
        # Generate dummy complex CSI
        print("Generating dummy complex CSI data (5, 30, 3, 3)...")
        csi_real = np.random.randn(5, 30, 3, 3).tolist()
        csi_imag = np.random.randn(5, 30, 3, 3).tolist()

        # Send request
        print("Sending POST request...")
        response = requests.post(
            f"{API_BASE_URL}/predict_raw",
            json={
                "csi_complex_real": csi_real,
                "csi_complex_imag": csi_imag
            },
            timeout=30
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ Raw CSI prediction successful!")
                return True
            else:
                print(f"✗ Prediction failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"✗ Request failed with status code {response.status_code}")
            return False

    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("WiFi-DensePose API Test Suite")
    print("="*60)
    print(f"Testing API at: {API_BASE_URL}")

    # Check if server is running
    try:
        requests.get(f"{API_BASE_URL}/health", timeout=2)
    except:
        print("\n✗ ERROR: Cannot connect to API server!")
        print(f"  Make sure the server is running at {API_BASE_URL}")
        print(f"  Start the server with: scripts\\start_densepose_server.bat")
        return

    # Run tests
    results = []
    results.append(("Health Check", test_health_check()))
    results.append(("Model Info", test_model_info()))
    results.append(("Prediction", test_prediction()))
    results.append(("Raw CSI Prediction", test_raw_csi_prediction()))

    # Print summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)

    passed = 0
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name:.<40} {status}")
        if result:
            passed += 1

    print(f"\nTotal: {passed}/{len(results)} tests passed")

    if passed == len(results):
        print("\n🎉 All tests passed! The API is working correctly.")
    else:
        print("\n⚠ Some tests failed. Check the output above for details.")


if __name__ == "__main__":
    main()
