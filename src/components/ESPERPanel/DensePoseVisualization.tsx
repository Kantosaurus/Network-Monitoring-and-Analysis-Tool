/**
 * DensePose Visualization Component
 *
 * Displays the DensePose prediction results including:
 * - Body part segmentation
 * - UV coordinates overlay
 * - Keypoint detection
 */

import React, { useEffect, useRef, useState } from 'react';
import { IconUser, IconEye, IconDownload } from '@tabler/icons-react';
import { densePoseService, type PredictionResponse } from '../../services/densePoseService';

interface DensePoseVisualizationProps {
  result: PredictionResponse | null;
  className?: string;
}

type DisplayLayer = 'segmentation' | 'uv' | 'keypoints' | 'combined';

const DensePoseVisualization: React.FC<DensePoseVisualizationProps> = ({
  result,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayLayer, setDisplayLayer] = useState<DisplayLayer>('combined');
  const [hoveredPart, setHoveredPart] = useState<number | null>(null);

  // Body part names (COCO DensePose format)
  const bodyPartNames = [
    'Background',
    'Torso', 'Right Hand', 'Left Hand', 'Left Foot', 'Right Foot',
    'Upper Right Leg', 'Upper Left Leg', 'Lower Right Leg', 'Lower Left Leg',
    'Upper Left Arm', 'Upper Right Arm', 'Lower Left Arm', 'Lower Right Arm',
    'Head', 'Neck', 'Right Shoulder', 'Left Shoulder',
    'Right Hip', 'Left Hip', 'Right Knee', 'Left Knee',
    'Right Ankle', 'Left Ankle', 'Pelvis'
  ];

  // Keypoint names (COCO format)
  const keypointNames = [
    'Nose', 'Left Eye', 'Right Eye', 'Left Ear', 'Right Ear',
    'Left Shoulder', 'Right Shoulder', 'Left Elbow', 'Right Elbow',
    'Left Wrist', 'Right Wrist', 'Left Hip', 'Right Hip',
    'Left Knee', 'Right Knee', 'Left Ankle', 'Right Ankle'
  ];

  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load visualization image from API
    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw additional layers based on display mode
      if (displayLayer === 'keypoints' || displayLayer === 'combined') {
        drawKeypoints(ctx, result.keypoints, canvas.width, canvas.height);
      }

      // Draw hover highlight
      if (hoveredPart !== null && hoveredPart > 0) {
        highlightBodyPart(ctx, result.densepose.segmentation, hoveredPart, canvas.width, canvas.height);
      }
    };

    img.src = densePoseService.base64ToDataUrl(result.visualization);
  }, [result, displayLayer, hoveredPart]);

  const drawKeypoints = (
    ctx: CanvasRenderingContext2D,
    keypoints: number[][][],
    width: number,
    height: number
  ) => {
    // Extract keypoint coordinates from heatmaps
    const coords: Array<[number, number, number]> = [];

    for (let k = 0; k < 17; k++) {
      let maxVal = -Infinity;
      let maxX = 0;
      let maxY = 0;

      // Find maximum in heatmap
      for (let y = 0; y < 56; y++) {
        for (let x = 0; x < 56; x++) {
          const val = keypoints[k][y][x];
          if (val > maxVal) {
            maxVal = val;
            maxX = x;
            maxY = y;
          }
        }
      }

      // Scale to canvas size
      const scaledX = (maxX / 56) * width;
      const scaledY = (maxY / 56) * height;
      coords.push([scaledX, scaledY, maxVal]);
    }

    // Draw skeleton connections
    const skeleton = [
      [0, 1], [0, 2], [1, 3], [2, 4], // Head
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
      [5, 11], [6, 12], [11, 13], [12, 14], [13, 15], [14, 16] // Legs
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;

    for (const [i, j] of skeleton) {
      const [x1, y1, conf1] = coords[i];
      const [x2, y2, conf2] = coords[j];

      if (conf1 > 0.3 && conf2 > 0.3) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw keypoints
    for (let k = 0; k < 17; k++) {
      const [x, y, conf] = coords[k];

      if (conf > 0.3) {
        // Draw circle
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  const highlightBodyPart = (
    ctx: CanvasRenderingContext2D,
    segmentation: number[][][],
    partId: number,
    width: number,
    height: number
  ) => {
    // Create highlight overlay
    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < 112; y++) {
      for (let x = 0; x < 112; x++) {
        // Get predicted part
        let maxVal = -Infinity;
        let maxPart = 0;

        for (let p = 0; p < 25; p++) {
          if (segmentation[p][y][x] > maxVal) {
            maxVal = segmentation[p][y][x];
            maxPart = p;
          }
        }

        if (maxPart === partId) {
          // Scale to canvas size
          const canvasX = Math.floor((x / 112) * width);
          const canvasY = Math.floor((y / 112) * height);
          const idx = (canvasY * width + canvasX) * 4;

          // Highlight in yellow with transparency
          imageData.data[idx] = 255;     // R
          imageData.data[idx + 1] = 255; // G
          imageData.data[idx + 2] = 0;   // B
          imageData.data[idx + 3] = 100; // A
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleDownload = () => {
    if (!result) return;
    densePoseService.downloadVisualization(result.visualization, 'densepose_result.png');
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!result) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * 112);
    const y = Math.floor((e.clientY - rect.top) / rect.height * 112);

    if (x >= 0 && x < 112 && y >= 0 && y < 112) {
      // Find which body part is at this location
      const segmentation = result.densepose.segmentation;
      let maxVal = -Infinity;
      let maxPart = 0;

      for (let p = 0; p < 25; p++) {
        if (segmentation[p][y][x] > maxVal) {
          maxVal = segmentation[p][y][x];
          maxPart = p;
        }
      }

      setHoveredPart(maxPart);
    }
  };

  return (
    <div className={`densepose-visualization flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <IconUser size={24} className="text-blue-400" />
          <h3 className="text-lg font-semibold">DensePose</h3>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              title="Download visualization"
            >
              <IconDownload size={16} />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Layer Controls */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-700">
        <span className="text-sm text-gray-400 mr-2">Display:</span>
        {(['combined', 'segmentation', 'uv', 'keypoints'] as DisplayLayer[]).map((layer) => (
          <button
            key={layer}
            onClick={() => setDisplayLayer(layer)}
            className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
              displayLayer === layer
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {layer}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 overflow-auto">
        {result ? (
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredPart(null)}
              className="w-full h-auto border border-gray-600 rounded cursor-crosshair"
            />

            {/* Hover tooltip */}
            {hoveredPart !== null && hoveredPart > 0 && (
              <div className="absolute top-4 right-4 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm">
                <div className="font-semibold">{bodyPartNames[hoveredPart]}</div>
                <div className="text-gray-400 text-xs">Part ID: {hoveredPart}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <IconUser size={64} className="mb-4 opacity-50" />
            <p className="text-lg">No prediction yet</p>
            <p className="text-sm mt-2">Start capture and run prediction to see results</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {result && (
        <div className="p-4 border-t border-gray-700">
          <div className="text-sm font-semibold mb-2">Detected Body Parts:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {bodyPartNames.slice(1).map((name, idx) => {
              const partId = idx + 1;
              const isHovered = hoveredPart === partId;

              return (
                <div
                  key={partId}
                  className={`px-2 py-1 rounded transition-colors ${
                    isHovered
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  onMouseEnter={() => setHoveredPart(partId)}
                  onMouseLeave={() => setHoveredPart(null)}
                >
                  {name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DensePoseVisualization;
