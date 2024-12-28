import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type {
    BaseSocketMessage,
    JoinSocketMessage,
    MatchSocketMessage,
    RoomSocketMessage,
    RoomUserMap,
    SocketMessage,
} from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";
import { SocketService } from "../services/SocketService.js";
import { customLogger } from "../logger.js";
import { prettyPrint } from "../utils.js";
import { WSContext } from "hono/ws";

const ws = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: ws });

//map from the roomId to all the room sockets for that room
// const roomToUsersMap = new Map<string, (string | WSContext<unknown>)[]>();
const roomToUsersMap = new Map<string, Map<string, WSContext>>();

//map from the roomId to the host socket
const roomToHostmap = new Map<string, WSContext>();

ws.get(
    "/ws",
    upgradeWebSocket((c) => ({
        onOpen(event, socket) {
            customLogger(`Connected`);
        },
        onMessage(event, socket) {
            console.log(`Message from client: ${event.data}`);

            try {
                const message: BaseSocketMessage = JSON.parse(event.data.toString());
                const type = message.type;

                switch (type) {
                    case MessageTypes.JOIN_NOTIFICATION:
                        {
                            const { roomId, userId } = message as JoinSocketMessage;
                            SocketService.handleJoinRoomMessage(roomId!, userId!, roomToHostmap);
                        }
                        break;
                    case MessageTypes.MATCH:
                        {
                            const { roomId, user1, user2 } = message as MatchSocketMessage;
                            SocketService.handleRoomMatch(roomId, user1, user2, roomToUsersMap);
                        }
                        break;
                    case MessageTypes.HOST:
                        {
                            const { roomId } = message as RoomSocketMessage;
                            roomToHostmap.set(roomId, socket);
                            socket.send(
                                JSON.stringify({
                                    message: "Host socket set",
                                }),
                            );
                        }
                        break;
                    case MessageTypes.JOINED:
                        const { roomId, userId } = message as JoinSocketMessage;
                        if (roomToUsersMap.has(roomId)) {
                            const users = roomToUsersMap.get(roomId);
                            users!.set(userId, socket);
                        } else {
                            roomToUsersMap.set(roomId, new Map([[userId, socket]]));
                        }
                        customLogger(`User: ${userId} added to room ${roomId}`);
                        break;
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
