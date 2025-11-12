// Packet Types
export interface Packet {
  no: number;
  timestamp: string;
  relativeTime: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  srcPort?: number;
  dstPort?: number;
  raw: any;
  rawBuffer?: Uint8Array;
}

// Network Interface
export interface NetworkInterface {
  name: string;
  description?: string;
  addresses: Array<{ addr: string }>;
}

// Security Alert
export interface SecurityAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  timestamp: number;
  packet: number;
}

// Statistics Types
export interface ProtocolHierarchyItem {
  protocol: string;
  packets: number;
  bytes: number;
  percentage: string;
}

export interface ConversationItem {
  addressA: string;
  addressB: string;
  portA?: number;
  portB?: number;
  packets: number;
  bytes?: number;
  bytesAtoB?: number;
  bytesBtoA?: number;
  packetsAtoB?: number;
  packetsBtoA?: number;
  start: string;
  duration: string;
}

export interface EndpointItem {
  address: string;
  port?: number;
  packets: number;
  bytes: number;
  txPackets: number;
  txBytes: number;
  rxPackets: number;
  rxBytes: number;
}

export interface IOGraphDataPoint {
  time: number;
  packets: number;
  bytes: number;
  avgPacketSize: number;
  protocols: Record<string, number>;
}

export interface TCPStreamInfo {
  stream: string;
  packets: number;
  retransmissions: number;
  outOfOrder: number;
}

export interface ExpertAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  protocol: string;
  message: string;
  details: string;
  packet: number;
  timestamp: string;
}

export interface SRTStatistic {
  stream: string;
  packets: number;
  avgResponseTime: string;
  minResponseTime: string;
  maxResponseTime: string;
}

export interface FlowGraphItem {
  no: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  info: string;
  length: number;
}

export interface PacketLengthStats {
  minLength: number;
  maxLength: number;
  avgLength: number;
  distribution: { range: string; count: number; percentage: string }[];
}

export interface TimingStats {
  avgDelay: string;
  minDelay: string;
  maxDelay: string;
  jitter: string;
  packetRate: number;
}

export interface DNSQueryResponse {
  timestamp: string;
  query: string;
  queryType: string;
  responseTime: string;
  responseCode: string;
  answers: string[];
  packet: number;
}

export interface VoIPCall {
  callId: string;
  from: string;
  to: string;
  codec: string;
  duration: string;
  packets: number;
  jitter: string;
  packetLoss: string;
  avgMOS: string;
}

export interface BandwidthTalker {
  address: string;
  hostname?: string;
  txBytes: number;
  rxBytes: number;
  totalBytes: number;
  packets: number;
  percentage: string;
}

export interface LatencyMeasurement {
  stream: string;
  handshakeTime: string;
  avgRTT: string;
  minRTT: string;
  maxRTT: string;
  packets: number;
}

export interface IntrusionAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  source: string;
  destination: string;
  description: string;
  indicators: string[];
  packet: number;
  confidence: number;
}

export interface MalwareIndicator {
  id: string;
  timestamp: string;
  type: 'c2-beacon' | 'data-exfiltration' | 'suspicious-domain' | 'malicious-payload';
  source: string;
  destination: string;
  domain?: string;
  confidence: number;
  ioc: string[];
  description: string;
  packets: number[];
}

export interface NetworkScan {
  scanner: string;
  scanType: 'port-scan' | 'network-sweep' | 'vulnerability-scan' | 'reconnaissance';
  targetsScanned: number;
  portsScanned: number;
  startTime: string;
  duration: string;
  packetsInvolved: number;
  suspiciousLevel: 'low' | 'medium' | 'high';
}

export interface CredentialLeak {
  timestamp: string;
  protocol: string;
  source: string;
  destination: string;
  username: string;
  password: string;
  service: string;
  packet: number;
}

export interface DecryptionSession {
  id: string;
  protocol: string;
  source: string;
  destination: string;
  cipherSuite?: string;
  keyLoaded: boolean;
  packetsDecrypted: number;
}

