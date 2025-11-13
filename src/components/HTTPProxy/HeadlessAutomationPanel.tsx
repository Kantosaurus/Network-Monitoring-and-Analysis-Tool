import React, { useState, useEffect } from 'react';
import { IconServer, IconBrandDocker, IconRobot, IconPlayerPlay, IconPlayerPause, IconTrash, IconPlus, IconRefresh, IconClock, IconCheck } from '@tabler/icons-react';
import { HeadlessAgent, HeadlessJob, DockerConfig, AutomationPipeline } from '@/types';
import { cn } from '@/lib/utils';

type HATab = 'agents' | 'jobs' | 'docker' | 'pipelines';

export const HeadlessAutomationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HATab>('agents');
  const [agents, setAgents] = useState<HeadlessAgent[]>([]);
  const [jobs, setJobs] = useState<HeadlessJob[]>([]);
  const [dockerConfig, setDockerConfig] = useState<DockerConfig | null>(null);
  const [pipelines, setPipelines] = useState<AutomationPipeline[]>([]);
  
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showPipelineForm, setShowPipelineForm] = useState(false);

  // Agent form
  const [agentForm, setAgentForm] = useState({
    name: '',
    host: 'localhost',
    port: 8090,
    capabilities: ['scan', 'crawl', 'test'],
  });

  // Job form
  const [jobForm, setJobForm] = useState({
    agentId: '',
    type: 'scan' as 'scan' | 'crawl' | 'test' | 'audit',
    target: '',
  });

  // Docker configuration form
  const [dockerForm, setDockerForm] = useState<Partial<DockerConfig>>({
    image: 'nmat-scanner',
    tag: 'latest',
    containerName: 'nmat-headless-1',
    ports: { '8080': 8080, '8090': 8090 },
    volumes: [],
    environment: {},
    replicas: 1,
  });

  // Pipeline form
  const [pipelineForm, setPipelineForm] = useState<Partial<AutomationPipeline>>({
    name: '',
    stages: [],
    enabled: true,
  });

  useEffect(() => {
    loadAgents();
    loadPipelines();
    loadDockerConfig();

    if (window.api) {
      window.api.onHeadlessJobUpdate((job) => {
        setJobs((prev) => {
          const index = prev.findIndex((j) => j.id === job.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = job;
            return updated;
          }
          return [...prev, job];
        });
      });

      window.api.onAgentStatusChange((agent) => {
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? agent : a))
        );
      });

      window.api.onPipelineComplete((pipelineId, success) => {
        alert(`Pipeline ${pipelineId} ${success ? 'completed successfully' : 'failed'}`);
        loadPipelines();
      });
    }
  }, []);

  const loadAgents = async () => {
    if (!window.api) return;
    const result = await window.api.headlessAgentGetAll();
    if (result.success && result.agents) {
      setAgents(result.agents);
    }
  };

  const loadPipelines = async () => {
    if (!window.api) return;
    const result = await window.api.pipelineGetAll();
    if (result.success && result.pipelines) {
      setPipelines(result.pipelines);
    }
  };

  const loadDockerConfig = async () => {
    if (!window.api) return;
    const result = await window.api.dockerConfigGet();
    if (result.success && result.config) {
      setDockerConfig(result.config);
      setDockerForm(result.config);
    }
  };

  const handleRegisterAgent = async () => {
    if (!window.api || !agentForm.name || !agentForm.host) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await window.api.headlessAgentRegister({
      name: agentForm.name,
      status: 'idle',
      host: agentForm.host,
      port: agentForm.port,
      capabilities: agentForm.capabilities,
    });

    if (result.success) {
      loadAgents();
      setShowAgentForm(false);
      setAgentForm({ name: '', host: 'localhost', port: 8090, capabilities: ['scan'] });
      alert('Agent registered successfully');
    } else {
      alert(`Failed to register agent: ${result.error}`);
    }
  };

  const handleRemoveAgent = async (agentId: string) => {
    if (!window.api || !confirm('Remove this agent?')) return;

    const result = await window.api.headlessAgentRemove(agentId);
    if (result.success) {
      loadAgents();
    }
  };

  const handleCreateJob = async () => {
    if (!window.api || !jobForm.agentId || !jobForm.target) {
      alert('Please select an agent and enter a target');
      return;
    }

    const result = await window.api.headlessJobCreate(jobForm.agentId, {
      type: jobForm.type,
      target: jobForm.target,
      configuration: {},
      startTime: new Date().toISOString(),
    });

    if (result.success && result.jobId) {
      alert(`Job created: ${result.jobId}`);
      setJobForm({ agentId: '', type: 'scan', target: '' });
    } else {
      alert(`Failed to create job: ${result.error}`);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!window.api || !confirm('Cancel this job?')) return;

    const result = await window.api.headlessJobCancel(jobId);
    if (result.success) {
      alert('Job cancelled');
    }
  };

  const handleSaveDockerConfig = async () => {
    if (!window.api || !dockerForm.image) {
      alert('Please provide Docker image name');
      return;
    }

    const config: DockerConfig = {
      image: dockerForm.image,
      tag: dockerForm.tag || 'latest',
      containerName: dockerForm.containerName || 'nmat-headless',
      ports: dockerForm.ports || {},
      volumes: dockerForm.volumes || [],
      environment: dockerForm.environment || {},
      replicas: dockerForm.replicas || 1,
    };

    const result = await window.api.dockerConfigSave(config);
    if (result.success) {
      setDockerConfig(config);
      alert('Docker configuration saved');
    } else {
      alert(`Failed to save configuration: ${result.error}`);
    }
  };

  const handleStartDocker = async () => {
    if (!window.api || !dockerConfig) {
      alert('Please configure Docker first');
      return;
    }

    const result = await window.api.dockerContainerStart(dockerConfig);
    if (result.success && result.containerId) {
      alert(`Container started: ${result.containerId}`);
    } else {
      alert(`Failed to start container: ${result.error}`);
    }
  };

  const handleStopDocker = async (containerId: string) => {
    if (!window.api) return;

    const result = await window.api.dockerContainerStop(containerId);
    if (result.success) {
      alert('Container stopped');
    }
  };

  const handleCreatePipeline = async () => {
    if (!window.api || !pipelineForm.name) {
      alert('Please provide pipeline name');
      return;
    }

    const result = await window.api.pipelineCreate({
      name: pipelineForm.name,
      stages: pipelineForm.stages || [],
      enabled: pipelineForm.enabled!,
    });

    if (result.success) {
      loadPipelines();
      setShowPipelineForm(false);
      setPipelineForm({ name: '', stages: [], enabled: true });
      alert('Pipeline created successfully');
    } else {
      alert(`Failed to create pipeline: ${result.error}`);
    }
  };

  const handleRunPipeline = async (pipelineId: string) => {
    if (!window.api) return;

    const result = await window.api.pipelineRun(pipelineId);
    if (result.success && result.runId) {
      alert(`Pipeline started: ${result.runId}`);
    } else {
      alert(`Failed to start pipeline: ${result.error}`);
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    if (!window.api || !confirm('Delete this pipeline?')) return;

    const result = await window.api.pipelineDelete(pipelineId);
    if (result.success) {
      loadPipelines();
    }
  };

  const formatUptime = (uptime: string) => {
    return uptime;
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Headless & Automation</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('agents')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'agents'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconServer size={18} />
            Agents ({agents.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'jobs'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconRobot size={18} />
            Jobs ({jobs.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('docker')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'docker'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconBrandDocker size={18} />
            Docker
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pipelines')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            activeTab === 'pipelines'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <IconClock size={18} />
            Pipelines ({pipelines.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowAgentForm(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                <IconPlus size={18} />
                Register Agent
              </button>
              <button
                onClick={loadAgents}
                className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <IconRefresh size={18} />
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconServer size={18} className="text-blue-500" />
                        <span className="font-semibold">{agent.name}</span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            agent.status === 'idle' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            agent.status === 'running' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                            agent.status === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                            agent.status === 'offline' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          )}
                        >
                          {agent.status}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Host: {agent.host}:{agent.port}</p>
                        <p>Capabilities: {agent.capabilities.join(', ')}</p>
                        {agent.currentJob && (
                          <p className="text-blue-600 dark:text-blue-400">
                            Current Job: {agent.currentJob.type} - {agent.currentJob.target}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">CPU:</span> {agent.metrics.cpuUsage.toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-gray-500">Memory:</span> {agent.metrics.memoryUsage.toFixed(1)}%
                        </div>
                        <div>
                          <span className="text-gray-500">RPS:</span> {agent.metrics.requestsPerSecond}
                        </div>
                        <div>
                          <span className="text-gray-500">Uptime:</span> {formatUptime(agent.metrics.uptime)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAgent(agent.id)}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {agents.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <IconServer size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No headless agents registered. Register an agent to start distributed scanning.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Create Job</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Agent</label>
                  <select
                    value={jobForm.agentId}
                    onChange={(e) => setJobForm({ ...jobForm, agentId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">-- Select Agent --</option>
                    {agents.filter(a => a.status === 'idle').map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.host}:{agent.port})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Job Type</label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value as any })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="scan">Security Scan</option>
                    <option value="crawl">Web Crawl</option>
                    <option value="test">Penetration Test</option>
                    <option value="audit">Security Audit</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Target URL</label>
                  <input
                    type="url"
                    value={jobForm.target}
                    onChange={(e) => setJobForm({ ...jobForm, target: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <button
                  onClick={handleCreateJob}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  <IconPlayerPlay size={18} />
                  Create & Start Job
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconRobot size={18} className="text-blue-500" />
                        <span className="font-semibold">{job.type}</span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            job.status === 'queued' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                            job.status === 'running' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                            job.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                            job.status === 'failed' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          )}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{job.target}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Started: {new Date(job.startTime).toLocaleString()}</p>
                        {job.endTime && <p>Ended: {new Date(job.endTime).toLocaleString()}</p>}
                        {job.status === 'running' && (
                          <div className="mt-2">
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <p className="mt-1">Progress: {job.progress}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {job.status === 'running' && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                      >
                        <IconPlayerPause size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <IconRobot size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No jobs running. Create a job to start scanning with headless agents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Docker Tab */}
        {activeTab === 'docker' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-semibold">Docker Configuration</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Image</label>
                    <input
                      type="text"
                      value={dockerForm.image}
                      onChange={(e) => setDockerForm({ ...dockerForm, image: e.target.value })}
                      placeholder="nmat-scanner"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Tag</label>
                    <input
                      type="text"
                      value={dockerForm.tag}
                      onChange={(e) => setDockerForm({ ...dockerForm, tag: e.target.value })}
                      placeholder="latest"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Container Name</label>
                  <input
                    type="text"
                    value={dockerForm.containerName}
                    onChange={(e) => setDockerForm({ ...dockerForm, containerName: e.target.value })}
                    placeholder="nmat-headless-1"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Replicas</label>
                  <input
                    type="number"
                    value={dockerForm.replicas}
                    onChange={(e) => setDockerForm({ ...dockerForm, replicas: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>

                <button
                  onClick={handleSaveDockerConfig}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  <IconCheck size={18} />
                  Save Configuration
                </button>
              </div>
            </div>

            {dockerConfig && (
              <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
                <div className="mb-3 flex items-center gap-2">
                  <IconBrandDocker size={18} className="text-green-600" />
                  <span className="font-semibold">Docker Configured</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Image: {dockerConfig.image}:{dockerConfig.tag}</p>
                  <p>Container: {dockerConfig.containerName}</p>
                  <p>Replicas: {dockerConfig.replicas}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleStartDocker}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  >
                    <IconPlayerPlay size={18} />
                    Start Container
                  </button>
                  <button
                    onClick={() => handleStopDocker(dockerConfig.containerName)}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    <IconPlayerPause size={18} />
                    Stop Container
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pipelines Tab */}
        {activeTab === 'pipelines' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowPipelineForm(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                <IconPlus size={18} />
                Create Pipeline
              </button>
            </div>

            <div className="space-y-2">
              {pipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconClock size={18} className="text-blue-500" />
                        <span className="font-semibold">{pipeline.name}</span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            pipeline.enabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          )}
                        >
                          {pipeline.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {pipeline.stages.length} stages
                      </p>
                      {pipeline.schedule && (
                        <p className="mt-1 text-xs text-gray-500">Schedule: {pipeline.schedule}</p>
                      )}
                      {pipeline.lastRun && (
                        <p className="mt-1 text-xs text-gray-500">
                          Last run: {new Date(pipeline.lastRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRunPipeline(pipeline.id)}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
                      >
                        <IconPlayerPlay size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePipeline(pipeline.id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pipelines.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
                  <IconClock size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No automation pipelines configured. Create a pipeline to automate your security workflows.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Agent Form Modal */}
      {showAgentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold">Register Headless Agent</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Agent Name</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Host</label>
                <input
                  type="text"
                  value={agentForm.host}
                  onChange={(e) => setAgentForm({ ...agentForm, host: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Port</label>
                <input
                  type="number"
                  value={agentForm.port}
                  onChange={(e) => setAgentForm({ ...agentForm, port: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAgentForm(false);
                  setAgentForm({ name: '', host: 'localhost', port: 8090, capabilities: ['scan'] });
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterAgent}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Register Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Form Modal */}
      {showPipelineForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold">Create Automation Pipeline</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Pipeline Name</label>
                <input
                  type="text"
                  value={pipelineForm.name}
                  onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pipelineForm.enabled}
                  onChange={(e) => setPipelineForm({ ...pipelineForm, enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Enabled</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPipelineForm(false);
                  setPipelineForm({ name: '', stages: [], enabled: true });
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Create Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
