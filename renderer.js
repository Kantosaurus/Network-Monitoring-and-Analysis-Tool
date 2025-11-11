// Application State
let packets = [];
let filteredPackets = [];
let selectedPacket = null;
let isCapturing = false;
let currentFilter = '';
let securityAlerts = [];

// DOM Elements
const interfaceSelect = document.getElementById('interfaceSelect');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const filterInput = document.getElementById('filterInput');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const statsBtn = document.getElementById('statsBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const packetTableBody = document.getElementById('packetTableBody');
const packetDetailsContent = document.getElementById('packetDetailsContent');
const statusText = document.getElementById('statusText');
const packetCount = document.getElementById('packetCount');
const displayedCount = document.getElementById('displayedCount');
const statsModal = document.getElementById('statsModal');
const securityAlertsContainer = document.getElementById('securityAlerts');
const alertCountBadge = document.getElementById('alertCount');
const clearAlertsBtn = document.getElementById('clearAlertsBtn');

// Initialize
async function init() {
  await loadInterfaces();
  setupEventListeners();
  setupIpcListeners();
}

// Load network interfaces
async function loadInterfaces() {
  const result = await window.api.getInterfaces();
  if (result.success) {
    interfaceSelect.innerHTML = '<option value="">Select Interface...</option>';
    result.devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.name;
      option.textContent = `${device.description || device.name} (${device.addresses.map(a => a.addr).join(', ')})`;
      interfaceSelect.appendChild(option);
    });
  } else {
    alert('Error loading interfaces: ' + result.error);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Window controls
  document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.api.windowMinimize();
  });

  document.getElementById('maximizeBtn').addEventListener('click', async () => {
    const isMaximized = await window.api.windowMaximize();
    updateMaximizeButton(isMaximized);
  });

  // Listen for window maximize/unmaximize events
  window.api.onWindowMaximized((isMaximized) => {
    updateMaximizeButton(isMaximized);
  });

  // Check initial maximize state
  window.api.windowIsMaximized().then((isMaximized) => {
    updateMaximizeButton(isMaximized);
  });

  // Double-click titlebar to maximize/restore
  document.querySelector('.titlebar-drag-region').addEventListener('dblclick', async () => {
    const isMaximized = await window.api.windowMaximize();
    updateMaximizeButton(isMaximized);
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    window.api.windowClose();
  });

  // Capture controls
  startBtn.addEventListener('click', startCapture);
  stopBtn.addEventListener('click', stopCapture);
  clearBtn.addEventListener('click', clearPackets);
  applyFilterBtn.addEventListener('click', applyFilter);
  statsBtn.addEventListener('click', showStatistics);
  exportJsonBtn.addEventListener('click', () => exportPackets('json'));
  exportCsvBtn.addEventListener('click', () => exportPackets('csv'));

  // Filter input - apply on Enter key
  filterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilter();
    }
  });

  // Clear alerts button
  clearAlertsBtn.addEventListener('click', clearSecurityAlerts);

  // Close modal
  const closeBtn = document.querySelector('.close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      statsModal.classList.remove('show');
    });
  }

  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => {
      statsModal.classList.remove('show');
    });
  }
}

// Setup IPC Listeners
function setupIpcListeners() {
  window.api.onPacketCaptured((packet) => {
    packets.push(packet);
    updatePacketCount();

    if (matchesFilter(packet)) {
      filteredPackets.push(packet);
      addPacketToTable(packet);
      updateDisplayedCount();
    }
  });

  window.api.onCaptureError((error) => {
    alert('Capture error: ' + error);
    stopCapture();
  });

  window.api.onSecurityAlert((alert) => {
    addSecurityAlert(alert);
  });
}

// Start packet capture
async function startCapture() {
  const deviceName = interfaceSelect.value;
  if (!deviceName) {
    alert('Please select a network interface');
    return;
  }

  const result = await window.api.startCapture(deviceName);
  if (result.success) {
    isCapturing = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    interfaceSelect.disabled = true;
    statusText.textContent = 'Capturing...';
    statusText.className = 'stat-value status-capturing';
  } else {
    alert('Error starting capture: ' + result.error);
  }
}

// Stop packet capture
async function stopCapture() {
  const result = await window.api.stopCapture();
  if (result.success) {
    isCapturing = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    interfaceSelect.disabled = false;
    statusText.textContent = 'Stopped';
    statusText.className = 'stat-value status-stopped';
  }
}

