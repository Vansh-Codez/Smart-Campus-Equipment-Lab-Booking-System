import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("smart_campus.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a structured event payload to all connected clients."""
        payload_str = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.append(connection)
        
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

ws_manager = ConnectionManager()
