import React, { useState } from 'react';
import { IconLoader, IconLink } from '@tabler/icons-react';

export const SpiderPanel: React.FC = () => {
  const [target, setTarget] = useState('https://example.com');
  const [depth, setDepth] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [urls, setUrls] = useState<string[] | null>(null);

  const handleRun = async () => {
    if (!window.api || !target.trim()) {
      alert('Please enter a target URL');
      return;
    }
    if (depth < 1 || depth > 10) {
      alert('Depth must be between 1 and 10');
      return;
    }

    setIsRunning(true);
    setUrls(null);
    try {
      const res = await window.api.jsCrawlSPA(target, depth);
      if (res.success) {
        const discoveredUrls = res.urls || res.endpoints?.map((e: any) => e.url) || [];
        setUrls(discoveredUrls);
        if (discoveredUrls.length === 0) {
          alert('Spider crawl completed: no additional URLs discovered');
        }
      } else {
        alert(`Spider failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Spider error: ${e?.message || String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-xs">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Target URL</label>
          <input
            value={target}
            onChange={e => setTarget(e.target.value)}
            disabled={isRunning}
            placeholder="https://example.com"
            className="w-full glass-card dark:glass-card-dark px-3 py-2 rounded-xl text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Depth</label>
          <input
            type="number"
            value={depth}
            onChange={e => setDepth(Math.min(10, Math.max(1, Number(e.target.value))))}
            disabled={isRunning}
            min={1}
            max={10}
            className="w-20 glass-card dark:glass-card-dark px-3 py-2 rounded-xl text-sm disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || !target.trim()}
          className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <IconLoader size={16} className="animate-spin" />
              Crawling...
            </>
          ) : (
            'Start Crawl'
          )}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {!urls && !isRunning && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No crawl results yet. Enter a target and click Start Crawl.</p>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <IconLoader size={24} className="animate-spin text-purple-500" />
              <p className="text-sm text-gray-500">Crawling in progress...</p>
            </div>
          </div>
        )}

        {urls && urls.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">✓ Crawl completed with no additional URLs found</p>
          </div>
        )}

        {urls && urls.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Discovered {urls.length} {urls.length === 1 ? 'URL' : 'URLs'}
            </div>
            <ul className="space-y-1">
              {urls.map((url, i) => (
                <li key={i} className="rounded-lg glass-card dark:glass-card-dark p-2 text-xs font-mono break-all flex items-start gap-2">
                  <IconLink size={14} className="flex-shrink-0 mt-0.5 opacity-50" />
                  <span className="text-gray-700 dark:text-gray-300">{url}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
