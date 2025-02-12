import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import type {
    BaseSocketMessage,
    JoinSocketMessage,
    MatchDoneMessage,
    MatchSocketMessage,
    RoomSocketMessage,
    TickSocketMessage,
    TimerDoneMessage,
    TimerExtendMessage,
    TimerStartMessage,
} from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";
import { SocketService } from "../services/SocketService.js";
import { customLogger } from "../logger.js";
import { prettyPrint } from "../utils.js";
import { WSContext } from "hono/ws";
import { RoomService } from "../services/RoomService.js";

const ws = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: ws });

//map from the roomId to all the room sockets for that room
// const roomToUsersMap = new Map<string, (string | WSContext<unknown>)[]>();
const roomToUsersMap = new Map<string, Map<string, WSContext>>();
//roomId -> (userId->socket)

//map from the roomId to the host socket
const roomToHostmap = new Map<string, WSContext>();

const roomToTimerMap = new Map<string, [number, number, NodeJS.Timeout | undefined]>();
// roomId -> [ timeLeft, wantToExtend, timerObj ]

const socketToUserMap = new Map<WSContext, string>();
// userId -> userSocket

const userToRoomMap = new Map<string, string>();
// userId -> roomId

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
                            //this is for when someone joins
                            //we send the updated list of users in the room to the host
                            // and add them to the roomToUsersMap with their socket
                            const { roomId, userId } = message as JoinSocketMessage;
                            socketToUserMap.set(socket, userId);
                            SocketService.handleJoinRoom(
                                roomId!,
                                userId!,
                                roomToHostmap,
                                roomToUsersMap,
                                userToRoomMap,
                                socket,
                            );
                        }
                        break;
                    case MessageTypes.MATCH:
                        {
                            const { roomId, user1, user2 } = message as MatchSocketMessage;
                            SocketService.handleRoomMatch(roomId, roomToUsersMap, user1, user2);
                        }
                        break;

                    case MessageTypes.MATCH_DONE:
                        {
                            const { roomId } = message as RoomSocketMessage;
                            SocketService.broadcastMessage(roomId, roomToUsersMap, MessageTypes.MATCH_DONE);
                        }
                        break;

                    case MessageTypes.MATCHING_OVER:
                        {
                            const { roomId } = message as RoomSocketMessage;
                            SocketService.broadcastMessage(roomId, roomToUsersMap, MessageTypes.MATCHING_OVER);
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
                    case MessageTypes.TIMER_START:
                        {
                            const { roomId, duration } = message as TimerStartMessage;
                            SocketService.handleTimerStart(
                                roomId,
                                duration,
                                roomToHostmap,
                                roomToTimerMap,
                                roomToUsersMap,
                            );
                            customLogger(`Timer for ${roomId} started with duration ${duration}s`);
                        }
                        break;
                    case MessageTypes.TICK:
                        {
                            const { roomId, timeLeft } = message as TickSocketMessage;
                            customLogger(`Room ${roomId} time left: ${timeLeft}`);
                        }
                        break;
                    case MessageTypes.TIMER_EXTEND:
                        {
                            const { roomId } = message as TimerExtendMessage;
                            customLogger(`A person wants to extend the time for room ${roomId}`);
                            // Only gets called when some clicks the extend button, thus only gets checked then too
                            // I think it makes sense
                            SocketService.handleTimerExtend(roomId, roomToHostmap, roomToUsersMap, roomToTimerMap);
                        }
                        break;
                    case MessageTypes.TIMER_DONE: // FIX: TIMER_DONE from handleTimerStart is not actually hitting this
                        {
                            const { roomId } = message as TimerDoneMessage;
                            const timer = roomToTimerMap.get(roomId)![1];
                            if (!timer) customLogger(`Failed to clear timer for room ${roomId}`);
                            else {
                                customLogger(`Finished timer ${roomId}`);
                                clearInterval(timer);
                            }
                            roomToTimerMap.delete(roomId);
                        }
                        break;
                }
            } catch (e) {
                customLogger(`Error on message -> ${e}`);
            }
        },
        onClose: (event, sock) => {
            SocketService.handleLeaveRoom(sock, roomToHostmap, roomToUsersMap, userToRoomMap, socketToUserMap);
            console.log("Connection closed");
        },
    })),
);

export { ws, injectWebSocket };
