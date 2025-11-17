import React, { useState } from 'react';
import {
  IconTerminal,
  IconScissors,
  IconFilePlus,
  IconInfoCircle,
  IconFileCode,
  IconDatabase,
  IconArrowsSort,
  IconX,
  IconPlayerPlay
} from '@tabler/icons-react';
import { CaptureFileInfo } from '@/types';

interface UtilitiesPanelProps {
  onClose: () => void;
}

type TabType = 'tshark' | 'editcap' | 'mergecap' | 'capinfos' | 'text2pcap' | 'rawshark' | 'reordercap';

const UtilitiesPanel: React.FC<UtilitiesPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tshark');

  // TShark state
  const [tsharkFilepath, setTsharkFilepath] = useState('');
  const [tsharkDisplayFilter, setTsharkDisplayFilter] = useState('');
  const [tsharkFields, setTsharkFields] = useState('');
  const [tsharkOutput, setTsharkOutput] = useState('');

  // Editcap state
  const [editcapInputPath, setEditcapInputPath] = useState('');
  const [editcapOutputPath, setEditcapOutputPath] = useState('');
  const [editcapOperation, setEditcapOperation] = useState<'trim' | 'split'>('trim');
  const [trimStartPacket, setTrimStartPacket] = useState(1);
  const [trimEndPacket, setTrimEndPacket] = useState(100);
  const [splitType, setSplitType] = useState<'count' | 'duration' | 'size'>('count');
  const [splitValue, setSplitValue] = useState(1000);
  const [splitOutputDir, setSplitOutputDir] = useState('./split_captures');
  const [editcapResult, setEditcapResult] = useState('');

  // Mergecap state
  const [mergecapInputs, setMergecapInputs] = useState('');
  const [mergecapOutput, setMergecapOutput] = useState('');
  const [mergecapResult, setMergecapResult] = useState('');

  // Capinfos state
  const [capinfosFilepath, setCapinfosFilepath] = useState('');
  const [capinfosData, setCapinfosData] = useState<CaptureFileInfo | null>(null);

  // Text2pcap state
  const [text2pcapHexInput, setText2pcapHexInput] = useState('');
  const [text2pcapOutput, setText2pcapOutput] = useState('');
  const [text2pcapResult, setText2pcapResult] = useState('');

  // Rawshark state
  const [rawsharkFilepath, setRawsharkFilepath] = useState('');
  const [rawsharkFields, setRawsharkFields] = useState('');
  const [rawsharkData, setRawsharkData] = useState<any[]>([]);

  // Reordercap state
  const [reordercapInputPath, setReordercapInputPath] = useState('');
  const [reordercapOutputPath, setReordercapOutputPath] = useState('');
  const [reordercapResult, setReordercapResult] = useState('');

  const handleTsharkAnalyze = async () => {
    if (!window.api || !tsharkFilepath) return;
    const fields = tsharkFields.split(',').map(f => f.trim()).filter(f => f);
    const result = await window.api.tsharkAnalyze(
      tsharkFilepath,
      tsharkDisplayFilter || undefined,
      fields.length > 0 ? fields : undefined
    );
    if (result.success) {
      setTsharkOutput(result.output || JSON.stringify(result.packets, null, 2));
    } else {
      setTsharkOutput(`Error: ${result.error}`);
    }
  };

  const handleEditcapTrim = async () => {
    if (!window.api || !editcapInputPath || !editcapOutputPath) return;
    const result = await window.api.editcapTrim(
      editcapInputPath,
      editcapOutputPath,
      trimStartPacket,
      trimEndPacket
    );
    if (result.success) {
      setEditcapResult(`Successfully trimmed capture to packets ${trimStartPacket}-${trimEndPacket}\nOutput: ${editcapOutputPath}`);
    } else {
      setEditcapResult(`Error: ${result.error}`);
    }
  };

  const handleEditcapSplit = async () => {
    if (!window.api || !editcapInputPath || !splitOutputDir) return;
    const result = await window.api.editcapSplit(
      editcapInputPath,
      splitOutputDir,
      splitType,
      splitValue
    );
    if (result.success) {
      setEditcapResult(`Successfully split capture into ${result.files?.length || 0} files:\n${result.files?.join('\n')}`);
    } else {
      setEditcapResult(`Error: ${result.error}`);
    }
  };

  const handleMergecap = async () => {
    if (!window.api || !mergecapInputs || !mergecapOutput) return;
    const inputs = mergecapInputs.split('\n').map(f => f.trim()).filter(f => f);
    const result = await window.api.mergecap(inputs, mergecapOutput);
    if (result.success) {
      setMergecapResult(`Successfully merged ${inputs.length} files into:\n${mergecapOutput}`);
    } else {
      setMergecapResult(`Error: ${result.error}`);
    }
  };

  const handleCapinfos = async () => {
    if (!window.api || !capinfosFilepath) return;
    const result = await window.api.capinfos(capinfosFilepath);
    if (result.success && result.info) {
      setCapinfosData(result.info);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleText2pcap = async () => {
    if (!window.api || !text2pcapHexInput || !text2pcapOutput) return;
    const result = await window.api.text2pcap(text2pcapHexInput, text2pcapOutput);
    if (result.success) {
      setText2pcapResult(`Successfully converted hex dump to PCAP:\n${text2pcapOutput}`);
    } else {
      setText2pcapResult(`Error: ${result.error}`);
    }
  };

  const handleRawshark = async () => {
    if (!window.api || !rawsharkFilepath || !rawsharkFields) return;
    const fields = rawsharkFields.split(',').map(f => f.trim()).filter(f => f);
    const result = await window.api.rawshark(rawsharkFilepath, fields);
    if (result.success && result.data) {
      setRawsharkData(result.data);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleReordercap = async () => {
    if (!window.api || !reordercapInputPath || !reordercapOutputPath) return;
    const result = await window.api.reordercap(reordercapInputPath, reordercapOutputPath);
    if (result.success) {
      setReordercapResult(`Successfully reordered packets chronologically:\n${reordercapOutputPath}`);
    } else {
      setReordercapResult(`Error: ${result.error}`);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'tshark', label: 'TShark', icon: <IconTerminal size={18} />, description: 'Command-line packet analyzer' },
    { id: 'editcap', label: 'Editcap', icon: <IconScissors size={18} />, description: 'Trim, merge, or split captures' },
    { id: 'mergecap', label: 'Mergecap', icon: <IconFilePlus size={18} />, description: 'Combine multiple captures' },
    { id: 'capinfos', label: 'Capinfos', icon: <IconInfoCircle size={18} />, description: 'Display capture file info' },
    { id: 'text2pcap', label: 'Text2pcap', icon: <IconFileCode size={18} />, description: 'Convert hex to PCAP' },
    { id: 'rawshark', label: 'Rawshark', icon: <IconDatabase size={18} />, description: 'Extract data fields' },
    { id: 'reordercap', label: 'Reordercap', icon: <IconArrowsSort size={18} />, description: 'Reorder packets' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="apple-card rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full max-w-7xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <IconTerminal size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black uppercase tracking-wide">Command-Line Utilities</h2>
              <p className="text-xs text-black opacity-60">
                Wireshark-equivalent tools for packet capture analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="apple-button rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto px-6 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-black opacity-60 hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {/* TShark Tab */}
          {activeTab === 'tshark' && (
            <div className="space-y-4">
              <div className="apple-card rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <IconTerminal className="text-blue-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">TShark - Command-Line Analyzer</h3>
                    <p className="text-sm text-blue-800 opacity-90 mt-1">
                      Analyze capture files programmatically without GUI. Perfect for headless environments and automation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Capture File Path</label>
                  <input
                    type="text"
                    value={tsharkFilepath}
                    onChange={(e) => setTsharkFilepath(e.target.value)}
                    placeholder="/path/to/capture.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Display Filter (optional)</label>
                  <input
                    type="text"
                    value={tsharkDisplayFilter}
                    onChange={(e) => setTsharkDisplayFilter(e.target.value)}
                    placeholder="tcp.port == 443"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Filter packets based on display filter syntax</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fields to Extract (comma-separated, optional)</label>
                  <input
                    type="text"
                    value={tsharkFields}
                    onChange={(e) => setTsharkFields(e.target.value)}
                    placeholder="ip.src, ip.dst, tcp.port"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Specify which fields to extract from packets</p>
                </div>

                <button
                  onClick={handleTsharkAnalyze}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconPlayerPlay size={16} />
                  Analyze
                </button>

                {tsharkOutput && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Output</label>
                    <textarea
                      value={tsharkOutput}
                      readOnly
                      rows={15}
                      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editcap Tab */}
          {activeTab === 'editcap' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20 p-4">
                <div className="flex items-start gap-3">
                  <IconScissors className="text-orange-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-300">Editcap - Edit Capture Files</h3>
                    <p className="text-sm text-orange-800 dark:text-orange-400">
                      Trim capture files to specific packet ranges or split them into multiple smaller files.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Input Capture File</label>
                  <input
                    type="text"
                    value={editcapInputPath}
                    onChange={(e) => setEditcapInputPath(e.target.value)}
                    placeholder="/path/to/input.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Operation</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={editcapOperation === 'trim'}
                        onChange={() => setEditcapOperation('trim')}
                        className="rounded"
                      />
                      <span className="text-sm">Trim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={editcapOperation === 'split'}
                        onChange={() => setEditcapOperation('split')}
                        className="rounded"
                      />
                      <span className="text-sm">Split</span>
                    </label>
                  </div>
                </div>

                {editcapOperation === 'trim' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Packet</label>
                        <input
                          type="number"
                          value={trimStartPacket}
                          onChange={(e) => setTrimStartPacket(Number(e.target.value))}
                          min={1}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Packet</label>
                        <input
                          type="number"
                          value={trimEndPacket}
                          onChange={(e) => setTrimEndPacket(Number(e.target.value))}
                          min={1}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Output File Path</label>
                      <input
                        type="text"
                        value={editcapOutputPath}
                        onChange={(e) => setEditcapOutputPath(e.target.value)}
                        placeholder="/path/to/output.pcap"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleEditcapTrim}
                      className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                    >
                      <IconScissors size={16} />
                      Trim Capture
                    </button>
                  </>
                )}

                {editcapOperation === 'split' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Split Type</label>
                      <select
                        value={splitType}
                        onChange={(e) => setSplitType(e.target.value as 'count' | 'duration' | 'size')}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                      >
                        <option value="count">By Packet Count</option>
                        <option value="duration">By Duration (seconds)</option>
                        <option value="size">By File Size (KB)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Split Value {splitType === 'count' && '(packets per file)'}
                        {splitType === 'duration' && '(seconds per file)'}
                        {splitType === 'size' && '(KB per file)'}
                      </label>
                      <input
                        type="number"
                        value={splitValue}
                        onChange={(e) => setSplitValue(Number(e.target.value))}
                        min={1}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Output Directory</label>
                      <input
                        type="text"
                        value={splitOutputDir}
                        onChange={(e) => setSplitOutputDir(e.target.value)}
                        placeholder="./split_captures"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={handleEditcapSplit}
                      className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                    >
                      <IconScissors size={16} />
                      Split Capture
                    </button>
                  </>
                )}

                {editcapResult && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-3">
                    <pre className="text-xs whitespace-pre-wrap">{editcapResult}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mergecap Tab */}
          {activeTab === 'mergecap' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20 p-4">
                <div className="flex items-start gap-3">
                  <IconFilePlus className="text-purple-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300">Mergecap - Combine Captures</h3>
                    <p className="text-sm text-purple-800 dark:text-purple-400">
                      Merge multiple capture files into a single file, preserving timestamps and chronological order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Input Files (one per line)</label>
                  <textarea
                    value={mergecapInputs}
                    onChange={(e) => setMergecapInputs(e.target.value)}
                    placeholder={"/path/to/capture1.pcap\n/path/to/capture2.pcap\n/path/to/capture3.pcap"}
                    rows={6}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Enter one file path per line</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Output File Path</label>
                  <input
                    type="text"
                    value={mergecapOutput}
                    onChange={(e) => setMergecapOutput(e.target.value)}
                    placeholder="/path/to/merged.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={handleMergecap}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  <IconFilePlus size={16} />
                  Merge Captures
                </button>

                {mergecapResult && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-3">
                    <pre className="text-xs whitespace-pre-wrap">{mergecapResult}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Capinfos Tab */}
          {activeTab === 'capinfos' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-4">
                <div className="flex items-start gap-3">
                  <IconInfoCircle className="text-green-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300">Capinfos - Capture File Information</h3>
                    <p className="text-sm text-green-800 dark:text-green-400">
                      Display detailed summary information about capture files including size, duration, packet rates, and more.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Capture File Path</label>
                  <input
                    type="text"
                    value={capinfosFilepath}
                    onChange={(e) => setCapinfosFilepath(e.target.value)}
                    placeholder="/path/to/capture.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={handleCapinfos}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <IconInfoCircle size={16} />
                  Get File Info
                </button>

                {capinfosData && (
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
                    <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <h4 className="font-semibold text-sm">Capture File Information</h4>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="text-neutral-600 dark:text-neutral-400">Filename:</div>
                        <div className="font-mono">{capinfosData.filename}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">File Type:</div>
                        <div>{capinfosData.fileType}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">File Size:</div>
                        <div>{capinfosData.fileSize}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Data Size:</div>
                        <div>{capinfosData.dataSize}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Encapsulation:</div>
                        <div>{capinfosData.encapsulation}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Packet Count:</div>
                        <div className="font-semibold text-purple-600">{capinfosData.packetCount}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Capture Start:</div>
                        <div>{capinfosData.captureStart}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Capture End:</div>
                        <div>{capinfosData.captureEnd}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Duration:</div>
                        <div>{capinfosData.captureDuration}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Avg Packet Size:</div>
                        <div>{capinfosData.averagePacketSize}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Avg Packet Rate:</div>
                        <div>{capinfosData.averagePacketRate}</div>

                        <div className="text-neutral-600 dark:text-neutral-400">Avg Bit Rate:</div>
                        <div>{capinfosData.averageBitRate}</div>
                      </div>

                      {capinfosData.interfaces.length > 0 && (
                        <div className="mt-3">
                          <div className="text-neutral-600 dark:text-neutral-400 mb-1">Interfaces:</div>
                          <div className="space-y-1">
                            {capinfosData.interfaces.map((iface, idx) => (
                              <div key={idx} className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1">
                                {iface}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text2pcap Tab */}
          {activeTab === 'text2pcap' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950/20 p-4">
                <div className="flex items-start gap-3">
                  <IconFileCode className="text-cyan-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-cyan-900 dark:text-cyan-300">Text2pcap - Hex to PCAP Converter</h3>
                    <p className="text-sm text-cyan-800 dark:text-cyan-400">
                      Convert hex dumps into valid PCAP files. Useful for creating test cases or analyzing raw packet data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Hex Dump Input</label>
                  <textarea
                    value={text2pcapHexInput}
                    onChange={(e) => setText2pcapHexInput(e.target.value)}
                    placeholder={"0000  45 00 00 3c 1c 46 40 00 40 06 b1 e6 ac 10 0a 63\n0010  ac 10 0a 0c 00 50 e1 5e 00 00 00 00 00 00 00 00"}
                    rows={10}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-mono"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Paste hex dump in standard format (offset + hex bytes)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Output PCAP File Path</label>
                  <input
                    type="text"
                    value={text2pcapOutput}
                    onChange={(e) => setText2pcapOutput(e.target.value)}
                    placeholder="/path/to/output.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={handleText2pcap}
                  className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  <IconFileCode size={16} />
                  Convert to PCAP
                </button>

                {text2pcapResult && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-3">
                    <pre className="text-xs whitespace-pre-wrap">{text2pcapResult}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rawshark Tab */}
          {activeTab === 'rawshark' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20 p-4">
                <div className="flex items-start gap-3">
                  <IconDatabase className="text-indigo-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Rawshark - Field Data Extractor</h3>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400">
                      Extract specific data fields from capture files for scripting and data processing workflows.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Capture File Path</label>
                  <input
                    type="text"
                    value={rawsharkFilepath}
                    onChange={(e) => setRawsharkFilepath(e.target.value)}
                    placeholder="/path/to/capture.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fields to Extract (comma-separated)</label>
                  <input
                    type="text"
                    value={rawsharkFields}
                    onChange={(e) => setRawsharkFields(e.target.value)}
                    placeholder="frame.number, ip.src, ip.dst, tcp.srcport, tcp.dstport"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Specify field names to extract from each packet</p>
                </div>

                <button
                  onClick={handleRawshark}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <IconDatabase size={16} />
                  Extract Fields
                </button>

                {rawsharkData.length > 0 && (
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
                    <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <h4 className="font-semibold text-sm">Extracted Data ({rawsharkData.length} packets)</h4>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
                          <tr>
                            {Object.keys(rawsharkData[0] || {}).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-semibold border-b border-neutral-200 dark:border-neutral-700">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rawsharkData.map((row, idx) => (
                            <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              {Object.values(row).map((value: any, vidx) => (
                                <td key={vidx} className="px-3 py-2 font-mono">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reordercap Tab */}
          {activeTab === 'reordercap' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-pink-200 bg-pink-50 dark:border-pink-900 dark:bg-pink-950/20 p-4">
                <div className="flex items-start gap-3">
                  <IconArrowsSort className="text-pink-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-pink-900 dark:text-pink-300">Reordercap - Packet Reordering</h3>
                    <p className="text-sm text-pink-800 dark:text-pink-400">
                      Reorder packets in a capture file chronologically based on timestamps. Useful for merged or out-of-order captures.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Input Capture File</label>
                  <input
                    type="text"
                    value={reordercapInputPath}
                    onChange={(e) => setReordercapInputPath(e.target.value)}
                    placeholder="/path/to/unordered.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Output File Path</label>
                  <input
                    type="text"
                    value={reordercapOutputPath}
                    onChange={(e) => setReordercapOutputPath(e.target.value)}
                    placeholder="/path/to/ordered.pcap"
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={handleReordercap}
                  className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
                >
                  <IconArrowsSort size={16} />
                  Reorder Packets
                </button>

                {reordercapResult && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-3">
                    <pre className="text-xs whitespace-pre-wrap">{reordercapResult}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UtilitiesPanel;