// Utility Tools Types
export interface CaptureFileInfo {
  filename: string;
  fileType: string;
  fileSize: string;
  dataSize: string;
  captureStart: string;
  captureEnd: string;
  captureDuration: string;
  packetCount: number;
  averagePacketSize: string;
  averagePacketRate: string;
  averageBitRate: string;
  encapsulation: string;
  interfaces: string[];
}

// Pentesting Types
export interface PortScanResult {
  host: string;
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  version?: string;
  banner?: string;
}

export interface HostDiscoveryResult {
  ip: string;
  hostname?: string;
  mac?: string;
  vendor?: string;
  os?: string;
  status: 'up' | 'down';
  latency?: string;
  openPorts?: number[];
}

export interface PacketCraftTemplate {
  id: string;
  name: string;
  description: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ARP' | 'DNS' | 'HTTP';
  fields: Record<string, any>;
}

export interface MITMSession {
  id: string;
  type: 'arp-spoof' | 'dns-spoof' | 'ssl-strip';
  target: string;
  gateway: string;
  status: 'active' | 'stopped';
  packetsIntercepted: number;
  startTime: string;
}

export interface VulnerabilityScanResult {
  id: string;
  host: string;
  port?: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  vulnerability: string;
  cve?: string;
  description: string;
  remediation: string;
  confidence: number;
}

export interface ExploitPayload {
  id: string;
  name: string;
  category: 'shellcode' | 'reverse-shell' | 'bind-shell' | 'web-shell' | 'injection';
  platform: string;
  description: string;
  payload: string;
}

export interface SessionToken {
  type: 'cookie' | 'jwt' | 'bearer' | 'session-id';
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  packet: number;
}

export interface AttackReport {
  id: string;
  timestamp: string;
  attackType: string;
  target: string;
  status: 'success' | 'failed' | 'in-progress';
  findings: string[];
  vulnerabilities: VulnerabilityScanResult[];
  evidence: string[];
}

// Configuration Management Types
export interface CustomColumn {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  path?: string;
}

export interface AvailableField {
  id: string;
  label: string;
  type: string;
  path?: string;
}

export interface ColorRule {
  name: string;
  filter: string;
  bgColor: string;
  fgColor: string;
}

export interface DisplayFilter {
  name: string;
  filter: string;
  enabled: boolean;
}

export interface ProfileConfig {
  name: string;
  displayFilters: DisplayFilter[];
  bpfFilter: string;
  customColumns: CustomColumn[];
  colorRules: ColorRule[];
  captureOptions: CaptureOptions;
  uiLayout: {
    packetListHeight: number;
    showHexView: boolean;
    showSecurityAlerts: boolean;
    fontSize: string;
  };
}

// Lua Scripting Types
export interface LuaTemplate {
  id: string;
  name: string;
  description: string;
}

export interface LuaScript {
  id: string;
  hasResults: boolean;
}

export interface LuaScriptAlert {
  scriptId: string;
  severity: string;
  message: string;
  details: string;
  packet: number;
}

export interface LuaScriptLog {
  scriptId: string;
  level: string;
  message: string;
  packet: number;
}

// HTTP Proxy Types
export interface ProxyHistoryItem {
  id: number;
  method: string;
  url: string;
  httpVersion: string;
  headers: Record<string, string>;
  bodyString?: string;
  response?: {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    bodyString?: string;
    length: number;
    time: number;
  };
}

export interface InterceptItem {
  id: string;
  method: string;
  url: string;
  httpVersion: string;
  headers: Record<string, string>;
  bodyString?: string;
}

// Packet Capture Options
export interface CaptureOptions {
  filter?: string;           // BPF filter syntax
  promiscuous?: boolean;     // Promiscuous mode
  monitor?: boolean;         // Monitor mode for Wi-Fi
  maxPackets?: number;       // Maximum packets to capture (0 = unlimited)
  maxDuration?: number;      // Maximum capture duration in seconds (0 = unlimited)
  ringBuffer?: boolean;      // Enable ring buffer file rotation
  maxFileSize?: number;      // Maximum file size in bytes
  maxFiles?: number;         // Maximum number of ring buffer files
  outputDir?: string | null; // Output directory for ring buffer
}

