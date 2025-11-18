"""
WiFi CSI (Channel State Information) Capture Module

This module provides interfaces for capturing WiFi CSI from various hardware:
- Linux 802.11n CSI Tool (Intel 5300 NIC)
- ESP32 CSI Toolkit
- Atheros CSI Tool
- Nexmon CSI (Raspberry Pi)

For development/testing, it also provides simulation mode.
"""

import numpy as np
import time
import threading
import queue
from typing import Optional, Callable, Dict, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CSICaptureMode(Enum):
    """CSI capture hardware modes"""
    SIMULATION = "simulation"
    INTEL_5300 = "intel_5300"
    ESP32 = "esp32"
    ATHEROS = "atheros"
    NEXMON = "nexmon"


@dataclass
class CSIPacket:
    """WiFi CSI packet data"""
    timestamp: float
    csi_matrix: np.ndarray  # Complex CSI values (num_subcarriers, num_tx, num_rx)
    rssi: float  # Received Signal Strength Indicator
    rate: int  # Data rate
    channel: int  # WiFi channel
    bandwidth: int  # Bandwidth in MHz


@dataclass
class WiFiConfig:
    """WiFi capture configuration"""
    mode: CSICaptureMode = CSICaptureMode.SIMULATION
    num_tx_antennas: int = 3
    num_rx_antennas: int = 3
    num_subcarriers: int = 30
    channel: int = 6  # 2.4 GHz channel
    bandwidth: int = 40  # MHz
    sampling_rate: int = 100  # Hz (target)


