from __future__ import annotations

import asyncio
from datetime import datetime, UTC
from uuid import uuid4

import structlog
from fastapi import WebSocket

from app.realtime.schemas import ConnectionMetadata, WsMessage
from app.realtime.events import EventEnvelope
from app.realtime.subscriptions import registry as sub_registry
from app.realtime.event_bus import event_bus

logger = structlog.get_logger(__name__)

class WebSocketManager:
    def __init__(self):
        # connection_id -> (WebSocket, ConnectionMetadata)
        self.active_connections: dict[str, tuple[WebSocket, ConnectionMetadata]] = {}
        # Keep track of topics the manager itself is subscribed to on the EventBus
        self._bus_subscriptions: set[str] = set()
        
        # Deduplication cache for admin firehose
        self._admin_broadcasted_events: set[str] = set()
        self._admin_broadcasted_history: list[str] = []

    async def connect(self, websocket: WebSocket, user_id: str, roles: list[str]) -> ConnectionMetadata:
        await websocket.accept()
        connection_id = str(uuid4())
        
        metadata = ConnectionMetadata(
            connection_id=connection_id,
            user_id=user_id,
            roles=roles
        )
        self.active_connections[connection_id] = (websocket, metadata)
        
        # Automatically subscribe user to personal topic
        await self.subscribe(connection_id, f"user:{user_id}")
        
        logger.info("realtime.connected", connection_id=connection_id, user_id=user_id)
        return metadata

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            _, metadata = self.active_connections.pop(connection_id)
            topics = sub_registry.unsubscribe_all(connection_id)
            logger.info("realtime.disconnected", connection_id=connection_id, user_id=metadata.user_id, cleaned_topics=len(topics))

    async def update_last_seen(self, connection_id: str):
        if connection_id in self.active_connections:
            _, metadata = self.active_connections[connection_id]
            metadata.last_seen = datetime.now(UTC)

    async def subscribe(self, connection_id: str, topic: str):
        """Handle a client subscription request."""
        if connection_id not in self.active_connections:
            return
            
        _, metadata = self.active_connections[connection_id]
        
        # 1. Register client to topic
        sub_registry.subscribe(connection_id, topic)
        metadata.subscriptions.add(topic)
        
        # 2. Ensure manager is listening to this topic on the EventBus
        if topic not in self._bus_subscriptions:
            event_bus.subscribe(topic, self._broadcast_event)
            self._bus_subscriptions.add(topic)

    async def unsubscribe(self, connection_id: str, topic: str):
        """Handle a client unsubscribe request."""
        if connection_id not in self.active_connections:
            return
            
        _, metadata = self.active_connections[connection_id]
        
        # Unregister client from topic
        sub_registry.unsubscribe(connection_id, topic)
        if topic in metadata.subscriptions:
            metadata.subscriptions.remove(topic)

    async def _broadcast_event(self, event: EventEnvelope):
        """Called by EventBus when an event arrives. Route it to connected clients."""
        topic = event.tenant_scope
        if not topic:
            return
            
        target_connections = sub_registry.get_connections_for_topic(topic)
        
        # Admin Firehose logic
        admin_connections = sub_registry.get_connections_for_topic("admin:system")
        if admin_connections:
            # Check for duplicates
            if event.event_id not in self._admin_broadcasted_events:
                self._admin_broadcasted_events.add(event.event_id)
                self._admin_broadcasted_history.append(event.event_id)
                # Keep cache bounded
                if len(self._admin_broadcasted_history) > 1000:
                    oldest = self._admin_broadcasted_history.pop(0)
                    self._admin_broadcasted_events.discard(oldest)
                    
                target_connections = target_connections.union(admin_connections)
        
        # If no one is listening, bail
        if not target_connections:
            return
            
        # Prepare JSON string once
        message_data = WsMessage(type="EVENT", payload=event.model_dump(mode="json")).model_dump_json()
        
        # Fan out
        for cid in list(target_connections):
            if cid in self.active_connections:
                ws, _ = self.active_connections[cid]
                try:
                    await ws.send_text(message_data)
                except Exception as e:
                    logger.warning("realtime.send_failed", connection_id=cid, error=str(e))
                    # Safely remove bad connection
                    self.disconnect(cid)

    async def prune_stale_connections(self, timeout_seconds: int = 60):
        """Periodic cleanup task to remove connections that haven't pinged."""
        now = datetime.now(UTC)
        stale_cids = []
        
        for cid, (_, metadata) in self.active_connections.items():
            if (now - metadata.last_seen).total_seconds() > timeout_seconds:
                stale_cids.append(cid)
                
        for cid in stale_cids:
            logger.warning("realtime.pruning_stale", connection_id=cid)
            self.disconnect(cid)

    def emit_metrics(self):
        logger.info("realtime.metrics", active_connections=len(self.active_connections))

    async def start_pruner(self):
        """Background task to prune stale connections and emit metrics."""
        logger.info("realtime.pruner_started")
        try:
            while True:
                await self.prune_stale_connections(timeout_seconds=120)
                self.emit_metrics()
                await asyncio.sleep(60)
        except asyncio.CancelledError:
            logger.info("realtime.pruner_stopped")
            raise

manager = WebSocketManager()
