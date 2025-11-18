"""
WiFi CSI Server

WebSocket server that streams CSI data to the Electron frontend
and interfaces with the DensePose prediction API.
"""

import asyncio
import json
import logging
from typing import Set
import websockets
from websockets.server import WebSocketServerProtocol
import numpy as np

from csi_capture import CSICapture, WiFiConfig, CSICaptureMode, CSIPacket

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CSIServer:
    """
    WebSocket server for streaming CSI data to frontend
    """

    def __init__(self, host: str = '0.0.0.0', port: int = 8765):
        """
        Initialize CSI server

        Args:
            host: Host to bind to
            port: Port to bind to
        """
        self.host = host
        self.port = port
        self.clients: Set[WebSocketServerProtocol] = set()
        self.csi_capture: Optional[CSICapture] = None
        self.is_running = False

    async def register_client(self, websocket: WebSocketServerProtocol):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.clients)}")

    async def unregister_client(self, websocket: WebSocketServerProtocol):
        """Unregister a WebSocket client"""
        self.clients.discard(websocket)
        logger.info(f"Client disconnected. Total clients: {len(self.clients)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.clients:
            return

        # Serialize message
        message_json = json.dumps(message)

        # Send to all clients
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)

        # Remove disconnected clients
        for client in disconnected:
            await self.unregister_client(client)

    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle WebSocket client connection"""
        await self.register_client(websocket)

        try:
            async for message in websocket:
                # Handle incoming messages from client
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)

    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            command = data.get('command')

            if command == 'start_capture':
                await self.start_capture(data.get('config', {}))
                await websocket.send(json.dumps({
                    'type': 'response',
                    'command': 'start_capture',
                    'success': True
                }))

            elif command == 'stop_capture':
                await self.stop_capture()
                await websocket.send(json.dumps({
                    'type': 'response',
                    'command': 'stop_capture',
                    'success': True
                }))

            elif command == 'get_stats':
                stats = self.csi_capture.get_stats() if self.csi_capture else {}
                await websocket.send(json.dumps({
                    'type': 'response',
                    'command': 'get_stats',
                    'data': stats
                }))

            else:
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': f'Unknown command: {command}'
                }))

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def start_capture(self, config_dict: dict):
        """Start CSI capture"""
        if self.csi_capture and self.csi_capture.is_capturing:
            logger.warning("CSI capture already running")
            return

        # Create configuration
        config = WiFiConfig(
            mode=CSICaptureMode(config_dict.get('mode', 'simulation')),
            num_tx_antennas=config_dict.get('num_tx_antennas', 3),
            num_rx_antennas=config_dict.get('num_rx_antennas', 3),
            num_subcarriers=config_dict.get('num_subcarriers', 30),
            channel=config_dict.get('channel', 6),
            bandwidth=config_dict.get('bandwidth', 40),
            sampling_rate=config_dict.get('sampling_rate', 100)
        )

        # Create capture instance
        self.csi_capture = CSICapture(config)

        # Add callback to broadcast packets
        self.csi_capture.add_callback(self.on_csi_packet)

        # Start capture
        self.csi_capture.start()

        logger.info("CSI capture started")

    async def stop_capture(self):
        """Stop CSI capture"""
        if self.csi_capture:
            self.csi_capture.stop()
            self.csi_capture = None
            logger.info("CSI capture stopped")

    def on_csi_packet(self, packet: CSIPacket):
        """Callback for CSI packet - broadcast to clients"""
        # Convert CSI data to JSON-serializable format
        amplitude = np.abs(packet.csi_matrix).tolist()
        phase = np.angle(packet.csi_matrix).tolist()

        message = {
            'type': 'csi_packet',
            'data': {
                'timestamp': packet.timestamp,
                'amplitude': amplitude,
                'phase': phase,
                'rssi': packet.rssi,
                'channel': packet.channel
            }
        }

        # Broadcast asynchronously
        asyncio.create_task(self.broadcast(message))

    async def run(self):
        """Start the WebSocket server"""
        self.is_running = True

        logger.info(f"Starting CSI WebSocket server on ws://{self.host}:{self.port}")

        async with websockets.serve(self.handle_client, self.host, self.port):
            logger.info("CSI server is running")
            await asyncio.Future()  # Run forever

    def stop(self):
        """Stop the server"""
        self.is_running = False
        if self.csi_capture:
            self.csi_capture.stop()


# Main entry point
async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='WiFi CSI WebSocket Server')
    parser.add_argument('--host', type=str, default='0.0.0.0',
                       help='Host to bind to')
    parser.add_argument('--port', type=int, default=8765,
                       help='Port to bind to')

    args = parser.parse_args()

    # Create and run server
    server = CSIServer(host=args.host, port=args.port)

    try:
        await server.run()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        server.stop()


if __name__ == '__main__':
    asyncio.run(main())
