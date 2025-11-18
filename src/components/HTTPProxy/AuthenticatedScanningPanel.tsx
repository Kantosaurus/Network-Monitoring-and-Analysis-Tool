import React, { useState, useEffect } from 'react';
import { IconKey, IconPlus, IconTrash, IconPlayerPlay, IconCheck, IconX, IconSettings, IconLock, IconShield } from '@tabler/icons-react';
import { Credential, AuthMacro, SessionRule, AuthenticatedScanResult, AuthMacroStep } from '@/types';
import { cn } from '@/lib/utils';

type AuthTab = 'credentials' | 'macros' | 'session-rules' | 'scan-results';

export const AuthenticatedScanningPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('credentials');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [macros, setMacros] = useState<AuthMacro[]>([]);
  const [sessionRules, setSessionRules] = useState<SessionRule[]>([]);
  const [scanResults, setScanResults] = useState<AuthenticatedScanResult[]>([]);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [showMacroForm, setShowMacroForm] = useState(false);
  const [showSessionRuleForm, setShowSessionRuleForm] = useState(false);
  const [testingCredential, setTestingCredential] = useState<string | null>(null);

  // Credential form state
  const [credentialForm, setCredentialForm] = useState<Partial<Credential>>({
    name: '',
    type: 'form-based',
    username: '',
    password: '',
    loginUrl: '',
  });

  // Macro form state
  const [macroForm, setMacroForm] = useState<Partial<AuthMacro>>({
    name: '',
    description: '',
    steps: [],
  });

  // Session rule form state
  const [sessionRuleForm, setSessionRuleForm] = useState<Partial<SessionRule>>({
    name: '',
    condition: '',
    action: 'relogin',
  });

  // Scan configuration
  const [scanConfig, setScanConfig] = useState({
    credentialId: '',
    targetUrl: '',
    scanType: 'quick',
  });

  useEffect(() => {
    loadCredentials();
    loadMacros();
    loadSessionRules();
  }, []);

  const loadCredentials = async () => {
    if (!window.api) return;
    const result = await window.api.authGetCredentials();
    if (result.success && result.credentials) {
      setCredentials(result.credentials);
    }
  };

  const loadMacros = async () => {
    if (!window.api) return;
    const result = await window.api.authGetMacros();
    if (result.success && result.macros) {
      setMacros(result.macros);
    }
  };

  const loadSessionRules = async () => {
    if (!window.api) return;
    const result = await window.api.authGetSessionRules();
    if (result.success && result.rules) {
      setSessionRules(result.rules);
    }
  };

  const handleSaveCredential = async () => {
    if (!window.api || !credentialForm.name) return;

    const credential: Credential = {
      id: Date.now().toString(),
      name: credentialForm.name,
      type: credentialForm.type || 'form-based',
      username: credentialForm.username,
      password: credentialForm.password,
      token: credentialForm.token,
      domain: credentialForm.domain,
      apiKey: credentialForm.apiKey,
      loginUrl: credentialForm.loginUrl,
      headers: credentialForm.headers,
      cookies: credentialForm.cookies,
    };

    const result = await window.api.authSaveCredential(credential);
    if (result.success) {
      loadCredentials();
      setShowCredentialForm(false);
      setCredentialForm({ name: '', type: 'form-based' });
    } else {
      alert(`Failed to save credential: ${result.error}`);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!window.api || !confirm('Are you sure you want to delete this credential?')) return;
    const result = await window.api.authDeleteCredential(id);
    if (result.success) {
      loadCredentials();
    }
  };

  const handleTestCredential = async (id: string) => {
    if (!window.api || !scanConfig.targetUrl) {
      alert('Please enter a target URL to test the credential');
      return;
    }

    setTestingCredential(id);
    const result = await window.api.authTestCredential(id, scanConfig.targetUrl);
    setTestingCredential(null);

    if (result.success) {
      alert(result.authenticated ? 'Authentication successful!' : 'Authentication failed');
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleSaveMacro = async () => {
    if (!window.api || !macroForm.name) return;

    const macro: AuthMacro = {
      id: Date.now().toString(),
      name: macroForm.name,
      steps: macroForm.steps || [],
      description: macroForm.description,
    };

    const result = await window.api.authCreateMacro(macro);
    if (result.success) {
      loadMacros();
      setShowMacroForm(false);
      setMacroForm({ name: '', description: '', steps: [] });
    }
  };

  const handleDeleteMacro = async (id: string) => {
    if (!window.api || !confirm('Are you sure you want to delete this macro?')) return;
    const result = await window.api.authDeleteMacro(id);
    if (result.success) {
      loadMacros();
    }
  };

  const handleRunMacro = async (id: string) => {
    if (!window.api) return;
    const result = await window.api.authRunMacro(id);
    if (result.success) {
      alert('Macro executed successfully');
    } else {
      alert(`Macro execution failed: ${result.error}`);
    }
  };

  const handleSaveSessionRule = async () => {
    if (!window.api || !sessionRuleForm.name) return;

    const rule: SessionRule = {
      id: Date.now().toString(),
      name: sessionRuleForm.name,
      condition: sessionRuleForm.condition || '',
      action: sessionRuleForm.action || 'relogin',
      macroId: sessionRuleForm.macroId,
    };

    const result = await window.api.authCreateSessionRule(rule);
    if (result.success) {
      loadSessionRules();
      setShowSessionRuleForm(false);
      setSessionRuleForm({ name: '', condition: '', action: 'relogin' });
    }
  };

  const handleDeleteSessionRule = async (id: string) => {
    if (!window.api || !confirm('Are you sure you want to delete this session rule?')) return;
    const result = await window.api.authDeleteSessionRule(id);
    if (result.success) {
      loadSessionRules();
    }
  };

  const handleStartAuthenticatedScan = async () => {
    if (!window.api || !scanConfig.credentialId || !scanConfig.targetUrl) {
      alert('Please select a credential and enter a target URL');
      return;
    }

    const result = await window.api.authScanWithCredentials(
      scanConfig.credentialId,
      scanConfig.targetUrl,
      scanConfig.scanType
    );

    if (result.success && result.result) {
      setScanResults([...scanResults, result.result]);
      setActiveTab('scan-results');
      alert('Authenticated scan completed successfully');
    } else {
      alert(`Scan failed: ${result.error}`);
    }
  };

  const addMacroStep = () => {
    const newStep: AuthMacroStep = {
      type: 'request',
      url: '',
      method: 'GET',
      headers: {},
      body: '',
    };
    setMacroForm({
      ...macroForm,
      steps: [...(macroForm.steps || []), newStep],
    });
  };

  const updateMacroStep = (index: number, step: AuthMacroStep) => {
    const steps = [...(macroForm.steps || [])];
    steps[index] = step;
    setMacroForm({ ...macroForm, steps });
  };

  const removeMacroStep = (index: number) => {
    const steps = [...(macroForm.steps || [])];
    steps.splice(index, 1);
    setMacroForm({ ...macroForm, steps });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black uppercase tracking-wide">Authenticated Scanning</h2>
          <div className="flex gap-2">
            {activeTab === 'credentials' && (
              <button
                onClick={() => setShowCredentialForm(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <IconPlus size={18} />
                Add Credential
              </button>
            )}
            {activeTab === 'macros' && (
              <button
                onClick={() => setShowMacroForm(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <IconPlus size={18} />
                Add Macro
              </button>
            )}
            {activeTab === 'session-rules' && (
              <button
                onClick={() => setShowSessionRuleForm(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <IconPlus size={18} />
                Add Session Rule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('credentials')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'credentials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconKey size={18} />
            Credentials ({credentials.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('macros')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'macros'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconSettings size={18} />
            Macros ({macros.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('session-rules')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'session-rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconShield size={18} />
            Session Rules ({sessionRules.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('scan-results')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'scan-results'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          <div className="flex items-center gap-2">
            <IconPlayerPlay size={18} />
            Scan Results ({scanResults.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            {/* Scan Configuration */}
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-black mb-4">Quick Authenticated Scan</h3>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Select Credential</label>
                  <select
                    value={scanConfig.credentialId}
                    onChange={(e) => setScanConfig({ ...scanConfig, credentialId: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="">-- Select Credential --</option>
                    {credentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.name} ({cred.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={scanConfig.targetUrl}
                    onChange={(e) => setScanConfig({ ...scanConfig, targetUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Scan Type</label>
                  <select
                    value={scanConfig.scanType}
                    onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="quick">Quick Scan</option>
                    <option value="full">Full Scan</option>
                    <option value="web">Web Application Scan</option>
                  </select>
                </div>
                <button
                  onClick={handleStartAuthenticatedScan}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                >
                  <IconPlayerPlay size={18} />
                  Start Authenticated Scan
                </button>
              </div>
            </div>

            {/* Credentials List */}
            <div className="space-y-2">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconLock size={18} className="text-blue-600" />
                        <h4 className="text-sm font-semibold text-black">{credential.name}</h4>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {credential.type}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {credential.username && <p>Username: {credential.username}</p>}
                        {credential.domain && <p>Domain: {credential.domain}</p>}
                        {credential.loginUrl && <p>Login URL: {credential.loginUrl}</p>}
                        {credential.token && <p>Token: {credential.token.substring(0, 20)}...</p>}
                        {credential.apiKey && <p>API Key: {credential.apiKey.substring(0, 20)}...</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTestCredential(credential.id)}
                        disabled={testingCredential === credential.id}
                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                      >
                        {testingCredential === credential.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleDeleteCredential(credential.id)}
                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {credentials.length === 0 && (
                <div className="apple-card rounded-2xl p-8 border border-gray-200 text-center">
                  <IconKey size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">
                    No credentials configured. Click "Add Credential" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Macros Tab */}
        {activeTab === 'macros' && (
          <div className="space-y-2">
            {macros.map((macro) => (
              <div
                key={macro.id}
                className="apple-card rounded-2xl p-5 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-black">{macro.name}</h4>
                    {macro.description && (
                      <p className="mt-1 text-sm text-gray-600">{macro.description}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      {macro.steps.length} step{macro.steps.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRunMacro(macro.id)}
                      className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                    >
                      <IconPlayerPlay size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMacro(macro.id)}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {macros.length === 0 && (
              <div className="apple-card rounded-2xl p-8 border border-gray-200 text-center">
                <IconSettings size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  No macros configured. Click "Add Macro" to create multi-step authentication flows.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Session Rules Tab */}
        {activeTab === 'session-rules' && (
          <div className="space-y-2">
            {sessionRules.map((rule) => (
              <div
                key={rule.id}
                className="apple-card rounded-2xl p-5 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-black">{rule.name}</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>Condition: {rule.condition}</p>
                      <p>Action: {rule.action}</p>
                      {rule.macroId && <p>Macro ID: {rule.macroId}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSessionRule(rule.id)}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
            {sessionRules.length === 0 && (
              <div className="apple-card rounded-2xl p-8 border border-gray-200 text-center">
                <IconShield size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  No session rules configured. Click "Add Session Rule" to handle session management.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scan Results Tab */}
        {activeTab === 'scan-results' && (
          <div className="space-y-2">
            {scanResults.map((result, index) => (
              <div
                key={index}
                className="apple-card rounded-2xl p-5 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-black">Scan #{result.scanId}</h4>
                      {result.authenticated ? (
                        <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          <IconCheck size={14} />
                          Authenticated
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          <IconX size={14} />
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>Credential ID: {result.credentialId}</p>
                      <p>Pages Accessed: {result.pagesAccessed}</p>
                      <p>Vulnerabilities Found: {result.vulnerabilities.length}</p>
                      <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>
                      {result.errors.length > 0 && (
                        <p className="text-red-600">
                          Errors: {result.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {scanResults.length === 0 && (
              <div className="apple-card rounded-2xl p-8 border border-gray-200 text-center">
                <IconPlayerPlay size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">
                  No scan results yet. Run an authenticated scan to see results here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credential Form Modal */}
      {showCredentialForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl apple-card rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-black uppercase tracking-wide">Add Credential</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-black mb-2 block">Name</label>
                <input
                  type="text"
                  value={credentialForm.name}
                  onChange={(e) => setCredentialForm({ ...credentialForm, name: e.target.value })}
                  className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-black mb-2 block">Type</label>
                <select
                  value={credentialForm.type}
                  onChange={(e) => setCredentialForm({ ...credentialForm, type: e.target.value as any })}
                  className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                >
                  <option value="form-based">Form-Based</option>
                  <option value="ntlm">NTLM</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="digest">Digest Auth</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="api-key">API Key</option>
                </select>
              </div>

              {(credentialForm.type === 'form-based' || credentialForm.type === 'basic' || credentialForm.type === 'digest' || credentialForm.type === 'ntlm') && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-black mb-2 block">Username</label>
                    <input
                      type="text"
                      value={credentialForm.username}
                      onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-black mb-2 block">Password</label>
                    <input
                      type="password"
                      value={credentialForm.password}
                      onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                    />
                  </div>
                </>
              )}

              {credentialForm.type === 'ntlm' && (
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Domain</label>
                  <input
                    type="text"
                    value={credentialForm.domain}
                    onChange={(e) => setCredentialForm({ ...credentialForm, domain: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
              )}

              {credentialForm.type === 'form-based' && (
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Login URL</label>
                  <input
                    type="url"
                    value={credentialForm.loginUrl}
                    onChange={(e) => setCredentialForm({ ...credentialForm, loginUrl: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
              )}

              {credentialForm.type === 'bearer' && (
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Bearer Token</label>
                  <input
                    type="text"
                    value={credentialForm.token}
                    onChange={(e) => setCredentialForm({ ...credentialForm, token: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
              )}

              {credentialForm.type === 'api-key' && (
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">API Key</label>
                  <input
                    type="text"
                    value={credentialForm.apiKey}
                    onChange={(e) => setCredentialForm({ ...credentialForm, apiKey: e.target.value })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCredentialForm(false);
                  setCredentialForm({ name: '', type: 'form-based' });
                }}
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredential}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Save Credential
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Macro Form Modal */}
      {showMacroForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto apple-card rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-black uppercase tracking-wide">Add Authentication Macro</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-black mb-2 block">Macro Name</label>
                <input
                  type="text"
                  value={macroForm.name}
                  onChange={(e) => setMacroForm({ ...macroForm, name: e.target.value })}
                  className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-black mb-2 block">Description</label>
                <textarea
                  value={macroForm.description}
                  onChange={(e) => setMacroForm({ ...macroForm, description: e.target.value })}
                  rows={2}
                  className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-black">Steps</label>
                  <button
                    onClick={addMacroStep}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                  >
                    <IconPlus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {(macroForm.steps || []).map((step, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 p-3 bg-gray-50">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-black">Step {index + 1}</span>
                        <button
                          onClick={() => removeMacroStep(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <select
                          value={step.type}
                          onChange={(e) => updateMacroStep(index, { ...step, type: e.target.value as any })}
                          className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                        >
                          <option value="request">HTTP Request</option>
                          <option value="extract">Extract Value</option>
                          <option value="wait">Wait</option>
                          <option value="script">Run Script</option>
                        </select>

                        {step.type === 'request' && (
                          <>
                            <input
                              type="text"
                              placeholder="URL"
                              value={step.url}
                              onChange={(e) => updateMacroStep(index, { ...step, url: e.target.value })}
                              className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                            />
                            <select
                              value={step.method}
                              onChange={(e) => updateMacroStep(index, { ...step, method: e.target.value })}
                              className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                            >
                              <option value="GET">GET</option>
                              <option value="POST">POST</option>
                              <option value="PUT">PUT</option>
                              <option value="DELETE">DELETE</option>
                            </select>
                          </>
                        )}

                        {step.type === 'extract' && (
                          <>
                            <input
                              type="text"
                              placeholder="Variable name"
                              value={step.extractVariable}
                              onChange={(e) => updateMacroStep(index, { ...step, extractVariable: e.target.value })}
                              className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                            />
                            <input
                              type="text"
                              placeholder="Regex pattern"
                              value={step.extractRegex}
                              onChange={(e) => updateMacroStep(index, { ...step, extractRegex: e.target.value })}
                              className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                            />
                          </>
                        )}

                        {step.type === 'wait' && (
                          <input
                            type="number"
                            placeholder="Wait time (ms)"
                            value={step.waitMs}
                            onChange={(e) => updateMacroStep(index, { ...step, waitMs: parseInt(e.target.value) })}
                            className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                          />
                        )}

                        {step.type === 'script' && (
                          <textarea
                            placeholder="JavaScript code"
                            value={step.script}
                            onChange={(e) => updateMacroStep(index, { ...step, script: e.target.value })}
                            rows={3}
                            className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full font-mono"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMacroForm(false);
                  setMacroForm({ name: '', description: '', steps: [] });
                }}
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMacro}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Save Macro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Rule Form Modal */}
      {showSessionRuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-bold">Add Session Rule</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Rule Name</label>
                <input
                  type="text"
                  value={sessionRuleForm.name}
                  onChange={(e) => setSessionRuleForm({ ...sessionRuleForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Condition (e.g., response contains "logged out")</label>
                <input
                  type="text"
                  value={sessionRuleForm.condition}
                  onChange={(e) => setSessionRuleForm({ ...sessionRuleForm, condition: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Action</label>
                <select
                  value={sessionRuleForm.action}
                  onChange={(e) => setSessionRuleForm({ ...sessionRuleForm, action: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="relogin">Re-login</option>
                  <option value="refresh-token">Refresh Token</option>
                  <option value="update-cookie">Update Cookie</option>
                  <option value="run-macro">Run Macro</option>
                </select>
              </div>
              {sessionRuleForm.action === 'run-macro' && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Select Macro</label>
                  <select
                    value={sessionRuleForm.macroId}
                    onChange={(e) => setSessionRuleForm({ ...sessionRuleForm, macroId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">-- Select Macro --</option>
                    {macros.map((macro) => (
                      <option key={macro.id} value={macro.id}>
                        {macro.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSessionRuleForm(false);
                  setSessionRuleForm({ name: '', condition: '', action: 'relogin' });
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSessionRule}
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Save Session Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
