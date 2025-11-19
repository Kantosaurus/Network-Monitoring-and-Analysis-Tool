# AI Assistant - Network Security Testing with AI Tool Use

The AI Assistant feature allows you to interact with AI models (Anthropic Claude or Google Gemini) that can call tools to perform network security testing tasks automatically.

## Overview

The AI Assistant has access to **28 powerful tools** across HTTP Proxy and Packet Capture features:

### HTTP Proxy Tools (15 tools)
- **start_proxy** - Start the HTTP proxy server
- **stop_proxy** - Stop the HTTP proxy server
- **get_proxy_history** - Get captured HTTP requests
- **repeat_request** - Resend HTTP requests with modifications
- **run_intruder_attack** - Automated attack testing with payloads
- **vulnerability_scan** - Scan targets for security vulnerabilities
- **start_spider** - Crawl websites to discover endpoints
- **decode_text** - Decode encoded text (base64, URL, hex, etc.)
- **encode_text** - Encode text using various methods
- **compare_texts** - Compare two texts to find differences
- **api_discover_endpoints** - Discover API endpoints
- **api_test_endpoint** - Test API endpoints
- **js_analyze_file** - Analyze JavaScript files for vulnerabilities
- **js_scan_for_secrets** - Scan for hardcoded secrets
- **websocket_connect** - Connect to WebSocket endpoints

### Packet Capture Tools (12 tools)
- **get_network_interfaces** - List available network interfaces
- **start_packet_capture** - Start capturing network packets
- **stop_packet_capture** - Stop packet capture
- **get_protocol_hierarchy** - Get protocol statistics
- **get_conversations** - Get network conversations
- **get_endpoints** - Get endpoint statistics
- **get_expert_alerts** - Get expert-level network alerts
- **resolve_hostname** - Resolve IP to hostname
- **resolve_mac_vendor** - Resolve MAC address to vendor
- **resolve_service** - Resolve port to service name
- **export_packets** - Export packets to file
- **load_pcap_file** - Load PCAP files for analysis

## Getting Started

### 1. Configure the AI Assistant

Click on "AI Assistant" in the sidebar, then click "Configure":

**For Anthropic Claude:**
- Provider: `Anthropic Claude`
- API Key: Your Anthropic API key (starts with `sk-ant-`)
- Model (optional): `claude-3-5-sonnet-20241022` (default)

**For Google Gemini:**
- Provider: `Google Gemini`
- API Key: Your Google AI API key (starts with `AIza`)
- Model (optional): `gemini-1.5-pro` (default)

### 2. Start a Conversation

Once configured, you can start chatting with the AI. The AI can:
- Answer questions about network security
- Perform security testing tasks using available tools
- Analyze network traffic
- Discover vulnerabilities
- Generate reports

## Example Usage

### Example 1: Start a Vulnerability Scan

```
User: Scan https://example.com for vulnerabilities using a full scan

AI: I'll help you scan https://example.com for vulnerabilities using a full scan.
[AI calls vulnerability_scan tool with target: https://example.com, scanType: full]
[Tool returns results]

AI: I've completed the full vulnerability scan on https://example.com. Here are the findings:
- No critical vulnerabilities found
- 2 medium severity issues detected:
  1. Missing security headers (Content-Security-Policy)
  2. SSL/TLS configuration issues

Would you like me to provide more details on any of these findings?
```

### Example 2: Analyze Network Traffic

```
User: Start capturing packets on eth0 and tell me what protocols are being used

AI: I'll start capturing packets on eth0 and analyze the protocols.
[AI calls start_packet_capture with deviceName: eth0]
[Waits a moment]
[AI calls get_protocol_hierarchy]
[AI calls stop_packet_capture]

AI: I've captured and analyzed the network traffic. Here's the protocol breakdown:
- HTTP: 45%
- HTTPS: 35%
- DNS: 12%
- Other: 8%

The majority of traffic is web-based (HTTP/HTTPS). Would you like me to analyze the HTTP traffic for potential security issues?
```

### Example 3: Test an API

```
User: Discover and test API endpoints at https://api.example.com

AI: I'll discover and test the API endpoints at https://api.example.com.
[AI calls api_discover_endpoints with url: https://api.example.com]
[AI discovers endpoints]
[AI calls api_test_endpoint for each discovered endpoint]

AI: I've discovered 5 API endpoints:
1. GET /users - ✓ Working (200 OK)
2. POST /users - ✓ Working (201 Created)
3. GET /posts - ✓ Working (200 OK)
4. PUT /posts/:id - ⚠ Authentication required
5. DELETE /users/:id - ⚠ Authorization issue detected

Endpoint #5 allows deletion without proper authorization - this is a security vulnerability. Would you like me to investigate further?
```

