import React, { useState, useEffect } from 'react';
import {
  IconSettings,
  IconRobot,
  IconPalette,
  IconNetwork,
  IconShield,
  IconCode,
  IconCheck,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'ai' | 'general' | 'network' | 'security' | 'appearance' | 'advanced';

interface AISettings {
  provider: 'anthropic' | 'gemini';
  apiKey: string;
  model: string;
  enableAutoToolCall: boolean;
  maxTokens: number;
}

interface GeneralSettings {
  autoSave: boolean;
  confirmBeforeExit: boolean;
  defaultView: 'capture' | 'proxy' | 'ai' | 'esper';
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

interface NetworkSettings {
  defaultProxyPort: number;
  enableIPv6: boolean;
  dnsServer: string;
  timeout: number;
}

interface SecuritySettings {
  validateSSL: boolean;
  followRedirects: boolean;
  maxRedirects: number;
  allowSelfSignedCerts: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

interface AdvancedSettings {
  enableExperimentalFeatures: boolean;
  debugMode: boolean;
  maxCaptureBuffer: number;
  maxHistoryItems: number;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Settings state
  const [aiSettings, setAISettings] = useState<AISettings>({
    provider: 'anthropic',
    apiKey: '',
    model: '',
    enableAutoToolCall: true,
    maxTokens: 4096,
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    autoSave: true,
    confirmBeforeExit: true,
    defaultView: 'capture',
    logLevel: 'info',
  });

  const [networkSettings, setNetworkSettings] = useState<NetworkSettings>({
    defaultProxyPort: 8080,
    enableIPv6: false,
    dnsServer: '8.8.8.8',
    timeout: 30000,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    validateSSL: true,
    followRedirects: true,
    maxRedirects: 5,
    allowSelfSignedCerts: false,
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    accentColor: '#0071e3',
    fontSize: 'medium',
    compactMode: false,
  });

  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    enableExperimentalFeatures: false,
    debugMode: false,
    maxCaptureBuffer: 10000,
    maxHistoryItems: 1000,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!window.api) return;

    try {
      const result = await window.api.settingsGet();
      if (result.success && result.settings) {
        if (result.settings.ai) setAISettings(result.settings.ai);
        if (result.settings.general) setGeneralSettings(result.settings.general);
        if (result.settings.network) setNetworkSettings(result.settings.network);
        if (result.settings.security) setSecuritySettings(result.settings.security);
        if (result.settings.appearance) setAppearanceSettings(result.settings.appearance);
        if (result.settings.advanced) setAdvancedSettings(result.settings.advanced);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    if (!window.api) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const result = await window.api.settingsSave({
        ai: aiSettings,
        general: generalSettings,
        network: networkSettings,
        security: securitySettings,
        appearance: appearanceSettings,
        advanced: advancedSettings,
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults?')) return;

    if (!window.api) return;

    try {
      const result = await window.api.settingsReset();
      if (result.success) {
        loadSettings();
        alert('Settings reset to defaults');
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const tabs = [
    { id: 'ai' as const, label: 'AI Assistant', icon: IconRobot },
    { id: 'general' as const, label: 'General', icon: IconSettings },
    { id: 'network' as const, label: 'Network', icon: IconNetwork },
    { id: 'security' as const, label: 'Security', icon: IconShield },
    { id: 'appearance' as const, label: 'Appearance', icon: IconPalette },
    { id: 'advanced' as const, label: 'Advanced', icon: IconCode },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconSettings size={24} className="text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">Settings</h2>
            <p className="text-xs text-gray-600">Configure NMAT preferences</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm flex items-center gap-2",
              saveSuccess ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700",
              isSaving && "opacity-50"
            )}
          >
            {saveSuccess ? (
              <>
                <IconCheck size={16} />
                Saved!
              </>
            ) : (
              <>Save Settings</>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center gap-3",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-black hover:bg-gray-100"
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">AI Assistant Configuration</h3>
                <p className="text-sm text-gray-600">Configure AI provider and model settings</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">AI Provider</label>
                  <select
                    value={aiSettings.provider}
                    onChange={(e) => setAISettings({ ...aiSettings, provider: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose your preferred AI provider for the assistant
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={aiSettings.apiKey}
                      onChange={(e) => setAISettings({ ...aiSettings, apiKey: e.target.value })}
                      placeholder={aiSettings.provider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full pr-12"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is encrypted and stored securely
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Model (Optional)</label>
                  <input
                    type="text"
                    value={aiSettings.model}
                    onChange={(e) => setAISettings({ ...aiSettings, model: e.target.value })}
                    placeholder={aiSettings.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-1.5-pro'}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use the default model
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Max Tokens</label>
                  <input
                    type="number"
                    value={aiSettings.maxTokens}
                    onChange={(e) => setAISettings({ ...aiSettings, maxTokens: parseInt(e.target.value) })}
                    min={1024}
                    max={100000}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum tokens for AI responses (affects cost and response length)
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="autoToolCall"
                    checked={aiSettings.enableAutoToolCall}
                    onChange={(e) => setAISettings({ ...aiSettings, enableAutoToolCall: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="autoToolCall" className="text-sm text-black flex-1">
                    <span className="font-semibold">Enable Automatic Tool Calling</span>
                    <p className="text-xs text-gray-600 mt-0.5">Allow AI to automatically execute security testing tools</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">General Settings</h3>
                <p className="text-sm text-gray-600">Application behavior and preferences</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Default View</label>
                  <select
                    value={generalSettings.defaultView}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, defaultView: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="capture">Packet Capture</option>
                    <option value="proxy">HTTP Proxy</option>
                    <option value="ai">AI Assistant</option>
                    <option value="esper">Esper</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    The view shown when NMAT starts
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Log Level</label>
                  <select
                    value={generalSettings.logLevel}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, logLevel: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Level of detail for application logs
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="autoSave"
                      checked={generalSettings.autoSave}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, autoSave: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="autoSave" className="text-sm text-black flex-1">
                      <span className="font-semibold">Auto-save Projects</span>
                      <p className="text-xs text-gray-600 mt-0.5">Automatically save project changes</p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="confirmExit"
                      checked={generalSettings.confirmBeforeExit}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, confirmBeforeExit: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="confirmExit" className="text-sm text-black flex-1">
                      <span className="font-semibold">Confirm Before Exit</span>
                      <p className="text-xs text-gray-600 mt-0.5">Show confirmation dialog when closing NMAT</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Network Settings */}
          {activeTab === 'network' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">Network Settings</h3>
                <p className="text-sm text-gray-600">Configure network and proxy settings</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Default Proxy Port</label>
                  <input
                    type="number"
                    value={networkSettings.defaultProxyPort}
                    onChange={(e) => setNetworkSettings({ ...networkSettings, defaultProxyPort: parseInt(e.target.value) })}
                    min={1}
                    max={65535}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default port for HTTP proxy server
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">DNS Server</label>
                  <input
                    type="text"
                    value={networkSettings.dnsServer}
                    onChange={(e) => setNetworkSettings({ ...networkSettings, dnsServer: e.target.value })}
                    placeholder="8.8.8.8"
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    DNS server for hostname resolution
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Request Timeout (ms)</label>
                  <input
                    type="number"
                    value={networkSettings.timeout}
                    onChange={(e) => setNetworkSettings({ ...networkSettings, timeout: parseInt(e.target.value) })}
                    min={1000}
                    max={300000}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Timeout for network requests in milliseconds
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="enableIPv6"
                    checked={networkSettings.enableIPv6}
                    onChange={(e) => setNetworkSettings({ ...networkSettings, enableIPv6: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="enableIPv6" className="text-sm text-black flex-1">
                    <span className="font-semibold">Enable IPv6</span>
                    <p className="text-xs text-gray-600 mt-0.5">Support IPv6 addresses for packet capture and proxy</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">Security Settings</h3>
                <p className="text-sm text-gray-600">SSL/TLS and security preferences</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Max Redirects</label>
                  <input
                    type="number"
                    value={securitySettings.maxRedirects}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxRedirects: parseInt(e.target.value) })}
                    min={0}
                    max={20}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of HTTP redirects to follow
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="validateSSL"
                      checked={securitySettings.validateSSL}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, validateSSL: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="validateSSL" className="text-sm text-black flex-1">
                      <span className="font-semibold">Validate SSL Certificates</span>
                      <p className="text-xs text-gray-600 mt-0.5">Verify SSL/TLS certificates for HTTPS connections</p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="followRedirects"
                      checked={securitySettings.followRedirects}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, followRedirects: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="followRedirects" className="text-sm text-black flex-1">
                      <span className="font-semibold">Follow HTTP Redirects</span>
                      <p className="text-xs text-gray-600 mt-0.5">Automatically follow HTTP 3xx redirects</p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <input
                      type="checkbox"
                      id="allowSelfSigned"
                      checked={securitySettings.allowSelfSignedCerts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, allowSelfSignedCerts: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="allowSelfSigned" className="text-sm text-black flex-1">
                      <div className="flex items-center gap-2">
                        <IconAlertCircle size={16} className="text-yellow-600" />
                        <span className="font-semibold">Allow Self-Signed Certificates</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">⚠️ Warning: Only enable for testing environments</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">Appearance Settings</h3>
                <p className="text-sm text-gray-600">Customize the look and feel of NMAT</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Theme</label>
                  <select
                    value={appearanceSettings.theme}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, theme: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose your preferred color theme
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Accent Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={appearanceSettings.accentColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                      className="w-16 h-10 rounded-xl border border-gray-300"
                    />
                    <input
                      type="text"
                      value={appearanceSettings.accentColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                      className="apple-input rounded-xl px-4 py-2.5 text-sm text-black flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Primary accent color for the interface
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Font Size</label>
                  <select
                    value={appearanceSettings.fontSize}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value as any })}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Base font size for the interface
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="compactMode"
                    checked={appearanceSettings.compactMode}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, compactMode: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="compactMode" className="text-sm text-black flex-1">
                    <span className="font-semibold">Compact Mode</span>
                    <p className="text-xs text-gray-600 mt-0.5">Reduce spacing and padding for a denser layout</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">Advanced Settings</h3>
                <p className="text-sm text-gray-600">Performance and developer options</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Max Capture Buffer Size</label>
                  <input
                    type="number"
                    value={advancedSettings.maxCaptureBuffer}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, maxCaptureBuffer: parseInt(e.target.value) })}
                    min={100}
                    max={100000}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of packets to keep in memory
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-black mb-2 block">Max History Items</label>
                  <input
                    type="number"
                    value={advancedSettings.maxHistoryItems}
                    onChange={(e) => setAdvancedSettings({ ...advancedSettings, maxHistoryItems: parseInt(e.target.value) })}
                    min={100}
                    max={10000}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of HTTP requests to keep in history
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <input
                      type="checkbox"
                      id="experimentalFeatures"
                      checked={advancedSettings.enableExperimentalFeatures}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, enableExperimentalFeatures: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="experimentalFeatures" className="text-sm text-black flex-1">
                      <div className="flex items-center gap-2">
                        <IconAlertCircle size={16} className="text-yellow-600" />
                        <span className="font-semibold">Enable Experimental Features</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">⚠️ Warning: May be unstable</p>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="debugMode"
                      checked={advancedSettings.debugMode}
                      onChange={(e) => setAdvancedSettings({ ...advancedSettings, debugMode: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="debugMode" className="text-sm text-black flex-1">
                      <span className="font-semibold">Debug Mode</span>
                      <p className="text-xs text-gray-600 mt-0.5">Show debug information and logs</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
