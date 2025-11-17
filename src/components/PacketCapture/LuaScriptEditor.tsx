import React, { useState, useEffect } from 'react';
import {
  IconScript,
  IconPlus,
  IconTrash,
  IconPlayerPlay,
  IconPlayerStop,
  IconDownload,
  IconAlertTriangle,
  IconInfoCircle,
  IconAlertCircle,
  IconAlertOctagon
} from '@tabler/icons-react';
import { LuaTemplate, LuaScript, LuaScriptAlert, LuaScriptLog } from '../../types';

interface LuaScriptEditorProps {
  onClose: () => void;
}

type TabType = 'editor' | 'templates' | 'loaded' | 'logs';

const LuaScriptEditor: React.FC<LuaScriptEditorProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('editor');

  // Templates
  const [templates, setTemplates] = useState<LuaTemplate[]>([]);

  // Editor
  const [scriptId, setScriptId] = useState('');
  const [scriptCode, setScriptCode] = useState('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Loaded Scripts
  const [loadedScripts, setLoadedScripts] = useState<LuaScript[]>([]);

  // Logs and Alerts
  const [alerts, setAlerts] = useState<LuaScriptAlert[]>([]);
  const [logs, setLogs] = useState<LuaScriptLog[]>([]);

  useEffect(() => {
    loadData();
    setupListeners();
  }, []);

  const loadData = async () => {
    if (!window.api) return;

    // Load templates
    const templatesResult = await window.api.luaGetTemplates();
    if (templatesResult.success && templatesResult.templates) {
      setTemplates(templatesResult.templates);
    }

    // Load loaded scripts
    const scriptsResult = await window.api.luaGetLoadedScripts();
    if (scriptsResult.success && scriptsResult.scripts) {
      setLoadedScripts(scriptsResult.scripts);
    }
  };

  const setupListeners = () => {
    if (!window.api) return;

    // Listen for script alerts
    window.api.onLuaScriptAlert((alert: LuaScriptAlert) => {
      setAlerts(prev => [...prev, alert]);
    });

    // Listen for script logs
    window.api.onLuaScriptLog((log: LuaScriptLog) => {
      setLogs(prev => [...prev, log]);
    });
  };

  // Template Management
  const handleLoadTemplate = async (templateId: string) => {
    const result = await window.api.luaGetTemplateCode(templateId);
    if (result.success && result.code) {
      setScriptCode(result.code);
      setScriptId(templateId);
      setActiveTab('editor');
    } else {
      alert(`Failed to load template: ${result.error}`);
    }
  };

  // Script Management
  const handleLoadScript = async () => {
    if (!scriptId.trim()) {
      alert('Please enter a script ID');
      return;
    }

    if (!scriptCode.trim()) {
      alert('Please enter script code');
      return;
    }

    const result = await window.api.luaLoadScript(scriptId, scriptCode);
    if (result.success) {
      setIsScriptLoaded(true);
      await loadData();
      alert(`Script "${scriptId}" loaded successfully`);
    } else {
      alert(`Failed to load script: ${result.error}`);
    }
  };

  const handleUnloadScript = async (scriptIdToUnload: string) => {
    const result = await window.api.luaUnloadScript(scriptIdToUnload);
    if (result.success) {
      if (scriptIdToUnload === scriptId) {
        setIsScriptLoaded(false);
      }
      await loadData();
    } else {
      alert(`Failed to unload script: ${result.error}`);
    }
  };

  const handleNewScript = () => {
    setScriptId('');
    setScriptCode(`-- New Lua Script
-- Available functions:
--   alert(severity, message, details) - severity: "low", "medium", "high", "critical"
--   log(level, message) - level: "info", "warning", "error"
--
-- Available callbacks:
--   on_packet(packet) - called for each packet
--   on_complete() - called when capture completes

function on_packet(packet)
  -- Process packet here
  -- Access packet fields: packet.no, packet.timestamp, packet.source, packet.destination, packet.protocol, packet.length, packet.info
end

function on_complete()
  -- Finalize analysis here
  log("info", "Script completed")
end
`);
    setIsScriptLoaded(false);
    setActiveTab('editor');
  };

  const handleViewResults = async (scriptIdToView: string) => {
    const result = await window.api.luaGetResults(scriptIdToView);
    if (result.success) {
      alert(`Results for "${scriptIdToView}":\n${JSON.stringify(result.results, null, 2)}`);
    } else {
      alert(`Failed to get results: ${result.error}`);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <IconAlertOctagon size={16} className="text-red-600" />;
      case 'high':
        return <IconAlertTriangle size={16} className="text-orange-600" />;
      case 'medium':
        return <IconAlertCircle size={16} className="text-yellow-600" />;
      case 'low':
        return <IconInfoCircle size={16} className="text-blue-600" />;
      default:
        return <IconInfoCircle size={16} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="apple-card rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full max-w-7xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <IconScript size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">Lua Script Editor</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewScript}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
            >
              <IconPlus size={16} />
              New Script
            </button>
            <button
              onClick={onClose}
              className="apple-button rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50">
          {[
            { id: 'editor', label: 'Script Editor' },
            { id: 'templates', label: 'Templates' },
            { id: 'loaded', label: `Loaded Scripts (${loadedScripts.length})` },
            { id: 'logs', label: `Logs & Alerts (${alerts.length + logs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-black opacity-60 hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {/* Script Editor Tab */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scriptId}
                  onChange={(e) => setScriptId(e.target.value)}
                  placeholder="Script ID (e.g., my-custom-script)"
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  disabled={isScriptLoaded}
                />
                {isScriptLoaded ? (
                  <button
                    onClick={() => handleUnloadScript(scriptId)}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                  >
                    <IconPlayerStop size={16} />
                    Unload
                  </button>
                ) : (
                  <button
                    onClick={handleLoadScript}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                  >
                    <IconPlayerPlay size={16} />
                    Load & Run
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={scriptCode}
                  onChange={(e) => setScriptCode(e.target.value)}
                  className="w-full h-[500px] rounded-lg border border-neutral-300 px-4 py-3 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
                  placeholder="Enter your Lua script here..."
                  spellCheck={false}
                />
              </div>

              <div className="apple-card rounded-2xl p-5 bg-blue-50 border border-blue-200">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Lua Script API</h4>
                <div className="text-sm text-black opacity-80 space-y-2">
                  <p><strong>Callbacks:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code>on_packet(packet)</code> - Called for each captured packet</li>
                    <li><code>on_complete()</code> - Called when capture completes</li>
                  </ul>
                  <p><strong>Functions:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code>alert(severity, message, details)</code> - Create an alert</li>
                    <li><code>log(level, message)</code> - Log a message</li>
                  </ul>
                  <p><strong>Packet Fields:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code>packet.no</code>, <code>packet.timestamp</code>, <code>packet.source</code>, <code>packet.destination</code></li>
                    <li><code>packet.protocol</code>, <code>packet.length</code>, <code>packet.info</code></li>
                    <li><code>packet.srcPort</code>, <code>packet.dstPort</code> (when available)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Built-in Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadTemplate(template.id)}
                      className="mt-3 flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
                    >
                      <IconDownload size={14} />
                      Load Template
                    </button>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No templates available.
                </div>
              )}
            </div>
          )}

          {/* Loaded Scripts Tab */}
          {activeTab === 'loaded' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Active Scripts</h3>
              <div className="space-y-2">
                {loadedScripts.map(script => (
                  <div
                    key={script.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center gap-3">
                      <IconScript size={20} className="text-purple-600" />
                      <div>
                        <div className="font-medium">{script.id}</div>
                        {script.hasResults && (
                          <div className="text-xs text-green-600">Has Results</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {script.hasResults && (
                        <button
                          onClick={() => handleViewResults(script.id)}
                          className="rounded-lg border border-blue-600 text-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          View Results
                        </button>
                      )}
                      <button
                        onClick={() => handleUnloadScript(script.id)}
                        className="rounded-lg border border-red-600 text-red-600 px-3 py-1 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {loadedScripts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No scripts loaded. Create and load a script from the Editor tab.
                </div>
              )}
            </div>
          )}

          {/* Logs & Alerts Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Script Output</h3>
                <button
                  onClick={() => {
                    setAlerts([]);
                    setLogs([]);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <IconTrash size={14} />
                  Clear All
                </button>
              </div>

              {/* Alerts */}
              {alerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Alerts</h4>
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{alert.message}</span>
                            <span className="text-xs text-gray-500">Packet #{alert.packet}</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {alert.details}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Script: {alert.scriptId}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Logs */}
              {logs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Logs</h4>
                  <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-3 font-mono text-xs max-h-[400px] overflow-y-auto">
                    {logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        <span className={`
                          ${log.level === 'error' ? 'text-red-600' : ''}
                          ${log.level === 'warning' ? 'text-yellow-600' : ''}
                          ${log.level === 'info' ? 'text-blue-600' : ''}
                        `}>
                          [{log.level.toUpperCase()}]
                        </span>{' '}
                        <span className="text-gray-500">#{log.packet}</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">[{log.scriptId}]</span>{' '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alerts.length === 0 && logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No alerts or logs yet. Loaded scripts will output here.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LuaScriptEditor;
