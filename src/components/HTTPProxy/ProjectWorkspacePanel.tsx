import React, { useState, useEffect } from 'react';
import { IconFolder, IconFolderPlus, IconDeviceFloppy, IconTrash, IconDownload, IconSettings, IconTag, IconPlus } from '@tabler/icons-react';
import { Project, Workspace, ProjectConfiguration } from '@/types';
import { cn } from '@/lib/utils';

type PWTab = 'projects' | 'workspaces' | 'saved-items' | 'configuration';

export const ProjectWorkspacePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PWTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  // Project form
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
  });

  // Workspace form
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
  });

  // Configuration editor
  const [configForm, setConfigForm] = useState<Partial<ProjectConfiguration>>({
    targetScope: [''],
    excludedPaths: [],
    scannerSettings: {
      maxThreads: 10,
      requestsPerSecond: 10,
      timeout: 30000,
      followRedirects: true,
      scanDepth: 5,
      enabledChecks: [],
    },
    proxySettings: {
      enabled: true,
      port: 8080,
      interceptEnabled: false,
    },
    customHeaders: {},
  });

  useEffect(() => {
    loadProjects();
    loadWorkspaces();
    loadCurrentProject();

    if (window.api) {
      window.api.onProjectSaved((project) => {
        setProjects((prev) =>
          prev.map((p) => (p.id === project.id ? project : p))
        );
      });

      window.api.onProjectModified((project) => {
        if (currentProject?.id === project.id) {
          setCurrentProject(project);
        }
      });
    }
  }, []);

  const loadProjects = async () => {
    if (!window.api) return;
    const result = await window.api.projectGetAll();
    if (result.success && result.projects) {
      setProjects(result.projects);
    }
  };

  const loadWorkspaces = async () => {
    if (!window.api) return;
    const result = await window.api.workspaceGetAll();
    if (result.success && result.workspaces) {
      setWorkspaces(result.workspaces);
    }
  };

  const loadCurrentProject = async () => {
    if (!window.api) return;
    const result = await window.api.projectGetCurrent();
    if (result.success && result.project) {
      setCurrentProject(result.project);
      setConfigForm(result.project.configuration);
    }
  };

  const handleCreateProject = async () => {
    if (!window.api || !projectForm.name) return;

    const result = await window.api.projectCreate(projectForm.name, projectForm.description);
    if (result.success && result.project) {
      setProjects([...projects, result.project]);
      setCurrentProject(result.project);
      setShowProjectForm(false);
      setProjectForm({ name: '', description: '' });
      alert('Project created successfully');
    } else {
      alert(`Failed to create project: ${result.error}`);
    }
  };

  const handleOpenProject = async (filePath: string) => {
    if (!window.api) return;

    const result = await window.api.projectOpen(filePath);
    if (result.success && result.project) {
      setCurrentProject(result.project);
      if (!projects.find((p) => p.id === result.project!.id)) {
        setProjects([...projects, result.project]);
      }
      alert('Project opened successfully');
    } else {
      alert(`Failed to open project: ${result.error}`);
    }
  };

  const handleSaveProject = async (projectId: string) => {
    if (!window.api) return;

    const result = await window.api.projectSave(projectId);
    if (result.success) {
      alert('Project saved successfully');
    } else {
      alert(`Failed to save project: ${result.error}`);
    }
  };

  const handleCloseProject = async (projectId: string) => {
    if (!window.api) return;

    const result = await window.api.projectClose(projectId);
    if (result.success) {
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      setProjects(projects.filter((p) => p.id !== projectId));
      alert('Project closed');
    }
  };

  const handleExportProject = async (projectId: string) => {
    if (!window.api) return;

    const filePath = prompt('Enter export path (e.g., C:\\exports\\project.burp):');
    if (!filePath) return;

    const result = await window.api.projectExport(projectId, filePath);
    if (result.success) {
      alert(`Project exported to: ${filePath}`);
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleUpdateConfig = async () => {
    if (!window.api || !currentProject) return;

    const result = await window.api.projectUpdateConfig(currentProject.id, configForm);
    if (result.success) {
      alert('Configuration updated successfully');
      setShowConfigEditor(false);
      loadCurrentProject();
    } else {
      alert(`Failed to update configuration: ${result.error}`);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!window.api || !workspaceForm.name) return;

    const result = await window.api.workspaceCreate(workspaceForm.name);
    if (result.success && result.workspace) {
      setWorkspaces([...workspaces, result.workspace]);
      setShowWorkspaceForm(false);
      setWorkspaceForm({ name: '' });
      alert('Workspace created successfully');
    } else {
      alert(`Failed to create workspace: ${result.error}`);
    }
  };

  const handleLoadWorkspace = async (workspaceId: string) => {
    if (!window.api) return;

    const result = await window.api.workspaceLoad(workspaceId);
    if (result.success && result.workspace) {
      alert('Workspace loaded successfully');
      loadProjects();
    } else {
      alert(`Failed to load workspace: ${result.error}`);
    }
  };

  const addTargetScope = () => {
    setConfigForm({
      ...configForm,
      targetScope: [...(configForm.targetScope || []), ''],
    });
  };

  const updateTargetScope = (index: number, value: string) => {
    const scope = [...(configForm.targetScope || [])];
    scope[index] = value;
    setConfigForm({ ...configForm, targetScope: scope });
  };

  const removeTargetScope = (index: number) => {
    const scope = [...(configForm.targetScope || [])];
    scope.splice(index, 1);
    setConfigForm({ ...configForm, targetScope: scope });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black uppercase tracking-wide">Project & Workspace Management</h2>
          {currentProject && (
            <span className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-800">
              Current: {currentProject.name}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'projects'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconFolder size={18} />
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'workspaces'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconFolderPlus size={18} />
          Workspaces ({workspaces.length})
        </button>
        {currentProject && (
          <>
            <button
              onClick={() => setActiveTab('saved-items')}
              className={cn(
                'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
                activeTab === 'saved-items'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-black opacity-60 hover:opacity-100'
              )}
            >
              <IconTag size={18} />
              Saved Items ({currentProject.savedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('configuration')}
              className={cn(
                'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
                activeTab === 'configuration'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-black opacity-60 hover:opacity-100'
              )}
            >
              <IconSettings size={18} />
              Configuration
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowProjectForm(true)}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
              >
                <IconFolderPlus size={18} />
                New Project
              </button>
              <button
                onClick={() => {
                  const path = prompt('Enter project file path:');
                  if (path) handleOpenProject(path);
                }}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm flex items-center gap-2"
              >
                <IconFolder size={18} />
                Open Project
              </button>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'rounded-2xl border-2 p-5',
                    currentProject?.id === project.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 apple-card'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconFolder size={18} className="text-blue-600" />
                        <span className="font-bold text-black">{project.name}</span>
                        {project.tags.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-black opacity-80">{project.description}</p>
                      )}
                      <div className="mt-2 flex gap-4 text-xs text-black opacity-60">
                        <span>Created: {formatDate(project.createdAt)}</span>
                        <span>Modified: {formatDate(project.modifiedAt)}</span>
                        <span>Size: {formatFileSize(project.size)}</span>
                        <span>Items: {project.savedItems.length}</span>
                      </div>
                      <div className="mt-2 flex gap-2 text-xs">
                        <span className={cn(
                          'rounded px-2 py-0.5 font-semibold',
                          project.scanState.status === 'running' && 'bg-yellow-100 text-yellow-800',
                          project.scanState.status === 'completed' && 'bg-green-100 text-green-800',
                          project.scanState.status === 'idle' && 'bg-gray-100 text-gray-800',
                          project.scanState.status === 'error' && 'bg-red-100 text-red-800'
                        )}>
                          {project.scanState.status}
                        </span>
                        {project.scanState.findings.length > 0 && (
                          <span className="rounded bg-orange-100 px-2 py-0.5 font-semibold text-orange-800">
                            {project.scanState.findings.length} findings
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveProject(project.id)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 shadow-sm"
                        title="Save"
                      >
                        <IconDeviceFloppy size={16} />
                      </button>
                      <button
                        onClick={() => handleExportProject(project.id)}
                        className="rounded-xl bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 shadow-sm"
                        title="Export"
                      >
                        <IconDownload size={16} />
                      </button>
                      <button
                        onClick={() => handleCloseProject(project.id)}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 shadow-sm"
                        title="Close"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconFolder size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
                    No projects open. Create a new project or open an existing one.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workspaces Tab */}
        {activeTab === 'workspaces' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowWorkspaceForm(true)}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
              >
                <IconPlus size={18} />
                New Workspace
              </button>
            </div>

            <div className="space-y-3">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconFolderPlus size={18} className="text-blue-600" />
                        <span className="font-bold text-black">{workspace.name}</span>
                      </div>
                      <p className="mt-2 text-sm text-black opacity-80">
                        {workspace.projects.length} projects
                      </p>
                      {workspace.activeProjectId && (
                        <p className="mt-1 text-xs text-black opacity-60">
                          Active: {workspace.projects.find((p) => p.id === workspace.activeProjectId)?.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleLoadWorkspace(workspace.id)}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}

              {workspaces.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconFolderPlus size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
                    No workspaces created. Create a workspace to manage multiple projects.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Items Tab */}
        {activeTab === 'saved-items' && currentProject && (
          <div className="space-y-3">
            {currentProject.savedItems.map((item) => (
              <div
                key={item.id}
                className="apple-card rounded-2xl p-5 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        {item.type}
                      </span>
                      <span className="text-sm text-black opacity-80">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-2 text-sm text-black">{item.notes}</p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (window.api && confirm('Remove this saved item?')) {
                        await window.api.projectRemoveSavedItem(currentProject.id, item.id);
                        loadCurrentProject();
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}

            {currentProject.savedItems.length === 0 && (
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconTag size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
                  No saved items in this project yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && currentProject && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-black uppercase tracking-wide">Project Configuration</h3>
                <button
                  onClick={() => setShowConfigEditor(true)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
                >
                  <IconSettings size={16} />
                  Edit
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-bold text-black uppercase tracking-wide">Target Scope</h4>
                  <div className="space-y-1">
                    {currentProject.configuration.targetScope.map((url, index) => (
                      <div key={index} className="rounded-xl bg-gray-50 px-3 py-2 text-sm border border-gray-200 text-black">
                        {url}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-black uppercase tracking-wide">Scanner Settings</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm text-black">
                    <div>
                      <span className="opacity-60">Max Threads:</span>{' '}
                      <span className="font-semibold">{currentProject.configuration.scannerSettings.maxThreads}</span>
                    </div>
                    <div>
                      <span className="opacity-60">Requests/sec:</span>{' '}
                      <span className="font-semibold">{currentProject.configuration.scannerSettings.requestsPerSecond}</span>
                    </div>
                    <div>
                      <span className="opacity-60">Timeout:</span>{' '}
                      <span className="font-semibold">{currentProject.configuration.scannerSettings.timeout}ms</span>
                    </div>
                    <div>
                      <span className="opacity-60">Scan Depth:</span>{' '}
                      <span className="font-semibold">{currentProject.configuration.scannerSettings.scanDepth}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-bold text-black uppercase tracking-wide">Proxy Settings</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm text-black">
                    <div>
                      <span className="opacity-60">Enabled:</span>{' '}
                      <span className="font-semibold">{currentProject.configuration.proxySettings.enabled ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="opacity-60">Port:</span>{' '}
                      <span className="font-semibold">{currentProject.configuration.proxySettings.port}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-black uppercase tracking-wide">Create New Project</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Description (optional)</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={3}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowProjectForm(false);
                  setProjectForm({ name: '', description: '' });
                }}
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Form Modal */}
      {showWorkspaceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-black uppercase tracking-wide">Create New Workspace</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowWorkspaceForm(false);
                  setWorkspaceForm({ name: '' });
                }}
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Editor Modal */}
      {showConfigEditor && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-black uppercase tracking-wide">Edit Configuration</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-black">Target Scope</label>
                  <button
                    onClick={addTargetScope}
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 shadow-sm flex items-center gap-1"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {(configForm.targetScope || []).map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateTargetScope(index, e.target.value)}
                        placeholder="https://example.com"
                        className="apple-input flex-1 rounded-xl px-4 py-2.5 text-sm text-black"
                      />
                      {(configForm.targetScope?.length || 0) > 1 && (
                        <button
                          onClick={() => removeTargetScope(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-black uppercase tracking-wide">Scanner Settings</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-black opacity-60">Max Threads</label>
                    <input
                      type="number"
                      value={configForm.scannerSettings?.maxThreads}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scannerSettings: {
                            ...configForm.scannerSettings!,
                            maxThreads: parseInt(e.target.value),
                          },
                        })
                      }
                      className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-black opacity-60">Requests/sec</label>
                    <input
                      type="number"
                      value={configForm.scannerSettings?.requestsPerSecond}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scannerSettings: {
                            ...configForm.scannerSettings!,
                            requestsPerSecond: parseInt(e.target.value),
                          },
                        })
                      }
                      className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-black opacity-60">Timeout (ms)</label>
                    <input
                      type="number"
                      value={configForm.scannerSettings?.timeout}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scannerSettings: {
                            ...configForm.scannerSettings!,
                            timeout: parseInt(e.target.value),
                          },
                        })
                      }
                      className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-black opacity-60">Scan Depth</label>
                    <input
                      type="number"
                      value={configForm.scannerSettings?.scanDepth}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          scannerSettings: {
                            ...configForm.scannerSettings!,
                            scanDepth: parseInt(e.target.value),
                          },
                        })
                      }
                      className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfigEditor(false)}
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateConfig}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
