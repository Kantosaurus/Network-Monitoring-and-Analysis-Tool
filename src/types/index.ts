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

// Authenticated Scanning Types
export interface Credential {
  id: string;
  name: string;
  type: 'form-based' | 'ntlm' | 'bearer' | 'basic' | 'digest' | 'oauth2' | 'api-key';
  username?: string;
  password?: string;
  token?: string;
  domain?: string;
  apiKey?: string;
  oauthConfig?: {
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
  };
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  loginUrl?: string;
  loginFormSelector?: string;
  macros?: AuthMacro[];
  sessionRules?: SessionRule[];
}

export interface AuthMacro {
  id: string;
  name: string;
  steps: AuthMacroStep[];
  description?: string;
}

export interface AuthMacroStep {
  type: 'request' | 'extract' | 'wait' | 'script';
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  extractVariable?: string;
  extractRegex?: string;
  waitMs?: number;
  script?: string;
}

export interface SessionRule {
  id: string;
  name: string;
  condition: string;
  action: 'relogin' | 'refresh-token' | 'update-cookie' | 'run-macro';
  macroId?: string;
}

export interface AuthenticatedScanResult {
  credentialId: string;
  scanId: string;
  authenticated: boolean;
  pagesAccessed: number;
  vulnerabilities: VulnerabilityScanResult[];
  errors: string[];
  timestamp: string;
}

// API & Mobile App Testing Types
export interface APIEndpoint {
  id: string;
  method: string;
  path: string;
  baseUrl: string;
  type: 'rest' | 'soap' | 'graphql' | 'grpc';
  parameters?: APIParameter[];
  headers?: Record<string, string>;
  body?: string;
  response?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    time: number;
  };
  vulnerabilities?: VulnerabilityScanResult[];
}

export interface APIParameter {
  name: string;
  type: 'path' | 'query' | 'header' | 'body';
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  value?: any;
  description?: string;
}

export interface GraphQLSchema {
  queries: GraphQLOperation[];
  mutations: GraphQLOperation[];
  subscriptions: GraphQLOperation[];
  types: GraphQLType[];
}

export interface GraphQLOperation {
  name: string;
  type: string;
  args: GraphQLArgument[];
  description?: string;
}

export interface GraphQLArgument {
  name: string;
  type: string;
  required: boolean;
}

export interface GraphQLType {
  name: string;
  kind: 'object' | 'interface' | 'enum' | 'union' | 'scalar';
  fields?: { name: string; type: string }[];
  values?: string[];
}

export interface MobileAppSession {
  id: string;
  deviceType: 'android' | 'ios';
  deviceName: string;
  appName: string;
  appPackage: string;
  certificatePinning: boolean;
  requests: number;
  vulnerabilities: VulnerabilityScanResult[];
}

// JavaScript & SPA Awareness Types
export interface JavaScriptFile {
  url: string;
  size: number;
  code: string;
  sourceMapped: boolean;
  vulnerabilities: JSVulnerability[];
  endpoints: string[];
  secrets: JSSecret[];
}

export interface JSVulnerability {
  type: 'dom-xss' | 'prototype-pollution' | 'insecure-randomness' | 'client-side-validation' | 'hardcoded-secret';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: {
    file: string;
    line: number;
    column: number;
  };
  code: string;
  description: string;
  remediation: string;
}

export interface JSSecret {
  type: 'api-key' | 'token' | 'password' | 'private-key' | 'credential';
  value: string;
  location: {
    file: string;
    line: number;
  };
  confidence: number;
}

export interface SPAEndpoint {
  url: string;
  method: string;
  discoveredBy: 'dom-analysis' | 'xhr-monitoring' | 'fetch-monitoring' | 'websocket';
  parameters: string[];
  headers: Record<string, string>;
}

export interface DOMXSSVector {
  source: string;
  sink: string;
  payload: string;
  vulnerable: boolean;
  confidence: number;
}

