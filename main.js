// Ensure Web File/Blob constructors exist in the Node/Electron main process
// Some libraries (undici, fetch implementations) expect global "File" and/or "Blob".
// Provide a defensive polyfill before any modules that may import undici are loaded.
(function ensureFileBlobPolyfill() {
  try {
    if (typeof global.File !== 'function') {
      // Prefer the standalone fetch-blob package when available
      try {
        const fetchBlob = require('fetch-blob');
        if (fetchBlob.Blob && typeof global.Blob === 'undefined') global.Blob = fetchBlob.Blob;
        if (fetchBlob.File) global.File = fetchBlob.File;
      } catch (e) {
        // Some packages expose the File class as fetch-blob/file.js
        try {
          const FileCtor = require('fetch-blob/file.js');
          if (FileCtor) global.File = FileCtor;
        } catch (e2) {
          // If Blob is available natively, derive a minimal File implementation from it
          if (typeof global.Blob === 'function' && typeof global.File !== 'function') {
            global.File = class File extends global.Blob {
              constructor(parts, name, options) {
                super(parts, options);
                this.name = name || '';
                this.lastModified = (options && options.lastModified) || Date.now();
              }
            };
          } else if (typeof global.File !== 'function') {
            // Final fallback: define a minimal stub to avoid ReferenceError. This won't be a full File implementation,
            // but it prevents modules that merely check for the existence of File from throwing during require().
            global.File = class File {};
          }
        }
      }
    }
  } catch (err) {
    // Swallow any unexpected error during polyfill setup; don't block app startup with polyfill failures.
    try { global.File = global.File || class File {}; } catch (e) {}
  }
})();

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const PacketCapture = require('./packetCapture');
const SecurityDetector = require('./securityDetection');
const HTTPProxy = require('./httpProxy');
const StatisticsAnalyzer = require('./statisticsAnalyzer');
const ConfigurationManager = require('./configurationManager');
const LuaScriptEngine = require('./luaScriptEngine');
const ProxyBackend = require('./backend/proxy-backend');

let mainWindow;
let packetCapture;
let securityDetector;
let httpProxy;
let statisticsAnalyzer;
let configManager;
let luaEngine;
let proxyBackend;

// Development mode check
const isDev = !app.isPackaged;

// Ignore certificate errors for HTTPS interception
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Load from Vite dev server in development, or from built files in production
  if (isDev) {
    // Try multiple ports since Vite may fallback if 3000 is in use
    const tryPorts = [3000, 3001, 3002, 3003];
    let loaded = false;

    for (const port of tryPorts) {
      try {
        await mainWindow.loadURL(`http://localhost:${port}`);
        console.log(`Successfully loaded from port ${port}`);
        loaded = true;
        break;
      } catch (err) {
        console.log(`Port ${port} not available, trying next...`);
      }
    }

    if (!loaded) {
      console.error('Could not load from any port');
      mainWindow.loadURL('http://localhost:3000'); // Fallback to default
    }

    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Handle webview attachment
  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    console.log('Webview attaching, configuring preferences...');
    // Allow any webview content
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    // Use default session (no partition) so it inherits our certificate bypass
    delete params.partition;
  });

  mainWindow.on('closed', () => {
    if (packetCapture) {
      packetCapture.stop();
    }
    if (httpProxy) {
      httpProxy.stop();
    }
    if (proxyBackend) {
      proxyBackend.close();
    }
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set up certificate verification bypass globally
  const { session } = require('electron');
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    // Accept all certificates for HTTPS interception
    callback(0);
  });

  // Initialize configuration manager and lua engine
  configManager = new ConfigurationManager();
  luaEngine = new LuaScriptEngine();

  // Set up Lua script event listeners
  luaEngine.on('script-alert', (alert) => {
    if (mainWindow) {
      mainWindow.webContents.send('lua-script-alert', alert);
    }
  });

  luaEngine.on('script-log', (log) => {
    if (mainWindow) {
      mainWindow.webContents.send('lua-script-log', log);
    }
  });

  createWindow();

  // Initialize proxy backend
  proxyBackend = new ProxyBackend(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle certificate errors for all webContents (including webviews)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Prevent the default behavior which is to reject the certificate
  event.preventDefault();
  // Accept the certificate (needed for MITM proxy)
  callback(true);
});

