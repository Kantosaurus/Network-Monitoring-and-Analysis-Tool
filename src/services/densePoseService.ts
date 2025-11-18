/**
 * DensePose Service
 *
 * Service for interacting with the WiFi-DensePose ML backend API
 */

export interface CSIData {
  amplitude: number[][][];  // (150, 3, 3)
  phase: number[][][];      // (150, 3, 3)
}

export interface ComplexCSIData {
  real: number[][][][];     // (5, 30, 3, 3)
  imag: number[][][][];     // (5, 30, 3, 3)
}

export interface DensePoseResult {
  segmentation: number[][][];     // (25, 112, 112)
  uv_coords: number[][][][][];    // (24, 2, 112, 112)
}

export interface PredictionResponse {
  success: boolean;
  densepose: DensePoseResult;
  keypoints: number[][][];        // (17, 56, 56)
  visualization: string;          // Base64 encoded PNG
  error?: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  cuda_available: boolean;
}

export interface ModelInfo {
  config: {
    num_body_parts: number;
    num_keypoints: number;
    uv_resolution: number;
    keypoint_resolution: number;
  };
  input_shape: {
    csi_samples: number;
    frequencies: number;
    tx_antennas: number;
    rx_antennas: number;
  };
}

export class DensePoseService {
  private apiUrl: string;
  private timeout: number;

  constructor(apiUrl: string = 'http://localhost:5001/api/densepose', timeout: number = 30000) {
    this.apiUrl = apiUrl;
    this.timeout = timeout;
  }

  /**
   * Check if the DensePose API server is healthy
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<ModelInfo> {
    try {
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get model info');
      }

      return result;
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }

  /**
   * Predict DensePose from WiFi CSI
   */
  async predict(csiData: CSIData): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          csi_amplitude: csiData.amplitude,
          csi_phase: csiData.phase
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PredictionResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Prediction failed');
      }

      return result;
    } catch (error) {
      console.error('Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Predict from raw complex CSI (includes phase sanitization)
   */
  async predictFromRaw(complexCSI: ComplexCSIData): Promise<PredictionResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/predict_raw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          csi_complex_real: complexCSI.real,
          csi_complex_imag: complexCSI.imag
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PredictionResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Prediction failed');
      }

      return result;
    } catch (error) {
      console.error('Raw CSI prediction failed:', error);
      throw error;
    }
  }

  /**
   * Visualize existing DensePose prediction
   */
  async visualize(result: DensePoseResult, keypoints: number[][][]): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/visualize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          segmentation: result.segmentation,
          uv_coords: result.uv_coords,
          keypoints: keypoints
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Visualization failed');
      }

      return data.visualization;
    } catch (error) {
      console.error('Visualization failed:', error);
      throw error;
    }
  }

  /**
   * Convert base64 image to data URL
   */
  base64ToDataUrl(base64: string): string {
    return `data:image/png;base64,${base64}`;
  }

  /**
   * Download visualization as image
   */
  downloadVisualization(base64: string, filename: string = 'densepose_result.png') {
    const link = document.createElement('a');
    link.href = this.base64ToDataUrl(base64);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Singleton instance
export const densePoseService = new DensePoseService();

// Export types
export default DensePoseService;
