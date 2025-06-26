import { useEffect, useRef, useState } from 'react';

interface UseWebSocketReturn {
  sendMessage: (message: string) => void;
  lastMessage: MessageEvent | null;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed';
}

export function useWebSocket(): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closing' | 'closed'>('connecting');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setConnectionStatus('open');
      };

      ws.current.onmessage = (event) => {
        setLastMessage(event);
      };

      ws.current.onclose = () => {
        setConnectionStatus('closed');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.current.onerror = () => {
        setConnectionStatus('closed');
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  };

  return {
    sendMessage,
    lastMessage,
    connectionStatus,
  };
}
