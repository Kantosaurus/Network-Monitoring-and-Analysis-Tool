import React, { useState } from 'react';
import { IconArrowDown, IconCheck, IconX } from '@tabler/icons-react';

export const ComparerPanel: React.FC = () => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [viewMode, setViewMode] = useState<'line-diff' | 'char-diff' | 'unified'>('line-diff');

  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const max = Math.max(leftLines.length, rightLines.length);

  const getCharDiff = (str1: string, str2: string) => {
    if (str1 === str2) return { added: 0, removed: 0, same: str1.length };
    
    const added = str2.split('').filter((c, i) => !str1[i] || str1[i] !== c).length;
    const removed = str1.split('').filter((c, i) => !str2[i] || str2[i] !== c).length;
    const same = Math.min(str1.length, str2.length) - Math.min(added, removed);
    
    return { added, removed, same };
  };

  const renderLineDiff = () => {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Array.from({ length: max }).map((_, i) => {
          const l = leftLines[i] ?? '';
          const r = rightLines[i] ?? '';
          const same = l === r;
          const chars = getCharDiff(l, r);

          return (
            <React.Fragment key={i}>
              <div className={`p-2 rounded-xl font-mono break-all ${same ? 'bg-gray-50 border border-gray-200' : 'bg-red-50 border border-red-300'}`}>
                {l || <span className="opacity-30 text-gray-400">∅</span>}
              </div>
              <div className={`p-2 rounded-xl font-mono break-all ${same ? 'bg-gray-50 border border-gray-200' : 'bg-green-50 border border-green-300'}`}>
                {r || <span className="opacity-30 text-gray-400">∅</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderUnifiedDiff = () => {
    return (
      <div className="space-y-1 text-xs font-mono">
        {Array.from({ length: max }).map((_, i) => {
          const l = leftLines[i] ?? '';
          const r = rightLines[i] ?? '';
          const same = l === r;

          if (same) {
            return (
              <div key={i} className="p-2 bg-gray-50 text-gray-500 rounded-xl border border-gray-200">
                  {l}
              </div>
            );
          }

          return (
            <React.Fragment key={i}>
              {l && (
                <div className="p-2 bg-red-50 border-l-2 border-red-600 text-red-600 break-all rounded-xl">
                  - {l}
                </div>
              )}
              {r && (
                <div className="p-2 bg-green-50 border-l-2 border-green-600 text-green-600 break-all rounded-xl">
                  + {r}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const stats = {
    left: {
      lines: leftLines.length,
      chars: left.length,
    },
    right: {
      lines: rightLines.length,
      chars: right.length,
    },
  };

  const linesDiff = Math.abs(stats.left.lines - stats.right.lines);
  const charsDiff = Math.abs(stats.left.chars - stats.right.chars);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">Content Comparer</h2>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-black">View Mode:</label>
            <select value={viewMode} onChange={e => setViewMode(e.target.value as any)} className="apple-input rounded-xl px-4 py-2.5 text-sm text-black">
              <option value="line-diff">Line by Line</option>
              <option value="unified">Unified Diff</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="apple-card rounded-2xl px-4 py-2 border border-gray-200">
              <span className="text-gray-500 font-medium">Lines: </span>
              <span className={charsDiff > 0 ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>
                {stats.left.lines} / {stats.right.lines}
              </span>
            </div>
            <div className="apple-card rounded-2xl px-4 py-2 border border-gray-200">
              <span className="text-gray-500 font-medium">Chars: </span>
              <span className={charsDiff > 0 ? 'text-blue-600 font-semibold' : 'text-green-600 font-semibold'}>
                {stats.left.chars} / {stats.right.chars}
              </span>
            </div>
            {charsDiff > 0 && (
              <div className="apple-card rounded-2xl px-4 py-2 border border-blue-200 bg-blue-50 text-blue-600 font-semibold">
                Δ {charsDiff} chars, {linesDiff} lines
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Areas (compact when no data) */}
      {(!left || !right) && (
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-4 h-56">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-black mb-2 block">Left</label>
              <textarea
                value={left}
                onChange={e => setLeft(e.target.value)}
                placeholder="Paste first content"
                className="flex-1 apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full font-mono resize-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-black mb-2 block">Right</label>
              <textarea
                value={right}
                onChange={e => setRight(e.target.value)}
                placeholder="Paste second content"
                className="flex-1 apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full font-mono resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Diff View */}
      {left && right && (
        <div className="flex-1 overflow-auto px-6 py-6">
          {viewMode === 'line-diff' && renderLineDiff()}
          {viewMode === 'unified' && renderUnifiedDiff()}
        </div>
      )}

      {/* Empty State */}
      {!left && !right && (
        <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2">
          <IconArrowDown size={24} className="opacity-30" />
          <p className="text-sm">Paste content in both areas to compare</p>
        </div>
      )}
    </div>
  );
};
