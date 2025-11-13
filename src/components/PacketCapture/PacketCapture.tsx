import React, { useState, useEffect, useRef } from 'react';
import { IconNetwork, IconPlayerPlay, IconPlayerStop, IconTrash, IconFileExport, IconChartBar, IconAlertTriangle, IconSettings, IconScript, IconFileImport, IconTerminal, IconShieldLock } from '@tabler/icons-react';
import { Packet, NetworkInterface, SecurityAlert, ExpertAlert } from '@/types';
import { cn } from '@/lib/utils';
import anime from 'animejs';
import StatisticsPanel from './StatisticsPanel';
import ConfigurationPanel from './ConfigurationPanel';
import LuaScriptEditor from './LuaScriptEditor';
import SecurityAnalysisPanel from './SecurityAnalysisPanel';
import ImportExportPanel from './ImportExportPanel';
import UtilitiesPanel from './UtilitiesPanel';
import PentestingPanel from './PentestingPanel';

export const PacketCapture: React.FC = () => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [filter, setFilter] = useState('');
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [expertAlerts, setExpertAlerts] = useState<ExpertAlert[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showLuaEditor, setShowLuaEditor] = useState(false);
  const [showSecurityAnalysis, setShowSecurityAnalysis] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showUtilities, setShowUtilities] = useState(false);
  const [showPentesting, setShowPentesting] = useState(false);
  const [currentView, setCurrentView] = useState<0 | 1>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Advanced capture options
  const [showAdvanced] = useState(false);
  const [bpfFilter, setBpfFilter] = useState('');
  const [promiscuous, setPromiscuous] = useState(true);
  const [monitorMode, setMonitorMode] = useState(false);
  const [maxPackets] = useState(0);
  const [maxDuration] = useState(0);
  const [ringBuffer, setRingBuffer] = useState(false);
  const [maxFileSize] = useState(100);
  const [maxFiles] = useState(5);

  // Animate on mount
  useEffect(() => {
    if (controlsRef.current) {
      anime({
        targets: controlsRef.current.children,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(50),
        easing: 'easeOutQuad',
      });
    }
  }, []);

  const scrollToView = (viewIndex: 0 | 1) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetScroll = viewIndex * container.clientWidth;
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      setCurrentView(viewIndex);
    }
  };

  const formatHexView = (buffer: Uint8Array): string => {
    const lines: string[] = [];
    const bytesPerLine = 16;

    for (let i = 0; i < buffer.length; i += bytesPerLine) {
      const offset = i.toString(16).padStart(8, '0');
      const chunk = buffer.slice(i, i + bytesPerLine);
      const hexBytes = Array.from(chunk)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      const ascii = Array.from(chunk)
        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('');
      const paddedHex = hexBytes.padEnd(bytesPerLine * 3 - 1, ' ');
      lines.push(`${offset}  ${paddedHex}  ${ascii}`);
    }

    return lines.join('\n');
  };

  useEffect(() => {
    const loadInterfaces = async () => {
      if (!window.api) return;
      const result = await window.api.getInterfaces();
      if (result.success && result.devices) {
        setInterfaces(result.devices);
      }
    };
    loadInterfaces();
  }, []);

  useEffect(() => {
    if (!window.api) return;

    window.api.onPacketCaptured((packet) => {
      setPackets(prev => [...prev, packet]);
    });

    window.api.onCaptureError((error) => {
      alert(`Capture error: ${error}`);
    });

    window.api.onCaptureStopped((stats) => {
      setIsCapturing(false);
      console.log(`Capture stopped. Packets: ${stats.packetCount}, Duration: ${stats.duration}s`);
    });

    window.api.onCaptureFileRotated((filepath) => {
      console.log(`Ring buffer file rotated: ${filepath}`);
    });

    window.api.onSecurityAlert((alert) => {
      setSecurityAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    window.api.onExpertAlert((alert) => {
      setExpertAlerts(prev => [alert, ...prev].slice(0, 100));
    });
  }, []);

  const handleStartCapture = async () => {
    if (!selectedInterface || !window.api) return;

    const options = {
      filter: bpfFilter,
      promiscuous,
      monitor: monitorMode,
      maxPackets,
      maxDuration,
      ringBuffer,
      maxFileSize: maxFileSize * 1024 * 1024,
      maxFiles,
      outputDir: ringBuffer ? './captures' : null
    };

    const result = await window.api.startCapture(selectedInterface, options);
    if (result.success) {
      setIsCapturing(true);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleLoadPcap = async () => {
    if (!window.api) return;
    const result = await window.api.loadPcapFile();
    if (result.success) {
      setPackets([]);
    } else if (result.error) {
      alert(`Error loading file: ${result.error}`);
    }
  };

  const handleStopCapture = async () => {
    if (!window.api) return;
    const result = await window.api.stopCapture();
    if (result.success) {
      setIsCapturing(false);
    }
  };

  const handleClear = () => {
    setPackets([]);
    setSelectedPacket(null);
    setSecurityAlerts([]);
  };

  // export helper removed (currently unused) — keep export code in UI when needed

  const filteredPackets = packets.filter(p => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return p.protocol.toLowerCase().includes(f) ||
           p.source.toLowerCase().includes(f) ||
           p.destination.toLowerCase().includes(f) ||
           p.info.toLowerCase().includes(f);
  });

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Controls */}
      <div ref={controlsRef} className="flex flex-wrap items-center gap-2">
        <select
          value={selectedInterface}
          onChange={(e) => setSelectedInterface(e.target.value)}
          disabled={isCapturing}
          className="glass-button dark:glass-button-dark rounded-xl px-4 py-2 text-sm font-medium text-gray-900 dark:text-white disabled:opacity-50"
        >
          <option value="">Select Interface...</option>
          {interfaces.map((iface) => (
            <option key={iface.name} value={iface.name}>
              {iface.description || iface.name} ({iface.addresses.map(a => a.addr).join(', ')})
            </option>
          ))}
        </select>

        <button
          onClick={handleStartCapture}
          disabled={isCapturing || !selectedInterface}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          <IconPlayerPlay size={16} />
          Start
        </button>

        <button
          onClick={handleStopCapture}
          disabled={!isCapturing}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          <IconPlayerStop size={16} />
          Stop
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          <IconTrash size={16} />
          Clear
        </button>

        <button
          onClick={handleLoadPcap}
          disabled={isCapturing}
          className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 disabled:opacity-50"
        >
          <IconFileExport size={16} />
          Load PCAP
        </button>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter packets..."
          className="glass-button dark:glass-button-dark rounded-xl px-4 py-2 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-500"
        />

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowStatistics(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400"
          >
            <IconChartBar size={16} />
          </button>
          <button
            onClick={() => setShowConfiguration(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400"
          >
            <IconSettings size={16} />
          </button>
          <button
            onClick={() => setShowLuaEditor(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400"
          >
            <IconScript size={16} />
          </button>
          <button
            onClick={() => setShowSecurityAnalysis(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400"
          >
            <IconAlertTriangle size={16} />
          </button>
          <button
            onClick={() => setShowPentesting(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-400"
          >
            <IconShieldLock size={16} />
          </button>
          <button
            onClick={() => setShowImportExport(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            <IconFileImport size={16} />
          </button>
          <button
            onClick={() => setShowUtilities(true)}
            className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-400"
          >
            <IconTerminal size={16} />
          </button>
          {/* Proxy modal removed from Packet Capture; HTTP Proxy page contains the intercepting proxy UI */}
        </div>
      </div>

      {/* Features (from docs/wireshark.md) */}
      <div className="glass-card dark:glass-card-dark rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Features</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Key packet capture & analysis capabilities (derived from Wireshark):</p>
        <ul className="mt-3 text-xs list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">
          <li>Real-time capture from Ethernet/Wi‑Fi/USB/loopback and offline PCAP/PCAPNG analysis</li>
          <li>Promiscuous / monitor modes (where supported) and remote capture support</li>
          <li>Custom capture (BPF) filters, ring buffers and time/size-based rotation</li>
          <li>Deep packet inspection across thousands of protocols and automatic protocol detection</li>
          <li>TLS/WPA decryption support (when keys available) and TCP/stream reassembly</li>
          <li>Advanced display filters, packet coloring rules and expert alerts</li>
          <li>Statistics panels: protocol hierarchy, conversations, endpoints, IO graphs, SRT and flow graphs</li>
          <li>Export to CSV/JSON/XML/PSML and TShark/CLI interoperability</li>
          <li>Extensibility: custom dissectors, Lua scripting and extcap interfaces</li>
        </ul>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="glass-card dark:glass-card-dark rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Advanced Capture Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">BPF Filter</label>
              <input
                type="text"
                value={bpfFilter}
                onChange={(e) => setBpfFilter(e.target.value)}
                placeholder="e.g., tcp port 443"
                className="w-full glass-button dark:glass-button-dark rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                disabled={isCapturing}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={promiscuous}
                  onChange={(e) => setPromiscuous(e.target.checked)}
                  disabled={isCapturing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Promiscuous Mode</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={monitorMode}
                  onChange={(e) => setMonitorMode(e.target.checked)}
                  disabled={isCapturing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Monitor Mode</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ringBuffer}
                  onChange={(e) => setRingBuffer(e.target.checked)}
                  disabled={isCapturing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Ring Buffer</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4">
        <div className="glass-card dark:glass-card-dark rounded-xl px-4 py-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Status</div>
          <div className={cn("text-sm font-semibold", isCapturing ? "text-green-600" : "text-gray-600 dark:text-gray-400")}>
            {isCapturing ? 'Capturing...' : 'Ready'}
          </div>
        </div>
        <div className="glass-card dark:glass-card-dark rounded-xl px-4 py-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Packets</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{packets.length}</div>
        </div>
        <div className="glass-card dark:glass-card-dark rounded-xl px-4 py-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Displayed</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{filteredPackets.length}</div>
        </div>
        <div className="glass-card dark:glass-card-dark rounded-xl px-4 py-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Alerts</div>
          <div className="text-sm font-semibold text-red-600">{securityAlerts.length + expertAlerts.length}</div>
        </div>
      </div>

      {/* Content Views */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          <button
            onClick={() => scrollToView(0)}
            className={cn(
              "h-2 rounded-full transition-all cursor-pointer",
              currentView === 0 ? "bg-purple-600 w-8" : "bg-white/40 dark:bg-gray-700 w-2 hover:bg-white/60 dark:hover:bg-gray-600"
            )}
          />
          <button
            onClick={() => scrollToView(1)}
            className={cn(
              "h-2 rounded-full transition-all cursor-pointer",
              currentView === 1 ? "bg-purple-600 w-8" : "bg-white/40 dark:bg-gray-700 w-2 hover:bg-white/60 dark:hover:bg-gray-600"
            )}
          />
        </div>

        <div
          ref={scrollContainerRef}
          className="flex h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Packets View */}
          <div className="min-w-full h-full snap-start flex flex-col gap-4 px-4">
            <div className={cn("glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col", selectedPacket ? "flex-[0.6]" : "flex-1")}>
              <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Packets</h3>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 glass-card dark:glass-card-dark">
                    <tr>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">No.</th>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Time</th>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Source</th>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Destination</th>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Protocol</th>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Length</th>
                      <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-600 dark:text-gray-400">
                          <IconNetwork className="mx-auto mb-2 opacity-30" size={48} />
                          <p>No packets captured yet</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPackets.map((packet) => (
                        <tr
                          key={packet.no}
                          onClick={() => setSelectedPacket(packet)}
                          className={cn(
                            "cursor-pointer border-b border-white/10 dark:border-gray-800 hover:bg-white/20 dark:hover:bg-white/5 transition-colors",
                            selectedPacket?.no === packet.no && "bg-purple-500/20"
                          )}
                        >
                          <td className="p-2 text-gray-900 dark:text-white">{packet.no}</td>
                          <td className="p-2 text-gray-900 dark:text-white">{packet.relativeTime}</td>
                          <td className="p-2 font-mono text-gray-900 dark:text-white">{packet.source}</td>
                          <td className="p-2 font-mono text-gray-900 dark:text-white">{packet.destination}</td>
                          <td className="p-2">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              packet.protocol === 'TCP' && "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                              packet.protocol === 'UDP' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
                              packet.protocol === 'ICMP' && "bg-orange-500/20 text-orange-700 dark:text-orange-300",
                              packet.protocol === 'ARP' && "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                            )}>
                              {packet.protocol}
                            </span>
                          </td>
                          <td className="p-2 text-gray-900 dark:text-white">{packet.length}</td>
                          <td className="p-2 truncate max-w-xs text-gray-900 dark:text-white">{packet.info}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPacket && (
              <div className="grid grid-cols-2 gap-4 flex-[0.4] min-h-0">
                <div className="glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col">
                  <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Packet Details</h3>
                    <button
                      onClick={() => setSelectedPacket(null)}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 text-xs space-y-2 font-mono text-gray-900 dark:text-white">
                    <div><span className="text-gray-600 dark:text-gray-400">Packet #:</span> {selectedPacket.no}</div>
                    <div><span className="text-gray-600 dark:text-gray-400">Timestamp:</span> {selectedPacket.timestamp}</div>
                    <div><span className="text-gray-600 dark:text-gray-400">Source:</span> {selectedPacket.source}</div>
                    <div><span className="text-gray-600 dark:text-gray-400">Destination:</span> {selectedPacket.destination}</div>
                    <div><span className="text-gray-600 dark:text-gray-400">Protocol:</span> {selectedPacket.protocol}</div>
                    <div><span className="text-gray-600 dark:text-gray-400">Length:</span> {selectedPacket.length} bytes</div>
                    {selectedPacket.srcPort && <div><span className="text-gray-600 dark:text-gray-400">Source Port:</span> {selectedPacket.srcPort}</div>}
                    {selectedPacket.dstPort && <div><span className="text-gray-600 dark:text-gray-400">Dest Port:</span> {selectedPacket.dstPort}</div>}
                    <div><span className="text-gray-600 dark:text-gray-400">Info:</span> {selectedPacket.info}</div>
                  </div>
                </div>

                <div className="glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col">
                  <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hex View</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-xs whitespace-pre text-gray-900 dark:text-white">
                    {selectedPacket.rawBuffer ? (
                      formatHexView(selectedPacket.rawBuffer)
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400">No raw data available</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alerts View */}
          <div className="min-w-full h-full snap-start flex flex-col gap-4 px-4">
            {(expertAlerts.length > 0 || securityAlerts.length > 0) ? (
              <>
                {expertAlerts.length > 0 && (
                  <div className="flex-1 glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col min-h-0">
                    <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconAlertTriangle size={18} className="text-orange-600" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Expert Alerts</h3>
                        <span className="text-xs text-gray-600 dark:text-gray-400">({expertAlerts.length})</span>
                      </div>
                      <button
                        onClick={() => setExpertAlerts([])}
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-2">
                      {expertAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="glass-button dark:glass-button-dark rounded-xl p-3 text-xs"
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={cn(
                                'text-xs font-semibold uppercase',
                                alert.severity === 'critical' && 'text-red-600',
                                alert.severity === 'high' && 'text-orange-600',
                                alert.severity === 'medium' && 'text-yellow-600',
                                alert.severity === 'low' && 'text-blue-600'
                              )}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-400">{alert.category}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-medium text-gray-900 dark:text-white">{alert.protocol}</span>
                          </div>
                          <div className="font-medium mb-1 text-gray-900 dark:text-white">{alert.message}</div>
                          <div className="text-gray-600 dark:text-gray-400">{alert.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {securityAlerts.length > 0 && (
                  <div className="flex-1 glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col min-h-0">
                    <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2 text-red-600">
                        <IconAlertTriangle size={16} />
                        Security Alerts ({securityAlerts.length})
                      </h3>
                      <button
                        onClick={() => setSecurityAlerts([])}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-2">
                      {securityAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="glass-button dark:glass-button-dark rounded-xl p-3 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-bold uppercase",
                              alert.severity === 'critical' && "bg-red-600 text-white",
                              alert.severity === 'high' && "bg-orange-600 text-white",
                              alert.severity === 'medium' && "bg-yellow-600 text-white",
                              alert.severity === 'low' && "bg-blue-600 text-white"
                            )}>
                              {alert.severity}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">#{alert.packet}</span>
                          </div>
                          <div className="font-semibold mb-1 text-gray-900 dark:text-white">{alert.message}</div>
                          <div className="text-gray-600 dark:text-gray-400">{alert.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center glass-card dark:glass-card-dark rounded-xl">
                <div className="text-center text-gray-600 dark:text-gray-400">
                  <IconAlertTriangle className="mx-auto mb-2 opacity-30" size={48} />
                  <p>No alerts to display</p>
                  <p className="text-xs mt-1">Alerts will appear here as they are detected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStatistics && <StatisticsPanel onClose={() => setShowStatistics(false)} />}
      {showConfiguration && <ConfigurationPanel onClose={() => setShowConfiguration(false)} />}
      {showLuaEditor && <LuaScriptEditor onClose={() => setShowLuaEditor(false)} />}
      {showSecurityAnalysis && <SecurityAnalysisPanel onClose={() => setShowSecurityAnalysis(false)} />}
      {showImportExport && <ImportExportPanel onClose={() => setShowImportExport(false)} />}
  {showUtilities && <UtilitiesPanel onClose={() => setShowUtilities(false)} />}
  {showPentesting && <PentestingPanel onClose={() => setShowPentesting(false)} />}
    </div>
  );
};
