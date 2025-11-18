// AI Tool Definitions for HTTP Proxy and Packet Capture features

export interface AITool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  category: 'http-proxy' | 'packet-capture';
}

// HTTP Proxy Tools
export const httpProxyTools: AITool[] = [
  {
    name: 'start_proxy',
    description: 'Start the HTTP proxy server on a specified port to intercept HTTP/HTTPS traffic',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'The port number to run the proxy on (1-65535)',
          minimum: 1,
          maximum: 65535
        }
      },
      required: ['port']
    },
    category: 'http-proxy'
  },
  {
    name: 'stop_proxy',
    description: 'Stop the currently running HTTP proxy server',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    category: 'http-proxy'
  },
  {
    name: 'get_proxy_history',
    description: 'Get the history of HTTP requests that have been captured by the proxy',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          description: 'Optional filters to apply to the history',
          properties: {
            method: { type: 'string', description: 'Filter by HTTP method (GET, POST, etc.)' },
            host: { type: 'string', description: 'Filter by hostname' },
            statusCode: { type: 'number', description: 'Filter by response status code' }
          }
        }
      }
    },
    category: 'http-proxy'
  },
  {
    name: 'repeat_request',
    description: 'Resend a captured HTTP request, optionally with modifications',
    inputSchema: {
      type: 'object',
      properties: {
        requestData: {
          type: 'object',
          description: 'The request data to send',
          properties: {
            raw: { type: 'string', description: 'Raw HTTP request text' }
          }
        }
      },
      required: ['requestData']
    },
    category: 'http-proxy'
  },
  {
    name: 'run_intruder_attack',
    description: 'Run an automated attack using the Intruder tool to test for vulnerabilities with payloads',
    inputSchema: {
      type: 'object',
      properties: {
        requestData: {
          type: 'object',
          description: 'Base request data',
          properties: {
            raw: { type: 'string', description: 'Raw HTTP request with {{markers}} for payload positions' }
          }
        },
        positions: {
          type: 'array',
          description: 'Payload injection positions marked in the request',
          items: {
            type: 'object',
            properties: {
              start: { type: 'number' },
              end: { type: 'number' },
              name: { type: 'string' }
            }
          }
        },
        payloads: {
          type: 'array',
          description: 'Array of payload strings to inject',
          items: { type: 'string' }
        },
        attackType: {
          type: 'string',
          description: 'Type of attack to perform',
          enum: ['sniper', 'battering-ram', 'pitchfork', 'cluster-bomb']
        }
      },
      required: ['requestData', 'positions', 'payloads', 'attackType']
    },
    category: 'http-proxy'
  },
  {
    name: 'vulnerability_scan',
    description: 'Run a vulnerability scan against a target URL to identify security issues',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'The target URL to scan'
        },
        scanType: {
          type: 'string',
          description: 'Type of scan to perform',
          enum: ['quick', 'full', 'web', 'ssl']
        }
      },
      required: ['target', 'scanType']
    },
    category: 'http-proxy'
  },
  {
    name: 'start_spider',
    description: 'Start crawling a website to discover endpoints and map the site structure',
    inputSchema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          description: 'Spider configuration',
          properties: {
            maxDepth: { type: 'number', description: 'Maximum crawl depth' },
            maxPages: { type: 'number', description: 'Maximum pages to crawl' }
          }
        },
        startUrls: {
          type: 'array',
          description: 'Starting URLs for the spider',
          items: { type: 'string' }
        }
      },
      required: ['config', 'startUrls']
    },
    category: 'http-proxy'
  },
  {
    name: 'decode_text',
    description: 'Decode encoded text using various methods (base64, URL, hex, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to decode'
        },
        method: {
          type: 'string',
          description: 'Decoding method to use',
          enum: ['base64', 'url', 'html', 'hex', 'unicode', 'jwt']
        }
      },
      required: ['text', 'method']
    },
    category: 'http-proxy'
  },
  {
    name: 'encode_text',
    description: 'Encode text using various methods (base64, URL, hex, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to encode'
        },
        method: {
          type: 'string',
          description: 'Encoding method to use',
          enum: ['base64', 'url', 'html', 'hex', 'unicode']
        },
        type: {
          type: 'string',
          description: 'Type of encoding (encode or decode)',
          enum: ['encode', 'decode']
        }
      },
      required: ['text', 'method', 'type']
    },
    category: 'http-proxy'
  },
  {
    name: 'compare_texts',
    description: 'Compare two texts to find differences (useful for analyzing responses)',
    inputSchema: {
      type: 'object',
      properties: {
        text1: {
          type: 'string',
          description: 'First text to compare'
        },
        text2: {
          type: 'string',
          description: 'Second text to compare'
        },
        mode: {
          type: 'string',
          description: 'Comparison mode',
          enum: ['line', 'word', 'character']
        }
      },
      required: ['text1', 'text2', 'mode']
    },
    category: 'http-proxy'
  },
  {
    name: 'api_discover_endpoints',
    description: 'Discover API endpoints from a target URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL to discover endpoints from'
        }
      },
      required: ['url']
    },
    category: 'http-proxy'
  },
  {
    name: 'api_test_endpoint',
    description: 'Test an API endpoint with specific parameters',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'object',
          description: 'API endpoint configuration',
          properties: {
            method: { type: 'string', description: 'HTTP method' },
            baseUrl: { type: 'string', description: 'Base URL' },
            path: { type: 'string', description: 'Endpoint path' },
            parameters: { type: 'array', description: 'Request parameters' },
            headers: { type: 'object', description: 'Request headers' },
            body: { type: 'string', description: 'Request body' }
          }
        }
      },
      required: ['endpoint']
    },
    category: 'http-proxy'
  },
  {
    name: 'js_analyze_file',
    description: 'Analyze a JavaScript file for vulnerabilities and secrets',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the JavaScript file to analyze'
        }
      },
      required: ['url']
    },
    category: 'http-proxy'
  },
  {
    name: 'js_scan_for_secrets',
    description: 'Scan JavaScript files for hardcoded secrets (API keys, tokens, passwords)',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL to scan for JavaScript secrets'
        }
      },
      required: ['url']
    },
    category: 'http-proxy'
  },
  {
    name: 'websocket_connect',
    description: 'Connect to a WebSocket endpoint',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'WebSocket URL to connect to'
        },
        options: {
          type: 'object',
          description: 'Connection options'
        }
      },
      required: ['url']
    },
    category: 'http-proxy'
  }
];

