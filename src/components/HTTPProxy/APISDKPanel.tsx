import React, { useState, useEffect } from 'react';
import {
  ExtensionProject,
  ExtensionFile,
  APIEndpointDoc,
  SDKExample,
  APIConfiguration,
  ExtensionTestResult,
  PythonExtension,
  JavaExtension,
  ExtensionLog,
  RESTAPICall,
} from '../../types';

type SDKTab = 'projects' | 'api-docs' | 'examples' | 'rest-api' | 'logs';

interface CodeEditorModalProps {
  file: ExtensionFile;
  onSave: (content: string) => void;
  onClose: () => void;
}

const CodeEditorModal: React.FC<CodeEditorModalProps> = ({ file, onSave, onClose }) => {
  const [content, setContent] = useState(file.content);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">{file.path}</h3>
            <p className="text-sm text-gray-400 capitalize">{file.language} • {file.type}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="flex-1 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 bg-gray-900 text-white font-mono text-sm rounded border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(content);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const APISDKPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SDKTab>('projects');
  const [projects, setProjects] = useState<ExtensionProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ExtensionProject | null>(null);
  const [apiDocs, setApiDocs] = useState<APIEndpointDoc[]>([]);
  const [selectedApiDoc, setSelectedApiDoc] = useState<APIEndpointDoc | null>(null);
  const [examples, setExamples] = useState<SDKExample[]>([]);
  const [selectedExample, setSelectedExample] = useState<SDKExample | null>(null);
  const [apiConfig, setApiConfig] = useState<APIConfiguration | null>(null);
  const [apiCalls, setApiCalls] = useState<RESTAPICall[]>([]);
  const [logs, setLogs] = useState<ExtensionLog[]>([]);
  const [pythonExtensions, setPythonExtensions] = useState<PythonExtension[]>([]);
  const [javaExtensions, setJavaExtensions] = useState<JavaExtension[]>([]);
  const [editingFile, setEditingFile] = useState<ExtensionFile | null>(null);
  const [buildOutput, setBuildOutput] = useState<string>('');
  const [testResult, setTestResult] = useState<ExtensionTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLanguage, setNewProjectLanguage] = useState<'java' | 'python' | 'javascript'>('java');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [exampleLanguageFilter, setExampleLanguageFilter] = useState<string>('all');
  const [exampleCategoryFilter, setExampleCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
    loadApiDocs();
    loadExamples();
    loadApiConfig();
    loadApiCalls();
    loadLogs();
    loadPythonExtensions();
    loadJavaExtensions();

    // Listen for events
    window.api.onExtensionLog((log) => {
      setLogs((prev) => [log, ...prev]);
    });

    window.api.onAPICall((call) => {
      setApiCalls((prev) => [call, ...prev]);
    });

    window.api.onExtensionBuildComplete((_projectId, success, output) => {
      setBuildOutput(output);
      if (success) {
        loadProjects();
      }
    });
  }, []);

  const loadProjects = async () => {
    const result = await window.api.extensionProjectGetAll();
    if (result.success && result.projects) {
      setProjects(result.projects);
    }
  };

  const loadApiDocs = async () => {
    const result = await window.api.apiGetDocumentation();
    if (result.success && result.endpoints) {
      setApiDocs(result.endpoints);
    }
  };

  const loadExamples = async () => {
    const result = await window.api.apiGetExamples();
    if (result.success && result.examples) {
      setExamples(result.examples);
    }
  };

  const loadApiConfig = async () => {
    const result = await window.api.apiConfigGet();
    if (result.success && result.config) {
      setApiConfig(result.config);
    }
  };

  const loadApiCalls = async () => {
    const result = await window.api.apiGetCallHistory();
    if (result.success && result.calls) {
      setApiCalls(result.calls);
    }
  };

  const loadLogs = async () => {
    const result = await window.api.extensionGetLogs();
    if (result.success && result.logs) {
      setLogs(result.logs);
    }
  };

  const loadPythonExtensions = async () => {
    const result = await window.api.pythonExtensionGetLoaded();
    if (result.success && result.extensions) {
      setPythonExtensions(result.extensions);
    }
  };

  const loadJavaExtensions = async () => {
    const result = await window.api.javaExtensionGetLoaded();
    if (result.success && result.extensions) {
      setJavaExtensions(result.extensions);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName) return;
    setLoading(true);
    const result = await window.api.extensionProjectCreate(newProjectName, newProjectLanguage);
    if (result.success && result.project) {
      setProjects([...projects, result.project]);
      setNewProjectName('');
      setShowNewProjectForm(false);
    }
    setLoading(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    setLoading(true);
    const result = await window.api.extensionProjectDelete(projectId);
    if (result.success) {
      setProjects(projects.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    }
    setLoading(false);
  };

  const handleBuildProject = async (projectId: string) => {
    setLoading(true);
    setBuildOutput('Building...');
    const result = await window.api.extensionProjectBuild(projectId);
    if (result.success && result.output) {
      setBuildOutput(result.output);
    }
    setLoading(false);
  };

  const handleTestProject = async (projectId: string) => {
    setLoading(true);
    const result = await window.api.extensionProjectTest(projectId);
    if (result.success && result.result) {
      setTestResult(result.result);
    }
    setLoading(false);
  };

  const handleDeployProject = async (projectId: string) => {
    setLoading(true);
    const result = await window.api.extensionProjectDeploy(projectId);
    if (result.success) {
      alert(`Extension deployed successfully! Extension ID: ${result.extensionId}`);
    }
    setLoading(false);
  };

  const handleSaveFileContent = async (filePath: string, content: string) => {
    if (!selectedProject) return;
    const result = await window.api.extensionFileUpdate(selectedProject.id, filePath, content);
    if (result.success) {
      // Update the project's file content locally
      setSelectedProject({
        ...selectedProject,
        files: selectedProject.files.map((f) =>
          f.path === filePath ? { ...f, content } : f
        ),
      });
    }
  };

  const handleSaveApiConfig = async () => {
    if (!apiConfig) return;
    const result = await window.api.apiConfigSave(apiConfig);
    if (result.success) {
      alert('API Configuration saved successfully!');
    }
  };

  const handleGenerateApiKey = async () => {
    const result = await window.api.apiGenerateKey();
    if (result.success && result.apiKey && apiConfig) {
      setApiConfig({ ...apiConfig, apiKey: result.apiKey });
    }
  };

  const filteredExamples = examples.filter((example) => {
    if (exampleLanguageFilter !== 'all' && example.language !== exampleLanguageFilter) {
      return false;
    }
    if (exampleCategoryFilter !== 'all' && example.category !== exampleCategoryFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h2 className="text-xl font-semibold mb-4">APIs & SDK</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Extension Projects
          </button>
          <button
            onClick={() => setActiveTab('api-docs')}
            className={`px-4 py-2 rounded ${
              activeTab === 'api-docs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            API Documentation
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`px-4 py-2 rounded ${
              activeTab === 'examples'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            SDK Examples
          </button>
          <button
            onClick={() => setActiveTab('rest-api')}
            className={`px-4 py-2 rounded ${
              activeTab === 'rest-api'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            REST API
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'projects' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Extension Projects</h3>
              <button
                onClick={() => setShowNewProjectForm(!showNewProjectForm)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + New Project
              </button>
            </div>

            {showNewProjectForm && (
              <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-md font-semibold text-white mb-3">Create New Extension Project</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="My Extension"
                      className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Language</label>
                    <select
                      value={newProjectLanguage}
                      onChange={(e) => setNewProjectLanguage(e.target.value as any)}
                      className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                    >
                      <option value="java">Java</option>
                      <option value="python">Python (Jython)</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateProject}
                    disabled={loading || !newProjectName}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewProjectForm(false);
                      setNewProjectName('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No projects yet. Create your first extension project to get started!
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{project.name}</h4>
                        <p className="text-sm text-gray-400">
                          {project.language} • v{project.version} •{' '}
                          {project.files.length} files
                        </p>
                        {project.description && (
                          <p className="text-sm text-gray-300 mt-1">{project.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setSelectedProject(
                              selectedProject?.id === project.id ? null : project
                            )
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          {selectedProject?.id === project.id ? 'Hide' : 'View Files'}
                        </button>
                        <button
                          onClick={() => handleBuildProject(project.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50"
                        >
                          Build
                        </button>
                        <button
                          onClick={() => handleTestProject(project.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm disabled:opacity-50"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleDeployProject(project.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50"
                        >
                          Deploy
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {selectedProject?.id === project.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <h5 className="text-sm font-semibold text-white mb-2">Project Files</h5>
                        <div className="space-y-2">
                          {project.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-gray-700 rounded"
                            >
                              <div className="flex-1">
                                <span className="text-white">{file.path}</span>
                                <span className="ml-2 text-sm text-gray-400 capitalize">
                                  ({file.type})
                                </span>
                              </div>
                              <button
                                onClick={() => setEditingFile(file)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {buildOutput && selectedProject?.id === project.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <h5 className="text-sm font-semibold text-white mb-2">Build Output</h5>
                        <pre className="p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                          {buildOutput}
                        </pre>
                      </div>
                    )}

                    {testResult && testResult.extensionId === project.id && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <h5 className="text-sm font-semibold text-white mb-2">Test Results</h5>
                        <div
                          className={`p-3 rounded mb-2 ${
                            testResult.passed ? 'bg-green-900' : 'bg-red-900'
                          }`}
                        >
                          <span className="font-semibold">
                            {testResult.passed ? '✓ All Tests Passed' : '✗ Tests Failed'}
                          </span>
                          <span className="ml-2 text-sm">
                            ({testResult.tests.filter((t) => t.passed).length}/
                            {testResult.tests.length} passed)
                          </span>
                          {testResult.coverage && (
                            <span className="ml-2 text-sm">
                              • {testResult.coverage}% coverage
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {testResult.tests.map((test, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded text-sm ${
                                test.passed ? 'bg-gray-700' : 'bg-red-800'
                              }`}
                            >
                              <span>{test.passed ? '✓' : '✗'}</span>
                              <span className="ml-2">{test.name}</span>
                              <span className="ml-2 text-gray-400">
                                ({test.duration}ms)
                              </span>
                              {test.error && (
                                <div className="mt-1 text-red-300">{test.error}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Loaded Extensions Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Loaded Extensions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-semibold text-white mb-2">Python (Jython)</h4>
                  <div className="space-y-2">
                    {pythonExtensions.length === 0 ? (
                      <div className="text-sm text-gray-400">No Python extensions loaded</div>
                    ) : (
                      pythonExtensions.map((ext, index) => (
                        <div key={index} className="p-2 bg-gray-800 rounded text-sm">
                          <div className="text-white font-medium">{ext.name}</div>
                          <div className="text-gray-400">
                            {ext.jythonVersion} • {ext.modules.length} modules
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-white mb-2">Java</h4>
                  <div className="space-y-2">
                    {javaExtensions.length === 0 ? (
                      <div className="text-sm text-gray-400">No Java extensions loaded</div>
                    ) : (
                      javaExtensions.map((ext, index) => (
                        <div key={index} className="p-2 bg-gray-800 rounded text-sm">
                          <div className="text-white font-medium">{ext.name}</div>
                          <div className="text-gray-400">
                            {ext.javaVersion} • {ext.mainClass}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api-docs' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">API Documentation</h3>
            <div className="space-y-3">
              {apiDocs.map((doc, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-600"
                  onClick={() =>
                    setSelectedApiDoc(selectedApiDoc?.path === doc.path ? null : doc)
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            doc.method === 'GET'
                              ? 'bg-blue-600'
                              : doc.method === 'POST'
                              ? 'bg-green-600'
                              : doc.method === 'PUT'
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          } text-white`}
                        >
                          {doc.method}
                        </span>
                        <span className="text-white font-mono">{doc.path}</span>
                      </div>
                      <p className="text-sm text-gray-400">{doc.description}</p>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{doc.category}</span>
                  </div>

                  {selectedApiDoc?.path === doc.path && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-2">Parameters</h5>
                        {doc.parameters.length === 0 ? (
                          <div className="text-sm text-gray-400">No parameters</div>
                        ) : (
                          <div className="space-y-2">
                            {doc.parameters.map((param, pIndex) => (
                              <div key={pIndex} className="text-sm">
                                <span className="text-blue-400">{param.name}</span>
                                <span className="text-gray-500 ml-2">({param.type})</span>
                                {param.required && (
                                  <span className="ml-2 text-red-400">*required</span>
                                )}
                                <div className="text-gray-400 ml-4">{param.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-white mb-2">Example Request</h5>
                        <pre className="p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                          {doc.exampleRequest}
                        </pre>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-white mb-2">Example Response</h5>
                        <pre className="p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                          {doc.exampleResponse}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div>
            <div className="mb-4 flex gap-2">
              <select
                value={exampleLanguageFilter}
                onChange={(e) => setExampleLanguageFilter(e.target.value)}
                className="p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="all">All Languages</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
              <select
                value={exampleCategoryFilter}
                onChange={(e) => setExampleCategoryFilter(e.target.value)}
                className="p-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="all">All Categories</option>
                <option value="scanner">Scanner</option>
                <option value="intruder">Intruder</option>
                <option value="proxy">Proxy</option>
                <option value="extender">Extender</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredExamples.map((example) => (
                <div
                  key={example.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-600"
                  onClick={() =>
                    setSelectedExample(selectedExample?.id === example.id ? null : example)
                  }
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{example.title}</h4>
                      <p className="text-sm text-gray-400">{example.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        {example.language}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-white text-xs rounded capitalize">
                        {example.category}
                      </span>
                    </div>
                  </div>

                  {example.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {example.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedExample?.id === example.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <pre className="p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                        {example.code}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rest-api' && apiConfig && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">REST API Configuration</h3>

            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Enabled</label>
                  <input
                    type="checkbox"
                    checked={apiConfig.enabled}
                    onChange={(e) =>
                      setApiConfig({ ...apiConfig, enabled: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Port</label>
                  <input
                    type="number"
                    value={apiConfig.port}
                    onChange={(e) =>
                      setApiConfig({ ...apiConfig, port: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={apiConfig.apiKey}
                      readOnly
                      className="flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600"
                    />
                    <button
                      onClick={handleGenerateApiKey}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Generate New
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={apiConfig.rateLimit}
                    onChange={(e) =>
                      setApiConfig({ ...apiConfig, rateLimit: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Features</label>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={apiConfig.enableDocs}
                        onChange={(e) =>
                          setApiConfig({ ...apiConfig, enableDocs: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">Enable Documentation</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={apiConfig.enableSwagger}
                        onChange={(e) =>
                          setApiConfig({ ...apiConfig, enableSwagger: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">Enable Swagger UI</span>
                    </label>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSaveApiConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>

            <h3 className="text-lg font-semibold text-white mb-3">Recent API Calls</h3>
            <div className="space-y-2">
              {apiCalls.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No API calls yet</div>
              ) : (
                apiCalls.slice(0, 20).map((call) => (
                  <div
                    key={call.id}
                    className="p-3 bg-gray-800 rounded border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            call.method === 'GET'
                              ? 'bg-blue-600'
                              : call.method === 'POST'
                              ? 'bg-green-600'
                              : 'bg-yellow-600'
                          } text-white`}
                        >
                          {call.method}
                        </span>
                        <span className="text-white font-mono text-sm">{call.endpoint}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            call.responseStatus >= 200 && call.responseStatus < 300
                              ? 'bg-green-900 text-green-200'
                              : call.responseStatus >= 400
                              ? 'bg-red-900 text-red-200'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {call.responseStatus}
                        </span>
                        <span className="text-gray-400">{call.duration}ms</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(call.timestamp).toLocaleString()} • From: {call.source}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Extension Logs</h3>
              <button
                onClick={() => window.api.extensionClearLogs()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Logs
              </button>
            </div>

            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No logs yet</div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm font-mono ${
                      log.level === 'error'
                        ? 'bg-red-900 text-red-200'
                        : log.level === 'warning'
                        ? 'bg-yellow-900 text-yellow-200'
                        : log.level === 'debug'
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>
                        [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level.toUpperCase()}]{' '}
                        {log.extensionId && `[${log.extensionId}]`} {log.message}
                      </span>
                    </div>
                    {log.stackTrace && (
                      <pre className="mt-2 text-xs overflow-x-auto">{log.stackTrace}</pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {editingFile && (
        <CodeEditorModal
          file={editingFile}
          onSave={(content) => handleSaveFileContent(editingFile.path, content)}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
};
