import React, { useState } from 'react';
import {
  IconBook,
  IconNetwork,
  IconGlobe,
  IconRobot,
  IconSettings,
  IconShield,
  IconCode,
  IconSearch,
  IconChevronRight,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

type DocSection =
  | 'overview'
  | 'packet-capture'
  | 'http-proxy'
  | 'ai-assistant'
  | 'settings'
  | 'api-reference'
  | 'shortcuts'
  | 'troubleshooting';

export const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: IconBook },
    { id: 'packet-capture' as const, label: 'Packet Capture', icon: IconNetwork },
    { id: 'http-proxy' as const, label: 'HTTP Proxy', icon: IconGlobe },
    { id: 'ai-assistant' as const, label: 'AI Assistant', icon: IconRobot },
    { id: 'settings' as const, label: 'Settings', icon: IconSettings },
    { id: 'api-reference' as const, label: 'API Reference', icon: IconCode },
    { id: 'shortcuts' as const, label: 'Keyboard Shortcuts', icon: IconShield },
    { id: 'troubleshooting' as const, label: 'Troubleshooting', icon: IconShield },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Welcome to NMAT</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                NMAT (Network Monitor & Analysis Tool) is a comprehensive security testing platform combining the power of Wireshark-style packet capture with Burp Suite-inspired HTTP proxy capabilities, enhanced with AI-powered analysis.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-black mb-3">Core Features</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <IconNetwork className="text-blue-600 mb-2" size={24} />
                  <h4 className="font-semibold text-black mb-1">Packet Capture</h4>
                  <p className="text-sm text-gray-700">Real-time network packet analysis with Wireshark-powered backend</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <IconGlobe className="text-green-600 mb-2" size={24} />
                  <h4 className="font-semibold text-black mb-1">HTTP Proxy</h4>
                  <p className="text-sm text-gray-700">Intercept, modify, and analyze HTTP/HTTPS traffic in real-time</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <IconRobot className="text-purple-600 mb-2" size={24} />
                  <h4 className="font-semibold text-black mb-1">AI Assistant</h4>
                  <p className="text-sm text-gray-700">Claude/Gemini powered assistant with 28 security testing tools</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <IconShield className="text-orange-600 mb-2" size={24} />
                  <h4 className="font-semibold text-black mb-1">Security Analysis</h4>
                  <p className="text-sm text-gray-700">Automated vulnerability scanning and threat detection</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-black mb-3">Quick Start</h3>
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li><strong>Configure Settings:</strong> Set up AI provider and network preferences</li>
                <li><strong>Start Packet Capture:</strong> Select network interface and begin monitoring</li>
                <li><strong>Launch HTTP Proxy:</strong> Configure browser to route traffic through NMAT</li>
                <li><strong>Use AI Assistant:</strong> Ask AI to perform automated security tests</li>
              </ol>
            </div>
          </div>
        );

      case 'packet-capture':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Packet Capture</h2>
              <p className="text-gray-700 leading-relaxed">
                Capture and analyze network traffic in real-time with Wireshark-powered analysis.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <IconChevronRight size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                  <span><strong>Live Capture:</strong> Monitor network traffic in real-time with customizable filters</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconChevronRight size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                  <span><strong>Protocol Analysis:</strong> Deep packet inspection with protocol hierarchy statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconChevronRight size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                  <span><strong>Expert Alerts:</strong> Automatic detection of network anomalies and security issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconChevronRight size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                  <span><strong>Statistics:</strong> Conversations, endpoints, I/O graphs, and flow analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconChevronRight size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                  <span><strong>Lua Scripting:</strong> Custom packet analysis with Lua scripts</span>
                </li>
                <li className="flex items-start gap-2">
                  <IconChevronRight size={16} className="mt-1 text-blue-600 flex-shrink-0" />
                  <span><strong>PCAP Import/Export:</strong> Load and save captures in standard formats</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Usage</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Starting Capture</h4>
                  <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
                    <li>Select network interface from dropdown</li>
                    <li>Configure capture options (promiscuous mode, snaplen)</li>
                    <li>Set BPF filter (optional): <code className="bg-gray-200 px-1 rounded">tcp port 80</code></li>
                    <li>Click "Start Capture"</li>
                  </ol>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Applying Filters</h4>
                  <p className="text-sm text-gray-700 mb-2">Common BPF filters:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li><code className="bg-gray-200 px-1 rounded">tcp port 443</code> - HTTPS traffic</li>
                    <li><code className="bg-gray-200 px-1 rounded">host 192.168.1.1</code> - Specific host</li>
                    <li><code className="bg-gray-200 px-1 rounded">not port 22</code> - Exclude SSH</li>
                    <li><code className="bg-gray-200 px-1 rounded">tcp[tcpflags] & tcp-syn != 0</code> - SYN packets</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'http-proxy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">HTTP Proxy</h2>
              <p className="text-gray-700 leading-relaxed">
                Intercept, inspect, and modify HTTP/HTTPS traffic with a comprehensive proxy toolkit.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Tools</h3>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Proxy & Intercept</h4>
                  <p className="text-sm text-gray-700">Capture and modify HTTP requests/responses in real-time</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Repeater</h4>
                  <p className="text-sm text-gray-700">Manually modify and resend individual requests</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Intruder</h4>
                  <p className="text-sm text-gray-700">Automated attacks with payload insertion (Sniper, Battering Ram, Pitchfork, Cluster Bomb)</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Scanner</h4>
                  <p className="text-sm text-gray-700">Automated vulnerability scanning with multiple scan types</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Spider</h4>
                  <p className="text-sm text-gray-700">Web crawler for discovering site structure and endpoints</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Decoder/Encoder</h4>
                  <p className="text-sm text-gray-700">Encode/decode data (Base64, URL, HTML, Hex, JWT)</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-black mb-2">Comparer</h4>
                  <p className="text-sm text-gray-700">Side-by-side comparison of requests/responses</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Browser Setup</h3>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-700 mb-2"><strong>Configure your browser:</strong></p>
                <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
                  <li>Start proxy on desired port (default: 8080)</li>
                  <li>Set browser proxy to <code className="bg-white px-1 rounded">localhost:8080</code></li>
                  <li>Install CA certificate for HTTPS interception</li>
                  <li>Browse normally - traffic will appear in proxy history</li>
                </ol>
              </div>
            </div>
          </div>
        );

      case 'ai-assistant':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">AI Assistant</h2>
              <p className="text-gray-700 leading-relaxed">
                AI-powered security testing with 28 tools for automated vulnerability discovery and analysis.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Configuration</h3>
              <ol className="space-y-2 text-gray-700 list-decimal list-inside">
                <li>Go to Settings → AI Assistant tab</li>
                <li>Choose provider: Anthropic Claude or Google Gemini</li>
                <li>Enter your API key</li>
                <li>Optionally specify model (defaults: claude-3-5-sonnet-20241022 or gemini-1.5-pro)</li>
                <li>Save settings</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Available Tools (28)</h3>

              <div className="mb-4">
                <h4 className="font-semibold text-black mb-2">HTTP Proxy Tools (15)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>• start_proxy</div>
                  <div>• stop_proxy</div>
                  <div>• get_proxy_history</div>
                  <div>• repeat_request</div>
                  <div>• run_intruder_attack</div>
                  <div>• vulnerability_scan</div>
                  <div>• start_spider</div>
                  <div>• decode_text</div>
                  <div>• encode_text</div>
                  <div>• compare_texts</div>
                  <div>• api_discover_endpoints</div>
                  <div>• api_test_endpoint</div>
                  <div>• js_analyze_file</div>
                  <div>• js_scan_for_secrets</div>
                  <div>• websocket_connect</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-black mb-2">Packet Capture Tools (13)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>• get_network_interfaces</div>
                  <div>• start_packet_capture</div>
                  <div>• stop_packet_capture</div>
                  <div>• get_protocol_hierarchy</div>
                  <div>• get_conversations</div>
                  <div>• get_endpoints</div>
                  <div>• get_expert_alerts</div>
                  <div>• resolve_hostname</div>
                  <div>• resolve_mac_vendor</div>
                  <div>• resolve_service</div>
                  <div>• export_packets</div>
                  <div>• load_pcap_file</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black mb-3">Example Queries</h3>
              <div className="space-y-2">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm font-mono text-purple-900">"Scan example.com for vulnerabilities"</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm font-mono text-purple-900">"Start capturing packets on eth0 and analyze protocols"</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm font-mono text-purple-900">"Test the API at https://api.example.com"</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm font-mono text-purple-900">"Find JavaScript secrets in example.com"</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Settings</h2>
              <p className="text-gray-700 leading-relaxed">
                Configure NMAT preferences, AI providers, and security settings.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-black mb-2">AI Assistant</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Provider: Anthropic Claude or Google Gemini</li>
                  <li>• API Key: Securely stored credentials</li>
                  <li>• Model: Custom model selection</li>
                  <li>• Max Tokens: Response length limit</li>
                  <li>• Auto Tool Call: Enable/disable automatic tool execution</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-black mb-2">General</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Default View: Starting page on launch</li>
                  <li>• Log Level: Logging verbosity</li>
                  <li>• Auto-save: Automatic project saving</li>
                  <li>• Confirm Exit: Exit confirmation dialog</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-black mb-2">Network</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Proxy Port: Default HTTP proxy port</li>
                  <li>• DNS Server: Custom DNS resolver</li>
                  <li>• Timeout: Request timeout duration</li>
                  <li>• IPv6: Enable IPv6 support</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-black mb-2">Security</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• SSL Validation: Verify certificates</li>
                  <li>• Follow Redirects: Auto-follow HTTP redirects</li>
                  <li>• Max Redirects: Redirect limit</li>
                  <li>• Self-Signed Certs: Allow untrusted certificates</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-black mb-2">Appearance</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Theme: Light, Dark, or Auto</li>
                  <li>• Accent Color: Primary UI color</li>
                  <li>• Font Size: Small, Medium, Large</li>
                  <li>• Compact Mode: Reduce UI spacing</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-black mb-2">Advanced</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Capture Buffer: Max packets in memory</li>
                  <li>• History Items: Max HTTP history entries</li>
                  <li>• Experimental Features: Beta functionality</li>
                  <li>• Debug Mode: Enhanced logging</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'api-reference':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">API Reference</h2>
              <p className="text-gray-700 leading-relaxed">
                Programmatic access to NMAT features via window.api interface.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> All API methods return promises with <code className="bg-white px-1 rounded">{'{ success: boolean, ... }'}</code> structure.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-black mb-3">Packet Capture API</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-gray-50 rounded">window.api.getInterfaces()</div>
                <div className="p-2 bg-gray-50 rounded">window.api.startCapture(device, options)</div>
                <div className="p-2 bg-gray-50 rounded">window.api.stopCapture()</div>
                <div className="p-2 bg-gray-50 rounded">window.api.getProtocolHierarchy()</div>
                <div className="p-2 bg-gray-50 rounded">window.api.getConversations(type)</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-black mb-3">HTTP Proxy API</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-gray-50 rounded">window.api.startProxy(port, settings)</div>
                <div className="p-2 bg-gray-50 rounded">window.api.stopProxy()</div>
                <div className="p-2 bg-gray-50 rounded">window.api.getProxyHistory(filters)</div>
                <div className="p-2 bg-gray-50 rounded">window.api.repeatRequest(requestData)</div>
                <div className="p-2 bg-gray-50 rounded">window.api.runIntruder(request, positions, payloads, type)</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-black mb-3">AI Assistant API</h3>
              <div className="space-y-2 font-mono text-sm">
                <div className="p-2 bg-gray-50 rounded">window.api.aiCallAnthropic(params)</div>
                <div className="p-2 bg-gray-50 rounded">window.api.aiCallGemini(params)</div>
              </div>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Keyboard Shortcuts</h2>
              <p className="text-gray-700 leading-relaxed">
                Boost productivity with keyboard shortcuts.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-black mb-3">Global</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Switch to Packet Capture</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+1</kbd>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Switch to HTTP Proxy</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+2</kbd>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Switch to AI Assistant</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+3</kbd>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Open Settings</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+,</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-black mb-3">Capture</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Start/Stop Capture</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+E</kbd>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Apply Filter</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+F</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-black mb-3">Proxy</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Start/Stop Proxy</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+P</kbd>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">Toggle Intercept</span>
                    <kbd className="px-2 py-1 bg-white rounded border text-sm">Ctrl+I</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-4">Troubleshooting</h2>
              <p className="text-gray-700 leading-relaxed">
                Common issues and solutions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-bold text-black mb-2">Packet Capture Not Starting</h3>
                <p className="text-sm text-gray-700 mb-2">Possible causes:</p>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>Insufficient permissions (requires root/administrator)</li>
                  <li>Network interface in use by another application</li>
                  <li>Invalid BPF filter syntax</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2"><strong>Solution:</strong> Run NMAT as administrator/root</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-bold text-black mb-2">HTTPS Interception Not Working</h3>
                <p className="text-sm text-gray-700 mb-2">Possible causes:</p>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>CA certificate not installed in browser</li>
                  <li>Browser using certificate pinning</li>
                  <li>Proxy not configured correctly</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2"><strong>Solution:</strong> Export and install CA certificate, configure browser proxy settings</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-bold text-black mb-2">AI Assistant Not Responding</h3>
                <p className="text-sm text-gray-700 mb-2">Possible causes:</p>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>Invalid API key</li>
                  <li>Network connectivity issues</li>
                  <li>Rate limiting by AI provider</li>
                  <li>Insufficient API credits</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2"><strong>Solution:</strong> Verify API key in Settings, check internet connection, review provider status</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h3 className="font-bold text-black mb-2">High Memory Usage</h3>
                <p className="text-sm text-gray-700 mb-2">Possible causes:</p>
                <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                  <li>Large packet capture buffer</li>
                  <li>Excessive proxy history</li>
                  <li>Multiple long-running operations</li>
                </ul>
                <p className="text-sm text-gray-700 mt-2"><strong>Solution:</strong> Reduce buffer sizes in Advanced Settings, clear history regularly</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconBook size={24} className="text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-black uppercase tracking-wide">Documentation</h2>
              <p className="text-xs text-gray-600">Complete guide to NMAT features</p>
            </div>
          </div>
          <div className="w-80">
            <div className="relative">
              <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation..."
                className="apple-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-black w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all flex items-center gap-3 text-left",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-black hover:bg-gray-100"
                  )}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