// Capture Statistics
export interface CaptureStats {
  packetCount: number;
  duration: string;
}

// Electron API
export interface ElectronAPI {
  // Packet Capture
  getInterfaces: () => Promise<{ success: boolean; devices?: NetworkInterface[]; error?: string }>;
  startCapture: (deviceName: string, options?: CaptureOptions) => Promise<{ success: boolean; error?: string }>;
  stopCapture: () => Promise<{ success: boolean; error?: string }>;
  loadPcapFile: () => Promise<{ success: boolean; filepath?: string; packetCount?: number; error?: string }>;
  exportPackets: (packets: Packet[], format: 'json' | 'csv' | 'xml' | 'psml' | 'txt' | 'pdml' | 'ps') => Promise<{ success: boolean; error?: string }>;
  convertPcapFormat: (inputPath: string, outputPath: string, outputFormat: 'pcap' | 'pcapng' | 'erf') => Promise<{ success: boolean; error?: string }>;
  onPacketCaptured: (callback: (packet: Packet) => void) => void;
  onCaptureError: (callback: (error: string) => void) => void;
  onCaptureStopped: (callback: (stats: CaptureStats) => void) => void;
  onCaptureFileRotated: (callback: (filepath: string) => void) => void;
  onSecurityAlert: (callback: (alert: SecurityAlert) => void) => void;
  onExpertAlert: (callback: (alert: ExpertAlert) => void) => void;

  // Statistics
  getProtocolHierarchy: () => Promise<{ success: boolean; data?: ProtocolHierarchyItem[]; error?: string }>;
  getConversations: (type: 'ip' | 'tcp' | 'udp') => Promise<{ success: boolean; data?: ConversationItem[]; error?: string }>;
  getEndpoints: (type: 'ip' | 'tcp' | 'udp') => Promise<{ success: boolean; data?: EndpointItem[]; error?: string }>;
  getIOGraph: () => Promise<{ success: boolean; data?: IOGraphDataPoint[]; error?: string }>;
  getTCPStreams: () => Promise<{ success: boolean; data?: TCPStreamInfo[]; error?: string }>;
  getExpertAlerts: () => Promise<{ success: boolean; data?: ExpertAlert[]; error?: string }>;
  getSRTStatistics: () => Promise<{ success: boolean; data?: SRTStatistic[]; error?: string }>;
  getFlowGraph: () => Promise<{ success: boolean; data?: FlowGraphItem[]; error?: string }>;
  resolveHostname: (ip: string) => Promise<{ success: boolean; hostname?: string; error?: string }>;
  resolveMacVendor: (mac: string) => Promise<{ success: boolean; vendor?: string; error?: string }>;
  resolveService: (port: number) => Promise<{ success: boolean; service?: string; error?: string }>;
  exportStatistics: (type: string, format: 'json' | 'csv' | 'xml' | 'psml') => Promise<{ success: boolean; error?: string }>;
  getPacketLengthStats: () => Promise<{ success: boolean; data?: PacketLengthStats; error?: string }>;
  getTimingStats: () => Promise<{ success: boolean; data?: TimingStats; error?: string }>;
  getDNSAnalysis: () => Promise<{ success: boolean; data?: DNSQueryResponse[]; error?: string }>;
  getVoIPAnalysis: () => Promise<{ success: boolean; data?: VoIPCall[]; error?: string }>;
  getBandwidthTalkers: () => Promise<{ success: boolean; data?: BandwidthTalker[]; error?: string }>;
  getLatencyMeasurements: () => Promise<{ success: boolean; data?: LatencyMeasurement[]; error?: string }>;
  getIntrusionAlerts: () => Promise<{ success: boolean; data?: IntrusionAlert[]; error?: string }>;
  getMalwareIndicators: () => Promise<{ success: boolean; data?: MalwareIndicator[]; error?: string }>;
  getNetworkScans: () => Promise<{ success: boolean; data?: NetworkScan[]; error?: string }>;
  getCredentialLeaks: () => Promise<{ success: boolean; data?: CredentialLeak[]; error?: string }>;
  getDecryptionSessions: () => Promise<{ success: boolean; data?: DecryptionSession[]; error?: string }>;
  loadDecryptionKey: (keyData: string, format: 'pem' | 'der' | 'pkcs12') => Promise<{ success: boolean; error?: string }>;
  replayPCAP: (filepath: string, speed: number) => Promise<{ success: boolean; error?: string }>;
  exportToTool: (tool: 'tshark' | 'zeek' | 'suricata' | 'snort' | 'networkminer' | 'splunk', filepath: string, options?: any) => Promise<{ success: boolean; output?: string; error?: string }>;
  runTsharkCommand: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  batchProcessCaptures: (files: string[], operations: string[]) => Promise<{ success: boolean; results?: any[]; error?: string }>;

