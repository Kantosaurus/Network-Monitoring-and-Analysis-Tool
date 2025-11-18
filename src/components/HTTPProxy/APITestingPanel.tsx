import React, { useState, useEffect } from 'react';
import { IconApi, IconDeviceMobile, IconCode, IconPlayerPlay, IconTrash, IconDownload, IconSearch, IconBrandGraphql, IconX, IconPlus } from '@tabler/icons-react';
import { APIEndpoint, GraphQLSchema, MobileAppSession, APIParameter } from '@/types';
import { cn } from '@/lib/utils';

type APITab = 'rest' | 'graphql' | 'mobile' | 'endpoints';

export const APITestingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<APITab>('rest');
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [graphqlSchema, setGraphqlSchema] = useState<GraphQLSchema | null>(null);
  const [mobileSessions, setMobileSessions] = useState<MobileAppSession[]>([]);
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [openAPISpecUrl, setOpenAPISpecUrl] = useState('');
  const [graphqlEndpoint, setGraphqlEndpoint] = useState('');
  const [graphqlQuery, setGraphqlQuery] = useState('');
  const [graphqlVariables, setGraphqlVariables] = useState('{}');
  const [graphqlResult, setGraphqlResult] = useState<any>(null);

  // REST endpoint form
  const [endpointForm, setEndpointForm] = useState<Partial<APIEndpoint>>({
    method: 'GET',
    path: '/',
    baseUrl: 'https://api.example.com',
    type: 'rest',
    parameters: [],
    headers: {},
    body: '',
  });

  // Mobile session form
  const [mobileSessionForm, setMobileSessionForm] = useState({
    deviceType: 'android' as 'android' | 'ios',
    deviceName: '',
  });

  useEffect(() => {
    if (window.api) {
      // Listen for discovered endpoints
      window.api.onAPIEndpointDiscovered((endpoint) => {
        setEndpoints((prev) => {
          const exists = prev.find((e) => e.id === endpoint.id);
          if (exists) return prev;
          return [...prev, endpoint];
        });
      });

      // Listen for mobile app requests
      window.api.onMobileRequest((request) => {
        console.log('Mobile request:', request);
      });
    }
  }, []);

  const handleDiscoverEndpoints = async () => {
    if (!window.api || !discoveryUrl) return;

    setDiscovering(true);
    const result = await window.api.apiDiscoverEndpoints(discoveryUrl);
    setDiscovering(false);

    if (result.success && result.endpoints) {
      setEndpoints(result.endpoints);
      setActiveTab('endpoints');
    } else {
      alert(`Discovery failed: ${result.error}`);
    }
  };

  const handleParseOpenAPI = async () => {
    if (!window.api || !openAPISpecUrl) return;

    const result = await window.api.apiParseOpenAPI(openAPISpecUrl);
    if (result.success && result.endpoints) {
      setEndpoints(result.endpoints);
      setActiveTab('endpoints');
      alert(`Loaded ${result.endpoints.length} endpoints from OpenAPI spec`);
    } else {
      alert(`Failed to parse OpenAPI spec: ${result.error}`);
    }
  };

  const handleTestEndpoint = async (endpoint: APIEndpoint) => {
    if (!window.api) return;

    const result = await window.api.apiTestEndpoint(endpoint);
    if (result.success && result.result) {
      setSelectedEndpoint(result.result);
      // Update in list
      setEndpoints((prev) =>
        prev.map((e) => (e.id === result.result!.id ? result.result! : e))
      );
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleScanEndpoint = async (endpoint: APIEndpoint, scanType: 'quick' | 'full') => {
    if (!window.api) return;

    const result = await window.api.apiScanEndpoint(endpoint, scanType);
    if (result.success && result.vulnerabilities) {
      alert(`Scan complete. Found ${result.vulnerabilities.length} vulnerabilities`);
      // Update endpoint with vulnerabilities
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === endpoint.id ? { ...e, vulnerabilities: result.vulnerabilities } : e
        )
      );
    } else {
      alert(`Scan failed: ${result.error}`);
    }
  };

  const handleIntrospectGraphQL = async () => {
    if (!window.api || !graphqlEndpoint) return;

    const result = await window.api.apiIntrospectGraphQL(graphqlEndpoint);
    if (result.success && result.schema) {
      setGraphqlSchema(result.schema);
      alert('GraphQL schema introspected successfully');
    } else {
      alert(`Introspection failed: ${result.error}`);
    }
  };

  const handleTestGraphQL = async () => {
    if (!window.api || !graphqlEndpoint || !graphqlQuery) return;

    let variables;
    try {
      variables = JSON.parse(graphqlVariables);
    } catch (e) {
      alert('Invalid JSON for variables');
      return;
    }

    const result = await window.api.apiTestGraphQL(graphqlEndpoint, graphqlQuery, variables);
    if (result.success) {
      setGraphqlResult(result.result);
    } else {
      alert(`GraphQL query failed: ${result.error}`);
    }
  };

  const handleScanGraphQL = async () => {
    if (!window.api || !graphqlEndpoint || !graphqlSchema) {
      alert('Please introspect the schema first');
      return;
    }

    const result = await window.api.apiScanGraphQL(graphqlEndpoint, graphqlSchema);
    if (result.success && result.vulnerabilities) {
      alert(`GraphQL scan complete. Found ${result.vulnerabilities.length} vulnerabilities`);
    } else {
      alert(`Scan failed: ${result.error}`);
    }
  };

  const handleStartMobileSession = async () => {
    if (!window.api || !mobileSessionForm.deviceName) return;

    const result = await window.api.mobileStartSession(
      mobileSessionForm.deviceType,
      mobileSessionForm.deviceName
    );

    if (result.success && result.sessionId) {
      alert(`Mobile session started: ${result.sessionId}`);
      loadMobileSessions();
    } else {
      alert(`Failed to start session: ${result.error}`);
    }
  };

  const handleStopMobileSession = async (sessionId: string) => {
    if (!window.api) return;

    const result = await window.api.mobileStopSession(sessionId);
    if (result.success) {
      loadMobileSessions();
    }
  };

  const handleBypassSSLPinning = async (sessionId: string) => {
    if (!window.api) return;

    const result = await window.api.mobileBypassSSLPinning(sessionId);
    if (result.success) {
      alert('SSL pinning bypass enabled');
      loadMobileSessions();
    } else {
      alert(`Failed to bypass SSL pinning: ${result.error}`);
    }
  };

  const loadMobileSessions = async () => {
    if (!window.api) return;

    const result = await window.api.mobileGetSessions();
    if (result.success && result.sessions) {
      setMobileSessions(result.sessions);
    }
  };

  useEffect(() => {
    loadMobileSessions();
  }, []);

  const addParameter = () => {
    const newParam: APIParameter = {
      name: '',
      type: 'query',
      dataType: 'string',
      required: false,
    };
    setEndpointForm({
      ...endpointForm,
      parameters: [...(endpointForm.parameters || []), newParam],
    });
  };

  const updateParameter = (index: number, param: APIParameter) => {
    const params = [...(endpointForm.parameters || [])];
    params[index] = param;
    setEndpointForm({ ...endpointForm, parameters: params });
  };

  const removeParameter = (index: number) => {
    const params = [...(endpointForm.parameters || [])];
    params.splice(index, 1);
    setEndpointForm({ ...endpointForm, parameters: params });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">API & Mobile App Testing</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rest')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'rest'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconApi size={18} />
            REST & SOAP
          </div>
        </button>
        <button
          onClick={() => setActiveTab('graphql')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'graphql'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconBrandGraphql size={18} />
            GraphQL
          </div>
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'mobile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconDeviceMobile size={18} />
            Mobile Apps ({mobileSessions.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'endpoints'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconCode size={18} />
            Endpoints ({endpoints.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* REST & SOAP Tab */}
        {activeTab === 'rest' && (
          <div className="space-y-4 p-6">
            {/* Discovery Section */}
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Endpoint Discovery</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={discoveryUrl}
                      onChange={(e) => setDiscoveryUrl(e.target.value)}
                      placeholder="https://api.example.com"
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                    />
                    <button
                      onClick={handleDiscoverEndpoints}
                      disabled={discovering}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                    >
                      <IconSearch size={18} />
                      {discovering ? 'Discovering...' : 'Discover'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">OpenAPI / Swagger Spec URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={openAPISpecUrl}
                      onChange={(e) => setOpenAPISpecUrl(e.target.value)}
                      placeholder="https://api.example.com/swagger.json"
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                    />
                    <button
                      onClick={handleParseOpenAPI}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                    >
                      <IconDownload size={18} />
                      Import
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Endpoint Testing */}
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Manual Endpoint Testing</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={endpointForm.method}
                    onChange={(e) => setEndpointForm({ ...endpointForm, method: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-32"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                  <input
                    type="text"
                    value={endpointForm.baseUrl}
                    onChange={(e) => setEndpointForm({ ...endpointForm, baseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                  />
                  <input
                    type="text"
                    value={endpointForm.path}
                    onChange={(e) => setEndpointForm({ ...endpointForm, path: e.target.value })}
                    placeholder="/api/users"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-black">Parameters</label>
                    <button
                      onClick={addParameter}
                      className="rounded-xl bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      <IconPlus size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(endpointForm.parameters || []).map((param, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={param.name}
                          onChange={(e) => updateParameter(index, { ...param, name: e.target.value })}
                          className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                        />
                        <select
                          value={param.type}
                          onChange={(e) => updateParameter(index, { ...param, type: e.target.value as any })}
                          className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-24"
                        >
                          <option value="query">Query</option>
                          <option value="path">Path</option>
                          <option value="header">Header</option>
                          <option value="body">Body</option>
                        </select>
                        <select
                          value={param.dataType}
                          onChange={(e) => updateParameter(index, { ...param, dataType: e.target.value as any })}
                          className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-24"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Value"
                          value={param.value || ''}
                          onChange={(e) => updateParameter(index, { ...param, value: e.target.value })}
                          className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                        />
                        <button
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Request Body</label>
                  <textarea
                    value={endpointForm.body}
                    onChange={(e) => setEndpointForm({ ...endpointForm, body: e.target.value })}
                    rows={5}
                    placeholder='{"key": "value"}'
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const endpoint: APIEndpoint = {
                        id: Date.now().toString(),
                        method: endpointForm.method!,
                        path: endpointForm.path!,
                        baseUrl: endpointForm.baseUrl!,
                        type: 'rest',
                        parameters: endpointForm.parameters,
                        headers: endpointForm.headers,
                        body: endpointForm.body,
                      };
                      handleTestEndpoint(endpoint);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                  >
                    <IconPlayerPlay size={18} />
                    Test Endpoint
                  </button>
                  <button
                    onClick={() => {
                      const endpoint: APIEndpoint = {
                        id: Date.now().toString(),
                        method: endpointForm.method!,
                        path: endpointForm.path!,
                        baseUrl: endpointForm.baseUrl!,
                        type: 'rest',
                        parameters: endpointForm.parameters,
                        headers: endpointForm.headers,
                        body: endpointForm.body,
                      };
                      handleScanEndpoint(endpoint, 'full');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm"
                  >
                    <IconSearch size={18} />
                    Scan for Vulnerabilities
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GraphQL Tab */}
        {activeTab === 'graphql' && (
          <div className="space-y-4 p-6">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">GraphQL Introspection</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">GraphQL Endpoint</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={graphqlEndpoint}
                      onChange={(e) => setGraphqlEndpoint(e.target.value)}
                      placeholder="https://api.example.com/graphql"
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full flex-1"
                    />
                    <button
                      onClick={handleIntrospectGraphQL}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      <IconSearch size={18} />
                      Introspect
                    </button>
                  </div>
                </div>

                {graphqlSchema && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-semibold text-black">
                      Schema: {graphqlSchema.queries.length} queries, {graphqlSchema.mutations.length} mutations,{' '}
                      {graphqlSchema.subscriptions.length} subscriptions
                    </p>
                    <button
                      onClick={handleScanGraphQL}
                      className="mt-2 rounded-xl bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm"
                    >
                      Scan for Vulnerabilities
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Query Testing</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Query</label>
                  <textarea
                    value={graphqlQuery}
                    onChange={(e) => setGraphqlQuery(e.target.value)}
                    rows={8}
                    placeholder="query { users { id name email } }"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Variables (JSON)</label>
                  <textarea
                    value={graphqlVariables}
                    onChange={(e) => setGraphqlVariables(e.target.value)}
                    rows={4}
                    placeholder='{"id": 1}'
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full font-mono"
                  />
                </div>

                <button
                  onClick={handleTestGraphQL}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconPlayerPlay size={18} />
                  Execute Query
                </button>

                {graphqlResult && (
                  <div>
                    <label className="text-sm font-semibold text-black mb-2 block">Result</label>
                    <pre className="max-h-64 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-black">
                      {JSON.stringify(graphqlResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Apps Tab */}
        {activeTab === 'mobile' && (
          <div className="space-y-4 p-6">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Start Mobile App Session</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Device Type</label>
                  <select
                    value={mobileSessionForm.deviceType}
                    onChange={(e) =>
                      setMobileSessionForm({ ...mobileSessionForm, deviceType: e.target.value as any })
                    }
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Device Name</label>
                  <input
                    type="text"
                    value={mobileSessionForm.deviceName}
                    onChange={(e) => setMobileSessionForm({ ...mobileSessionForm, deviceName: e.target.value })}
                    placeholder="My Phone"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>

                <button
                  onClick={handleStartMobileSession}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                >
                  <IconPlayerPlay size={18} />
                  Start Session
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-black">Active Sessions</h3>
              {mobileSessions.map((session) => (
                <div
                  key={session.id}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconDeviceMobile size={18} className="text-blue-600" />
                        <h4 className="font-semibold text-black">{session.deviceName}</h4>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {session.deviceType}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>App: {session.appName} ({session.appPackage})</p>
                        <p>Requests: {session.requests}</p>
                        <p>Vulnerabilities: {session.vulnerabilities.length}</p>
                        <p>
                          Certificate Pinning:{' '}
                          {session.certificatePinning ? (
                            <span className="text-green-600">Enabled</span>
                          ) : (
                            <span className="text-red-600">Disabled</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBypassSSLPinning(session.id)}
                        className="rounded-xl bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm"
                      >
                        Bypass Pinning
                      </button>
                      <button
                        onClick={() => handleStopMobileSession(session.id)}
                        className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {mobileSessions.length === 0 && (
                <div className="apple-card rounded-2xl p-8 border border-gray-200 text-center">
                  <IconDeviceMobile size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">
                    No active mobile app sessions. Start a session to begin testing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-2 p-6">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="cursor-pointer apple-card rounded-2xl p-5 border border-gray-200 hover:bg-gray-50"
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-mono font-bold',
                          endpoint.method === 'GET' && 'bg-blue-100 text-blue-800',
                          endpoint.method === 'POST' && 'bg-green-100 text-green-800',
                          endpoint.method === 'PUT' && 'bg-yellow-100 text-yellow-800',
                          endpoint.method === 'DELETE' && 'bg-red-100 text-red-800'
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm text-black">{endpoint.path}</span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        {endpoint.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{endpoint.baseUrl}</p>
                    {endpoint.response && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                        <span
                          className={cn(
                            endpoint.response.statusCode >= 200 && endpoint.response.statusCode < 300
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {endpoint.response.statusCode}
                        </span>
                        <span>{endpoint.response.time}ms</span>
                        <span>{(endpoint.response.body?.length ?? 0)} bytes</span>
                      </div>
                    )}
                    {endpoint.vulnerabilities && endpoint.vulnerabilities.length > 0 && (
                      <p className="mt-2 text-sm text-orange-600">
                        {endpoint.vulnerabilities.length} vulnerabilities found
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestEndpoint(endpoint);
                      }}
                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      Test
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScanEndpoint(endpoint, 'quick');
                      }}
                      className="rounded-xl bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm"
                    >
                      Scan
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {endpoints.length === 0 && (
              <div className="apple-card rounded-2xl p-8 border border-gray-200 text-center">
                <IconApi size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  No endpoints discovered yet. Use the REST & SOAP tab to discover or import endpoints.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Endpoint Details Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedEndpoint(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-1 text-sm font-mono font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-lg">{selectedEndpoint.path}</span>
              </div>
              <button
                onClick={() => setSelectedEndpoint(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Base URL</h4>
                <p className="font-mono text-sm text-gray-600 dark:text-gray-400">{selectedEndpoint.baseUrl}</p>
              </div>

              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Parameters</h4>
                  <div className="space-y-1">
                    {selectedEndpoint.parameters.map((param, index) => (
                      <div key={index} className="rounded bg-gray-50 p-2 text-sm dark:bg-gray-900">
                        <span className="font-medium">{param.name}</span>{' '}
                        <span className="text-gray-500">
                          ({param.type}, {param.dataType})
                        </span>
                        {param.required && <span className="ml-2 text-red-500">required</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEndpoint.response && (
                <div>
                  <h4 className="mb-2 font-semibold">Response</h4>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-2 flex gap-4 text-sm">
                      <span>Status: <span className="font-semibold">{selectedEndpoint.response.statusCode}</span></span>
                      <span>Time: <span className="font-semibold">{selectedEndpoint.response.time}ms</span></span>
                      <span>Size: <span className="font-semibold">{(selectedEndpoint.response.body?.length ?? 0)} bytes</span></span>
                    </div>
                    <div className="mb-2">
                      <h5 className="mb-1 text-sm font-medium">Headers</h5>
                      <pre className="max-h-32 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-800">
                        {JSON.stringify(selectedEndpoint.response.headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h5 className="mb-1 text-sm font-medium">Body</h5>
                      <pre className="max-h-64 overflow-auto rounded bg-white p-2 text-xs dark:bg-gray-800">
                        {selectedEndpoint.response.body}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {selectedEndpoint.vulnerabilities && selectedEndpoint.vulnerabilities.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Vulnerabilities</h4>
                  <div className="space-y-2">
                    {selectedEndpoint.vulnerabilities.map((vuln, index) => (
                      <div
                        key={index}
                        className={cn(
                          'rounded-lg border p-3',
                          vuln.severity === 'critical' && 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
                          vuln.severity === 'high' && 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20',
                          vuln.severity === 'medium' && 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20',
                          vuln.severity === 'low' && 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white px-2 py-0.5 text-xs font-bold uppercase dark:bg-gray-800">
                            {vuln.severity}
                          </span>
                          <span className="font-semibold">{vuln.vulnerability}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{vuln.description}</p>
                        {vuln.cve && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">CVE: {vuln.cve}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
