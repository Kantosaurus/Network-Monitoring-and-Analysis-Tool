const { Cap, decoders } = require('cap');
const EventEmitter = require('events');

class PacketCapture extends EventEmitter {
  constructor(deviceName) {
    super();
    this.deviceName = deviceName;
    this.cap = new Cap();
    this.device = null;
    this.buffer = null;
    this.packetCount = 0;
    this.startTime = Date.now();
  }

  start() {
    try {
      const devices = Cap.deviceList();
      this.device = devices.find(d => d.name === this.deviceName);

      if (!this.device) {
        throw new Error('Device not found');
      }

      const filter = '';
      const bufSize = 10 * 1024 * 1024;
      this.buffer = Buffer.alloc(65535);

      const linkType = this.cap.open(
        this.device.name,
        filter,
        bufSize,
        this.buffer
      );

      this.cap.setMinBytes(0);

      this.cap.on('packet', (nbytes, trunc) => {
        this.handlePacket(nbytes, trunc, linkType);
      });

      console.log('Packet capture started on device:', this.device.name);
    } catch (error) {
      this.emit('error', error);
    }
  }

  handlePacket(nbytes, trunc, linkType) {
    try {
      this.packetCount++;
      const timestamp = new Date().toISOString();

      let ret;
      if (linkType === 'ETHERNET') {
        ret = decoders.Ethernet(this.buffer);

        if (ret.info.type === 2048) { // IPv4
          ret.info.ipv4 = decoders.IPV4(this.buffer, ret.offset);
          const ipInfo = ret.info.ipv4.info;

          let protocol = 'Unknown';
          let srcPort = '';
          let dstPort = '';
          let info = '';

          if (ipInfo.protocol === 6) { // TCP
            protocol = 'TCP';
            const tcp = decoders.TCP(this.buffer, ret.info.ipv4.offset);
            srcPort = tcp.info.srcport;
            dstPort = tcp.info.dstport;

            const flags = [];
            if (tcp.info.flags & 0x01) flags.push('FIN');
            if (tcp.info.flags & 0x02) flags.push('SYN');
            if (tcp.info.flags & 0x04) flags.push('RST');
            if (tcp.info.flags & 0x08) flags.push('PSH');
            if (tcp.info.flags & 0x10) flags.push('ACK');
            if (tcp.info.flags & 0x20) flags.push('URG');

            info = `${srcPort} → ${dstPort} [${flags.join(', ')}] Seq=${tcp.info.seqno} Ack=${tcp.info.ackno} Win=${tcp.info.window}`;
          } else if (ipInfo.protocol === 17) { // UDP
            protocol = 'UDP';
            const udp = decoders.UDP(this.buffer, ret.info.ipv4.offset);
            srcPort = udp.info.srcport;
            dstPort = udp.info.dstport;
            info = `${srcPort} → ${dstPort} Len=${udp.info.length}`;
          } else if (ipInfo.protocol === 1) { // ICMP
            protocol = 'ICMP';
            const icmp = decoders.ICMP(this.buffer, ret.info.ipv4.offset);
            info = `Type=${icmp.info.type} Code=${icmp.info.code}`;
          }

          const packet = {
            no: this.packetCount,
            timestamp,
            relativeTime: ((Date.now() - this.startTime) / 1000).toFixed(6),
            source: ipInfo.srcaddr,
            destination: ipInfo.dstaddr,
            protocol,
            length: nbytes,
            info,
            srcPort,
            dstPort,
            raw: {
              ethernet: {
                src: ret.info.srcmac,
                dst: ret.info.dstmac
              },
              ip: {
                version: ipInfo.version,
                ttl: ipInfo.ttl,
                protocol: ipInfo.protocol
              }
            },
            rawBuffer: Array.from(this.buffer.slice(0, nbytes))
          };

          this.emit('packet', packet);
        } else if (ret.info.type === 2054) { // ARP
          const arp = decoders.ARP(this.buffer, ret.offset);

          const packet = {
            no: this.packetCount,
            timestamp,
            relativeTime: ((Date.now() - this.startTime) / 1000).toFixed(6),
            source: arp.info.sender_pa,
            destination: arp.info.target_pa,
            protocol: 'ARP',
            length: nbytes,
            info: `Who has ${arp.info.target_pa}? Tell ${arp.info.sender_pa}`,
            srcPort: '',
            dstPort: '',
            raw: {
              ethernet: {
                src: ret.info.srcmac,
                dst: ret.info.dstmac
              },
              arp: arp.info
            },
            rawBuffer: Array.from(this.buffer.slice(0, nbytes))
          };

          this.emit('packet', packet);
        } else if (ret.info.type === 34525) { // IPv6
          ret.info.ipv6 = decoders.IPV6(this.buffer, ret.offset);
          const ipInfo = ret.info.ipv6.info;

          const packet = {
            no: this.packetCount,
            timestamp,
            relativeTime: ((Date.now() - this.startTime) / 1000).toFixed(6),
            source: ipInfo.srcaddr,
            destination: ipInfo.dstaddr,
            protocol: 'IPv6',
            length: nbytes,
            info: `IPv6 packet`,
            srcPort: '',
            dstPort: '',
            raw: {
              ethernet: {
                src: ret.info.srcmac,
                dst: ret.info.dstmac
              },
              ip: ipInfo
            },
            rawBuffer: Array.from(this.buffer.slice(0, nbytes))
          };

          this.emit('packet', packet);
        }
      }
    } catch (error) {
      console.error('Error parsing packet:', error);
    }
  }

  stop() {
    try {
      if (this.cap) {
        this.cap.close();
        console.log('Packet capture stopped');
      }
    } catch (error) {
      console.error('Error stopping capture:', error);
    }
  }
}

module.exports = PacketCapture;
