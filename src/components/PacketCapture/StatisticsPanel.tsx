import React, { useState, useEffect } from 'react';
import {
  IconChartBar,
  IconNetwork,
  IconServer,
  IconChartLine,
  IconAlertTriangle,
  IconRefresh
} from '@tabler/icons-react';
import {
  ProtocolHierarchyItem,
  ConversationItem,
  EndpointItem,
  IOGraphDataPoint,
  TCPStreamInfo,
  ExpertAlert,
  SRTStatistic,
  FlowGraphItem,
  PacketLengthStats,
  TimingStats,
  DNSQueryResponse,
  VoIPCall,
  BandwidthTalker,
  LatencyMeasurement
} from '../../types';

interface StatisticsPanelProps {
  onClose: () => void;
}

type TabType = 'hierarchy' | 'conversations' | 'endpoints' | 'io-graph' | 'tcp-streams' | 'expert' | 'srt' | 'flow' | 'packet-length' | 'timing' | 'conv-map' | 'dns' | 'voip' | 'bandwidth' | 'latency';

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('hierarchy');
  const [conversationType, setConversationType] = useState<'ip' | 'tcp' | 'udp'>('ip');
  const [endpointType, setEndpointType] = useState<'ip' | 'tcp' | 'udp'>('ip');

  // Data states
  const [protocolHierarchy, setProtocolHierarchy] = useState<ProtocolHierarchyItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointItem[]>([]);
  const [ioGraph, setIOGraph] = useState<IOGraphDataPoint[]>([]);
  const [tcpStreams, setTCPStreams] = useState<TCPStreamInfo[]>([]);
  const [expertAlerts, setExpertAlerts] = useState<ExpertAlert[]>([]);
  const [srtStats, setSRTStats] = useState<SRTStatistic[]>([]);
  const [flowGraph, setFlowGraph] = useState<FlowGraphItem[]>([]);
  const [packetLengthStats, setPacketLengthStats] = useState<PacketLengthStats | null>(null);
  const [timingStats, setTimingStats] = useState<TimingStats | null>(null);
  const [dnsAnalysis, setDnsAnalysis] = useState<DNSQueryResponse[]>([]);
  const [voipCalls, setVoipCalls] = useState<VoIPCall[]>([]);
  const [bandwidthTalkers, setBandwidthTalkers] = useState<BandwidthTalker[]>([]);
  const [latencyMeasurements, setLatencyMeasurements] = useState<LatencyMeasurement[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, conversationType, endpointType]);

  const loadData = async () => {
    if (!window.api) return;

    setLoading(true);

    try {
      switch (activeTab) {
        case 'hierarchy':
          const hierarchyResult = await window.api.getProtocolHierarchy();
          if (hierarchyResult.success && hierarchyResult.data) {
            setProtocolHierarchy(hierarchyResult.data);
          }
          break;

        case 'conversations':
          const convsResult = await window.api.getConversations(conversationType);
          if (convsResult.success && convsResult.data) {
            setConversations(convsResult.data);
          }
          break;

        case 'endpoints':
          const endpointsResult = await window.api.getEndpoints(endpointType);
          if (endpointsResult.success && endpointsResult.data) {
            setEndpoints(endpointsResult.data);
          }
          break;

        case 'io-graph':
          const ioResult = await window.api.getIOGraph();
          if (ioResult.success && ioResult.data) {
            setIOGraph(ioResult.data);
          }
          break;

        case 'tcp-streams':
          const streamsResult = await window.api.getTCPStreams();
          if (streamsResult.success && streamsResult.data) {
            setTCPStreams(streamsResult.data);
          }
          break;

        case 'expert':
          const alertsResult = await window.api.getExpertAlerts();
          if (alertsResult.success && alertsResult.data) {
            setExpertAlerts(alertsResult.data);
          }
          break;

        case 'srt':
          const srtResult = await window.api.getSRTStatistics();
          if (srtResult.success && srtResult.data) {
            setSRTStats(srtResult.data);
          }
          break;

        case 'flow':
          const flowResult = await window.api.getFlowGraph();
          if (flowResult.success && flowResult.data) {
            setFlowGraph(flowResult.data);
          }
          break;

        case 'packet-length':
          const lengthResult = await window.api.getPacketLengthStats();
          if (lengthResult.success && lengthResult.data) {
            setPacketLengthStats(lengthResult.data);
          }
          break;

        case 'timing':
          const timingResult = await window.api.getTimingStats();
          if (timingResult.success && timingResult.data) {
            setTimingStats(timingResult.data);
          }
          break;

        case 'conv-map':
          // Use existing conversations data for visual map
          const convMapResult = await window.api.getConversations(conversationType);
          if (convMapResult.success && convMapResult.data) {
            setConversations(convMapResult.data);
          }
          break;

        case 'dns':
          const dnsResult = await window.api.getDNSAnalysis();
          if (dnsResult.success && dnsResult.data) {
            setDnsAnalysis(dnsResult.data);
          }
          break;

        case 'voip':
          const voipResult = await window.api.getVoIPAnalysis();
          if (voipResult.success && voipResult.data) {
            setVoipCalls(voipResult.data);
          }
          break;

        case 'bandwidth':
          const bandwidthResult = await window.api.getBandwidthTalkers();
          if (bandwidthResult.success && bandwidthResult.data) {
            setBandwidthTalkers(bandwidthResult.data);
          }
          break;

        case 'latency':
          const latencyResult = await window.api.getLatencyMeasurements();
          if (latencyResult.success && latencyResult.data) {
            setLatencyMeasurements(latencyResult.data);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'xml' | 'psml') => {
    if (!window.api) return;

    const typeMap: Record<TabType, string> = {
      'hierarchy': 'protocol-hierarchy',
      'conversations': `conversations-${conversationType}`,
      'endpoints': `endpoints-${endpointType}`,
      'io-graph': 'io-graph',
      'tcp-streams': 'tcp-streams',
      'expert': 'expert-alerts',
      'srt': 'srt-statistics',
      'flow': 'flow-graph',
      'packet-length': 'packet-length-stats',
      'timing': 'timing-stats',
      'conv-map': `conversation-map-${conversationType}`,
      'dns': 'dns-analysis',
      'voip': 'voip-analysis',
      'bandwidth': 'bandwidth-talkers',
      'latency': 'latency-measurements'
    };

    const result = await window.api.exportStatistics(typeMap[activeTab], format);
    if (result.success) {
      alert('Statistics exported successfully!');
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="apple-card rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full max-w-7xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <IconChartBar size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">Statistics & Analysis</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-black hover:bg-gray-50"
            >
              <IconRefresh size={16} />
              Refresh
            </button>
            <div className="flex gap-1 rounded-xl border-2 border-gray-200 p-1">
              <button
                onClick={() => handleExport('json')}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-gray-100"
                title="Export as JSON"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-gray-100"
                title="Export as CSV"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('xml')}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-gray-100"
                title="Export as XML"
              >
                XML
              </button>
              <button
                onClick={() => handleExport('psml')}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg hover:bg-gray-100"
                title="Export as PSML"
              >
                PSML
              </button>
            </div>
            <button
              onClick={onClose}
              className="apple-button rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto bg-gray-50">
          {[
            { id: 'hierarchy', label: 'Protocol Hierarchy', icon: IconChartBar },
            { id: 'conversations', label: 'Conversations', icon: IconNetwork },
            { id: 'endpoints', label: 'Endpoints', icon: IconServer },
            { id: 'bandwidth', label: 'Bandwidth Analysis', icon: IconChartBar },
            { id: 'io-graph', label: 'I/O Graph', icon: IconChartLine },
            { id: 'tcp-streams', label: 'TCP Streams', icon: IconNetwork },
            { id: 'latency', label: 'Latency & RTT', icon: IconChartLine },
            { id: 'packet-length', label: 'Packet Length', icon: IconChartBar },
            { id: 'timing', label: 'Timing & Jitter', icon: IconChartLine },
            { id: 'dns', label: 'DNS Analysis', icon: IconServer },
            { id: 'voip', label: 'VoIP/RTP', icon: IconNetwork },
            { id: 'conv-map', label: 'Conversation Map', icon: IconNetwork },
            { id: 'expert', label: 'Expert Alerts', icon: IconAlertTriangle },
            { id: 'srt', label: 'Service Response Time', icon: IconChartLine },
            { id: 'flow', label: 'Flow Graph', icon: IconNetwork }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 bg-white'
                    : 'border-transparent text-black opacity-60 hover:opacity-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <>
              {/* Protocol Hierarchy */}
              {activeTab === 'hierarchy' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Protocol Distribution</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Protocol</th>
                          <th className="px-4 py-2 text-right">Packets</th>
                          <th className="px-4 py-2 text-right">Bytes</th>
                          <th className="px-4 py-2 text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {protocolHierarchy.map((proto, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-2 font-medium">{proto.protocol}</td>
                            <td className="px-4 py-2 text-right">{proto.packets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{formatBytes(proto.bytes)}</td>
                            <td className="px-4 py-2 text-right">{proto.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {protocolHierarchy.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No protocol data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Conversations */}
              {activeTab === 'conversations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Network Conversations</h3>
                    <select
                      value={conversationType}
                      onChange={(e) => setConversationType(e.target.value as 'ip' | 'tcp' | 'udp')}
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <option value="ip">IPv4</option>
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                    </select>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Address A</th>
                          {conversationType !== 'ip' && <th className="px-4 py-2 text-left">Port A</th>}
                          <th className="px-4 py-2 text-left">Address B</th>
                          {conversationType !== 'ip' && <th className="px-4 py-2 text-left">Port B</th>}
                          <th className="px-4 py-2 text-right">Packets</th>
                          <th className="px-4 py-2 text-right">Bytes</th>
                          <th className="px-4 py-2 text-right">Duration (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversations.map((conv, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-2 font-mono text-xs">{conv.addressA}</td>
                            {conversationType !== 'ip' && <td className="px-4 py-2">{conv.portA}</td>}
                            <td className="px-4 py-2 font-mono text-xs">{conv.addressB}</td>
                            {conversationType !== 'ip' && <td className="px-4 py-2">{conv.portB}</td>}
                            <td className="px-4 py-2 text-right">{conv.packets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">
                              {conversationType === 'ip'
                                ? formatBytes((conv.bytesAtoB || 0) + (conv.bytesBtoA || 0))
                                : formatBytes(conv.bytes || 0)}
                            </td>
                            <td className="px-4 py-2 text-right">{conv.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {conversations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No conversation data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Endpoints */}
              {activeTab === 'endpoints' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Network Endpoints</h3>
                    <select
                      value={endpointType}
                      onChange={(e) => setEndpointType(e.target.value as 'ip' | 'tcp' | 'udp')}
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <option value="ip">IPv4</option>
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                    </select>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Address</th>
                          {endpointType !== 'ip' && <th className="px-4 py-2 text-left">Port</th>}
                          <th className="px-4 py-2 text-right">Packets</th>
                          <th className="px-4 py-2 text-right">Bytes</th>
                          <th className="px-4 py-2 text-right">TX Packets</th>
                          <th className="px-4 py-2 text-right">TX Bytes</th>
                          <th className="px-4 py-2 text-right">RX Packets</th>
                          <th className="px-4 py-2 text-right">RX Bytes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoints.map((endpoint, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-2 font-mono text-xs">{endpoint.address}</td>
                            {endpointType !== 'ip' && <td className="px-4 py-2">{endpoint.port}</td>}
                            <td className="px-4 py-2 text-right">{endpoint.packets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{formatBytes(endpoint.bytes)}</td>
                            <td className="px-4 py-2 text-right">{endpoint.txPackets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{formatBytes(endpoint.txBytes)}</td>
                            <td className="px-4 py-2 text-right">{endpoint.rxPackets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{formatBytes(endpoint.rxBytes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {endpoints.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No endpoint data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* I/O Graph */}
              {activeTab === 'io-graph' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">I/O Graph (Packet Rate Over Time)</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Time</th>
                          <th className="px-4 py-2 text-right">Packets</th>
                          <th className="px-4 py-2 text-right">Bytes</th>
                          <th className="px-4 py-2 text-right">Avg Packet Size</th>
                          <th className="px-4 py-2 text-left">Top Protocols</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ioGraph.map((dataPoint, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-2 font-mono text-xs">
                              {new Date(dataPoint.time).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-2 text-right">{dataPoint.packets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{formatBytes(dataPoint.bytes)}</td>
                            <td className="px-4 py-2 text-right">{dataPoint.avgPacketSize.toFixed(2)} B</td>
                            <td className="px-4 py-2">
                              {Object.entries(dataPoint.protocols)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([proto, count]) => `${proto}(${count})`)
                                .join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {ioGraph.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No I/O graph data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* TCP Streams */}
              {activeTab === 'tcp-streams' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">TCP Stream Analysis</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Stream</th>
                          <th className="px-4 py-2 text-right">Packets</th>
                          <th className="px-4 py-2 text-right">Retransmissions</th>
                          <th className="px-4 py-2 text-right">Out of Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tcpStreams.map((stream, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-2 font-mono text-xs">{stream.stream}</td>
                            <td className="px-4 py-2 text-right">{stream.packets.toLocaleString()}</td>
                            <td className={`px-4 py-2 text-right ${stream.retransmissions > 0 ? 'text-orange-600 font-semibold' : ''}`}>
                              {stream.retransmissions}
                            </td>
                            <td className={`px-4 py-2 text-right ${stream.outOfOrder > 0 ? 'text-yellow-600 font-semibold' : ''}`}>
                              {stream.outOfOrder}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {tcpStreams.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No TCP stream data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Expert Alerts */}
              {activeTab === 'expert' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Expert System Alerts</h3>
                  <div className="space-y-2">
                    {expertAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      >
                        <div className="flex items-start gap-3">
                          <IconAlertTriangle className={`mt-0.5 ${getSeverityColor(alert.severity)}`} size={20} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold uppercase ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{alert.category}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm font-medium">{alert.protocol}</span>
                            </div>
                            <p className="mt-1 font-medium">{alert.message}</p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{alert.details}</p>
                            <div className="mt-2 flex gap-4 text-xs text-gray-500">
                              <span>Packet #{alert.packet}</span>
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {expertAlerts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No expert alerts</div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Response Time */}
              {activeTab === 'srt' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Service Response Time Statistics</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-100 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Stream</th>
                          <th className="px-4 py-2 text-right">Packets</th>
                          <th className="px-4 py-2 text-right">Avg Time (ms)</th>
                          <th className="px-4 py-2 text-right">Min Time (ms)</th>
                          <th className="px-4 py-2 text-right">Max Time (ms)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {srtStats.map((stat, idx) => (
                          <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-2 font-mono text-xs">{stat.stream}</td>
                            <td className="px-4 py-2 text-right">{stat.packets.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">{stat.avgResponseTime}</td>
                            <td className="px-4 py-2 text-right">{stat.minResponseTime}</td>
                            <td className="px-4 py-2 text-right">{stat.maxResponseTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {srtStats.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No SRT data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Flow Graph */}
              {activeTab === 'flow' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Flow Graph (Packet Sequence)</h3>
                  <div className="overflow-auto max-h-[600px]">
                    <div className="space-y-2">
                      {flowGraph.map((flow, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-2"
                        >
                          <span className="text-xs text-gray-500 w-12">{flow.no}</span>
                          <span className="text-xs text-gray-500 w-24">{new Date(flow.timestamp).toLocaleTimeString()}</span>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {flow.source}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-mono text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                              {flow.destination}
                            </span>
                          </div>
                          <span className="text-xs font-medium w-16">{flow.protocol}</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-20 text-right">{flow.length} B</span>
                          <span className="text-xs text-gray-500 flex-1 truncate">{flow.info}</span>
                        </div>
                      ))}
                    </div>
                    {flowGraph.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No flow data available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Packet Length Statistics */}
              {activeTab === 'packet-length' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Packet Length Distribution</h3>
                  {packetLengthStats ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Minimum Length</div>
                          <div className="text-2xl font-bold text-blue-600">{packetLengthStats.minLength} B</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Average Length</div>
                          <div className="text-2xl font-bold text-green-600">{packetLengthStats.avgLength.toFixed(2)} B</div>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Maximum Length</div>
                          <div className="text-2xl font-bold text-purple-600">{packetLengthStats.maxLength} B</div>
                        </div>
                      </div>

                      <div className="overflow-auto">
                        <h4 className="font-medium mb-2">Size Distribution</h4>
                        <table className="w-full text-sm">
                          <thead className="bg-neutral-100 dark:bg-neutral-800">
                            <tr>
                              <th className="px-4 py-2 text-left">Packet Size Range</th>
                              <th className="px-4 py-2 text-right">Count</th>
                              <th className="px-4 py-2 text-right">Percentage</th>
                              <th className="px-4 py-2 text-left">Visual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {packetLengthStats.distribution.map((item, idx) => (
                              <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800">
                                <td className="px-4 py-2 font-medium">{item.range}</td>
                                <td className="px-4 py-2 text-right">{item.count.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">{item.percentage}%</td>
                                <td className="px-4 py-2">
                                  <div className="bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-purple-600 h-full rounded-full"
                                      style={{ width: `${item.percentage}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No packet length data available</div>
                  )}
                </div>
              )}

              {/* Timing and Jitter Statistics */}
              {activeTab === 'timing' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Packet Timing & Jitter Analysis</h3>
                  {timingStats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Average Delay</div>
                          <div className="text-2xl font-bold text-blue-600">{timingStats.avgDelay}</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Packet Rate</div>
                          <div className="text-2xl font-bold text-green-600">{timingStats.packetRate.toFixed(2)} pkt/s</div>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Jitter</div>
                          <div className="text-2xl font-bold text-yellow-600">{timingStats.jitter}</div>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Delay Range</div>
                          <div className="text-lg font-bold text-purple-600">
                            {timingStats.minDelay} - {timingStats.maxDelay}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium mb-2">Timing Analysis Summary</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>Inter-packet delay measures time between consecutive packets</li>
                          <li>Jitter indicates variation in packet arrival times (lower is better for real-time traffic)</li>
                          <li>High jitter values may indicate network congestion or routing issues</li>
                          <li>Packet rate shows the average throughput in packets per second</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No timing data available</div>
                  )}
                </div>
              )}

              {/* Conversation Map (Visual) */}
              {activeTab === 'conv-map' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Visual Conversation Map</h3>
                    <select
                      value={conversationType}
                      onChange={(e) => setConversationType(e.target.value as 'ip' | 'tcp' | 'udp')}
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <option value="ip">IPv4</option>
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                    </select>
                  </div>

                  {conversations.length > 0 ? (
                    <div className="space-y-4">
                      {conversations.slice(0, 20).map((conv, idx) => {
                        const totalBytes = (conv.bytesAtoB || 0) + (conv.bytesBtoA || 0) || conv.bytes || 0;
                        const maxBytes = Math.max(...conversations.map(c => (c.bytesAtoB || 0) + (c.bytesBtoA || 0) || c.bytes || 0));
                        const widthPercentage = (totalBytes / maxBytes) * 100;

                        return (
                          <div key={idx} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded font-semibold">
                                    {conv.addressA}
                                    {conversationType !== 'ip' && conv.portA && `:${conv.portA}`}
                                  </span>
                                  <span className="text-gray-400">⟷</span>
                                  <span className="font-mono text-sm bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded font-semibold">
                                    {conv.addressB}
                                    {conversationType !== 'ip' && conv.portB && `:${conv.portB}`}
                                  </span>
                                </div>
                                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                                  <span>{conv.packets.toLocaleString()} packets</span>
                                  <span>•</span>
                                  <span>{formatBytes(totalBytes)}</span>
                                  <span>•</span>
                                  <span>Duration: {conv.duration}s</span>
                                </div>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all"
                                  style={{ width: `${widthPercentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between mt-1 text-xs text-gray-500">
                                <span>A→B: {formatBytes(conv.bytesAtoB || 0)}</span>
                                <span>B→A: {formatBytes(conv.bytesBtoA || 0)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {conversations.length > 20 && (
                        <div className="text-center text-sm text-gray-500">
                          Showing top 20 of {conversations.length} conversations
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No conversation data available</div>
                  )}
                </div>
              )}

              {/* DNS Analysis */}
              {activeTab === 'dns' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">DNS Troubleshooting & Analysis</h3>
                  {dnsAnalysis.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-100 dark:bg-neutral-800">
                          <tr>
                            <th className="px-4 py-2 text-left">Time</th>
                            <th className="px-4 py-2 text-left">Query</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-right">Response Time</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Answers</th>
                            <th className="px-4 py-2 text-right">Packet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dnsAnalysis.map((dns, idx) => (
                            <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="px-4 py-2 font-mono text-xs">{dns.timestamp}</td>
                              <td className="px-4 py-2 font-medium">{dns.query}</td>
                              <td className="px-4 py-2">{dns.queryType}</td>
                              <td className={`px-4 py-2 text-right ${parseFloat(dns.responseTime) > 100 ? 'text-red-600 font-semibold' : ''}`}>
                                {dns.responseTime}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${dns.responseCode === 'NOERROR' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {dns.responseCode}
                                </span>
                              </td>
                              <td className="px-4 py-2 font-mono text-xs">{dns.answers.join(', ') || 'N/A'}</td>
                              <td className="px-4 py-2 text-right">#{dns.packet}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No DNS queries captured</div>
                  )}
                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">DNS Analysis Tips</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Response times &gt; 100ms may indicate DNS server issues or network latency</li>
                      <li>SERVFAIL errors suggest DNS server configuration problems</li>
                      <li>NXDOMAIN indicates the queried domain doesn't exist</li>
                      <li>High query rates to the same domain may indicate DNS amplification attacks</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* VoIP Analysis */}
              {activeTab === 'voip' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">VoIP/RTP Analysis</h3>
                  {voipCalls.length > 0 ? (
                    <div className="space-y-4">
                      {voipCalls.map((call, idx) => (
                        <div key={idx} className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-medium text-lg">Call #{call.callId}</div>
                            <div className={`px-3 py-1 rounded text-sm font-semibold ${parseFloat(call.avgMOS) >= 4.0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30' : parseFloat(call.avgMOS) >= 3.5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' : 'bg-red-100 text-red-800 dark:bg-red-900/30'}`}>
                              MOS: {call.avgMOS}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">From</div>
                              <div className="font-mono text-sm">{call.from}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">To</div>
                              <div className="font-mono text-sm">{call.to}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                              <div className="text-gray-600 dark:text-gray-400">Codec</div>
                              <div className="font-semibold">{call.codec}</div>
                            </div>
                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                              <div className="text-gray-600 dark:text-gray-400">Duration</div>
                              <div className="font-semibold">{call.duration}</div>
                            </div>
                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                              <div className="text-gray-600 dark:text-gray-400">Jitter</div>
                              <div className={`font-semibold ${parseFloat(call.jitter) > 30 ? 'text-red-600' : ''}`}>{call.jitter}</div>
                            </div>
                            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                              <div className="text-gray-600 dark:text-gray-400">Packet Loss</div>
                              <div className={`font-semibold ${parseFloat(call.packetLoss) > 1 ? 'text-red-600' : ''}`}>{call.packetLoss}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No VoIP calls detected</div>
                  )}
                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">VoIP Quality Guidelines</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li><strong>MOS Score:</strong> 4.0+ (Excellent), 3.5-4.0 (Good), 3.0-3.5 (Fair), &lt;3.0 (Poor)</li>
                      <li><strong>Jitter:</strong> Should be &lt; 30ms for good quality</li>
                      <li><strong>Packet Loss:</strong> Should be &lt; 1% for acceptable quality</li>
                      <li>Supported codecs: G.711, G.722, G.729, Opus</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Bandwidth Analysis */}
              {activeTab === 'bandwidth' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bandwidth Analysis - Top Talkers</h3>
                  {bandwidthTalkers.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-100 dark:bg-neutral-800">
                          <tr>
                            <th className="px-4 py-2 text-left">Rank</th>
                            <th className="px-4 py-2 text-left">Address</th>
                            <th className="px-4 py-2 text-left">Hostname</th>
                            <th className="px-4 py-2 text-right">TX Bytes</th>
                            <th className="px-4 py-2 text-right">RX Bytes</th>
                            <th className="px-4 py-2 text-right">Total</th>
                            <th className="px-4 py-2 text-right">Packets</th>
                            <th className="px-4 py-2 text-left">% of Traffic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bandwidthTalkers.slice(0, 50).map((talker, idx) => (
                            <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="px-4 py-2 font-bold text-purple-600">#{idx + 1}</td>
                              <td className="px-4 py-2 font-mono text-xs">{talker.address}</td>
                              <td className="px-4 py-2 text-xs">{talker.hostname || '-'}</td>
                              <td className="px-4 py-2 text-right">{formatBytes(talker.txBytes)}</td>
                              <td className="px-4 py-2 text-right">{formatBytes(talker.rxBytes)}</td>
                              <td className="px-4 py-2 text-right font-semibold">{formatBytes(talker.totalBytes)}</td>
                              <td className="px-4 py-2 text-right">{talker.packets.toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                    <div
                                      className="bg-purple-600 h-full rounded-full"
                                      style={{ width: `${talker.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs w-12 text-right">{talker.percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {bandwidthTalkers.length > 50 && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                          Showing top 50 of {bandwidthTalkers.length} hosts
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No bandwidth data available</div>
                  )}
                </div>
              )}

              {/* Latency & RTT Measurements */}
              {activeTab === 'latency' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Latency Diagnosis & Round-Trip Time Analysis</h3>
                  {latencyMeasurements.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-100 dark:bg-neutral-800">
                          <tr>
                            <th className="px-4 py-2 text-left">TCP Stream</th>
                            <th className="px-4 py-2 text-right">Handshake Time</th>
                            <th className="px-4 py-2 text-right">Avg RTT</th>
                            <th className="px-4 py-2 text-right">Min RTT</th>
                            <th className="px-4 py-2 text-right">Max RTT</th>
                            <th className="px-4 py-2 text-right">Packets</th>
                            <th className="px-4 py-2 text-left">Assessment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {latencyMeasurements.map((measure, idx) => {
                            const avgRTT = parseFloat(measure.avgRTT);
                            const quality = avgRTT < 50 ? 'Excellent' : avgRTT < 100 ? 'Good' : avgRTT < 200 ? 'Fair' : 'Poor';
                            const colorClass = avgRTT < 50 ? 'text-green-600' : avgRTT < 100 ? 'text-blue-600' : avgRTT < 200 ? 'text-yellow-600' : 'text-red-600';

                            return (
                              <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                <td className="px-4 py-2 font-mono text-xs">{measure.stream}</td>
                                <td className="px-4 py-2 text-right">{measure.handshakeTime}</td>
                                <td className={`px-4 py-2 text-right font-semibold ${colorClass}`}>{measure.avgRTT}</td>
                                <td className="px-4 py-2 text-right">{measure.minRTT}</td>
                                <td className="px-4 py-2 text-right">{measure.maxRTT}</td>
                                <td className="px-4 py-2 text-right">{measure.packets.toLocaleString()}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${avgRTT < 100 ? 'bg-green-100 text-green-800 dark:bg-green-900/30' : avgRTT < 200 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' : 'bg-red-100 text-red-800 dark:bg-red-900/30'}`}>
                                    {quality}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No latency data available</div>
                  )}
                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Latency Analysis Guide</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li><strong>Handshake Time:</strong> Time taken for TCP 3-way handshake (SYN, SYN-ACK, ACK)</li>
                      <li><strong>RTT Thresholds:</strong> &lt;50ms (Excellent), 50-100ms (Good), 100-200ms (Fair), &gt;200ms (Poor)</li>
                      <li><strong>High RTT causes:</strong> Network congestion, distance, routing issues, or server load</li>
                      <li><strong>Variable RTT (Max-Min):</strong> Large variance indicates unstable network conditions</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
