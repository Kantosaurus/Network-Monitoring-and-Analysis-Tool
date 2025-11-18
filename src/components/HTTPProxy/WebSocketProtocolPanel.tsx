import React, { useState, useEffect } from 'react';
import { IconPlugConnected, IconPlugConnectedX, IconSend, IconNetwork, IconPlus, IconTrash, IconPlayerPlay, IconSettings } from '@tabler/icons-react';
import { WebSocketConnection, CustomProtocol, ProtocolMessage } from '@/types';
import { cn } from '@/lib/utils';

type WSTab = 'connections' | 'messages' | 'protocols' | 'history';

export const WebSocketProtocolPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WSTab>('connections');
  const [connections, setConnections] = useState<WebSocketConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<WebSocketConnection | null>(null);
  const [customProtocols, setCustomProtocols] = useState<CustomProtocol[]>([]);
  const [protocolMessages, setProtocolMessages] = useState<ProtocolMessage[]>([]);

  // WebSocket connection form
  const [wsUrl, setWsUrl] = useState('');
  const [wsProtocols, setWsProtocols] = useState('');

  // Message form
  const [messageToSend, setMessageToSend] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'binary'>('text');

  // Custom protocol form
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [protocolForm, setProtocolForm] = useState<Partial<CustomProtocol>>({
    name: '',
    port: 8080,
    type: 'text',
  });

  useEffect(() => {
    loadConnections();
    loadCustomProtocols();

    if (window.api) {
      window.api.onWebSocketMessage((message) => {
        // Update the connection with the new message
        setConnections((prev) =>
          prev.map((conn) => {
            if (conn.messages.some((m) => m.id === message.id)) {
              return conn;
            }
            // Add message to the appropriate connection
            return { ...conn, messages: [...conn.messages, message] };
          })
        );

        if (selectedConnection) {
          setSelectedConnection((prev) =>
            prev ? { ...prev, messages: [...prev.messages, message] } : null
          );
        }
      });

      window.api.onWebSocketConnectionChange((connection) => {
        setConnections((prev) => {
          const index = prev.findIndex((c) => c.id === connection.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = connection;
            return updated;
          }
          return [...prev, connection];
        });
      });

      window.api.onProtocolMessage((message) => {
        setProtocolMessages((prev) => [...prev, message]);
      });
    }
  }, []);

  const loadConnections = async () => {
    if (!window.api) return;
    const result = await window.api.websocketGetConnections();
    if (result.success && result.connections) {
      setConnections(result.connections);
    }
  };

  const loadCustomProtocols = async () => {
    if (!window.api) return;
    const result = await window.api.protocolGetCustom();
    if (result.success && result.protocols) {
      setCustomProtocols(result.protocols);
    }
  };

  const handleConnect = async () => {
    if (!window.api || !wsUrl) return;

    const protocols = wsProtocols.split(',').map((p) => p.trim()).filter(Boolean);
    const result = await window.api.websocketConnect(wsUrl, protocols.length > 0 ? protocols : undefined);

    if (result.success && result.connectionId) {
      alert(`Connected: ${result.connectionId}`);
      loadConnections();
      setWsUrl('');
      setWsProtocols('');
    } else {
      alert(`Connection failed: ${result.error}`);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!window.api) return;

    const result = await window.api.websocketDisconnect(connectionId);
    if (result.success) {
      loadConnections();
      if (selectedConnection?.id === connectionId) {
        setSelectedConnection(null);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!window.api || !selectedConnection || !messageToSend) return;

    const result = await window.api.websocketSend(
      selectedConnection.id,
      messageToSend,
      messageType
    );

    if (result.success) {
      setMessageToSend('');
      // Reload messages
      const messagesResult = await window.api.websocketGetMessages(selectedConnection.id);
      if (messagesResult.success && messagesResult.messages) {
        setSelectedConnection({
          ...selectedConnection,
          messages: messagesResult.messages,
        });
      }
    } else {
      alert(`Failed to send message: ${result.error}`);
    }
  };

  const handleToggleIntercept = async (connectionId: string, enabled: boolean) => {
    if (!window.api) return;

    const result = await window.api.websocketIntercept(connectionId, enabled);
    if (result.success) {
      alert(`Interception ${enabled ? 'enabled' : 'disabled'}`);
      loadConnections();
    }
  };

  const handleSaveProtocol = async () => {
    if (!window.api || !protocolForm.name) return;

    const protocol: CustomProtocol = {
      name: protocolForm.name,
      port: protocolForm.port!,
      type: protocolForm.type!,
      parser: protocolForm.parser,
      dissector: protocolForm.dissector,
    };

    const result = await window.api.protocolRegisterCustom(protocol);
    if (result.success) {
      loadCustomProtocols();
      setShowProtocolForm(false);
      setProtocolForm({ name: '', port: 8080, type: 'text' });
    } else {
      alert(`Failed to register protocol: ${result.error}`);
    }
  };

  const handleDeleteProtocol = async (name: string) => {
    if (!window.api || !confirm('Are you sure you want to delete this protocol?')) return;

    const result = await window.api.protocolDeleteCustom(name);
    if (result.success) {
      loadCustomProtocols();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">WebSocket & Protocol Support</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
        <button
          onClick={() => setActiveTab('connections')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'connections'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconPlugConnected size={18} />
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'messages'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconSend size={18} />
          Messages
        </button>
        <button
          onClick={() => setActiveTab('protocols')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'protocols'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconNetwork size={18} />
          Custom Protocols ({customProtocols.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-black opacity-60 hover:opacity-100'
          )}
        >
          <IconSettings size={18} />
          Protocol Messages ({protocolMessages.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {/* New Connection Form */}
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <h3 className="mb-3 font-bold text-black uppercase tracking-wide">New WebSocket Connection</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">WebSocket URL</label>
                  <input
                    type="url"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://example.com/socket or wss://example.com/socket"
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-black">Sub-protocols (comma-separated, optional)</label>
                  <input
                    type="text"
                    value={wsProtocols}
                    onChange={(e) => setWsProtocols(e.target.value)}
                    placeholder="chat, superchat"
                    className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                  />
                </div>
                <button
                  onClick={handleConnect}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  <IconPlugConnected size={18} />
                  Connect
                </button>
              </div>
            </div>

            {/* Active Connections */}
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="apple-card cursor-pointer rounded-2xl p-5 hover:bg-gray-50 transition-all border border-gray-200"
                  onClick={() => {
                    setSelectedConnection(connection);
                    setActiveTab('messages');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {connection.status === 'open' ? (
                          <IconPlugConnected size={18} className="text-green-600" />
                        ) : (
                          <IconPlugConnectedX size={18} className="text-red-600" />
                        )}
                        <span className="font-mono text-sm text-black">{connection.url}</span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-semibold',
                            connection.status === 'open'
                              ? 'bg-green-100 text-green-800'
                              : connection.status === 'connecting'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {connection.status}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-black opacity-80">
                        <span>Protocol: {connection.protocol || 'none'}</span>
                        <span>Messages: {connection.messages.length}</span>
                        <span>Started: {formatTimestamp(connection.startTime)}</span>
                        {connection.endTime && <span>Ended: {formatTimestamp(connection.endTime)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleIntercept(connection.id, true);
                        }}
                        className="rounded-xl bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700 shadow-sm"
                      >
                        <IconPlayerPlay size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect(connection.id);
                        }}
                        className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 shadow-sm"
                      >
                        <IconPlugConnectedX size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {connections.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconPlugConnected size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
                    No WebSocket connections. Enter a URL above to connect.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {selectedConnection ? (
              <>
                {/* Connection Info */}
                <div className="apple-card rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <IconPlugConnected size={18} className="text-green-600" />
                        <span className="font-mono text-sm text-black">{selectedConnection.url}</span>
                      </div>
                      <p className="mt-1 text-xs text-black opacity-60">
                        {selectedConnection.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConnection(null)}
                      className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Messages List */}
                <div className="max-h-96 space-y-3 overflow-auto">
                  {selectedConnection.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'rounded-2xl border-2 p-4',
                        message.direction === 'sent'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-green-600 bg-green-50'
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between text-xs text-black opacity-80">
                        <span className="font-bold uppercase tracking-wide">
                          {message.direction === 'sent' ? 'Sent' : 'Received'}
                        </span>
                        <span>{formatTimestamp(message.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-semibold',
                            message.type === 'text'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          )}
                        >
                          {message.type}
                        </span>
                        <span className="text-xs text-black opacity-60">
                          {message.size} bytes
                        </span>
                      </div>
                      <pre className="overflow-auto text-xs font-mono text-black rounded-xl bg-white p-3 border border-gray-200">
                        {message.type === 'text' ? message.data : `[Binary data: ${message.size} bytes]`}
                      </pre>
                    </div>
                  ))}
                </div>

                {/* Send Message Form */}
                {selectedConnection.status === 'open' && (
                  <div className="apple-card rounded-2xl p-5 border border-gray-200">
                    <h3 className="mb-3 font-bold text-black uppercase tracking-wide">Send Message</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select
                          value={messageType}
                          onChange={(e) => setMessageType(e.target.value as any)}
                          className="apple-input w-32 rounded-xl px-4 py-2.5 text-sm text-black"
                        >
                          <option value="text">Text</option>
                          <option value="binary">Binary</option>
                        </select>
                        <textarea
                          value={messageToSend}
                          onChange={(e) => setMessageToSend(e.target.value)}
                          rows={3}
                          placeholder="Enter message..."
                          className="apple-input flex-1 rounded-xl px-4 py-2.5 font-mono text-sm text-black"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                      >
                        <IconSend size={18} />
                        Send Message
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconSend size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
                  Select a WebSocket connection from the Connections tab to view and send messages.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Custom Protocols Tab */}
        {activeTab === 'protocols' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowProtocolForm(true)}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
              >
                <IconPlus size={18} />
                Add Protocol
              </button>
            </div>

            <div className="space-y-3">
              {customProtocols.map((protocol, index) => (
                <div
                  key={index}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <IconNetwork size={18} className="text-blue-600" />
                        <span className="font-bold text-black">{protocol.name}</span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          Port {protocol.port}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                          {protocol.type}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-black opacity-80">
                        {protocol.parser && <p>Parser: {protocol.parser}</p>}
                        {protocol.dissector && <p>Dissector: {protocol.dissector}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProtocol(protocol.name)}
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 shadow-sm"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {customProtocols.length === 0 && (
                <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                  <IconNetwork size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-black opacity-60">
                    No custom protocols registered. Click "Add Protocol" to create one.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Protocol Messages Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {protocolMessages.map((message, index) => (
              <div
                key={index}
                className="apple-card rounded-2xl p-5 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        {message.protocol}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800">
                        {message.direction}
                      </span>
                      <span className="text-xs text-black opacity-60">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      {message.parsedData ? (
                        <pre className="overflow-auto rounded-xl bg-gray-50 p-3 text-xs border border-gray-200 text-black">
                          {JSON.stringify(message.parsedData, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-black opacity-60">
                          Raw data: {message.rawData.length} bytes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {protocolMessages.length === 0 && (
              <div className="apple-card rounded-2xl border border-gray-200 p-8 text-center">
                <IconSettings size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-black opacity-60">
                  No protocol messages captured yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Protocol Form Modal */}
      {showProtocolForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-black uppercase tracking-wide">Add Custom Protocol</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Protocol Name</label>
                <input
                  type="text"
                  value={protocolForm.name}
                  onChange={(e) => setProtocolForm({ ...protocolForm, name: e.target.value })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Port</label>
                <input
                  type="number"
                  value={protocolForm.port}
                  onChange={(e) => setProtocolForm({ ...protocolForm, port: parseInt(e.target.value) })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Type</label>
                <select
                  value={protocolForm.type}
                  onChange={(e) => setProtocolForm({ ...protocolForm, type: e.target.value as any })}
                  className="apple-input w-full rounded-xl px-4 py-2.5 text-sm text-black"
                >
                  <option value="text">Text</option>
                  <option value="binary">Binary</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Parser (JavaScript function, optional)</label>
                <textarea
                  value={protocolForm.parser}
                  onChange={(e) => setProtocolForm({ ...protocolForm, parser: e.target.value })}
                  rows={4}
                  placeholder="function parseMessage(data) { ... }"
                  className="apple-input w-full rounded-xl px-4 py-2.5 font-mono text-sm text-black"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-black">Dissector (Lua script, optional)</label>
                <textarea
                  value={protocolForm.dissector}
                  onChange={(e) => setProtocolForm({ ...protocolForm, dissector: e.target.value })}
                  rows={4}
                  placeholder="-- Lua dissector code"
                  className="apple-input w-full rounded-xl px-4 py-2.5 font-mono text-sm text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowProtocolForm(false);
                  setProtocolForm({ name: '', port: 8080, type: 'text' });
                }}
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProtocol}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Save Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
