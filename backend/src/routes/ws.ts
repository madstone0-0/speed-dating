import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type { SocketMessage } from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";
import { SocketService } from "../services/SocketService.js";
import { customLogger } from "../logger.js";
import { prettyJSON } from "hono/pretty-json";
import { prettyPrint } from "../utils.js";
import type { WSContext } from "hono/ws";

const ws = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: ws });

//map from the roomId to all the room sockets for that room
const roomToUsersMap = new Map<string, WebSocket[]>();

//map from the roomId to the host socket
const roomToHostmap = new Map<string, WSContext<unknown>>();

ws.get(
    "/ws",
    upgradeWebSocket((c) => ({
        onOpen(event, socket) {
            customLogger(`Connected`);
        },
        onMessage(event, socket) {
            console.log(`Message from client: ${event.data}`);

            try {
                const message = JSON.parse(event.data.toString());
                const { type, roomId, userId } = message;

                if (type == MessageTypes.JOIN_NOTIFICATION) SocketService.handleJoinRoomMessage(roomId!, userId!, roomToHostmap);
                if (type == MessageTypes.HOST){
                    roomToHostmap.set(roomId, socket);
                    socket.send(JSON.stringify({
                        message: 'Host socket set'
                    }));
                }
            } catch (e) {
                customLogger(`Error on message -> ${e}`);
            }
        },
        onClose: () => {
            console.log("Connection closed");
        },
    })),
);

export { ws, injectWebSocket };