  // Utility Tools
  tsharkAnalyze: (filepath: string, displayFilter?: string, fields?: string[]) => Promise<{ success: boolean; output?: string; packets?: any[]; error?: string }>;
  editcapTrim: (inputPath: string, outputPath: string, startPacket: number, endPacket: number) => Promise<{ success: boolean; error?: string }>;
  editcapSplit: (inputPath: string, outputDir: string, splitType: 'count' | 'duration' | 'size', value: number) => Promise<{ success: boolean; files?: string[]; error?: string }>;
  mergecap: (inputPaths: string[], outputPath: string) => Promise<{ success: boolean; error?: string }>;
  capinfos: (filepath: string) => Promise<{ success: boolean; info?: CaptureFileInfo; error?: string }>;
  text2pcap: (hexInput: string, outputPath: string) => Promise<{ success: boolean; error?: string }>;
  rawshark: (filepath: string, fields: string[]) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  reordercap: (inputPath: string, outputPath: string) => Promise<{ success: boolean; error?: string }>;

  // Pentesting Tools
  portScan: (target: string, ports: string, scanType: 'syn' | 'connect' | 'udp' | 'stealth') => Promise<{ success: boolean; results?: PortScanResult[]; error?: string }>;
  hostDiscovery: (subnet: string, method: 'ping' | 'arp' | 'tcp' | 'full') => Promise<{ success: boolean; hosts?: HostDiscoveryResult[]; error?: string }>;
  craftPacket: (template: PacketCraftTemplate) => Promise<{ success: boolean; packetData?: string; error?: string }>;
  sendCraftedPacket: (packetData: string, count: number, delay: number) => Promise<{ success: boolean; sent?: number; error?: string }>;
  startMITM: (type: 'arp-spoof' | 'dns-spoof' | 'ssl-strip', target: string, gateway: string, options?: any) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  stopMITM: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  getMITMSessions: () => Promise<{ success: boolean; sessions?: MITMSession[]; error?: string }>;
  vulnerabilityScan: (target: string, scanType: 'quick' | 'full' | 'web' | 'ssl') => Promise<{ success: boolean; vulnerabilities?: VulnerabilityScanResult[]; error?: string }>;
  dosAttack: (target: string, port: number, type: 'syn' | 'udp' | 'icmp' | 'slowloris', duration: number) => Promise<{ success: boolean; error?: string }>;
  extractSessionTokens: () => Promise<{ success: boolean; tokens?: SessionToken[]; error?: string }>;
  hijackSession: (token: SessionToken, newValue: string) => Promise<{ success: boolean; error?: string }>;
  getExploitPayloads: (category?: string) => Promise<{ success: boolean; payloads?: ExploitPayload[]; error?: string }>;
  deliverPayload: (target: string, port: number, payload: string, method: 'tcp' | 'udp' | 'http') => Promise<{ success: boolean; error?: string }>;
  generateReport: (attackType: string, target: string) => Promise<{ success: boolean; report?: AttackReport; error?: string }>;
  onMITMPacket: (callback: (packet: Packet) => void) => void;
  onVulnerabilityFound: (callback: (vuln: VulnerabilityScanResult) => void) => void;

