from __future__ import annotations

from datetime import datetime, UTC
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

class ConnectionMetadata(BaseModel):
    """Metadata tracked for every active WebSocket connection."""
    connection_id: str
    user_id: str
    roles: list[str]
    connected_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_seen: datetime = Field(default_factory=lambda: datetime.now(UTC))
    subscriptions: set[str] = Field(default_factory=set)

class WsMessage(BaseModel):
    """Generic incoming/outgoing raw websocket message envelope."""
    type: str
    payload: dict[str, Any] | None = None

class WsPingMessage(WsMessage):
    type: str = "PING"

class WsPongMessage(WsMessage):
    type: str = "PONG"

class WsSubscribeMessage(WsMessage):
    type: str = "SUBSCRIBE"
    payload: dict[str, str]  # e.g., {"topic": "order:123"}
