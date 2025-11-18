/**
 * WiFi Signal Monitor Component
 *
 * Real-time visualization of WiFi CSI (Channel State Information) signals.
 * Displays amplitude and phase data from the 3x3 antenna array.
 */

import React, { useEffect, useRef, useState } from 'react';
import { IconWifi, IconChartLine } from '@tabler/icons-react';

interface WiFiSignalMonitorProps {
  isCapturing?: boolean;
  className?: string;
}

interface CSIData {
  timestamp: number;
  amplitude: number[][];  // (30, 9) - 30 frequencies x 9 antenna pairs
  phase: number[][];      // (30, 9)
}

const WiFiSignalMonitor: React.FC<WiFiSignalMonitorProps> = ({
  isCapturing = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [csiHistory, setCSIHistory] = useState<CSIData[]>([]);
  const [selectedAntennaPair, setSelectedAntennaPair] = useState(0); // 0-8 for 3x3
  const [displayMode, setDisplayMode] = useState<'amplitude' | 'phase'>('amplitude');
  const maxHistoryLength = 100;

  // Simulate CSI data (replace with actual WiFi capture)
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      // Generate dummy CSI data
      const timestamp = Date.now();
      const amplitude = Array.from({ length: 30 }, () =>
        Array.from({ length: 9 }, () => Math.random() * 20 + 10)
      );
      const phase = Array.from({ length: 30 }, () =>
        Array.from({ length: 9 }, () => (Math.random() - 0.5) * Math.PI * 2)
      );

      setCSIHistory(prev => {
        const newHistory = [...prev, { timestamp, amplitude, phase }];
        return newHistory.slice(-maxHistoryLength);
      });
    }, 100); // 10 Hz update

    return () => clearInterval(interval);
  }, [isCapturing]);

  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    if (csiHistory.length === 0) {
      // Draw placeholder
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No CSI data - Start capture to see signals', width / 2, height / 2);
      return;
    }

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // Vertical lines (time)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines (amplitude/phase)
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw CSI signals
    const data = displayMode === 'amplitude'
      ? csiHistory.map(d => d.amplitude)
      : csiHistory.map(d => d.phase);

    // Draw for selected antenna pair
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const freqData = data[i];
      const xStart = (i / maxHistoryLength) * width;
      const xStep = width / maxHistoryLength / 30;

      for (let f = 0; f < 30; f++) {
        const value = freqData[f][selectedAntennaPair];
        const x = xStart + f * xStep;
        let y: number;

        if (displayMode === 'amplitude') {
          // Map amplitude (0-30) to canvas height
          y = height - (value / 30) * height;
        } else {
          // Map phase (-π to π) to canvas height
          y = height / 2 - (value / Math.PI) * (height / 2);
        }

        if (f === 0 && i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }

    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Time →', 10, height - 10);
    ctx.textAlign = 'right';
    ctx.fillText(displayMode === 'amplitude' ? 'Amplitude' : 'Phase', width - 10, 20);

  }, [csiHistory, selectedAntennaPair, displayMode]);

  const getAntennaPairLabel = (index: number): string => {
    const tx = Math.floor(index / 3);
    const rx = index % 3;
    return `TX${tx + 1}-RX${rx + 1}`;
  };

  return (
    <div className={`wifi-signal-monitor flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <IconWifi size={24} className="text-blue-400" />
          <h3 className="text-lg font-semibold">WiFi CSI Monitor</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {csiHistory.length} samples
          </span>
          {isCapturing && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">Capturing</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-700">
        {/* Display Mode */}
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode('amplitude')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              displayMode === 'amplitude'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Amplitude
          </button>
          <button
            onClick={() => setDisplayMode('phase')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              displayMode === 'phase'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Phase
          </button>
        </div>

        {/* Antenna Pair Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Antenna Pair:</label>
          <select
            value={selectedAntennaPair}
            onChange={(e) => setSelectedAntennaPair(Number(e.target.value))}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i} value={i}>
                {getAntennaPairLabel(i)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-t border-gray-700">
        <div>
          <div className="text-xs text-gray-400">Frequency</div>
          <div className="text-lg font-semibold">2.4 GHz</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Bandwidth</div>
          <div className="text-lg font-semibold">40 MHz</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Sample Rate</div>
          <div className="text-lg font-semibold">100 Hz</div>
        </div>
      </div>
    </div>
  );
};

export default WiFiSignalMonitor;