// Advanced Injection & Exploitation Types
export interface InjectionTest {
  id: string;
  type: 'sql' | 'nosql' | 'command' | 'ldap' | 'xpath' | 'ssti' | 'xxe' | 'ssi';
  target: string;
  parameter: string;
  payload: string;
  method: 'in-band' | 'blind' | 'time-based' | 'out-of-band';
  result: 'vulnerable' | 'not-vulnerable' | 'error';
  evidence?: string;
  confidence: number;
  timestamp: string;
}

export interface BlindInjectionResult {
  technique: 'time-based' | 'boolean-based' | 'error-based' | 'out-of-band';
  collaboratorUrl?: string;
  responseTime?: number;
  baselineTime?: number;
  vulnerable: boolean;
  extractedData?: string;
}

export interface TemplateInjectionTest {
  engine: 'jinja2' | 'freemarker' | 'velocity' | 'thymeleaf' | 'smarty' | 'twig';
  payload: string;
  result: string;
  vulnerable: boolean;
  rce: boolean;
}

export interface DeserializationTest {
  language: 'java' | 'php' | 'python' | 'ruby' | 'dotnet';
  gadgetChain?: string;
  payload: string;
  vulnerable: boolean;
  rce: boolean;
}

export interface CollaboratorInteraction {
  id: string;
  timestamp: string;
  protocol: 'http' | 'https' | 'dns' | 'smtp';
  subdomain: string;
  sourceIp: string;
  data?: string;
  relatedTest?: string;
}

// WebSocket & Protocol Support Types
export interface WebSocketConnection {
  id: string;
  url: string;
  protocol: string;
  status: 'connecting' | 'open' | 'closing' | 'closed';
  messages: WebSocketMessage[];
  startTime: string;
  endTime?: string;
}

export interface WebSocketMessage {
  id: string;
  direction: 'sent' | 'received';
  type: 'text' | 'binary';
  data: string;
  timestamp: string;
  size: number;
}

export interface CustomProtocol {
  name: string;
  port: number;
  type: 'binary' | 'text' | 'mixed';
  parser?: string;
  dissector?: string;
}

export interface ProtocolMessage {
  id: string;
  protocol: string;
  direction: 'sent' | 'received';
  rawData: Uint8Array;
  parsedData?: any;
  timestamp: string;
  fields?: Record<string, any>;
}

// Reporting & Exporting Types
export interface Report {
  id: string;
  name: string;
  type: 'html' | 'pdf' | 'xml' | 'json' | 'csv';
  template: string;
  createdAt: string;
  size: number;
  filePath: string;
  findings: ReportFinding[];
  metadata: ReportMetadata;
}

export interface ReportFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  evidence: string[];
  remediation: string;
  cwe?: string;
  cvss?: number;
  affectedUrls: string[];
  category: string;
}

export interface ReportMetadata {
  projectName: string;
  scanDate: string;
  scanDuration: string;
  targetUrls: string[];
  totalFindings: number;
  findingsBySeverity: Record<string, number>;
  scanner: string;
  version: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'compliance' | 'technical' | 'executive' | 'custom';
  sections: ReportSection[];
  format: 'html' | 'pdf';
  customizable: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'findings' | 'details' | 'recommendations' | 'appendix';
  enabled: boolean;
  order: number;
  content?: string;
}

export interface ExportConfig {
  format: 'xml' | 'json' | 'csv' | 'jira' | 'github';
  includeEvidence: boolean;
  includeSummary: boolean;
  filterBySeverity?: string[];
  customFields?: Record<string, any>;
}

// Project Files & Workspace Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  createdAt: string;
  modifiedAt: string;
  size: number;
  configuration: ProjectConfiguration;
  scanState: ScanState;
  savedItems: SavedItem[];
  tags: string[];
}

export interface ProjectConfiguration {
  targetScope: string[];
  excludedPaths: string[];
  authenticationConfig?: Credential;
  scannerSettings: ScannerSettings;
  proxySettings: ProxySettings;
  customHeaders: Record<string, string>;
}

export interface ScannerSettings {
  maxThreads: number;
  requestsPerSecond: number;
  timeout: number;
  followRedirects: boolean;
  scanDepth: number;
  enabledChecks: string[];
}

export interface ProxySettings {
  enabled: boolean;
  port: number;
  interceptEnabled: boolean;
  upstreamProxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
}

