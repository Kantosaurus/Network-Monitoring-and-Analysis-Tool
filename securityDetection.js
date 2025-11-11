// Security Threat Detection Engine
class SecurityDetector {
  constructor() {
    this.alerts = [];
    this.arpCache = new Map(); // IP -> MAC mapping
    this.connectionTracking = new Map(); // Track connections per IP
    this.portScanTracking = new Map(); // Track port scan attempts
    this.listeners = [];
  }

  // Add alert listener
  onAlert(callback) {
    this.listeners.push(callback);
  }

  // Emit alert to all listeners
  emitAlert(alert) {
    this.alerts.push(alert);
    this.listeners.forEach(listener => listener(alert));
  }

  // Main detection method
  detectThreats(packet) {
    const threats = [];

    // Run all detection rules
    threats.push(...this.detectUnencryptedProtocols(packet));
    threats.push(...this.detectARPSpoofing(packet));
    threats.push(...this.detectPortScan(packet));
    threats.push(...this.detectSuspiciousPorts(packet));
    threats.push(...this.detectLargePackets(packet));
    threats.push(...this.detectBroadcastStorm(packet));

    // Emit each threat
    threats.forEach(threat => this.emitAlert(threat));

    return threats;
  }

  // Detect unencrypted protocols
  detectUnencryptedProtocols(packet) {
    const threats = [];
    const unencryptedPorts = {
      21: { protocol: 'FTP', severity: 'medium' },
      23: { protocol: 'Telnet', severity: 'high' },
      80: { protocol: 'HTTP', severity: 'low' },
      110: { protocol: 'POP3', severity: 'medium' },
      143: { protocol: 'IMAP', severity: 'medium' },
      3389: { protocol: 'RDP (Unencrypted)', severity: 'critical' }
    };

    const port = packet.dstPort || packet.srcPort;
    if (port && unencryptedPorts[port]) {
      const { protocol, severity } = unencryptedPorts[port];
      threats.push({
        severity,
        type: 'unencrypted_protocol',
        message: `${protocol} detected (unencrypted)`,
        details: `${packet.source}:${packet.srcPort} → ${packet.destination}:${packet.dstPort}`,
        packet: packet.no,
        timestamp: new Date().toISOString()
      });
    }

    return threats;
  }

  // Detect ARP spoofing
  detectARPSpoofing(packet) {
    const threats = [];

    if (packet.protocol === 'ARP') {
      const ip = packet.source;
      const mac = packet.raw?.arp?.sender_ha;

      if (ip && mac) {
        if (this.arpCache.has(ip)) {
          const cachedMac = this.arpCache.get(ip);
          if (cachedMac !== mac) {
            threats.push({
              severity: 'critical',
              type: 'arp_spoofing',
              message: 'ARP spoofing detected!',
              details: `IP ${ip} changed MAC from ${cachedMac} to ${mac}`,
              packet: packet.no,
              timestamp: new Date().toISOString()
            });
          }
        }
        this.arpCache.set(ip, mac);
      }
    }

    return threats;
  }

  // Detect port scanning
  detectPortScan(packet) {
    const threats = [];

    if (packet.protocol === 'TCP' && packet.info.includes('SYN')) {
      const sourceIP = packet.source;
      const destPort = packet.dstPort;

      // Track unique destination ports per source IP
      if (!this.portScanTracking.has(sourceIP)) {
        this.portScanTracking.set(sourceIP, {
          ports: new Set(),
          firstSeen: Date.now(),
          packets: 0
        });
      }

      const tracking = this.portScanTracking.get(sourceIP);
      tracking.ports.add(destPort);
      tracking.packets++;

      // Alert if > 20 different ports in 60 seconds
      const timeWindow = Date.now() - tracking.firstSeen;
      if (tracking.ports.size > 20 && timeWindow < 60000) {
        threats.push({
          severity: 'high',
          type: 'port_scan',
          message: 'Port scan detected',
          details: `${sourceIP} scanned ${tracking.ports.size} ports in ${(timeWindow / 1000).toFixed(1)}s`,
          packet: packet.no,
          timestamp: new Date().toISOString()
        });

        // Reset tracking to avoid spam
        this.portScanTracking.delete(sourceIP);
      }

      // Clean up old entries (older than 60 seconds)
      if (timeWindow > 60000) {
        this.portScanTracking.delete(sourceIP);
      }
    }

    return threats;
  }

  // Detect suspicious ports
  detectSuspiciousPorts(packet) {
    const threats = [];
    const suspiciousPorts = {
      4444: 'Metasploit default',
      5555: 'Android Debug Bridge',
      6666: 'Common backdoor',
      6667: 'IRC (possible botnet C&C)',
      6668: 'IRC (possible botnet C&C)',
      6669: 'IRC (possible botnet C&C)',
      31337: 'Back Orifice trojan',
      12345: 'NetBus trojan',
      1337: 'Leet port (often malicious)'
    };

    const port = packet.dstPort || packet.srcPort;
    if (port && suspiciousPorts[port]) {
      threats.push({
        severity: 'high',
        type: 'suspicious_port',
        message: `Suspicious port ${port} detected`,
        details: `${suspiciousPorts[port]} - ${packet.source} ↔ ${packet.destination}`,
        packet: packet.no,
        timestamp: new Date().toISOString()
      });
    }

    return threats;
  }

  // Detect unusually large packets (possible data exfiltration)
  detectLargePackets(packet) {
    const threats = [];

    if (packet.length > 1500 && packet.protocol === 'TCP') {
      // Large TCP packets might indicate data exfiltration
      threats.push({
        severity: 'low',
        type: 'large_packet',
        message: 'Unusually large packet detected',
        details: `${packet.length} bytes from ${packet.source} to ${packet.destination}`,
        packet: packet.no,
        timestamp: new Date().toISOString()
      });
    }

    return threats;
  }

  // Detect broadcast storm
  detectBroadcastStorm(packet) {
    const threats = [];

    if (packet.destination === '255.255.255.255' ||
        packet.destination === 'ff:ff:ff:ff:ff:ff') {
      // Track broadcasts
      if (!this.connectionTracking.has('broadcast_count')) {
        this.connectionTracking.set('broadcast_count', {
          count: 0,
          firstSeen: Date.now()
        });
      }

      const tracking = this.connectionTracking.get('broadcast_count');
      tracking.count++;

      // Alert if > 100 broadcasts in 10 seconds
      const timeWindow = Date.now() - tracking.firstSeen;
      if (tracking.count > 100 && timeWindow < 10000) {
        threats.push({
          severity: 'medium',
          type: 'broadcast_storm',
          message: 'Broadcast storm detected',
          details: `${tracking.count} broadcasts in ${(timeWindow / 1000).toFixed(1)}s`,
          packet: packet.no,
          timestamp: new Date().toISOString()
        });

        // Reset
        this.connectionTracking.set('broadcast_count', {
          count: 0,
          firstSeen: Date.now()
        });
      }

      // Clean up old tracking
      if (timeWindow > 10000) {
        tracking.count = 0;
        tracking.firstSeen = Date.now();
      }
    }

    return threats;
  }

  // Get all alerts
  getAlerts() {
    return this.alerts;
  }

  // Clear all alerts
  clearAlerts() {
    this.alerts = [];
  }

  // Clear all tracking data
  reset() {
    this.alerts = [];
    this.arpCache.clear();
    this.connectionTracking.clear();
    this.portScanTracking.clear();
  }
}

module.exports = SecurityDetector;
