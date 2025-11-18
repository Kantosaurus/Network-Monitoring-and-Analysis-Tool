import React, { useState, useEffect } from 'react';
import { IconBug, IconDatabase, IconTerminal, IconFlask, IconPlayerPlay, IconNetwork, IconRefresh } from '@tabler/icons-react';
import { InjectionTest, CollaboratorInteraction } from '@/types';
import { cn } from '@/lib/utils';

type InjectionTab = 'sql' | 'nosql' | 'command' | 'template' | 'xxe' | 'deserialization' | 'collaborator';

export const AdvancedInjectionPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InjectionTab>('sql');
  const [injectionTests, setInjectionTests] = useState<InjectionTest[]>([]);
  const [collaboratorInteractions, setCollaboratorInteractions] = useState<CollaboratorInteraction[]>([]);
  const [collaboratorUrl, setCollaboratorUrl] = useState<string>('');
  const [testing, setTesting] = useState(false);

  // Test configuration
  const [testConfig, setTestConfig] = useState({
    target: '',
    parameter: '',
    method: 'in-band' as 'in-band' | 'blind' | 'time-based' | 'out-of-band',
    language: 'java' as 'java' | 'php' | 'python' | 'ruby' | 'dotnet',
  });

  useEffect(() => {
    if (window.api) {
      window.api.onInjectionFound((test) => {
        setInjectionTests((prev) => [...prev, test]);
      });

      window.api.onCollaboratorInteraction((interaction) => {
        setCollaboratorInteractions((prev) => [...prev, interaction]);
      });
    }
  }, []);

  const handleStartCollaborator = async () => {
    if (!window.api) return;

    const result = await window.api.injectionStartCollaborator();
    if (result.success && result.url) {
      setCollaboratorUrl(result.url);
      alert(`Collaborator started at: ${result.url}`);
    } else {
      alert(`Failed to start collaborator: ${result.error}`);
    }
  };

  const loadCollaboratorInteractions = async () => {
    if (!window.api) return;

    const result = await window.api.injectionGetCollaboratorInteractions();
    if (result.success && result.interactions) {
      setCollaboratorInteractions(result.interactions);
    }
  };

  const handleTestSQL = async () => {
    if (!window.api || !testConfig.target || !testConfig.parameter) {
      alert('Please provide target URL and parameter name');
      return;
    }

    setTesting(true);
    const result = await window.api.injectionTestSQL(
      testConfig.target,
      testConfig.parameter,
      testConfig.method
    );
    setTesting(false);

    if (result.success && result.result) {
      setInjectionTests((prev) => [...prev, result.result!]);
      if (result.result.result === 'vulnerable') {
        alert(`SQL Injection found! Confidence: ${result.result.confidence * 100}%`);
      } else {
        alert('No SQL injection vulnerability detected');
      }
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleTestNoSQL = async () => {
    if (!window.api || !testConfig.target || !testConfig.parameter) {
      alert('Please provide target URL and parameter name');
      return;
    }

    setTesting(true);
    const result = await window.api.injectionTestNoSQL(testConfig.target, testConfig.parameter);
    setTesting(false);

    if (result.success && result.result) {
      setInjectionTests((prev) => [...prev, result.result!]);
      if (result.result.result === 'vulnerable') {
        alert(`NoSQL Injection found! Confidence: ${result.result.confidence * 100}%`);
      }
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleTestCommand = async () => {
    if (!window.api || !testConfig.target || !testConfig.parameter) {
      alert('Please provide target URL and parameter name');
      return;
    }

    setTesting(true);
    const result = await window.api.injectionTestCommand(testConfig.target, testConfig.parameter);
    setTesting(false);

    if (result.success && result.result) {
      setInjectionTests((prev) => [...prev, result.result!]);
      if (result.result.result === 'vulnerable') {
        alert(`Command Injection found! Confidence: ${result.result.confidence * 100}%`);
      }
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };


  const handleTestTemplate = async () => {
    if (!window.api || !testConfig.target || !testConfig.parameter) {
      alert('Please provide target URL and parameter name');
      return;
    }

    setTesting(true);
    const result = await window.api.injectionTestTemplate(testConfig.target, testConfig.parameter);
    setTesting(false);

    if (result.success && result.result) {
      if (result.result.vulnerable) {
        alert(`Template Injection found! RCE: ${result.result.rce ? 'Yes' : 'No'}`);
      }
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleTestXXE = async () => {
    if (!window.api || !testConfig.target) {
      alert('Please provide target URL');
      return;
    }

    setTesting(true);
    const result = await window.api.injectionTestXXE(testConfig.target);
    setTesting(false);

    if (result.success && result.result) {
      setInjectionTests((prev) => [...prev, result.result!]);
      if (result.result.result === 'vulnerable') {
        alert(`XXE vulnerability found! Confidence: ${result.result.confidence * 100}%`);
      }
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  const handleTestDeserialization = async () => {
    if (!window.api || !testConfig.target) {
      alert('Please provide target URL');
      return;
    }

    setTesting(true);
    const result = await window.api.injectionTestDeserialization(testConfig.target, testConfig.language);
    setTesting(false);

    if (result.success && result.result) {
      if (result.result.vulnerable) {
        alert(`Deserialization vulnerability found! RCE: ${result.result.rce ? 'Yes' : 'No'}`);
      }
    } else {
      alert(`Test failed: ${result.error}`);
    }
  };

  // helper icons/functionality removed because not referenced by the UI at present

  return (
    <div className="flex h-full flex-col gap-4 bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">Advanced Injection & Exploitation</h2>
        <p className="text-xs text-black opacity-60 mt-1">Test for SQL, NoSQL, Command Injection and more</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sql')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'sql'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          SQL Injection
        </button>
        <button
          onClick={() => setActiveTab('nosql')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'nosql'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          NoSQL Injection
        </button>
        <button
          onClick={() => setActiveTab('command')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'command'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          Command Injection
        </button>
        <button
          onClick={() => setActiveTab('template')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'template'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          Template Injection
        </button>
        <button
          onClick={() => setActiveTab('xxe')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'xxe'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          XXE
        </button>
        <button
          onClick={() => setActiveTab('deserialization')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'deserialization'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          Deserialization
        </button>
        <button
          onClick={() => setActiveTab('collaborator')}
          className={cn(
            'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'collaborator'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          Collaborator ({collaboratorInteractions.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* SQL Injection Tab */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">SQL Injection Testing</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={testConfig.target}
                    onChange={(e) => setTestConfig({ ...testConfig, target: e.target.value })}
                    placeholder="https://example.com/api/users"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Parameter Name</label>
                  <input
                    type="text"
                    value={testConfig.parameter}
                    onChange={(e) => setTestConfig({ ...testConfig, parameter: e.target.value })}
                    placeholder="id"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Detection Method</label>
                  <select
                    value={testConfig.method}
                    onChange={(e) => setTestConfig({ ...testConfig, method: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="in-band">In-Band (Error-based)</option>
                    <option value="blind">Blind (Boolean-based)</option>
                    <option value="time-based">Time-Based</option>
                    <option value="out-of-band">Out-of-Band (Collaborator)</option>
                  </select>
                </div>
                <button
                  onClick={handleTestSQL}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {testing ? 'Testing...' : 'Test SQL Injection'}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-2">
              {injectionTests
                .filter((test) => test.type === 'sql')
                .map((test, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-4',
                      test.result === 'vulnerable'
                        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <IconDatabase size={18} />
                          <span
                            className={cn(
                              'rounded px-2 py-0.5 text-xs font-bold uppercase',
                              test.result === 'vulnerable'
                                ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                                : 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                            )}
                          >
                            {test.result}
                          </span>
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {test.method}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Target:</strong> {test.target}
                          </p>
                          <p>
                            <strong>Parameter:</strong> {test.parameter}
                          </p>
                          <p>
                            <strong>Payload:</strong> <code className="font-mono text-xs">{test.payload}</code>
                          </p>
                          {test.evidence && (
                            <p>
                              <strong>Evidence:</strong> <code className="font-mono text-xs">{test.evidence}</code>
                            </p>
                          )}
                          <p>
                            <strong>Confidence:</strong> {(test.confidence * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">{new Date(test.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* NoSQL Injection Tab */}
        {activeTab === 'nosql' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">NoSQL Injection Testing</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={testConfig.target}
                    onChange={(e) => setTestConfig({ ...testConfig, target: e.target.value })}
                    placeholder="https://example.com/api/users"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Parameter Name</label>
                  <input
                    type="text"
                    value={testConfig.parameter}
                    onChange={(e) => setTestConfig({ ...testConfig, parameter: e.target.value })}
                    placeholder="id"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <button
                  onClick={handleTestNoSQL}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {testing ? 'Testing...' : 'Test NoSQL Injection'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {injectionTests
                .filter((test) => test.type === 'nosql')
                .map((test, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-4',
                      test.result === 'vulnerable'
                        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconDatabase size={18} />
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-bold uppercase',
                        test.result === 'vulnerable'
                          ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                          : 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                      )}>
                        {test.result}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong>Target:</strong> {test.target}</p>
                      <p><strong>Parameter:</strong> {test.parameter}</p>
                      <p><strong>Payload:</strong> <code className="font-mono text-xs">{test.payload}</code></p>
                      {test.evidence && <p><strong>Evidence:</strong> <code className="font-mono text-xs">{test.evidence}</code></p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Command Injection Tab */}
        {activeTab === 'command' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Command Injection Testing</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={testConfig.target}
                    onChange={(e) => setTestConfig({ ...testConfig, target: e.target.value })}
                    placeholder="https://example.com/api/ping"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Parameter Name</label>
                  <input
                    type="text"
                    value={testConfig.parameter}
                    onChange={(e) => setTestConfig({ ...testConfig, parameter: e.target.value })}
                    placeholder="host"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <button
                  onClick={handleTestCommand}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {testing ? 'Testing...' : 'Test Command Injection'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {injectionTests
                .filter((test) => test.type === 'command')
                .map((test, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-4',
                      test.result === 'vulnerable'
                        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconTerminal size={18} />
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-bold uppercase',
                        test.result === 'vulnerable'
                          ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                          : 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                      )}>
                        {test.result}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong>Target:</strong> {test.target}</p>
                      <p><strong>Parameter:</strong> {test.parameter}</p>
                      <p><strong>Payload:</strong> <code className="font-mono text-xs">{test.payload}</code></p>
                      {test.evidence && <p><strong>Evidence:</strong> <code className="font-mono text-xs">{test.evidence}</code></p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Template Injection Tab */}
        {activeTab === 'template' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Server-Side Template Injection (SSTI)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={testConfig.target}
                    onChange={(e) => setTestConfig({ ...testConfig, target: e.target.value })}
                    placeholder="https://example.com/template"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Parameter Name</label>
                  <input
                    type="text"
                    value={testConfig.parameter}
                    onChange={(e) => setTestConfig({ ...testConfig, parameter: e.target.value })}
                    placeholder="template"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <button
                  onClick={handleTestTemplate}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {testing ? 'Testing...' : 'Test Template Injection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* XXE Tab */}
        {activeTab === 'xxe' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">XML External Entity (XXE) Testing</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={testConfig.target}
                    onChange={(e) => setTestConfig({ ...testConfig, target: e.target.value })}
                    placeholder="https://example.com/api/xml"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <button
                  onClick={handleTestXXE}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {testing ? 'Testing...' : 'Test XXE Vulnerability'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {injectionTests
                .filter((test) => test.type === 'xxe')
                .map((test, index) => (
                  <div
                    key={index}
                    className={cn(
                      'rounded-lg border p-4',
                      test.result === 'vulnerable'
                        ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconBug size={18} />
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-bold uppercase',
                        test.result === 'vulnerable'
                          ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                          : 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                      )}>
                        {test.result}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong>Target:</strong> {test.target}</p>
                      <p><strong>Payload:</strong> <code className="font-mono text-xs">{test.payload}</code></p>
                      {test.evidence && <p><strong>Evidence:</strong> <code className="font-mono text-xs">{test.evidence}</code></p>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Deserialization Tab */}
        {activeTab === 'deserialization' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Insecure Deserialization Testing</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Target URL</label>
                  <input
                    type="url"
                    value={testConfig.target}
                    onChange={(e) => setTestConfig({ ...testConfig, target: e.target.value })}
                    placeholder="https://example.com/api/deserialize"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Language/Platform</label>
                  <select
                    value={testConfig.language}
                    onChange={(e) => setTestConfig({ ...testConfig, language: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="java">Java</option>
                    <option value="php">PHP</option>
                    <option value="python">Python</option>
                    <option value="ruby">Ruby</option>
                    <option value="dotnet">.NET</option>
                  </select>
                </div>
                <button
                  onClick={handleTestDeserialization}
                  disabled={testing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {testing ? 'Testing...' : 'Test Deserialization'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collaborator Tab */}
        {activeTab === 'collaborator' && (
          <div className="space-y-4">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-black">Out-of-Band Collaborator</h3>
              <p className="mb-3 text-sm text-black opacity-60">
                The collaborator allows you to detect vulnerabilities that use out-of-band techniques, such as blind SQL injection, XXE, and SSRF.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleStartCollaborator}
                  disabled={!!collaboratorUrl}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  <IconPlayerPlay size={18} />
                  {collaboratorUrl ? 'Collaborator Running' : 'Start Collaborator'}
                </button>
                {collaboratorUrl && (
                  <button
                    onClick={loadCollaboratorInteractions}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                  >
                    <IconRefresh size={18} />
                    Refresh
                  </button>
                )}
              </div>
              {collaboratorUrl && (
                <div className="mt-3 apple-card rounded-2xl p-5 bg-blue-50 border border-blue-200">
                  <p className="text-sm font-semibold text-black">Collaborator URL:</p>
                  <code className="mt-1 block break-all font-mono text-sm text-black opacity-75">{collaboratorUrl}</code>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Interactions</h3>
              {collaboratorInteractions.map((interaction, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconNetwork size={18} />
                    <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-bold uppercase text-green-900 dark:bg-green-800 dark:text-green-100">
                      {interaction.protocol}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(interaction.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><strong>Subdomain:</strong> {interaction.subdomain}</p>
                    <p><strong>Source IP:</strong> {interaction.sourceIp}</p>
                    {interaction.data && (
                      <p><strong>Data:</strong> <code className="font-mono text-xs">{interaction.data}</code></p>
                    )}
                    {interaction.relatedTest && (
                      <p><strong>Related Test:</strong> {interaction.relatedTest}</p>
                    )}
                  </div>
                </div>
              ))}

              {collaboratorInteractions.length === 0 && (
                <div className="apple-card rounded-2xl p-8 text-center border border-gray-200">
                  <IconNetwork size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No interactions received yet. Use the collaborator URL in your payloads to detect out-of-band vulnerabilities.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