export interface ScanState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  currentPhase: string;
  requestsCompleted: number;
  totalRequests: number;
  startTime?: string;
  endTime?: string;
  findings: VulnerabilityScanResult[];
}

export interface SavedItem {
  id: string;
  type: 'request' | 'response' | 'finding' | 'note';
  timestamp: string;
  data: any;
  tags: string[];
  notes?: string;
}

export interface Workspace {
  id: string;
  name: string;
  projects: Project[];
  activeProjectId?: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  autoSave: boolean;
  saveInterval: number;
  backupEnabled: boolean;
  maxBackups: number;
}

// Import/Export & Interoperability Types
export interface ImportConfig {
  source: 'burp' | 'zap' | 'pcap' | 'har' | 'postman' | 'openapi';
  filePath: string;
  mergeWithExisting: boolean;
  importOptions: ImportOptions;
}

export interface ImportOptions {
  importHistory: boolean;
  importFindings: boolean;
  importConfiguration: boolean;
  importScope: boolean;
  preserveTimestamps: boolean;
}

export interface ImportResult {
  success: boolean;
  itemsImported: number;
  requestsImported: number;
  findingsImported: number;
  errors: string[];
  warnings: string[];
}

export interface ExportResult {
  success: boolean;
  filePath: string;
  itemsExported: number;
  format: string;
  size: number;
}

export interface ToolIntegration {
  tool: 'zap' | 'metasploit' | 'nmap' | 'sqlmap' | 'nikto' | 'wpscan';
  enabled: boolean;
  path: string;
  arguments: string[];
  autoImportResults: boolean;
}

export interface CICDConfig {
  provider: 'jenkins' | 'gitlab' | 'github' | 'azure' | 'circleci' | 'travis';
  webhookUrl: string;
  apiKey: string;
  triggerOn: string[];
  failOnSeverity: string[];
  generateReport: boolean;
}

// Headless & Automation Types
export interface HeadlessAgent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error' | 'offline';
  host: string;
  port: number;
  capabilities: string[];
  currentJob?: HeadlessJob;
  metrics: AgentMetrics;
}

export interface HeadlessJob {
  id: string;
  type: 'scan' | 'crawl' | 'test' | 'audit';
  target: string;
  configuration: any;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  results?: any;
}

export interface AgentMetrics {
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
  totalRequests: number;
  uptime: string;
}

export interface DockerConfig {
  image: string;
  tag: string;
  containerName: string;
  ports: Record<string, number>;
  volumes: string[];
  environment: Record<string, string>;
  network?: string;
  replicas: number;
}

export interface AutomationPipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  schedule?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: 'scan' | 'test' | 'report' | 'notify' | 'export';
  configuration: any;
  dependsOn?: string[];
  continueOnError: boolean;
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

// BApp Store & Extension Types (Feature 23)
export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'scanner' | 'fuzzer' | 'authentication' | 'graphql' | 'api' | 'reporting' | 'utility' | 'custom';
  type: 'community' | 'enterprise' | 'verified';
  rating: number;
  downloads: number;
  lastUpdated: string;
  size: number;
  screenshots?: string[];
  documentation?: string;
  sourceUrl?: string;
  licenseType: 'free' | 'paid' | 'subscription';
  price?: number;
  compatibility: string[];
  tags: string[];
  installed: boolean;
  enabled?: boolean;
}

export interface ExtensionCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  description: string;
}

export interface ExtensionReview {
  id: string;
  extensionId: string;
  author: string;
  rating: number;
  comment: string;
  timestamp: string;
  helpful: number;
}

export interface InstalledExtension {
  id: string;
  extension: Extension;
  installedAt: string;
  enabled: boolean;
  autoUpdate: boolean;
  config?: Record<string, any>;
  uiPanels?: ExtensionUIPanel[];
}

export interface ExtensionUIPanel {
  id: string;
  title: string;
  component: string;
  location: 'main' | 'sidebar' | 'modal' | 'context-menu';
}

export interface ExtensionUpdate {
  extensionId: string;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  size: number;
  available: boolean;
}

