import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { SocketMessage } from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";

const ws = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: ws });

const roomToUsersMap = new Map<string, WebSocket[]>();
//map from the roomId to all the room sockets for that room

const roomToHostmap = new Map<string, WebSocket>();
//map from the roomId to the host socket


ws.get(
    "/ws",
    upgradeWebSocket((c) => ({
        onMessage(event, socket) {
            console.log(`Message from client: ${event.data}`);
            
            const message = JSON.parse(event.data.toString());
            const { type } = message;
            
            if(type == MessageTypes.JOIN){
                
            }
        
        },
        onClose: () => {
            console.log("Connection closed");
        },
    })),
);

export { ws, injectWebSocket };
