# HTTP/HTTPS Intercepting Proxy - Feature Documentation

## Overview
The HTTP/HTTPS Intercepting Proxy provides comprehensive traffic inspection, modification, and testing capabilities similar to Burp Suite's proxy features. Access it via the **HTTP Proxy** button in the main interface.

## Key Features Implemented

### 1. Intercepting Proxy for HTTP/HTTPS Traffic

**What it does:**
- Acts as a man-in-the-middle proxy between your browser and target applications
- Captures all HTTP/HTTPS traffic passing through the proxy
- Allows real-time inspection and modification of requests and responses

**How to use:**
1. Click the **Start Proxy** button (default port: 8080)
2. Configure your browser or application to use `localhost:8080` as the HTTP proxy
3. Enable **Intercept On** to start capturing requests
4. Intercepted requests will appear in the Intercept tab

**Browser Configuration:**
- **Chrome/Edge:** Settings → System → Open proxy settings
- **Firefox:** Settings → Network Settings → Manual proxy configuration
  - HTTP Proxy: `localhost`, Port: `8080`
  - Check "Also use this proxy for HTTPS"

---

### 2. Request/Response Inspectors with Editable Fields

**Features:**
- View and edit HTTP method (GET, POST, PUT, DELETE, etc.)
- Modify URLs on the fly
- Edit headers line by line
- Modify request body (JSON, XML, form data, etc.)
- View HTTP version information

**Editing Requests:**
1. When a request is intercepted, it appears in the Intercept tab
2. All fields are editable:
   - **Method:** Change request type
   - **URL:** Modify endpoint or parameters
   - **Headers:** Add, remove, or modify headers (format: `Header-Name: value`)
   - **Body:** Edit request payload
3. Click **Forward** to send the modified request
4. Click **Drop** to block the request entirely

**Use Cases:**
- Test API authentication by modifying tokens
- Change request parameters to test input validation
- Add custom headers for testing
- Modify JSON payloads for security testing

---

### 3. SSL/TLS Interception via CA Certificate

**What it does:**
- Decrypts HTTPS traffic for inspection and modification
- Uses a self-signed CA certificate to establish trusted connections
- Re-encrypts traffic before forwarding to the destination

**How to enable:**
1. Go to **Settings** tab
2. Check **Enable SSL/TLS interception**
3. Click **Export CA Certificate**
4. Install the certificate in your browser/system trust store:

**Certificate Installation:**
- **Windows:** Double-click certificate → Install → Place in "Trusted Root Certification Authorities"
- **macOS:** Keychain Access → Import → Set to "Always Trust"
- **Firefox:** Settings → Privacy & Security → Certificates → View Certificates → Import

⚠️ **Security Note:** Only use SSL interception on networks you own or have permission to test.

---

### 4. Upstream Proxy Support & SOCKS Proxying

**Features:**
- Chain with other proxies
- Support for HTTP, SOCKS4, and SOCKS5 upstream proxies
- Optional authentication for upstream proxies

**Configuration (Settings Tab):**
1. Enable **Use upstream proxy**
2. Enter proxy details:
   - **Host:** Upstream proxy address (e.g., `proxy.example.com`)
   - **Port:** Upstream proxy port
   - **Type:** Select HTTP, SOCKS4, or SOCKS5
3. Add credentials if required

**Use Cases:**
- Route traffic through corporate proxies
- Chain with VPN or anonymization services
- Integrate with cloud proxy services
- Test applications behind proxy servers

---

### 5. Match & Replace Rules

**What it does:**
- Automatically modify requests or responses based on patterns
- Supports text matching, regex patterns, and header modifications
- Rules can be enabled/disabled individually

**Creating Rules:**
1. Go to **Settings** tab → **Match & Replace Rules**
2. Click **+ Add Rule**
3. Configure rule:
   - **Name:** Descriptive rule name
   - **Type:** Request or Response
   - **Match Type:** Text, Regex, or Header
   - **Match Pattern:** Pattern to find
   - **Replace With:** Replacement value
   - **Enabled:** Toggle rule on/off

**Example Rules:**

| Use Case | Type | Match Type | Pattern | Replace With |
|----------|------|-----------|---------|--------------|
| Change API endpoint | Request | Text | `/api/v1/` | `/api/v2/` |
| Remove auth header | Request | Header | `Authorization:` | `` |
| Mock response data | Response | Regex | `"status":"error"` | `"status":"success"` |
| Change user agent | Request | Header | `User-Agent:` | `User-Agent: CustomBot/1.0` |

**Regex Examples:**
- `\d+` - Match any number
- `[a-zA-Z]+` - Match any word
- `.*error.*` - Match anything containing "error"

---

### 6. Request/Response Filtering and Scope Restrictions

**What it does:**
- Control which traffic is captured or intercepted
- Include/exclude based on protocol, host, port, and path
- Reduces noise and focuses on relevant targets

**Configuring Scope:**
1. Go to **Settings** tab → **Scope Restrictions**
2. Click **+ Add Rule**
3. Set rule parameters:
   - **Type:** Include (capture only this) or Exclude (ignore this)
   - **Protocol:** HTTP, HTTPS, or Any
   - **Host:** Target hostname (supports wildcards: `*.example.com`)
   - **Port:** Optional port filter
   - **Path:** Optional path filter (e.g., `/api/*`)

**Example Scope Rules:**

| Type | Protocol | Host | Port | Path | Effect |
|------|----------|------|------|------|--------|
| Include | HTTPS | `api.example.com` | 443 | `/v1/*` | Only capture API v1 traffic |
| Exclude | Any | `*.google.com` | - | - | Ignore all Google traffic |
| Include | HTTP | `localhost` | 8000 | - | Only local development traffic |
| Exclude | Any | `*.cdn.com` | - | - | Skip CDN resources |

