/**
 * CSI Capture Panel Component
 *
 * Controls and displays WiFi CSI (Channel State Information) capture.
 * Integrates with WiFi hardware or simulates CSI data for testing.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { IconWifi, IconWifiOff, IconAntenna } from '@tabler/icons-react';

interface CSICapturePanelProps {
  isCapturing: boolean;
  onDataReceived: (amplitude: number[][][], phase: number[][][]) => void;
  className?: string;
}

interface WiFiDevice {
  id: string;
  name: string;
  type: 'transmitter' | 'receiver';
  antennas: number;
  connected: boolean;
}

const CSICapturePanel: React.FC<CSICapturePanelProps> = ({
  isCapturing,
  onDataReceived,
  className = ''
}) => {
  const [devices, setDevices] = useState<WiFiDevice[]>([
    { id: 'tx1', name: 'TX Router 1', type: 'transmitter', antennas: 3, connected: true },
    { id: 'rx1', name: 'RX Router 1', type: 'receiver', antennas: 3, connected: true }
  ]);
  const [captureStats, setCaptureStats] = useState({
    packetsReceived: 0,
    sampleRate: 0,
    lastUpdate: Date.now()
  });
  const [simulationMode, setSimulationMode] = useState(true);

  // Simulate or capture CSI data
  useEffect(() => {
    if (!isCapturing) return;

    let packetsCount = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      // Generate or capture CSI data
      const { amplitude, phase } = simulationMode
        ? generateSimulatedCSI()
        : captureRealCSI();

      // Send to parent
      onDataReceived(amplitude, phase);

      // Update stats
      packetsCount++;
      const elapsed = (Date.now() - startTime) / 1000;
      const sampleRate = packetsCount / elapsed;

      setCaptureStats({
        packetsReceived: packetsCount,
        sampleRate: Math.round(sampleRate),
        lastUpdate: Date.now()
      });
    }, 100); // 10 Hz

    return () => clearInterval(interval);
  }, [isCapturing, simulationMode, onDataReceived]);

  const generateSimulatedCSI = (): { amplitude: number[][][], phase: number[][][] } => {
    // Generate dummy CSI data matching the expected format:
    // 5 consecutive samples × 30 frequencies × 3 TX × 3 RX

    const amplitude: number[][][] = [];
    const phase: number[][][] = [];

    for (let sample = 0; sample < 5; sample++) {
      const ampSample: number[][] = [];
      const phaseSample: number[][] = [];

      for (let freq = 0; freq < 30; freq++) {
        const ampRow: number[] = [];
        const phaseRow: number[] = [];

        for (let antenna = 0; antenna < 9; antenna++) { // 3x3 = 9 pairs
          // Simulate realistic CSI values
          // Amplitude typically ranges from 10-30
          const baseAmp = 20 + Math.sin(freq * 0.1 + sample * 0.5) * 5;
          const noise = (Math.random() - 0.5) * 2;
          ampRow.push(baseAmp + noise);

          // Phase ranges from -π to π
          const basePhase = Math.sin(freq * 0.2 + antenna * 0.3) * Math.PI;
          const phaseNoise = (Math.random() - 0.5) * 0.5;
          phaseRow.push(basePhase + phaseNoise);
        }

        ampSample.push(ampRow);
        phaseSample.push(phaseRow);
      }

      amplitude.push(ampSample);
      phase.push(phaseSample);
    }

    return { amplitude, phase };
  };

  const captureRealCSI = (): { amplitude: number[][][], phase: number[][][] } => {
    // This would integrate with actual WiFi CSI capture hardware
    // For now, return simulated data
    // TODO: Integrate with ESP32, Linux 802.11n CSI Tool, or similar

    console.log('Real CSI capture not implemented - using simulation');
    return generateSimulatedCSI();
  };

  const handleDeviceToggle = (deviceId: string) => {
    setDevices(prev => prev.map(dev =>
      dev.id === deviceId ? { ...dev, connected: !dev.connected } : dev
    ));
  };

  const handleAddDevice = () => {
    const newDevice: WiFiDevice = {
      id: `dev${devices.length + 1}`,
      name: `Device ${devices.length + 1}`,
      type: 'receiver',
      antennas: 3,
      connected: false
    };
    setDevices(prev => [...prev, newDevice]);
  };

  return (
    <div className={`csi-capture-panel bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <IconAntenna size={20} className="text-blue-400" />
          <h3 className="font-semibold">CSI Capture</h3>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {simulationMode ? 'Simulation' : 'Hardware'}
          </span>
          <button
            onClick={() => setSimulationMode(!simulationMode)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              simulationMode ? 'bg-gray-600' : 'bg-blue-600'
            }`}
            title={simulationMode ? 'Switch to hardware mode' : 'Switch to simulation mode'}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                simulationMode ? '' : 'translate-x-5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Devices List */}
      <div className="p-4 space-y-2">
        <div className="text-xs text-gray-400 mb-2">WiFi Devices</div>

        {devices.map(device => (
          <div
            key={device.id}
            className="flex items-center justify-between p-3 bg-gray-750 rounded border border-gray-600"
          >
            <div className="flex items-center gap-3">
              {device.connected ? (
                <IconWifi size={18} className="text-green-400" />
              ) : (
                <IconWifiOff size={18} className="text-gray-500" />
              )}

              <div>
                <div className="text-sm font-medium">{device.name}</div>
                <div className="text-xs text-gray-400">
                  {device.type === 'transmitter' ? 'TX' : 'RX'} • {device.antennas} antennas
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDeviceToggle(device.id)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                device.connected
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              }`}
            >
              {device.connected ? 'Connected' : 'Disconnected'}
            </button>
          </div>
        ))}

        {/* Add Device Button */}
        <button
          onClick={handleAddDevice}
          className="w-full py-2 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          + Add Device
        </button>
      </div>

      {/* Capture Stats */}
      {isCapturing && (
        <div className="p-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-400">Packets</div>
              <div className="text-lg font-semibold text-blue-400">
                {captureStats.packetsReceived}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Sample Rate</div>
              <div className="text-lg font-semibold text-green-400">
                {captureStats.sampleRate} Hz
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Configuration (if not in simulation mode) */}
      {!simulationMode && (
        <div className="p-4 border-t border-gray-700 bg-yellow-900 bg-opacity-20">
          <div className="text-xs text-yellow-400 mb-2">⚠️ Hardware Mode Configuration</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• Ensure WiFi routers are connected via network</div>
            <div>• Configure CSI capture on router firmware</div>
            <div>• Verify antenna alignment (3 TX × 3 RX)</div>
            <div>• Set frequency: 2.4 GHz, bandwidth: 40 MHz</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSICapturePanel;