// Clear all packets
function clearPackets() {
  packets = [];
  filteredPackets = [];
  selectedPacket = null;
  packetTableBody.innerHTML = '';
  packetDetailsContent.innerHTML = `
    <div class="no-selection">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <p>Select a packet to view details</p>
    </div>
  `;
  document.getElementById('hexViewerContent').innerHTML = `
    <div class="no-selection">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 21V9"/>
      </svg>
      <p>Select a packet to view hex data</p>
    </div>
  `;
  updatePacketCount();
  updateDisplayedCount();

  // Also clear security alerts
  clearSecurityAlerts();
}

// Add packet to table
function addPacketToTable(packet) {
  const row = document.createElement('tr');
  row.dataset.packetNo = packet.no;

  const protocolClass = `protocol-${packet.protocol.toLowerCase()}`;

  row.innerHTML = `
    <td>${packet.no}</td>
    <td>${packet.relativeTime}</td>
    <td>${packet.source}</td>
    <td>${packet.destination}</td>
    <td class="${protocolClass}">${packet.protocol}</td>
    <td>${packet.length}</td>
    <td>${escapeHtml(packet.info)}</td>
  `;

  row.addEventListener('click', () => selectPacket(packet, row));
  packetTableBody.appendChild(row);

  // Auto-scroll to bottom if near bottom
  const container = document.querySelector('.packet-list-container');
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  if (isNearBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

// Select packet and show details
function selectPacket(packet, row) {
  selectedPacket = packet;

  // Update UI
  document.querySelectorAll('.packet-table tbody tr').forEach(tr => {
    tr.classList.remove('selected');
  });
  row.classList.add('selected');

  // Display packet details and hex data
  displayPacketDetails(packet);
  displayHexData(packet);
}

// Display packet details
function displayPacketDetails(packet) {
  let html = '';

  // Frame section
  html += createDetailSection('Frame', [
    { label: 'Frame Number', value: packet.no },
    { label: 'Timestamp', value: packet.timestamp },
    { label: 'Relative Time', value: packet.relativeTime + ' seconds' },
    { label: 'Frame Length', value: packet.length + ' bytes' }
  ]);

  // Ethernet section
  if (packet.raw.ethernet) {
    html += createDetailSection('Ethernet II', [
      { label: 'Source MAC', value: packet.raw.ethernet.src },
      { label: 'Destination MAC', value: packet.raw.ethernet.dst }
    ]);
  }

  // IP section
  if (packet.raw.ip) {
    const ipSection = [
      { label: 'Source Address', value: packet.source },
      { label: 'Destination Address', value: packet.destination },
      { label: 'Version', value: packet.raw.ip.version },
      { label: 'TTL', value: packet.raw.ip.ttl },
      { label: 'Protocol', value: packet.raw.ip.protocol }
    ];
    html += createDetailSection('Internet Protocol', ipSection);
  }

  // Protocol-specific sections
  if (packet.protocol === 'TCP' || packet.protocol === 'UDP') {
    const transportSection = [
      { label: 'Source Port', value: packet.srcPort },
      { label: 'Destination Port', value: packet.dstPort },
      { label: 'Info', value: packet.info }
    ];
    html += createDetailSection(packet.protocol === 'TCP' ? 'Transmission Control Protocol' : 'User Datagram Protocol', transportSection);
  } else if (packet.protocol === 'ICMP') {
    html += createDetailSection('Internet Control Message Protocol', [
      { label: 'Info', value: packet.info }
    ]);
  } else if (packet.protocol === 'ARP' && packet.raw.arp) {
    html += createDetailSection('Address Resolution Protocol', [
      { label: 'Sender MAC', value: packet.raw.arp.sender_ha },
      { label: 'Sender IP', value: packet.raw.arp.sender_pa },
      { label: 'Target MAC', value: packet.raw.arp.target_ha },
      { label: 'Target IP', value: packet.raw.arp.target_pa }
    ]);
  }

  packetDetailsContent.innerHTML = html;

  // Add collapse functionality
  document.querySelectorAll('.detail-section-title').forEach(title => {
    title.addEventListener('click', function() {
      this.classList.toggle('collapsed');
      const content = this.nextElementSibling;
      content.style.display = this.classList.contains('collapsed') ? 'none' : 'block';
    });
  });
}

// Create detail section
function createDetailSection(title, items) {
  let html = '<div class="detail-section">';
  html += `<div class="detail-section-title">${title}</div>`;
  html += '<div class="detail-section-content">';
  items.forEach(item => {
    html += `<div class="detail-item"><span class="detail-label">${item.label}:</span> <span class="detail-value">${escapeHtml(String(item.value))}</span></div>`;
  });
  html += '</div></div>';
  return html;
}

// Display hex data
function displayHexData(packet) {
  const hexViewerContent = document.getElementById('hexViewerContent');

  // Create dummy hex data if raw buffer is not available
  // In a real implementation, this would come from the actual packet buffer
  const hexData = generateHexFromPacket(packet);

  if (!hexData || hexData.length === 0) {
    hexViewerContent.innerHTML = `
      <div class="no-selection">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
        <p>No hex data available</p>
      </div>
    `;
    return;
  }

  let html = '';
  const bytesPerRow = 16;

  for (let i = 0; i < hexData.length; i += bytesPerRow) {
    const offset = i.toString(16).padStart(8, '0').toUpperCase();
    const rowBytes = hexData.slice(i, i + bytesPerRow);

    // Create hex bytes display
    let hexBytes = '';
    let ascii = '';

    for (let j = 0; j < bytesPerRow; j++) {
      if (j < rowBytes.length) {
        const byte = rowBytes[j];
        const hexByte = byte.toString(16).padStart(2, '0').toUpperCase();

        // Group bytes by 8
        if (j === 8) hexBytes += '</div><div class="hex-group">';
        else if (j === 0) hexBytes += '<div class="hex-group">';

        hexBytes += `<span class="hex-byte" data-offset="${i + j}">${hexByte}</span>`;

        // ASCII representation
        const char = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        const charClass = (byte >= 32 && byte <= 126) ? 'printable' : 'non-printable';
        ascii += `<span class="${charClass}">${escapeHtml(char)}</span>`;
      } else {
        // Padding for incomplete rows
        if (j === 8) hexBytes += '</div><div class="hex-group">';
        else if (j === 0) hexBytes += '<div class="hex-group">';
        hexBytes += '<span class="hex-byte" style="opacity: 0">00</span>';
        ascii += '<span class="non-printable"> </span>';
      }
    }
    hexBytes += '</div>';

    html += `
      <div class="hex-row">
        <div class="hex-offset">${offset}</div>
        <div class="hex-bytes">${hexBytes}</div>
        <div class="hex-ascii">${ascii}</div>
      </div>
    `;
  }

  hexViewerContent.innerHTML = html;

  // Add click handlers for byte selection
  document.querySelectorAll('.hex-byte').forEach(byteEl => {
    byteEl.addEventListener('click', function() {
      document.querySelectorAll('.hex-byte').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}

// Generate hex data from packet information
function generateHexFromPacket(packet) {
  // If raw buffer is available, use it
  if (packet.rawBuffer) {
    return Array.from(packet.rawBuffer);
  }

  // Otherwise, create synthetic hex data from packet info for demo
  const data = [];

  // Add some demo bytes based on packet data
  // Ethernet header (14 bytes)
  if (packet.raw && packet.raw.ethernet) {
    // Destination MAC (6 bytes)
    data.push(0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
    // Source MAC (6 bytes)
    data.push(0x00, 0x11, 0x22, 0x33, 0x44, 0x55);
    // EtherType (2 bytes - 0x0800 for IPv4)
    data.push(0x08, 0x00);
  }

  // Add some protocol-specific dummy data
  const protocolData = new TextEncoder().encode(
    `${packet.protocol} packet from ${packet.source} to ${packet.destination}`
  );
  data.push(...Array.from(protocolData));

  // Add padding to show at least a few rows
  while (data.length < 128) {
    data.push(Math.floor(Math.random() * 256));
  }

  return data.slice(0, packet.length); // Limit to actual packet length
}

// Copy hex to clipboard
document.getElementById('copyHexBtn').addEventListener('click', () => {
  if (!selectedPacket) return;

  const hexData = generateHexFromPacket(selectedPacket);
  const hexString = hexData.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

  navigator.clipboard.writeText(hexString).then(() => {
    // Show success feedback
    const btn = document.getElementById('copyHexBtn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
    setTimeout(() => {
      btn.innerHTML = originalHTML;
    }, 1500);
  });
});

// Filter packets
function applyFilter() {
  currentFilter = filterInput.value.trim().toLowerCase();
  filteredPackets = packets.filter(matchesFilter);
  rebuildPacketTable();
  updateDisplayedCount();
}

function clearFilter() {
  currentFilter = '';
  filterInput.value = '';
  filteredPackets = [...packets];
  rebuildPacketTable();
  updateDisplayedCount();
}

function matchesFilter(packet) {
  if (!currentFilter) return true;

  const filter = currentFilter;

  // Protocol filters
  if (filter === packet.protocol.toLowerCase()) return true;

  // IP address filters
  if (filter.startsWith('ip.addr==')) {
    const ip = filter.substring(9);
    return packet.source === ip || packet.destination === ip;
  }
  if (filter.startsWith('ip.src==')) {
    const ip = filter.substring(8);
    return packet.source === ip;
  }
  if (filter.startsWith('ip.dst==')) {
    const ip = filter.substring(8);
    return packet.destination === ip;
  }

  // Port filters
  if (filter.startsWith('port==')) {
    const port = filter.substring(6);
    return packet.srcPort == port || packet.dstPort == port;
  }

  // Simple text search
  return packet.source.toLowerCase().includes(filter) ||
         packet.destination.toLowerCase().includes(filter) ||
         packet.info.toLowerCase().includes(filter);
}

function rebuildPacketTable() {
  packetTableBody.innerHTML = '';
  filteredPackets.forEach(packet => addPacketToTable(packet));
}

// Update maximize button icon
function updateMaximizeButton(isMaximized) {
  const maximizeBtn = document.getElementById('maximizeBtn');
  const appContainer = document.querySelector('.app-container');

  if (isMaximized) {
    // Show restore icon (two overlapping squares)
    maximizeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12">
        <rect x="3" y="1" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <rect x="2" y="4" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `;
    maximizeBtn.title = 'Restore Down';
    appContainer.classList.add('maximized');
  } else {
    // Show maximize icon (single square)
    maximizeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12">
        <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      </svg>
    `;
    maximizeBtn.title = 'Maximize';
    appContainer.classList.remove('maximized');
  }
}

// Statistics
function showStatistics() {
  const stats = calculateStatistics();
  displayStatistics(stats);
  statsModal.classList.add('show');
}

function calculateStatistics() {
  const protocolCounts = {};
  const conversations = {};
  let totalBytes = 0;

  packets.forEach(packet => {
    // Protocol distribution
    protocolCounts[packet.protocol] = (protocolCounts[packet.protocol] || 0) + 1;

    // Conversations
    const convKey = `${packet.source} ↔ ${packet.destination}`;
    if (!conversations[convKey]) {
      conversations[convKey] = { packets: 0, bytes: 0 };
    }
    conversations[convKey].packets++;
    conversations[convKey].bytes += packet.length;

    totalBytes += packet.length;
  });

  // Sort conversations by packet count
  const topConversations = Object.entries(conversations)
    .sort((a, b) => b[1].packets - a[1].packets)
    .slice(0, 10);

  return {
    protocolCounts,
    topConversations,
    totalPackets: packets.length,
    totalBytes
  };
}

function displayStatistics(stats) {
  // Protocol distribution
  let protocolHtml = '';
  Object.entries(stats.protocolCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([protocol, count]) => {
      const percentage = ((count / stats.totalPackets) * 100).toFixed(1);
      protocolHtml += `
        <div class="stat-item">
          <span class="stat-label">${protocol}</span>
          <span class="stat-value">${count} (${percentage}%)</span>
        </div>
      `;
    });
  document.getElementById('protocolStats').innerHTML = protocolHtml || '<div class="stat-item">No data</div>';

  // Top conversations
  let convHtml = '';
  stats.topConversations.forEach(([conv, data]) => {
    convHtml += `
      <div class="stat-item">
        <span class="stat-label">${conv}</span>
        <span class="stat-value">${data.packets} packets (${formatBytes(data.bytes)})</span>
      </div>
    `;
  });
  document.getElementById('conversationStats').innerHTML = convHtml || '<div class="stat-item">No data</div>';

  // Bandwidth usage
  const bandwidthHtml = `
    <div class="stat-item">
      <span class="stat-label">Total Packets</span>
      <span class="stat-value">${stats.totalPackets}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Total Bytes</span>
      <span class="stat-value">${formatBytes(stats.totalBytes)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Average Packet Size</span>
      <span class="stat-value">${stats.totalPackets ? formatBytes(stats.totalBytes / stats.totalPackets) : '0 B'}</span>
    </div>
  `;
  document.getElementById('bandwidthStats').innerHTML = bandwidthHtml;
}

// Export packets
async function exportPackets(format) {
  if (packets.length === 0) {
    alert('No packets to export');
    return;
  }

  const result = await window.api.exportPackets(packets, format);
  if (!result.success) {
    alert('Export failed: ' + result.error);
  }
}

// Utility functions
function updatePacketCount() {
  packetCount.textContent = packets.length;
}

function updateDisplayedCount() {
  displayedCount.textContent = filteredPackets.length;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Security Alerts Functions
function addSecurityAlert(alert) {
  securityAlerts.push(alert);

  // Remove "no alerts" message if it exists
  const noAlerts = securityAlertsContainer.querySelector('.no-alerts');
  if (noAlerts) {
    noAlerts.remove();
  }

  // Create alert element
  const alertEl = document.createElement('div');
  alertEl.className = `security-alert ${alert.severity}`;
  alertEl.dataset.packetNo = alert.packet;

  const time = new Date(alert.timestamp).toLocaleTimeString();

  alertEl.innerHTML = `
    <div class="alert-header">
      <span class="alert-severity ${alert.severity}">${alert.severity}</span>
      <span class="alert-time">${time}</span>
    </div>
    <div class="alert-message">${escapeHtml(alert.message)}</div>
    <div class="alert-details">${escapeHtml(alert.details)}</div>
  `;

  // Click to jump to packet
  alertEl.addEventListener('click', () => {
    jumpToPacket(alert.packet);
  });

  // Add to container (prepend so newest is on top)
  securityAlertsContainer.insertBefore(alertEl, securityAlertsContainer.firstChild);

  // Update count
  updateAlertCount();

  // Enable clear button
  clearAlertsBtn.disabled = false;

  // Limit to 50 alerts max in UI (keep all in array)
  const alertElements = securityAlertsContainer.querySelectorAll('.security-alert');
  if (alertElements.length > 50) {
    alertElements[alertElements.length - 1].remove();
  }
}

function updateAlertCount() {
  const count = securityAlerts.length;
  alertCountBadge.textContent = count;

  if (count === 0) {
    alertCountBadge.classList.add('zero');
  } else {
    alertCountBadge.classList.remove('zero');
  }
}

function clearSecurityAlerts() {
  securityAlerts = [];
  securityAlertsContainer.innerHTML = `
    <div class="no-alerts">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>No threats detected</span>
    </div>
  `;
  updateAlertCount();
  clearAlertsBtn.disabled = true;
}

function jumpToPacket(packetNo) {
  // Find the packet row
  const row = document.querySelector(`tr[data-packet-no="${packetNo}"]`);
  if (row) {
    // Scroll to it
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight it temporarily
    row.style.animation = 'none';
    setTimeout(() => {
      row.style.animation = 'highlight 1s ease';
    }, 10);

    // Click it to show details
    row.click();
  }
}

// Add highlight animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes highlight {
    0%, 100% { background: inherit; }
    50% { background: rgba(0, 122, 255, 0.3); }
  }
`;
document.head.appendChild(style);

// ============================================================
// HTTP PROXY FUNCTIONALITY
// ============================================================

// Proxy State
let proxyRunning = false;
let interceptEnabled = false;
let currentIntercept = null;
let proxyHistory = [];
let intruderResults = [];
let proxyRequestCount = 0;

// Main Tab Switching
const mainTabBtns = document.querySelectorAll('.main-tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

mainTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;

    // Update active tab button
    mainTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update active content
    tabContents.forEach(content => {
      if (content.dataset.content === tabName) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  });
});

// Proxy Sub-tab Switching
const proxyTabBtns = document.querySelectorAll('.proxy-tab-btn');
const proxyTabContents = document.querySelectorAll('.proxy-tab-content');

proxyTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.proxyTab;

    // Update active tab button
    proxyTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update active content
    proxyTabContents.forEach(content => {
      if (content.dataset.proxyContent === tabName) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  });
});

// Proxy Controls
const startProxyBtn = document.getElementById('startProxyBtn');
const stopProxyBtn = document.getElementById('stopProxyBtn');
const proxyPortInput = document.getElementById('proxyPort');
const interceptToggle = document.getElementById('interceptToggle');
const interceptToggleLabel = document.querySelector('.toggle-label');
const proxyStatusText = document.getElementById('proxyStatusText');
const proxyRequestCountEl = document.getElementById('proxyRequestCount');
const interceptedCountEl = document.getElementById('interceptedCount');

startProxyBtn.addEventListener('click', async () => {
  const port = parseInt(proxyPortInput.value) || 8080;
  const result = await window.api.startProxy(port);

  if (result.success) {
    proxyRunning = true;
    startProxyBtn.disabled = true;
    stopProxyBtn.disabled = false;
    interceptToggle.disabled = false;
    proxyPortInput.disabled = true;
  } else {
    alert('Failed to start proxy: ' + result.error);
  }
});

stopProxyBtn.addEventListener('click', async () => {
  const result = await window.api.stopProxy();

  if (result.success) {
    proxyRunning = false;
    interceptEnabled = false;
    interceptToggle.checked = false;
    interceptToggleLabel.textContent = 'Intercept Off';
    startProxyBtn.disabled = false;
    stopProxyBtn.disabled = true;
    interceptToggle.disabled = true;
    proxyPortInput.disabled = false;
  }
});

interceptToggle.addEventListener('change', async () => {
  interceptEnabled = interceptToggle.checked;
  interceptToggleLabel.textContent = interceptEnabled ? 'Intercept On' : 'Intercept Off';
  await window.api.toggleIntercept(interceptEnabled);
});

// Proxy Event Listeners
window.api.onProxyStarted((port) => {
  proxyStatusText.textContent = `Running on :${port}`;
  proxyStatusText.className = 'stat-value status-capturing';
});

window.api.onProxyStopped(() => {
  proxyStatusText.textContent = 'Stopped';
  proxyStatusText.className = 'stat-value status-ready';
});

window.api.onProxyError((error) => {
  alert('Proxy error: ' + error);
});

window.api.onProxyHistoryUpdate((item) => {
  proxyHistory.push(item);
  proxyRequestCount++;
  proxyRequestCountEl.textContent = proxyRequestCount;
  addHistoryItem(item);
});

window.api.onProxyHistoryCleared(() => {
  proxyHistory = [];
  document.getElementById('historyTableBody').innerHTML = '';
});

// Intercept Functionality
const interceptContent = document.getElementById('interceptContent');
const interceptActions = document.getElementById('interceptActions');
const forwardBtn = document.getElementById('forwardBtn');
const dropBtn = document.getElementById('dropBtn');

window.api.onProxyIntercept((interceptItem) => {
  currentIntercept = interceptItem;
  interceptedCountEl.textContent = parseInt(interceptedCountEl.textContent) + 1;
  displayInterceptedRequest(interceptItem);
});

function displayInterceptedRequest(item) {
  const requestText = formatHttpRequest(item);

  interceptContent.innerHTML = `
    <textarea class="intercept-editor" id="interceptEditor">${escapeHtml(requestText)}</textarea>
  `;

  interceptActions.style.display = 'flex';
}

function formatHttpRequest(item) {
  let text = `${item.method} ${item.url} HTTP/${item.httpVersion}\n`;

  for (const [key, value] of Object.entries(item.headers)) {
    text += `${key}: ${value}\n`;
  }

  text += '\n';
  if (item.bodyString) {
    text += item.bodyString;
  }

  return text;
}

forwardBtn.addEventListener('click', async () => {
  if (!currentIntercept) return;

  const editor = document.getElementById('interceptEditor');
  const modifiedText = editor.value;

  // Parse modified request
  const modifiedRequest = parseHttpRequest(modifiedText);
  modifiedRequest.id = currentIntercept.id;

  await window.api.forwardIntercept(currentIntercept.id, modifiedRequest);

  // Reset UI
  interceptContent.innerHTML = `
    <div class="no-selection">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>No intercepted requests</p>
      <p style="font-size: 12px; opacity: 0.7;">Enable intercept to capture HTTP requests</p>
    </div>
  `;
  interceptActions.style.display = 'none';
  currentIntercept = null;
});

dropBtn.addEventListener('click', async () => {
  if (!currentIntercept) return;

  await window.api.dropIntercept(currentIntercept.id);

  // Reset UI
  interceptContent.innerHTML = `
    <div class="no-selection">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>No intercepted requests</p>
      <p style="font-size: 12px; opacity: 0.7;">Enable intercept to capture HTTP requests</p>
    </div>
  `;
  interceptActions.style.display = 'none';
  currentIntercept = null;
});

function parseHttpRequest(text) {
  const lines = text.split('\n');
  const firstLine = lines[0].split(' ');

  const request = {
    method: firstLine[0],
    url: firstLine[1],
    httpVersion: firstLine[2]?.replace('HTTP/', '') || '1.1',
    headers: {}
  };

  let i = 1;
  while (i < lines.length && lines[i].trim() !== '') {
    const colonIndex = lines[i].indexOf(':');
    if (colonIndex > 0) {
      const key = lines[i].substring(0, colonIndex).trim();
      const value = lines[i].substring(colonIndex + 1).trim();
      request.headers[key] = value;
    }
    i++;
  }

  // Body starts after empty line
  if (i < lines.length) {
    request.bodyString = lines.slice(i + 1).join('\n');
  }

  return request;
}

// HTTP History
const historyTableBody = document.getElementById('historyTableBody');
const historyDetailsContent = document.getElementById('historyDetailsContent');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

function addHistoryItem(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.method}</td>
    <td>${truncateUrl(item.url)}</td>
    <td>${item.response?.statusCode || 'N/A'}</td>
    <td>${item.response?.length || 0} bytes</td>
    <td>${item.response?.time || 0} ms</td>
  `;

  row.addEventListener('click', () => {
    // Remove previous selection
    historyTableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');

    displayHistoryDetails(item);
  });

  // Double-click to send to Repeater
  row.addEventListener('dblclick', () => {
    sendToRepeater(item);
    // Switch to Repeater tab
    document.querySelector('[data-proxy-tab="repeater"]').click();
  });

  historyTableBody.appendChild(row);
}

function displayHistoryDetails(item) {
  const requestText = formatHttpRequest(item);
  let responseText = '';

  if (item.response) {
    responseText = `HTTP/1.1 ${item.response.statusCode} ${item.response.statusMessage}\n`;
    for (const [key, value] of Object.entries(item.response.headers)) {
      responseText += `${key}: ${value}\n`;
    }
    responseText += '\n';
    responseText += item.response.bodyString || '';
  }

  historyDetailsContent.innerHTML = `
    <h4 style="margin-bottom: 12px; color: var(--primary);">Request</h4>
    <pre>${escapeHtml(requestText)}</pre>
    <h4 style="margin: 20px 0 12px; color: var(--primary);">Response</h4>
    <pre>${escapeHtml(responseText)}</pre>
  `;
}

function truncateUrl(url, maxLength = 50) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

clearHistoryBtn.addEventListener('click', async () => {
  await window.api.clearProxyHistory();
  proxyHistory = [];
  proxyRequestCount = 0;
  proxyRequestCountEl.textContent = '0';
  historyDetailsContent.innerHTML = '<div class="no-selection"><p>Select a request to view details</p></div>';
});

// Repeater
const repeaterRequestEditor = document.getElementById('repeaterRequestEditor');
const sendRepeaterBtn = document.getElementById('sendRepeaterBtn');
const repeaterResponseContent = document.getElementById('repeaterResponseContent');
const repeaterResponseTime = document.getElementById('repeaterResponseTime');

function sendToRepeater(item) {
  const requestText = formatHttpRequest(item);
  repeaterRequestEditor.value = requestText;
}

sendRepeaterBtn.addEventListener('click', async () => {
  const requestText = repeaterRequestEditor.value;
  if (!requestText.trim()) {
    alert('Please enter a request');
    return;
  }

  const requestData = parseHttpRequest(requestText);
  const result = await window.api.repeatRequest(requestData);

  if (result.success) {
    const response = result.result.response;
    let responseText = `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\n`;
    for (const [key, value] of Object.entries(response.headers)) {
      responseText += `${key}: ${value}\n`;
    }
    responseText += '\n';
    responseText += response.bodyString || '';

    repeaterResponseContent.innerHTML = `<pre>${escapeHtml(responseText)}</pre>`;
    repeaterResponseTime.textContent = `${response.time} ms`;
  } else {
    alert('Failed to send request: ' + result.error);
  }
});

// Intruder
const intruderRequestEditor = document.getElementById('intruderRequestEditor');
const attackTypeSelect = document.getElementById('attackTypeSelect');
const intruderPayloads = document.getElementById('intruderPayloads');
const startIntruderBtn = document.getElementById('startIntruderBtn');
const clearIntruderBtn = document.getElementById('clearIntruderBtn');
const intruderResultsBody = document.getElementById('intruderResultsBody');
const intruderProgress = document.getElementById('intruderProgress');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');

startIntruderBtn.addEventListener('click', async () => {
  const requestText = intruderRequestEditor.value;
  const payloadText = intruderPayloads.value;
  const attackType = attackTypeSelect.value;

  if (!requestText.trim() || !payloadText.trim()) {
    alert('Please enter request and payloads');
    return;
  }

  // Parse positions marked with §§
  const positions = [];
  const markerRegex = /§§/g;
  let match;
  let index = 0;

  while ((match = markerRegex.exec(requestText)) !== null) {
    if (index % 2 === 0) {
      // Start marker
      positions.push({
        type: 'body', // Simplified - just replace in body
        marker: '§§',
        start: match.index
      });
    }
    index++;
  }

  if (positions.length === 0) {
    alert('No positions marked! Use §§ to mark injection points');
    return;
  }

  const payloads = payloadText.split('\n').filter(p => p.trim());
  const requestData = parseHttpRequest(requestText.replace(/§§/g, ''));

  // Show progress
  intruderProgress.style.display = 'flex';
  startIntruderBtn.disabled = true;
  intruderResults = [];
  intruderResultsBody.innerHTML = '';

  const result = await window.api.runIntruder(requestData, positions, payloads, attackType);

  if (result.success) {
    intruderResults = result.results;
    displayIntruderResults(result.results);
  } else {
    alert('Intruder attack failed: ' + result.error);
  }

  intruderProgress.style.display = 'none';
  startIntruderBtn.disabled = false;
});

window.api.onIntruderProgress((progress) => {
  const percent = (progress.current / progress.total) * 100;
  progressBarFill.style.width = percent + '%';
  progressText.textContent = `${progress.current} / ${progress.total}`;
});

function displayIntruderResults(results) {
  results.forEach(result => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${result.id}</td>
      <td>${escapeHtml(result.payload)}</td>
      <td>${result.response.statusCode}</td>
      <td>${result.response.length} bytes</td>
      <td>${result.response.time}</td>
    `;

    row.addEventListener('click', () => {
      intruderResultsBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
    });

    intruderResultsBody.appendChild(row);
  });
}

clearIntruderBtn.addEventListener('click', () => {
  intruderResults = [];
  intruderResultsBody.innerHTML = '';
  progressBarFill.style.width = '0%';
  progressText.textContent = '0 / 0';
});

// Browser Controls
const browserBack = document.getElementById('browserBack');
const browserForward = document.getElementById('browserForward');
const browserRefresh = document.getElementById('browserRefresh');
const browserHome = document.getElementById('browserHome');
const browserUrl = document.getElementById('browserUrl');
const browserGo = document.getElementById('browserGo');

// Get webview element
let proxyBrowser = null;

// Wait for webview to be ready
document.addEventListener('DOMContentLoaded', () => {
  proxyBrowser = document.getElementById('proxyBrowser');

  if (proxyBrowser) {
    // Wait for webview to load
    proxyBrowser.addEventListener('did-finish-load', () => {
      console.log('Browser loaded:', proxyBrowser.getURL());
      browserUrl.value = proxyBrowser.getURL();
    });

    proxyBrowser.addEventListener('did-start-loading', () => {
      console.log('Browser loading...');
    });

    proxyBrowser.addEventListener('did-fail-load', (event) => {
      console.error('Browser failed to load:', event);
    });

    // Update URL bar when navigating
    proxyBrowser.addEventListener('did-navigate', (event) => {
      browserUrl.value = event.url;
    });

    proxyBrowser.addEventListener('did-navigate-in-page', (event) => {
      browserUrl.value = event.url;
    });
  }
});

browserBack.addEventListener('click', () => {
  if (proxyBrowser && proxyBrowser.canGoBack()) {
    proxyBrowser.goBack();
  }
});

browserForward.addEventListener('click', () => {
  if (proxyBrowser && proxyBrowser.canGoForward()) {
    proxyBrowser.goForward();
  }
});

browserRefresh.addEventListener('click', () => {
  if (proxyBrowser) {
    proxyBrowser.reload();
  }
});

browserHome.addEventListener('click', () => {
  if (proxyBrowser) {
    proxyBrowser.loadURL('http://example.com');
    browserUrl.value = 'http://example.com';
  }
});

browserGo.addEventListener('click', () => {
  let url = browserUrl.value.trim();
  if (url && proxyBrowser) {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    proxyBrowser.loadURL(url);
  }
});

browserUrl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    browserGo.click();
  }
});

// Initialize app
init();
