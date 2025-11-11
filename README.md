# Network Monitor & Analysis Tool (NMAT)

A powerful, premium network monitoring and packet analysis tool built with Electron. Features a stunning glassmorphic UI with Apple-inspired design aesthetics.

## Design Highlights

- **Borderless Window**: Frameless, transparent design with custom window controls
- **Glassmorphism**: Premium frosted glass effects with blur backdrop filters
- **Apple-like Aesthetics**: Clean, minimalistic design inspired by macOS Big Sur and iOS
- **Smooth Animations**: Buttery-smooth transitions and micro-interactions
- **Modern Typography**: Inter font with perfect spacing and hierarchy
- **Dark Theme**: Beautiful gradient background with subtle radial accents

## Features

### Core Functionality
- **Real-time Packet Capture**: Capture network packets on any available network interface
- **Protocol Support**: TCP, UDP, ICMP, ARP, IPv4, and IPv6
- **Advanced Filtering**: Filter packets by protocol, IP address, port, or custom text with Enter key support
- **Detailed Packet Analysis**: View comprehensive packet details including Ethernet, IP, and Transport layer information

### Security Analysis (NEW!)
- **Security Alerts Panel**: Real-time threat detection and alerts
  - **Unencrypted Protocol Detection**: Identifies FTP, Telnet, HTTP, POP3, IMAP, RDP
  - **ARP Spoofing Detection**: Detects IP-MAC address changes
  - **Port Scan Detection**: Identifies rapid port scanning activity (20+ ports in 60s)
  - **Suspicious Port Detection**: Flags known malicious ports (Metasploit, backdoors, trojans)
  - **Large Packet Detection**: Identifies potential data exfiltration
  - **Broadcast Storm Detection**: Detects excessive broadcast traffic
  - **Severity Levels**: Critical, High, Medium, Low with color-coding
  - **Click to Jump**: Click any alert to jump to the related packet
  - **Live Counter**: Real-time alert count badge

### Advanced Analysis
- **Hex Viewer/Editor**: Built-in hex viewer displaying raw packet data with offset, hex bytes, and ASCII representation
  - Interactive byte selection with hover effects
  - Copy hex data to clipboard
  - Grouped bytes for easy reading (8 bytes per group)
  - Color-coded printable vs non-printable ASCII characters
- **Statistics Dashboard**: Beautiful modal with protocol distribution, top conversations, and bandwidth usage
- **Export Functionality**: Export captured packets to JSON or CSV format
- **Responsive Sidebar**: Organized controls with glassmorphic panels

## Requirements

- **Node.js**: Version 14 or higher
- **Administrator/Root Privileges**: Required for packet capture
- **Windows**: WinPcap or Npcap installed
- **macOS/Linux**: libpcap installed (usually pre-installed)

### Installing Packet Capture Libraries

#### Windows
Download and install [Npcap](https://npcap.com/#download) (recommended) or WinPcap

#### macOS
libpcap is pre-installed. No additional setup needed.

#### Linux
```bash
sudo apt-get install libpcap-dev  # Debian/Ubuntu
sudo yum install libpcap-devel    # RedHat/CentOS
```

## Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

## Running the Application

**Important**: The application must be run with administrator/root privileges to capture packets.

### Windows
```bash
# Run as Administrator
npm start
```

### macOS/Linux
```bash
sudo npm start
```

### Development Mode
To run with DevTools open:
```bash
sudo npm run dev
```

## Usage Guide

### Starting Packet Capture

1. **Select Interface**: Choose a network interface from the dropdown menu
2. **Start Capture**: Click the "Start Capture" button
3. **View Packets**: Packets will appear in real-time in the packet list

### Stopping Capture

- Click the "Stop Capture" button to stop capturing packets
- Captured packets remain in the list for analysis

### Filtering Packets

NMAT supports various filter types:

- **Protocol Filter**: Type protocol name (e.g., `tcp`, `udp`, `icmp`, `arp`)
- **IP Address Filter**:
  - `ip.addr==192.168.1.1` - Packets to/from this IP
  - `ip.src==192.168.1.1` - Packets from this IP
  - `ip.dst==192.168.1.1` - Packets to this IP
- **Port Filter**: `port==80` - Packets using this port
- **Text Search**: Any text to search in source, destination, or info fields

### Viewing Packet Details

1. Click on any packet in the list
2. Detailed information appears in the bottom panel
3. Sections can be collapsed/expanded by clicking on section titles

### Hex Viewer

The hex viewer displays the raw packet data in hexadecimal format with ASCII representation:

- **Offset Column**: Shows the byte offset in hexadecimal (00000000, 00000010, etc.)
- **Hex Bytes**: Displays 16 bytes per row in hexadecimal format, grouped by 8 bytes
- **ASCII Column**: Shows the ASCII representation of bytes
  - Printable characters (yellow) are displayed as-is
  - Non-printable characters (gray) are shown as dots (.)
- **Interactive**: Click on any hex byte to highlight it
- **Copy Function**: Click the copy icon to copy all hex data to clipboard

The hex viewer automatically updates when you select a packet from the list.

### Statistics

Click the "Statistics" button to view:
- **Protocol Distribution**: Breakdown of protocols with percentages
- **Top Conversations**: Most active source-destination pairs
- **Bandwidth Usage**: Total packets, bytes, and average packet size

### Exporting Data

- **Export JSON**: Save all captured packets in JSON format
- **Export CSV**: Save packets in CSV format for spreadsheet analysis

### Clearing Data

Click the "Clear" button to remove all captured packets from the display

## Packet Information Displayed

- **No.**: Packet number in capture sequence
- **Time**: Relative time since capture started (seconds)
- **Source**: Source IP address
- **Destination**: Destination IP address
- **Protocol**: Network protocol (TCP, UDP, ICMP, ARP, IPv6)
- **Length**: Packet length in bytes
- **Info**: Protocol-specific information

## Troubleshooting

### "Device not found" Error
- Ensure you're running the application with administrator/root privileges
- Verify the selected network interface is active

### "Permission denied" Error
- On Windows: Run Command Prompt as Administrator
- On macOS/Linux: Use `sudo` when running the application

### No Packets Captured
- Check if the network interface is active and connected
- Ensure network traffic is actually flowing through the interface
- Some virtual interfaces may not capture packets

### "NODE_MODULE_VERSION" Error
If you see an error like "was compiled against a different Node.js version", rebuild the native modules:

```bash
npm run rebuild
```

This automatically runs after `npm install`, but you can run it manually if needed.

### Installation Issues with 'cap' Module
The `cap` module is a native addon and requires build tools:

**Windows**:
- Install Visual Studio Build Tools or windows-build-tools
- Python 3.11 or earlier (Python 3.12+ removed distutils which is needed for building)

**macOS**: Install Xcode Command Line Tools
```bash
xcode-select --install
```

**Linux**: Install build-essential
```bash
sudo apt-get install build-essential
```

After installing build tools, run:
```bash
npm run rebuild
```

## Architecture

- **Main Process** (`main.js`): Electron main process, handles IPC and window management
- **Renderer Process** (`renderer.js`): UI logic, packet display, and filtering
- **Packet Capture** (`packetCapture.js`): Low-level packet capture using cap library
- **Preload Script** (`preload.js`): Secure IPC bridge between main and renderer

## Security Considerations

- This application requires elevated privileges to capture packets
- Only use on networks you own or have permission to monitor
- Be cautious of sensitive data in captured packets
- Exported files may contain sensitive information

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Packet capture powered by [cap](https://github.com/mscdex/cap)
- Inspired by [Wireshark](https://www.wireshark.org/)
