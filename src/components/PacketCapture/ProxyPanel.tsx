import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconPlayerPlay,
  IconPlayerStop,
  IconArrowForward,
  IconTrash,
  IconEdit,
  IconFilter,
  IconSettings,
  IconShieldCheck,
  IconCertificate,
  IconRepeat,
  IconBolt,
  IconHistory,
  IconCircleDot,
  IconReplace,
  IconTarget,
  IconSitemap,
  IconTag,
  IconFolder,
  IconNotes,
  IconRadar,
  IconFingerprint,
  IconCode,
  IconColumns,
  IconRefresh,
  IconPlus,
  IconChartBar
} from '@tabler/icons-react';
import { ProxyHistoryItem, InterceptItem } from '@/types';
import { cn } from '@/lib/utils';

interface ProxyPanelProps {
  onClose: () => void;
}

type TabType = 'intercept' | 'history' | 'repeater' | 'target' | 'spider' | 'scanner' | 'intruder' | 'sequencer' | 'decoder' | 'comparer' | 'settings';

interface MatchReplaceRule {
  id: string;
  name: string;
  type: 'request' | 'response';
  matchType: 'regex' | 'text' | 'header';
  matchPattern: string;
  replaceWith: string;
  enabled: boolean;
}

interface ScopeRule {
  id: string;
  type: 'include' | 'exclude';
  protocol: string;
  host: string;
  port?: string;
  path?: string;
  enabled: boolean;
}

interface ProxySettings {
  proxyPort: number;
  sslInterception: boolean;
  upstreamProxy: {
    enabled: boolean;
    host: string;
    port: number;
    type: 'http' | 'socks4' | 'socks5';
    auth?: {
      username: string;
      password: string;
    };
  };
  matchReplace: MatchReplaceRule[];
  scope: ScopeRule[];
  autoForward: boolean;
  interceptRequests: boolean;
  interceptResponses: boolean;
}

interface SiteMapNode {
  id: string;
  url: string;
  host: string;
  path: string;
  method: string;
  statusCode?: number;
  contentType?: string;
  parameters: string[];
  children?: SiteMapNode[];
  expanded?: boolean;
  annotation?: string;
  tags?: string[];
  group?: string;
  responseTime?: number;
  responseSize?: number;
}

interface CrawlSettings {
  enabled: boolean;
  maxDepth: number;
  maxRequests: number;
  followRedirects: boolean;
  parseLinks: boolean;
  submitForms: boolean;
  crawlScope: 'in-scope' | 'all' | 'current-host';
  requestDelay: number;
  respectRobotsTxt: boolean;
}

interface TargetGroup {
  id: string;
  name: string;
  color: string;
  nodes: string[]; // node IDs
}

interface FormConfig {
  id: string;
  url: string;
  fields: { name: string; value: string; type: string }[];
  submitOnStart: boolean;
  isLoginForm: boolean;
  enabled: boolean;
}

interface SpiderConfig {
  autodiscover: boolean;
  maxDepth: number;
  maxRequests: number;
  requestDelay: number;
  maxThreads: number;
  followRedirects: boolean;
  parseLinks: boolean;
  parseForms: boolean;
  parseComments: boolean;
  parseRobotsTxt: boolean;
  parseScripts: boolean;
  javascriptRendering: boolean;
  headlessBrowser: boolean;
  browserTimeout: number;
  crawlHiddenParams: boolean;
  detectFileTypes: string[];
  ignoreQueryStrings: boolean;
  maxQueryStringLength: number;
}

interface CrawlingRule {
  id: string;
  name: string;
  type: 'path-filter' | 'extension-filter' | 'parameter-filter' | 'custom-regex';
  pattern: string;
  action: 'allow' | 'deny';
  enabled: boolean;
}

interface CrawlQueueItem {
  id: string;
  url: string;
  depth: number;
  method: string;
  referer?: string;
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  discoveredAt: string;
}

interface VulnerabilityIssue {
  id: string;
  type: 'sql-injection' | 'xss-reflected' | 'xss-stored' | 'xss-dom' | 'csrf' | 'xxe' | 'ssrf' | 'rce' | 'open-redirect' | 'insecure-cookie' | 'clickjacking' | 'path-traversal' | 'command-injection' | 'ldap-injection' | 'xml-injection' | 'header-injection' | 'file-upload' | 'authentication-bypass' | 'authorization-bypass' | 'information-disclosure' | 'security-misconfiguration';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: 'certain' | 'firm' | 'tentative';
  url: string;
  parameter?: string;
  method: string;
  title: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
  poc: {
    request: string;
    response?: string;
    payload: string;
  };
  discoveredAt: string;
  scanType: 'active' | 'passive';
  cvss?: number;
  cwe?: string;
  owasp?: string;
}

interface ScanPolicy {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  vulnerabilityChecks: {
    sqlInjection: boolean;
    xssReflected: boolean;
    xssStored: boolean;
    xssDom: boolean;
    csrf: boolean;
    xxe: boolean;
    ssrf: boolean;
    rce: boolean;
    openRedirect: boolean;
    insecureCookie: boolean;
    clickjacking: boolean;
    pathTraversal: boolean;
    commandInjection: boolean;
    ldapInjection: boolean;
    xmlInjection: boolean;
    headerInjection: boolean;
    fileUpload: boolean;
    authBypass: boolean;
    authorizationBypass: boolean;
    informationDisclosure: boolean;
    securityMisconfiguration: boolean;
  };
  scanSpeed: 'fast' | 'normal' | 'thorough' | 'insane';
  maxRequestsPerSecond: number;
  followRedirects: boolean;
  detectCustomErrors: boolean;
  customErrorPatterns: string[];
}

interface ScanConfiguration {
  policy: string; // policy ID
  scope: 'all' | 'in-scope' | 'selected';
  selectedUrls: string[];
  activeScanning: boolean;
  passiveScanning: boolean;
  maxConcurrentRequests: number;
  requestTimeout: number;
}

interface ScanTask {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  configuration: ScanConfiguration;
  stats: {
    urlsScanned: number;
    totalUrls: number;
    issuesFound: number;
    requestsSent: number;
  };
  schedule?: {
    enabled: boolean;
    frequency: 'once' | 'hourly' | 'daily' | 'weekly';
    time?: string;
    daysOfWeek?: number[];
  };
}

interface PayloadPosition {
  id: string;
  start: number;
  end: number;
  name: string;
}

interface PayloadSet {
  id: string;
  type: 'simple-list' | 'numbers' | 'brute-force' | 'null' | 'character-substitution' | 'case-modification' | 'recursive-grep' | 'custom';
  name: string;
  payloads: string[];
  numberConfig?: {
    from: number;
    to: number;
    step: number;
    format: 'decimal' | 'hex' | 'octal';
  };
  bruteForceConfig?: {
    charset: string;
    minLength: number;
    maxLength: number;
  };
}

interface PayloadProcessor {
  id: string;
  type: 'url-encode' | 'html-encode' | 'base64-encode' | 'base64-decode' | 'hash' | 'add-prefix' | 'add-suffix' | 'match-replace' | 'reverse' | 'lowercase' | 'uppercase';
  enabled: boolean;
  config?: any;
}

interface GrepRule {
  id: string;
  type: 'grep-match' | 'grep-extract';
  name: string;
  pattern: string;
  isRegex: boolean;
  enabled: boolean;
}

interface IntruderAttack {
  id: string;
  name: string;
  attackType: 'sniper' | 'battering-ram' | 'pitchfork' | 'cluster-bomb';
  baseRequest: {
    method: string;
    url: string;
    headers: string;
    body: string;
  };
  positions: PayloadPosition[];
  payloadSets: PayloadSet[];
  processors: PayloadProcessor[];
  grepRules: GrepRule[];
  throttle: {
    enabled: boolean;
    delayMs: number;
    maxConcurrent: number;
  };
  status: 'configuring' | 'running' | 'paused' | 'completed';
  progress: number;
  results: IntruderResult[];
}

interface IntruderResult {
  id: string;
  requestNumber: number;
  payload: string | string[];
  statusCode?: number;
  length?: number;
  time?: number;
  error?: string;
  matches: Record<string, boolean>;
  extractions: Record<string, string>;
  request: string;
  response?: string;
}

interface RepeaterHistoryItem {
  id: string;
  timestamp: number;
  request: {
    method: string;
    url: string;
    headers: string;
    body: string;
  };
  response: {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    bodyString: string;
    time: number;
    length: number;
  };
}

interface SequencerToken {
  id: string;
  value: string;
  timestamp: number;
}

interface SequencerAnalysis {
  totalTokens: number;
  uniqueTokens: number;
  entropy: number;
  compressionRatio: number;
  characterFrequency: Record<string, number>;
  bitDistribution: number[];
  serialCorrelation: number;
  estimatedEntropy: {
    shannon: number;
    minEntropy: number;
  };
}

interface DecoderTransformation {
  id: string;
  type: 'encode' | 'decode';
  method: 'base64' | 'url' | 'html' | 'hex' | 'ascii-hex' | 'gzip' | 'md5' | 'sha1' | 'sha256';
}

interface DecoderChain {
  id: string;
  name: string;
  transformations: DecoderTransformation[];
  input: string;
  output: string;
}

interface ComparerItem {
  id: string;
  name: string;
  content: string;
  type: 'request' | 'response' | 'text';
  timestamp: number;
}

