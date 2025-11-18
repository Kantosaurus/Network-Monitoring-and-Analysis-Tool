import React, { useState, useEffect } from 'react';
import { IconAlertCircle, IconLoader } from '@tabler/icons-react';
import { VulnerabilityScanResult } from '@/types';
import { cn } from '@/lib/utils';

export const ScannerPanel: React.FC = () => {
  const [target, setTarget] = useState('https://example.com');
  const [scanType, setScanType] = useState<'quick' | 'full' | 'web' | 'ssl'>('web');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<VulnerabilityScanResult[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!window.api) return;
    const handler = (vuln: VulnerabilityScanResult) => {
      setResults(prev => prev ? [vuln, ...prev] : [vuln]);
    };
    if (window.api.onVulnerabilityFound) {
      window.api.onVulnerabilityFound(handler);
    }
  }, []);

  const handleRun = async () => {
    if (!window.api || !target.trim()) {
      alert('Please enter a target URL');
      return;
    }
    setIsRunning(true);
    setResults(null);
    try {
      const res = await window.api.vulnerabilityScan(target, scanType);
      if (res.success) {
        setResults(res.vulnerabilities || []);
        if (!res.vulnerabilities || res.vulnerabilities.length === 0) {
          alert('Scan completed: no vulnerabilities found');
        }
      } else {
        alert(`Scanner failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Scanner error: ${e?.message || String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-600';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-white">
      {/* Controls */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-xs">
          <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
          <input
            value={target}
            onChange={e => setTarget(e.target.value)}
            disabled={isRunning}
            placeholder="https://example.com"
            className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-black mb-2 block">Scan Type</label>
          <select value={scanType} onChange={e => setScanType(e.target.value as any)} disabled={isRunning} className="apple-input rounded-xl px-4 py-2.5 text-sm text-black disabled:opacity-50">
            <option value="quick">Quick</option>
            <option value="full">Full</option>
            <option value="web">Web</option>
            <option value="ssl">SSL/TLS</option>
          </select>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || !target.trim()}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <IconLoader size={16} className="animate-spin" />
              Scanning...
            </>
          ) : (
            'Start Scan'
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {!results && !isRunning && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No scan results yet. Enter a target and click Start Scan.</p>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <IconLoader size={24} className="animate-spin text-purple-500" />
              <p className="text-sm text-gray-500">Scanning in progress...</p>
            </div>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">✓ Scan completed with no findings</p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Found {results.length} {results.length === 1 ? 'issue' : 'issues'}
            </div>
            {results.map((vuln) => (
              <div
                key={vuln.id}
                onClick={() => setExpandedId(expandedId === vuln.id ? null : vuln.id)}
                className={cn(
                  'apple-card rounded-2xl border p-5 cursor-pointer transition-all',
                  getSeverityColor(vuln.severity),
                  expandedId === vuln.id && 'ring-2 ring-offset-1'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{vuln.vulnerability || vuln.id}</div>
                    <div className="text-xs mt-1 opacity-75">
                      <span className="font-medium uppercase">{vuln.severity}</span>
                      {vuln.cve && <span className="ml-2">{vuln.cve}</span>}
                    </div>
                  </div>
                  <IconAlertCircle size={18} />
                </div>

                {expandedId === vuln.id && (
                  <div className="mt-3 pt-3 border-t border-current/20 space-y-2 text-xs">
                    <div>
                      <div className="font-semibold opacity-75">Host</div>
                      <div className="font-mono text-xs opacity-50">{vuln.host}{vuln.port ? `:${vuln.port}` : ''}</div>
                    </div>
                    <div>
                      <div className="font-semibold opacity-75">Description</div>
                      <p className="opacity-75 mt-1">{vuln.description}</p>
                    </div>
                    <div>
                      <div className="font-semibold opacity-75">Remediation</div>
                      <p className="opacity-75 mt-1">{vuln.remediation}</p>
                    </div>
                    {vuln.confidence && (
                      <div>
                        <div className="font-semibold opacity-75">Confidence</div>
                        <div className="mt-1 bg-black/20 rounded px-2 py-1 inline-block">{Math.round(vuln.confidence * 100)}%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
