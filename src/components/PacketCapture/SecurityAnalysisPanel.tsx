import React, { useState, useEffect } from 'react';
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconBug,
  IconKey,
  IconScan,
  IconLock,
  IconPlayerPlay,
  IconRefresh,
  IconFileExport
} from '@tabler/icons-react';
import {
  IntrusionAlert,
  MalwareIndicator,
  NetworkScan,
  CredentialLeak,
  DecryptionSession
} from '../../types';

interface SecurityAnalysisPanelProps {
  onClose: () => void;
}

type TabType = 'intrusion' | 'malware' | 'scans' | 'credentials' | 'decryption' | 'forensics';

const SecurityAnalysisPanel: React.FC<SecurityAnalysisPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('intrusion');
  const [loading, setLoading] = useState(false);

  // Data states
  const [intrusionAlerts, setIntrusionAlerts] = useState<IntrusionAlert[]>([]);
  const [malwareIndicators, setMalwareIndicators] = useState<MalwareIndicator[]>([]);
  const [networkScans, setNetworkScans] = useState<NetworkScan[]>([]);
  const [credentialLeaks, setCredentialLeaks] = useState<CredentialLeak[]>([]);
  const [decryptionSessions, setDecryptionSessions] = useState<DecryptionSession[]>([]);

  // Decryption state
  const [keyData, setKeyData] = useState('');
  const [keyFormat, setKeyFormat] = useState<'pem' | 'der' | 'pkcs12'>('pem');

  // Forensics state
  const [replayFilepath, setReplayFilepath] = useState('');
  const [replaySpeed, setReplaySpeed] = useState(1.0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (!window.api) return;

    setLoading(true);
    try {
      switch (activeTab) {
        case 'intrusion':
          const intrusionResult = await window.api.getIntrusionAlerts();
          if (intrusionResult.success && intrusionResult.data) {
            setIntrusionAlerts(intrusionResult.data);
          }
          break;

        case 'malware':
          const malwareResult = await window.api.getMalwareIndicators();
          if (malwareResult.success && malwareResult.data) {
            setMalwareIndicators(malwareResult.data);
          }
          break;

        case 'scans':
          const scansResult = await window.api.getNetworkScans();
          if (scansResult.success && scansResult.data) {
            setNetworkScans(scansResult.data);
          }
          break;

        case 'credentials':
          const credsResult = await window.api.getCredentialLeaks();
          if (credsResult.success && credsResult.data) {
            setCredentialLeaks(credsResult.data);
          }
          break;

        case 'decryption':
          const decryptResult = await window.api.getDecryptionSessions();
          if (decryptResult.success && decryptResult.data) {
            setDecryptionSessions(decryptResult.data);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDecryptionKey = async () => {
    if (!keyData.trim()) {
      alert('Please enter key data');
      return;
    }

    const result = await window.api.loadDecryptionKey(keyData, keyFormat);
    if (result.success) {
      alert('Decryption key loaded successfully');
      setKeyData('');
      await loadData();
    } else {
      alert(`Failed to load key: ${result.error}`);
    }
  };

  const handleReplayPCAP = async () => {
    if (!replayFilepath.trim()) {
      alert('Please enter a PCAP file path');
      return;
    }

    const result = await window.api.replayPCAP(replayFilepath, replaySpeed);
    if (result.success) {
      alert('PCAP replay started');
    } else {
      alert(`Failed to replay PCAP: ${result.error}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[90%] h-[90%] bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <IconShieldCheck size={24} className="text-red-600" />
            <h2 className="text-xl font-semibold">Security Analysis & Forensics</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <IconRefresh size={16} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 overflow-x-auto">
          {[
            { id: 'intrusion', label: 'Intrusion Detection', icon: IconAlertTriangle },
            { id: 'malware', label: 'Malware Analysis', icon: IconBug },
            { id: 'scans', label: 'Network Scans', icon: IconScan },
            { id: 'credentials', label: 'Credential Leaks', icon: IconKey },
            { id: 'decryption', label: 'TLS Decryption', icon: IconLock },
            { id: 'forensics', label: 'PCAP Forensics', icon: IconPlayerPlay }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading security analysis...</div>
            </div>
          ) : (
            <>
              {/* Intrusion Detection Tab */}
              {activeTab === 'intrusion' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Network Intrusion Detection System</h3>
                  {intrusionAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {intrusionAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <IconAlertTriangle className="text-red-600" size={24} />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getSeverityColor(alert.severity)}`}>
                                    {alert.severity}
                                  </span>
                                  <span className="font-semibold">{alert.type}</span>
                                  <span className="text-xs text-gray-500">Confidence: {alert.confidence}%</span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">{alert.timestamp}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Source:</span>
                              <span className="ml-2 font-mono">{alert.source}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Destination:</span>
                              <span className="ml-2 font-mono">{alert.destination}</span>
                            </div>
                          </div>
                          {alert.indicators.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold mb-1">Indicators of Compromise:</div>
                              <div className="flex flex-wrap gap-1">
                                {alert.indicators.map((indicator, idx) => (
                                  <span key={idx} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-0.5 rounded">
                                    {indicator}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">Packet #{alert.packet}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No intrusion alerts detected</div>
                  )}
                  <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Intrusion Detection Capabilities</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Suspicious flow patterns and anomalies</li>
                      <li>SQL injection and XSS attack attempts</li>
                      <li>Buffer overflow attempts</li>
                      <li>Privilege escalation attempts</li>
                      <li>Lateral movement detection</li>
                      <li>Data exfiltration patterns</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Malware Analysis Tab */}
              {activeTab === 'malware' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Malware Traffic Analysis</h3>
                  {malwareIndicators.length > 0 ? (
                    <div className="space-y-3">
                      {malwareIndicators.map((indicator) => (
                        <div
                          key={indicator.id}
                          className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <IconBug className="text-purple-600" size={24} />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-1 rounded text-xs font-semibold uppercase bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                    {indicator.type.replace(/-/g, ' ')}
                                  </span>
                                  <span className="text-xs text-gray-500">Confidence: {indicator.confidence}%</span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{indicator.description}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">{indicator.timestamp}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Source:</span>
                              <span className="ml-2 font-mono">{indicator.source}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Destination:</span>
                              <span className="ml-2 font-mono">{indicator.destination}</span>
                            </div>
                          </div>
                          {indicator.domain && (
                            <div className="mb-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Domain:</span>
                              <span className="ml-2 font-mono font-semibold">{indicator.domain}</span>
                            </div>
                          )}
                          {indicator.ioc.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold mb-1">Indicators of Compromise (IOCs):</div>
                              <div className="flex flex-wrap gap-1">
                                {indicator.ioc.map((ioc, idx) => (
                                  <span key={idx} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-0.5 rounded font-mono">
                                    {ioc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Packets: {indicator.packets.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No malware indicators detected</div>
                  )}
                  <div className="p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">C2 Detection Techniques</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li><strong>Beacon Analysis:</strong> Regular intervals, unusual ports</li>
                      <li><strong>Domain Generation Algorithms (DGA):</strong> Suspicious domain patterns</li>
                      <li><strong>Data Exfiltration:</strong> Large outbound transfers</li>
                      <li><strong>Known IOCs:</strong> Matching threat intelligence feeds</li>
                      <li><strong>Protocol Anomalies:</strong> Tunneling, covert channels</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Network Scans Tab */}
              {activeTab === 'scans' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Network Scan & Reconnaissance Detection</h3>
                  {networkScans.length > 0 ? (
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-100 dark:bg-neutral-800">
                          <tr>
                            <th className="px-4 py-2 text-left">Scanner</th>
                            <th className="px-4 py-2 text-left">Scan Type</th>
                            <th className="px-4 py-2 text-right">Targets</th>
                            <th className="px-4 py-2 text-right">Ports</th>
                            <th className="px-4 py-2 text-left">Start Time</th>
                            <th className="px-4 py-2 text-right">Duration</th>
                            <th className="px-4 py-2 text-right">Packets</th>
                            <th className="px-4 py-2 text-left">Threat Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {networkScans.map((scan, idx) => (
                            <tr key={idx} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="px-4 py-2 font-mono text-xs">{scan.scanner}</td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                  {scan.scanType.replace(/-/g, ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right font-semibold">{scan.targetsScanned}</td>
                              <td className="px-4 py-2 text-right font-semibold">{scan.portsScanned}</td>
                              <td className="px-4 py-2 font-mono text-xs">{scan.startTime}</td>
                              <td className="px-4 py-2 text-right">{scan.duration}</td>
                              <td className="px-4 py-2 text-right">{scan.packetsInvolved.toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  scan.suspiciousLevel === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30' :
                                  scan.suspiciousLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30'
                                }`}>
                                  {scan.suspiciousLevel.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No network scans detected</div>
                  )}
                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Scan Detection Methods</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li><strong>Port Scanning:</strong> SYN scans, Connect scans, UDP scans</li>
                      <li><strong>Network Sweeps:</strong> ICMP ping sweeps, ARP scanning</li>
                      <li><strong>Service Enumeration:</strong> Banner grabbing, version detection</li>
                      <li><strong>Vulnerability Scanning:</strong> Automated scanner signatures</li>
                      <li><strong>Reconnaissance:</strong> DNS enumeration, SNMP polling</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Credential Leaks Tab */}
              {activeTab === 'credentials' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Credential Leakage Detection</h3>
                  {credentialLeaks.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg text-sm">
                        <strong className="text-red-800 dark:text-red-400">⚠️ Security Warning:</strong> {credentialLeaks.length} credential(s) transmitted in cleartext!
                      </div>
                      {credentialLeaks.map((leak, idx) => (
                        <div
                          key={idx}
                          className="border-2 border-red-300 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <IconKey className="text-red-600" size={24} />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-1 rounded text-xs font-semibold uppercase bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200">
                                    {leak.protocol}
                                  </span>
                                  <span className="font-semibold">{leak.service}</span>
                                </div>
                                <div className="text-xs text-gray-500">{leak.timestamp}</div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Source:</span>
                              <span className="ml-2 font-mono">{leak.source}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Destination:</span>
                              <span className="ml-2 font-mono">{leak.destination}</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-800 rounded p-3 font-mono text-xs">
                            <div className="mb-1">
                              <span className="text-gray-600 dark:text-gray-400">Username:</span>
                              <span className="ml-2 font-semibold">{leak.username}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Password:</span>
                              <span className="ml-2 font-semibold blur hover:blur-none transition-all cursor-pointer" title="Hover to reveal">
                                {leak.password}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Packet #{leak.packet}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No credential leaks detected</div>
                  )}
                  <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Monitored Insecure Protocols</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li><strong>FTP:</strong> USER and PASS commands</li>
                      <li><strong>Telnet:</strong> Login sequences</li>
                      <li><strong>HTTP Basic Auth:</strong> Authorization headers (Base64 decoded)</li>
                      <li><strong>HTTP Form Auth:</strong> POST data with password fields</li>
                      <li><strong>IMAP/POP3/SMTP:</strong> LOGIN and AUTH commands</li>
                      <li><strong>Recommendations:</strong> Use SSH, SFTP, HTTPS, and encrypted protocols</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TLS Decryption Tab */}
              {activeTab === 'decryption' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">TLS Decryption & Inspection</h3>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Load Decryption Key</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Key Format</label>
                        <select
                          value={keyFormat}
                          onChange={(e) => setKeyFormat(e.target.value as 'pem' | 'der' | 'pkcs12')}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <option value="pem">PEM Format</option>
                          <option value="der">DER Format</option>
                          <option value="pkcs12">PKCS#12 Format</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Key Data (or file path)</label>
                        <textarea
                          value={keyData}
                          onChange={(e) => setKeyData(e.target.value)}
                          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----&#10;&#10;Or enter file path: /path/to/key.pem"
                          className="w-full h-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                        />
                      </div>
                      <button
                        onClick={handleLoadDecryptionKey}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <IconKey size={16} />
                        Load Key
                      </button>
                    </div>
                  </div>

                  {decryptionSessions.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium">Active Decryption Sessions</h4>
                      {decryptionSessions.map((session) => (
                        <div
                          key={session.id}
                          className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <IconLock className={session.keyLoaded ? 'text-green-600' : 'text-gray-400'} size={24} />
                              <div>
                                <div className="font-medium">{session.protocol}</div>
                                <div className="text-xs text-gray-500">
                                  {session.source} → {session.destination}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              session.keyLoaded
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30'
                            }`}>
                              {session.keyLoaded ? 'Key Loaded' : 'No Key'}
                            </span>
                          </div>
                          {session.cipherSuite && (
                            <div className="text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Cipher Suite:</span>
                              <span className="ml-2 font-mono">{session.cipherSuite}</span>
                            </div>
                          )}
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Packets Decrypted:</span>
                            <span className="ml-2 font-semibold">{session.packetsDecrypted}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No active decryption sessions</div>
                  )}

                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Decryption Requirements</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Requires server's private key for RSA key exchange</li>
                      <li>For TLS 1.3, requires (Pre)-Master-Secret log file</li>
                      <li>Cannot decrypt Perfect Forward Secrecy (PFS) sessions without session keys</li>
                      <li>Legal authorization required for decryption in production environments</li>
                      <li>Supported protocols: TLS 1.0, 1.1, 1.2, 1.3 (with session keys)</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* PCAP Forensics Tab */}
              {activeTab === 'forensics' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">PCAP Forensics & Session Replay</h3>

                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Replay PCAP File</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">PCAP File Path</label>
                        <input
                          type="text"
                          value={replayFilepath}
                          onChange={(e) => setReplayFilepath(e.target.value)}
                          placeholder="/path/to/capture.pcap"
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Replay Speed (multiplier)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={replaySpeed}
                            onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm font-semibold w-12">{replaySpeed}x</span>
                        </div>
                      </div>
                      <button
                        onClick={handleReplayPCAP}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <IconPlayerPlay size={16} />
                        Start Replay
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <IconFileExport size={18} />
                        Forensic Analysis Tools
                      </h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Timeline reconstruction
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Attack pattern identification
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          IOC extraction
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Session reconstruction
                        </li>
                      </ul>
                    </div>
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Incident Response Use Cases</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          Replay suspicious traffic
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          Analyze attack vectors
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          Extract artifacts
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          Evidence collection
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Forensic Analysis Capabilities</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li><strong>Timeline Analysis:</strong> Reconstruct attack progression</li>
                      <li><strong>File Carving:</strong> Extract files from network traffic</li>
                      <li><strong>Session Replay:</strong> Re-analyze captured sessions</li>
                      <li><strong>IOC Matching:</strong> Compare against threat intelligence</li>
                      <li><strong>Artifact Extraction:</strong> URLs, IPs, domains, hashes</li>
                      <li><strong>Evidence Chain:</strong> Maintain forensic integrity</li>
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

export default SecurityAnalysisPanel;
