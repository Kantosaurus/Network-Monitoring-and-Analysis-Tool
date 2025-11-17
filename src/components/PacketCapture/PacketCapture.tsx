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
      <div ref={controlsRef} className="flex flex-wrap items-center gap-3">
        <select
          value={selectedInterface}
          onChange={(e) => setSelectedInterface(e.target.value)}
          disabled={isCapturing}
          className="apple-button rounded-xl px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
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
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <IconPlayerPlay size={16} />
          Start
        </button>

        <button
          onClick={handleStopCapture}
          disabled={!isCapturing}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <IconPlayerStop size={16} />
          Stop
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 apple-button rounded-xl px-4 py-2 text-sm font-medium text-black"
        >
          <IconTrash size={16} />
          Clear
        </button>

        <button
          onClick={handleLoadPcap}
          disabled={isCapturing}
          className="flex items-center gap-2 apple-button rounded-xl px-4 py-2 text-sm font-medium text-purple-600 disabled:opacity-40"
        >
          <IconFileExport size={16} />
          Load PCAP
        </button>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter packets..."
          className="apple-input rounded-xl px-4 py-2 text-sm font-medium text-black placeholder:text-black placeholder:opacity-40 flex-1 min-w-[200px]"
        />

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowStatistics(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-blue-600 hover:shadow-sm"
            title="Statistics"
          >
            <IconChartBar size={18} />
          </button>
          <button
            onClick={() => setShowConfiguration(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-purple-600 hover:shadow-sm"
            title="Configuration"
          >
            <IconSettings size={18} />
          </button>
          <button
            onClick={() => setShowLuaEditor(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-green-600 hover:shadow-sm"
            title="Lua Scripts"
          >
            <IconScript size={18} />
          </button>
          <button
            onClick={() => setShowSecurityAnalysis(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:shadow-sm"
            title="Security Analysis"
          >
            <IconAlertTriangle size={18} />
          </button>
          <button
            onClick={() => setShowPentesting(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-orange-600 hover:shadow-sm"
            title="Pentesting Tools"
          >
            <IconShieldLock size={18} />
          </button>
          <button
            onClick={() => setShowImportExport(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-indigo-600 hover:shadow-sm"
            title="Import/Export"
          >
            <IconFileImport size={18} />
          </button>
          <button
            onClick={() => setShowUtilities(true)}
            className="flex items-center gap-2 apple-button rounded-xl px-3 py-2 text-sm font-medium text-teal-600 hover:shadow-sm"
            title="Utilities"
          >
            <IconTerminal size={18} />
          </button>
        </div>
      </div>

      {/* Features (from docs/wireshark.md) */}
      <div className="apple-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Wireshark Capabilities</h3>
        <ul className="text-xs list-disc list-inside space-y-2 text-black opacity-80 font-mono leading-relaxed">
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
        <div className="apple-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-bold text-black uppercase tracking-wide">Advanced Capture Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <label className="block text-xs font-semibold mb-2 text-black opacity-70 uppercase tracking-wide">BPF Filter</label>
              <input
                type="text"
                value={bpfFilter}
                onChange={(e) => setBpfFilter(e.target.value)}
                placeholder="e.g., tcp port 443"
                className="w-full apple-input rounded-xl px-4 py-2 text-sm text-black"
                disabled={isCapturing}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promiscuous}
                  onChange={(e) => setPromiscuous(e.target.checked)}
                  disabled={isCapturing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-black">Promiscuous Mode</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monitorMode}
                  onChange={(e) => setMonitorMode(e.target.checked)}
                  disabled={isCapturing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-black">Monitor Mode</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ringBuffer}
                  onChange={(e) => setRingBuffer(e.target.checked)}
                  disabled={isCapturing}
                  className="rounded"
                />
                <span className="text-sm font-medium text-black">Ring Buffer</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3">
        <div className="apple-card rounded-xl px-5 py-3">
          <div className="text-xs text-black opacity-60 uppercase tracking-wide font-semibold mb-1">Status</div>
          <div className={cn("text-sm font-bold font-mono", isCapturing ? "text-green-600" : "text-black opacity-70")}>
            {isCapturing ? 'Capturing...' : 'Ready'}
          </div>
        </div>
        <div className="apple-card rounded-xl px-5 py-3">
          <div className="text-xs text-black opacity-60 uppercase tracking-wide font-semibold mb-1">Packets</div>
          <div className="text-sm font-bold font-mono text-black">{packets.length}</div>
        </div>
        <div className="apple-card rounded-xl px-5 py-3">
          <div className="text-xs text-black opacity-60 uppercase tracking-wide font-semibold mb-1">Displayed</div>
          <div className="text-sm font-bold font-mono text-black">{filteredPackets.length}</div>
        </div>
        <div className="apple-card rounded-xl px-5 py-3">
          <div className="text-xs text-black opacity-60 uppercase tracking-wide font-semibold mb-1">Alerts</div>
          <div className="text-sm font-bold font-mono text-red-600">{securityAlerts.length + expertAlerts.length}</div>
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
            <div className={cn("apple-card rounded-2xl overflow-hidden flex flex-col", selectedPacket ? "flex-[0.6]" : "flex-1")}>
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-sm font-bold text-black uppercase tracking-wide">Packets</h3>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-black font-semibold">No.</th>
                      <th className="px-3 py-3 text-left text-black font-semibold">Time</th>
                      <th className="px-3 py-3 text-left text-black font-semibold">Source</th>
                      <th className="px-3 py-3 text-left text-black font-semibold">Destination</th>
                      <th className="px-3 py-3 text-left text-black font-semibold">Protocol</th>
                      <th className="px-3 py-3 text-left text-black font-semibold">Length</th>
                      <th className="px-3 py-3 text-left text-black font-semibold">Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-black opacity-60">
                          <IconNetwork className="mx-auto mb-3 opacity-30" size={48} />
                          <p className="font-mono">No packets captured yet</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPackets.map((packet) => (
                        <tr
                          key={packet.no}
                          onClick={() => setSelectedPacket(packet)}
                          className={cn(
                            "cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors",
                            selectedPacket?.no === packet.no && "bg-blue-50"
                          )}
                        >
                          <td className="px-3 py-2.5 text-black font-mono">{packet.no}</td>
                          <td className="px-3 py-2.5 text-black font-mono">{packet.relativeTime}</td>
                          <td className="px-3 py-2.5 font-mono text-black">{packet.source}</td>
                          <td className="px-3 py-2.5 font-mono text-black">{packet.destination}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-bold",
                              packet.protocol === 'TCP' && "bg-blue-100 text-blue-700",
                              packet.protocol === 'UDP' && "bg-yellow-100 text-yellow-700",
                              packet.protocol === 'ICMP' && "bg-orange-100 text-orange-700",
                              packet.protocol === 'ARP' && "bg-purple-100 text-purple-700"
                            )}>
                              {packet.protocol}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-black font-mono">{packet.length}</td>
                          <td className="px-3 py-2.5 truncate max-w-xs text-black font-mono">{packet.info}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedPacket && (
              <div className="grid grid-cols-2 gap-4 flex-[0.4] min-h-0">
                <div className="apple-card rounded-2xl overflow-hidden flex flex-col">
                  <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide">Packet Details</h3>
                    <button
                      onClick={() => setSelectedPacket(null)}
                      className="text-xs text-black opacity-60 hover:opacity-100 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-5 text-xs space-y-2.5 font-mono text-black">
                    <div><span className="opacity-60">Packet #:</span> {selectedPacket.no}</div>
                    <div><span className="opacity-60">Timestamp:</span> {selectedPacket.timestamp}</div>
                    <div><span className="opacity-60">Source:</span> {selectedPacket.source}</div>
                    <div><span className="opacity-60">Destination:</span> {selectedPacket.destination}</div>
                    <div><span className="opacity-60">Protocol:</span> {selectedPacket.protocol}</div>
                    <div><span className="opacity-60">Length:</span> {selectedPacket.length} bytes</div>
                    {selectedPacket.srcPort && <div><span className="opacity-60">Source Port:</span> {selectedPacket.srcPort}</div>}
                    {selectedPacket.dstPort && <div><span className="opacity-60">Dest Port:</span> {selectedPacket.dstPort}</div>}
                    <div><span className="opacity-60">Info:</span> {selectedPacket.info}</div>
                  </div>
                </div>

                <div className="apple-card rounded-2xl overflow-hidden flex flex-col">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wide">Hex View</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-5 font-mono text-xs whitespace-pre text-black">
                    {selectedPacket.rawBuffer ? (
                      formatHexView(selectedPacket.rawBuffer)
                    ) : (
                      <div className="text-black opacity-60">No raw data available</div>
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
                  <div className="flex-1 apple-card rounded-2xl overflow-hidden flex flex-col min-h-0">
                    <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconAlertTriangle size={18} className="text-orange-600" />
                        <h3 className="text-sm font-bold text-black uppercase tracking-wide">Expert Alerts</h3>
                        <span className="text-xs text-black opacity-60 font-mono">({expertAlerts.length})</span>
                      </div>
                      <button
                        onClick={() => setExpertAlerts([])}
                        className="text-xs text-black opacity-60 hover:opacity-100 font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-5 space-y-3">
                      {expertAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="apple-button rounded-xl p-4 text-xs hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className={cn(
                                'text-xs font-bold uppercase',
                                alert.severity === 'critical' && 'text-red-600',
                                alert.severity === 'high' && 'text-orange-600',
                                alert.severity === 'medium' && 'text-yellow-600',
                                alert.severity === 'low' && 'text-blue-600'
                              )}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-black opacity-30">•</span>
                            <span className="text-black opacity-70">{alert.category}</span>
                            <span className="text-black opacity-30">•</span>
                            <span className="font-semibold text-black">{alert.protocol}</span>
                          </div>
                          <div className="font-semibold mb-1 text-black">{alert.message}</div>
                          <div className="text-black opacity-70 font-mono">{alert.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {securityAlerts.length > 0 && (
                  <div className="flex-1 apple-card rounded-2xl overflow-hidden flex flex-col min-h-0">
                    <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-red-600 uppercase tracking-wide">
                        <IconAlertTriangle size={18} />
                        Security Alerts ({securityAlerts.length})
                      </h3>
                      <button
                        onClick={() => setSecurityAlerts([])}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-5 space-y-3">
                      {securityAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className="apple-button rounded-xl p-4 text-xs hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                              alert.severity === 'critical' && "bg-red-600 text-white",
                              alert.severity === 'high' && "bg-orange-600 text-white",
                              alert.severity === 'medium' && "bg-yellow-600 text-white",
                              alert.severity === 'low' && "bg-blue-600 text-white"
                            )}>
                              {alert.severity}
                            </span>
                            <span className="text-black opacity-60 font-mono">#{alert.packet}</span>
                          </div>
                          <div className="font-semibold mb-1 text-black">{alert.message}</div>
                          <div className="text-black opacity-70 font-mono">{alert.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center apple-card rounded-2xl">
                <div className="text-center text-black opacity-60">
                  <IconAlertTriangle className="mx-auto mb-3 opacity-30" size={48} />
                  <p className="font-mono">No alerts to display</p>
                  <p className="text-xs mt-2 font-mono">Alerts will appear here as they are detected</p>
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