// API & SDK Types (Feature 24)
export interface ExtensionProject {
  id: string;
  name: string;
  description: string;
  language: 'java' | 'python' | 'javascript';
  framework: 'burp-api' | 'custom';
  version: string;
  createdAt: string;
  modifiedAt: string;
  files: ExtensionFile[];
  dependencies: string[];
  buildConfig?: BuildConfiguration;
}

export interface ExtensionFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'resource';
  language: string;
}

export interface BuildConfiguration {
  outputPath: string;
  mainClass?: string;
  pythonVersion?: string;
  dependencies: Record<string, string>;
  buildScript?: string;
}

export interface APIEndpointDoc {
  path: string;
  method: string;
  description: string;
  parameters: APIParameterDoc[];
  requestBody?: string;
  responseSchema: string;
  exampleRequest: string;
  exampleResponse: string;
  category: string;
}

export interface APIParameterDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface SDKExample {
  id: string;
  title: string;
  description: string;
  language: 'java' | 'python' | 'javascript';
  category: string;
  code: string;
  tags: string[];
}

export interface ExtensionTestResult {
  extensionId: string;
  passed: boolean;
  tests: TestCase[];
  coverage?: number;
  errors: string[];
  warnings: string[];
  executionTime: number;
}

export interface TestCase {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface APIConfiguration {
  enabled: boolean;
  port: number;
  apiKey: string;
  allowedOrigins: string[];
  rateLimit: number;
  enableDocs: boolean;
  enableSwagger: boolean;
}

export interface PythonExtension {
  name: string;
  pythonPath: string;
  jythonVersion: string;
  modules: string[];
  virtualEnv?: string;
}

export interface JavaExtension {
  name: string;
  mainClass: string;
  classPath: string[];
  jarFile: string;
  javaVersion: string;
}

export interface ExtensionLog {
  extensionId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  stackTrace?: string;
}

export interface RESTAPICall {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  requestBody?: any;
  responseStatus: number;
  responseBody?: any;
  duration: number;
  source: string;
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

  // Authenticated Scanning
  authSaveCredential: (credential: Credential) => Promise<{ success: boolean; id?: string; error?: string }>;
  authGetCredentials: () => Promise<{ success: boolean; credentials?: Credential[]; error?: string }>;
  authDeleteCredential: (id: string) => Promise<{ success: boolean; error?: string }>;
  authTestCredential: (id: string, targetUrl: string) => Promise<{ success: boolean; authenticated?: boolean; error?: string }>;
  authCreateMacro: (macro: AuthMacro) => Promise<{ success: boolean; id?: string; error?: string }>;
  authGetMacros: () => Promise<{ success: boolean; macros?: AuthMacro[]; error?: string }>;
  authDeleteMacro: (id: string) => Promise<{ success: boolean; error?: string }>;
  authRunMacro: (id: string) => Promise<{ success: boolean; result?: any; error?: string }>;
  authCreateSessionRule: (rule: SessionRule) => Promise<{ success: boolean; id?: string; error?: string }>;
  authGetSessionRules: () => Promise<{ success: boolean; rules?: SessionRule[]; error?: string }>;
  authDeleteSessionRule: (id: string) => Promise<{ success: boolean; error?: string }>;
  authScanWithCredentials: (credentialId: string, targetUrl: string, scanType: string) => Promise<{ success: boolean; result?: AuthenticatedScanResult; error?: string }>;
  onAuthScanProgress: (callback: (progress: { current: number; total: number; status: string }) => void) => void;

