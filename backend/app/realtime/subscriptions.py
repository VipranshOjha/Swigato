from __future__ import annotations

import collections
import structlog

logger = structlog.get_logger(__name__)

class SubscriptionRegistry:
    """
    In-memory registry mapping topics to connection IDs.
    Designed to be easily backed by Redis sets in the future.
    """
    def __init__(self):
        # topic -> set of connection_ids
        self._topics: dict[str, set[str]] = collections.defaultdict(set)
        # connection_id -> set of topics (reverse lookup for fast cleanup)
        self._connections: dict[str, set[str]] = collections.defaultdict(set)

    def subscribe(self, connection_id: str, topic: str) -> None:
        """Subscribe a connection to a specific topic."""
        self._topics[topic].add(connection_id)
        self._connections[connection_id].add(topic)
        logger.debug("realtime.subscribed", connection_id=connection_id, topic=topic)

    def unsubscribe(self, connection_id: str, topic: str) -> None:
        """Unsubscribe a connection from a specific topic."""
        if connection_id in self._topics[topic]:
            self._topics[topic].remove(connection_id)
            if not self._topics[topic]:
                del self._topics[topic]
        
        if topic in self._connections[connection_id]:
            self._connections[connection_id].remove(topic)
            if not self._connections[connection_id]:
                del self._connections[connection_id]
        logger.debug("realtime.unsubscribed", connection_id=connection_id, topic=topic)

    def unsubscribe_all(self, connection_id: str) -> list[str]:
        """Remove a connection from all topics (e.g. on disconnect). Returns topics removed."""
        topics = list(self._connections.get(connection_id, []))
        for topic in topics:
            self.unsubscribe(connection_id, topic)
        return topics

    def get_connections_for_topic(self, topic: str) -> set[str]:
        """Get all connection IDs subscribed to a topic."""
        return self._topics.get(topic, set())

    def get_topics_for_connection(self, connection_id: str) -> set[str]:
        """Get all topics a connection is subscribed to."""
        return self._connections.get(connection_id, set())

# Global registry instance
registry = SubscriptionRegistry()
