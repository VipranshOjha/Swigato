import { useEffect } from 'react';
import { useWebSocket } from '../providers/WebSocketProvider';

/**
 * Hook to subscribe to one or more realtime topics.
 * 
 * @param {string|string[]} topics - The tenant_scope/topic(s) to listen to
 * @param {string|string[]} eventTypes - The specific EventType(s) to filter for. If null, listens to all events on topic.
 * @param {Function} callback - Function(envelope) called when event arrives.
 */
export const useRealtime = (topics, eventTypes, callback) => {
    const ws = useWebSocket();

    // Serialize arrays for stable dependency tracking
    const topicsStr = JSON.stringify(topics);
    const eventTypesStr = JSON.stringify(eventTypes);

    useEffect(() => {
        if (!ws || !topics || !callback) return;

        const topicList = Array.isArray(topics) ? topics : [topics];
        const eventTypeList = Array.isArray(eventTypes) ? eventTypes : (eventTypes ? [eventTypes] : null);

        const wrappedCallback = (envelope) => {
            if (!eventTypeList || eventTypeList.includes(envelope.event_type) || envelope.event_type === 'SYSTEM_RECONNECT') {
                callback(envelope);
            }
        };

        const unsubscribes = topicList.map(topic => ws.listen(topic, wrappedCallback));

        // Reconnect healing listener
        const handleReconnect = () => {
            wrappedCallback({ event_type: 'SYSTEM_RECONNECT', type: 'SYSTEM_RECONNECT' });
        };
        window.addEventListener('realtime-reconnect', handleReconnect);

        return () => {
            unsubscribes.forEach(unsub => unsub());
            window.removeEventListener('realtime-reconnect', handleReconnect);
        };
    }, [ws, topicsStr, eventTypesStr, callback]);
};
