import React, { useState, useEffect } from 'react';
import { IconFileText, IconFileTypePdf, IconFileDownload, IconTrash, IconPlus, IconCheck, IconSettings, IconBrandGithub } from '@tabler/icons-react';
import { Report, ReportTemplate, ReportFinding, ReportMetadata, ExportConfig } from '@/types';
import { cn } from '@/lib/utils';

type ReportTab = 'reports' | 'templates' | 'export' | 'findings';

export const ReportingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [, setSelectedReport] = useState<Report | null>(null);
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
  const [findings] = useState<ReportFinding[]>([]);

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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">Reporting & Exporting</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconFileText size={18} />
          Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconSettings size={18} />
          Templates ({templates.length})
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
          <IconFileDownload size={18} />
          Export
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'findings'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconCheck size={18} />
          Findings ({findings.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Generate Report Form */}
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 font-bold text-black uppercase tracking-wide">Generate New Report</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Project Name</label>
                  <input
                    type="text"
                    value={reportForm.projectName}
                    onChange={(e) => setReportForm({ ...reportForm, projectName: e.target.value })}
                    placeholder="My Security Assessment"
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-black">Target URLs</label>
                    <button
                      onClick={addTargetUrl}
                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 shadow-sm flex items-center gap-1"
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
                          className="apple-input flex-1 rounded-xl px-4 py-2.5 text-sm text-black"
                        />
                        {reportForm.targetUrls.length > 1 && (
                          <button
                            onClick={() => removeTargetUrl(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <IconTrash size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Template</label>
                  <select
                    value={reportForm.templateId}
                    onChange={(e) => setReportForm({ ...reportForm, templateId: e.target.value })}
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
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
                  <label className="mb-2 block text-sm font-semibold text-black">Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="html"
                        checked={reportForm.format === 'html'}
                        onChange={(e) => setReportForm({ ...reportForm, format: e.target.value as any })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-black">HTML</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="pdf"
                        checked={reportForm.format === 'pdf'}
                        onChange={(e) => setReportForm({ ...reportForm, format: e.target.value as any })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-black">PDF</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {reportForm.format === 'pdf' ? <IconFileTypePdf size={18} /> : <IconFileText size={18} />}
                  {generating ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="apple-card cursor-pointer rounded-2xl p-5 hover:bg-gray-50 transition-all border border-gray-200"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {report.type === 'pdf' ? (
                          <IconFileTypePdf size={18} className="text-red-600" />
                        ) : (
                          <IconFileText size={18} className="text-blue-600" />
                        )}
                        <span className="font-bold text-black">{report.name}</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          {report.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-black opacity-80">
                        <span>Findings: {report.findings.length}</span>
                        <span>Size: {formatFileSize(report.size)}</span>
                        <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-black opacity-60">
                        Template: {report.template} | Project: {report.metadata.projectName}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(report.id, 'pdf');
                        }}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 shadow-sm"
                      >
                        <IconFileDownload size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 shadow-sm"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconFileText size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
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
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
              >
                <IconPlus size={18} />
                Create Template
              </button>
            </div>

            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconSettings size={18} className="text-blue-600" />
                        <span className="font-bold text-black">{template.name}</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          {template.type}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                          {template.format.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-black opacity-80">{template.description}</p>
                      <p className="mt-1 text-xs text-black opacity-60">
                        {template.sections.length} sections | {template.customizable ? 'Customizable' : 'Fixed'}
                      </p>
                    </div>
                    {template.customizable && (
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 shadow-sm"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {templates.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconSettings size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
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
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 font-bold text-black uppercase tracking-wide">Export Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Export Format</label>
                  <select
                    value={exportConfig.format}
                    onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value as any })}
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
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
                    <span className="text-sm text-black">Include Evidence</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeSummary}
                      onChange={(e) => setExportConfig({ ...exportConfig, includeSummary: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-black">Include Summary</span>
                  </label>
                </div>

                <button
                  onClick={handleExportFindings}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconFileDownload size={18} />
                  Export to File
                </button>
              </div>
            </div>

            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 font-bold text-black uppercase tracking-wide">Issue Tracker Integration</h3>
              <div className="space-y-2">
                <button
                  onClick={handleExportToJira}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconFileDownload size={18} />
                  Export to Jira
                </button>
                <button
                  onClick={handleExportToGitHub}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 shadow-sm"
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
          <div className="space-y-3">
            <p className="text-sm text-black opacity-80">
              Findings will be populated from your scans and tests. {findings.length} findings ready for reporting.
            </p>
            {findings.length === 0 && (
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconCheck size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
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
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-black uppercase tracking-wide">Create Report Template</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows={3}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Template Type</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                >
                  <option value="technical">Technical Report</option>
                  <option value="executive">Executive Summary</option>
                  <option value="compliance">Compliance Report</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Format</label>
                <select
                  value={templateForm.format}
                  onChange={(e) => setTemplateForm({ ...templateForm, format: e.target.value as any })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
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
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
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