// Handle webview creation and set up certificate bypass for each one
app.on('web-contents-created', (event, contents) => {
  // For webviews/guest contents
  if (contents.getType() === 'webview') {
    console.log('Webview created, setting up certificate bypass...');

    // Get the webview's session
    const webviewSession = contents.session;
    if (webviewSession) {
      // Disable certificate verification for this webview's session
      webviewSession.setCertificateVerifyProc((request, callback) => {
        console.log('Certificate verification bypassed for:', request.hostname);
        callback(0); // Accept all certificates
      });
    }

    // Handle certificate errors for this specific webview
    contents.on('certificate-error', (event, url, error, certificate, callback) => {
      console.log('Certificate error caught for webview:', url, error);
      event.preventDefault();
      callback(true);
    });

    // Handle did-fail-load events
    contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (errorCode === -3 || errorCode === -321) {
        console.log('Certificate-related load failure:', errorDescription, 'for', validatedURL);
      }
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-interfaces', async () => {
  try {
    const Cap = require('cap').Cap;
    const devices = Cap.deviceList();
    return { success: true, devices };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('start-capture', async (event, deviceName, options = {}) => {
  try {
    if (packetCapture) {
      packetCapture.stop();
    }

    // Initialize security detector
    securityDetector = new SecurityDetector();

    // Set up security alert listener
    securityDetector.onAlert((alert) => {
      mainWindow.webContents.send('security-alert', alert);
    });

    // Initialize statistics analyzer
    statisticsAnalyzer = new StatisticsAnalyzer();

    packetCapture = new PacketCapture(deviceName, options);

    packetCapture.on('packet', (packet) => {
      mainWindow.webContents.send('packet-captured', packet);

      // Run security detection on each packet
      securityDetector.detectThreats(packet);

      // Add packet to statistics analyzer
      statisticsAnalyzer.addPacket(packet);

      // Send expert alerts if any new ones were generated
      const alerts = statisticsAnalyzer.getExpertAlerts();
      if (alerts.length > 0) {
        mainWindow.webContents.send('expert-alert', alerts[alerts.length - 1]);
      }

      // Execute loaded Lua scripts on packet
      if (luaEngine) {
        const loadedScripts = luaEngine.getLoadedScripts();
        loadedScripts.forEach(script => {
          luaEngine.executeOnPacket(script.id, packet);
        });
      }
    });

    packetCapture.on('error', (error) => {
      mainWindow.webContents.send('capture-error', error.message);
    });

    packetCapture.on('stopped', (stats) => {
      mainWindow.webContents.send('capture-stopped', stats);
    });

    packetCapture.on('file-rotated', (filepath) => {
      mainWindow.webContents.send('capture-file-rotated', filepath);
    });

    packetCapture.start();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-capture', async () => {
  try {
    if (packetCapture) {
      packetCapture.stop();
      packetCapture = null;
    }
    if (securityDetector) {
      securityDetector = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-pcap-file', async () => {
  const { dialog } = require('electron');

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Load PCAP/PCAPNG File',
      filters: [
        { name: 'Packet Capture Files', extensions: ['pcap', 'pcapng', 'cap'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'File selection cancelled' };
    }

    const filepath = result.filePaths[0];

    // Stop current capture if running
    if (packetCapture) {
      packetCapture.stop();
    }

    // Initialize security detector
    securityDetector = new SecurityDetector();

    // Set up security alert listener
    securityDetector.onAlert((alert) => {
      mainWindow.webContents.send('security-alert', alert);
    });

    // Create new PacketCapture instance for offline analysis
    packetCapture = new PacketCapture(null);

    packetCapture.on('packet', (packet) => {
      mainWindow.webContents.send('packet-captured', packet);

      // Run security detection on each packet
      securityDetector.detectThreats(packet);
    });

    packetCapture.on('error', (error) => {
      mainWindow.webContents.send('capture-error', error.message);
    });

    // Load the pcap file
    const pcapResult = await packetCapture.loadPcapFile(filepath);

    return {
      success: true,
      filepath,
      packetCount: pcapResult.packetCount
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Statistics IPC Handlers
ipcMain.handle('get-protocol-hierarchy', async () => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getProtocolHierarchy() };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-conversations', async (event, type = 'ip') => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getConversations(type) };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-endpoints', async (event, type = 'ip') => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getEndpoints(type) };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-io-graph', async () => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getIOGraphData() };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-tcp-streams', async () => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getAllTCPStreams() };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-expert-alerts', async () => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getExpertAlerts() };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-srt-statistics', async () => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getSRTStatistics() };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-flow-graph', async () => {
  try {
    if (statisticsAnalyzer) {
      return { success: true, data: statisticsAnalyzer.getFlowGraph() };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resolve-hostname', async (event, ip) => {
  try {
    if (statisticsAnalyzer) {
      const hostname = await statisticsAnalyzer.resolveHostname(ip);
      return { success: true, hostname };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resolve-mac-vendor', async (event, mac) => {
  try {
    if (statisticsAnalyzer) {
      const vendor = statisticsAnalyzer.resolveMacVendor(mac);
      return { success: true, vendor };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resolve-service', async (event, port) => {
  try {
    if (statisticsAnalyzer) {
      const service = statisticsAnalyzer.resolveService(port);
      return { success: true, service };
    }
    return { success: false, error: 'Statistics analyzer not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-statistics', async (event, type, format) => {
  const { dialog } = require('electron');
  const fs = require('fs');

  try {
    if (!statisticsAnalyzer) {
      return { success: false, error: 'Statistics analyzer not initialized' };
    }

    let content;
    let extension;

    if (format === 'json') {
      content = statisticsAnalyzer.exportToJSON();
      extension = 'json';
    } else if (format === 'csv') {
      content = statisticsAnalyzer.exportToCSV(type);
      extension = 'csv';
    } else if (format === 'xml') {
      content = statisticsAnalyzer.exportToXML();
      extension = 'xml';
    } else {
      return { success: false, error: 'Unsupported format' };
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Statistics',
      defaultPath: `statistics_${type}_${Date.now()}.${extension}`,
      filters: [
        { name: format.toUpperCase(), extensions: [extension] }
      ]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, content);
      return { success: true };
    }

    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-packets', async (event, packets, format) => {
  const { dialog } = require('electron');
  const fs = require('fs');

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Packets',
      defaultPath: `capture_${Date.now()}.${format}`,
      filters: [
        { name: format.toUpperCase(), extensions: [format] }
      ]
    });

    if (!result.canceled) {
      let content;
      if (format === 'json') {
        content = JSON.stringify(packets, null, 2);
      } else if (format === 'csv') {
        const headers = 'No,Time,Source,Destination,Protocol,Length,Info\\n';
        const rows = packets.map(p =>
          `${p.no},${p.timestamp},${p.source},${p.destination},${p.protocol},${p.length},"${p.info}"`
        ).join('\\n');
        content = headers + rows;
      }

      fs.writeFileSync(result.filePath, content);
      return { success: true };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window control handlers
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow.isMaximized();
});

// HTTP Proxy handlers
ipcMain.handle('start-proxy', async (event, port = 8080) => {
  try {
    if (httpProxy) {
      httpProxy.stop();
    }

    httpProxy = new HTTPProxy(port);

    // Set up event listeners
    httpProxy.on('started', (proxyPort) => {
      mainWindow.webContents.send('proxy-started', proxyPort);
    });

    httpProxy.on('stopped', () => {
      mainWindow.webContents.send('proxy-stopped');
    });

    httpProxy.on('error', (error) => {
      mainWindow.webContents.send('proxy-error', error.message);
    });

    httpProxy.on('intercept', (interceptItem) => {
      mainWindow.webContents.send('proxy-intercept', interceptItem);
    });

    httpProxy.on('history-update', (item) => {
      mainWindow.webContents.send('proxy-history-update', item);
    });

    httpProxy.on('history-cleared', () => {
      mainWindow.webContents.send('proxy-history-cleared');
    });

    httpProxy.on('intruder-progress', (progress) => {
      mainWindow.webContents.send('intruder-progress', progress);
    });

    // Handle certificate installation completion
    httpProxy.on('cert-ready', async () => {
      console.log('Certificate ready, reinitializing Electron session...');

      const { session } = require('electron');
      const defaultSession = session.defaultSession;

      // Clear certificate cache to pick up newly installed cert
      await defaultSession.clearCache();
      await defaultSession.clearStorageData();

      // Recreate certificate verification bypass with new cert
      defaultSession.setCertificateVerifyProc((request, callback) => {
        callback(0);
      });

      console.log('Electron session reinitialized with new certificate');
    });

    // Start the proxy (this will auto-install certificate)
    await httpProxy.start();

    // Configure default session to use proxy
    const { session } = require('electron');
    const defaultSession = session.defaultSession;

    await defaultSession.setProxy({
      proxyRules: `http=127.0.0.1:${port};https=127.0.0.1:${port}`,
      proxyBypassRules: '<-loopback>'
    });

    return { success: true, port };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-proxy', async () => {
  try {
    if (httpProxy) {
      await httpProxy.stop();
      httpProxy = null;
    }

    // Clear proxy configuration
    const { session } = require('electron');
    const defaultSession = session.defaultSession;
    await defaultSession.setProxy({
      proxyRules: '',
      proxyBypassRules: ''
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('toggle-intercept', async (event, enabled) => {
  try {
    if (httpProxy) {
      httpProxy.setIntercept(enabled);
      return { success: true, enabled };
    }
    return { success: false, error: 'Proxy not running' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('forward-intercept', async (event, id, modifiedRequest) => {
  try {
    if (httpProxy) {
      httpProxy.forwardIntercept(id, modifiedRequest);
      return { success: true };
    }
    return { success: false, error: 'Proxy not running' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('drop-intercept', async (event, id) => {
  try {
    if (httpProxy) {
      httpProxy.dropIntercept(id);
      return { success: true };
    }
    return { success: false, error: 'Proxy not running' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Configuration Management IPC Handlers
ipcMain.handle('config-list-profiles', async () => {
  try {
    const profiles = configManager.listProfiles();
    return { success: true, profiles };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-load-profile', async (event, profileName) => {
  try {
    const config = configManager.loadProfile(profileName);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-save-profile', async (event, profileName) => {
  try {
    configManager.saveProfile(profileName);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-delete-profile', async (event, profileName) => {
  try {
    const result = configManager.deleteProfile(profileName);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-duplicate-profile', async (event, sourceName, newName) => {
  try {
    const result = configManager.duplicateProfile(sourceName, newName);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-get-current', async () => {
  try {
    const config = configManager.getCurrentConfig();
    return { success: true, ...config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-get-custom-columns', async () => {
  try {
    const columns = configManager.getCustomColumns();
    return { success: true, columns };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-set-custom-columns', async (event, columns) => {
  try {
    configManager.setCustomColumns(columns);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-add-custom-column', async (event, field, position) => {
  try {
    const result = configManager.addCustomColumn(field, position);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-remove-custom-column', async (event, columnId) => {
  try {
    const result = configManager.removeCustomColumn(columnId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-reorder-columns', async (event, fromIndex, toIndex) => {
  try {
    const result = configManager.reorderColumns(fromIndex, toIndex);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-get-available-fields', async () => {
  try {
    const fields = configManager.getAvailableFields();
    return { success: true, fields };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-get-color-rules', async () => {
  try {
    const rules = configManager.getColorRules();
    return { success: true, rules };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-add-color-rule', async (event, rule) => {
  try {
    const result = configManager.addColorRule(rule);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('config-remove-color-rule', async (event, ruleName) => {
  try {
    const result = configManager.removeColorRule(ruleName);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Lua Script Engine IPC Handlers
ipcMain.handle('lua-get-templates', async () => {
  try {
    const templates = luaEngine.getTemplates();
    return { success: true, templates };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-get-template-code', async (event, templateId) => {
  try {
    const code = luaEngine.getTemplateCode(templateId);
    return { success: true, code };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-load-script', async (event, scriptId, scriptCode) => {
  try {
    const result = luaEngine.loadScript(scriptId, scriptCode);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-unload-script', async (event, scriptId) => {
  try {
    const result = luaEngine.unloadScript(scriptId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-get-loaded-scripts', async () => {
  try {
    const scripts = luaEngine.getLoadedScripts();
    return { success: true, scripts };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-get-results', async (event, scriptId) => {
  try {
    const results = luaEngine.getResults(scriptId);
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-execute-on-packet', async (event, scriptId, packet) => {
  try {
    const result = luaEngine.executeOnPacket(scriptId, packet);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('lua-complete-script', async (event, scriptId) => {
  try {
    const result = luaEngine.complete(scriptId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// API Testing handlers
ipcMain.handle('api-discover-endpoints', async (event, url) => {
  return { success: true, endpoints: [] };
});

ipcMain.handle('api-parse-openapi', async (event, url) => {
  return { success: true, endpoints: [] };
});

ipcMain.handle('api-test-endpoint', async (event, endpoint) => {
  return { success: true, result: endpoint };
});

ipcMain.handle('api-scan-endpoint', async (event, endpoint, scanType) => {
  return { success: true, vulnerabilities: [] };
});

ipcMain.handle('api-introspect-graphql', async (event, endpoint) => {
  return { success: true, schema: { queries: [], mutations: [], subscriptions: [] } };
});

ipcMain.handle('api-test-graphql', async (event, endpoint, query, variables) => {
  return { success: true, result: null };
});

ipcMain.handle('api-scan-graphql', async (event, endpoint, schema) => {
  return { success: true, vulnerabilities: [] };
});

ipcMain.handle('api-get-documentation', async (event, endpointId) => {
  return { success: true, documentation: '' };
});

ipcMain.handle('api-get-examples', async (event, endpointId) => {
  return { success: true, examples: [] };
});

ipcMain.handle('api-get-call-history', async (event, endpointId) => {
  return { success: true, history: [] };
});

ipcMain.handle('api-generate-key', async (event, keyType) => {
  return { success: true, key: 'generated-api-key-placeholder' };
});

ipcMain.handle('api-config-get', async () => {
  return { success: true, config: {} };
});

ipcMain.handle('api-config-save', async (event, config) => {
  return { success: true };
});

// Mobile App Testing handlers
ipcMain.handle('mobile-start-session', async (event, deviceType, deviceName) => {
  return { success: true, sessionId: `session-${Date.now()}` };
});

ipcMain.handle('mobile-stop-session', async (event, sessionId) => {
  return { success: true };
});

ipcMain.handle('mobile-bypass-ssl-pinning', async (event, sessionId) => {
  return { success: true };
});

ipcMain.handle('mobile-get-sessions', async () => {
  return { success: true, sessions: [] };
});

// JavaScript/SPA Analysis handlers
ipcMain.handle('js-discover-endpoints', async (event, url) => {
  return { success: true, endpoints: [] };
});

ipcMain.handle('js-analyze-file', async (event, url) => {
  return { success: true, analysis: { url, size: 0, vulnerabilities: [], secrets: [], endpoints: [], code: '' } };
});

ipcMain.handle('js-scan-for-secrets', async (event, url) => {
  return { success: true, secrets: [] };
});

ipcMain.handle('js-test-dom-xss', async (event, url) => {
  return { success: true, vectors: [] };
});

ipcMain.handle('js-deobfuscate', async (event, code) => {
  return { success: true, deobfuscated: code };
});

ipcMain.handle('js-enable-headless-browser', async (event, enabled) => {
  return { success: true };
});

ipcMain.handle('js-crawl-spa', async (event, url, depth) => {
  return { success: true, urls: [], endpoints: [] };
});

// Advanced Injection handlers
ipcMain.handle('injection-test-sql', async (event, target, payload) => {
  return { success: true, vulnerable: false };
});

ipcMain.handle('injection-test-nosql', async (event, target, payload) => {
  return { success: true, vulnerable: false };
});

ipcMain.handle('injection-test-command', async (event, target, payload) => {
  return { success: true, vulnerable: false };
});

ipcMain.handle('injection-test-template', async (event, target, payload) => {
  return { success: true, vulnerable: false };
});

ipcMain.handle('injection-test-deserialization', async (event, target, payload) => {
  return { success: true, vulnerable: false };
});

ipcMain.handle('injection-test-xxe', async (event, target, payload) => {
  return { success: true, vulnerable: false };
});

ipcMain.handle('injection-start-collaborator', async () => {
  return { success: true, url: 'https://collab.example.com' };
});

ipcMain.handle('injection-get-collaborator-interactions', async () => {
  return { success: true, interactions: [] };
});

// WebSocket Protocol handlers
ipcMain.handle('websocket-connect', async (event, url, options) => {
  return { success: true, connectionId: `ws-${Date.now()}` };
});

ipcMain.handle('websocket-disconnect', async (event, connectionId) => {
  return { success: true };
});

ipcMain.handle('websocket-send', async (event, connectionId, message) => {
  return { success: true };
});

ipcMain.handle('websocket-intercept', async (event, connectionId, enabled) => {
  return { success: true };
});

ipcMain.handle('websocket-get-connections', async () => {
  return { success: true, connections: [] };
});

ipcMain.handle('websocket-get-messages', async (event, connectionId) => {
  return { success: true, messages: [] };
});

ipcMain.handle('protocol-register-custom', async (event, protocol) => {
  return { success: true };
});

ipcMain.handle('protocol-get-custom', async () => {
  return { success: true, protocols: [] };
});

ipcMain.handle('protocol-delete-custom', async (event, protocolId) => {
  return { success: true };
});

// BApp Store / Extensions handlers
ipcMain.handle('extension-get-all', async () => {
  return { success: true, extensions: [] };
});

ipcMain.handle('extension-get-installed', async () => {
  return { success: true, extensions: [] };
});

ipcMain.handle('extension-search', async (event, query, filters) => {
  return { success: true, results: [] };
});

ipcMain.handle('extension-install', async (event, extensionId) => {
  return { success: true };
});

ipcMain.handle('extension-uninstall', async (event, extensionId) => {
  return { success: true };
});

ipcMain.handle('extension-update', async (event, extensionId) => {
  return { success: true };
});

ipcMain.handle('extension-update-all', async () => {
  return { success: true, updated: [] };
});

ipcMain.handle('extension-enable', async (event, extensionId, enabled) => {
  return { success: true };
});

ipcMain.handle('extension-get-categories', async () => {
  return { success: true, categories: [] };
});

ipcMain.handle('extension-get-reviews', async (event, extensionId) => {
  return { success: true, reviews: [] };
});

ipcMain.handle('extension-submit-review', async (event, extensionId, review) => {
  return { success: true };
});

ipcMain.handle('extension-check-updates', async () => {
  return { success: true, updates: [] };
});

ipcMain.handle('extension-get-logs', async (event, extensionId) => {
  return { success: true, logs: [] };
});

ipcMain.handle('extension-clear-logs', async (event, extensionId) => {
  return { success: true };
});

ipcMain.handle('extension-project-create', async (event, project) => {
  return { success: true, projectId: `ext-proj-${Date.now()}` };
});

ipcMain.handle('extension-project-get-all', async () => {
  return { success: true, projects: [] };
});

ipcMain.handle('extension-project-build', async (event, projectId) => {
  return { success: true };
});

ipcMain.handle('extension-project-test', async (event, projectId) => {
  return { success: true, results: { passed: 0, failed: 0 } };
});

ipcMain.handle('extension-project-deploy', async (event, projectId) => {
  return { success: true };
});

ipcMain.handle('extension-project-delete', async (event, projectId) => {
  return { success: true };
});

ipcMain.handle('extension-file-update', async (event, projectId, filePath, content) => {
  return { success: true };
});

ipcMain.handle('java-extension-get-loaded', async () => {
  return { success: true, extensions: [] };
});

ipcMain.handle('python-extension-get-loaded', async () => {
  return { success: true, extensions: [] };
});

// Reporting handlers
ipcMain.handle('report-generate', async (event, config) => {
  return { success: true, reportId: `report-${Date.now()}` };
});

ipcMain.handle('report-get-all', async () => {
  return { success: true, reports: [] };
});

ipcMain.handle('report-export', async (event, reportId, format) => {
  return { success: true, filepath: '' };
});

ipcMain.handle('report-delete', async (event, reportId) => {
  return { success: true };
});

ipcMain.handle('report-get-templates', async () => {
  return { success: true, templates: [] };
});

ipcMain.handle('report-save-template', async (event, template) => {
  return { success: true, templateId: `template-${Date.now()}` };
});

ipcMain.handle('report-delete-template', async (event, templateId) => {
  return { success: true };
});

// Project Workspace handlers
ipcMain.handle('project-create', async (event, projectData) => {
  return { success: true, projectId: `proj-${Date.now()}` };
});

ipcMain.handle('project-get-all', async () => {
  return { success: true, projects: [] };
});

ipcMain.handle('project-get-current', async () => {
  return { success: true, project: null };
});

ipcMain.handle('project-open', async (event, projectId) => {
  return { success: true };
});

ipcMain.handle('project-close', async () => {
  return { success: true };
});

ipcMain.handle('project-save', async () => {
  return { success: true };
});

ipcMain.handle('project-export', async (event, projectId, format) => {
  return { success: true, filepath: '' };
});

ipcMain.handle('project-update-config', async (event, config) => {
  return { success: true };
});

ipcMain.handle('project-remove-saved-item', async (event, projectId, itemId) => {
  return { success: true };
});

ipcMain.handle('workspace-create', async (event, workspaceData) => {
  return { success: true, workspaceId: `workspace-${Date.now()}` };
});

ipcMain.handle('workspace-get-all', async () => {
  return { success: true, workspaces: [] };
});

ipcMain.handle('workspace-load', async (event, workspaceId) => {
  return { success: true };
});

// Import/Export handlers
ipcMain.handle('import-from-file', async (event, filepath, format) => {
  return { success: true, data: {} };
});

ipcMain.handle('export-to-format', async (event, data, format) => {
  return { success: true, filepath: '' };
});

ipcMain.handle('export-to-tool', async (event, data, tool) => {
  return { success: true };
});

ipcMain.handle('export-to-jira', async (event, data, config) => {
  return { success: true };
});

ipcMain.handle('export-to-github', async (event, data, config) => {
  return { success: true };
});

ipcMain.handle('tool-integration-get', async () => {
  return { success: true, integrations: [] };
});

ipcMain.handle('tool-integration-add', async (event, integration) => {
  return { success: true };
});

ipcMain.handle('tool-integration-remove', async (event, integrationId) => {
  return { success: true };
});

ipcMain.handle('tool-integration-run', async (event, integrationId, data) => {
  return { success: true };
});

// Headless Automation handlers
ipcMain.handle('headless-agent-register', async (event, agentData) => {
  return { success: true, agentId: `agent-${Date.now()}` };
});

ipcMain.handle('headless-agent-remove', async (event, agentId) => {
  return { success: true };
});

ipcMain.handle('headless-agent-get-all', async () => {
  return { success: true, agents: [] };
});

ipcMain.handle('headless-job-create', async (event, agentId, jobData) => {
  return { success: true, jobId: `job-${Date.now()}` };
});

ipcMain.handle('headless-job-cancel', async (event, jobId) => {
  return { success: true };
});

ipcMain.handle('docker-config-get', async () => {
  return { success: true, config: null };
});

ipcMain.handle('docker-config-save', async (event, config) => {
  return { success: true };
});

ipcMain.handle('docker-container-start', async (event, config) => {
  return { success: true, containerId: `container-${Date.now()}` };
});

ipcMain.handle('docker-container-stop', async (event, containerId) => {
  return { success: true };
});

ipcMain.handle('pipeline-create', async (event, pipelineData) => {
  return { success: true, pipelineId: `pipeline-${Date.now()}` };
});

ipcMain.handle('pipeline-get-all', async () => {
  return { success: true, pipelines: [] };
});

ipcMain.handle('pipeline-run', async (event, pipelineId) => {
  return { success: true, runId: `run-${Date.now()}` };
});

ipcMain.handle('pipeline-delete', async (event, pipelineId) => {
  return { success: true };
});

ipcMain.handle('cicd-config-get', async () => {
  return { success: true, config: {} };
});

ipcMain.handle('cicd-config-save', async (event, config) => {
  return { success: true };
});

ipcMain.handle('cicd-trigger-scan', async (event, config) => {
  return { success: true, scanId: `scan-${Date.now()}` };
});

// Vulnerability Scan handlers
ipcMain.handle('vulnerability-scan', async (event, target, scanType) => {
  return { success: true, vulnerabilities: [] };
});

ipcMain.handle('run-intruder', async (event, requestData, positions, payloads, attackType) => {
  return { success: true, results: [] };
});

// AI Assistant handlers
ipcMain.handle('ai-call-anthropic', async (event, params) => {
  try {
    const { model, apiKey, messages, tools, maxTokens } = params;

    // Format messages for Anthropic API
    const formattedMessages = messages.map(msg => {
      if (msg.toolResults) {
        // Tool result message
        return {
          role: 'user',
          content: msg.toolResults.map(result => ({
            type: 'tool_result',
            tool_use_id: result.toolCallId,
            content: result.error || JSON.stringify(result.result)
          }))
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens || 4096,
        messages: formattedMessages,
        tools: tools
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Anthropic API error: ${error}` };
    }

    const data = await response.json();

    // Extract content and tool calls
    let content = '';
    let toolCalls = [];

    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input
          });
        }
      }
    }

    return {
      success: true,
      content: content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-call-gemini', async (event, params) => {
  try {
    const { model, apiKey, messages, tools } = params;

    // Format messages for Gemini API
    const contents = messages.map(msg => {
      if (msg.toolResults) {
        // Tool result in Gemini format
        return {
          role: 'function',
          parts: msg.toolResults.map(result => ({
            functionResponse: {
              name: result.toolCallId,
              response: result.error ? { error: result.error } : result.result
            }
          }))
        };
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });

    // Format tools for Gemini
    const functionDeclarations = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          tools: [{ functionDeclarations }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Gemini API error: ${error}` };
    }

    const data = await response.json();

    // Extract content and tool calls
    let content = '';
    let toolCalls = [];

    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            content += part.text;
          } else if (part.functionCall) {
            toolCalls.push({
              id: part.functionCall.name,
              name: part.functionCall.name,
              input: part.functionCall.args
            });
          }
        }
      }
    }

    return {
      success: true,
      content: content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Settings handlers
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

const defaultSettings = {
  ai: {
    provider: 'anthropic',
    apiKey: '',
    model: '',
    enableAutoToolCall: true,
    maxTokens: 4096
  },
  general: {
    autoSave: true,
    confirmBeforeExit: true,
    defaultView: 'capture',
    logLevel: 'info'
  },
  network: {
    defaultProxyPort: 8080,
    enableIPv6: false,
    dnsServer: '8.8.8.8',
    timeout: 30000
  },
  security: {
    validateSSL: true,
    followRedirects: true,
    maxRedirects: 5,
    allowSelfSignedCerts: false
  },
  appearance: {
    theme: 'light',
    accentColor: '#0071e3',
    fontSize: 'medium',
    compactMode: false
  },
  advanced: {
    enableExperimentalFeatures: false,
    debugMode: false,
    maxCaptureBuffer: 10000,
    maxHistoryItems: 1000
  }
};

ipcMain.handle('settings-get', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return {
        success: true,
        settings: {
          ai: { ...defaultSettings.ai, ...settings.ai },
          general: { ...defaultSettings.general, ...settings.general },
          network: { ...defaultSettings.network, ...settings.network },
          security: { ...defaultSettings.security, ...settings.security },
          appearance: { ...defaultSettings.appearance, ...settings.appearance },
          advanced: { ...defaultSettings.advanced, ...settings.advanced }
        }
      };
    }
    return { success: true, settings: defaultSettings };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { success: true, settings: defaultSettings };
  }
});

ipcMain.handle('settings-save', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Failed to save settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('settings-reset', async () => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Failed to reset settings:', error);
    return { success: false, error: error.message };
  }
});
