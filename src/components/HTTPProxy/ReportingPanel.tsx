import React, { useState, useEffect } from 'react';
import { IconFileText, IconFileTypePdf, IconFileDownload, IconTrash, IconPlus, IconCheck, IconSettings, IconBrandGithub } from '@tabler/icons-react';
import { Report, ReportTemplate, ReportFinding, ReportMetadata, ExportConfig, ExportResult } from '@/types';
import { cn } from '@/lib/utils';

type ReportTab = 'reports' | 'templates' | 'export' | 'findings';

export const ReportingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Report generation form
  const [reportForm, setReportForm] = useState({
    projectName: '',
    targetUrls: [''],
    templateId: '',
    format: 'html' as 'html' | 'pdf',
  });

  // Template editor
  const [templateForm, setTemplateForm] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    type: 'technical',
    format: 'html',
    sections: [],
  });

  // Export configuration
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'json',
    includeEvidence: true,
    includeSummary: true,
    filterBySeverity: [],
  });

  // Findings to include in report
  const [findings, setFindings] = useState<ReportFinding[]>([]);

  useEffect(() => {
    loadReports();
    loadTemplates();

    if (window.api) {
      window.api.onReportGenerated((report) => {
        setReports((prev) => [...prev, report]);
      });
    }
  }, []);

  const loadReports = async () => {
    if (!window.api) return;
    const result = await window.api.reportGetAll();
    if (result.success && result.reports) {
      setReports(result.reports);
    }
  };

  const loadTemplates = async () => {
    if (!window.api) return;
    const result = await window.api.reportGetTemplates();
    if (result.success && result.templates) {
      setTemplates(result.templates);
    }
  };

  const handleGenerateReport = async () => {
    if (!window.api || !reportForm.projectName || !reportForm.templateId) {
      alert('Please fill in all required fields');
      return;
    }

    setGenerating(true);

    // Create mock findings for demonstration
    const mockFindings: ReportFinding[] = findings.length > 0 ? findings : [
      {
        id: '1',
        severity: 'high',
        title: 'SQL Injection',
        description: 'SQL injection vulnerability found',
        evidence: ['Payload: \' OR 1=1--', 'Response time increased significantly'],
        remediation: 'Use parameterized queries',
        cwe: 'CWE-89',
        cvss: 8.5,
        affectedUrls: reportForm.targetUrls.filter(Boolean),
        category: 'Injection',
      },
    ];

    const metadata: ReportMetadata = {
      projectName: reportForm.projectName,
      scanDate: new Date().toISOString(),
      scanDuration: '15 minutes',
      targetUrls: reportForm.targetUrls.filter(Boolean),
      totalFindings: mockFindings.length,
      findingsBySeverity: {
        critical: mockFindings.filter((f) => f.severity === 'critical').length,
        high: mockFindings.filter((f) => f.severity === 'high').length,
        medium: mockFindings.filter((f) => f.severity === 'medium').length,
        low: mockFindings.filter((f) => f.severity === 'low').length,
        info: mockFindings.filter((f) => f.severity === 'info').length,
      },
      scanner: 'NMAT Security Scanner',
      version: '1.0.0',
    };

    const result = await window.api.reportGenerate(
      mockFindings,
      metadata,
      reportForm.templateId,
      reportForm.format
    );

    setGenerating(false);

    if (result.success && result.report) {
      alert(`Report generated successfully: ${result.report.name}`);
      loadReports();
      setReportForm({
        projectName: '',
        targetUrls: [''],
        templateId: '',
        format: 'html',
      });
    } else {
      alert(`Failed to generate report: ${result.error}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.api || !confirm('Are you sure you want to delete this report?')) return;

    const result = await window.api.reportDelete(reportId);
    if (result.success) {
      loadReports();
    }
  };

  const handleExportReport = async (reportId: string, format: string) => {
    if (!window.api) return;

    const result = await window.api.reportExport(reportId, format);
    if (result.success && result.filePath) {
      alert(`Report exported to: ${result.filePath}`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!window.api || !templateForm.name) return;

    const template: ReportTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      description: templateForm.description || '',
      type: templateForm.type || 'technical',
      format: templateForm.format || 'html',
      sections: templateForm.sections || [],
      customizable: true,
    };

    const result = await window.api.reportSaveTemplate(template);
    if (result.success) {
      loadTemplates();
      setShowTemplateEditor(false);
      setTemplateForm({ name: '', description: '', type: 'technical', format: 'html', sections: [] });
    } else {
      alert(`Failed to save template: ${result.error}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.api || !confirm('Are you sure you want to delete this template?')) return;

    const result = await window.api.reportDeleteTemplate(templateId);
    if (result.success) {
      loadTemplates();
    }
  };

  const handleExportFindings = async () => {
    if (!window.api || findings.length === 0) {
      alert('No findings to export');
      return;
    }

    const result = await window.api.exportToFormat(findings, exportConfig);
    if (result.success && result.result) {
      alert(`Exported ${result.result.itemsExported} findings to ${result.result.filePath}`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleExportToJira = async () => {
    if (!window.api || findings.length === 0) {
      alert('No findings to export');
      return;
    }

    const jiraConfig = {
      url: prompt('Enter Jira URL:'),
      apiKey: prompt('Enter Jira API Key:'),
      projectKey: prompt('Enter Jira Project Key:'),
    };

    if (!jiraConfig.url || !jiraConfig.apiKey || !jiraConfig.projectKey) return;

    const result = await window.api.exportToJira(findings, jiraConfig);
    if (result.success) {
      alert(`Created ${result.issuesCreated} issues in Jira`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleExportToGitHub = async () => {
    if (!window.api || findings.length === 0) {
      alert('No findings to export');
      return;
    }

    const githubConfig = {
      repo: prompt('Enter GitHub repository (owner/repo):'),
      token: prompt('Enter GitHub Personal Access Token:'),
    };

    if (!githubConfig.repo || !githubConfig.token) return;

    const result = await window.api.exportToGitHub(findings, githubConfig);
    if (result.success) {
      alert(`Created ${result.issuesCreated} issues in GitHub`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const addTargetUrl = () => {
    setReportForm({
      ...reportForm,
      targetUrls: [...reportForm.targetUrls, ''],
    });
  };

  const updateTargetUrl = (index: number, value: string) => {
    const urls = [...reportForm.targetUrls];
    urls[index] = value;
    setReportForm({ ...reportForm, targetUrls: urls });
  };

  const removeTargetUrl = (index: number) => {
    const urls = [...reportForm.targetUrls];
    urls.splice(index, 1);
    setReportForm({ ...reportForm, targetUrls: urls });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reporting & Exporting</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'reports'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconFileText size={18} />
            Reports ({reports.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'templates'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconSettings size={18} />
            Templates ({templates.length})
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
            <IconFileDownload size={18} />
            Export
          </div>
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'findings'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconCheck size={18} />
            Findings ({findings.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Generate Report Form */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Generate New Report</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Project Name</label>
                  <input
                    type="text"
                    value={reportForm.projectName}
                    onChange={(e) => setReportForm({ ...reportForm, projectName: e.target.value })}
                    placeholder="My Security Assessment"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium">Target URLs</label>
                    <button
                      onClick={addTargetUrl}
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                    >
                      <IconPlus size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {reportForm.targetUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateTargetUrl(index, e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                        />
                        {reportForm.targetUrls.length > 1 && (
                          <button
                            onClick={() => removeTargetUrl(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <IconTrash size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Template</label>
                  <select
                    value={reportForm.templateId}
                    onChange={(e) => setReportForm({ ...reportForm, templateId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">-- Select Template --</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="html"
                        checked={reportForm.format === 'html'}
                        onChange={(e) => setReportForm({ ...reportForm, format: e.target.value as any })}
                        className="h-4 w-4"
                      />
                      <span>HTML</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="pdf"
                        checked={reportForm.format === 'pdf'}
                        onChange={(e) => setReportForm({ ...reportForm, format: e.target.value as any })}
                        className="h-4 w-4"
                      />
                      <span>PDF</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {reportForm.format === 'pdf' ? <IconFileTypePdf size={18} /> : <IconFileText size={18} />}
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {report.type === 'pdf' ? (
                          <IconFileTypePdf size={18} className="text-red-500" />
                        ) : (
                          <IconFileText size={18} className="text-blue-500" />
                        )}
                        <span className="font-semibold">{report.name}</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {report.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Findings: {report.findings.length}</span>
                        <span>Size: {formatFileSize(report.size)}</span>
                        <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Template: {report.template} | Project: {report.metadata.projectName}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'pdf');
                        }}
                        className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                      >
                        <IconFileDownload size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <IconFileText size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No reports generated yet. Fill out the form above to create your first report.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowTemplateEditor(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                <IconPlus size={18} />
                Create Template
              </button>
            </div>

            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconSettings size={18} className="text-blue-500" />
                        <span className="font-semibold">{template.name}</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {template.type}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {template.format.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {template.sections.length} sections | {template.customizable ? 'Customizable' : 'Fixed'}
                      </p>
                    </div>
                    {template.customizable && (
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <IconSettings size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No templates available. Click "Create Template" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Export Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Export Format</label>
                  <select
                    value={exportConfig.format}
                    onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeEvidence}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeEvidence: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Include Evidence</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeSummary}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeSummary: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Include Summary</span>
                  </label>
                </div>

                <button
                  onClick={handleExportFindings}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  <IconFileDownload size={18} />
                  Export to File
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Issue Tracker Integration</h3>
              <div className="space-y-2">
                <button
                  onClick={handleExportToJira}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <IconFileDownload size={18} />
                  Export to Jira
                </button>
                <button
                  onClick={handleExportToGitHub}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
                >
                  <IconBrandGithub size={18} />
                  Export to GitHub Issues
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Findings Tab */}
        {activeTab === 'findings' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Findings will be populated from your scans and tests. {findings.length} findings ready for reporting.
            </p>
            {findings.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                <IconCheck size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  No findings available. Run scans to populate findings for reporting.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold">Create Report Template</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Template Type</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="technical">Technical Report</option>
                  <option value="executive">Executive Summary</option>
                  <option value="compliance">Compliance Report</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Format</label>
                <select
                  value={templateForm.format}
                  onChange={(e) => setTemplateForm({ ...templateForm, format: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="html">HTML</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTemplateEditor(false);
                  setTemplateForm({ name: '', description: '', type: 'technical', format: 'html', sections: [] });
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
