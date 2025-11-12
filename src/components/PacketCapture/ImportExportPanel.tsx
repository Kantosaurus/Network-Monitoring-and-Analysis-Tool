import React, { useState } from 'react';
import {
  IconFileImport,
  IconFileExport,
  IconRefresh,
  IconTerminal,
  IconSettings,
  IconPlayerPlay
} from '@tabler/icons-react';

interface ImportExportPanelProps {
  onClose: () => void;
}

type TabType = 'import' | 'export' | 'convert' | 'interop' | 'automation';

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('import');

  // Convert state
  const [convertInputPath, setConvertInputPath] = useState('');
  const [convertOutputPath, setConvertOutputPath] = useState('');
  const [convertFormat, setConvertFormat] = useState<'pcap' | 'pcapng' | 'erf'>('pcapng');

  // Interoperability state
  const [selectedTool, setSelectedTool] = useState<'tshark' | 'zeek' | 'suricata' | 'snort' | 'networkminer' | 'splunk'>('tshark');
  const [toolFilePath, setToolFilePath] = useState('');
  const [toolOptions, setToolOptions] = useState('');
  const [toolOutput, setToolOutput] = useState('');

  // Automation state
  const [tsharkCommand, setTsharkCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [batchFiles, setBatchFiles] = useState('');
  const [batchOperations, setBatchOperations] = useState('');

  const handleImportFile = async () => {
    if (!window.api) return;
    const result = await window.api.loadPcapFile();
    if (result.success) {
      alert(`File loaded: ${result.filepath}\nPackets: ${result.packetCount}`);
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  const handleConvertFormat = async () => {
    if (!convertInputPath || !convertOutputPath) {
      alert('Please specify input and output paths');
      return;
    }

    const result = await window.api.convertPcapFormat(convertInputPath, convertOutputPath, convertFormat);
    if (result.success) {
      alert(`Conversion successful!\nOutput: ${convertOutputPath}`);
    } else {
      alert(`Conversion failed: ${result.error}`);
    }
  };

  const handleExportToTool = async () => {
    if (!toolFilePath) {
      alert('Please specify a file path');
      return;
    }

    let options = {};
    try {
      if (toolOptions.trim()) {
        options = JSON.parse(toolOptions);
      }
    } catch (e) {
      alert('Invalid JSON in options field');
      return;
    }

    const result = await window.api.exportToTool(selectedTool, toolFilePath, options);
    if (result.success) {
      setToolOutput(result.output || 'Export successful!');
    } else {
      setToolOutput(`Error: ${result.error}`);
    }
  };

  const handleRunTsharkCommand = async () => {
    if (!tsharkCommand.trim()) {
      alert('Please enter a TShark command');
      return;
    }

    const result = await window.api.runTsharkCommand(tsharkCommand);
    if (result.success) {
      setCommandOutput(result.output || 'Command executed successfully');
    } else {
      setCommandOutput(`Error: ${result.error}`);
    }
  };

  const handleBatchProcess = async () => {
    if (!batchFiles.trim() || !batchOperations.trim()) {
      alert('Please specify files and operations');
      return;
    }

    const files = batchFiles.split('\n').map(f => f.trim()).filter(f => f);
    const operations = batchOperations.split('\n').map(o => o.trim()).filter(o => o);

    const result = await window.api.batchProcessCaptures(files, operations);
    if (result.success) {
      alert(`Batch processing completed!\n${result.results?.length || 0} files processed`);
    } else {
      alert(`Batch processing failed: ${result.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[90%] h-[90%] bg-white dark:bg-neutral-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <IconFileImport size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold">Import/Export Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 overflow-x-auto">
          {[
            { id: 'import', label: 'Import Files', icon: IconFileImport },
            { id: 'export', label: 'Export Formats', icon: IconFileExport },
            { id: 'convert', label: 'Format Converter', icon: IconRefresh },
            { id: 'interop', label: 'Tool Interoperability', icon: IconSettings },
            { id: 'automation', label: 'CLI Automation', icon: IconTerminal }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Import Files Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Supported Import Formats</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { format: 'PCAP', desc: 'Standard packet capture format', supported: true },
                    { format: 'PCAPNG', desc: 'Next-generation PCAP format', supported: true },
                    { format: 'ERF', desc: 'Extensible Record Format (Endace)', supported: true },
                    { format: 'NetMon', desc: 'Microsoft Network Monitor', supported: true },
                    { format: 'Snoop', desc: 'Sun Solaris snoop format', supported: true },
                    { format: 'tcpdump', desc: 'tcpdump capture format', supported: true }
                  ].map((fmt, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        fmt.supported
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${fmt.supported ? 'text-green-600' : 'text-gray-500'}`}>
                          {fmt.format}
                        </span>
                        {fmt.supported && (
                          <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{fmt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
                <h4 className="font-medium mb-4">Import Capture File</h4>
                <button
                  onClick={handleImportFile}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <IconFileImport size={18} />
                  Browse & Import File
                </button>
                <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  Opens file browser to select PCAP, PCAPNG, ERF, or other supported formats
                </p>
              </div>

              <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Import Features</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Automatic format detection</li>
                  <li>Large file support (up to several GB)</li>
                  <li>Compressed file support (.gz, .bz2)</li>
                  <li>Live capture from network interfaces</li>
                  <li>Import from tcpdump, Wireshark, NetworkMiner</li>
                </ul>
              </div>
            </div>
          )}

          {/* Export Formats Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Available Export Formats</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { format: 'JSON', desc: 'JavaScript Object Notation - Structured data', ext: '.json' },
                  { format: 'CSV', desc: 'Comma-Separated Values - Spreadsheet compatible', ext: '.csv' },
                  { format: 'XML', desc: 'Extensible Markup Language - Standard format', ext: '.xml' },
                  { format: 'PSML', desc: 'Packet Summary Markup Language - Wireshark format', ext: '.psml' },
                  { format: 'PDML', desc: 'Packet Details Markup Language - Full packet details', ext: '.pdml' },
                  { format: 'Plain Text', desc: 'Human-readable text format', ext: '.txt' },
                  { format: 'PostScript', desc: 'Print-ready document format', ext: '.ps' },
                  { format: 'PCAP', desc: 'Native capture format for replay', ext: '.pcap' }
                ].map((fmt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-blue-600">{fmt.format}</span>
                        <span className="ml-2 text-xs font-mono text-gray-500">{fmt.ext}</span>
                      </div>
                      <IconFileExport size={18} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{fmt.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Export Options</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li><strong>Selective Export:</strong> Export filtered packets only</li>
                  <li><strong>Range Export:</strong> Export specific packet ranges</li>
                  <li><strong>Column Customization:</strong> Choose which fields to export</li>
                  <li><strong>Timestamp Formats:</strong> Absolute, relative, or delta time</li>
                  <li><strong>Batch Export:</strong> Export multiple views simultaneously</li>
                </ul>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
                <h4 className="font-medium mb-4">Quick Export</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export buttons are available in the main Packet Capture toolbar for quick access to JSON, CSV, XML, and PSML formats.
                  Additional formats (Plain Text, PDML, PostScript) can be accessed through the Statistics panel export buttons.
                </p>
              </div>
            </div>
          )}

          {/* Format Converter Tab */}
          {activeTab === 'convert' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">File Format Converter</h3>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Input File Path</label>
                  <input
                    type="text"
                    value={convertInputPath}
                    onChange={(e) => setConvertInputPath(e.target.value)}
                    placeholder="/path/to/input.pcap"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Output File Path</label>
                  <input
                    type="text"
                    value={convertOutputPath}
                    onChange={(e) => setConvertOutputPath(e.target.value)}
                    placeholder="/path/to/output.pcapng"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Format</label>
                  <select
                    value={convertFormat}
                    onChange={(e) => setConvertFormat(e.target.value as 'pcap' | 'pcapng' | 'erf')}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <option value="pcap">PCAP (Standard)</option>
                    <option value="pcapng">PCAPNG (Next-Gen)</option>
                    <option value="erf">ERF (Endace)</option>
                  </select>
                </div>

                <button
                  onClick={handleConvertFormat}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  <IconRefresh size={16} />
                  Convert File
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">PCAP</h4>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Standard format</li>
                    <li>• Universal support</li>
                    <li>• Smaller file size</li>
                  </ul>
                </div>
                <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">PCAPNG</h4>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Multiple interfaces</li>
                    <li>• Enhanced metadata</li>
                    <li>• Comments support</li>
                  </ul>
                </div>
                <div className="p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">ERF</h4>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• High precision timing</li>
                    <li>• Hardware capture cards</li>
                    <li>• Endace format</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tool Interoperability Tab */}
          {activeTab === 'interop' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Interoperability with Security Tools</h3>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Tool</label>
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <option value="tshark">TShark (Wireshark CLI)</option>
                    <option value="zeek">Zeek (Bro) - Network Analysis</option>
                    <option value="suricata">Suricata - IDS/IPS</option>
                    <option value="snort">Snort - Network IDS</option>
                    <option value="networkminer">NetworkMiner - Forensics</option>
                    <option value="splunk">Splunk - SIEM Integration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Capture File Path</label>
                  <input
                    type="text"
                    value={toolFilePath}
                    onChange={(e) => setToolFilePath(e.target.value)}
                    placeholder="/path/to/capture.pcap"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tool Options (JSON)</label>
                  <textarea
                    value={toolOptions}
                    onChange={(e) => setToolOptions(e.target.value)}
                    placeholder='{"filter": "http", "output": "json"}'
                    className="w-full h-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>

                <button
                  onClick={handleExportToTool}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <IconPlayerPlay size={16} />
                  Export & Run Tool
                </button>

                {toolOutput && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Tool Output</label>
                    <pre className="rounded-lg border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 p-4 text-xs font-mono overflow-auto max-h-96">
                      {toolOutput}
                    </pre>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { tool: 'TShark', desc: 'Command-line packet analyzer, filtering, statistics', icon: '🦈' },
                  { tool: 'Zeek (Bro)', desc: 'Network analysis framework, log generation', icon: '🔍' },
                  { tool: 'Suricata', desc: 'IDS/IPS engine, threat detection rules', icon: '🛡️' },
                  { tool: 'Snort', desc: 'Network intrusion detection system', icon: '🐗' },
                  { tool: 'NetworkMiner', desc: 'Network forensics, file extraction', icon: '⛏️' },
                  { tool: 'Splunk', desc: 'SIEM integration, log analysis', icon: '📊' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-semibold">{item.tool}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLI Automation Tab */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Command-Line Automation</h3>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
                <h4 className="font-medium">Run TShark Command</h4>
                <div>
                  <label className="block text-sm font-medium mb-2">TShark Command</label>
                  <input
                    type="text"
                    value={tsharkCommand}
                    onChange={(e) => setTsharkCommand(e.target.value)}
                    placeholder='tshark -r capture.pcap -Y "http.request" -T json'
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <button
                  onClick={handleRunTsharkCommand}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <IconTerminal size={16} />
                  Execute Command
                </button>
                {commandOutput && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Command Output</label>
                    <pre className="rounded-lg border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 p-4 text-xs font-mono overflow-auto max-h-64">
                      {commandOutput}
                    </pre>
                  </div>
                )}
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 space-y-4">
                <h4 className="font-medium">Batch Processing</h4>
                <div>
                  <label className="block text-sm font-medium mb-2">Capture Files (one per line)</label>
                  <textarea
                    value={batchFiles}
                    onChange={(e) => setBatchFiles(e.target.value)}
                    placeholder={"/path/to/capture1.pcap\n/path/to/capture2.pcap\n/path/to/capture3.pcap"}
                    className="w-full h-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Operations (one per line)</label>
                  <textarea
                    value={batchOperations}
                    onChange={(e) => setBatchOperations(e.target.value)}
                    placeholder={'filter:http\nexport:json\nstatistics:protocol-hierarchy'}
                    className="w-full h-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  />
                </div>
                <button
                  onClick={handleBatchProcess}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  <IconPlayerPlay size={16} />
                  Run Batch Process
                </button>
              </div>

              <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Common TShark Commands</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-300 dark:border-neutral-700">
                    <code>tshark -r file.pcap -Y "http" -T json</code>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Filter HTTP packets and export as JSON</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-300 dark:border-neutral-700">
                    <code>tshark -r file.pcap -q -z io,phs</code>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Protocol hierarchy statistics</div>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-300 dark:border-neutral-700">
                    <code>tshark -r file.pcap -Y "tcp.analysis.retransmission"</code>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Find TCP retransmissions</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportPanel;
