import type { WSContext } from "hono/ws";
import { MessageTypes } from "../constants/socketMessage.js";
import type { MatchSocketMessage, SocketMessage, TickSocketMessage, TimerDoneMessage } from "../types.js";
import { RoomService } from "./RoomService.js";
import { UserService } from "./UserService.js";
import { custom } from "zod";
import { customLogger } from "../logger.js";
import { prettyPrint } from "../utils.js";

const handleJoinRoomMessage = async (
    roomId: string,
    userId: string,
    roomToHostMap: Map<string, WSContext<unknown>>,
) => {
    const socket = roomToHostMap.get(roomId);
    if (!socket) return; //just do nothing

    const room = await RoomService.getRoom(roomId);
    if (!room) return;
    const users = await Promise.all(room!.users.map((uId) => UserService.getUserById(uId.toString())));
    const userNicknames = users.map((u) => u!.nickname);

    const message: SocketMessage = {
        type: MessageTypes.JOINED,
        roomId: roomId,
        users: userNicknames,
    };

    socket.send(JSON.stringify(message));
};

const genMatchMsg = (roomId: string, user1: string, user2: string): MatchSocketMessage => {
    return {
        roomId,
        type: MessageTypes.MATCHED,
        user1,
        user2,
    };
};

const handleTimerStart = async (
    roomId: string,
    duration: number,
    roomToHostMap: Map<string, WSContext<unknown>>,
    roomToTimerMap: Map<string, [number, NodeJS.Timeout | undefined]>,
    roomToUsersMap: Map<string, Map<string, WSContext>>,
) => {
    const socket = roomToHostMap.get(roomId);
    if (!socket) return;
    const memberSockets = roomToUsersMap.get(roomId);

    // Create a nullable timer object so we can store it in the map with the duration
    let timer: NodeJS.Timeout | undefined;
    roomToTimerMap.set(roomId, [duration, timer]);

    // Create a timer that decrements the duration every second until the duration is zero
    // sending tick messages to the host and every in the room each second
    timer = setInterval(() => {
        const sockets = memberSockets!.values()!;
        const timeLeft = roomToTimerMap.get(roomId)![0] - 1;
        const timerDone: TimerDoneMessage = {
            type: MessageTypes.TIMER_DONE,
            roomId,
        };
        const message: TickSocketMessage = {
            type: MessageTypes.TICK,
            roomId,
            timeLeft,
        };
        socket.send(JSON.stringify(message));
        for (const sock of sockets) {
            sock.send(JSON.stringify(message));
        }
        roomToTimerMap.set(roomId, [timeLeft, timer]);
        if (timeLeft === 0) {
            // HACK: For TIMER_DONE not hitting in main onMessage
            customLogger(`Hit zero`);
            socket.send(JSON.stringify(timerDone));
            for (const sock of sockets) {
                sock.send(JSON.stringify(timerDone));
            }
            roomToTimerMap.delete(roomId);
            clearInterval(timer);
            customLogger(`Finished timer ${roomId}`);
            return;
        }
    }, 1000);
};

const handleRoomMatch = async (
    roomId: string,
    user1: string,
    user2: string,
    roomToUsersMap: Map<string, Map<string, WSContext>>,
) => {
    const userSockets = roomToUsersMap.get(roomId);
    if (!userSockets) {
        customLogger(`User sockets ${userSockets}`);
        customLogger("Found no room sockets");
        return;
    }
    const user1Sock = userSockets.get(user1);
    const user2Sock = userSockets.get(user2);
    const user1Msg = genMatchMsg(roomId, user1, user2);
    const user2Msg = genMatchMsg(roomId, user2, user1);

    customLogger(`Sending message to user1 ${user1}: ${prettyPrint(user1Msg)}`);
    customLogger(`Sending message to user2 ${user2}: ${prettyPrint(user2Msg)}`);
    user1Sock?.send(JSON.stringify(user1Msg));
    user2Sock?.send(JSON.stringify(user2Msg));
};

export const SocketService = {
    handleJoinRoomMessage,
    handleRoomMatch,
    handleTimerStart,
};
