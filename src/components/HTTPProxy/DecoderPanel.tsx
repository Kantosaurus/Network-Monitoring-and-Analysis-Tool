import React, { useState } from 'react';
import { IconArrowRightCircle } from '@tabler/icons-react';

export const DecoderPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'base64-decode' | 'base64-encode' | 'url-decode' | 'url-encode' | 'hex-decode' | 'hex-encode'>('base64-decode');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const run = () => {
    setError('');
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
        if (hex.length % 2 !== 0) {
          throw new Error('Hex string must have even number of characters');
        }
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
      setError(e?.message || String(e));
      setOutput('');
    }
  };

  React.useEffect(() => {
    if (input) {
      run();
    } else {
      setOutput('');
      setError('');
    }
  }, [mode]);

  const modes: Array<{ value: typeof mode; label: string; category: string }> = [
    { value: 'base64-encode', label: 'Base64 Encode', category: 'Encoding' },
    { value: 'base64-decode', label: 'Base64 Decode', category: 'Encoding' },
    { value: 'url-encode', label: 'URL Encode', category: 'Encoding' },
    { value: 'url-decode', label: 'URL Decode', category: 'Encoding' },
    { value: 'hex-encode', label: 'Hex Encode', category: 'Encoding' },
    { value: 'hex-decode', label: 'Hex Decode', category: 'Encoding' },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">Decoder/Encoder</h2>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-xs">
            <label className="text-sm font-semibold text-black mb-2 block">Transformation</label>
            <select value={mode} onChange={e => setMode(e.target.value as any)} className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full">
              {modes.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
            <div className="font-semibold text-sm text-red-900">Error</div>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Input/Output */}
      <div className="flex-1 px-6 py-4 grid grid-cols-2 gap-4 min-h-0">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-black mb-2 block">Input</label>
          <textarea
            value={input}
            onChange={e => {
              setInput(e.target.value);
              if (e.target.value) {
                try {
                  run();
                } catch (err) {
                  // Silent fail on intermediate typing
                }
              } else {
                setOutput('');
                setError('');
              }
            }}
            placeholder="Enter text to decode/encode"
            className="flex-1 apple-input rounded-xl px-4 py-2.5 text-sm text-black font-mono resize-none"
          />
          <div className="text-xs text-gray-500 mt-2">{input.length} characters</div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-black mb-2 block">Output</label>
          <textarea
            value={output}
            readOnly
            placeholder="Output will appear here"
            className="flex-1 apple-input rounded-xl px-4 py-2.5 text-sm text-black font-mono resize-none bg-gray-50"
          />
          <div className="text-xs text-gray-500 mt-2">{output.length} characters</div>
        </div>
      </div>

      {/* Quick copy button */}
      {output && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(output);
                alert('Copied to clipboard!');
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
            >
              <IconArrowRightCircle size={16} />
              Copy Output
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
