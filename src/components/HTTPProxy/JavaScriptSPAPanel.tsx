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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black uppercase tracking-wide">JavaScript & SPA Awareness</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={headlessBrowserEnabled}
              onChange={handleToggleHeadlessBrowser}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm font-semibold text-black">Headless Browser</span>
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4">
        <div className="apple-card rounded-2xl p-5 border border-gray-200">
          <div className="flex gap-2">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="apple-input flex-1 rounded-xl px-4 py-2.5 text-sm text-black"
            />
            <button
              onClick={handleDiscoverEndpoints}
              disabled={analyzing}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <IconSearch size={18} />
              {analyzing ? 'Analyzing...' : 'Discover Endpoints'}
            </button>
            <button
              onClick={handleScanForSecrets}
              disabled={analyzing}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <IconKey size={18} />
              Scan Secrets
            </button>
            <button
              onClick={handleTestDOMXSS}
              disabled={analyzing}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
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
                className="apple-input w-24 rounded-xl px-4 py-2.5 text-sm text-black"
              />
              <button
                onClick={handleCrawlSPA}
                disabled={crawling}
                className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <IconRefresh size={18} />
                {crawling ? 'Crawling...' : 'Crawl SPA (Depth)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'files'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconBrandJavascript size={18} />
          JS Files ({jsFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('secrets')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'secrets'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconKey size={18} />
          Secrets ({secrets.length})
        </button>
        <button
          onClick={() => setActiveTab('dom-xss')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'dom-xss'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconAlertTriangle size={18} />
          DOM XSS ({xssVectors.length})
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'endpoints'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconCode size={18} />
          Endpoints ({spaEndpoints.length})
        </button>
        <button
          onClick={() => setActiveTab('deobfuscate')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'deobfuscate'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconEye size={18} />
          Deobfuscate
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* JS Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-3">
            <div className="apple-card rounded-2xl p-4 border border-gray-200">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/app.js"
                  className="apple-input flex-1 rounded-xl px-4 py-2.5 text-sm text-black"
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
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Analyze File
                </button>
              </div>
            </div>

            {jsFiles.map((file, index) => (
              <div
                key={index}
                className="apple-card cursor-pointer rounded-2xl p-5 hover:bg-gray-50 transition-all border border-gray-200"
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconBrandJavascript size={18} className="text-yellow-500" />
                      <span className="font-mono text-sm text-black">{file.url}</span>
                      {file.sourceMapped && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Source Mapped
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-black opacity-80">
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
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconBrandJavascript size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
                  No JavaScript files analyzed yet. Enter a URL and analyze it, or discover endpoints from a target.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Secrets Tab */}
        {activeTab === 'secrets' && (
          <div className="space-y-3">
            {secrets.map((secret, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-2xl border-2 p-5',
                  secret.confidence >= 0.8
                    ? 'border-red-600 bg-red-50'
                    : secret.confidence >= 0.5
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-yellow-600 bg-yellow-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconKey size={18} />
                      <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase text-black">
                        {secret.type}
                      </span>
                      <span className="text-sm text-black opacity-80">
                        Confidence: {(secret.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="font-mono text-sm break-all text-black">{secret.value}</p>
                      <p className="text-xs text-black opacity-60">
                        {secret.location.file}:{secret.location.line}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {secrets.length === 0 && (
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconKey size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
                  No secrets found yet. Click "Scan for Secrets" to search for hardcoded credentials and API keys.
                </p>
              </div>
            )}
          </div>
        )}

        {/* DOM XSS Tab */}
        {activeTab === 'dom-xss' && (
          <div className="space-y-3">
            {xssVectors.map((vector, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-2xl border-2 p-5',
                  vector.vulnerable
                    ? 'border-red-600 bg-red-50'
                    : 'border-green-600 bg-green-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <IconAlertTriangle size={18} />
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-bold uppercase',
                        vector.vulnerable
                          ? 'bg-red-200 text-red-900'
                          : 'bg-green-200 text-green-900'
                      )}>
                        {vector.vulnerable ? 'VULNERABLE' : 'NOT VULNERABLE'}
                      </span>
                      <span className="text-sm text-black opacity-80">
                        Confidence: {(vector.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-black">
                      <p><span className="font-semibold">Source:</span> <code className="font-mono text-xs">{vector.source}</code></p>
                      <p><span className="font-semibold">Sink:</span> <code className="font-mono text-xs">{vector.sink}</code></p>
                      <p><span className="font-semibold">Payload:</span> <code className="font-mono text-xs">{vector.payload}</code></p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {xssVectors.length === 0 && (
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconAlertTriangle size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
                  No DOM-based XSS tests run yet. Click "Test DOM XSS" to analyze potential client-side XSS vectors.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-3">
            {spaEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="apple-card rounded-2xl p-5 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800">
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm text-black">{endpoint.url}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-black opacity-80">
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
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconCode size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
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
              <label className="mb-2 block text-sm font-semibold text-black">Obfuscated JavaScript Code</label>
              <textarea
                value={codeToDeobfuscate}
                onChange={(e) => setCodeToDeobfuscate(e.target.value)}
                rows={10}
                placeholder="Paste obfuscated JavaScript code here..."
                className="apple-input w-full rounded-2xl px-4 py-3 font-mono text-sm text-black border border-gray-200"
              />
            </div>

            <button
              onClick={handleDeobfuscate}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
            >
              <IconPlayerPlay size={18} />
              Deobfuscate
            </button>

            {deobfuscatedCode && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Deobfuscated Code</label>
                <pre className="apple-card max-h-96 overflow-auto rounded-2xl border border-gray-200 p-4 text-xs text-black">
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
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black uppercase tracking-wide">JavaScript File Analysis</h3>
              <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-gray-700">
                <IconX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold text-black uppercase tracking-wide">URL</h4>
                <p className="font-mono text-sm text-black opacity-80">{selectedFile.url}</p>
              </div>

              <div className="flex gap-4 text-sm text-black opacity-80">
                <div>Size: {(selectedFile.size / 1024).toFixed(2)} KB</div>
                <div>Vulnerabilities: {selectedFile.vulnerabilities.length}</div>
                <div>Secrets: {selectedFile.secrets.length}</div>
                <div>Endpoints: {selectedFile.endpoints.length}</div>
              </div>

              {selectedFile.vulnerabilities.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-black uppercase tracking-wide">Vulnerabilities</h4>
                  <div className="space-y-2">
                    {selectedFile.vulnerabilities.map((vuln, index) => (
                      <div key={index} className="rounded-2xl border-2 border-red-600 bg-red-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-bold uppercase text-red-900">
                            {vuln.severity}
                          </span>
                          <span className="font-semibold text-black">{vuln.type}</span>
                        </div>
                        <p className="text-sm text-black">{vuln.description}</p>
                        <div className="mt-2 text-xs text-black opacity-60">
                          Location: {vuln.location.file}:{vuln.location.line}:{vuln.location.column}
                        </div>
                        <pre className="mt-2 overflow-auto rounded-xl bg-white p-3 text-xs border border-red-200">{vuln.code}</pre>
                        <p className="mt-2 text-sm text-black"><strong>Remediation:</strong> {vuln.remediation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFile.secrets.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-black uppercase tracking-wide">Secrets Found</h4>
                  <div className="space-y-2">
                    {selectedFile.secrets.map((secret, index) => (
                      <div key={index} className="rounded-2xl border-2 border-orange-600 bg-orange-50 p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-orange-200 px-2 py-0.5 text-xs font-bold uppercase text-orange-900">
                            {secret.type}
                          </span>
                          <code className="font-mono text-black">{secret.value}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFile.endpoints.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-black uppercase tracking-wide">Endpoints Discovered</h4>
                  <div className="space-y-1">
                    {selectedFile.endpoints.map((endpoint, index) => (
                      <div key={index} className="rounded-xl bg-gray-50 p-3 font-mono text-sm text-black border border-gray-200">
                        {endpoint}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 font-semibold text-black uppercase tracking-wide">Source Code</h4>
                <pre className="max-h-96 overflow-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-black">
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