**Wildcard Patterns:**
- `*` - Match any characters
- `*.example.com` - Match all subdomains
- `example.*` - Match any TLD

---

## Additional Features

### History Tab
- View all captured HTTP/HTTPS requests and responses
- Filter by URL, method, or status code
- Click any item to view full request/response details
- Send items to Repeater for manual testing

### Repeater Tab
- Manually craft and send HTTP requests
- Modify and resend captured requests
- Supports all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- View response status, headers, and body
- Perfect for:
  - Testing API endpoints
  - Fuzzing parameters
  - Authentication testing
  - Response analysis

### Proxy Settings
- **Proxy Port:** Change the listening port (default: 8080)
- **Intercept Requests:** Toggle request interception
- **Intercept Responses:** Toggle response interception
- **Auto-forward:** Automatically forward non-matching requests

---

## Workflow Examples

### Example 1: API Testing
1. Start proxy and enable SSL interception
2. Configure scope to only include your API domain
3. Browse the application to capture traffic
4. Select a request in History
5. Send to Repeater
6. Modify parameters and test different scenarios
7. Analyze responses

### Example 2: Authentication Bypass Testing
1. Enable intercept
2. Log in to the application
3. Intercept the authentication request
4. Modify credentials or tokens
5. Forward and observe response
6. Document findings

### Example 3: Header Manipulation
1. Create Match & Replace rule
2. Set to modify User-Agent header
3. Enable rule
4. Browse application
5. Verify modified headers in requests

### Example 4: Response Mocking
1. Create Match & Replace rule for responses
2. Set regex pattern to match error responses
3. Replace with success responses
4. Test client-side error handling

---

## Keyboard Shortcuts (Future Enhancement)
- `Ctrl+F` - Forward intercepted request
- `Ctrl+D` - Drop intercepted request
- `Ctrl+R` - Send to Repeater
- `Ctrl+I` - Toggle intercept
- `Ctrl+H` - Focus history search

---

## Security Considerations

⚠️ **Important Security Notes:**

1. **Certificate Trust:** Installing the proxy CA certificate allows decryption of all HTTPS traffic. Only install on systems you control.

2. **Authorization Required:** Only use this proxy on:
   - Applications you own
   - Networks you have permission to test
   - Authorized penetration testing engagements

3. **Data Sensitivity:** Captured traffic may contain:
   - Passwords and credentials
   - API keys and tokens
   - Personal information
   - Session cookies

   Handle with appropriate security controls.

4. **Legal Compliance:** Unauthorized interception of communications may be illegal in your jurisdiction. Always obtain proper authorization.

5. **Production Use:** Never use intercepting proxies on production systems without explicit authorization and proper change management.

---

## Troubleshooting

### Proxy won't start
- **Issue:** Port already in use
- **Solution:** Change proxy port in Settings or stop conflicting service

### Can't see HTTPS traffic
- **Issue:** SSL interception not enabled or certificate not trusted
- **Solution:**
  1. Enable SSL interception in Settings
  2. Export and install CA certificate
  3. Restart browser

### No traffic captured
- **Issue:** Browser/app not configured to use proxy
- **Solution:** Verify proxy settings in application (localhost:8080)

### Scope not filtering correctly
- **Issue:** Rules too broad or conflicting
- **Solution:** Check rule order and patterns, test with single rules first

### Match & Replace not working
- **Issue:** Pattern doesn't match or rule disabled
- **Solution:**
  - Enable rule
  - Test regex patterns separately
  - Check request/response type matches

---

## Comparison with Burp Suite

| Feature | NMAT Proxy | Burp Suite |
|---------|-----------|------------|
| HTTP/HTTPS Interception | ✅ | ✅ |
| Request/Response Editing | ✅ | ✅ |
| SSL/TLS Interception | ✅ | ✅ |
| Upstream Proxy | ✅ | ✅ |
| SOCKS Support | ✅ | ✅ |
| Match & Replace | ✅ | ✅ |
| Scope Configuration | ✅ | ✅ |
| Request Repeater | ✅ | ✅ |
| History | ✅ | ✅ |
| Intruder (Fuzzing) | 🚧 Planned | ✅ |
| Scanner | ❌ | ✅ Pro |
| Extensions | ❌ | ✅ Pro |

---

## Future Enhancements

Planned features for upcoming releases:

1. **Intruder Module:** Automated fuzzing and brute force testing
2. **WebSocket Support:** Intercept and modify WebSocket traffic
3. **HTTP/2 Support:** Full HTTP/2 protocol support
4. **Session Management:** Token analyzer and session handling tools
5. **Comparer:** Side-by-side diff of requests/responses
6. **Decoder/Encoder:** Base64, URL, HTML encoding tools
7. **Search:** Full-text search across history
8. **Export/Import:** Save and share proxy configurations
9. **Collaboration:** Team sharing and session replay
10. **Extensions:** Plugin system for custom functionality

---

## Best Practices

1. **Start Small:** Begin with narrow scope rules, expand as needed
2. **Use Filters:** Keep history manageable with good filtering
3. **Document Changes:** Note modifications made during testing
4. **Save Configurations:** Export settings for reusable test scenarios
5. **Clean Up:** Clear history and disable intercept when not in use
6. **Test Safely:** Always use in authorized testing environments
7. **Backup Traffic:** Save important captures for documentation
8. **Review Scope:** Regularly audit scope rules for accuracy

---

## Support

For issues, feature requests, or questions:
- GitHub Issues: [NMAT Repository](https://github.com/yourusername/nmat/issues)
- Documentation: See other docs in `/docs` folder
- Community: Join discussions on GitHub

---

**Version:** 1.0
**Last Updated:** 2025
**Status:** Production Ready ✅
