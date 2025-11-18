import React, { useState, useEffect } from 'react';
import { IconFileImport, IconFileExport, IconTerminal, IconCloud, IconRefresh, IconPlus, IconTrash, IconCheck, IconX, IconDeviceFloppy } from '@tabler/icons-react';
import { ImportConfig, ImportResult, ExportResult, ToolIntegration, CICDConfig } from '@/types';
import { cn } from '@/lib/utils';

type IETab = 'import' | 'export' | 'tools' | 'cicd';

export const ImportExportToolPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IETab>('import');
  const [toolIntegrations, setToolIntegrations] = useState<ToolIntegration[]>([]);
  const [cicdConfig, setCicdConfig] = useState<CICDConfig | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [, setExporting] = useState(false);

  // Import configuration
  const [importConfig, setImportConfig] = useState<Partial<ImportConfig>>({
    source: 'burp',
    filePath: '',
    mergeWithExisting: false,
    importOptions: {
      importHistory: true,
      importFindings: true,
      importConfiguration: false,
      importScope: true,
      preserveTimestamps: true,
    },
  });

  // Tool integration form
  const [toolForm, setToolForm] = useState<Partial<ToolIntegration>>({
    tool: 'zap',
    enabled: true,
    path: '',
    arguments: [],
    autoImportResults: false,
  });

  // CI/CD configuration form
  const [cicdForm, setCicdForm] = useState<Partial<CICDConfig>>({
    provider: 'github',
    webhookUrl: '',
    apiKey: '',
    triggerOn: ['push', 'pull_request'],
    failOnSeverity: ['critical', 'high'],
    generateReport: true,
  });

  useEffect(() => {
    loadToolIntegrations();
    loadCICDConfig();

    if (window.api) {
      window.api.onImportComplete((result) => {
        setImportResults((prev) => [result, ...prev]);
        setImporting(false);
      });

      window.api.onExportComplete((result) => {
        setExportResults((prev) => [result, ...prev]);
        setExporting(false);
      });
    }
  }, []);

  const loadToolIntegrations = async () => {
    if (!window.api) return;
    const result = await window.api.toolIntegrationGet();
    if (result.success && result.integrations) {
      setToolIntegrations(result.integrations);
    }
  };

  const loadCICDConfig = async () => {
    if (!window.api) return;
    const result = await window.api.cicdConfigGet();
    if (result.success && result.config) {
      setCicdConfig(result.config);
      setCicdForm(result.config);
    }
  };

  const handleImportFile = async () => {
    if (!window.api || !importConfig.filePath) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);

    const config: ImportConfig = {
      source: importConfig.source!,
      filePath: importConfig.filePath,
      mergeWithExisting: importConfig.mergeWithExisting!,
      importOptions: importConfig.importOptions!,
    };

    const result = await window.api.importFromFile(config);
    setImporting(false);

    if (result.success && result.result) {
      alert(`Imported successfully: ${result.result.itemsImported} items`);
      setImportConfig({ ...importConfig, filePath: '' });
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  const handleAddToolIntegration = async () => {
    if (!window.api || !toolForm.tool || !toolForm.path) {
      alert('Please fill in all required fields');
      return;
    }

    const integration: ToolIntegration = {
      tool: toolForm.tool,
      enabled: toolForm.enabled!,
      path: toolForm.path,
      arguments: toolForm.arguments!,
      autoImportResults: toolForm.autoImportResults!,
    };

    const result = await window.api.toolIntegrationAdd(integration);
    if (result.success) {
      loadToolIntegrations();
      setToolForm({ tool: 'zap', enabled: true, path: '', arguments: [], autoImportResults: false });
      alert('Tool integration added successfully');
    } else {
      alert(`Failed to add integration: ${result.error}`);
    }
  };

  const handleRemoveToolIntegration = async (tool: string) => {
    if (!window.api || !confirm(`Remove ${tool} integration?`)) return;

    const result = await window.api.toolIntegrationRemove(tool);
    if (result.success) {
      loadToolIntegrations();
    }
  };

  const handleRunTool = async (tool: string) => {
    if (!window.api) return;

    const target = prompt('Enter target URL:');
    if (!target) return;

    const result = await window.api.toolIntegrationRun(tool, target, {});
    if (result.success) {
      alert(`${tool} scan completed successfully`);
    } else {
      alert(`Scan failed: ${result.error}`);
    }
  };

  const handleSaveCICDConfig = async () => {
    if (!window.api || !cicdForm.webhookUrl || !cicdForm.apiKey) {
      alert('Please fill in all required fields');
      return;
    }

    const config: CICDConfig = {
      provider: cicdForm.provider!,
      webhookUrl: cicdForm.webhookUrl,
      apiKey: cicdForm.apiKey,
      triggerOn: cicdForm.triggerOn!,
      failOnSeverity: cicdForm.failOnSeverity!,
      generateReport: cicdForm.generateReport!,
    };

    const result = await window.api.cicdConfigSave(config);
    if (result.success) {
      setCicdConfig(config);
      alert('CI/CD configuration saved successfully');
    } else {
      alert(`Failed to save configuration: ${result.error}`);
    }
  };

  const handleTriggerCIScan = async () => {
    if (!window.api || !cicdConfig) {
      alert('Please configure CI/CD first');
      return;
    }

    const result = await window.api.cicdTriggerScan(cicdConfig);
    if (result.success && result.jobId) {
      alert(`CI/CD scan triggered. Job ID: ${result.jobId}`);
    } else {
      alert(`Failed to trigger scan: ${result.error}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">Import/Export & Tool Interoperability</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
        <button
          onClick={() => setActiveTab('import')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'import'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconFileImport size={18} />
          Import ({importResults.length})
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'export'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconFileExport size={18} />
          Export ({exportResults.length})
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'tools'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconTerminal size={18} />
          Tools ({toolIntegrations.length})
        </button>
        <button
          onClick={() => setActiveTab('cicd')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'cicd'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconCloud size={18} />
          CI/CD
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-3">Import Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Source Format</label>
                  <select
                    value={importConfig.source}
                    onChange={(e) => setImportConfig({ ...importConfig, source: e.target.value as any })}
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  >
                    <option value="burp">Burp Suite</option>
                    <option value="zap">OWASP ZAP</option>
                    <option value="pcap">PCAP File</option>
                    <option value="har">HAR (HTTP Archive)</option>
                    <option value="postman">Postman Collection</option>
                    <option value="openapi">OpenAPI Specification</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">File Path</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={importConfig.filePath}
                      onChange={(e) => setImportConfig({ ...importConfig, filePath: e.target.value })}
                      placeholder="C:\path\to\file.burp"
                      className="apple-input flex-1 rounded-xl px-4 py-2.5 text-sm text-black"
                    />
                    <button
                      onClick={() => {
                        const path = prompt('Enter file path:');
                        if (path) setImportConfig({ ...importConfig, filePath: path });
                      }}
                      className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
                    >
                      Browse
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Import Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importConfig.importOptions?.importHistory}
                        onChange={(e) =>
                          setImportConfig({
                            ...importConfig,
                            importOptions: { ...importConfig.importOptions!, importHistory: e.target.checked },
                          })
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-black">Import HTTP History</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importConfig.importOptions?.importFindings}
                        onChange={(e) =>
                          setImportConfig({
                            ...importConfig,
                            importOptions: { ...importConfig.importOptions!, importFindings: e.target.checked },
                          })
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-black">Import Findings</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importConfig.importOptions?.importConfiguration}
                        onChange={(e) =>
                          setImportConfig({
                            ...importConfig,
                            importOptions: { ...importConfig.importOptions!, importConfiguration: e.target.checked },
                          })
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-black">Import Configuration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importConfig.mergeWithExisting}
                        onChange={(e) => setImportConfig({ ...importConfig, mergeWithExisting: e.target.checked })}
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm text-black">Merge with Existing Data</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleImportFile}
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconFileImport size={18} />
                  {importing ? 'Importing...' : 'Import File'}
                </button>
              </div>
            </div>

            {/* Import Results */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-black uppercase tracking-wide">Import History</h3>
              {importResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-2xl border-2 p-5',
                    result.success
                      ? 'border-green-600 bg-green-50'
                      : 'border-red-600 bg-red-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <IconCheck size={18} className="text-green-600" />
                    ) : (
                      <IconX size={18} className="text-red-600" />
                    )}
                    <span className="font-bold text-black uppercase tracking-wide">{result.success ? 'Import Successful' : 'Import Failed'}</span>
                  </div>
                  {result.success && (
                    <div className="space-y-1 text-sm text-black">
                      <p>Items Imported: {result.itemsImported}</p>
                      <p>Requests: {result.requestsImported}</p>
                      <p>Findings: {result.findingsImported}</p>
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      <p>Errors: {result.errors.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-3">Export Data</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const path = prompt('Export to (path):');
                    if (path && window.api) {
                      window.api.exportToTool('burp', {}, { filePath: path });
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-all"
                >
                  <IconFileExport size={18} className="text-blue-600" />
                  <span className="font-semibold text-black">Export to Burp Suite Format</span>
                </button>
                <button
                  onClick={() => {
                    const path = prompt('Export to (path):');
                    if (path && window.api) {
                      window.api.exportToTool('zap', {}, { filePath: path });
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-all"
                >
                  <IconFileExport size={18} className="text-blue-600" />
                  <span className="font-semibold text-black">Export to OWASP ZAP Format</span>
                </button>
              </div>
            </div>

            {/* Export Results */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-black uppercase tracking-wide">Export History</h3>
              {exportResults.map((result, index) => (
                <div
                  key={index}
                  className="rounded-2xl border-2 border-green-600 bg-green-50 p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconCheck size={18} className="text-green-600" />
                    <span className="font-bold text-black uppercase tracking-wide">Export Successful</span>
                  </div>
                  <div className="space-y-1 text-sm text-black">
                    <p>File: {result.filePath}</p>
                    <p>Format: {result.format}</p>
                    <p>Items: {result.itemsExported}</p>
                    <p>Size: {(result.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-3">Add Tool Integration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Tool</label>
                  <select
                    value={toolForm.tool}
                    onChange={(e) => setToolForm({ ...toolForm, tool: e.target.value as any })}
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  >
                    <option value="zap">OWASP ZAP</option>
                    <option value="metasploit">Metasploit</option>
                    <option value="nmap">Nmap</option>
                    <option value="sqlmap">SQLMap</option>
                    <option value="nikto">Nikto</option>
                    <option value="wpscan">WPScan</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Executable Path</label>
                  <input
                    type="text"
                    value={toolForm.path}
                    onChange={(e) => setToolForm({ ...toolForm, path: e.target.value })}
                    placeholder="C:\Program Files\tool\tool.exe"
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={toolForm.autoImportResults}
                    onChange={(e) => setToolForm({ ...toolForm, autoImportResults: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm text-black">Auto-import results after scan</span>
                </label>

                <button
                  onClick={handleAddToolIntegration}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconPlus size={18} />
                  Add Integration
                </button>
              </div>
            </div>

            {/* Tool Integrations List */}
            <div className="space-y-3">
              {toolIntegrations.map((integration, index) => (
                <div
                  key={index}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconTerminal size={18} className="text-blue-600" />
                        <span className="font-bold text-black uppercase tracking-wide">{integration.tool}</span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-semibold',
                            integration.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {integration.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-black opacity-80">{integration.path}</p>
                      {integration.autoImportResults && (
                        <p className="mt-1 text-xs text-black opacity-60">Auto-import enabled</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRunTool(integration.tool)}
                        className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                      >
                        Run
                      </button>
                      <button
                        onClick={() => handleRemoveToolIntegration(integration.tool)}
                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {toolIntegrations.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconTerminal size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
                    No tool integrations configured. Add integrations to work with external security tools.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CI/CD Tab */}
        {activeTab === 'cicd' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="text-lg font-bold text-black uppercase tracking-wide mb-3">CI/CD Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">CI/CD Provider</label>
                  <select
                    value={cicdForm.provider}
                    onChange={(e) => setCicdForm({ ...cicdForm, provider: e.target.value as any })}
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  >
                    <option value="github">GitHub Actions</option>
                    <option value="gitlab">GitLab CI/CD</option>
                    <option value="jenkins">Jenkins</option>
                    <option value="azure">Azure DevOps</option>
                    <option value="circleci">CircleCI</option>
                    <option value="travis">Travis CI</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Webhook URL</label>
                  <input
                    type="url"
                    value={cicdForm.webhookUrl}
                    onChange={(e) => setCicdForm({ ...cicdForm, webhookUrl: e.target.value })}
                    placeholder="https://api.github.com/repos/user/repo/dispatches"
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">API Key / Token</label>
                  <input
                    type="password"
                    value={cicdForm.apiKey}
                    onChange={(e) => setCicdForm({ ...cicdForm, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Fail Pipeline On Severity</label>
                  <div className="flex gap-2">
                    {['critical', 'high', 'medium', 'low'].map((severity) => (
                      <label key={severity} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={cicdForm.failOnSeverity?.includes(severity)}
                          onChange={(e) => {
                            const severities = cicdForm.failOnSeverity || [];
                            if (e.target.checked) {
                              setCicdForm({ ...cicdForm, failOnSeverity: [...severities, severity] });
                            } else {
                              setCicdForm({
                                ...cicdForm,
                                failOnSeverity: severities.filter((s) => s !== severity),
                              });
                            }
                          }}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-sm capitalize text-black">{severity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cicdForm.generateReport}
                    onChange={(e) => setCicdForm({ ...cicdForm, generateReport: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm text-black">Generate report after scan</span>
                </label>

                <button
                  onClick={handleSaveCICDConfig}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconDeviceFloppy size={18} />
                  Save Configuration
                </button>
              </div>
            </div>

            {cicdConfig && (
              <div className="rounded-2xl border-2 border-green-600 bg-green-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <IconCheck size={18} className="text-green-600" />
                  <span className="font-bold text-black uppercase tracking-wide">CI/CD Configured</span>
                </div>
                <div className="space-y-1 text-sm text-black">
                  <p>Provider: {cicdConfig.provider}</p>
                  <p>Webhook: {cicdConfig.webhookUrl}</p>
                </div>
                <button
                  onClick={handleTriggerCIScan}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                >
                  <IconRefresh size={18} />
                  Trigger CI/CD Scan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