### Example 4: Analyze JavaScript

```
User: Analyze the JavaScript at https://example.com/app.js for secrets

AI: I'll analyze the JavaScript file for hardcoded secrets and security issues.
[AI calls js_scan_for_secrets with url: https://example.com/app.js]

AI: Analysis complete! I found 3 potential security issues:
1. Hardcoded API key: "AIzaSyD..." (Google API key)
2. AWS access key pattern detected
3. Insecure localStorage usage for sensitive data

These secrets should be moved to environment variables and the file should be regenerated without the exposed credentials.
```

## How It Works

1. **User sends a message** - You describe what you want to do
2. **AI understands the request** - The AI analyzes your request and determines which tools to use
3. **AI calls tools** - The AI automatically calls the appropriate tools with correct parameters
4. **Tools execute** - The tools perform the actual security testing operations
5. **Results returned** - Tool results are sent back to the AI
6. **AI responds** - The AI analyzes the results and provides a human-readable summary

## Tool Call Flow

```
User Message → AI Analysis → Tool Selection → Tool Execution → Results → AI Response
```

The AI can chain multiple tool calls together to accomplish complex tasks:
```
Example: "Scan example.com and generate a report"
1. vulnerability_scan(target: example.com)
2. js_scan_for_secrets(url: example.com)
3. api_discover_endpoints(url: example.com)
4. [Analyze all results and generate summary]
```

## Best Practices

### 1. Be Specific
✅ "Scan https://example.com for SQL injection vulnerabilities"
❌ "Check the website"

### 2. Provide Context
✅ "Start the proxy on port 8080 and capture traffic from my browser"
❌ "Start proxy"

### 3. Ask Follow-up Questions
The AI maintains conversation context, so you can:
- "Tell me more about issue #2"
- "Can you test that endpoint with different payloads?"
- "Export those results to a file"

### 4. Combine Tasks
✅ "Start packet capture on eth0, wait 30 seconds, then analyze the protocols and find any unusual traffic"
✅ "Scan the API, find vulnerabilities, and prioritize them by severity"

## Supported AI Models

### Anthropic Claude
- `claude-3-5-sonnet-20241022` (recommended) - Most capable, best for complex security tasks
- `claude-3-opus-20240229` - Most powerful, slower but highest quality
- `claude-3-haiku-20240307` - Fastest, good for simple tasks

### Google Gemini
- `gemini-1.5-pro` (recommended) - Best balance of capability and speed
- `gemini-1.5-flash` - Faster, good for simpler tasks

## Security Considerations

### API Keys
- **Never share your API keys** - They are stored only in memory during the session
- API keys are sent directly to Anthropic/Google from the Electron backend
- No keys are logged or persisted to disk

### Tool Execution
- Tools execute locally within your NMAT application
- Some tools (like vulnerability scanning) make external network requests
- Always ensure you have permission to test target systems

### Data Privacy
- Conversation history is kept in memory only
- Tool results are sent to the AI provider for analysis
- Clear conversations regularly if working with sensitive data

## Limitations

1. **Rate Limits** - AI providers have rate limits on API calls
2. **Cost** - API usage incurs costs based on your provider's pricing
3. **Tool Availability** - Some tools require specific network conditions or permissions
4. **Async Operations** - Long-running operations (like full scans) may time out

## Troubleshooting

### "API not available" error
- Ensure you've configured the AI Assistant with a valid API key
- Check your internet connection

### Tools failing to execute
- Verify you have necessary permissions (e.g., root for packet capture)
- Check that required ports are available
- Ensure target systems are accessible

### AI not calling tools
- Be more specific in your request
- Try rephrasing to explicitly mention the action (e.g., "use the vulnerability scanner")
- Check the AI provider status page

## Advanced Usage

### Custom Tool Chains
You can guide the AI to use specific sequences of tools:

```
User: I want you to:
1. Start the proxy on port 8888
2. Wait for me to generate some traffic
3. Analyze the captured requests
4. Test each endpoint for vulnerabilities
5. Generate a summary report
```

### Continuous Monitoring
```
User: Monitor network traffic for suspicious activity. Alert me if you see:
- Unusual protocols
- High packet loss
- Known malicious IPs
- Potential data exfiltration patterns
```

## Future Enhancements

Planned features:
- [ ] Custom tool creation
- [ ] Workflow automation
- [ ] Multi-step attack chains
- [ ] Integration with other security tools
- [ ] Report generation tools
- [ ] Collaborative testing sessions

## Support

For issues or questions:
1. Check the console for detailed error messages
2. Review the tool definitions in `src/services/aiTools.ts`
3. File an issue on the project repository

## License

This feature is part of NMAT and follows the same license as the main project.