  // API & Mobile Testing
  apiDiscoverEndpoints: (targetUrl: string) => Promise<{ success: boolean; endpoints?: APIEndpoint[]; error?: string }>;
  apiTestEndpoint: (endpoint: APIEndpoint) => Promise<{ success: boolean; result?: APIEndpoint; error?: string }>;
  apiScanEndpoint: (endpoint: APIEndpoint, scanType: 'quick' | 'full') => Promise<{ success: boolean; vulnerabilities?: VulnerabilityScanResult[]; error?: string }>;
  apiParseOpenAPI: (specUrl: string) => Promise<{ success: boolean; endpoints?: APIEndpoint[]; error?: string }>;
  apiIntrospectGraphQL: (endpoint: string) => Promise<{ success: boolean; schema?: GraphQLSchema; error?: string }>;
  apiTestGraphQL: (endpoint: string, query: string, variables?: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  apiScanGraphQL: (endpoint: string, schema: GraphQLSchema) => Promise<{ success: boolean; vulnerabilities?: VulnerabilityScanResult[]; error?: string }>;
  mobileStartSession: (deviceType: 'android' | 'ios', deviceName: string) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  mobileStopSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  mobileGetSessions: () => Promise<{ success: boolean; sessions?: MobileAppSession[]; error?: string }>;
  mobileBypassSSLPinning: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  onAPIEndpointDiscovered: (callback: (endpoint: APIEndpoint) => void) => void;
  onMobileRequest: (callback: (request: ProxyHistoryItem) => void) => void;

  // JavaScript & SPA Analysis
  jsDiscoverEndpoints: (targetUrl: string) => Promise<{ success: boolean; endpoints?: SPAEndpoint[]; error?: string }>;
  jsAnalyzeFile: (url: string) => Promise<{ success: boolean; analysis?: JavaScriptFile; error?: string }>;
  jsScanForSecrets: (targetUrl: string) => Promise<{ success: boolean; secrets?: JSSecret[]; error?: string }>;
  jsTestDOMXSS: (targetUrl: string) => Promise<{ success: boolean; vectors?: DOMXSSVector[]; error?: string }>;
  jsDeobfuscate: (code: string) => Promise<{ success: boolean; deobfuscated?: string; error?: string }>;
  jsEnableHeadlessBrowser: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  jsCrawlSPA: (targetUrl: string, maxDepth: number) => Promise<{ success: boolean; urls?: string[]; endpoints?: SPAEndpoint[]; error?: string }>;
  onJSVulnerabilityFound: (callback: (vuln: JSVulnerability) => void) => void;
  onJSSecretFound: (callback: (secret: JSSecret) => void) => void;

  // Advanced Injection Testing
  injectionTestSQL: (target: string, parameter: string, method: 'in-band' | 'blind' | 'time-based' | 'out-of-band') => Promise<{ success: boolean; result?: InjectionTest; error?: string }>;
  injectionTestNoSQL: (target: string, parameter: string) => Promise<{ success: boolean; result?: InjectionTest; error?: string }>;
  injectionTestCommand: (target: string, parameter: string) => Promise<{ success: boolean; result?: InjectionTest; error?: string }>;
  injectionTestLDAP: (target: string, parameter: string) => Promise<{ success: boolean; result?: InjectionTest; error?: string }>;
  injectionTestXPath: (target: string, parameter: string) => Promise<{ success: boolean; result?: InjectionTest; error?: string }>;
  injectionTestTemplate: (target: string, parameter: string) => Promise<{ success: boolean; result?: TemplateInjectionTest; error?: string }>;
  injectionTestXXE: (target: string) => Promise<{ success: boolean; result?: InjectionTest; error?: string }>;
  injectionTestDeserialization: (target: string, language: string) => Promise<{ success: boolean; result?: DeserializationTest; error?: string }>;
  injectionStartCollaborator: () => Promise<{ success: boolean; url?: string; error?: string }>;
  injectionGetCollaboratorInteractions: () => Promise<{ success: boolean; interactions?: CollaboratorInteraction[]; error?: string }>;
  onCollaboratorInteraction: (callback: (interaction: CollaboratorInteraction) => void) => void;
  onInjectionFound: (callback: (test: InjectionTest) => void) => void;

  // WebSocket & Protocol Support
  websocketConnect: (url: string, protocols?: string[]) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
  websocketDisconnect: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
  websocketSend: (connectionId: string, data: string, type: 'text' | 'binary') => Promise<{ success: boolean; error?: string }>;
  websocketGetConnections: () => Promise<{ success: boolean; connections?: WebSocketConnection[]; error?: string }>;
  websocketGetMessages: (connectionId: string) => Promise<{ success: boolean; messages?: WebSocketMessage[]; error?: string }>;
  websocketIntercept: (connectionId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  protocolRegisterCustom: (protocol: CustomProtocol) => Promise<{ success: boolean; error?: string }>;
  protocolGetCustom: () => Promise<{ success: boolean; protocols?: CustomProtocol[]; error?: string }>;
  protocolDeleteCustom: (name: string) => Promise<{ success: boolean; error?: string }>;
  protocolParseMessage: (protocolName: string, data: Uint8Array) => Promise<{ success: boolean; parsed?: ProtocolMessage; error?: string }>;
  onWebSocketMessage: (callback: (message: WebSocketMessage) => void) => void;
  onWebSocketConnectionChange: (callback: (connection: WebSocketConnection) => void) => void;
  onProtocolMessage: (callback: (message: ProtocolMessage) => void) => void;

  // Reporting & Exporting
  reportGenerate: (findings: ReportFinding[], metadata: ReportMetadata, template: string, format: 'html' | 'pdf') => Promise<{ success: boolean; report?: Report; error?: string }>;
  reportGetTemplates: () => Promise<{ success: boolean; templates?: ReportTemplate[]; error?: string }>;
  reportGetTemplate: (templateId: string) => Promise<{ success: boolean; template?: ReportTemplate; error?: string }>;
  reportSaveTemplate: (template: ReportTemplate) => Promise<{ success: boolean; id?: string; error?: string }>;
  reportDeleteTemplate: (templateId: string) => Promise<{ success: boolean; error?: string }>;
  reportGetAll: () => Promise<{ success: boolean; reports?: Report[]; error?: string }>;
  reportDelete: (reportId: string) => Promise<{ success: boolean; error?: string }>;
  reportExport: (reportId: string, format: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  exportToFormat: (findings: ReportFinding[], config: ExportConfig) => Promise<{ success: boolean; result?: ExportResult; error?: string }>;
  exportToJira: (findings: ReportFinding[], jiraConfig: any) => Promise<{ success: boolean; issuesCreated?: number; error?: string }>;
  exportToGitHub: (findings: ReportFinding[], githubConfig: any) => Promise<{ success: boolean; issuesCreated?: number; error?: string }>;
  onReportGenerated: (callback: (report: Report) => void) => void;

  // Project Files & Workspace
  projectCreate: (name: string, description?: string) => Promise<{ success: boolean; project?: Project; error?: string }>;
  projectOpen: (filePath: string) => Promise<{ success: boolean; project?: Project; error?: string }>;
  projectSave: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  projectSaveAs: (projectId: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
  projectClose: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  projectGetAll: () => Promise<{ success: boolean; projects?: Project[]; error?: string }>;
  projectGetCurrent: () => Promise<{ success: boolean; project?: Project; error?: string }>;
  projectUpdateConfig: (projectId: string, config: Partial<ProjectConfiguration>) => Promise<{ success: boolean; error?: string }>;
  projectAddSavedItem: (projectId: string, item: SavedItem) => Promise<{ success: boolean; error?: string }>;
  projectRemoveSavedItem: (projectId: string, itemId: string) => Promise<{ success: boolean; error?: string }>;
  projectExport: (projectId: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
  workspaceCreate: (name: string) => Promise<{ success: boolean; workspace?: Workspace; error?: string }>;
  workspaceLoad: (workspaceId: string) => Promise<{ success: boolean; workspace?: Workspace; error?: string }>;
  workspaceSave: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  workspaceGetAll: () => Promise<{ success: boolean; workspaces?: Workspace[]; error?: string }>;
  workspaceSetActive: (workspaceId: string, projectId: string) => Promise<{ success: boolean; error?: string }>;
  onProjectSaved: (callback: (project: Project) => void) => void;
  onProjectModified: (callback: (project: Project) => void) => void;

  // Import/Export & Tool Interoperability
  importFromFile: (config: ImportConfig) => Promise<{ success: boolean; result?: ImportResult; error?: string }>;
  importHTTPHistory: (filePath: string, format: 'har' | 'burp' | 'zap') => Promise<{ success: boolean; result?: ImportResult; error?: string }>;
  importPCAP: (filePath: string) => Promise<{ success: boolean; result?: ImportResult; error?: string }>;
  importPostmanCollection: (filePath: string) => Promise<{ success: boolean; result?: ImportResult; error?: string }>;
  exportToTool: (tool: string, data: any, options: any) => Promise<{ success: boolean; result?: ExportResult; error?: string }>;
  toolIntegrationAdd: (integration: ToolIntegration) => Promise<{ success: boolean; error?: string }>;
  toolIntegrationGet: () => Promise<{ success: boolean; integrations?: ToolIntegration[]; error?: string }>;
  toolIntegrationRemove: (tool: string) => Promise<{ success: boolean; error?: string }>;
  toolIntegrationRun: (tool: string, target: string, options: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  cicdConfigSave: (config: CICDConfig) => Promise<{ success: boolean; error?: string }>;
  cicdConfigGet: () => Promise<{ success: boolean; config?: CICDConfig; error?: string }>;
  cicdTriggerScan: (config: any) => Promise<{ success: boolean; jobId?: string; error?: string }>;
  onImportComplete: (callback: (result: ImportResult) => void) => void;
  onExportComplete: (callback: (result: ExportResult) => void) => void;

  // Headless & Dockerized Operation
  headlessAgentRegister: (agent: Omit<HeadlessAgent, 'id' | 'metrics'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  headlessAgentGetAll: () => Promise<{ success: boolean; agents?: HeadlessAgent[]; error?: string }>;
  headlessAgentRemove: (agentId: string) => Promise<{ success: boolean; error?: string }>;
  headlessJobCreate: (agentId: string, job: Omit<HeadlessJob, 'id' | 'status' | 'progress'>) => Promise<{ success: boolean; jobId?: string; error?: string }>;
  headlessJobGetStatus: (jobId: string) => Promise<{ success: boolean; job?: HeadlessJob; error?: string }>;
  headlessJobCancel: (jobId: string) => Promise<{ success: boolean; error?: string }>;
  headlessJobGetResults: (jobId: string) => Promise<{ success: boolean; results?: any; error?: string }>;
  dockerConfigSave: (config: DockerConfig) => Promise<{ success: boolean; error?: string }>;
  dockerConfigGet: () => Promise<{ success: boolean; config?: DockerConfig; error?: string }>;
  dockerContainerStart: (config: DockerConfig) => Promise<{ success: boolean; containerId?: string; error?: string }>;
  dockerContainerStop: (containerId: string) => Promise<{ success: boolean; error?: string }>;
  dockerContainerGetStatus: (containerId: string) => Promise<{ success: boolean; status?: any; error?: string }>;
  pipelineCreate: (pipeline: Omit<AutomationPipeline, 'id'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  pipelineGetAll: () => Promise<{ success: boolean; pipelines?: AutomationPipeline[]; error?: string }>;
  pipelineRun: (pipelineId: string) => Promise<{ success: boolean; runId?: string; error?: string }>;
  pipelineDelete: (pipelineId: string) => Promise<{ success: boolean; error?: string }>;
  onHeadlessJobUpdate: (callback: (job: HeadlessJob) => void) => void;
  onAgentStatusChange: (callback: (agent: HeadlessAgent) => void) => void;
  onPipelineComplete: (callback: (pipelineId: string, success: boolean) => void) => void;

  // BApp Store & Extensions (Feature 23)
  extensionSearch: (query: string, filters?: { category?: string; type?: string; sortBy?: string }) => Promise<{ success: boolean; extensions?: Extension[]; error?: string }>;
  extensionGetAll: () => Promise<{ success: boolean; extensions?: Extension[]; error?: string }>;
  extensionGetById: (extensionId: string) => Promise<{ success: boolean; extension?: Extension; error?: string }>;
  extensionGetCategories: () => Promise<{ success: boolean; categories?: ExtensionCategory[]; error?: string }>;
  extensionInstall: (extensionId: string) => Promise<{ success: boolean; error?: string }>;
  extensionUninstall: (extensionId: string) => Promise<{ success: boolean; error?: string }>;
  extensionEnable: (extensionId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  extensionGetInstalled: () => Promise<{ success: boolean; extensions?: InstalledExtension[]; error?: string }>;
  extensionUpdate: (extensionId: string) => Promise<{ success: boolean; error?: string }>;
  extensionCheckUpdates: () => Promise<{ success: boolean; updates?: ExtensionUpdate[]; error?: string }>;
  extensionUpdateAll: () => Promise<{ success: boolean; updated?: number; error?: string }>;
  extensionGetReviews: (extensionId: string) => Promise<{ success: boolean; reviews?: ExtensionReview[]; error?: string }>;
  extensionSubmitReview: (extensionId: string, rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  extensionGetConfig: (extensionId: string) => Promise<{ success: boolean; config?: Record<string, any>; error?: string }>;
  extensionSaveConfig: (extensionId: string, config: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  extensionGetUIPanel: (extensionId: string, panelId: string) => Promise<{ success: boolean; panel?: ExtensionUIPanel; error?: string }>;
  onExtensionInstalled: (callback: (extension: InstalledExtension) => void) => void;
  onExtensionUninstalled: (callback: (extensionId: string) => void) => void;
  onExtensionUpdated: (callback: (extension: InstalledExtension) => void) => void;
  onExtensionError: (callback: (extensionId: string, error: string) => void) => void;

  // APIs & SDKs (Feature 24)
  extensionProjectCreate: (name: string, language: 'java' | 'python' | 'javascript', template?: string) => Promise<{ success: boolean; project?: ExtensionProject; error?: string }>;
  extensionProjectOpen: (projectId: string) => Promise<{ success: boolean; project?: ExtensionProject; error?: string }>;
  extensionProjectSave: (project: ExtensionProject) => Promise<{ success: boolean; error?: string }>;
  extensionProjectDelete: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  extensionProjectGetAll: () => Promise<{ success: boolean; projects?: ExtensionProject[]; error?: string }>;
  extensionProjectBuild: (projectId: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  extensionProjectTest: (projectId: string) => Promise<{ success: boolean; result?: ExtensionTestResult; error?: string }>;
  extensionProjectDeploy: (projectId: string) => Promise<{ success: boolean; extensionId?: string; error?: string }>;
  extensionFileCreate: (projectId: string, file: ExtensionFile) => Promise<{ success: boolean; error?: string }>;
  extensionFileUpdate: (projectId: string, filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  extensionFileDelete: (projectId: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
  apiGetDocumentation: () => Promise<{ success: boolean; endpoints?: APIEndpointDoc[]; error?: string }>;
  apiGetEndpointDoc: (category: string) => Promise<{ success: boolean; endpoints?: APIEndpointDoc[]; error?: string }>;
  apiGetExamples: (language?: string, category?: string) => Promise<{ success: boolean; examples?: SDKExample[]; error?: string }>;
  apiGetExample: (exampleId: string) => Promise<{ success: boolean; example?: SDKExample; error?: string }>;
  apiConfigGet: () => Promise<{ success: boolean; config?: APIConfiguration; error?: string }>;
  apiConfigSave: (config: APIConfiguration) => Promise<{ success: boolean; error?: string }>;
  apiGenerateKey: () => Promise<{ success: boolean; apiKey?: string; error?: string }>;
  apiRevokeKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  apiGetCallHistory: () => Promise<{ success: boolean; calls?: RESTAPICall[]; error?: string }>;
  apiClearCallHistory: () => Promise<{ success: boolean; error?: string }>;
  pythonExtensionLoad: (extension: PythonExtension) => Promise<{ success: boolean; error?: string }>;
  pythonExtensionGetLoaded: () => Promise<{ success: boolean; extensions?: PythonExtension[]; error?: string }>;
  javaExtensionLoad: (extension: JavaExtension) => Promise<{ success: boolean; error?: string }>;
  javaExtensionGetLoaded: () => Promise<{ success: boolean; extensions?: JavaExtension[]; error?: string }>;
  extensionGetLogs: (extensionId?: string) => Promise<{ success: boolean; logs?: ExtensionLog[]; error?: string }>;
  extensionClearLogs: (extensionId?: string) => Promise<{ success: boolean; error?: string }>;
  onExtensionLog: (callback: (log: ExtensionLog) => void) => void;
  onAPICall: (callback: (call: RESTAPICall) => void) => void;
  onExtensionBuildComplete: (callback: (projectId: string, success: boolean, output: string) => void) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
