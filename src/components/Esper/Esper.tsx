import React, { useState, useEffect, useRef } from 'react';
import { IconSparkles, IconBolt, IconCpu, IconTerminal, IconBrain } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import anime from 'animejs';

export const Esper: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Animate on mount
  useEffect(() => {
    if (controlsRef.current) {
      anime({
        targets: controlsRef.current.children,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(50),
        easing: 'easeOutQuad',
      });
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const userMessage = { role: 'user' as const, content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const assistantMessage = {
        role: 'assistant' as const,
        content: `Esper AI Analysis: Processing your query "${userMessage.content}". This is a placeholder response. Esper will integrate advanced network analysis, security testing insights, and intelligent automation capabilities.`
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const quickActions = [
    { label: 'Analyze Traffic', icon: <IconBrain size={16} />, prompt: 'Analyze recent network traffic patterns' },
    { label: 'Security Scan', icon: <IconBolt size={16} />, prompt: 'Run a comprehensive security scan' },
    { label: 'Performance Check', icon: <IconCpu size={16} />, prompt: 'Check system and network performance' },
    { label: 'Generate Report', icon: <IconTerminal size={16} />, prompt: 'Generate a detailed analysis report' },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div ref={controlsRef} className="apple-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <IconSparkles className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">Esper</h2>
            <p className="text-sm text-black font-mono opacity-70">AI-Powered Network Intelligence</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => setQuery(action.prompt)}
            className="apple-button rounded-xl px-4 py-3 text-left hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="text-blue-600">{action.icon}</div>
              <span className="text-xs font-semibold text-black">{action.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 apple-card rounded-2xl p-6 overflow-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <IconSparkles className="mx-auto mb-4 text-black opacity-20" size={64} />
              <p className="text-black font-mono text-sm opacity-70">
                Welcome to Esper. Ask me anything about your network, security, or performance.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 font-mono text-sm',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'apple-card'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="apple-card rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs font-mono text-black opacity-70">Esper is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="apple-card rounded-2xl p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Esper anything..."
            className="flex-1 apple-input rounded-xl px-4 py-3 text-sm font-mono"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!query.trim() || isProcessing}
            className="apple-button rounded-xl px-6 py-3 text-sm font-semibold bg-blue-600 text-white border-none hover:bg-blue-700 disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
