import { useEffect, useRef, useState, useCallback } from 'react';
import { type KPIs, type FraudEvent } from '@shared/schema';

// Define the shape of messages we expect from the backend
type WebSocketMessage = 
  | { type: 'snapshot'; kpis: KPIs; recent_events: FraudEvent[] }
  | { type: 'tick'; kpis: KPIs; event: FraudEvent };

const THROTTLE_INTERVAL_MS = 1500;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [kpis, setKpis] = useState<KPIs>({
    txn_per_min: 0,
    alerts_per_min: 0,
    high_risk_pct: 0,
    avg_latency_ms: 0,
  });
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const eventQueueRef = useRef<FraudEvent[]>([]);
  const throttleIntervalRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    // Read backend URL from environment or fallback to current host
    const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || 
                 "wss://fraud-backend.ashybeach-527389a2.eastus2.azurecontainerapps.io/ws";

    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    // Reconnection logic state
    const retryIntervals = [1000, 2000, 5000];
    const retryCountRef = { current: 0 };

    ws.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0;
      console.log("✅ WebSocket connected");
    };

    ws.onclose = (e) => {
      setIsConnected(false);
      console.warn("⚠️ WebSocket closed", e);
      console.log('WebSocket disconnected, attempting reconnect...');
      
      const interval = retryIntervals[Math.min(retryCountRef.current, retryIntervals.length - 1)];
      retryCountRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(connect, interval);
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error", error);
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Incoming WebSocket message:', data);

        if (data.type === 'snapshot') {
          setKpis(data.kpis);
          eventQueueRef.current = [];
          const mappedEvents = (data.recent_events || []).map((ev: any) => ({
            id: ev.event_id || ev.id || `${ev.ts}-${ev.source}-${ev.device_os}`,
            timestamp: ev.ts ? new Date(ev.ts * 1000).toISOString() : (ev.timestamp || new Date().toISOString()),
            riskBand: ev.risk_band || 'N/A',
            decision: ev.decision || 'N/A',
            fraudProbability: ev.fraud_probability ?? 0,
            latencyMs: ev.latency_ms ?? 0,
            source: ev.source || 'Unknown',
            deviceOs: ev.device_os || 'Unknown',
            paymentType: ev.payment_type || 'Unknown',
            analystAction: ev.analyst_action || null,
          }));
          setEvents(mappedEvents.slice(0, 50));
        } else if (data.type === 'tick') {
          setKpis(data.kpis);
          if (data.event) {
            const mappedEvent: FraudEvent = {
              id: data.event.event_id || data.event.id || `${data.event.ts}-${data.event.source}-${data.event.device_os}`,
              timestamp: data.event.ts ? new Date(data.event.ts * 1000).toISOString() : (data.event.timestamp || new Date().toISOString()),
              riskBand: data.event.risk_band || 'N/A',
              decision: data.event.decision || 'N/A',
              fraudProbability: data.event.fraud_probability ?? 0,
              latencyMs: data.event.latency_ms ?? 0,
              source: data.event.source || 'Unknown',
              deviceOs: data.event.device_os || 'Unknown',
              paymentType: data.event.payment_type || 'Unknown',
              analystAction: data.event.analyst_action || null,
            };

            eventQueueRef.current.push(mappedEvent);
          }
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connect();
    
    throttleIntervalRef.current = setInterval(() => {
      if (eventQueueRef.current.length > 0) {
        const nextEvent = eventQueueRef.current.shift()!;
        setEvents(prev => {
          const exists = prev.some(e => e.id === nextEvent.id);
          if (exists) return prev;
          const newEvents = [nextEvent, ...prev];
          return newEvents.slice(0, 50);
        });
      }
    }, THROTTLE_INTERVAL_MS);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (throttleIntervalRef.current) {
        clearInterval(throttleIntervalRef.current);
      }
    };
  }, []);

  return { isConnected, kpis, events };
}
