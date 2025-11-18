import React, { useState } from 'react';
import { IconLoader, IconKey } from '@tabler/icons-react';
import { SessionToken } from '@/types';

export const SequencerPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [tokens, setTokens] = useState<SessionToken[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRun = async () => {
    if (!window.api) return;
    setIsRunning(true);
    setTokens(null);
    try {
      const res = await window.api.extractSessionTokens();
      if (res.success) {
        setTokens(res.tokens || []);
        if (!res.tokens || res.tokens.length === 0) {
          alert('No session tokens extracted from proxy history');
        }
      } else {
        alert(`Sequencer failed: ${res.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Sequencer error: ${e?.message || String(e)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getTokenTypeColor = (type: string) => {
    switch (type) {
      case 'jwt':
        return 'bg-purple-50 border-purple-200 text-purple-600';
      case 'bearer':
        return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'cookie':
        return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'session-id':
        return 'bg-green-50 border-green-200 text-green-600';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const analyzeTokenEntropy = (value: string): { entropy: number; score: string } => {
    if (!value || value.length === 0) return { entropy: 0, score: 'Very Weak' };
    const unique = new Set(value);
    const entropy = Math.log2(256) * (unique.size / 256);
    if (entropy < 2) return { entropy, score: 'Very Weak' };
    if (entropy < 4) return { entropy, score: 'Weak' };
    if (entropy < 6) return { entropy, score: 'Moderate' };
    return { entropy, score: 'Strong' };
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-white">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <IconLoader size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <IconKey size={16} />
              Extract Tokens
            </>
          )}
        </button>
        <p className="text-xs text-gray-500">Analyzes tokens captured by proxy</p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {!tokens && !isRunning && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">Click Extract Tokens to analyze captured session tokens.</p>
          </div>
        )}

        {isRunning && (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <IconLoader size={24} className="animate-spin text-purple-500" />
              <p className="text-sm text-gray-500">Analyzing tokens...</p>
            </div>
          </div>
        )}

        {tokens && tokens.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No session tokens found in proxy history</p>
          </div>
        )}

        {tokens && tokens.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Extracted {tokens.length} {tokens.length === 1 ? 'token' : 'tokens'}
            </div>
            {tokens.map((token, i) => {
              const entropy = analyzeTokenEntropy(token.value);
              return (
                <div
                  key={i}
                  onClick={() => setExpandedId(expandedId === i.toString() ? null : i.toString())}
                  className={cn(
                    'apple-card rounded-2xl border p-5 cursor-pointer transition-all',
                    getTokenTypeColor(token.type),
                    expandedId === i.toString() && 'ring-2 ring-offset-1'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{token.name || 'Unnamed Token'}</div>
                      <div className="text-xs mt-1 opacity-75">
                        <span className="font-medium uppercase">{token.type}</span>
                        {token.domain && <span className="ml-2">@ {token.domain}</span>}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-black/20 rounded">{entropy.score}</span>
                  </div>

                  {expandedId === i.toString() && (
                    <div className="mt-3 pt-3 border-t border-current/20 space-y-2 text-xs">
                      <div>
                        <div className="font-semibold opacity-75">Value</div>
                        <div className="font-mono text-xs opacity-50 break-all mt-1 bg-black/10 rounded p-2">{token.value}</div>
                      </div>
                      <div>
                        <div className="font-semibold opacity-75">Entropy Analysis</div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 bg-black/20 rounded overflow-hidden h-2">
                            <div className="h-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: `${Math.min(100, entropy.entropy * 15)}%` }} />
                          </div>
                          <span className="text-xs opacity-75">{entropy.entropy.toFixed(2)} bits</span>
                        </div>
                      </div>
                      {token.expires && (
                        <div>
                          <div className="font-semibold opacity-75">Expires</div>
                          <div className="opacity-75 mt-1">{token.expires}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
