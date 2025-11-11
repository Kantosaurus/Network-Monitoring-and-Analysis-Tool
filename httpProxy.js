const http = require('http');
const https = require('https');
const net = require('net');
const { URL } = require('url');
const EventEmitter = require('events');

class HTTPProxy extends EventEmitter {
  constructor(port = 8080) {
    super();
    this.port = port;
    this.server = null;
    this.interceptEnabled = false;
    this.interceptQueue = [];
    this.history = [];
    this.requestId = 0;
  }

  start() {
    this.server = http.createServer((req, res) => {
      this.handleHTTPRequest(req, res);
    });

    // Handle HTTPS CONNECT method
    this.server.on('connect', (req, clientSocket, head) => {
      this.handleHTTPSConnect(req, clientSocket, head);
    });

    this.server.listen(this.port, () => {
      console.log(`HTTP Proxy listening on port ${this.port}`);
      this.emit('started', this.port);
    });

    this.server.on('error', (error) => {
      this.emit('error', error);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('HTTP Proxy stopped');
        this.emit('stopped');
      });
    }
  }

  setIntercept(enabled) {
    this.interceptEnabled = enabled;
    this.emit('intercept-changed', enabled);
  }

  async handleHTTPRequest(clientReq, clientRes) {
    const requestId = ++this.requestId;
    const startTime = Date.now();

    // Parse request
    const requestData = {
      id: requestId,
      method: clientReq.method,
      url: clientReq.url,
      httpVersion: clientReq.httpVersion,
      headers: { ...clientReq.headers },
      timestamp: new Date().toISOString(),
      protocol: 'HTTP'
    };

    // Collect body
    const bodyChunks = [];
    clientReq.on('data', chunk => bodyChunks.push(chunk));

    await new Promise((resolve) => {
      clientReq.on('end', () => {
        requestData.body = Buffer.concat(bodyChunks);
        requestData.bodyString = requestData.body.toString('utf-8');
        resolve();
      });
    });

    // Check if intercept is enabled
    if (this.interceptEnabled) {
      const result = await this.interceptRequest(requestData);
      if (result.action === 'drop') {
        clientRes.writeHead(200);
        clientRes.end('Request dropped by proxy');
        return;
      }
      if (result.action === 'forward') {
        requestData.method = result.request.method;
        requestData.url = result.request.url;
        requestData.headers = result.request.headers;
        requestData.body = Buffer.from(result.request.bodyString || '');
      }
    }

    // Forward request
    try {
      const targetUrl = new URL(requestData.url);

      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: requestData.method,
        headers: requestData.headers
      };

      const proxyReq = http.request(options, (proxyRes) => {
        const responseChunks = [];
        proxyRes.on('data', chunk => responseChunks.push(chunk));
        proxyRes.on('end', () => {
          const responseBody = Buffer.concat(responseChunks);

          const responseData = {
            id: requestId,
            statusCode: proxyRes.statusCode,
            statusMessage: proxyRes.statusMessage,
            headers: { ...proxyRes.headers },
            body: responseBody,
            bodyString: responseBody.toString('utf-8'),
            length: responseBody.length,
            time: Date.now() - startTime
          };

          // Add to history
          this.addToHistory({
            ...requestData,
            response: responseData
          });

          // Forward response to client
          clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
          clientRes.end(responseBody);
        });
      });

      proxyReq.on('error', (error) => {
        console.error('Proxy request error:', error);
        clientRes.writeHead(502);
        clientRes.end('Bad Gateway');
      });

      if (requestData.body.length > 0) {
        proxyReq.write(requestData.body);
      }
      proxyReq.end();

    } catch (error) {
      console.error('Request handling error:', error);
      clientRes.writeHead(500);
      clientRes.end('Internal Proxy Error');
    }
  }

  handleHTTPSConnect(req, clientSocket, head) {
    const requestId = ++this.requestId;
    const { port, hostname } = new URL(`https://${req.url}`);

    const requestData = {
      id: requestId,
      method: 'CONNECT',
      url: req.url,
      hostname,
      port: port || 443,
      protocol: 'HTTPS',
      timestamp: new Date().toISOString()
    };

    // For HTTPS, we tunnel (can't intercept without SSL cert)
    const serverSocket = net.connect(port || 443, hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);

      // Log HTTPS connection
      this.addToHistory({
        ...requestData,
        response: {
          statusCode: 200,
          statusMessage: 'Connection Established'
        }
      });
    });

    serverSocket.on('error', (error) => {
      console.error('HTTPS tunnel error:', error);
      clientSocket.end();
    });

    clientSocket.on('error', () => {
      serverSocket.end();
    });
  }

  interceptRequest(requestData) {
    return new Promise((resolve) => {
      const interceptItem = {
        ...requestData,
        resolve
      };

      this.interceptQueue.push(interceptItem);
      this.emit('intercept', interceptItem);
    });
  }

  forwardIntercept(id, modifiedRequest) {
    const item = this.interceptQueue.find(i => i.id === id);
    if (item) {
      item.resolve({ action: 'forward', request: modifiedRequest });
      this.interceptQueue = this.interceptQueue.filter(i => i.id !== id);
    }
  }

  dropIntercept(id) {
    const item = this.interceptQueue.find(i => i.id === id);
    if (item) {
      item.resolve({ action: 'drop' });
      this.interceptQueue = this.interceptQueue.filter(i => i.id !== id);
    }
  }

  addToHistory(item) {
    this.history.push(item);

    // Limit history to 1000 items
    if (this.history.length > 1000) {
      this.history.shift();
    }

    this.emit('history-update', item);
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
    this.emit('history-cleared');
  }

  // Repeater: Resend a request
  async repeatRequest(requestData) {
    const repeatedId = ++this.requestId;
    const startTime = Date.now();

    try {
      const targetUrl = new URL(requestData.url);

      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: requestData.method,
        headers: requestData.headers
      };

      return new Promise((resolve, reject) => {
        const proxyReq = http.request(options, (proxyRes) => {
          const responseChunks = [];
          proxyRes.on('data', chunk => responseChunks.push(chunk));
          proxyRes.on('end', () => {
            const responseBody = Buffer.concat(responseChunks);

            resolve({
              id: repeatedId,
              request: requestData,
              response: {
                statusCode: proxyRes.statusCode,
                statusMessage: proxyRes.statusMessage,
                headers: { ...proxyRes.headers },
                body: responseBody,
                bodyString: responseBody.toString('utf-8'),
                length: responseBody.length,
                time: Date.now() - startTime
              }
            });
          });
        });

        proxyReq.on('error', reject);

        if (requestData.bodyString) {
          proxyReq.write(requestData.bodyString);
        }
        proxyReq.end();
      });

    } catch (error) {
      throw error;
    }
  }

  // Intruder: Fuzz a request with payloads
  async intruderAttack(requestData, positions, payloads, attackType = 'sniper') {
    const results = [];

    if (attackType === 'sniper') {
      // Sniper: One position at a time, one payload at a time
      for (const payload of payloads) {
        for (const position of positions) {
          const modifiedRequest = this.replacePosition(requestData, position, payload);
          const result = await this.repeatRequest(modifiedRequest);
          results.push({
            payload,
            position,
            ...result
          });

          this.emit('intruder-progress', {
            current: results.length,
            total: positions.length * payloads.length
          });
        }
      }
    } else if (attackType === 'battering-ram') {
      // Battering Ram: All positions get same payload
      for (const payload of payloads) {
        let modifiedRequest = { ...requestData };
        for (const position of positions) {
          modifiedRequest = this.replacePosition(modifiedRequest, position, payload);
        }
        const result = await this.repeatRequest(modifiedRequest);
        results.push({
          payload,
          ...result
        });

        this.emit('intruder-progress', {
          current: results.length,
          total: payloads.length
        });
      }
    }

    return results;
  }

  replacePosition(requestData, position, payload) {
    const modified = { ...requestData };

    if (position.type === 'body') {
      modified.bodyString = modified.bodyString.replace(position.marker, payload);
    } else if (position.type === 'header') {
      modified.headers[position.headerName] = modified.headers[position.headerName].replace(position.marker, payload);
    } else if (position.type === 'url') {
      modified.url = modified.url.replace(position.marker, payload);
    }

    return modified;
  }
}

module.exports = HTTPProxy;
