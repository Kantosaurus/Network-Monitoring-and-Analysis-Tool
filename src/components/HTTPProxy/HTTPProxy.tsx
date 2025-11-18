import React, { useState, useEffect, useRef } from 'react';
import { IconPlayerPlay, IconPlayerStop, IconGlobe, IconArrowLeft, IconArrowRight, IconRefresh, IconHome, IconPlus, IconX, IconAlertCircle } from '@tabler/icons-react';
import { ProxyHistoryItem, InterceptItem } from '@/types';
import { cn } from '@/lib/utils';

// Import all panel components
import { ScannerPanel } from './ScannerPanel';
import { SpiderPanel } from './SpiderPanel';
import { SequencerPanel } from './SequencerPanel';
import { DecoderPanel } from './DecoderPanel';
import { ComparerPanel } from './ComparerPanel';
import { AuthenticatedScanningPanel } from './AuthenticatedScanningPanel';
import { APITestingPanel } from './APITestingPanel';
import { JavaScriptSPAPanel } from './JavaScriptSPAPanel';
import { AdvancedInjectionPanel } from './AdvancedInjectionPanel';
import { WebSocketProtocolPanel } from './WebSocketProtocolPanel';
import { BAppStorePanel } from './BAppStorePanel';
import { APISDKPanel } from './APISDKPanel';
import { ReportingPanel } from './ReportingPanel';
import { ProjectWorkspacePanel } from './ProjectWorkspacePanel';
import { ImportExportToolPanel } from './ImportExportToolPanel';
import { HeadlessAutomationPanel } from './HeadlessAutomationPanel';

interface BrowserTab {
  id: number;
  title: string;
  url: string;
  currentUrl: string;
}

type ProxyTab =
  | 'browser'
  | 'intercept'
  | 'history'
  | 'repeater'
  | 'intruder'
  | 'scanner'
  | 'spider'
  | 'sequencer'
  | 'decoder'
  | 'comparer'
  | 'auth-scan'
  | 'api-testing'
  | 'js-spa'
  | 'advanced-injection'
  | 'websocket'
  | 'bapp-store'
  | 'api-sdk'
  | 'reporting'
  | 'project-workspace'
  | 'import-export'
  | 'headless';

