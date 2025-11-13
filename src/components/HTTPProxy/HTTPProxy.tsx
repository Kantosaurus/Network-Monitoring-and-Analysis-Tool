import React, { useState, useEffect, useRef } from 'react';
import { IconPlayerPlay, IconPlayerStop, IconGlobe, IconArrowLeft, IconArrowRight, IconRefresh, IconHome, IconPlus, IconX, IconAlertCircle, IconBolt } from '@tabler/icons-react';
import { ProxyHistoryItem, InterceptItem } from '@/types';
import { cn } from '@/lib/utils';
import anime from 'animejs';

interface BrowserTab {
  id: number;
  title: string;
  url: string;
  currentUrl: string;
}

type ProxyTab = 'browser' | 'intercept' | 'history' | 'repeater' | 'intruder' | 'scanner' | 'spider' | 'sequencer' | 'decoder' | 'comparer';

export const HTTPProxy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProxyTab>('browser');
  const [proxyPort, setProxyPort] = useState(8080);
  const [isRunning, setIsRunning] = useState(false);
  const [interceptEnabled, setInterceptEnabled] = useState(false);
  const [history, setHistory] = useState<ProxyHistoryItem[]>([]);
  const [currentIntercept, setCurrentIntercept] = useState<InterceptItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ProxyHistoryItem | null>(null);
  const [showCertWarning, setShowCertWarning] = useState(true);
  const controlsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

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

  // Animate tabs on change
  useEffect(() => {
    if (tabsRef.current) {
      anime({
        targets: tabsRef.current.children,
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(30),
        easing: 'easeOutQuad',
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!window.api) return;

    window.api.onProxyStarted((port) => {
      setIsRunning(true);
      setProxyPort(port);
    });

    window.api.onProxyStopped(() => {
      setIsRunning(false);
      setInterceptEnabled(false);
    });

    window.api.onProxyError((error) => {
      alert(`Proxy error: ${error}`);
    });

    window.api.onProxyHistoryUpdate((item) => {
      setHistory(prev => [...prev, item]);
    });

    window.api.onProxyHistoryCleared(() => {
      setHistory([]);
      setSelectedHistoryItem(null);
    });

    window.api.onProxyIntercept((item) => {
      setCurrentIntercept(item);
      setActiveTab('intercept');
    });
  }, []);

  const handleStartProxy = async () => {
    if (!window.api) return;
    const result = await window.api.startProxy(proxyPort);
    if (!result.success) {
      alert(`Failed to start proxy: ${result.error}`);
    }
  };

  const handleStopProxy = async () => {
    if (!window.api) return;
    const result = await window.api.stopProxy();
    if (!result.success) {
      alert(`Failed to stop proxy: ${result.error}`);
    }
  };

  const handleToggleIntercept = async () => {
    if (!window.api) return;
    const result = await window.api.toggleIntercept(!interceptEnabled);
    if (result.success && result.enabled !== undefined) {
      setInterceptEnabled(result.enabled);
    }
  };

  const handleForwardIntercept = async (modifiedRequest?: string) => {
    if (!window.api || !currentIntercept) return;
    const requestData = modifiedRequest ? parseRequest(modifiedRequest) : currentIntercept;
    await window.api.forwardIntercept(currentIntercept.id, requestData);
    setCurrentIntercept(null);
  };

  const handleDropIntercept = async () => {
    if (!window.api || !currentIntercept) return;
    await window.api.dropIntercept(currentIntercept.id);
    setCurrentIntercept(null);
  };

  const parseRequest = (text: string) => {
    const lines = text.split('\n');
    const [method, url, version] = lines[0].split(' ');
    const headers: Record<string, string> = {};
    let i = 1;
    while (i < lines.length && lines[i].trim() !== '') {
      const colonIdx = lines[i].indexOf(':');
      if (colonIdx > 0) {
        headers[lines[i].substring(0, colonIdx).trim()] = lines[i].substring(colonIdx + 1).trim();
      }
      i++;
    }
    return {
      method,
      url,
      httpVersion: version?.replace('HTTP/', '') || '1.1',
      headers,
      bodyString: lines.slice(i + 1).join('\n')
    };
  };

  const tabs: { key: ProxyTab; label: string }[] = [
    { key: 'browser', label: 'Browser' },
    { key: 'intercept', label: 'Intercept' },
    { key: 'history', label: 'History' },
    { key: 'repeater', label: 'Repeater' },
    { key: 'intruder', label: 'Intruder' },
    { key: 'scanner', label: 'Scanner' },
    { key: 'spider', label: 'Spider' },
    { key: 'sequencer', label: 'Sequencer' },
    { key: 'decoder', label: 'Decoder' },
    { key: 'comparer', label: 'Comparer' },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Certificate Warning Banner */}
      {showCertWarning && isRunning && (
        <div className="glass-card dark:glass-card-dark rounded-xl p-4 flex items-start gap-3 border border-green-500/30">
          <IconAlertCircle className="flex-shrink-0 text-green-600 dark:text-green-400" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-200">HTTPS Interception Active</h3>
            <p className="mt-1 text-sm text-green-800 dark:text-green-300">
              A unique CA certificate has been automatically installed for this session. It will be removed when you stop the proxy.
            </p>
            <button
              onClick={() => setShowCertWarning(false)}
              className="mt-3 glass-button dark:glass-button-dark rounded-lg px-3 py-1.5 text-sm font-medium text-green-900 dark:text-green-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div ref={controlsRef} className="flex items-center gap-3 flex-wrap">
        <input
          type="number"
          value={proxyPort}
          onChange={(e) => setProxyPort(Number(e.target.value))}
          disabled={isRunning}
          min={1}
          max={65535}
          className="glass-button dark:glass-button-dark rounded-xl w-24 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white"
        />

        <button
          onClick={handleStartProxy}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          <IconPlayerPlay size={16} />
          Start Proxy
        </button>

        <button
          onClick={handleStopProxy}
          disabled={!isRunning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          <IconPlayerStop size={16} />
          Stop Proxy
        </button>

        <label className="flex items-center gap-2 glass-button dark:glass-button-dark rounded-xl px-4 py-2">
          <input
            type="checkbox"
            checked={interceptEnabled}
            onChange={handleToggleIntercept}
            disabled={!isRunning}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Intercept</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <div className={cn(
            "glass-card dark:glass-card-dark rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold",
            isRunning ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-400"
          )}>
            <div className={cn("h-2 w-2 rounded-full", isRunning ? "bg-green-600 animate-pulse" : "bg-gray-400")} />
            {isRunning ? `Running on :${proxyPort}` : 'Stopped'}
          </div>
        </div>
      </div>

      {/* Features (from docs/burpsuite.md) */}
      <div className="glass-card dark:glass-card-dark rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Features</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Key HTTP proxy capabilities (derived from Burp Suite features):</p>
        <ul className="mt-3 text-xs list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">
          <li>Intercepting proxy for HTTP/HTTPS with editable request/response inspectors</li>
          <li>SSL/TLS interception via installed CA certificate</li>
          <li>Request/response filtering, scope restrictions and Match & Replace rules</li>
          <li>Repeater (manual request crafting) and Repeater history</li>
          <li>Intruder-style payload-based fuzzing / attack tool (configurable payloads)</li>
          <li>Spider / crawler integration for automated discovery</li>
          <li>Scanner hooks for passive/active vulnerability checks (where supported)</li>
          <li>Out-of-band Collaborator integration for OAST/SSRF detection</li>
          <li>Full request/response logging, search, export and reporting</li>
          <li>Extensibility via plugins/extensions and automation APIs</li>
          <li>WebSocket interception and binary protocol support</li>
        </ul>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl transition-all relative overflow-hidden",
              activeTab === tab.key
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                : "glass-button dark:glass-button-dark text-gray-700 dark:text-gray-300"
            )}
          >
            {activeTab === tab.key && (
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              {tab.key === 'intercept' && currentIntercept && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">1</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'browser' && (
          <BrowserTab isRunning={isRunning} proxyPort={proxyPort} />
        )}

        {activeTab === 'intercept' && (
          <InterceptTab
            currentIntercept={currentIntercept}
            onForward={handleForwardIntercept}
            onDrop={handleDropIntercept}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            selectedItem={selectedHistoryItem}
            onSelectItem={setSelectedHistoryItem}
            onClear={() => window.api?.clearProxyHistory()}
          />
        )}

        {activeTab === 'repeater' && (
          <RepeaterTab selectedItem={selectedHistoryItem} />
        )}

        {activeTab === 'intruder' && (
          <IntruderTab />
        )}

        {activeTab === 'scanner' && (
          <ScannerTab />
        )}

        {activeTab === 'spider' && (
          <SpiderTab />
        )}

        {activeTab === 'sequencer' && (
          <SequencerTab />
        )}

        {activeTab === 'decoder' && (
          <DecoderTab />
        )}

        {activeTab === 'comparer' && (
          <ComparerTab />
        )}
      </div>
    </div>
  );
};

// Intercept Tab Component
const InterceptTab: React.FC<{
  currentIntercept: InterceptItem | null;
  onForward: (modified?: string) => void;
  onDrop: () => void;
}> = ({ currentIntercept, onForward, onDrop }) => {
  const [modifiedRequest, setModifiedRequest] = useState('');

  useEffect(() => {
    if (currentIntercept) {
      const formatted = formatRequest(currentIntercept);
      setModifiedRequest(formatted);
    }
  }, [currentIntercept]);

  const formatRequest = (item: InterceptItem) => {
    let text = `${item.method} ${item.url} HTTP/${item.httpVersion}\n`;
    for (const [key, value] of Object.entries(item.headers)) {
      text += `${key}: ${value}\n`;
    }
    text += '\n';
    if (item.bodyString) {
      text += item.bodyString;
    }
    return text;
  };

  if (!currentIntercept) {
    return (
      <div className="h-full glass-card dark:glass-card-dark rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <IconGlobe className="mx-auto mb-2 opacity-30" size={48} />
          <p>No intercepted requests</p>
          <p className="text-xs mt-2">Enable intercept to capture HTTP requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => onForward(modifiedRequest)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
        >
          Forward
        </button>
        <button
          onClick={onDrop}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
        >
          Drop
        </button>
      </div>
      <textarea
        value={modifiedRequest}
        onChange={(e) => setModifiedRequest(e.target.value)}
        className="flex-1 glass-card dark:glass-card-dark rounded-xl p-4 font-mono text-xs text-gray-900 dark:text-white resize-none"
      />
    </div>
  );
};

// History Tab Component
const HistoryTab: React.FC<{
  history: ProxyHistoryItem[];
  selectedItem: ProxyHistoryItem | null;
  onSelectItem: (item: ProxyHistoryItem) => void;
  onClear: () => void;
}> = ({ history, selectedItem, onSelectItem, onClear }) => {
  return (
    <div className="h-full grid grid-cols-2 gap-4">
      <div className="glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col">
        <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Requests ({history.length})</h3>
          <button onClick={onClear} className="text-xs text-red-600 hover:text-red-800 font-medium">Clear</button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 glass-card dark:glass-card-dark">
              <tr>
                <th className="p-2 text-left text-gray-900 dark:text-white font-medium">#</th>
                <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Method</th>
                <th className="p-2 text-left text-gray-900 dark:text-white font-medium">URL</th>
                <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={cn(
                    "cursor-pointer border-b border-white/10 dark:border-gray-800 hover:bg-white/20 dark:hover:bg-white/5 transition-colors",
                    selectedItem?.id === item.id && "bg-purple-500/20"
                  )}
                >
                  <td className="p-2 text-gray-900 dark:text-white">{item.id}</td>
                  <td className="p-2 text-gray-900 dark:text-white">{item.method}</td>
                  <td className="p-2 truncate max-w-xs text-gray-900 dark:text-white">{item.url}</td>
                  <td className="p-2 text-gray-900 dark:text-white">{item.response?.statusCode || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card dark:glass-card-dark rounded-xl overflow-hidden flex flex-col">
        <div className="border-b border-white/20 dark:border-gray-700/50 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Details</h3>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-4 text-gray-900 dark:text-white">
          {selectedItem ? (
            <>
              <div>
                <h4 className="font-bold mb-2 text-gray-900 dark:text-white">Request</h4>
                <pre className="glass-button dark:glass-button-dark p-3 rounded-xl whitespace-pre-wrap break-all">
                  {`${selectedItem.method} ${selectedItem.url}\n${Object.entries(selectedItem.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}`}
                </pre>
              </div>
              {selectedItem.response && (
                <div>
                  <h4 className="font-bold mb-2 text-gray-900 dark:text-white">Response</h4>
                  <pre className="glass-button dark:glass-button-dark p-3 rounded-xl whitespace-pre-wrap break-all">
                    {`${selectedItem.response.statusCode} ${selectedItem.response.statusMessage}\n${Object.entries(selectedItem.response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}`}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400">Select a request to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Repeater Tab Component
const RepeaterTab: React.FC<{ selectedItem: ProxyHistoryItem | null }> = ({ selectedItem }) => {
  const [requestText, setRequestText] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    if (selectedItem) {
      const formatted = `${selectedItem.method} ${selectedItem.url} HTTP/${selectedItem.httpVersion}\n${Object.entries(selectedItem.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
      setRequestText(formatted);
    }
  }, [selectedItem]);

  const handleSend = async () => {
    if (!window.api || !requestText) return;
    const result = await window.api.repeatRequest({ raw: requestText });
    if (result.success && result.result?.response) {
      const resp = result.result.response;
      setResponse(`HTTP/1.1 ${resp.statusCode} ${resp.statusMessage}\n${Object.entries(resp.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${resp.bodyString || ''}`);
    }
  };

  return (
    <div className="h-full grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSend}
          className="self-start rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all"
        >
          Send
        </button>
        <textarea
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          placeholder="Paste or load a request..."
          className="flex-1 glass-card dark:glass-card-dark rounded-xl p-4 font-mono text-xs text-gray-900 dark:text-white resize-none"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Response</h3>
        <pre className="flex-1 glass-card dark:glass-card-dark rounded-xl p-4 font-mono text-xs overflow-auto text-gray-900 dark:text-white">
          {response || 'Send a request to see the response'}
        </pre>
      </div>
    </div>
  );
};

// Intruder Tab Component
const IntruderTab: React.FC = () => {
  const [requestText, setRequestText] = useState('');
  const [payloadsText, setPayloadsText] = useState('');
  const [attackType, setAttackType] = useState<'sniper' | 'battering-ram' | 'pitchfork' | 'cluster-bomb'>('sniper');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!window.api) return;
    const handler = (p: { current: number; total: number }) => setProgress(p);
    window.api.onIntruderProgress(handler);
    return () => {
      // No unsubscribe helper exposed; leave as-is (handlers are lightweight)
    };
  }, []);

  const parsePositionsFromMarkers = (text: string) => {
    const positions: Array<{ start: number; end: number; name?: string }> = [];
    let idx = 0;
    while (true) {
      const start = text.indexOf('{{', idx);
      if (start === -1) break;
      const end = text.indexOf('}}', start + 2);
      if (end === -1) break;
      positions.push({ start, end: end + 2, name: text.substring(start + 2, end).trim() || undefined });
      idx = end + 2;
    }
    return positions;
  };

  const handleRun = async () => {
    if (!window.api) return;
    const payloads = payloadsText.split('\n').map(p => p.trim()).filter(Boolean);
    const positions = parsePositionsFromMarkers(requestText);
    if (positions.length === 0) {
      alert('Please mark payload positions in the request using {{payloadName}} markers.');
      return;
    }

    setIsRunning(true);
    setResults(null);
    setProgress({ current: 0, total: payloads.length });

    try {
      const res = await window.api.runIntruder({ raw: requestText }, positions, payloads, attackType);
      if (res.success) {
        setResults(res.results || []);
      } else {
        alert(`Intruder failed: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Intruder error: ${e?.message || e}`);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          <IconBolt size={16} />
          {isRunning ? 'Running...' : 'Start Attack'}
        </button>

        <select value={attackType} onChange={(e) => setAttackType(e.target.value as any)} className="rounded-lg border px-3 py-1 text-sm">
          <option value="sniper">Sniper</option>
          <option value="battering-ram">Battering Ram</option>
          <option value="pitchfork">Pitchfork</option>
          <option value="cluster-bomb">Cluster Bomb</option>
        </select>

        {progress && (
          <div className="ml-auto text-sm text-gray-700 dark:text-gray-300">
            Progress: {progress.current}/{progress.total}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 h-full min-h-0">
        <div className="flex flex-col">
          <label className="text-xs mb-1">Base Request (mark payload positions using {'{{name}}'})</label>
          <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} className="flex-1 glass-card dark:glass-card-dark rounded-xl p-3 font-mono text-xs resize-none" />
        </div>

        <div className="flex flex-col">
          <label className="text-xs mb-1">Payloads (one per line)</label>
          <textarea value={payloadsText} onChange={(e) => setPayloadsText(e.target.value)} className="flex-1 glass-card dark:glass-card-dark rounded-xl p-3 font-mono text-xs resize-none" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <h4 className="text-sm font-semibold mb-2">Results</h4>
        {!results && <div className="text-xs text-gray-500">No results yet</div>}
        {results && results.length === 0 && <div className="text-xs text-gray-500">No interesting results returned</div>}
        {results && results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 text-xs">
                <div className="font-semibold">Result #{i + 1}</div>
                <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(r, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Scanner Tab Component
const ScannerTab: React.FC = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState<'quick' | 'full' | 'web' | 'ssl'>('web');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!window.api) return;
    const handler = (vuln: any) => {
      setResults(prev => prev ? [vuln, ...prev] : [vuln]);
    };
    window.api.onVulnerabilityFound && window.api.onVulnerabilityFound(handler);
    return () => {
      // no unsubscribe available
    };
  }, []);

  const handleRun = async () => {
    if (!window.api || !target) return;
    setIsRunning(true);
    setResults(null);
    try {
      const res = await window.api.vulnerabilityScan(target, scanType);
      if (res.success) {
        setResults(res.vulnerabilities || []);
      } else {
        alert(`Scanner failed: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Scanner error: ${e?.message || e}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="https://example.com" className="flex-1 glass-card dark:glass-card-dark px-3 py-2 rounded-xl" />
        <select value={scanType} onChange={e => setScanType(e.target.value as any)} className="rounded-lg border px-3 py-1 text-sm">
          <option value="quick">Quick</option>
          <option value="full">Full</option>
          <option value="web">Web</option>
          <option value="ssl">SSL</option>
        </select>
        <button onClick={handleRun} disabled={isRunning || !target} className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm text-white">{isRunning ? 'Scanning...' : 'Start Scan'}</button>
      </div>

      <div className="flex-1 overflow-auto">
        <h4 className="text-sm font-semibold mb-2">Findings</h4>
        {!results && <div className="text-xs text-gray-500">No findings yet</div>}
        {results && results.length === 0 && <div className="text-xs text-gray-500">No vulnerabilities found</div>}
        {results && results.length > 0 && (
          <div className="space-y-2">
            {results.map((v, i) => (
              <div key={i} className="rounded-lg border p-3 text-xs">
                <div className="font-semibold">{v.vulnerability || v.id || `Finding ${i+1}`}</div>
                <div className="text-xs text-gray-600 mt-1">Severity: {v.severity}</div>
                <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{v.description || JSON.stringify(v, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Spider Tab Component
const SpiderTab: React.FC = () => {
  const [target, setTarget] = useState('');
  const [depth, setDepth] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [urls, setUrls] = useState<string[] | null>(null);

  const handleRun = async () => {
    if (!window.api || !target) return;
    setIsRunning(true);
    setUrls(null);
    try {
      const res = await window.api.jsCrawlSPA(target, depth);
      if (res.success) {
        setUrls(res.urls || res.endpoints?.map((e: any) => e.url) || []);
      } else {
        alert(`Spider failed: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Spider error: ${e?.message || e}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="https://example.com" className="flex-1 glass-card dark:glass-card-dark px-3 py-2 rounded-xl" />
        <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} min={1} max={10} className="w-20 glass-card dark:glass-card-dark px-2 py-2 rounded-xl" />
        <button onClick={handleRun} disabled={isRunning || !target} className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm text-white">{isRunning ? 'Crawling...' : 'Start Crawl'}</button>
      </div>

      <div className="flex-1 overflow-auto">
        <h4 className="text-sm font-semibold mb-2">Discovered URLs</h4>
        {!urls && <div className="text-xs text-gray-500">No results yet</div>}
        {urls && urls.length === 0 && <div className="text-xs text-gray-500">No URLs discovered</div>}
        {urls && urls.length > 0 && (
          <ul className="list-disc list-inside text-xs space-y-1">
            {urls.map((u, i) => <li key={i} className="truncate">{u}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
};

// Sequencer Tab Component
const SequencerTab: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [tokens, setTokens] = useState<any[] | null>(null);

  const handleRun = async () => {
    if (!window.api) return;
    setIsRunning(true);
    setTokens(null);
    try {
      const res = await window.api.extractSessionTokens();
      if (res.success) {
        setTokens(res.tokens || []);
      } else {
        alert(`Sequencer failed: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Sequencer error: ${e?.message || e}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={handleRun} disabled={isRunning} className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm text-white">{isRunning ? 'Analyzing...' : 'Extract Tokens'}</button>
      </div>

      <div className="flex-1 overflow-auto">
        <h4 className="text-sm font-semibold mb-2">Session Tokens</h4>
        {!tokens && <div className="text-xs text-gray-500">No tokens yet</div>}
        {tokens && tokens.length === 0 && <div className="text-xs text-gray-500">No tokens extracted</div>}
        {tokens && tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map((t, i) => (
              <div key={i} className="rounded-lg border p-3 text-xs">
                <div className="font-semibold">{t.name || `Token ${i+1}`}</div>
                <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(t, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Decoder Tab Component
const DecoderTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode' | 'hex-encode' | 'hex-decode'>('base64-decode');
  const [output, setOutput] = useState('');

  const run = () => {
    try {
      let out = '';
      if (mode === 'base64-decode') {
        out = atob(input);
      } else if (mode === 'base64-encode') {
        out = btoa(input);
      } else if (mode === 'url-decode') {
        out = decodeURIComponent(input);
      } else if (mode === 'url-encode') {
        out = encodeURIComponent(input);
      } else if (mode === 'hex-decode') {
        const hex = input.replace(/[^0-9a-fA-F]/g, '');
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        out = str;
      } else if (mode === 'hex-encode') {
        let h = '';
        for (let i = 0; i < input.length; i++) {
          h += input.charCodeAt(i).toString(16).padStart(2, '0');
        }
        out = h;
      }
      setOutput(out);
    } catch (e: any) {
      setOutput(`Error: ${e?.message || e}`);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <select value={mode} onChange={e => setMode(e.target.value as any)} className="rounded-lg border px-3 py-1 text-sm">
          <option value="base64-decode">Base64 Decode</option>
          <option value="base64-encode">Base64 Encode</option>
          <option value="url-decode">URL Decode</option>
          <option value="url-encode">URL Encode</option>
          <option value="hex-decode">Hex Decode</option>
          <option value="hex-encode">Hex Encode</option>
        </select>
        <button onClick={run} className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm text-white">Run</button>
      </div>

      <div className="grid grid-cols-2 gap-4 h-full min-h-0">
        <textarea value={input} onChange={e => setInput(e.target.value)} className="flex-1 glass-card dark:glass-card-dark rounded-xl p-3 font-mono text-xs resize-none" placeholder="Input" />
        <textarea value={output} readOnly className="flex-1 glass-card dark:glass-card-dark rounded-xl p-3 font-mono text-xs resize-none" placeholder="Output" />
      </div>
    </div>
  );
};

// Comparer Tab Component
const ComparerTab: React.FC = () => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');

  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const max = Math.max(leftLines.length, rightLines.length);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 h-full min-h-0">
        <div className="flex flex-col">
          <label className="text-xs mb-1">Left</label>
          <textarea value={left} onChange={e => setLeft(e.target.value)} className="flex-1 glass-card dark:glass-card-dark rounded-xl p-3 font-mono text-xs resize-none" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1">Right</label>
          <textarea value={right} onChange={e => setRight(e.target.value)} className="flex-1 glass-card dark:glass-card-dark rounded-xl p-3 font-mono text-xs resize-none" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <h4 className="text-sm font-semibold mb-2">Diff</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Array.from({ length: max }).map((_, i) => {
            const l = leftLines[i] ?? '';
            const r = rightLines[i] ?? '';
            const same = l === r;
            return (
              <React.Fragment key={i}>
                <div className={`p-2 rounded ${same ? 'bg-white/5' : 'bg-red-600/10'}`}>{l}</div>
                <div className={`p-2 rounded ${same ? 'bg-white/5' : 'bg-red-600/10'}`}>{r}</div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Browser Tab Component
const BrowserTab: React.FC<{ isRunning: boolean; proxyPort: number }> = ({ isRunning, proxyPort }) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: 1, title: 'New Tab', url: 'https://www.google.com', currentUrl: 'https://www.google.com' }
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [nextTabId, setNextTabId] = useState(2);
  const [url, setUrl] = useState('https://www.google.com');
  const webviewRefs = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (tabs[activeTabIndex]) {
      setUrl(tabs[activeTabIndex].currentUrl);
    }
  }, [activeTabIndex, tabs]);

  const setupWebviewListeners = (webview: any, tabId: number) => {
    const handleDidNavigate = (e: any) => {
      updateTabUrl(tabId, e.url);
      updateTabTitle(tabId, webview.getTitle() || 'New Tab');
    };

    const handleDidNavigateInPage = (e: any) => {
      if (e.isMainFrame) {
        updateTabUrl(tabId, e.url);
      }
    };

    const handlePageTitleUpdated = (e: any) => {
      updateTabTitle(tabId, e.title || 'New Tab');
    };

    const handleDidFailLoad = (e: any) => {
      console.error('Webview load failed:', e.errorDescription, 'for', e.validatedURL);
    };

    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    webview.addEventListener('page-title-updated', handlePageTitleUpdated);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
  };

  const updateTabUrl = (tabId: number, newUrl: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, currentUrl: newUrl } : tab
    ));
  };

  const updateTabTitle = (tabId: number, title: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, title: title.substring(0, 30) } : tab
    ));
  };

  const handleNewTab = () => {
    const newTab: BrowserTab = {
      id: nextTabId,
      title: 'New Tab',
      url: 'https://www.google.com',
      currentUrl: 'https://www.google.com'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabIndex(tabs.length);
    setNextTabId(prev => prev + 1);
  };

  const handleCloseTab = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;

    const tabId = tabs[index].id;
    webviewRefs.current.delete(tabId);

    setTabs(prev => prev.filter((_, i) => i !== index));

    if (activeTabIndex >= index && activeTabIndex > 0) {
      setActiveTabIndex(prev => prev - 1);
    }
  };

  const handleSwitchTab = (index: number) => {
    setActiveTabIndex(index);
  };

  const getActiveWebview = () => {
    const activeTab = tabs[activeTabIndex];
    return activeTab ? webviewRefs.current.get(activeTab.id) : null;
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const webview = getActiveWebview();
    if (!webview) return;

    let navigationUrl = url.trim();

    if (navigationUrl.startsWith('http://') || navigationUrl.startsWith('https://')) {
      webview.loadURL(navigationUrl);
      return;
    }

    const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*(\.[a-zA-Z]{2,})?$/.test(navigationUrl);

    if (isDomain) {
      if (!navigationUrl.includes('.')) {
        navigationUrl = navigationUrl + '.com';
      }
      navigationUrl = 'https://' + navigationUrl;

      const handleLoadError = () => {
        const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(url);
        webview?.loadURL(searchUrl);
        webview?.removeEventListener('did-fail-load', handleLoadError);
      };

      webview.addEventListener('did-fail-load', handleLoadError, { once: true });
      webview.loadURL(navigationUrl);
    } else {
      const searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(navigationUrl);
      webview.loadURL(searchUrl);
    }
  };

  const handleBack = () => {
    const webview = getActiveWebview();
    if (webview?.canGoBack()) {
      webview.goBack();
    }
  };

  const handleForward = () => {
    const webview = getActiveWebview();
    if (webview?.canGoForward()) {
      webview.goForward();
    }
  };

  const handleRefresh = () => {
    const webview = getActiveWebview();
    webview?.reload();
  };

  const handleHome = () => {
    const webview = getActiveWebview();
    const homeUrl = 'https://www.google.com';
    setUrl(homeUrl);
    webview?.loadURL(homeUrl);
  };

  if (!isRunning) {
    return (
      <div className="h-full glass-card dark:glass-card-dark rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <IconGlobe className="mx-auto mb-4 h-16 w-16 opacity-30" />
          <p>Start the proxy to use the browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass-card dark:glass-card-dark rounded-xl overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 pt-2 glass-button dark:glass-button-dark overflow-x-auto">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            onClick={() => handleSwitchTab(index)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-t-xl cursor-pointer min-w-[120px] max-w-[200px] group transition-all",
              index === activeTabIndex
                ? "glass-card dark:glass-card-dark shadow-lg"
                : "hover:bg-white/10 dark:hover:bg-white/5"
            )}
          >
            <span className="text-xs truncate flex-1 text-gray-900 dark:text-white">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(index, e)}
                className="p-0.5 hover:bg-white/20 dark:hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Close tab"
              >
                <IconX size={12} className="text-gray-900 dark:text-white" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleNewTab}
          className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="New tab"
        >
          <IconPlus size={16} className="text-gray-900 dark:text-white" />
        </button>
      </div>

      {/* Browser Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-white/20 dark:border-gray-700/50">
        <button
          onClick={handleBack}
          className="p-2 glass-button dark:glass-button-dark rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
          title="Back"
        >
          <IconArrowLeft size={18} className="text-gray-900 dark:text-white" />
        </button>
        <button
          onClick={handleForward}
          className="p-2 glass-button dark:glass-button-dark rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
          title="Forward"
        >
          <IconArrowRight size={18} className="text-gray-900 dark:text-white" />
        </button>
        <button
          onClick={handleRefresh}
          className="p-2 glass-button dark:glass-button-dark rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <IconRefresh size={18} className="text-gray-900 dark:text-white" />
        </button>
        <button
          onClick={handleHome}
          className="p-2 glass-button dark:glass-button-dark rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
          title="Home"
        >
          <IconHome size={18} className="text-gray-900 dark:text-white" />
        </button>

        {/* URL Bar */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 glass-card dark:glass-card-dark px-4 py-2 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-500"
            placeholder="Enter URL..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Go
          </button>
        </form>

        {/* Proxy indicator */}
        <div className="glass-card dark:glass-card-dark px-3 py-2 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-medium">
          Proxy: {proxyPort}
        </div>
      </div>

      {/* Webview Container */}
      <div className="flex-1 relative">
        {tabs.map((tab, index) => (
          <webview
            key={tab.id}
            ref={(el: any) => {
              if (el && !webviewRefs.current.has(tab.id)) {
                webviewRefs.current.set(tab.id, el);
                setupWebviewListeners(el, tab.id);
              }
            }}
            src={tab.currentUrl}
            className={cn(
              "absolute inset-0 w-full h-full",
              index === activeTabIndex ? "block" : "hidden"
            )}
          />
        ))}
      </div>
    </div>
  );
};
