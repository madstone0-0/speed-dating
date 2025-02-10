import { useEffect, useRef } from "react";
import { PING_INTERVAL, SOCKET_BASE } from "../constants";

const RECONNECT_DELAY = 5000;

export const useWebSocketWithHeartbeat = () => {
    const socket = useRef<WebSocket | null>(null);
    const pingInterval = useRef<NodeJS.Timeout>();

    useEffect(() => {
        socket.current = new WebSocket(SOCKET_BASE);

        const setupPing = () => {
            pingInterval.current = setInterval(() => {
                if (socket.current?.readyState == WebSocket.OPEN) socket.current.send(JSON.stringify({ type: "ping" }));
            }, PING_INTERVAL);
        };

        socket.current.onopen = () => {
            console.log("Connection created");
            setupPing();
        };

        socket.current.onclose = () => {
            console.log("Connection closed");
            if (pingInterval.current) clearInterval(pingInterval.current);

            // Attempt to reconnect
            setTimeout(() => {
                if (socket.current?.readyState == WebSocket.CLOSED) socket.current = new WebSocket(SOCKET_BASE);
            }, RECONNECT_DELAY);
        };

        return () => {
            if (pingInterval.current) clearInterval(pingInterval.current);
            socket.current?.close();
        };
    }, []);
    return socket;
};