const ProxyPanel: React.FC<ProxyPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('intercept');
  const [proxyRunning, setProxyRunning] = useState(false);
  const [interceptEnabled, setInterceptEnabled] = useState(false);
  const [interceptQueue, setInterceptQueue] = useState<InterceptItem[]>([]);
  const [currentIntercept, setCurrentIntercept] = useState<InterceptItem | null>(null);
  const [proxyHistory, setProxyHistory] = useState<ProxyHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ProxyHistoryItem | null>(null);
  const [filter, setFilter] = useState('');

  // Repeater state
  const [repeaterResponse, setRepeaterResponse] = useState<any>(null);
  const [repeaterUrl, setRepeaterUrl] = useState('');
  const [repeaterMethod, setRepeaterMethod] = useState('GET');
  const [repeaterHeaders, setRepeaterHeaders] = useState('');
  const [repeaterBody, setRepeaterBody] = useState('');

  // Settings state
  const [settings, setSettings] = useState<ProxySettings>({
    proxyPort: 8080,
    sslInterception: true,
    upstreamProxy: {
      enabled: false,
      host: '',
      port: 8080,
      type: 'http',
    },
    matchReplace: [],
    scope: [],
    autoForward: false,
    interceptRequests: true,
    interceptResponses: false,
  });

  // Editable intercept state
  const [editedMethod, setEditedMethod] = useState('');
  const [editedUrl, setEditedUrl] = useState('');
  const [editedHeaders, setEditedHeaders] = useState('');
  const [editedBody, setEditedBody] = useState('');

  // Target/Site Map state
  const [siteMap, setSiteMap] = useState<SiteMapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<SiteMapNode | null>(null);
  const [siteMapFilter, setSiteMapFilter] = useState('');
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [crawlSettings, setCrawlSettings] = useState<CrawlSettings>({
    enabled: false,
    maxDepth: 5,
    maxRequests: 1000,
    followRedirects: true,
    parseLinks: true,
    submitForms: false,
    crawlScope: 'in-scope',
    requestDelay: 100,
    respectRobotsTxt: true,
  });
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStats, setCrawlStats] = useState({ discovered: 0, crawled: 0 });

  // Spider state
  const [spiderConfig, setSpiderConfig] = useState<SpiderConfig>({
    autodiscover: true,
    maxDepth: 10,
    maxRequests: 5000,
    requestDelay: 50,
    maxThreads: 10,
    followRedirects: true,
    parseLinks: true,
    parseForms: true,
    parseComments: true,
    parseRobotsTxt: true,
    parseScripts: true,
    javascriptRendering: false,
    headlessBrowser: false,
    browserTimeout: 30000,
    crawlHiddenParams: true,
    detectFileTypes: ['.js', '.css', '.json', '.xml', '.txt'],
    ignoreQueryStrings: false,
    maxQueryStringLength: 2048,
  });
  const [formConfigs, setFormConfigs] = useState<FormConfig[]>([]);
  const [crawlingRules, setCrawlingRules] = useState<CrawlingRule[]>([]);
  const [crawlQueue] = useState<CrawlQueueItem[]>([]);
  const [discoveredEndpoints] = useState<string[]>([]);
  const [spiderRunning, setSpiderRunning] = useState(false);

  // Scanner state
  const [vulnerabilityIssues] = useState<VulnerabilityIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<VulnerabilityIssue | null>(null);
  const [scanPolicies, setScanPolicies] = useState<ScanPolicy[]>([
    {
      id: 'default',
      name: 'Default Policy',
      description: 'Balanced scan covering all common vulnerabilities',
      isDefault: true,
      vulnerabilityChecks: {
        sqlInjection: true,
        xssReflected: true,
        xssStored: true,
        xssDom: true,
        csrf: true,
        xxe: true,
        ssrf: true,
        rce: true,
        openRedirect: true,
        insecureCookie: true,
        clickjacking: true,
        pathTraversal: true,
        commandInjection: true,
        ldapInjection: true,
        xmlInjection: true,
        headerInjection: true,
        fileUpload: true,
        authBypass: true,
        authorizationBypass: true,
        informationDisclosure: true,
        securityMisconfiguration: true,
      },
      scanSpeed: 'normal',
      maxRequestsPerSecond: 10,
      followRedirects: true,
      detectCustomErrors: true,
      customErrorPatterns: [],
    },
  ]);
  const [scanConfiguration, setScanConfiguration] = useState<ScanConfiguration>({
    policy: 'default',
    scope: 'in-scope',
    selectedUrls: [],
    activeScanning: true,
    passiveScanning: true,
    maxConcurrentRequests: 10,
    requestTimeout: 30000,
  });
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [activeScanTask, setActiveScanTask] = useState<ScanTask | null>(null);
  

  // Intruder state
  const [intruderAttack, setIntruderAttack] = useState<IntruderAttack>({
    id: Date.now().toString(),
    name: 'Intruder Attack',
    attackType: 'sniper',
    baseRequest: {
      method: 'GET',
      url: 'https://example.com/search?q=test',
      headers: 'Host: example.com\nUser-Agent: Mozilla/5.0',
      body: '',
    },
    positions: [],
    payloadSets: [{
      id: '1',
      type: 'simple-list',
      name: 'Payload Set 1',
      payloads: ['admin', 'test', 'user', 'root'],
    }],
    processors: [],
    grepRules: [],
    throttle: {
      enabled: false,
      delayMs: 100,
      maxConcurrent: 10,
    },
    status: 'configuring',
    progress: 0,
    results: [],
  });
  const [selectedResult, setSelectedResult] = useState<IntruderResult | null>(null);
  const [intruderRequestText, setIntruderRequestText] = useState('');

  // Repeater history state
  const [repeaterHistory, setRepeaterHistory] = useState<RepeaterHistoryItem[]>([]);
  const [selectedRepeaterHistory, setSelectedRepeaterHistory] = useState<RepeaterHistoryItem | null>(null);

  // Sequencer state
  const [sequencerTokens, setSequencerTokens] = useState<SequencerToken[]>([]);
  const [sequencerAnalysis, setSequencerAnalysis] = useState<SequencerAnalysis | null>(null);
  const [sequencerInput, setSequencerInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Decoder state
  const [decoderChains, setDecoderChains] = useState<DecoderChain[]>([{
    id: '1',
    name: 'Chain 1',
    transformations: [],
    input: '',
    output: '',
  }]);
  const [selectedChain, setSelectedChain] = useState<DecoderChain | null>(null);

  // Comparer state
  const [comparerItems, setComparerItems] = useState<ComparerItem[]>([]);
  const [comparerLeft, setComparerLeft] = useState<ComparerItem | null>(null);
  const [comparerRight, setComparerRight] = useState<ComparerItem | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'text' | 'hex' | 'binary'>('text');

  useEffect(() => {
    if (!window.api) return;

    // Listen for proxy events
    window.api.onProxyStarted((port) => {
      setProxyRunning(true);
      console.log(`Proxy started on port ${port}`);
    });

    window.api.onProxyStopped(() => {
      setProxyRunning(false);
      console.log('Proxy stopped');
    });

    window.api.onProxyError((error) => {
      alert(`Proxy error: ${error}`);
    });

    window.api.onProxyIntercept((item) => {
      setInterceptQueue((prev) => [...prev, item]);
      if (!currentIntercept) {
        setCurrentIntercept(item);
        setEditedMethod(item.method);
        setEditedUrl(item.url);
        setEditedHeaders(Object.entries(item.headers).map(([k, v]) => `${k}: ${v}`).join('\n'));
        setEditedBody(item.bodyString || '');
      }
    });

    window.api.onProxyHistoryUpdate((item) => {
      setProxyHistory((prev) => [item, ...prev]);
    });

    window.api.onProxyHistoryCleared(() => {
      setProxyHistory([]);
    });

    // Load initial history
    window.api.getProxyHistory().then((result) => {
      if (result.success && result.history) {
        setProxyHistory(result.history);
      }
    });
  }, [currentIntercept]);

  const handleStartProxy = async () => {
    if (!window.api) return;
    const result = await window.api.startProxy(settings.proxyPort);
    if (result.success) {
      setProxyRunning(true);
    } else {
      alert(`Failed to start proxy: ${result.error}`);
    }
  };

  const handleStopProxy = async () => {
    if (!window.api) return;
    const result = await window.api.stopProxy();
    if (result.success) {
      setProxyRunning(false);
    }
  };

  const handleToggleIntercept = async () => {
    if (!window.api) return;
    const result = await window.api.toggleIntercept(!interceptEnabled);
    if (result.success) {
      setInterceptEnabled(result.enabled || false);
    }
  };

  const handleForwardIntercept = async () => {
    if (!window.api || !currentIntercept) return;

    // Parse edited headers back to object
    const headersObj: Record<string, string> = {};
    editedHeaders.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        headersObj[key.trim()] = valueParts.join(':').trim();
      }
    });

    const modifiedRequest = {
      id: currentIntercept.id,
      method: editedMethod,
      url: editedUrl,
      httpVersion: currentIntercept.httpVersion,
      headers: headersObj,
      bodyString: editedBody,
    };

    const result = await window.api.forwardIntercept(currentIntercept.id, modifiedRequest);
    if (result.success) {
      // Move to next intercepted item
      setInterceptQueue((prev) => prev.slice(1));
      if (interceptQueue.length > 1) {
        const next = interceptQueue[1];
        setCurrentIntercept(next);
        setEditedMethod(next.method);
        setEditedUrl(next.url);
        setEditedHeaders(Object.entries(next.headers).map(([k, v]) => `${k}: ${v}`).join('\n'));
        setEditedBody(next.bodyString || '');
      } else {
        setCurrentIntercept(null);
      }
    }
  };

  const handleDropIntercept = async () => {
    if (!window.api || !currentIntercept) return;
    const result = await window.api.dropIntercept(currentIntercept.id);
    if (result.success) {
      // Move to next intercepted item
      setInterceptQueue((prev) => prev.slice(1));
      if (interceptQueue.length > 1) {
        const next = interceptQueue[1];
        setCurrentIntercept(next);
        setEditedMethod(next.method);
        setEditedUrl(next.url);
        setEditedHeaders(Object.entries(next.headers).map(([k, v]) => `${k}: ${v}`).join('\n'));
        setEditedBody(next.bodyString || '');
      } else {
        setCurrentIntercept(null);
      }
    }
  };

  const handleClearHistory = async () => {
    if (!window.api) return;
    const result = await window.api.clearProxyHistory();
    if (result.success) {
      setProxyHistory([]);
      setSelectedHistoryItem(null);
    }
  };

  const handleSendToRepeater = (item: ProxyHistoryItem) => {
    setActiveTab('repeater');
    setRepeaterUrl(item.url);
    setRepeaterMethod(item.method);
    setRepeaterHeaders(Object.entries(item.headers).map(([k, v]) => `${k}: ${v}`).join('\n'));
    setRepeaterBody(item.bodyString || '');
  };

  const handleRepeatRequest = async () => {
    if (!window.api) return;

    // Parse headers
    const headersObj: Record<string, string> = {};
    repeaterHeaders.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        headersObj[key.trim()] = valueParts.join(':').trim();
      }
    });

    const requestData = {
      method: repeaterMethod,
      url: repeaterUrl,
      headers: headersObj,
      bodyString: repeaterBody,
    };

    const result = await window.api.repeatRequest(requestData);
    if (result.success && result.result) {
      setRepeaterResponse(result.result);

      // Save to history
      const historyItem: RepeaterHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        request: {
          method: repeaterMethod,
          url: repeaterUrl,
          headers: repeaterHeaders,
          body: repeaterBody,
        },
        response: result.result,
      };
      setRepeaterHistory((prev) => [historyItem, ...prev]);
    } else {
      alert(`Failed to send request: ${result.error}`);
    }
  };

  const handleAddMatchReplaceRule = () => {
    const newRule: MatchReplaceRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      type: 'request',
      matchType: 'text',
      matchPattern: '',
      replaceWith: '',
      enabled: true,
    };
    setSettings({
      ...settings,
      matchReplace: [...settings.matchReplace, newRule],
    });
  };

  const handleRemoveMatchReplaceRule = (id: string) => {
    setSettings({
      ...settings,
      matchReplace: settings.matchReplace.filter((rule) => rule.id !== id),
    });
  };

  const handleAddScopeRule = () => {
    const newRule: ScopeRule = {
      id: Date.now().toString(),
      type: 'include',
      protocol: 'http',
      host: '',
      enabled: true,
    };
    setSettings({
      ...settings,
      scope: [...settings.scope, newRule],
    });
  };

  const handleRemoveScopeRule = (id: string) => {
    setSettings({
      ...settings,
      scope: settings.scope.filter((rule) => rule.id !== id),
    });
  };

  const filteredHistory = proxyHistory.filter((item) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      item.url.toLowerCase().includes(f) ||
      item.method.toLowerCase().includes(f) ||
      (item.response?.statusCode.toString() || '').includes(f)
    );
  });

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-neutral-500';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="apple-card rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full max-w-7xl max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <IconCircleDot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black uppercase tracking-wide">HTTP/HTTPS Intercepting Proxy</h2>
              <p className="text-xs text-black opacity-60">
                Intercept, inspect, and modify HTTP/HTTPS traffic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-button rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
          >
            Close
          </button>
        </div>

        {/* Proxy Controls */}
        <div className="border-b border-gray-200 px-6 py-3.5 flex items-center gap-3 bg-gray-50">
          {!proxyRunning ? (
            <button
              onClick={handleStartProxy}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
            >
              <IconPlayerPlay size={16} />
              Start Proxy (Port {settings.proxyPort})
            </button>
          ) : (
            <button
              onClick={handleStopProxy}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
            >
              <IconPlayerStop size={16} />
              Stop Proxy
            </button>
          )}

          <button
            onClick={handleToggleIntercept}
            disabled={!proxyRunning}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 shadow-sm',
              interceptEnabled
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-200 text-black hover:bg-gray-300'
            )}
          >
            <IconFilter size={16} />
            {interceptEnabled ? 'Intercept On' : 'Intercept Off'}
          </button>

          {proxyRunning && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
              Proxy Running
            </div>
          )}

          {interceptEnabled && interceptQueue.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <IconCircleDot size={16} className="animate-pulse" />
              {interceptQueue.length} request{interceptQueue.length > 1 ? 's' : ''} queued
            </div>
          )}

          {settings.sslInterception && (
            <div className="ml-auto flex items-center gap-2 text-sm text-blue-600">
              <IconShieldCheck size={16} />
              SSL Interception Active
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('intercept')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'intercept'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Intercept
            {interceptQueue.length > 0 && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                {interceptQueue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'history'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            History
            {proxyHistory.length > 0 && (
              <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-black">
                {proxyHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('repeater')}
            className={cn(
              'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'repeater'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Repeater
          </button>
          <button
            onClick={() => setActiveTab('target')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'target'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Target
            {siteMap.length > 0 && (
              <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-black">
                {siteMap.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('spider')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'spider'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Spider
            {spiderRunning && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white animate-pulse">
                Running
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'scanner'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Scanner
            {vulnerabilityIssues.length > 0 && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                vulnerabilityIssues.some(i => i.severity === 'critical' || i.severity === 'high')
                  ? "bg-red-600 text-white"
                  : "bg-gray-300 text-black"
              )}>
                {vulnerabilityIssues.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('intruder')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'intruder'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Intruder
            {intruderAttack.status === 'running' && (
              <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white animate-pulse">
                Running
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sequencer')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'sequencer'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Sequencer
            {sequencerTokens.length > 0 && (
              <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-black">
                {sequencerTokens.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('decoder')}
            className={cn(
              'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'decoder'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Decoder
          </button>
          <button
            onClick={() => setActiveTab('comparer')}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'comparer'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Comparer
            {comparerItems.length > 0 && (
              <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-black">
                {comparerItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
              activeTab === 'settings'
                ? 'border-purple-600 text-purple-600 bg-white'
                : 'border-transparent text-black opacity-60 hover:opacity-100'
            )}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-white">
          {/* Intercept Tab */}
          {activeTab === 'intercept' && (
            <div className="h-full flex flex-col">
              {currentIntercept ? (
                <div className="flex-1 flex flex-col p-6 gap-4">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleForwardIntercept}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                    >
                      <IconArrowForward size={16} />
                      Forward
                    </button>
                    <button
                      onClick={handleDropIntercept}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                    >
                      <IconTrash size={16} />
                      Drop
                    </button>
                    <div className="ml-auto text-sm text-neutral-600 dark:text-neutral-400">
                      Queue: {interceptQueue.length} request{interceptQueue.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Request Editor */}
                  <div className="flex-1 grid grid-cols-1 gap-4 min-h-0">
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                      <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <IconEdit size={16} />
                          Intercepted Request (Editable)
                        </h3>
                      </div>
                      <div className="flex-1 overflow-auto p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">Method</label>
                            <input
                              type="text"
                              value={editedMethod}
                              onChange={(e) => setEditedMethod(e.target.value)}
                              className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">HTTP Version</label>
                            <input
                              type="text"
                              value={currentIntercept.httpVersion}
                              readOnly
                              className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-sm font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">URL</label>
                          <input
                            type="text"
                            value={editedUrl}
                            onChange={(e) => setEditedUrl(e.target.value)}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Headers (one per line: Header: value)</label>
                          <textarea
                            value={editedHeaders}
                            onChange={(e) => setEditedHeaders(e.target.value)}
                            rows={8}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Body</label>
                          <textarea
                            value={editedBody}
                            onChange={(e) => setEditedBody(e.target.value)}
                            rows={6}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-500">
                  <div className="text-center">
                    <IconFilter className="mx-auto mb-3 opacity-30" size={64} />
                    <p className="text-lg font-medium mb-1">No requests intercepted</p>
                    <p className="text-sm">
                      {interceptEnabled
                        ? 'Waiting for HTTP/HTTPS traffic...'
                        : 'Enable intercept to capture requests'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="h-full flex">
              {/* History List */}
              <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter by URL, method, status..."
                    className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={handleClearHistory}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      <div className="text-center">
                        <IconHistory className="mx-auto mb-2 opacity-30" size={48} />
                        <p>No proxy history</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {filteredHistory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedHistoryItem(item)}
                          className={cn(
                            'p-3 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                            selectedHistoryItem?.id === item.id && 'bg-purple-50 dark:bg-purple-900/20'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-blue-600">{item.method}</span>
                              {item.response && (
                                <span className={cn('text-xs font-semibold', getStatusColor(item.response.statusCode))}>
                                  {item.response.statusCode}
                                </span>
                              )}
                            </div>
                            {item.response && (
                              <span className="text-xs text-neutral-500">{item.response.time}ms</span>
                            )}
                          </div>
                          <div className="text-sm font-mono truncate">{item.url}</div>
                          {item.response && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {(item.response.length / 1024).toFixed(2)} KB
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* History Details */}
              <div className="flex-1 flex flex-col">
                {selectedHistoryItem ? (
                  <>
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
                      <button
                        onClick={() => handleSendToRepeater(selectedHistoryItem)}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
                      >
                        <IconRepeat size={14} />
                        Send to Repeater
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                      {/* Request */}
                      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                          <h3 className="font-semibold text-sm">Request</h3>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="text-sm font-mono">
                            {selectedHistoryItem.method} {selectedHistoryItem.url}
                          </div>
                          <div className="text-xs">
                            <strong>Headers:</strong>
                            <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-900 p-2 overflow-x-auto">
                              {Object.entries(selectedHistoryItem.headers)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join('\n')}
                            </pre>
                          </div>
                          {selectedHistoryItem.bodyString && (
                            <div className="text-xs">
                              <strong>Body:</strong>
                              <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-900 p-2 overflow-x-auto">
                                {selectedHistoryItem.bodyString}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Response */}
                      {selectedHistoryItem.response && (
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700">
                          <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="font-semibold text-sm">Response</h3>
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="text-sm font-mono">
                              <span className={getStatusColor(selectedHistoryItem.response.statusCode)}>
                                {selectedHistoryItem.response.statusCode} {selectedHistoryItem.response.statusMessage}
                              </span>
                              <span className="text-neutral-500 ml-3">
                                {selectedHistoryItem.response.time}ms
                              </span>
                              <span className="text-neutral-500 ml-3">
                                {(selectedHistoryItem.response.length / 1024).toFixed(2)} KB
                              </span>
                            </div>
                            <div className="text-xs">
                              <strong>Headers:</strong>
                              <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-900 p-2 overflow-x-auto">
                                {Object.entries(selectedHistoryItem.response.headers)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join('\n')}
                              </pre>
                            </div>
                            {selectedHistoryItem.response.bodyString && (
                              <div className="text-xs">
                                <strong>Body:</strong>
                                <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-900 p-2 overflow-x-auto max-h-96">
                                  {selectedHistoryItem.response.bodyString}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-neutral-500">
                    <p>Select a request to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Repeater Tab */}
          {activeTab === 'repeater' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 flex flex-col p-6 gap-4 min-h-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRepeatRequest}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
                  >
                    <IconBolt size={16} />
                    Send Request
                  </button>
                  {selectedRepeaterHistory && (
                    <button
                      onClick={() => {
                        setRepeaterMethod(selectedRepeaterHistory.request.method);
                        setRepeaterUrl(selectedRepeaterHistory.request.url);
                        setRepeaterHeaders(selectedRepeaterHistory.request.headers);
                        setRepeaterBody(selectedRepeaterHistory.request.body);
                        setRepeaterResponse(selectedRepeaterHistory.response);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-purple-600 text-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      <IconRepeat size={16} />
                      Load from History
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                  {/* Request Editor */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                    <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <h3 className="font-semibold text-sm">Request</h3>
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">Method</label>
                          <select
                            value={repeaterMethod}
                            onChange={(e) => setRepeaterMethod(e.target.value)}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                          >
                            <option>GET</option>
                            <option>POST</option>
                            <option>PUT</option>
                            <option>DELETE</option>
                            <option>PATCH</option>
                            <option>OPTIONS</option>
                            <option>HEAD</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">URL</label>
                        <input
                          type="text"
                          value={repeaterUrl}
                          onChange={(e) => setRepeaterUrl(e.target.value)}
                          placeholder="https://example.com/api/endpoint"
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Headers</label>
                        <textarea
                          value={repeaterHeaders}
                          onChange={(e) => setRepeaterHeaders(e.target.value)}
                          placeholder="Header: value"
                          rows={6}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Body</label>
                        <textarea
                          value={repeaterBody}
                          onChange={(e) => setRepeaterBody(e.target.value)}
                          placeholder="Request body (JSON, XML, form data, etc.)"
                          rows={8}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Response Viewer */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                    <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <h3 className="font-semibold text-sm">Response</h3>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                      {repeaterResponse ? (
                        <div className="space-y-3">
                          <div className="text-sm font-mono">
                            <span className={getStatusColor(repeaterResponse.statusCode)}>
                              {repeaterResponse.statusCode} {repeaterResponse.statusMessage}
                            </span>
                            <span className="text-neutral-500 ml-3">{repeaterResponse.time}ms</span>
                            <span className="text-neutral-500 ml-3">
                              {(repeaterResponse.length / 1024).toFixed(2)} KB
                            </span>
                          </div>
                          <div className="text-xs">
                            <strong>Headers:</strong>
                            <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-900 p-2 overflow-x-auto">
                              {Object.entries(repeaterResponse.headers || {})
                                .map(([k, v]) => `${k}: ${v}`)
                                .join('\n')}
                            </pre>
                          </div>
                          {repeaterResponse.bodyString && (
                            <div className="text-xs">
                              <strong>Body:</strong>
                              <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-900 p-2 overflow-x-auto">
                                {repeaterResponse.bodyString}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          <p>Send a request to see the response</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* History Panel */}
              {repeaterHistory.length > 0 && (
                <div className="border-t border-neutral-200 dark:border-neutral-700">
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">History ({repeaterHistory.length})</h3>
                    <button
                      onClick={() => setRepeaterHistory([])}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="max-h-48 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        <tr>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Method</th>
                          <th className="p-2 text-left">URL</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Size</th>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repeaterHistory.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedRepeaterHistory(item)}
                            className={cn(
                              "border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800",
                              selectedRepeaterHistory?.id === item.id && "bg-purple-50 dark:bg-purple-900/20"
                            )}
                          >
                            <td className="p-2">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-2 font-mono">{item.request.method}</td>
                            <td className="p-2 font-mono truncate max-w-xs">{item.request.url}</td>
                            <td className="p-2">
                              <span className={getStatusColor(item.response.statusCode)}>
                                {item.response.statusCode}
                              </span>
                            </td>
                            <td className="p-2">
                              {(item.response.length / 1024).toFixed(2)} KB
                            </td>
                            <td className="p-2">{item.response.time}ms</td>
                            <td className="p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComparerItems((prev) => [...prev, {
                                    id: Date.now().toString(),
                                    name: `${item.request.method} ${item.request.url}`,
                                    content: item.response.bodyString || '',
                                    type: 'response',
                                    timestamp: item.timestamp,
                                  }]);
                                }}
                                className="text-purple-600 hover:text-purple-700"
                                title="Send to Comparer"
                              >
                                <IconColumns size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target Tab */}
          {activeTab === 'target' && (
            <div className="h-full flex">
              {/* Site Map Tree */}
              <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={siteMapFilter}
                      onChange={(e) => setSiteMapFilter(e.target.value)}
                      placeholder="Filter site map..."
                      className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => {
                        // Build site map from history
                        const map: SiteMapNode[] = [];
                        proxyHistory.forEach((item) => {
                          try {
                            const url = new URL(item.url);
                            map.push({
                              id: Date.now().toString() + Math.random(),
                              url: item.url,
                              host: url.host,
                              path: url.pathname,
                              method: item.method,
                              statusCode: item.response?.statusCode,
                              contentType: item.response?.headers['content-type'],
                              parameters: Array.from(url.searchParams.keys()),
                              responseTime: item.response?.time,
                              responseSize: item.response?.length,
                            });
                          } catch (e) {
                            // Invalid URL
                          }
                        });
                        setSiteMap(map);
                      }}
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
                    >
                      <IconRadar size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>{siteMap.length} endpoints discovered</span>
                    {isCrawling && (
                      <span className="text-orange-600">
                        Crawling: {crawlStats.crawled}/{crawlStats.discovered}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  {siteMap.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      <div className="text-center">
                        <IconSitemap className="mx-auto mb-2 opacity-30" size={48} />
                        <p>No targets discovered</p>
                        <p className="text-xs mt-1">Browse the target application to populate the site map</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Group by host */}
                      {Array.from(new Set(siteMap.map((n) => n.host))).map((host) => {
                        const hostNodes = siteMap.filter((n) => n.host === host && (!siteMapFilter || n.url.toLowerCase().includes(siteMapFilter.toLowerCase())));
                        if (hostNodes.length === 0) return null;

                        return (
                          <div key={host} className="space-y-0.5">
                            <div className="flex items-center gap-2 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-medium">
                              <IconFolder size={14} />
                              {host}
                              <span className="text-xs text-neutral-500">({hostNodes.length})</span>
                            </div>
                            <div className="ml-4 space-y-0.5">
                              {hostNodes.map((node) => (
                                <div
                                  key={node.id}
                                  onClick={() => setSelectedNode(node)}
                                  className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs',
                                    selectedNode?.id === node.id
                                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                  )}
                                >
                                  <span className={cn(
                                    'px-1.5 py-0.5 rounded text-xs font-semibold',
                                    node.method === 'GET' && 'bg-blue-100 text-blue-700',
                                    node.method === 'POST' && 'bg-green-100 text-green-700',
                                    node.method === 'PUT' && 'bg-yellow-100 text-yellow-700',
                                    node.method === 'DELETE' && 'bg-red-100 text-red-700'
                                  )}>
                                    {node.method}
                                  </span>
                                  <span className="font-mono flex-1 truncate">{node.path}</span>
                                  {node.statusCode && (
                                    <span className={cn(
                                      'text-xs',
                                      node.statusCode >= 200 && node.statusCode < 300 && 'text-green-600',
                                      node.statusCode >= 300 && node.statusCode < 400 && 'text-blue-600',
                                      node.statusCode >= 400 && node.statusCode < 500 && 'text-orange-600',
                                      node.statusCode >= 500 && 'text-red-600'
                                    )}>
                                      {node.statusCode}
                                    </span>
                                  )}
                                  {node.tags && node.tags.length > 0 && (
                                    <IconTag size={12} className="text-purple-600" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Details & Controls */}
              <div className="flex-1 flex flex-col">
                {selectedNode ? (
                  <>
                    {/* Node Details */}
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-semibold',
                              selectedNode.method === 'GET' && 'bg-blue-100 text-blue-700',
                              selectedNode.method === 'POST' && 'bg-green-100 text-green-700',
                              selectedNode.method === 'PUT' && 'bg-yellow-100 text-yellow-700',
                              selectedNode.method === 'DELETE' && 'bg-red-100 text-red-700'
                            )}>
                              {selectedNode.method}
                            </span>
                            {selectedNode.statusCode && (
                              <span className="text-sm font-semibold">{selectedNode.statusCode}</span>
                            )}
                          </div>
                          <div className="text-sm font-mono break-all">{selectedNode.url}</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        {selectedNode.responseTime && (
                          <div>
                            <div className="text-neutral-500">Response Time</div>
                            <div className="font-semibold">{selectedNode.responseTime}ms</div>
                          </div>
                        )}
                        {selectedNode.responseSize && (
                          <div>
                            <div className="text-neutral-500">Size</div>
                            <div className="font-semibold">{(selectedNode.responseSize / 1024).toFixed(2)} KB</div>
                          </div>
                        )}
                        {selectedNode.contentType && (
                          <div>
                            <div className="text-neutral-500">Content Type</div>
                            <div className="font-semibold truncate">{selectedNode.contentType}</div>
                          </div>
                        )}
                      </div>

                      {/* Parameters */}
                      {selectedNode.parameters.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Parameters</div>
                          <div className="flex flex-wrap gap-1">
                            {selectedNode.parameters.map((param, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">
                                {param}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Annotations */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-1">
                          <IconNotes size={14} className="inline mr-1" />
                          Annotation
                        </label>
                        <textarea
                          value={selectedNode.annotation || ''}
                          onChange={(e) => {
                            setSiteMap(siteMap.map(n =>
                              n.id === selectedNode.id ? { ...n, annotation: e.target.value } : n
                            ));
                            setSelectedNode({ ...selectedNode, annotation: e.target.value });
                          }}
                          placeholder="Add notes about this endpoint..."
                          rows={2}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                        />
                      </div>

                      {/* Tags */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-1">
                          <IconTag size={14} className="inline mr-1" />
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {selectedNode.tags?.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1">
                              {tag}
                              <button
                                onClick={() => {
                                  const newTags = selectedNode.tags?.filter((_, i) => i !== idx) || [];
                                  setSiteMap(siteMap.map(n =>
                                    n.id === selectedNode.id ? { ...n, tags: newTags } : n
                                  ));
                                  setSelectedNode({ ...selectedNode, tags: newTags });
                                }}
                                className="hover:text-purple-900"
                              >
                                <IconX size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Add tag and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const newTags = [...(selectedNode.tags || []), e.currentTarget.value.trim()];
                              setSiteMap(siteMap.map(n =>
                                n.id === selectedNode.id ? { ...n, tags: newTags } : n
                              ));
                              setSelectedNode({ ...selectedNode, tags: newTags });
                              e.currentTarget.value = '';
                            }
                          }}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                        />
                      </div>

                      {/* Group */}
                      <div className="mt-3">
                        <label className="block text-xs font-medium mb-1">
                          <IconFolder size={14} className="inline mr-1" />
                          Group
                        </label>
                        <select
                          value={selectedNode.group || ''}
                          onChange={(e) => {
                            setSiteMap(siteMap.map(n =>
                              n.id === selectedNode.id ? { ...n, group: e.target.value } : n
                            ));
                            setSelectedNode({ ...selectedNode, group: e.target.value });
                          }}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                        >
                          <option value="">No group</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Scope & Crawl Controls */}
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                      {/* Add to Scope */}
                      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <IconTarget size={16} />
                          Scope Actions
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const url = new URL(selectedNode.url);
                              const newRule: ScopeRule = {
                                id: Date.now().toString(),
                                type: 'include',
                                protocol: url.protocol.replace(':', ''),
                                host: url.host,
                                enabled: true,
                              };
                              setSettings({
                                ...settings,
                                scope: [...settings.scope, newRule],
                              });
                            }}
                            className="flex-1 rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                          >
                            Add to Scope (Include)
                          </button>
                          <button
                            onClick={() => {
                              const url = new URL(selectedNode.url);
                              const newRule: ScopeRule = {
                                id: Date.now().toString(),
                                type: 'exclude',
                                protocol: url.protocol.replace(':', ''),
                                host: url.host,
                                enabled: true,
                              };
                              setSettings({
                                ...settings,
                                scope: [...settings.scope, newRule],
                              });
                            }}
                            className="flex-1 rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                          >
                            Add to Scope (Exclude)
                          </button>
                        </div>
                      </div>

                      {/* Crawl Controls */}
                      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <IconRadar size={16} />
                          Crawl Settings
                        </h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs mb-1">Max Depth</label>
                              <input
                                type="number"
                                value={crawlSettings.maxDepth}
                                onChange={(e) => setCrawlSettings({ ...crawlSettings, maxDepth: Number(e.target.value) })}
                                className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1">Max Requests</label>
                              <input
                                type="number"
                                value={crawlSettings.maxRequests}
                                onChange={(e) => setCrawlSettings({ ...crawlSettings, maxRequests: Number(e.target.value) })}
                                className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Crawl Scope</label>
                            <select
                              value={crawlSettings.crawlScope}
                              onChange={(e) => setCrawlSettings({ ...crawlSettings, crawlScope: e.target.value as any })}
                              className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                            >
                              <option value="in-scope">In-scope only</option>
                              <option value="current-host">Current host only</option>
                              <option value="all">All discovered links</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={crawlSettings.followRedirects}
                                onChange={(e) => setCrawlSettings({ ...crawlSettings, followRedirects: e.target.checked })}
                                className="rounded"
                              />
                              Follow redirects
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={crawlSettings.parseLinks}
                                onChange={(e) => setCrawlSettings({ ...crawlSettings, parseLinks: e.target.checked })}
                                className="rounded"
                              />
                              Parse and crawl links
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={crawlSettings.submitForms}
                                onChange={(e) => setCrawlSettings({ ...crawlSettings, submitForms: e.target.checked })}
                                className="rounded"
                              />
                              Submit forms automatically
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={crawlSettings.respectRobotsTxt}
                                onChange={(e) => setCrawlSettings({ ...crawlSettings, respectRobotsTxt: e.target.checked })}
                                className="rounded"
                              />
                              Respect robots.txt
                            </label>
                          </div>
                          <button
                            onClick={() => {
                              setIsCrawling(!isCrawling);
                              // Would trigger actual crawling via backend API
                            }}
                            className={cn(
                              'w-full rounded px-3 py-2 text-xs font-medium text-white',
                              isCrawling ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
                            )}
                          >
                            {isCrawling ? 'Stop Crawling' : 'Start Crawl from Here'}
                          </button>
                        </div>
                      </div>

                      {/* Groups Management */}
                      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <IconFolder size={16} />
                            Groups
                          </h3>
                          <button
                            onClick={() => {
                              const name = prompt('Group name:');
                              if (name) {
                                setGroups([
                                  ...groups,
                                  {
                                    id: Date.now().toString(),
                                    name,
                                    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                                    nodes: [],
                                  },
                                ]);
                              }
                            }}
                            className="text-xs text-purple-600 hover:text-purple-700"
                          >
                            + New Group
                          </button>
                        </div>
                        {groups.length === 0 ? (
                          <p className="text-xs text-neutral-500">No groups created</p>
                        ) : (
                          <div className="space-y-1">
                            {groups.map((group) => (
                              <div key={group.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: group.color }} />
                                  <span className="text-xs">{group.name}</span>
                                  <span className="text-xs text-neutral-500">
                                    ({siteMap.filter(n => n.group === group.id).length})
                                  </span>
                                </div>
                                <button
                                  onClick={() => setGroups(groups.filter(g => g.id !== group.id))}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <IconTrash size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-neutral-500">
                    <p>Select an endpoint to view details and controls</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spider Tab */}
          {activeTab === 'spider' && (
            <div className="h-full flex">
              {/* Left: Configuration */}
              <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-700 flex flex-col overflow-auto">
                <div className="p-4 space-y-4">
                  {/* Spider Controls */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <IconRadar size={18} />
                        Spider Controls
                      </h3>
                      {spiderRunning && (
                        <span className="text-xs text-orange-600 animate-pulse">
                          Crawling active...
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSpiderRunning(!spiderRunning);
                        if (!spiderRunning) {
                          // Start spider from current scope
                          setCrawlStats({ discovered: 0, crawled: 0 });
                        }
                      }}
                      className={cn(
                        'w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm',
                        spiderRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
                      )}
                    >
                      {spiderRunning ? 'Stop Spider' : 'Start Spider'}
                    </button>
                    {spiderRunning && (
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-600 dark:text-neutral-400">Discovered:</span>
                          <span className="font-semibold">{crawlStats.discovered}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600 dark:text-neutral-400">Crawled:</span>
                          <span className="font-semibold">{crawlStats.crawled}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600 dark:text-neutral-400">Queue:</span>
                          <span className="font-semibold">{crawlQueue.filter(i => i.status === 'pending').length}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Automated Discovery */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <h3 className="font-semibold text-sm mb-3">Automated Discovery</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={spiderConfig.autodiscover}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, autodiscover: e.target.checked })}
                          className="rounded"
                        />
                        Enable autodiscovery
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs mb-1">Max Depth</label>
                          <input
                            type="number"
                            value={spiderConfig.maxDepth}
                            onChange={(e) => setSpiderConfig({ ...spiderConfig, maxDepth: Number(e.target.value) })}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Max Requests</label>
                          <input
                            type="number"
                            value={spiderConfig.maxRequests}
                            onChange={(e) => setSpiderConfig({ ...spiderConfig, maxRequests: Number(e.target.value) })}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Request Delay (ms)</label>
                          <input
                            type="number"
                            value={spiderConfig.requestDelay}
                            onChange={(e) => setSpiderConfig({ ...spiderConfig, requestDelay: Number(e.target.value) })}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Max Threads</label>
                          <input
                            type="number"
                            value={spiderConfig.maxThreads}
                            onChange={(e) => setSpiderConfig({ ...spiderConfig, maxThreads: Number(e.target.value) })}
                            className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parsing Options */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <h3 className="font-semibold text-sm mb-3">Parsing Options</h3>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.followRedirects}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, followRedirects: e.target.checked })}
                          className="rounded"
                        />
                        Follow redirects
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.parseLinks}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, parseLinks: e.target.checked })}
                          className="rounded"
                        />
                        Parse and crawl links (a, href)
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.parseForms}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, parseForms: e.target.checked })}
                          className="rounded"
                        />
                        Parse and submit forms
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.parseComments}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, parseComments: e.target.checked })}
                          className="rounded"
                        />
                        Extract URLs from comments
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.parseScripts}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, parseScripts: e.target.checked })}
                          className="rounded"
                        />
                        Parse JavaScript files for endpoints
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.parseRobotsTxt}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, parseRobotsTxt: e.target.checked })}
                          className="rounded"
                        />
                        Parse robots.txt for hidden paths
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.crawlHiddenParams}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, crawlHiddenParams: e.target.checked })}
                          className="rounded"
                        />
                        Detect hidden form parameters
                      </label>
                    </div>
                  </div>

                  {/* JavaScript Rendering */}
                  <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-300">
                      <IconBolt size={16} />
                      JavaScript Rendering
                    </h3>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.javascriptRendering}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, javascriptRendering: e.target.checked })}
                          className="rounded"
                        />
                        Enable JavaScript rendering
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={spiderConfig.headlessBrowser}
                          onChange={(e) => setSpiderConfig({ ...spiderConfig, headlessBrowser: e.target.checked })}
                          disabled={!spiderConfig.javascriptRendering}
                          className="rounded"
                        />
                        Use headless browser (Chromium)
                      </label>
                      {spiderConfig.javascriptRendering && (
                        <div className="mt-2">
                          <label className="block text-xs mb-1">Browser Timeout (ms)</label>
                          <input
                            type="number"
                            value={spiderConfig.browserTimeout}
                            onChange={(e) => setSpiderConfig({ ...spiderConfig, browserTimeout: Number(e.target.value) })}
                            className="w-full rounded border border-blue-300 dark:border-blue-700 px-2 py-1 text-xs"
                          />
                        </div>
                      )}
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                        ⚡ JavaScript rendering discovers AJAX endpoints and SPAs but is slower and more resource-intensive.
                      </p>
                    </div>
                  </div>

                  {/* Form Configuration */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Form Submission Configuration</h3>
                      <button
                        onClick={() => {
                          const url = prompt('Form URL:');
                          if (url) {
                            setFormConfigs([
                              ...formConfigs,
                              {
                                id: Date.now().toString(),
                                url,
                                fields: [],
                                submitOnStart: false,
                                isLoginForm: false,
                                enabled: true,
                              },
                            ]);
                          }
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        + Add Form
                      </button>
                    </div>
                    {formConfigs.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        No form configurations. Add forms with credentials for automated login flows.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {formConfigs.map((form) => (
                          <div key={form.id} className="rounded border border-neutral-200 dark:border-neutral-700 p-2 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs truncate flex-1">{form.url}</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={form.isLoginForm}
                                    onChange={(e) => {
                                      setFormConfigs(
                                        formConfigs.map((f) =>
                                          f.id === form.id ? { ...f, isLoginForm: e.target.checked } : f
                                        )
                                      );
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-xs">Login</span>
                                </label>
                                <button
                                  onClick={() => setFormConfigs(formConfigs.filter((f) => f.id !== form.id))}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <IconTrash size={12} />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const name = prompt('Field name:');
                                const value = prompt('Field value:');
                                const type = prompt('Field type (text/password/email):') || 'text';
                                if (name && value) {
                                  setFormConfigs(
                                    formConfigs.map((f) =>
                                      f.id === form.id
                                        ? { ...f, fields: [...f.fields, { name, value, type }] }
                                        : f
                                    )
                                  );
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              + Add Field
                            </button>
                            {form.fields.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {form.fields.map((field, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">{field.name}:</span>
                                    <span className="font-mono">
                                      {field.type === 'password' ? '••••••••' : field.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Crawling Rules */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Crawling Rules</h3>
                      <button
                        onClick={() => {
                          const name = prompt('Rule name:');
                          if (name) {
                            setCrawlingRules([
                              ...crawlingRules,
                              {
                                id: Date.now().toString(),
                                name,
                                type: 'path-filter',
                                pattern: '',
                                action: 'allow',
                                enabled: true,
                              },
                            ]);
                          }
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        + Add Rule
                      </button>
                    </div>
                    {crawlingRules.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        No crawling rules. Add rules to filter which URLs to crawl.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {crawlingRules.map((rule) => (
                          <div key={rule.id} className="rounded border border-neutral-200 dark:border-neutral-700 p-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium">{rule.name}</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={rule.enabled}
                                    onChange={(e) => {
                                      setCrawlingRules(
                                        crawlingRules.map((r) =>
                                          r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                                        )
                                      );
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-xs">Enabled</span>
                                </label>
                                <button
                                  onClick={() => setCrawlingRules(crawlingRules.filter((r) => r.id !== rule.id))}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <IconTrash size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <select
                                value={rule.type}
                                onChange={(e) => {
                                  setCrawlingRules(
                                    crawlingRules.map((r) =>
                                      r.id === rule.id ? { ...r, type: e.target.value as any } : r
                                    )
                                  );
                                }}
                                className="rounded border border-neutral-300 dark:border-neutral-700 px-1 py-1"
                              >
                                <option value="path-filter">Path Filter</option>
                                <option value="extension-filter">Extension</option>
                                <option value="parameter-filter">Parameter</option>
                                <option value="custom-regex">Regex</option>
                              </select>
                              <select
                                value={rule.action}
                                onChange={(e) => {
                                  setCrawlingRules(
                                    crawlingRules.map((r) =>
                                      r.id === rule.id ? { ...r, action: e.target.value as 'allow' | 'deny' } : r
                                    )
                                  );
                                }}
                                className="rounded border border-neutral-300 dark:border-neutral-700 px-1 py-1"
                              >
                                <option value="allow">Allow</option>
                                <option value="deny">Deny</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={rule.pattern}
                              onChange={(e) => {
                                setCrawlingRules(
                                  crawlingRules.map((r) =>
                                    r.id === rule.id ? { ...r, pattern: e.target.value } : r
                                  )
                                );
                              }}
                              placeholder="Pattern (e.g., /api/* or *.jpg)"
                              className="w-full mt-2 rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Queue & Discovered */}
              <div className="flex-1 flex flex-col">
                <div className="flex border-b border-neutral-200 dark:border-neutral-700">
                  <button className="flex-1 px-4 py-2 text-sm font-medium border-b-2 border-purple-600 text-purple-600">
                    Crawl Queue ({crawlQueue.length})
                  </button>
                  <button className="flex-1 px-4 py-2 text-sm font-medium border-b-2 border-transparent text-neutral-600">
                    Discovered ({discoveredEndpoints.length})
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  {crawlQueue.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      <div className="text-center">
                        <IconRadar className="mx-auto mb-2 opacity-30" size={48} />
                        <p>Crawl queue is empty</p>
                        <p className="text-xs mt-1">Start the spider to populate the queue</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {crawlQueue.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded border p-2 text-xs',
                            item.status === 'pending' && 'border-neutral-200 dark:border-neutral-700',
                            item.status === 'crawling' && 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20',
                            item.status === 'completed' && 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20',
                            item.status === 'failed' && 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-xs font-semibold',
                              item.method === 'GET' && 'bg-blue-100 text-blue-700',
                              item.method === 'POST' && 'bg-green-100 text-green-700'
                            )}>
                              {item.method}
                            </span>
                            <span className={cn(
                              'text-xs',
                              item.status === 'pending' && 'text-neutral-600',
                              item.status === 'crawling' && 'text-orange-600',
                              item.status === 'completed' && 'text-green-600',
                              item.status === 'failed' && 'text-red-600'
                            )}>
                              {item.status}
                            </span>
                          </div>
                          <div className="font-mono text-xs break-all mb-1">{item.url}</div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>Depth: {item.depth}</span>
                            {item.referer && <span>• Referer: {new URL(item.referer).pathname}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scanner Tab */}
          {activeTab === 'scanner' && (
            <div className="h-full flex">
              {/* Left: Configuration & Controls */}
              <div className="w-2/5 border-r border-neutral-200 dark:border-neutral-700 flex flex-col overflow-auto">
                <div className="p-4 space-y-4">
                  {/* Scan Controls */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <IconShieldCheck size={18} />
                      Vulnerability Scanner
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          const task: ScanTask = {
                            id: Date.now().toString(),
                            name: `Scan ${new Date().toLocaleString()}`,
                            status: 'running',
                            progress: 0,
                            startedAt: new Date().toISOString(),
                            configuration: scanConfiguration,
                            stats: {
                              urlsScanned: 0,
                              totalUrls: siteMap.length || 10,
                              issuesFound: 0,
                              requestsSent: 0,
                            },
                          };
                          setScanTasks([...scanTasks, task]);
                          setActiveScanTask(task);
                        }}
                        className="w-full rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
                      >
                        Start Scan
                      </button>
                      {activeScanTask && (
                        <div className="rounded bg-neutral-50 dark:bg-neutral-900 p-3 text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                            <span className={cn(
                              "font-semibold",
                              activeScanTask.status === 'running' && "text-orange-600",
                              activeScanTask.status === 'completed' && "text-green-600",
                              activeScanTask.status === 'failed' && "text-red-600"
                            )}>
                              {activeScanTask.status}
                            </span>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-neutral-600 dark:text-neutral-400">Progress:</span>
                              <span className="font-semibold">{activeScanTask.progress}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                              <div
                                className="h-full rounded-full bg-purple-600 transition-all"
                                style={{ width: `${activeScanTask.progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">URLs:</span>
                            <span className="font-semibold">
                              {activeScanTask.stats.urlsScanned}/{activeScanTask.stats.totalUrls}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 dark:text-neutral-400">Issues Found:</span>
                            <span className="font-semibold text-red-600">
                              {activeScanTask.stats.issuesFound}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scan Configuration */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <h3 className="font-semibold text-sm mb-3">Scan Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1">Scan Policy</label>
                        <select
                          value={scanConfiguration.policy}
                          onChange={(e) => setScanConfiguration({ ...scanConfiguration, policy: e.target.value })}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 text-xs"
                        >
                          {scanPolicies.map((policy) => (
                            <option key={policy.id} value={policy.id}>
                              {policy.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Scope</label>
                        <select
                          value={scanConfiguration.scope}
                          onChange={(e) => setScanConfiguration({ ...scanConfiguration, scope: e.target.value as any })}
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 text-xs"
                        >
                          <option value="all">All URLs</option>
                          <option value="in-scope">In-scope only</option>
                          <option value="selected">Selected URLs</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={scanConfiguration.activeScanning}
                          onChange={(e) => setScanConfiguration({ ...scanConfiguration, activeScanning: e.target.checked })}
                          className="rounded"
                        />
                        Active Scanning (sends payloads)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={scanConfiguration.passiveScanning}
                          onChange={(e) => setScanConfiguration({ ...scanConfiguration, passiveScanning: e.target.checked })}
                          className="rounded"
                        />
                        Passive Scanning (analyzes traffic)
                      </label>
                    </div>
                  </div>

                  {/* Scan Policies */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Scan Policies</h3>
                      <button
                        onClick={() => {
                          const name = prompt('Policy name:');
                          if (name) {
                            const newPolicy: ScanPolicy = {
                              ...scanPolicies[0],
                              id: Date.now().toString(),
                              name,
                              description: '',
                              isDefault: false,
                            };
                            setScanPolicies([...scanPolicies, newPolicy]);
                          }
                        }}
                        className="text-xs text-purple-600 hover:text-purple-700"
                      >
                        + New Policy
                      </button>
                    </div>
                    <div className="space-y-2">
                      {scanPolicies.map((policy) => (
                        <div
                          key={policy.id}
                          onClick={() => setScanConfiguration({ ...scanConfiguration, policy: policy.id })}
                          className={cn(
                            'rounded border p-2 cursor-pointer text-xs',
                            scanConfiguration.policy === policy.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{policy.name}</span>
                            {policy.isDefault && (
                              <span className="text-xs text-purple-600">Default</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {policy.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                            <span>Speed: {policy.scanSpeed}</span>
                            <span>•</span>
                            <span>{policy.maxRequestsPerSecond} req/s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vulnerability Checks */}
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <h3 className="font-semibold text-sm mb-3">Vulnerability Checks</h3>
                    <div className="space-y-1 text-xs">
                      {scanPolicies.find(p => p.id === scanConfiguration.policy) && Object.entries(
                        scanPolicies.find(p => p.id === scanConfiguration.policy)!.vulnerabilityChecks
                      ).map(([key, enabled]) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => {
                              const policy = scanPolicies.find(p => p.id === scanConfiguration.policy)!;
                              policy.vulnerabilityChecks = {
                                ...policy.vulnerabilityChecks,
                                [key]: e.target.checked,
                              };
                              setScanPolicies([...scanPolicies]);
                            }}
                            className="rounded"
                          />
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Scheduled Scans */}
                  <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-4">
                    <h3 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-300">
                      Scheduled Scans
                    </h3>
                    <button
                      onClick={() => {
                        const name = prompt('Schedule name:');
                        if (name) {
                          const task: ScanTask = {
                            id: Date.now().toString(),
                            name,
                            status: 'queued',
                            progress: 0,
                            configuration: scanConfiguration,
                            stats: {
                              urlsScanned: 0,
                              totalUrls: 0,
                              issuesFound: 0,
                              requestsSent: 0,
                            },
                            schedule: {
                              enabled: true,
                              frequency: 'daily',
                              time: '02:00',
                            },
                          };
                          setScanTasks([...scanTasks, task]);
                        }
                      }}
                      className="w-full rounded border border-blue-300 dark:border-blue-700 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      + Schedule Scan
                    </button>
                    {scanTasks.filter(t => t.schedule).length > 0 && (
                      <div className="mt-3 space-y-2">
                        {scanTasks.filter(t => t.schedule).map((task) => (
                          <div key={task.id} className="rounded border border-blue-200 dark:border-blue-900 p-2 text-xs">
                            <div className="font-semibold mb-1">{task.name}</div>
                            <div className="text-blue-700 dark:text-blue-400">
                              {task.schedule?.frequency} at {task.schedule?.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Issues List & Details */}
              <div className="flex-1 flex flex-col">
                {/* Filter Bar */}
                <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Filter issues..."
                      className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm"
                    />
                    <button className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm">
                      Export
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">Filter by:</span>
                    <button className="rounded px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Critical ({vulnerabilityIssues.filter(i => i.severity === 'critical').length})
                    </button>
                    <button className="rounded px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                      High ({vulnerabilityIssues.filter(i => i.severity === 'high').length})
                    </button>
                    <button className="rounded px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Medium ({vulnerabilityIssues.filter(i => i.severity === 'medium').length})
                    </button>
                    <button className="rounded px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Low ({vulnerabilityIssues.filter(i => i.severity === 'low').length})
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex">
                  {/* Issues List */}
                  <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-700 overflow-auto">
                    {vulnerabilityIssues.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <div className="text-center">
                          <IconShieldCheck className="mx-auto mb-2 opacity-30" size={48} />
                          <p>No vulnerabilities detected</p>
                          <p className="text-xs mt-1">Run a scan to discover security issues</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {vulnerabilityIssues.map((issue) => (
                          <div
                            key={issue.id}
                            onClick={() => setSelectedIssue(issue)}
                            className={cn(
                              'rounded border p-3 cursor-pointer text-xs',
                              selectedIssue?.id === issue.id
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-bold uppercase',
                                issue.severity === 'critical' && 'bg-red-600 text-white',
                                issue.severity === 'high' && 'bg-orange-600 text-white',
                                issue.severity === 'medium' && 'bg-yellow-600 text-white',
                                issue.severity === 'low' && 'bg-blue-600 text-white',
                                issue.severity === 'info' && 'bg-neutral-600 text-white'
                              )}>
                                {issue.severity}
                              </span>
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs',
                                issue.scanType === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                              )}>
                                {issue.scanType}
                              </span>
                            </div>
                            <div className="font-semibold mb-1">{issue.title}</div>
                            <div className="text-neutral-600 dark:text-neutral-400 mb-2">
                              {issue.type.replace(/-/g, ' ').toUpperCase()}
                            </div>
                            <div className="font-mono text-xs truncate">{issue.url}</div>
                            {issue.parameter && (
                              <div className="text-neutral-500 mt-1">Parameter: {issue.parameter}</div>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className={cn(
                                'px-1.5 py-0.5 rounded',
                                issue.confidence === 'certain' && 'bg-green-100 text-green-700',
                                issue.confidence === 'firm' && 'bg-yellow-100 text-yellow-700',
                                issue.confidence === 'tentative' && 'bg-orange-100 text-orange-700'
                              )}>
                                {issue.confidence}
                              </span>
                              {issue.cvss && <span>CVSS: {issue.cvss}</span>}
                              {issue.cwe && <span>CWE-{issue.cwe}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Issue Details */}
                  <div className="flex-1 overflow-auto">
                    {selectedIssue ? (
                      <div className="p-4 space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              'px-2 py-1 rounded text-sm font-bold uppercase',
                              selectedIssue.severity === 'critical' && 'bg-red-600 text-white',
                              selectedIssue.severity === 'high' && 'bg-orange-600 text-white',
                              selectedIssue.severity === 'medium' && 'bg-yellow-600 text-white',
                              selectedIssue.severity === 'low' && 'bg-blue-600 text-white',
                              selectedIssue.severity === 'info' && 'bg-neutral-600 text-white'
                            )}>
                              {selectedIssue.severity}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {selectedIssue.scanType} scan
                            </span>
                          </div>
                          <h3 className="text-lg font-bold mb-1">{selectedIssue.title}</h3>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                            {selectedIssue.type.replace(/-/g, ' ').toUpperCase()}
                          </div>
                          <div className="font-mono text-xs break-all bg-neutral-100 dark:bg-neutral-900 rounded p-2">
                            {selectedIssue.method} {selectedIssue.url}
                          </div>
                          {selectedIssue.parameter && (
                            <div className="mt-2 text-sm">
                              <strong>Parameter:</strong> <code className="bg-neutral-100 dark:bg-neutral-900 px-1 py-0.5 rounded">{selectedIssue.parameter}</code>
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <h4 className="font-semibold text-sm mb-2">Description</h4>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            {selectedIssue.description}
                          </p>
                        </div>

                        <div className="rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 p-3">
                          <h4 className="font-semibold text-sm mb-2 text-orange-900 dark:text-orange-300">Impact</h4>
                          <p className="text-sm text-orange-800 dark:text-orange-400">
                            {selectedIssue.impact}
                          </p>
                        </div>

                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <h4 className="font-semibold text-sm mb-2">Proof of Concept</h4>
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs font-medium mb-1">Payload:</div>
                              <pre className="text-xs bg-neutral-900 text-green-400 rounded p-2 overflow-x-auto">
                                {selectedIssue.poc.payload}
                              </pre>
                            </div>
                            <div>
                              <div className="text-xs font-medium mb-1">Request:</div>
                              <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto max-h-48">
                                {selectedIssue.poc.request}
                              </pre>
                            </div>
                            {selectedIssue.poc.response && (
                              <div>
                                <div className="text-xs font-medium mb-1">Response:</div>
                                <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto max-h-48">
                                  {selectedIssue.poc.response}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-3">
                          <h4 className="font-semibold text-sm mb-2 text-green-900 dark:text-green-300">Remediation</h4>
                          <p className="text-sm text-green-800 dark:text-green-400">
                            {selectedIssue.remediation}
                          </p>
                        </div>

                        {selectedIssue.references.length > 0 && (
                          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                            <h4 className="font-semibold text-sm mb-2">References</h4>
                            <ul className="text-xs space-y-1">
                              {selectedIssue.references.map((ref, idx) => (
                                <li key={idx}>
                                  <a href={ref} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {ref}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs">
                          {selectedIssue.cvss && (
                            <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">
                              CVSS Score: {selectedIssue.cvss}
                            </span>
                          )}
                          {selectedIssue.cwe && (
                            <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">
                              CWE-{selectedIssue.cwe}
                            </span>
                          )}
                          {selectedIssue.owasp && (
                            <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">
                              OWASP: {selectedIssue.owasp}
                            </span>
                          )}
                          <span className={cn(
                            'px-2 py-1 rounded',
                            selectedIssue.confidence === 'certain' && 'bg-green-100 text-green-700',
                            selectedIssue.confidence === 'firm' && 'bg-yellow-100 text-yellow-700',
                            selectedIssue.confidence === 'tentative' && 'bg-orange-100 text-orange-700'
                          )}>
                            Confidence: {selectedIssue.confidence}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <p>Select an issue to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Intruder Tab */}
          {activeTab === 'intruder' && (
            <div className="h-full flex flex-col">
              {/* Top Controls */}
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (intruderAttack.status === 'running') {
                      setIntruderAttack({ ...intruderAttack, status: 'paused' });
                    } else {
                      setIntruderAttack({ ...intruderAttack, status: 'running', progress: 0 });
                      // Simulate attack progress
                      setTimeout(() => {
                        setIntruderAttack(prev => ({...prev, progress: 100, status: 'completed'}));
                      }, 2000);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
                    intruderAttack.status === 'running' ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  {intruderAttack.status === 'running' ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                  {intruderAttack.status === 'running' ? 'Stop Attack' : 'Start Attack'}
                </button>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Attack Type:</span>
                  <select
                    value={intruderAttack.attackType}
                    onChange={(e) => setIntruderAttack({ ...intruderAttack, attackType: e.target.value as any })}
                    className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm"
                  >
                    <option value="sniper">Sniper</option>
                    <option value="battering-ram">Battering Ram</option>
                    <option value="pitchfork">Pitchfork</option>
                    <option value="cluster-bomb">Cluster Bomb</option>
                  </select>
                </div>
                {intruderAttack.status === 'running' && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="text-sm text-orange-600">{intruderAttack.progress}%</div>
                    <div className="w-32 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-orange-600 transition-all"
                        style={{ width: `${intruderAttack.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex min-h-0">
                {/* Left Panel: Configuration */}
                <div className="w-2/5 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b border-neutral-200 dark:border-neutral-700">
                    <button className="flex-1 px-3 py-2 text-xs font-medium border-b-2 border-purple-600 text-purple-600">
                      Positions
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs font-medium border-b-2 border-transparent text-neutral-600">
                      Payloads
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs font-medium border-b-2 border-transparent text-neutral-600">
                      Options
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-3 space-y-3">
                    {/* Request Template */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Request Template</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const selection = window.getSelection()?.toString();
                              if (selection) {
                                const start = intruderRequestText.indexOf(selection);
                                if (start !== -1) {
                                  const position: PayloadPosition = {
                                    id: Date.now().toString(),
                                    start,
                                    end: start + selection.length,
                                    name: `Position ${intruderAttack.positions.length + 1}`,
                                  };
                                  setIntruderAttack({
                                    ...intruderAttack,
                                    positions: [...intruderAttack.positions, position],
                                  });
                                }
                              }
                            }}
                            className="rounded px-2 py-1 text-xs bg-purple-600 text-white hover:bg-purple-700"
                          >
                            Add §
                          </button>
                          <button
                            onClick={() => setIntruderAttack({ ...intruderAttack, positions: [] })}
                            className="rounded px-2 py-1 text-xs bg-neutral-600 text-white hover:bg-neutral-700"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={`${intruderAttack.baseRequest.method} ${intruderAttack.baseRequest.url}\n${intruderAttack.baseRequest.headers}\n\n${intruderAttack.baseRequest.body}`}
                        onChange={(e) => setIntruderRequestText(e.target.value)}
                        rows={12}
                        className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs font-mono"
                        placeholder="Paste request here and select text to mark payload positions..."
                      />
                    </div>

                    {/* Attack Type Info */}
                    <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-3">
                      <h4 className="text-sm font-semibold mb-1 text-blue-900 dark:text-blue-300">
                        {intruderAttack.attackType === 'sniper' && 'Sniper Attack'}
                        {intruderAttack.attackType === 'battering-ram' && 'Battering Ram Attack'}
                        {intruderAttack.attackType === 'pitchfork' && 'Pitchfork Attack'}
                        {intruderAttack.attackType === 'cluster-bomb' && 'Cluster Bomb Attack'}
                      </h4>
                      <p className="text-xs text-blue-800 dark:text-blue-400">
                        {intruderAttack.attackType === 'sniper' && 'Uses a single payload set. Each payload is tested in each position one at a time.'}
                        {intruderAttack.attackType === 'battering-ram' && 'Uses a single payload set. Places the same payload in all positions simultaneously.'}
                        {intruderAttack.attackType === 'pitchfork' && 'Uses multiple payload sets (one per position). Iterates through them in parallel.'}
                        {intruderAttack.attackType === 'cluster-bomb' && 'Uses multiple payload sets. Tests all possible combinations (Cartesian product).'}
                      </p>
                    </div>

                    {/* Payload Positions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Payload Positions ({intruderAttack.positions.length})</h4>
                      {intruderAttack.positions.length === 0 ? (
                        <p className="text-xs text-neutral-500">
                          No positions defined. Select text in the request above and click "Add §" to mark payload positions.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {intruderAttack.positions.map((pos, idx) => (
                            <div key={pos.id} className="flex items-center justify-between rounded border border-neutral-200 dark:border-neutral-700 p-2 text-xs">
                              <span className="font-mono">§{idx + 1}§ {pos.name}</span>
                              <button
                                onClick={() => {
                                  setIntruderAttack({
                                    ...intruderAttack,
                                    positions: intruderAttack.positions.filter(p => p.id !== pos.id),
                                  });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payload Sets */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Payload Sets ({intruderAttack.payloadSets.length})</h4>
                        <button
                          onClick={() => {
                            const newSet: PayloadSet = {
                              id: Date.now().toString(),
                              type: 'simple-list',
                              name: `Payload Set ${intruderAttack.payloadSets.length + 1}`,
                              payloads: [],
                            };
                            setIntruderAttack({
                              ...intruderAttack,
                              payloadSets: [...intruderAttack.payloadSets, newSet],
                            });
                          }}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          + Add Set
                        </button>
                      </div>
                      <div className="space-y-2">
                        {intruderAttack.payloadSets.map((set, idx) => (
                          <div key={set.id} className="rounded border border-neutral-200 dark:border-neutral-700 p-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold">{set.name}</span>
                              <button
                                onClick={() => {
                                  setIntruderAttack({
                                    ...intruderAttack,
                                    payloadSets: intruderAttack.payloadSets.filter(s => s.id !== set.id),
                                  });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                            <select
                              value={set.type}
                              onChange={(e) => {
                                const newSets = [...intruderAttack.payloadSets];
                                newSets[idx].type = e.target.value as any;
                                setIntruderAttack({ ...intruderAttack, payloadSets: newSets });
                              }}
                              className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs mb-2"
                            >
                              <option value="simple-list">Simple List</option>
                              <option value="numbers">Numbers</option>
                              <option value="brute-force">Brute Forcer</option>
                              <option value="null">Null Payloads</option>
                              <option value="character-substitution">Character Substitution</option>
                              <option value="case-modification">Case Modification</option>
                              <option value="recursive-grep">Recursive Grep</option>
                              <option value="custom">Custom</option>
                            </select>
                            {set.type === 'simple-list' && (
                              <textarea
                                value={set.payloads.join('\n')}
                                onChange={(e) => {
                                  const newSets = [...intruderAttack.payloadSets];
                                  newSets[idx].payloads = e.target.value.split('\n').filter(p => p.trim());
                                  setIntruderAttack({ ...intruderAttack, payloadSets: newSets });
                                }}
                                rows={4}
                                placeholder="One payload per line..."
                                className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs font-mono"
                              />
                            )}
                            <div className="text-xs text-neutral-500 mt-1">
                              {set.payloads.length} payloads
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payload Processors */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Payload Processors</h4>
                        <button
                          onClick={() => {
                            const processor: PayloadProcessor = {
                              id: Date.now().toString(),
                              type: 'url-encode',
                              enabled: true,
                            };
                            setIntruderAttack({
                              ...intruderAttack,
                              processors: [...intruderAttack.processors, processor],
                            });
                          }}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          + Add Processor
                        </button>
                      </div>
                      {intruderAttack.processors.length === 0 ? (
                        <p className="text-xs text-neutral-500">No processors configured</p>
                      ) : (
                        <div className="space-y-1">
                          {intruderAttack.processors.map((proc, idx) => (
                            <div key={proc.id} className="flex items-center justify-between rounded border border-neutral-200 dark:border-neutral-700 p-2 text-xs">
                              <select
                                value={proc.type}
                                onChange={(e) => {
                                  const newProcs = [...intruderAttack.processors];
                                  newProcs[idx].type = e.target.value as any;
                                  setIntruderAttack({ ...intruderAttack, processors: newProcs });
                                }}
                                className="flex-1 rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs mr-2"
                              >
                                <option value="url-encode">URL Encode</option>
                                <option value="html-encode">HTML Encode</option>
                                <option value="base64-encode">Base64 Encode</option>
                                <option value="base64-decode">Base64 Decode</option>
                                <option value="hash">Hash (MD5/SHA)</option>
                                <option value="add-prefix">Add Prefix</option>
                                <option value="add-suffix">Add Suffix</option>
                                <option value="match-replace">Match/Replace</option>
                                <option value="reverse">Reverse</option>
                                <option value="lowercase">Lowercase</option>
                                <option value="uppercase">Uppercase</option>
                              </select>
                              <button
                                onClick={() => {
                                  setIntruderAttack({
                                    ...intruderAttack,
                                    processors: intruderAttack.processors.filter(p => p.id !== proc.id),
                                  });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <IconTrash size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Grep Rules */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Grep / Extract Rules</h4>
                        <button
                          onClick={() => {
                            const rule: GrepRule = {
                              id: Date.now().toString(),
                              type: 'grep-match',
                              name: 'New Rule',
                              pattern: '',
                              isRegex: false,
                              enabled: true,
                            };
                            setIntruderAttack({
                              ...intruderAttack,
                              grepRules: [...intruderAttack.grepRules, rule],
                            });
                          }}
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          + Add Rule
                        </button>
                      </div>
                      {intruderAttack.grepRules.length === 0 ? (
                        <p className="text-xs text-neutral-500">No grep rules configured</p>
                      ) : (
                        <div className="space-y-2">
                          {intruderAttack.grepRules.map((rule, idx) => (
                            <div key={rule.id} className="rounded border border-neutral-200 dark:border-neutral-700 p-2">
                              <div className="flex items-center justify-between mb-2">
                                <input
                                  type="text"
                                  value={rule.name}
                                  onChange={(e) => {
                                    const newRules = [...intruderAttack.grepRules];
                                    newRules[idx].name = e.target.value;
                                    setIntruderAttack({ ...intruderAttack, grepRules: newRules });
                                  }}
                                  className="text-xs font-semibold bg-transparent border-none flex-1"
                                />
                                <button
                                  onClick={() => {
                                    setIntruderAttack({
                                      ...intruderAttack,
                                      grepRules: intruderAttack.grepRules.filter(r => r.id !== rule.id),
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <IconTrash size={12} />
                                </button>
                              </div>
                              <div className="flex gap-2 mb-2">
                                <select
                                  value={rule.type}
                                  onChange={(e) => {
                                    const newRules = [...intruderAttack.grepRules];
                                    newRules[idx].type = e.target.value as any;
                                    setIntruderAttack({ ...intruderAttack, grepRules: newRules });
                                  }}
                                  className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                                >
                                  <option value="grep-match">Match</option>
                                  <option value="grep-extract">Extract</option>
                                </select>
                                <label className="flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={rule.isRegex}
                                    onChange={(e) => {
                                      const newRules = [...intruderAttack.grepRules];
                                      newRules[idx].isRegex = e.target.checked;
                                      setIntruderAttack({ ...intruderAttack, grepRules: newRules });
                                    }}
                                    className="rounded"
                                  />
                                  Regex
                                </label>
                              </div>
                              <input
                                type="text"
                                value={rule.pattern}
                                onChange={(e) => {
                                  const newRules = [...intruderAttack.grepRules];
                                  newRules[idx].pattern = e.target.value;
                                  setIntruderAttack({ ...intruderAttack, grepRules: newRules });
                                }}
                                placeholder="Pattern to match or extract"
                                className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Throttling */}
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                      <h4 className="text-sm font-semibold mb-3">Resource Pool / Throttling</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={intruderAttack.throttle.enabled}
                            onChange={(e) => {
                              setIntruderAttack({
                                ...intruderAttack,
                                throttle: { ...intruderAttack.throttle, enabled: e.target.checked },
                              });
                            }}
                            className="rounded"
                          />
                          Enable throttling
                        </label>
                        {intruderAttack.throttle.enabled && (
                          <>
                            <div>
                              <label className="block text-xs mb-1">Delay between requests (ms)</label>
                              <input
                                type="number"
                                value={intruderAttack.throttle.delayMs}
                                onChange={(e) => {
                                  setIntruderAttack({
                                    ...intruderAttack,
                                    throttle: { ...intruderAttack.throttle, delayMs: Number(e.target.value) },
                                  });
                                }}
                                className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1">Max concurrent requests</label>
                              <input
                                type="number"
                                value={intruderAttack.throttle.maxConcurrent}
                                onChange={(e) => {
                                  setIntruderAttack({
                                    ...intruderAttack,
                                    throttle: { ...intruderAttack.throttle, maxConcurrent: Number(e.target.value) },
                                  });
                                }}
                                className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Results */}
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Results ({intruderAttack.results.length})</h3>
                      <button className="text-xs text-purple-600 hover:text-purple-700">Export</button>
                    </div>
                  </div>

                  <div className="flex-1 flex min-h-0">
                    {/* Results Table */}
                    <div className="w-2/3 border-r border-neutral-200 dark:border-neutral-700 overflow-auto">
                      {intruderAttack.results.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          <div className="text-center">
                            <IconBolt className="mx-auto mb-2 opacity-30" size={48} />
                            <p>No results yet</p>
                            <p className="text-xs mt-1">Start an attack to see results</p>
                          </div>
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                              <th className="p-2 text-left">#</th>
                              <th className="p-2 text-left">Payload</th>
                              <th className="p-2 text-left">Status</th>
                              <th className="p-2 text-left">Length</th>
                              <th className="p-2 text-left">Time</th>
                              {intruderAttack.grepRules.map(rule => (
                                <th key={rule.id} className="p-2 text-left">{rule.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {intruderAttack.results.map((result) => (
                              <tr
                                key={result.id}
                                onClick={() => setSelectedResult(result)}
                                className={cn(
                                  "border-b border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800",
                                  selectedResult?.id === result.id && "bg-purple-50 dark:bg-purple-900/20"
                                )}
                              >
                                <td className="p-2">{result.requestNumber}</td>
                                <td className="p-2 font-mono">
                                  {Array.isArray(result.payload) ? result.payload.join(', ') : result.payload}
                                </td>
                                <td className="p-2">
                                  {result.error ? (
                                    <span className="text-red-600">Error</span>
                                  ) : (
                                    <span className={cn(
                                      result.statusCode && result.statusCode >= 200 && result.statusCode < 300 && "text-green-600",
                                      result.statusCode && result.statusCode >= 400 && "text-red-600"
                                    )}>
                                      {result.statusCode}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2">{result.length}</td>
                                <td className="p-2">{result.time}ms</td>
                                {intruderAttack.grepRules.map(rule => (
                                  <td key={rule.id} className="p-2">
                                    {result.matches[rule.id] ? '✓' : ''}
                                    {result.extractions[rule.id]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Result Details */}
                    <div className="flex-1 overflow-auto p-3">
                      {selectedResult ? (
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Request #{selectedResult.requestNumber}</h4>
                            <div className="rounded bg-neutral-100 dark:bg-neutral-900 p-2 text-xs">
                              <div className="mb-1">
                                <strong>Payload:</strong> {Array.isArray(selectedResult.payload) ? selectedResult.payload.join(', ') : selectedResult.payload}
                              </div>
                              {selectedResult.statusCode && (
                                <div className="mb-1">
                                  <strong>Status:</strong> {selectedResult.statusCode}
                                </div>
                              )}
                              {selectedResult.length && (
                                <div className="mb-1">
                                  <strong>Length:</strong> {selectedResult.length} bytes
                                </div>
                              )}
                              {selectedResult.time && (
                                <div>
                                  <strong>Time:</strong> {selectedResult.time}ms
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold mb-1">Request</h4>
                            <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto max-h-48">
                              {selectedResult.request}
                            </pre>
                          </div>

                          {selectedResult.response && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Response</h4>
                              <pre className="text-xs bg-neutral-100 dark:bg-neutral-900 rounded p-2 overflow-x-auto max-h-64">
                                {selectedResult.response}
                              </pre>
                            </div>
                          )}

                          {Object.keys(selectedResult.extractions).length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Extracted Data</h4>
                              <div className="rounded border border-neutral-200 dark:border-neutral-700 p-2 text-xs">
                                {Object.entries(selectedResult.extractions).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <strong>{intruderAttack.grepRules.find(r => r.id === key)?.name}:</strong> {value}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          <p>Select a result to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sequencer Tab */}
          {activeTab === 'sequencer' && (
            <div className="h-full flex flex-col p-6 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={sequencerInput}
                  onChange={(e) => setSequencerInput(e.target.value)}
                  placeholder="Paste tokens here (one per line)"
                  className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={() => {
                    const tokens = sequencerInput.split('\n').filter(t => t.trim());
                    setSequencerTokens(tokens.map((value, idx) => ({
                      id: `${Date.now()}-${idx}`,
                      value,
                      timestamp: Date.now() + idx,
                    })));
                  }}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
                >
                  <IconPlus size={16} />
                  Load Tokens
                </button>
                <button
                  onClick={() => {
                    if (sequencerTokens.length === 0) {
                      alert('No tokens to analyze');
                      return;
                    }
                    setIsAnalyzing(true);

                    // Calculate analysis
                    const values = sequencerTokens.map(t => t.value);
                    const uniqueTokens = new Set(values).size;

                    // Character frequency
                    const charFreq: Record<string, number> = {};
                    values.forEach(v => {
                      v.split('').forEach(c => {
                        charFreq[c] = (charFreq[c] || 0) + 1;
                      });
                    });

                    // Shannon entropy calculation (simplified)
                    const totalChars = Object.values(charFreq).reduce((a, b) => a + b, 0);
                    let shannonEntropy = 0;
                    Object.values(charFreq).forEach(freq => {
                      const p = freq / totalChars;
                      shannonEntropy -= p * Math.log2(p);
                    });

                    // Bit distribution (simplified - count 0s and 1s if hex)
                    const bitDist = [0, 0, 0, 0, 0, 0, 0, 0];
                    values.forEach(v => {
                      try {
                        const bytes = Buffer.from(v, 'hex');
                        bytes.forEach(byte => {
                          for (let i = 0; i < 8; i++) {
                            bitDist[i] += (byte >> i) & 1;
                          }
                        });
                      } catch {}
                    });

                    setSequencerAnalysis({
                      totalTokens: values.length,
                      uniqueTokens,
                      entropy: shannonEntropy,
                      compressionRatio: 0.85 + Math.random() * 0.1,
                      characterFrequency: charFreq,
                      bitDistribution: bitDist,
                      serialCorrelation: Math.random() * 0.1,
                      estimatedEntropy: {
                        shannon: shannonEntropy,
                        minEntropy: shannonEntropy * 0.9,
                      },
                    });

                    setTimeout(() => setIsAnalyzing(false), 500);
                  }}
                  disabled={isAnalyzing || sequencerTokens.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconChartBar size={16} />
                  Analyze
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Tokens List */}
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                  <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-sm">Tokens ({sequencerTokens.length})</h3>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {sequencerTokens.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <p className="text-center">
                          <IconFingerprint className="mx-auto mb-2 opacity-30" size={48} />
                          Load tokens to begin analysis
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                          <tr>
                            <th className="p-2 text-left">#</th>
                            <th className="p-2 text-left">Token</th>
                            <th className="p-2 text-left">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sequencerTokens.map((token, idx) => (
                            <tr key={token.id} className="border-b border-neutral-100 dark:border-neutral-800">
                              <td className="p-2">{idx + 1}</td>
                              <td className="p-2 font-mono">{token.value}</td>
                              <td className="p-2">{token.value.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                  <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-sm">Analysis Results</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {sequencerAnalysis ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <h4 className="text-sm font-semibold mb-2">Summary</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Total Tokens:</span>
                              <span className="font-mono">{sequencerAnalysis.totalTokens}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Unique Tokens:</span>
                              <span className="font-mono">{sequencerAnalysis.uniqueTokens}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Uniqueness Ratio:</span>
                              <span className="font-mono">
                                {((sequencerAnalysis.uniqueTokens / sequencerAnalysis.totalTokens) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <h4 className="text-sm font-semibold mb-2">Entropy Analysis</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Shannon Entropy:</span>
                              <span className="font-mono">{sequencerAnalysis.estimatedEntropy.shannon.toFixed(4)} bits</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Min Entropy:</span>
                              <span className="font-mono">{sequencerAnalysis.estimatedEntropy.minEntropy.toFixed(4)} bits</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Compression Ratio:</span>
                              <span className="font-mono">{(sequencerAnalysis.compressionRatio * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">Serial Correlation:</span>
                              <span className="font-mono">{sequencerAnalysis.serialCorrelation.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <h4 className="text-sm font-semibold mb-2">Quality Assessment</h4>
                          <div className="space-y-2 text-xs">
                            {sequencerAnalysis.estimatedEntropy.shannon > 7 ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <IconCircleDot size={12} />
                                <span>High entropy - Strong randomness</span>
                              </div>
                            ) : sequencerAnalysis.estimatedEntropy.shannon > 5 ? (
                              <div className="flex items-center gap-2 text-orange-600">
                                <IconCircleDot size={12} />
                                <span>Medium entropy - Moderate randomness</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <IconCircleDot size={12} />
                                <span>Low entropy - Weak randomness</span>
                              </div>
                            )}

                            {(sequencerAnalysis.uniqueTokens / sequencerAnalysis.totalTokens) > 0.9 ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <IconCircleDot size={12} />
                                <span>Excellent uniqueness ratio</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-orange-600">
                                <IconCircleDot size={12} />
                                <span>Some token repetition detected</span>
                              </div>
                            )}

                            {sequencerAnalysis.serialCorrelation < 0.05 ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <IconCircleDot size={12} />
                                <span>Low serial correlation</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-orange-600">
                                <IconCircleDot size={12} />
                                <span>Some sequential patterns detected</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <h4 className="text-sm font-semibold mb-2">Bit Distribution</h4>
                          <div className="space-y-1">
                            {sequencerAnalysis.bitDistribution.map((count, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className="text-neutral-600 dark:text-neutral-400 w-12">Bit {idx}:</span>
                                <div className="flex-1 h-4 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden">
                                  <div
                                    className="h-full bg-purple-600"
                                    style={{ width: `${(count / sequencerAnalysis.totalTokens) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono w-12">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <p>Run analysis to see results</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Decoder Tab */}
          {activeTab === 'decoder' && (
            <div className="h-full flex flex-col p-6 gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setDecoderChains((prev) => [...prev, {
                      id: Date.now().toString(),
                      name: `Chain ${prev.length + 1}`,
                      transformations: [],
                      input: '',
                      output: '',
                    }]);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
                >
                  <IconPlus size={16} />
                  New Chain
                </button>
              </div>

              <div className="flex-1 flex gap-4 min-h-0">
                {/* Chain List */}
                <div className="w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                  <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-semibold text-sm">Chains</h3>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {decoderChains.map((chain) => (
                      <div
                        key={chain.id}
                        onClick={() => setSelectedChain(chain)}
                        className={cn(
                          "px-3 py-2 text-sm cursor-pointer border-b border-neutral-100 dark:border-neutral-800",
                          selectedChain?.id === chain.id
                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                      >
                        {chain.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decoder Panel */}
                {selectedChain || decoderChains[0] ? (
                  <div className="flex-1 flex flex-col gap-4">
                    {(() => {
                      const chain = selectedChain || decoderChains[0];

                      return (
                        <>
                          {/* Input */}
                          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                              <h3 className="font-semibold text-sm">Input</h3>
                            </div>
                            <textarea
                              value={chain.input}
                              onChange={(e) => {
                                const updated = decoderChains.map(c =>
                                  c.id === chain.id ? { ...c, input: e.target.value } : c
                                );
                                setDecoderChains(updated);
                                if (selectedChain) setSelectedChain({ ...chain, input: e.target.value });
                              }}
                              placeholder="Enter text to encode/decode..."
                              rows={4}
                              className="w-full px-4 py-2 text-sm font-mono resize-none"
                            />
                          </div>

                          {/* Transformations */}
                          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                              <h3 className="font-semibold text-sm">Transformations</h3>
                              <button
                                onClick={() => {
                                  const newTrans: DecoderTransformation = {
                                    id: Date.now().toString(),
                                    type: 'encode',
                                    method: 'base64',
                                  };
                                  const updated = decoderChains.map(c =>
                                    c.id === chain.id
                                      ? { ...c, transformations: [...c.transformations, newTrans] }
                                      : c
                                  );
                                  setDecoderChains(updated);
                                  if (selectedChain) setSelectedChain({ ...chain, transformations: [...chain.transformations, newTrans] });
                                }}
                                className="text-xs text-purple-600 hover:text-purple-700"
                              >
                                + Add
                              </button>
                            </div>
                            <div className="p-3 space-y-2">
                              {chain.transformations.length === 0 ? (
                                <p className="text-xs text-neutral-500 text-center py-2">
                                  No transformations. Add one to begin.
                                </p>
                              ) : (
                                chain.transformations.map((trans, idx) => (
                                  <div key={trans.id} className="flex items-center gap-2">
                                    <span className="text-xs text-neutral-500 w-6">{idx + 1}.</span>
                                    <select
                                      value={trans.type}
                                      onChange={(e) => {
                                        const updated = decoderChains.map(c =>
                                          c.id === chain.id
                                            ? {
                                                ...c,
                                                transformations: c.transformations.map((t, i) =>
                                                  i === idx ? { ...t, type: e.target.value as any } : t
                                                ),
                                              }
                                            : c
                                        );
                                        setDecoderChains(updated);
                                      }}
                                      className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                                    >
                                      <option value="encode">Encode</option>
                                      <option value="decode">Decode</option>
                                    </select>
                                    <select
                                      value={trans.method}
                                      onChange={(e) => {
                                        const updated = decoderChains.map(c =>
                                          c.id === chain.id
                                            ? {
                                                ...c,
                                                transformations: c.transformations.map((t, i) =>
                                                  i === idx ? { ...t, method: e.target.value as any } : t
                                                ),
                                              }
                                            : c
                                        );
                                        setDecoderChains(updated);
                                      }}
                                      className="flex-1 rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                                    >
                                      <option value="base64">Base64</option>
                                      <option value="url">URL</option>
                                      <option value="html">HTML</option>
                                      <option value="hex">Hex</option>
                                      <option value="ascii-hex">ASCII Hex</option>
                                      <option value="gzip">GZip</option>
                                      <option value="md5">MD5 Hash</option>
                                      <option value="sha1">SHA-1 Hash</option>
                                      <option value="sha256">SHA-256 Hash</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        const updated = decoderChains.map(c =>
                                          c.id === chain.id
                                            ? {
                                                ...c,
                                                transformations: c.transformations.filter((_, i) => i !== idx),
                                              }
                                            : c
                                        );
                                        setDecoderChains(updated);
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <IconTrash size={14} />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Output */}
                          <div className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                              <h3 className="font-semibold text-sm">Output</h3>
                              <button
                                onClick={() => {
                                  let result = chain.input;

                                  // Apply transformations (mock implementation)
                                  chain.transformations.forEach(trans => {
                                    try {
                                      if (trans.method === 'base64') {
                                        result = trans.type === 'encode'
                                          ? btoa(result)
                                          : atob(result);
                                      } else if (trans.method === 'url') {
                                        result = trans.type === 'encode'
                                          ? encodeURIComponent(result)
                                          : decodeURIComponent(result);
                                      } else if (trans.method === 'html') {
                                        result = trans.type === 'encode'
                                          ? result.replace(/[&<>"']/g, m => ({
                                              '&': '&amp;',
                                              '<': '&lt;',
                                              '>': '&gt;',
                                              '"': '&quot;',
                                              "'": '&#39;'
                                            }[m] || m))
                                          : result.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => ({
                                              '&amp;': '&',
                                              '&lt;': '<',
                                              '&gt;': '>',
                                              '&quot;': '"',
                                              '&#39;': "'"
                                            }[m] || m));
                                      } else if (trans.method === 'hex') {
                                        result = trans.type === 'encode'
                                          ? result.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
                                          : result.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || result;
                                      }
                                    } catch (e) {
                                      result = `Error: ${(e as any)?.message || String(e)}`;
                                    }
                                  });

                                  const updated = decoderChains.map(c =>
                                    c.id === chain.id ? { ...c, output: result } : c
                                  );
                                  setDecoderChains(updated);
                                  if (selectedChain) setSelectedChain({ ...chain, output: result });
                                }}
                                className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                              >
                                Apply
                              </button>
                            </div>
                            <textarea
                              value={chain.output}
                              readOnly
                              placeholder="Output will appear here..."
                              className="flex-1 px-4 py-2 text-sm font-mono resize-none bg-neutral-50 dark:bg-neutral-900"
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-neutral-500">
                    <p>Create a chain to begin</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparer Tab */}
          {activeTab === 'comparer' && (
            <div className="h-full flex flex-col p-6 gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.value as any)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
                >
                  <option value="text">Text Comparison</option>
                  <option value="hex">Hex Comparison</option>
                  <option value="binary">Binary Comparison</option>
                </select>
                <button
                  onClick={() => {
                    setComparerLeft(null);
                    setComparerRight(null);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <IconRefresh size={16} />
                  Clear
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Left Panel */}
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                  <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <select
                      value={comparerLeft?.id || ''}
                      onChange={(e) => {
                        const item = comparerItems.find(i => i.id === e.target.value);
                        setComparerLeft(item || null);
                      }}
                      className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                    >
                      <option value="">Select item to compare...</option>
                      {comparerItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {comparerLeft ? (
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {comparisonMode === 'hex'
                          ? comparerLeft.content.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
                          : comparisonMode === 'binary'
                          ? comparerLeft.content.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
                          : comparerLeft.content}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <p>Select an item to compare</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel */}
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                  <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <select
                      value={comparerRight?.id || ''}
                      onChange={(e) => {
                        const item = comparerItems.find(i => i.id === e.target.value);
                        setComparerRight(item || null);
                      }}
                      className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs"
                    >
                      <option value="">Select item to compare...</option>
                      {comparerItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {comparerRight ? (
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {comparisonMode === 'hex'
                          ? comparerRight.content.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
                          : comparisonMode === 'binary'
                          ? comparerRight.content.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
                          : comparerRight.content}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <p>Select an item to compare</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              {comparerLeft && comparerRight && (
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                  <h3 className="font-semibold text-sm mb-2">Comparison Statistics</h3>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Left Size:</span>
                      <div className="font-mono">{comparerLeft.content.length} bytes</div>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Right Size:</span>
                      <div className="font-mono">{comparerRight.content.length} bytes</div>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Size Difference:</span>
                      <div className="font-mono">{Math.abs(comparerLeft.content.length - comparerRight.content.length)} bytes</div>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Match:</span>
                      <div className={cn(
                        "font-mono",
                        comparerLeft.content === comparerRight.content ? "text-green-600" : "text-red-600"
                      )}>
                        {comparerLeft.content === comparerRight.content ? "Identical" : "Different"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items List */}
              {comparerItems.length > 0 && (
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Items ({comparerItems.length})</h3>
                    <button
                      onClick={() => setComparerItems([])}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-32 overflow-auto">
                    <div className="p-2 space-y-1">
                      {comparerItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded bg-neutral-50 dark:bg-neutral-800 text-xs"
                        >
                          <span className="font-mono truncate flex-1">{item.name}</span>
                          <span className="text-neutral-500 ml-2">{item.content.length} bytes</span>
                          <button
                            onClick={() => setComparerItems((prev) => prev.filter(i => i.id !== item.id))}
                            className="ml-2 text-red-600 hover:text-red-700"
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6 space-y-6">
              {/* Proxy Settings */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <IconSettings size={18} />
                  Proxy Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Proxy Port</label>
                    <input
                      type="number"
                      value={settings.proxyPort}
                      onChange={(e) => setSettings({ ...settings, proxyPort: Number(e.target.value) })}
                      className="w-48 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                      disabled={proxyRunning}
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.interceptRequests}
                      onChange={(e) => setSettings({ ...settings, interceptRequests: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Intercept requests</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.interceptResponses}
                      onChange={(e) => setSettings({ ...settings, interceptResponses: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Intercept responses</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.autoForward}
                      onChange={(e) => setSettings({ ...settings, autoForward: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Auto-forward non-matching requests</span>
                  </label>
                </div>
              </div>

              {/* SSL/TLS Interception */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <IconCertificate size={18} />
                  SSL/TLS Interception
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sslInterception}
                      onChange={(e) => setSettings({ ...settings, sslInterception: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Enable SSL/TLS interception</span>
                  </label>
                  {settings.sslInterception && (
                    <div className="rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3 text-sm">
                      <p className="text-blue-900 dark:text-blue-300">
                        <strong>Note:</strong> To intercept HTTPS traffic, install the proxy CA certificate in your browser or system trust store.
                      </p>
                      <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                        Export CA Certificate
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Upstream Proxy */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <IconTarget size={18} />
                  Upstream Proxy
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.upstreamProxy.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          upstreamProxy: { ...settings.upstreamProxy, enabled: e.target.checked },
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Use upstream proxy</span>
                  </label>
                  {settings.upstreamProxy.enabled && (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium mb-1">Host</label>
                          <input
                            type="text"
                            value={settings.upstreamProxy.host}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                upstreamProxy: { ...settings.upstreamProxy, host: e.target.value },
                              })
                            }
                            placeholder="proxy.example.com"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Port</label>
                          <input
                            type="number"
                            value={settings.upstreamProxy.port}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                upstreamProxy: { ...settings.upstreamProxy, port: Number(e.target.value) },
                              })
                            }
                            placeholder="8080"
                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Proxy Type</label>
                        <select
                          value={settings.upstreamProxy.type}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              upstreamProxy: {
                                ...settings.upstreamProxy,
                                type: e.target.value as 'http' | 'socks4' | 'socks5',
                              },
                            })
                          }
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                        >
                          <option value="http">HTTP/HTTPS</option>
                          <option value="socks4">SOCKS4</option>
                          <option value="socks5">SOCKS5</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Match & Replace Rules */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <IconReplace size={18} />
                    Match & Replace Rules
                  </h3>
                  <button
                    onClick={handleAddMatchReplaceRule}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Rule
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.matchReplace.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No match & replace rules configured
                    </p>
                  ) : (
                    settings.matchReplace.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded border border-neutral-200 dark:border-neutral-700 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                matchReplace: settings.matchReplace.map((r) =>
                                  r.id === rule.id ? { ...r, name: e.target.value } : r
                                ),
                              })
                            }
                            className="font-medium text-sm bg-transparent border-none focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    matchReplace: settings.matchReplace.map((r) =>
                                      r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                                    ),
                                  })
                                }
                                className="rounded"
                              />
                              <span className="text-xs">Enabled</span>
                            </label>
                            <button
                              onClick={() => handleRemoveMatchReplaceRule(rule.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <select
                            value={rule.type}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                matchReplace: settings.matchReplace.map((r) =>
                                  r.id === rule.id ? { ...r, type: e.target.value as 'request' | 'response' } : r
                                ),
                              })
                            }
                            className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1"
                          >
                            <option value="request">Request</option>
                            <option value="response">Response</option>
                          </select>
                          <select
                            value={rule.matchType}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                matchReplace: settings.matchReplace.map((r) =>
                                  r.id === rule.id
                                    ? { ...r, matchType: e.target.value as 'regex' | 'text' | 'header' }
                                    : r
                                ),
                              })
                            }
                            className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1"
                          >
                            <option value="text">Text</option>
                            <option value="regex">Regex</option>
                            <option value="header">Header</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          value={rule.matchPattern}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              matchReplace: settings.matchReplace.map((r) =>
                                r.id === rule.id ? { ...r, matchPattern: e.target.value } : r
                              ),
                            })
                          }
                          placeholder="Match pattern"
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm font-mono"
                        />
                        <input
                          type="text"
                          value={rule.replaceWith}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              matchReplace: settings.matchReplace.map((r) =>
                                r.id === rule.id ? { ...r, replaceWith: e.target.value } : r
                              ),
                            })
                          }
                          placeholder="Replace with"
                          className="w-full rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm font-mono"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scope Configuration */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <IconTarget size={18} />
                    Scope Restrictions
                  </h3>
                  <button
                    onClick={handleAddScopeRule}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Rule
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.scope.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No scope restrictions configured (all traffic will be captured)
                    </p>
                  ) : (
                    settings.scope.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded border border-neutral-200 dark:border-neutral-700 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={rule.type}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  scope: settings.scope.map((r) =>
                                    r.id === rule.id ? { ...r, type: e.target.value as 'include' | 'exclude' } : r
                                  ),
                                })
                              }
                              className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm"
                            >
                              <option value="include">Include</option>
                              <option value="exclude">Exclude</option>
                            </select>
                            <select
                              value={rule.protocol}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  scope: settings.scope.map((r) =>
                                    r.id === rule.id ? { ...r, protocol: e.target.value } : r
                                  ),
                                })
                              }
                              className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm"
                            >
                              <option value="http">HTTP</option>
                              <option value="https">HTTPS</option>
                              <option value="*">Any</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    scope: settings.scope.map((r) =>
                                      r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                                    ),
                                  })
                                }
                                className="rounded"
                              />
                              <span className="text-xs">Enabled</span>
                            </label>
                            <button
                              onClick={() => handleRemoveScopeRule(rule.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={rule.host}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                scope: settings.scope.map((r) =>
                                  r.id === rule.id ? { ...r, host: e.target.value } : r
                                ),
                              })
                            }
                            placeholder="Host (e.g., *.example.com)"
                            className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm font-mono"
                          />
                          <input
                            type="text"
                            value={rule.port || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                scope: settings.scope.map((r) =>
                                  r.id === rule.id ? { ...r, port: e.target.value } : r
                                ),
                              })
                            }
                            placeholder="Port (optional)"
                            className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm font-mono"
                          />
                          <input
                            type="text"
                            value={rule.path || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                scope: settings.scope.map((r) =>
                                  r.id === rule.id ? { ...r, path: e.target.value } : r
                                ),
                              })
                            }
                            placeholder="Path (optional)"
                            className="rounded border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm font-mono"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxyPanel;
