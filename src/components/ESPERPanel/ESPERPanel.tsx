/**
 * ESPER Panel - WiFi-Based Human Body Mapping
 *
 * Main component for the Enhanced Sensing & Pose Estimation via Radio (ESPER) system.
 * Provides real-time WiFi CSI capture, DensePose prediction, and 3D body visualization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IconRadar, IconUser, IconSettings, IconPlayerPlay, IconPlayerPause, IconRefresh, IconShield } from '@tabler/icons-react';
import { densePoseService, type PredictionResponse, type HealthResponse } from '../../services/densePoseService';
import WiFiSignalMonitor from './WiFiSignalMonitor';
import DensePoseVisualization from './DensePoseVisualization';
import BodyMappingCanvas from './BodyMappingCanvas';
import CSICapturePanel from './CSICapturePanel';
import WiFiPentestingPanel from './WiFiPentestingPanel';

interface ESPERPanelProps {
  className?: string;
}

type ViewMode = 'overview' | 'signals' | 'densepose' | 'mapping' | 'pentesting';

const ESPERPanel: React.FC<ESPERPanelProps> = ({ className = '' }) => {
  // State
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverHealth, setServerHealth] = useState<HealthResponse | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [autoPredict, setAutoPredict] = useState(false);

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const checkServerHealth = async () => {
    try {
      const health = await densePoseService.checkHealth();
      setServerHealth(health);
      setError(null);
    } catch (err) {
      setServerHealth(null);
      setError('DensePose server is not running. Please start the server.');
    }
  };

  const handleStartCapture = useCallback(() => {
    setIsCapturing(true);
    setError(null);
  }, []);

  const handleStopCapture = useCallback(() => {
    setIsCapturing(false);
  }, []);

  const handleCSIDataReceived = useCallback(async (amplitude: number[][][], phase: number[][][]) => {
    if (!autoPredict) return;

    try {
      setIsProcessing(true);
      setError(null);

      const result = await densePoseService.predict({ amplitude, phase });
      setPredictionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsProcessing(false);
    }
  }, [autoPredict]);

  const handleManualPredict = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Get current CSI data from capture panel
      // This would be implemented based on your CSI capture integration
      console.log('Manual prediction triggered');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const isServerHealthy = serverHealth?.status === 'healthy' && serverHealth?.model_loaded;

  return (
    <div className={`esper-panel flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="esper-header flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <IconRadar size={32} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">ESPER - Body Mapping</h1>
            <p className="text-sm text-gray-400">WiFi-Based Human Pose Estimation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Server Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isServerHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {isServerHealthy ? 'Server Online' : 'Server Offline'}
            </span>
          </div>

          {/* Settings */}
          <button
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <IconSettings size={20} />
          </button>

          {/* Refresh */}
          <button
            onClick={checkServerHealth}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh Status"
          >
            <IconRefresh size={20} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2 px-6 py-3 bg-gray-800 border-b border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: IconRadar },
          { id: 'signals', label: 'WiFi Signals', icon: IconRadar },
          { id: 'densepose', label: 'DensePose', icon: IconUser },
          { id: 'mapping', label: '3D Mapping', icon: IconUser },
          { id: 'pentesting', label: 'WiFi Pentesting', icon: IconShield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id as ViewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
          {/* Left Column - Control & Capture */}
          <div className="lg:col-span-1 space-y-4">
            {/* Control Panel */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Control Panel</h3>

              <div className="space-y-3">
                {/* Capture Controls */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">WiFi Capture</label>
                  <div className="flex gap-2">
                    {!isCapturing ? (
                      <button
                        onClick={handleStartCapture}
                        disabled={!isServerHealthy}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <IconPlayerPlay size={18} />
                        Start Capture
                      </button>
                    ) : (
                      <button
                        onClick={handleStopCapture}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <IconPlayerPause size={18} />
                        Stop Capture
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto Predict Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">Auto Predict</label>
                  <button
                    onClick={() => setAutoPredict(!autoPredict)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      autoPredict ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        autoPredict ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Manual Predict */}
                <button
                  onClick={handleManualPredict}
                  disabled={!isServerHealthy || isProcessing}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Predict Now'}
                </button>
              </div>
            </div>

            {/* CSI Capture Panel */}
            <CSICapturePanel
              isCapturing={isCapturing}
              onDataReceived={handleCSIDataReceived}
            />

            {/* Statistics */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Server:</span>
                  <span className={isServerHealthy ? 'text-green-400' : 'text-red-400'}>
                    {isServerHealthy ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Device:</span>
                  <span className="text-blue-400">{serverHealth?.device || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">CUDA:</span>
                  <span className={serverHealth?.cuda_available ? 'text-green-400' : 'text-gray-400'}>
                    {serverHealth?.cuda_available ? 'Available' : 'Not Available'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Predictions:</span>
                  <span className="text-blue-400">{predictionResult ? 1 : 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visualization */}
          <div className="lg:col-span-2 space-y-4">
            {viewMode === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <WiFiSignalMonitor className="bg-gray-800 rounded-lg border border-gray-700" />
                <DensePoseVisualization
                  result={predictionResult}
                  className="bg-gray-800 rounded-lg border border-gray-700"
                />
              </div>
            )}

            {viewMode === 'signals' && (
              <WiFiSignalMonitor
                isCapturing={isCapturing}
                className="h-full bg-gray-800 rounded-lg border border-gray-700"
              />
            )}

            {viewMode === 'densepose' && (
              <DensePoseVisualization
                result={predictionResult}
                className="h-full bg-gray-800 rounded-lg border border-gray-700"
              />
            )}

            {viewMode === 'mapping' && (
              <BodyMappingCanvas
                result={predictionResult}
                className="h-full bg-gray-800 rounded-lg border border-gray-700"
              />
            )}

            {viewMode === 'pentesting' && (
              <WiFiPentestingPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESPERPanel;