export const HTTPProxy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProxyTab>('browser');
  const [proxyPort, setProxyPort] = useState(8080);
  const [isRunning, setIsRunning] = useState(false);
  const [interceptEnabled, setInterceptEnabled] = useState(false);
  const [history, setHistory] = useState<ProxyHistoryItem[]>([]);
  const [currentIntercept, setCurrentIntercept] = useState<InterceptItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ProxyHistoryItem | null>(null);
  const [showCertWarning, setShowCertWarning] = useState(true);

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
    { key: 'auth-scan', label: 'Auth Scanning' },
    { key: 'api-testing', label: 'API Testing' },
    { key: 'js-spa', label: 'JS/SPA' },
    { key: 'advanced-injection', label: 'Adv. Injection' },
    { key: 'websocket', label: 'WebSocket' },
    { key: 'bapp-store', label: 'BApp Store' },
    { key: 'api-sdk', label: 'API/SDK' },
    { key: 'reporting', label: 'Reporting' },
    { key: 'project-workspace', label: 'Projects' },
    { key: 'import-export', label: 'Import/Export' },
    { key: 'headless', label: 'Headless' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Certificate Warning Banner */}
      {showCertWarning && isRunning && (
        <div className="mx-4 mt-4 rounded-2xl p-5 flex items-start gap-3 border-2 border-green-600 bg-green-50">
          <IconAlertCircle className="flex-shrink-0 text-green-600" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-green-900 uppercase tracking-wide">HTTPS Interception Active</h3>
            <p className="mt-1 text-sm text-green-800">
              A unique CA certificate has been automatically installed for this session. It will be removed when you stop the proxy.
            </p>
            <button
              onClick={() => setShowCertWarning(false)}
              className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 py-4 flex items-center gap-3 flex-wrap">
        <input
          type="number"
          value={proxyPort}
          onChange={(e) => setProxyPort(Number(e.target.value))}
          disabled={isRunning}
          min={1}
          max={65535}
          className="apple-input rounded-xl w-24 px-4 py-2.5 text-sm font-semibold text-black"
        />

        <button
          onClick={handleStartProxy}
          disabled={isRunning}
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
        >
          <IconPlayerPlay size={16} className="inline mr-2" />
          Start Proxy
        </button>

        <button
          onClick={handleStopProxy}
          disabled={!isRunning}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
        >
          <IconPlayerStop size={16} className="inline mr-2" />
          Stop Proxy
        </button>

        <label className="flex items-center gap-2 apple-card rounded-xl px-4 py-2.5 border border-gray-200">
          <input
            type="checkbox"
            checked={interceptEnabled}
            onChange={handleToggleIntercept}
            disabled={!isRunning}
            className="rounded h-4 w-4"
          />
          <span className="text-sm font-semibold text-black">Intercept</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <div className={cn(
            "apple-card rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold border",
            isRunning ? "text-green-700 border-green-600 bg-green-50" : "text-gray-700 border-gray-200"
          )}>
            <div className={cn("h-2 w-2 rounded-full", isRunning ? "bg-green-600 animate-pulse" : "bg-gray-400")} />
            {isRunning ? `Running on :${proxyPort}` : 'Stopped'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-3 text-sm font-semibold rounded-xl transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-black opacity-60 hover:opacity-100 border border-gray-200"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.key === 'intercept' && currentIntercept && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white">1</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 p-4">
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

        {activeTab === 'scanner' && <ScannerPanel />}
        {activeTab === 'spider' && <SpiderPanel />}
        {activeTab === 'sequencer' && <SequencerPanel />}
        {activeTab === 'decoder' && <DecoderPanel />}
        {activeTab === 'comparer' && <ComparerPanel />}
        {activeTab === 'auth-scan' && <AuthenticatedScanningPanel />}
        {activeTab === 'api-testing' && <APITestingPanel />}
        {activeTab === 'js-spa' && <JavaScriptSPAPanel />}
        {activeTab === 'advanced-injection' && <AdvancedInjectionPanel />}
        {activeTab === 'websocket' && <WebSocketProtocolPanel />}
        {activeTab === 'bapp-store' && <BAppStorePanel />}
        {activeTab === 'api-sdk' && <APISDKPanel />}
        {activeTab === 'reporting' && <ReportingPanel />}
        {activeTab === 'project-workspace' && <ProjectWorkspacePanel />}
        {activeTab === 'import-export' && <ImportExportToolPanel />}
        {activeTab === 'headless' && <HeadlessAutomationPanel />}
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
      <div className="h-full apple-card rounded-2xl flex items-center justify-center border border-gray-200">
        <div className="text-center text-gray-600">
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
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
        >
          Forward
        </button>
        <button
          onClick={onDrop}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
        >
          Drop
        </button>
      </div>
      <textarea
        value={modifiedRequest}
        onChange={(e) => setModifiedRequest(e.target.value)}
        className="flex-1 apple-card rounded-2xl p-4 font-mono text-xs text-black resize-none border border-gray-200"
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
      <div className="apple-card rounded-2xl overflow-hidden flex flex-col border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-bold text-black uppercase tracking-wide">Requests ({history.length})</h3>
          <button onClick={onClear} className="text-xs text-red-600 hover:text-red-800 font-semibold">Clear</button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="p-2 text-left text-black font-semibold">#</th>
                <th className="p-2 text-left text-black font-semibold">Method</th>
                <th className="p-2 text-left text-black font-semibold">URL</th>
                <th className="p-2 text-left text-black font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={cn(
                    "cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors",
                    selectedItem?.id === item.id && "bg-blue-100"
                  )}
                >
                  <td className="p-2 text-black">{item.id}</td>
                  <td className="p-2 text-black">{item.method}</td>
                  <td className="p-2 truncate max-w-xs text-black">{item.url}</td>
                  <td className="p-2 text-black">{item.response?.statusCode || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="apple-card rounded-2xl overflow-hidden flex flex-col border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
          <h3 className="text-sm font-bold text-black uppercase tracking-wide">Details</h3>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-4 text-black">
          {selectedItem ? (
            <>
              <div>
                <h4 className="font-bold mb-2 text-black uppercase">Request</h4>
                <pre className="apple-card p-3 rounded-xl whitespace-pre-wrap break-all border border-gray-200">
                  {`${selectedItem.method} ${selectedItem.url}\n${Object.entries(selectedItem.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}`}
                </pre>
              </div>
              {selectedItem.response && (
                <div>
                  <h4 className="font-bold mb-2 text-black uppercase">Response</h4>
                  <pre className="apple-card p-3 rounded-xl whitespace-pre-wrap break-all border border-gray-200">
                    {`${selectedItem.response.statusCode} ${selectedItem.response.statusMessage}\n${Object.entries(selectedItem.response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}`}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600">Select a request to view details</div>
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
          className="self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
        >
          Send
        </button>
        <textarea
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          placeholder="Paste or load a request..."
          className="flex-1 apple-card rounded-2xl p-4 font-mono text-xs text-black resize-none border border-gray-200"
        />
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-black uppercase tracking-wide">Response</h3>
        <pre className="flex-1 apple-card rounded-2xl p-4 font-mono text-xs overflow-auto text-black border border-gray-200">
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
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Start Attack'}
        </button>

        <select value={attackType} onChange={(e) => setAttackType(e.target.value as any)} className="apple-input rounded-xl px-3 py-2 text-sm">
          <option value="sniper">Sniper</option>
          <option value="battering-ram">Battering Ram</option>
          <option value="pitchfork">Pitchfork</option>
          <option value="cluster-bomb">Cluster Bomb</option>
        </select>

        {progress && (
          <div className="ml-auto text-sm text-black opacity-80">
            Progress: {progress.current}/{progress.total}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 h-full min-h-0">
        <div className="flex flex-col">
          <label className="text-xs mb-1 font-semibold text-black">Base Request (mark payload positions using {'{{name}}'})</label>
          <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} className="flex-1 apple-card rounded-2xl p-3 font-mono text-xs resize-none border border-gray-200" />
        </div>

        <div className="flex flex-col">
          <label className="text-xs mb-1 font-semibold text-black">Payloads (one per line)</label>
          <textarea value={payloadsText} onChange={(e) => setPayloadsText(e.target.value)} className="flex-1 apple-card rounded-2xl p-3 font-mono text-xs resize-none border border-gray-200" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <h4 className="text-sm font-bold mb-2 text-black uppercase tracking-wide">Results</h4>
        {!results && <div className="text-xs text-black opacity-60">No results yet</div>}
        {results && results.length === 0 && <div className="text-xs text-black opacity-60">No interesting results returned</div>}
        {results && results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="apple-card rounded-xl border border-gray-200 p-3 text-xs">
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
      <div className="h-full apple-card rounded-2xl flex items-center justify-center border border-gray-200">
        <div className="text-center text-gray-600">
          <IconGlobe className="mx-auto mb-4 h-16 w-16 opacity-30" />
          <p>Start the proxy to use the browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col apple-card rounded-2xl overflow-hidden border border-gray-200">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 pt-2 bg-gray-50 overflow-x-auto">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            onClick={() => handleSwitchTab(index)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-t-xl cursor-pointer min-w-[120px] max-w-[200px] group transition-all",
              index === activeTabIndex
                ? "bg-white border-t border-x border-gray-200"
                : "hover:bg-gray-100"
            )}
          >
            <span className="text-xs truncate flex-1 text-black">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(index, e)}
                className="p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Close tab"
              >
                <IconX size={12} className="text-black" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleNewTab}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          title="New tab"
        >
          <IconPlus size={16} className="text-black" />
        </button>
      </div>

      {/* Browser Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          title="Back"
        >
          <IconArrowLeft size={18} className="text-black" />
        </button>
        <button
          onClick={handleForward}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          title="Forward"
        >
          <IconArrowRight size={18} className="text-black" />
        </button>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          title="Refresh"
        >
          <IconRefresh size={18} className="text-black" />
        </button>
        <button
          onClick={handleHome}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          title="Home"
        >
          <IconHome size={18} className="text-black" />
        </button>

        {/* URL Bar */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 apple-input px-4 py-2 rounded-xl text-sm text-black placeholder:text-gray-500"
            placeholder="Enter URL..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700"
          >
            Go
          </button>
        </form>

        {/* Proxy indicator */}
        <div className="apple-card px-3 py-2 text-blue-700 rounded-xl text-xs font-semibold border border-blue-600 bg-blue-50">
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
