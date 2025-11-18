import React, { useState, useRef, useEffect } from 'react';
import { IconRobot, IconSend, IconSettings, IconTrash, IconChevronDown, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { AIAgent, AIProvider, AIMessage } from '@/services/aiAgent';
import { allTools } from '@/services/aiTools';
import { cn } from '@/lib/utils';

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Settings loaded from settings page
  const [provider, setProvider] = useState<AIProvider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load AI settings on mount
  useEffect(() => {
    loadAISettings();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAISettings = async () => {
    if (!window.api) return;

    try {
      const result = await window.api.settingsGet();
      if (result.success && result.settings?.ai) {
        const aiSettings = result.settings.ai;
        setProvider(aiSettings.provider);
        setApiKey(aiSettings.apiKey);
        setModel(aiSettings.model);

        // Auto-configure if API key is present
        if (aiSettings.apiKey) {
          const newAgent = new AIAgent({
            provider: aiSettings.provider,
            apiKey: aiSettings.apiKey,
            model: aiSettings.model || undefined
          });

          setAgent(newAgent);
          setIsConfigured(true);

          // Add welcome message
          setMessages([{
            role: 'assistant',
            content: `Hello! I'm your AI assistant for NMAT. I can help you with network security tasks using ${allTools.length} available tools across HTTP Proxy and Packet Capture features. How can I help you today?`
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !agent) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message to display
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      // Send to AI agent
      const response = await agent.sendMessage(userMessage);

      // Add assistant response
      setMessages(prev => [...prev, response]);
    } catch (error: any) {
      console.error('AI error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response from AI'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear conversation history?')) {
      agent?.clearHistory();
      setMessages([{
        role: 'assistant',
        content: `Conversation cleared. How can I help you?`
      }]);
    }
  };

  const renderToolCall = (toolCall: any) => {
    return (
      <div key={toolCall.id} className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <IconSettings size={16} />
          Tool: {toolCall.name}
        </div>
        <pre className="mt-2 text-xs text-blue-800 overflow-auto">
          {JSON.stringify(toolCall.input, null, 2)}
        </pre>
      </div>
    );
  };

  const renderToolResult = (result: any) => {
    return (
      <div className="p-3 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-center gap-2 text-sm font-semibold text-green-900">
          <IconCheck size={16} />
          Result
        </div>
        <pre className="mt-2 text-xs text-green-800 overflow-auto max-h-48">
          {result.error ? (
            <span className="text-red-600">{result.error}</span>
          ) : (
            JSON.stringify(result.result, null, 2)
          )}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconRobot size={24} className="text-purple-600" />
          <div>
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">AI Assistant</h2>
            <p className="text-xs text-gray-600">
              {isConfigured ? (
                <>Powered by {provider === 'anthropic' ? 'Claude' : 'Gemini'} • {allTools.length} tools available</>
              ) : (
                'Configure AI in Settings to get started'
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearHistory}
            disabled={!isConfigured || messages.length === 0}
            className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm disabled:opacity-50"
          >
            <IconTrash size={16} className="inline mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!isConfigured && (
          <div className="text-center py-12">
            <IconRobot size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-bold text-black mb-2">Welcome to AI Assistant</h3>
            <p className="text-gray-600 mb-4">
              Configure your AI provider in Settings to start using {allTools.length} powerful tools for network security analysis.
            </p>
            <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
              <IconSettings size={16} />
              <span>Go to Settings → AI Assistant to configure</span>
            </div>

            {/* Available Tools Preview */}
            <div className="mt-8 text-left max-w-2xl mx-auto">
              <h4 className="text-sm font-bold text-black uppercase tracking-wide mb-3">Available Capabilities</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="apple-card rounded-xl p-4 border border-gray-200">
                  <h5 className="font-semibold text-black mb-2">HTTP Proxy Tools</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Start/Stop proxy server</li>
                    <li>• Vulnerability scanning</li>
                    <li>• API testing</li>
                    <li>• JavaScript analysis</li>
                    <li>• Intruder attacks</li>
                  </ul>
                </div>
                <div className="apple-card rounded-xl p-4 border border-gray-200">
                  <h5 className="font-semibold text-black mb-2">Packet Capture Tools</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Network interface capture</li>
                    <li>• Protocol analysis</li>
                    <li>• Expert alerts</li>
                    <li>• DNS/MAC resolution</li>
                    <li>• PCAP export</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {isConfigured && messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-4",
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-black'
              )}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' && (
                  <IconRobot size={20} className="flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Tool Calls */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolCalls.map(toolCall => renderToolCall(toolCall))}
                    </div>
                  )}

                  {/* Tool Results */}
                  {message.toolResults && message.toolResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolResults.map((result, i) => (
                        <div key={i}>{renderToolResult(result)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-black">
                <IconRobot size={20} />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isConfigured && (
        <div className="px-6 py-4 border-t border-gray-200">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to help with network security tasks..."
              disabled={isLoading}
              className="apple-input flex-1 rounded-xl px-4 py-3 text-sm text-black disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <IconSend size={18} />
              Send
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            The AI can call {allTools.length} tools to help you analyze network traffic and find security vulnerabilities.
          </p>
        </div>
      )}
    </div>
  );
};