  // HTTP Proxy
  startProxy: (port: number) => Promise<{ success: boolean; port?: number; error?: string }>;
  stopProxy: () => Promise<{ success: boolean; error?: string }>;
  toggleIntercept: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; error?: string }>;
  forwardIntercept: (id: string, modifiedRequest: any) => Promise<{ success: boolean; error?: string }>;
  dropIntercept: (id: string) => Promise<{ success: boolean; error?: string }>;
  getProxyHistory: () => Promise<{ success: boolean; history?: ProxyHistoryItem[]; error?: string }>;
  clearProxyHistory: () => Promise<{ success: boolean; error?: string }>;
  repeatRequest: (requestData: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  runIntruder: (requestData: any, positions: any[], payloads: string[], attackType: string) => Promise<{ success: boolean; results?: any[]; error?: string }>;
  onProxyStarted: (callback: (port: number) => void) => void;
  onProxyStopped: (callback: () => void) => void;
  onProxyError: (callback: (error: string) => void) => void;
  onProxyIntercept: (callback: (item: InterceptItem) => void) => void;
  onProxyHistoryUpdate: (callback: (item: ProxyHistoryItem) => void) => void;
  onProxyHistoryCleared: (callback: () => void) => void;
  onIntruderProgress: (callback: (progress: { current: number; total: number }) => void) => void;

  // Window controls
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<boolean>;
  windowClose: () => Promise<void>;
  windowIsMaximized: () => Promise<boolean>;

  // Configuration Management
  configListProfiles: () => Promise<{ success: boolean; profiles?: string[]; error?: string }>;
  configLoadProfile: (profileName: string) => Promise<{ success: boolean; config?: ProfileConfig; error?: string }>;
  configSaveProfile: (profileName: string) => Promise<{ success: boolean; error?: string }>;
  configDeleteProfile: (profileName: string) => Promise<{ success: boolean; error?: string }>;
  configDuplicateProfile: (sourceName: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  configGetCurrent: () => Promise<{ success: boolean; profile?: string; config?: ProfileConfig; error?: string }>;
  configGetCustomColumns: () => Promise<{ success: boolean; columns?: CustomColumn[]; error?: string }>;
  configSetCustomColumns: (columns: CustomColumn[]) => Promise<{ success: boolean; error?: string }>;
  configAddCustomColumn: (field: AvailableField, position?: number) => Promise<{ success: boolean; columns?: CustomColumn[]; error?: string }>;
  configRemoveCustomColumn: (columnId: string) => Promise<{ success: boolean; columns?: CustomColumn[]; error?: string }>;
  configReorderColumns: (fromIndex: number, toIndex: number) => Promise<{ success: boolean; columns?: CustomColumn[]; error?: string }>;
  configGetAvailableFields: () => Promise<{ success: boolean; fields?: AvailableField[]; error?: string }>;
  configGetColorRules: () => Promise<{ success: boolean; rules?: ColorRule[]; error?: string }>;
  configAddColorRule: (rule: ColorRule) => Promise<{ success: boolean; rules?: ColorRule[]; error?: string }>;
  configRemoveColorRule: (ruleName: string) => Promise<{ success: boolean; rules?: ColorRule[]; error?: string }>;

  // Lua Scripting
  luaGetTemplates: () => Promise<{ success: boolean; templates?: LuaTemplate[]; error?: string }>;
  luaGetTemplateCode: (templateId: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  luaLoadScript: (scriptId: string, scriptCode: string) => Promise<{ success: boolean; error?: string }>;
  luaUnloadScript: (scriptId: string) => Promise<{ success: boolean; error?: string }>;
  luaGetLoadedScripts: () => Promise<{ success: boolean; scripts?: LuaScript[]; error?: string }>;
  luaGetResults: (scriptId: string) => Promise<{ success: boolean; results?: any; error?: string }>;
  luaExecuteOnPacket: (scriptId: string, packet: Packet) => Promise<{ success: boolean; error?: string }>;
  luaCompleteScript: (scriptId: string) => Promise<{ success: boolean; results?: any; error?: string }>;
  onLuaScriptAlert: (callback: (alert: LuaScriptAlert) => void) => void;
  onLuaScriptLog: (callback: (log: LuaScriptLog) => void) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
