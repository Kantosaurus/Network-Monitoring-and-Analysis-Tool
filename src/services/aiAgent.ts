// AI Agent Service - Handles interaction with AI models and tool execution

import { allTools, getToolByName, AITool } from './aiTools';

export type AIProvider = 'anthropic' | 'gemini';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: any;
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

export interface AIAgentConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export class AIAgent {
  private config: AIAgentConfig;
  private conversationHistory: AIMessage[] = [];

  constructor(config: AIAgentConfig) {
    this.config = config;
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessage(message: string): Promise<AIMessage> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    // Send to appropriate AI provider
    if (this.config.provider === 'anthropic') {
      return await this.sendToAnthropic(message);
    } else {
      return await this.sendToGemini(message);
    }
  }

  /**
   * Send message to Anthropic Claude
   */
  private async sendToAnthropic(message: string): Promise<AIMessage> {
    if (!window.api) {
      throw new Error('API not available');
    }

    // Convert our tools to Anthropic format
    const tools = allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }));

    // Call backend to interact with Anthropic
    const response = await window.api.aiCallAnthropic({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      apiKey: this.config.apiKey,
      messages: this.conversationHistory,
      tools: tools,
      maxTokens: 4096
    });

    if (!response.success) {
      throw new Error(response.error || 'AI request failed');
    }

    // Process the response
    const assistantMessage: AIMessage = {
      role: 'assistant',
      content: response.content || '',
      toolCalls: response.toolCalls
    };

    // If there are tool calls, execute them
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults = await this.executeTools(response.toolCalls);

      // Add assistant message with tool calls
      this.conversationHistory.push(assistantMessage);

      // Add tool results and get final response
      const finalResponse = await this.continueWithToolResults(toolResults);
      return finalResponse;
    }

    // Add to history
    this.conversationHistory.push(assistantMessage);

    return assistantMessage;
  }

  /**
   * Send message to Google Gemini
   */
  private async sendToGemini(message: string): Promise<AIMessage> {
    if (!window.api) {
      throw new Error('API not available');
    }

    // Convert our tools to Gemini format (function declarations)
    const tools = allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }));

    // Call backend to interact with Gemini
    const response = await window.api.aiCallGemini({
      model: this.config.model || 'gemini-1.5-pro',
      apiKey: this.config.apiKey,
      messages: this.conversationHistory,
      tools: tools
    });

    if (!response.success) {
      throw new Error(response.error || 'AI request failed');
    }

    // Process the response
    const assistantMessage: AIMessage = {
      role: 'assistant',
      content: response.content || '',
      toolCalls: response.toolCalls
    };

    // If there are tool calls, execute them
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults = await this.executeTools(response.toolCalls);

      // Add assistant message with tool calls
      this.conversationHistory.push(assistantMessage);

      // Add tool results and get final response
      const finalResponse = await this.continueWithToolResults(toolResults);
      return finalResponse;
    }

    // Add to history
    this.conversationHistory.push(assistantMessage);

    return assistantMessage;
  }

  /**
   * Execute tool calls
   */
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const tool = getToolByName(toolCall.name);
        if (!tool) {
          results.push({
            toolCallId: toolCall.id,
            result: null,
            error: `Tool ${toolCall.name} not found`
          });
          continue;
        }

        // Execute the tool
        const result = await this.executeTool(toolCall.name, toolCall.input);

        results.push({
          toolCallId: toolCall.id,
          result: result
        });
      } catch (error: any) {
        results.push({
          toolCallId: toolCall.id,
          result: null,
          error: error.message || 'Tool execution failed'
        });
      }
    }

    return results;
  }

  /**
   * Execute a single tool
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    if (!window.api) {
      throw new Error('API not available');
    }

    // Map tool names to their corresponding API calls
    const toolExecutors: Record<string, () => Promise<any>> = {
      // HTTP Proxy tools
      'start_proxy': () => window.api!.startProxy(input.port),
      'stop_proxy': () => window.api!.stopProxy(),
      'get_proxy_history': () => window.api!.getProxyHistory(input.filters),
      'repeat_request': () => window.api!.repeatRequest(input.requestData),
      'run_intruder_attack': () => window.api!.runIntruder(
        input.requestData,
        input.positions,
        input.payloads,
        input.attackType
      ),
      'vulnerability_scan': () => window.api!.vulnerabilityScan(input.target, input.scanType),
      'start_spider': () => window.api!.startSpider(input.config, input.startUrls),
      'decode_text': () => window.api!.decodeText(input.text, input.method),
      'encode_text': () => window.api!.encodeText(input.text, input.method, input.type),
      'compare_texts': () => window.api!.compareTexts(input.text1, input.text2, input.mode),
      'api_discover_endpoints': () => window.api!.apiDiscoverEndpoints(input.url),
      'api_test_endpoint': () => window.api!.apiTestEndpoint(input.endpoint),
      'js_analyze_file': () => window.api!.jsAnalyzeFile(input.url),
      'js_scan_for_secrets': () => window.api!.jsScanForSecrets(input.url),
      'websocket_connect': () => window.api!.websocketConnect(input.url, input.options),

      // Packet Capture tools
      'get_network_interfaces': () => window.api!.getInterfaces(),
      'start_packet_capture': () => window.api!.startCapture(input.deviceName, input.options),
      'stop_packet_capture': () => window.api!.stopCapture(),
      'get_protocol_hierarchy': () => window.api!.getProtocolHierarchy(),
      'get_conversations': () => window.api!.getConversations(input.type),
      'get_endpoints': () => window.api!.getEndpoints(input.type),
      'get_expert_alerts': () => window.api!.getExpertAlerts(),
      'resolve_hostname': () => window.api!.resolveHostname(input.ip),
      'resolve_mac_vendor': () => window.api!.resolveMacVendor(input.mac),
      'resolve_service': () => window.api!.resolveService(input.port),
      'export_packets': () => window.api!.exportPackets(input.packets, input.format),
      'load_pcap_file': () => window.api!.loadPcapFile()
    };

    const executor = toolExecutors[toolName];
    if (!executor) {
      throw new Error(`No executor found for tool: ${toolName}`);
    }

    return await executor();
  }

  /**
   * Continue conversation with tool results
   */
  private async continueWithToolResults(toolResults: ToolResult[]): Promise<AIMessage> {
    // Add tool results to history
    const toolResultMessage: AIMessage = {
      role: 'user',
      content: 'Tool execution results',
      toolResults: toolResults
    };
    this.conversationHistory.push(toolResultMessage);

    // Get final response from AI
    if (this.config.provider === 'anthropic') {
      const tools = allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
      }));

      const response = await window.api!.aiCallAnthropic({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        apiKey: this.config.apiKey,
        messages: this.conversationHistory,
        tools: tools,
        maxTokens: 4096
      });

      const finalMessage: AIMessage = {
        role: 'assistant',
        content: response.content || ''
      };

      this.conversationHistory.push(finalMessage);
      return finalMessage;
    } else {
      const tools = allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }));

      const response = await window.api!.aiCallGemini({
        model: this.config.model || 'gemini-1.5-pro',
        apiKey: this.config.apiKey,
        messages: this.conversationHistory,
        tools: tools
      });

      const finalMessage: AIMessage = {
        role: 'assistant',
        content: response.content || ''
      };

      this.conversationHistory.push(finalMessage);
      return finalMessage;
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): AIMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get available tools
   */
  getAvailableTools(): AITool[] {
    return allTools;
  }
}
