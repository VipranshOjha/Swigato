import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storage.service';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const pingIntervalRef = useRef(null);
    
    // Track connection state for UI (optional, e.g. for offline banners)
    const [status, setStatus] = useState('DISCONNECTED');
    
    // Set to track exponential backoff
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 10;
    
    // Topic subscriptions registry
    // Map<topic, Set<callback>>
    const listenersRef = useRef(new Map());
    
    // Set of topics that require network SUBSCRIBE messages
    const networkTopicsRef = useRef(new Set());

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        
        const token = storageService.getToken();
        if (!token) return;

        // Construct WS URL from current window location or env var
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Fallback to localhost if proxy isn't passing through properly in dev, 
        // but typically Vite proxy doesn't rewrite raw WS constructor well unless configured.
        // Assuming /api/v1/ws matches the backend path. 
        // If the backend is running on 8000, we'll hardcode or use env variable.
        const host = import.meta.env.VITE_API_BASE_URL 
            ? import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws') 
            : `${protocol}//${window.location.host}/api/v1`;
            
        const wsUrl = `${host}/ws`;

        setStatus('CONNECTING');
        // Passing token as subprotocol
        const ws = new WebSocket(wsUrl, [token]);

        ws.onopen = () => {
            console.log('[Realtime] Connected');
            setStatus('CONNECTED');
            
            // Dispatch reconnect healing event if this was a recovery
            if (reconnectAttemptsRef.current > 0) {
                console.log('[Realtime] Reconnection successful, dispatching heal signal...');
                window.dispatchEvent(new Event('realtime-reconnect'));
            }
            
            reconnectAttemptsRef.current = 0;
            
            // Start heartbeat
            pingIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'PING' }));
                }
            }, 30000); // 30 seconds

            // Resubscribe to topics that require network subscription
            networkTopicsRef.current.forEach(topic => {
                ws.send(JSON.stringify({
                    type: 'SUBSCRIBE',
                    payload: { topic }
                }));
            });
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'PONG') return;
                
                if (data.type === 'EVENT' && data.payload) {
                    // Try parsing the envelope payload
                    const envelope = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
                    const topic = envelope.tenant_scope;
                    
                    if (topic && listenersRef.current.has(topic)) {
                        const callbacks = listenersRef.current.get(topic);
                        callbacks.forEach(cb => cb(envelope));
                    }
                }
            } catch (err) {
                console.error('[Realtime] Message parsing error', err);
            }
        };

        ws.onclose = (event) => {
            console.log(`[Realtime] Disconnected (code: ${event.code})`);
            setStatus('DISCONNECTED');
            clearInterval(pingIntervalRef.current);
            wsRef.current = null;

            // Code 1008 is our custom "Invalid Token" close code. Do not auto-reconnect.
            if (event.code === 1008) return;

            // Exponential backoff reconnect
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                reconnectAttemptsRef.current++;
                console.log(`[Realtime] Reconnecting in ${delay}ms...`);
                reconnectTimeoutRef.current = setTimeout(connect, delay);
            }
        };

        ws.onerror = (error) => {
            console.error('[Realtime] WebSocket error', error);
            // onclose will handle reconnect
        };

        wsRef.current = ws;
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        
        if (wsRef.current) {
            wsRef.current.close(1000, "Client disconnected");
            wsRef.current = null;
        }
        setStatus('DISCONNECTED');
    }, []);

    // Manage connect/disconnect based on Auth state
    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else {
            disconnect();
        }

        return () => disconnect();
    }, [isAuthenticated, connect, disconnect]);

    // Exposed methods for the hook
    const subscribe = useCallback((topic, callback) => {
        if (!listenersRef.current.has(topic)) {
            listenersRef.current.set(topic, new Set());
        }
        if (!networkTopicsRef.current.has(topic)) {
            networkTopicsRef.current.add(topic);
            // Tell backend about new topic if already connected
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'SUBSCRIBE',
                    payload: { topic }
                }));
            }
        }
        
        listenersRef.current.get(topic).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = listenersRef.current.get(topic);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    listenersRef.current.delete(topic);
                    if (networkTopicsRef.current.has(topic)) {
                        networkTopicsRef.current.delete(topic);
                        // Explicitly tell the server to UNSUBSCRIBE
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(JSON.stringify({
                                type: 'UNSUBSCRIBE',
                                payload: { topic }
                            }));
                        }
                    }
                }
            }
        };
    }, []);

    const listen = useCallback((topic, callback) => {
        if (!listenersRef.current.has(topic)) {
            listenersRef.current.set(topic, new Set());
        }
        listenersRef.current.get(topic).add(callback);
        
        // Return unlisten function
        return () => {
            const callbacks = listenersRef.current.get(topic);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    listenersRef.current.delete(topic);
                }
            }
        };
    }, []);

    const value = {
        status,
        subscribe,
        listen
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