class CSICapture:
    """
    WiFi CSI Capture Manager

    Handles CSI data capture from various hardware sources or simulation.
    """

    def __init__(self, config: WiFiConfig):
        """
        Initialize CSI capture

        Args:
            config: WiFi configuration
        """
        self.config = config
        self.is_capturing = False
        self.packet_queue = queue.Queue(maxsize=1000)
        self.capture_thread: Optional[threading.Thread] = None
        self.callbacks: list[Callable[[CSIPacket], None]] = []

        # Statistics
        self.stats = {
            'packets_captured': 0,
            'packets_dropped': 0,
            'start_time': None
        }

        # Initialize hardware interface
        self._init_hardware()

    def _init_hardware(self):
        """Initialize hardware interface based on mode"""
        if self.config.mode == CSICaptureMode.SIMULATION:
            logger.info("CSI Capture initialized in SIMULATION mode")
        elif self.config.mode == CSICaptureMode.INTEL_5300:
            logger.info("Initializing Intel 5300 NIC...")
            self._init_intel_5300()
        elif self.config.mode == CSICaptureMode.ESP32:
            logger.info("Initializing ESP32 CSI Toolkit...")
            self._init_esp32()
        elif self.config.mode == CSICaptureMode.ATHEROS:
            logger.info("Initializing Atheros CSI Tool...")
            self._init_atheros()
        elif self.config.mode == CSICaptureMode.NEXMON:
            logger.info("Initializing Nexmon CSI...")
            self._init_nexmon()

    def _init_intel_5300(self):
        """Initialize Intel 5300 CSI capture"""
        # This would interface with the Intel 5300 Linux driver
        # Example: https://github.com/dhalperi/linux-80211n-csitool
        try:
            # Import Intel 5300 CSI tool bindings (if available)
            # import csi_tool
            # self.csi_tool = csi_tool.CSITool()
            logger.warning("Intel 5300 driver not found - falling back to simulation")
            self.config.mode = CSICaptureMode.SIMULATION
        except ImportError:
            logger.warning("Intel 5300 driver not found - falling back to simulation")
            self.config.mode = CSICaptureMode.SIMULATION

    def _init_esp32(self):
        """Initialize ESP32 CSI capture"""
        # This would interface with ESP32 over serial/network
        # Example: https://github.com/StevenMHernandez/ESP32-CSI-Tool
        try:
            import serial
            # self.esp32 = serial.Serial('/dev/ttyUSB0', 115200)
            logger.warning("ESP32 not found - falling back to simulation")
            self.config.mode = CSICaptureMode.SIMULATION
        except ImportError:
            logger.warning("ESP32 serial interface not available - falling back to simulation")
            self.config.mode = CSICaptureMode.SIMULATION

    def _init_atheros(self):
        """Initialize Atheros CSI capture"""
        # This would interface with Atheros CSI Tool
        # Example: https://github.com/xieyaxiongfly/Atheros-CSI-Tool
        logger.warning("Atheros CSI Tool not found - falling back to simulation")
        self.config.mode = CSICaptureMode.SIMULATION

    def _init_nexmon(self):
        """Initialize Nexmon CSI (Raspberry Pi)"""
        # This would interface with Nexmon CSI firmware
        # Example: https://github.com/seemoo-lab/nexmon_csi
        logger.warning("Nexmon CSI not found - falling back to simulation")
        self.config.mode = CSICaptureMode.SIMULATION

    def start(self):
        """Start CSI capture"""
        if self.is_capturing:
            logger.warning("CSI capture already running")
            return

        self.is_capturing = True
        self.stats['start_time'] = time.time()
        self.stats['packets_captured'] = 0
        self.stats['packets_dropped'] = 0

        # Start capture thread
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()

        logger.info("CSI capture started")

    def stop(self):
        """Stop CSI capture"""
        if not self.is_capturing:
            return

        self.is_capturing = False

        if self.capture_thread:
            self.capture_thread.join(timeout=2.0)

        logger.info(f"CSI capture stopped. Total packets: {self.stats['packets_captured']}")

    def _capture_loop(self):
        """Main capture loop"""
        target_interval = 1.0 / self.config.sampling_rate

        while self.is_capturing:
            start_time = time.time()

            # Capture CSI packet
            try:
                packet = self._capture_packet()

                # Put in queue
                try:
                    self.packet_queue.put_nowait(packet)
                    self.stats['packets_captured'] += 1

                    # Notify callbacks
                    for callback in self.callbacks:
                        try:
                            callback(packet)
                        except Exception as e:
                            logger.error(f"Callback error: {e}")

                except queue.Full:
                    self.stats['packets_dropped'] += 1
                    logger.warning("Packet queue full - dropping packet")

            except Exception as e:
                logger.error(f"Capture error: {e}")

            # Maintain sampling rate
            elapsed = time.time() - start_time
            sleep_time = max(0, target_interval - elapsed)
            time.sleep(sleep_time)

    def _capture_packet(self) -> CSIPacket:
        """Capture a single CSI packet"""
        if self.config.mode == CSICaptureMode.SIMULATION:
            return self._simulate_packet()
        elif self.config.mode == CSICaptureMode.INTEL_5300:
            return self._capture_intel_5300_packet()
        elif self.config.mode == CSICaptureMode.ESP32:
            return self._capture_esp32_packet()
        elif self.config.mode == CSICaptureMode.ATHEROS:
            return self._capture_atheros_packet()
        elif self.config.mode == CSICaptureMode.NEXMON:
            return self._capture_nexmon_packet()
        else:
            raise ValueError(f"Unknown capture mode: {self.config.mode}")

    def _simulate_packet(self) -> CSIPacket:
        """Simulate a CSI packet for testing"""
        # Generate realistic CSI data
        num_subcarriers = self.config.num_subcarriers
        num_tx = self.config.num_tx_antennas
        num_rx = self.config.num_rx_antennas

        # Create complex CSI matrix
        # Amplitude: typically 10-30
        amplitude = np.random.uniform(10, 30, (num_subcarriers, num_tx, num_rx))

        # Phase: -π to π
        phase = np.random.uniform(-np.pi, np.pi, (num_subcarriers, num_tx, num_rx))

        # Combine into complex number
        csi_matrix = amplitude * np.exp(1j * phase)

        # Add some correlation between antennas (more realistic)
        for i in range(num_subcarriers):
            base_phase = np.random.uniform(-np.pi, np.pi)
            for tx in range(num_tx):
                for rx in range(num_rx):
                    # Add correlated phase shift
                    csi_matrix[i, tx, rx] *= np.exp(1j * base_phase * 0.5)

        return CSIPacket(
            timestamp=time.time(),
            csi_matrix=csi_matrix,
            rssi=-50.0 + np.random.randn() * 5.0,  # Typical RSSI
            rate=65,  # MCS index
            channel=self.config.channel,
            bandwidth=self.config.bandwidth
        )

    def _capture_intel_5300_packet(self) -> CSIPacket:
        """Capture packet from Intel 5300 NIC"""
        # This would read from the Intel 5300 CSI tool
        # For now, fall back to simulation
        return self._simulate_packet()

    def _capture_esp32_packet(self) -> CSIPacket:
        """Capture packet from ESP32"""
        # This would read from ESP32 over serial
        # For now, fall back to simulation
        return self._simulate_packet()

    def _capture_atheros_packet(self) -> CSIPacket:
        """Capture packet from Atheros device"""
        # This would read from Atheros CSI tool
        # For now, fall back to simulation
        return self._simulate_packet()

    def _capture_nexmon_packet(self) -> CSIPacket:
        """Capture packet from Nexmon CSI"""
        # This would read from Nexmon CSI
        # For now, fall back to simulation
        return self._simulate_packet()

    def get_packet(self, timeout: Optional[float] = None) -> Optional[CSIPacket]:
        """
        Get next CSI packet from queue

        Args:
            timeout: Timeout in seconds (None = block indefinitely)

        Returns:
            CSI packet or None if timeout
        """
        try:
            return self.packet_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def add_callback(self, callback: Callable[[CSIPacket], None]):
        """Add callback for real-time packet processing"""
        self.callbacks.append(callback)

    def remove_callback(self, callback: Callable[[CSIPacket], None]):
        """Remove callback"""
        if callback in self.callbacks:
            self.callbacks.remove(callback)

    def get_stats(self) -> Dict:
        """Get capture statistics"""
        stats = self.stats.copy()

        if stats['start_time']:
            elapsed = time.time() - stats['start_time']
            stats['sample_rate'] = stats['packets_captured'] / elapsed if elapsed > 0 else 0
            stats['drop_rate'] = stats['packets_dropped'] / (stats['packets_captured'] + stats['packets_dropped']) if (stats['packets_captured'] + stats['packets_dropped']) > 0 else 0

        return stats

    def get_csi_batch(self, num_samples: int = 5) -> Tuple[np.ndarray, np.ndarray]:
        """
        Get a batch of CSI samples for DensePose prediction

        Args:
            num_samples: Number of consecutive samples (default: 5)

        Returns:
            (amplitude, phase) arrays of shape (num_samples, num_subcarriers, num_tx, num_rx)
        """
        packets = []

        for _ in range(num_samples):
            packet = self.get_packet(timeout=1.0)
            if packet is None:
                logger.warning("Timeout waiting for CSI packet")
                break
            packets.append(packet)

        if len(packets) < num_samples:
            logger.warning(f"Only got {len(packets)}/{num_samples} packets")

        # Extract amplitude and phase
        amplitude_list = []
        phase_list = []

        for packet in packets:
            amplitude_list.append(np.abs(packet.csi_matrix))
            phase_list.append(np.angle(packet.csi_matrix))

        amplitude = np.array(amplitude_list)
        phase = np.array(phase_list)

        return amplitude, phase


# Example usage
if __name__ == "__main__":
    # Create configuration
    config = WiFiConfig(
        mode=CSICaptureMode.SIMULATION,
        num_tx_antennas=3,
        num_rx_antennas=3,
        num_subcarriers=30,
        sampling_rate=100
    )

    # Create capture instance
    capture = CSICapture(config)

    # Add callback
    def on_packet(packet: CSIPacket):
        print(f"Packet received: timestamp={packet.timestamp:.3f}, RSSI={packet.rssi:.1f} dBm")

    capture.add_callback(on_packet)

    # Start capture
    capture.start()

    try:
        # Capture for 5 seconds
        time.sleep(5)

        # Get a batch
        amplitude, phase = capture.get_csi_batch(num_samples=5)
        print(f"\nCaptured batch:")
        print(f"  Amplitude shape: {amplitude.shape}")
        print(f"  Phase shape: {phase.shape}")

        # Print stats
        stats = capture.get_stats()
        print(f"\nCapture statistics:")
        print(f"  Packets captured: {stats['packets_captured']}")
        print(f"  Sample rate: {stats['sample_rate']:.1f} Hz")
        print(f"  Drop rate: {stats['drop_rate']*100:.2f}%")

    finally:
        capture.stop()
