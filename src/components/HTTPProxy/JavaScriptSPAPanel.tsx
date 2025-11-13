import React, { useState, useEffect } from 'react';
import { IconBrandJavascript, IconEye, IconSearch, IconAlertTriangle, IconKey, IconPlayerPlay, IconCode, IconRefresh, IconX } from '@tabler/icons-react';
import { JavaScriptFile, JSSecret, SPAEndpoint, DOMXSSVector } from '@/types';
import { cn } from '@/lib/utils';

type JSTab = 'files' | 'secrets' | 'dom-xss' | 'endpoints' | 'deobfuscate';

export const JavaScriptSPAPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<JSTab>('files');
  const [jsFiles, setJsFiles] = useState<JavaScriptFile[]>([]);
  const [secrets, setSecrets] = useState<JSSecret[]>([]);
  const [xssVectors, setXssVectors] = useState<DOMXSSVector[]>([]);
  const [spaEndpoints, setSpaEndpoints] = useState<SPAEndpoint[]>([]);
  const [selectedFile, setSelectedFile] = useState<JavaScriptFile | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [headlessBrowserEnabled, setHeadlessBrowserEnabled] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [codeToDeobfuscate, setCodeToDeobfuscate] = useState('');
  const [deobfuscatedCode, setDeobfuscatedCode] = useState('');
  const [crawlDepth, setCrawlDepth] = useState(3);

  useEffect(() => {
    if (window.api) {
      window.api.onJSVulnerabilityFound((vuln) => {
        setJsFiles((prev) =>
          prev.map((file) =>
            file.url === vuln.location.file
              ? { ...file, vulnerabilities: [...file.vulnerabilities, vuln] }
              : file
          )
        );
      });

      window.api.onJSSecretFound((secret) => {
        setSecrets((prev) => {
          const exists = prev.find((s) => s.value === secret.value && s.location.file === secret.location.file);
          if (exists) return prev;
          return [...prev, secret];
        });
      });
    }
  }, []);

  const handleDiscoverEndpoints = async () => {
    if (!window.api || !targetUrl) return;

    setAnalyzing(true);
    const result = await window.api.jsDiscoverEndpoints(targetUrl);
    setAnalyzing(false);

    if (result.success && result.endpoints) {
      setSpaEndpoints(result.endpoints);
      setActiveTab('endpoints');
    } else {
      alert(`Discovery failed: ${result.error}`);
    }
  };

  const handleAnalyzeFile = async (url: string) => {
    if (!window.api) return;

    const result = await window.api.jsAnalyzeFile(url);
    if (result.success && result.analysis) {
      setJsFiles((prev) => {
        const exists = prev.find((f) => f.url === url);
        if (exists) {
          return prev.map((f) => (f.url === url ? result.analysis! : f));
        }
        return [...prev, result.analysis!];
      });
      setSelectedFile(result.analysis);
    } else {
      alert(`Analysis failed: ${result.error}`);
    }
  };

  const handleScanForSecrets = async () => {
    if (!window.api || !targetUrl) return;

    setAnalyzing(true);
    const result = await window.api.jsScanForSecrets(targetUrl);
    setAnalyzing(false);

    if (result.success && result.secrets) {
      setSecrets(result.secrets);
      setActiveTab('secrets');
      alert(`Found ${result.secrets.length} potential secrets`);
    } else {
      alert(`Scan failed: ${result.error}`);
    }
  };

  const handleTestDOMXSS = async () => {
    if (!window.api || !targetUrl) return;

    setAnalyzing(true);
    const result = await window.api.jsTestDOMXSS(targetUrl);
    setAnalyzing(false);

    if (result.success && result.vectors) {
      setXssVectors(result.vectors);
      setActiveTab('dom-xss');
      alert(`Tested ${result.vectors.length} DOM-based XSS vectors`);
    } else {
      alert(`Testing failed: ${result.error}`);
    }
  };

  const handleDeobfuscate = async () => {
    if (!window.api || !codeToDeobfuscate) return;

    const result = await window.api.jsDeobfuscate(codeToDeobfuscate);
    if (result.success && result.deobfuscated) {
      setDeobfuscatedCode(result.deobfuscated);
    } else {
      alert(`Deobfuscation failed: ${result.error}`);
    }
  };

  const handleToggleHeadlessBrowser = async () => {
    if (!window.api) return;

    const newState = !headlessBrowserEnabled;
    const result = await window.api.jsEnableHeadlessBrowser(newState);
    if (result.success) {
      setHeadlessBrowserEnabled(newState);
    }
  };

  const handleCrawlSPA = async () => {
    if (!window.api || !targetUrl) return;

    setCrawling(true);
    const result = await window.api.jsCrawlSPA(targetUrl, crawlDepth);
    setCrawling(false);

    if (result.success) {
      if (result.endpoints) setSpaEndpoints(result.endpoints);
      alert(`Crawled ${result.urls?.length || 0} URLs, discovered ${result.endpoints?.length || 0} endpoints`);
    } else {
      alert(`Crawl failed: ${result.error}`);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">JavaScript & SPA Awareness</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={headlessBrowserEnabled}
              onChange={handleToggleHeadlessBrowser}
              className="h-4 w-4 rounded"
            />
            <span>Headless Browser</span>
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
          <button
            onClick={handleDiscoverEndpoints}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            <IconSearch size={18} />
            {analyzing ? 'Analyzing...' : 'Discover Endpoints'}
          </button>
          <button
            onClick={handleScanForSecrets}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <IconKey size={18} />
            Scan for Secrets
          </button>
          <button
            onClick={handleTestDOMXSS}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
          >
            <IconAlertTriangle size={18} />
            Test DOM XSS
          </button>
        </div>

        {headlessBrowserEnabled && (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              value={crawlDepth}
              onChange={(e) => setCrawlDepth(parseInt(e.target.value))}
              min={1}
              max={10}
              className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
            <button
              onClick={handleCrawlSPA}
              disabled={crawling}
              className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
            >
              <IconRefresh size={18} />
              {crawling ? 'Crawling...' : 'Crawl SPA (Depth)'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'files'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconBrandJavascript size={18} />
            JS Files ({jsFiles.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('secrets')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'secrets'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconKey size={18} />
            Secrets ({secrets.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('dom-xss')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'dom-xss'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconAlertTriangle size={18} />
            DOM XSS ({xssVectors.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'endpoints'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconCode size={18} />
            Endpoints ({spaEndpoints.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('deobfuscate')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'deobfuscate'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconEye size={18} />
            Deobfuscate
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* JS Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-2">
            <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/app.js"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAnalyzeFile((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                    if (input?.value) handleAnalyzeFile(input.value);
                  }}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Analyze File
                </button>
              </div>
            </div>

            {jsFiles.map((file, index) => (
              <div
                key={index}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconBrandJavascript size={18} className="text-yellow-500" />
                      <span className="font-mono text-sm">{file.url}</span>
                      {file.sourceMapped && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Source Mapped
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
                      <span>Vulnerabilities: {file.vulnerabilities.length}</span>
                      <span>Secrets: {file.secrets.length}</span>
                      <span>Endpoints: {file.endpoints.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {jsFiles.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <IconBrandJavascript size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No JavaScript files analyzed yet. Enter a URL and analyze it, or discover endpoints from a target.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Secrets Tab */}
        {activeTab === 'secrets' && (
          <div className="space-y-2">
            {secrets.map((secret, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-4',
                  secret.confidence >= 0.8
                    ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                    : secret.confidence >= 0.5
                    ? 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20'
                    : 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconKey size={18} />
                      <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase dark:bg-gray-800">
                        {secret.type}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence: {(secret.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="font-mono text-sm break-all">{secret.value}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {secret.location.file}:{secret.location.line}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {secrets.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <IconKey size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No secrets found yet. Click "Scan for Secrets" to search for hardcoded credentials and API keys.
                </p>
              </div>
            )}
          </div>
        )}

        {/* DOM XSS Tab */}
        {activeTab === 'dom-xss' && (
          <div className="space-y-2">
            {xssVectors.map((vector, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-4',
                  vector.vulnerable
                    ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                    : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconAlertTriangle size={18} />
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-bold',
                        vector.vulnerable
                          ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                          : 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                      )}>
                        {vector.vulnerable ? 'VULNERABLE' : 'NOT VULNERABLE'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence: {(vector.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="font-semibold">Source:</span> <code className="font-mono text-xs">{vector.source}</code></p>
                      <p><span className="font-semibold">Sink:</span> <code className="font-mono text-xs">{vector.sink}</code></p>
                      <p><span className="font-semibold">Payload:</span> <code className="font-mono text-xs">{vector.payload}</code></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {xssVectors.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <IconAlertTriangle size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No DOM-based XSS tests run yet. Click "Test DOM XSS" to analyze potential client-side XSS vectors.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-2">
            {spaEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm">{endpoint.url}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>Discovered by: {endpoint.discoveredBy}</p>
                      {endpoint.parameters.length > 0 && (
                        <p>Parameters: {endpoint.parameters.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {spaEndpoints.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <IconCode size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No endpoints discovered yet. Use "Discover Endpoints" or "Crawl SPA" to find client-side endpoints.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deobfuscate Tab */}
        {activeTab === 'deobfuscate' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Obfuscated JavaScript Code</label>
              <textarea
                value={codeToDeobfuscate}
                onChange={(e) => setCodeToDeobfuscate(e.target.value)}
                rows={10}
                placeholder="Paste obfuscated JavaScript code here..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <button
              onClick={handleDeobfuscate}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <IconPlayerPlay size={18} />
              Deobfuscate
            </button>

            {deobfuscatedCode && (
              <div>
                <label className="mb-1 block text-sm font-medium">Deobfuscated Code</label>
                <pre className="max-h-96 overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs dark:border-gray-600 dark:bg-gray-900">
                  {deobfuscatedCode}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedFile(null)}>
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">JavaScript File Analysis</h3>
              <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-gray-700">
                <IconX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">URL</h4>
                <p className="font-mono text-sm text-gray-600 dark:text-gray-400">{selectedFile.url}</p>
              </div>

              <div className="flex gap-4 text-sm">
                <div>Size: {(selectedFile.size / 1024).toFixed(2)} KB</div>
                <div>Vulnerabilities: {selectedFile.vulnerabilities.length}</div>
                <div>Secrets: {selectedFile.secrets.length}</div>
                <div>Endpoints: {selectedFile.endpoints.length}</div>
              </div>

              {selectedFile.vulnerabilities.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Vulnerabilities</h4>
                  <div className="space-y-2">
                    {selectedFile.vulnerabilities.map((vuln, index) => (
                      <div key={index} className="rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-bold uppercase text-red-900 dark:bg-red-800 dark:text-red-100">
                            {vuln.severity}
                          </span>
                          <span className="font-semibold">{vuln.type}</span>
                        </div>
                        <p className="text-sm">{vuln.description}</p>
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          Location: {vuln.location.file}:{vuln.location.line}:{vuln.location.column}
                        </div>
                        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-800">{vuln.code}</pre>
                        <p className="mt-2 text-sm"><strong>Remediation:</strong> {vuln.remediation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFile.secrets.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Secrets Found</h4>
                  <div className="space-y-2">
                    {selectedFile.secrets.map((secret, index) => (
                      <div key={index} className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm dark:border-orange-700 dark:bg-orange-900/20">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-orange-200 px-2 py-0.5 text-xs font-bold uppercase text-orange-900 dark:bg-orange-800 dark:text-orange-100">
                            {secret.type}
                          </span>
                          <code className="font-mono">{secret.value}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFile.endpoints.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Endpoints Discovered</h4>
                  <div className="space-y-1">
                    {selectedFile.endpoints.map((endpoint, index) => (
                      <div key={index} className="rounded bg-gray-50 p-2 font-mono text-sm dark:bg-gray-900">
                        {endpoint}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 font-semibold">Source Code</h4>
                <pre className="max-h-96 overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs dark:border-gray-600 dark:bg-gray-900">
                  {selectedFile.code}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
