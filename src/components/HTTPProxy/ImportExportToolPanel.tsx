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
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Import/Export & Tool Interoperability</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('import')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'import'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconFileImport size={18} />
            Import ({importResults.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'export'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconFileExport size={18} />
            Export ({exportResults.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'tools'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconTerminal size={18} />
            Tools ({toolIntegrations.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('cicd')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'cicd'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconCloud size={18} />
            CI/CD
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Import Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Source Format</label>
                  <select
                    value={importConfig.source}
                    onChange={(e) => setImportConfig({ ...importConfig, source: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
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
                  <label className="mb-1 block text-sm font-medium">File Path</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={importConfig.filePath}
                      onChange={(e) => setImportConfig({ ...importConfig, filePath: e.target.value })}
                      placeholder="C:\path\to\file.burp"
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <button
                      onClick={() => {
                        const path = prompt('Enter file path:');
                        if (path) setImportConfig({ ...importConfig, filePath: path });
                      }}
                      className="rounded-lg bg-gray-200 px-3 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      Browse
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Import Options</label>
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
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Import HTTP History</span>
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
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Import Findings</span>
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
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Import Configuration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importConfig.mergeWithExisting}
                        onChange={(e) => setImportConfig({ ...importConfig, mergeWithExisting: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Merge with Existing Data</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleImportFile}
                  disabled={importing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  <IconFileImport size={18} />
                  {importing ? 'Importing...' : 'Import File'}
                </button>
              </div>
            </div>

            {/* Import Results */}
            <div className="space-y-2">
              <h3 className="font-semibold">Import History</h3>
              {importResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-lg border p-4',
                    result.success
                      ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                      : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <IconCheck size={18} className="text-green-600" />
                    ) : (
                      <IconX size={18} className="text-red-600" />
                    )}
                    <span className="font-semibold">{result.success ? 'Import Successful' : 'Import Failed'}</span>
                  </div>
                  {result.success && (
                    <div className="space-y-1 text-sm">
                      <p>Items Imported: {result.itemsImported}</p>
                      <p>Requests: {result.requestsImported}</p>
                      <p>Findings: {result.findingsImported}</p>
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
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
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Export Data</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const path = prompt('Export to (path):');
                    if (path && window.api) {
                      window.api.exportToTool('burp', {}, { filePath: path });
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <IconFileExport size={18} />
                  <span>Export to Burp Suite Format</span>
                </button>
                <button
                  onClick={() => {
                    const path = prompt('Export to (path):');
                    if (path && window.api) {
                      window.api.exportToTool('zap', {}, { filePath: path });
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <IconFileExport size={18} />
                  <span>Export to OWASP ZAP Format</span>
                </button>
              </div>
            </div>

            {/* Export Results */}
            <div className="space-y-2">
              <h3 className="font-semibold">Export History</h3>
              {exportResults.map((result, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconCheck size={18} className="text-green-600" />
                    <span className="font-semibold">Export Successful</span>
                  </div>
                  <div className="space-y-1 text-sm">
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
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Add Tool Integration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tool</label>
                  <select
                    value={toolForm.tool}
                    onChange={(e) => setToolForm({ ...toolForm, tool: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
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
                  <label className="mb-1 block text-sm font-medium">Executable Path</label>
                  <input
                    type="text"
                    value={toolForm.path}
                    onChange={(e) => setToolForm({ ...toolForm, path: e.target.value })}
                    placeholder="C:\Program Files\tool\tool.exe"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={toolForm.autoImportResults}
                    onChange={(e) => setToolForm({ ...toolForm, autoImportResults: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Auto-import results after scan</span>
                </label>

                <button
                  onClick={handleAddToolIntegration}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  <IconPlus size={18} />
                  Add Integration
                </button>
              </div>
            </div>

            {/* Tool Integrations List */}
            <div className="space-y-2">
              {toolIntegrations.map((integration, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconTerminal size={18} className="text-blue-500" />
                        <span className="font-semibold">{integration.tool}</span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            integration.enabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          )}
                        >
                          {integration.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{integration.path}</p>
                      {integration.autoImportResults && (
                        <p className="mt-1 text-xs text-gray-500">Auto-import enabled</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRunTool(integration.tool)}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
                      >
                        Run
                      </button>
                      <button
                        onClick={() => handleRemoveToolIntegration(integration.tool)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {toolIntegrations.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <IconTerminal size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
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
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">CI/CD Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">CI/CD Provider</label>
                  <select
                    value={cicdForm.provider}
                    onChange={(e) => setCicdForm({ ...cicdForm, provider: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
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
                  <label className="mb-1 block text-sm font-medium">Webhook URL</label>
                  <input
                    type="url"
                    value={cicdForm.webhookUrl}
                    onChange={(e) => setCicdForm({ ...cicdForm, webhookUrl: e.target.value })}
                    placeholder="https://api.github.com/repos/user/repo/dispatches"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">API Key / Token</label>
                  <input
                    type="password"
                    value={cicdForm.apiKey}
                    onChange={(e) => setCicdForm({ ...cicdForm, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Fail Pipeline On Severity</label>
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
                          className="h-4 w-4"
                        />
                        <span className="text-sm capitalize">{severity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cicdForm.generateReport}
                    onChange={(e) => setCicdForm({ ...cicdForm, generateReport: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Generate report after scan</span>
                </label>

                <button
                  onClick={handleSaveCICDConfig}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  <IconDeviceFloppy size={18} />
                  Save Configuration
                </button>
              </div>
            </div>

            {cicdConfig && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
                <div className="mb-3 flex items-center gap-2">
                  <IconCheck size={18} className="text-green-600" />
                  <span className="font-semibold">CI/CD Configured</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Provider: {cicdConfig.provider}</p>
                  <p>Webhook: {cicdConfig.webhookUrl}</p>
                </div>
                <button
                  onClick={handleTriggerCIScan}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
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
