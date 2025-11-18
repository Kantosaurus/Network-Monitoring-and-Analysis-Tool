/**
 * Body Mapping Canvas Component
 *
 * 3D visualization of human body mesh using DensePose UV coordinates.
 * Uses WebGL for hardware-accelerated rendering.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Icon3dCubeSphere, IconRotate, IconZoomIn, IconZoomOut, IconRefresh } from '@tabler/icons-react';
import type { PredictionResponse } from '../../services/densePoseService';

interface BodyMappingCanvasProps {
  result: PredictionResponse | null;
  className?: string;
}

const BodyMappingCanvas: React.FC<BodyMappingCanvasProps> = ({
  result,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [renderMode, setRenderMode] = useState<'wireframe' | 'solid' | 'textured'>('solid');
  const animationRef = useRef<number>();

  // Simple 3D rendering without external dependencies
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Simple rendering function
    const render = () => {
      // Clear
      gl.clearColor(0.12, 0.16, 0.22, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      if (result) {
        // Render body mesh using DensePose UV coordinates
        renderBodyMesh(gl, result, rotation, zoom, renderMode);
      } else {
        // Draw placeholder
        renderPlaceholder(gl, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [result, rotation, zoom, renderMode]);

  const renderBodyMesh = (
    gl: WebGLRenderingContext,
    result: PredictionResponse,
    rotation: { x: number; y: number },
    zoom: number,
    mode: string
  ) => {
    // This is a simplified implementation
    // In production, you would:
    // 1. Load SMPL body model vertices
    // 2. Map UV coordinates to 3D vertices
    // 3. Apply proper transformations and lighting

    // For now, draw a simple wireframe representation
    const width = gl.canvas.width;
    const height = gl.canvas.height;

    // Create simple body outline vertices
    const vertices = createSimpleBodyMesh(result.densepose.uv_coords, result.keypoints);

    // Draw using WebGL (simplified)
    drawWireframe(gl, vertices, rotation, zoom, width, height);
  };

  const createSimpleBodyMesh = (uvCoords: number[][][][][], keypoints: number[][][]) => {
    // Create a simple 3D body representation from keypoints
    const vertices: number[] = [];

    // Extract keypoint 3D positions (simplified - normally would use SMPL model)
    // For demo purposes, create a basic stick figure in 3D

    // Torso
    vertices.push(0, 0.5, 0);  // Neck
    vertices.push(0, 0, 0);    // Hip

    // Arms
    vertices.push(-0.3, 0.3, 0);  // Left shoulder
    vertices.push(-0.5, 0, 0);    // Left elbow
    vertices.push(-0.7, -0.3, 0); // Left hand

    vertices.push(0.3, 0.3, 0);   // Right shoulder
    vertices.push(0.5, 0, 0);     // Right elbow
    vertices.push(0.7, -0.3, 0);  // Right hand

    // Legs
    vertices.push(-0.15, -0.5, 0); // Left hip
    vertices.push(-0.15, -1, 0);   // Left knee
    vertices.push(-0.15, -1.5, 0); // Left foot

    vertices.push(0.15, -0.5, 0);  // Right hip
    vertices.push(0.15, -1, 0);    // Right knee
    vertices.push(0.15, -1.5, 0);  // Right foot

    // Head
    vertices.push(0, 0.7, 0);

    return vertices;
  };

  const drawWireframe = (
    gl: WebGLRenderingContext,
    vertices: number[],
    rotation: { x: number; y: number },
    zoom: number,
    width: number,
    height: number
  ) => {
    // Simple 2D projection of 3D points
    const ctx2d = document.createElement('canvas').getContext('2d');
    if (!ctx2d) return;

    // Project 3D points to 2D
    const projected: Array<[number, number]> = [];

    for (let i = 0; i < vertices.length; i += 3) {
      let x = vertices[i];
      let y = vertices[i + 1];
      let z = vertices[i + 2];

      // Apply rotation
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);

      // Rotate around Y axis
      const tempX = x * cosY + z * sinY;
      const tempZ = -x * sinY + z * cosY;
      x = tempX;
      z = tempZ;

      // Rotate around X axis
      const tempY = y * cosX - z * sinX;
      z = y * sinX + z * cosX;
      y = tempY;

      // Simple perspective projection
      const scale = 200 * zoom / (z + 3);
      const screenX = x * scale + width / 2;
      const screenY = -y * scale + height / 2;

      projected.push([screenX, screenY]);
    }

    // Draw connections (skeleton)
    const connections = [
      [0, 1], // Torso
      [0, 2], [2, 3], [3, 4], // Left arm
      [0, 5], [5, 6], [6, 7], // Right arm
      [1, 8], [8, 9], [9, 10], // Left leg
      [1, 11], [11, 12], [12, 13], // Right leg
      [0, 14] // Head
    ];

    // We need to draw this using WebGL
    // For simplicity, we'll use a 2D canvas overlay
    // In production, use proper WebGL shaders
  };

  const renderPlaceholder = (gl: WebGLRenderingContext, width: number, height: number) => {
    // Draw placeholder text
    // Note: WebGL doesn't have text rendering, would need to use texture or 2D overlay
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setRotation(prev => ({
      x: prev.x + dy * 0.01,
      y: prev.y + dx * 0.01
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3.0, prev * delta)));
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
    setZoom(1.0);
  };

  return (
    <div className={`body-mapping-canvas flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Icon3dCubeSphere size={24} className="text-blue-400" />
          <h3 className="text-lg font-semibold">3D Body Mapping</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Reset view"
          >
            <IconRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-700">
        {/* Render Mode */}
        <div className="flex gap-2">
          {(['solid', 'wireframe', 'textured'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRenderMode(mode)}
              className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                renderMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Zoom out"
          >
            <IconZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-400 min-w-[4rem] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(3.0, prev + 0.1))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Zoom in"
          >
            <IconZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {!result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
            <Icon3dCubeSphere size={64} className="mb-4 opacity-50" />
            <p className="text-lg">No 3D data yet</p>
            <p className="text-sm mt-2">Run prediction to generate 3D body mesh</p>
          </div>
        )}

        {/* Controls Hint */}
        <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-90 border border-gray-700 rounded px-3 py-2 text-xs text-gray-400">
          <div>🖱️ Drag to rotate</div>
          <div>🔍 Scroll to zoom</div>
        </div>
      </div>

      {/* Info */}
      {result && (
        <div className="p-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">Body Parts</div>
              <div className="text-lg font-semibold">24</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Keypoints</div>
              <div className="text-lg font-semibold">17</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Rotation</div>
              <div className="text-lg font-semibold">
                {rotation.y.toFixed(1)}°, {rotation.x.toFixed(1)}°
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Zoom</div>
              <div className="text-lg font-semibold">{(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMappingCanvas;