// Packet Capture Tools
export const packetCaptureTools: AITool[] = [
  {
    name: 'get_network_interfaces',
    description: 'Get a list of available network interfaces for packet capture',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    category: 'packet-capture'
  },
  {
    name: 'start_packet_capture',
    description: 'Start capturing network packets on a specific interface',
    inputSchema: {
      type: 'object',
      properties: {
        deviceName: {
          type: 'string',
          description: 'Name of the network interface to capture from'
        },
        options: {
          type: 'object',
          description: 'Capture options',
          properties: {
            filter: { type: 'string', description: 'BPF filter expression (e.g., "tcp port 80")' },
            promiscuous: { type: 'boolean', description: 'Enable promiscuous mode' },
            snaplen: { type: 'number', description: 'Snapshot length (max bytes per packet)' }
          }
        }
      },
      required: ['deviceName']
    },
    category: 'packet-capture'
  },
  {
    name: 'stop_packet_capture',
    description: 'Stop the current packet capture session',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    category: 'packet-capture'
  },
  {
    name: 'get_protocol_hierarchy',
    description: 'Get statistics about the protocol hierarchy in captured packets',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    category: 'packet-capture'
  },
  {
    name: 'get_conversations',
    description: 'Get network conversations (connections between endpoints)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of conversation to analyze',
          enum: ['ip', 'tcp', 'udp']
        }
      },
      required: ['type']
    },
    category: 'packet-capture'
  },
  {
    name: 'get_endpoints',
    description: 'Get statistics about network endpoints',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of endpoint statistics',
          enum: ['ip', 'tcp', 'udp']
        }
      },
      required: ['type']
    },
    category: 'packet-capture'
  },
  {
    name: 'get_expert_alerts',
    description: 'Get expert-level alerts about potential network issues',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    category: 'packet-capture'
  },
  {
    name: 'resolve_hostname',
    description: 'Resolve an IP address to a hostname',
    inputSchema: {
      type: 'object',
      properties: {
        ip: {
          type: 'string',
          description: 'IP address to resolve'
        }
      },
      required: ['ip']
    },
    category: 'packet-capture'
  },
  {
    name: 'resolve_mac_vendor',
    description: 'Resolve a MAC address to its vendor/manufacturer',
    inputSchema: {
      type: 'object',
      properties: {
        mac: {
          type: 'string',
          description: 'MAC address to look up'
        }
      },
      required: ['mac']
    },
    category: 'packet-capture'
  },
  {
    name: 'resolve_service',
    description: 'Resolve a port number to its common service name',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'Port number to resolve'
        }
      },
      required: ['port']
    },
    category: 'packet-capture'
  },
  {
    name: 'export_packets',
    description: 'Export captured packets to a file in various formats',
    inputSchema: {
      type: 'object',
      properties: {
        packets: {
          type: 'array',
          description: 'Array of packet objects to export'
        },
        format: {
          type: 'string',
          description: 'Export format',
          enum: ['pcap', 'pcapng', 'json', 'csv']
        }
      },
      required: ['packets', 'format']
    },
    category: 'packet-capture'
  },
  {
    name: 'load_pcap_file',
    description: 'Load and analyze a previously saved PCAP file',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    category: 'packet-capture'
  }
];

// Combine all tools
export const allTools: AITool[] = [...httpProxyTools, ...packetCaptureTools];

// Helper function to get tool by name
export function getToolByName(name: string): AITool | undefined {
  return allTools.find(tool => tool.name === name);
}

// Helper function to get tools by category
export function getToolsByCategory(category: 'http-proxy' | 'packet-capture'): AITool[] {
  return allTools.filter(tool => tool.category === category);
}
