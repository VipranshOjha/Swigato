from __future__ import annotations

import abc
import asyncio
from typing import Callable, Awaitable
import structlog

from app.realtime.events import EventEnvelope

logger = structlog.get_logger(__name__)

class EventBus(abc.ABC):
    """
    Abstract Event Bus interface for pub/sub.
    Ensures that domain services don't care about WebSocket internals or Redis.
    """
    
    @abc.abstractmethod
    async def publish(self, topic: str, event: EventEnvelope) -> None:
        """Publish an event to a specific topic."""
        pass

    @abc.abstractmethod
    async def safe_publish(self, topic: str, event: EventEnvelope) -> None:
        """Publish an event safely, trapping any exceptions to protect business transactions."""
        pass

    @abc.abstractmethod
    def subscribe(self, topic: str, callback: Callable[[EventEnvelope], Awaitable[None]]) -> None:
        """
        Subscribe an internal backend handler to a topic.
        Note: This is for server-side handlers, not for tracking individual WebSocket clients.
        The WebSocket manager will register ONE handler per topic here, and fan out to connections.
        """
        pass

class InMemoryEventBus(EventBus):
    """
    Local memory implementation of EventBus.
    Uses topic-based routing for asyncio callbacks.
    """
    def __init__(self):
        # topic -> list of async callbacks
        self._handlers: dict[str, list[Callable[[EventEnvelope], Awaitable[None]]]] = {}
        # Simple atomic counter for sequence numbers within this local node
        self._sequence_counter = 0
        self._lock = asyncio.Lock()

    async def _get_next_sequence(self) -> int:
        async with self._lock:
            self._sequence_counter += 1
            return self._sequence_counter

    async def publish(self, topic: str, event: EventEnvelope) -> None:
        # Assign sequence number if not already assigned
        if event.sequence_number == 0:
            event.sequence_number = await self._get_next_sequence()
            
        handlers = self._handlers.get(topic, [])
        if not handlers:
            logger.debug("event_bus.publish_dropped", topic=topic, event_id=event.event_id, reason="no_subscribers")
            return
            
        logger.debug("event_bus.publish", topic=topic, event_id=event.event_id, sequence=event.sequence_number)
        
        # Fan out concurrently
        tasks = [asyncio.create_task(handler(event)) for handler in handlers]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def safe_publish(self, topic: str, event: EventEnvelope) -> None:
        """Wraps publish to guarantee it never throws and aborts an API response."""
        try:
            await self.publish(topic, event)
        except Exception as e:
            logger.error("event_bus.publish_failed", topic=topic, event_id=event.event_id, error=str(e))

    def subscribe(self, topic: str, callback: Callable[[EventEnvelope], Awaitable[None]]) -> None:
        if topic not in self._handlers:
            self._handlers[topic] = []
        self._handlers[topic].append(callback)
        logger.info("event_bus.subscribed_internal", topic=topic)

# Global event bus instance
event_bus = InMemoryEventBus()
