import type { WSContext } from "hono/ws";
import { MessageTypes } from "../constants/socketMessage.js";
import type {
    MatchDoneMessage,
    MatchSocketMessage,
    RoomSocketMessage,
    SocketMessage,
    TickSocketMessage,
    TimerDoneMessage,
    User,
} from "../types.js";
import { RoomService } from "./RoomService.js";
import { UserService } from "./UserService.js";
import { custom } from "zod";
import { customLogger } from "../logger.js";
import { prettyPrint } from "../utils.js";

const handleJoinRoom = async (
    roomId: string,
    userId: string,
    roomToHostMap: Map<string, WSContext<unknown>>,
    roomToUsersMap: Map<string, Map<string, WSContext>>,
    userSocket: WSContext,
) => {
    const socket = roomToHostMap.get(roomId);
    if (!socket) return; //just do nothing

    // First add user to roomToUsersMap with their socket
    const roomUsers = roomToUsersMap.get(roomId) ?? new Map();
    roomUsers.set(userId, userSocket);
    roomToUsersMap.set(roomId, roomUsers);
    customLogger(`RoomToUsersMap: ${prettyPrint(Array.from(roomToUsersMap))}`);
    customLogger(`User: ${userId} added to room ${roomId}`);
    userSocket.send(
        JSON.stringify({
            type: MessageTypes.JOINED, //might need to change the names here. It's a bit confusing
        }),
    );

    // Then send joined message
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

const genMatchMsg = (roomId: string, user1: User, user2: User): MatchSocketMessage => {
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
            timeLeft: timeLeft * 1000, //working in miliseconds
        };
        socket.send(JSON.stringify(message)); //sending to the host
        for (const sock of sockets) {
            sock.send(JSON.stringify(message)); //sending to all other people in the room
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
    roomToUsersMap: Map<string, Map<string, WSContext>>,
    user1: User,
    user2?: User,
) => {
    const userSockets = roomToUsersMap.get(roomId);
    if (!userSockets) {
        customLogger(`User sockets ${userSockets}`);
        customLogger("Found no room sockets");
        return;
    }

    if (!user2) {
        customLogger("No matching done here due to unbalanced numbers. Moving on");
        return;
    }

    const user1Sock = userSockets.get(user1._id!.toString());
    const user2Sock = userSockets.get(user2!._id!.toString());
    const user1Msg = genMatchMsg(roomId, user1, user2);
    const user2Msg = genMatchMsg(roomId, user1, user2); //need things to be consistent. That's why I changed this

    customLogger(`Sending message to user1 ${user1}: ${prettyPrint(user1Msg)}`);
    customLogger(`Sending message to user2 ${user2}: ${prettyPrint(user2Msg)}`);
    user1Sock?.send(JSON.stringify(user1Msg));
    user2Sock?.send(JSON.stringify(user2Msg));
};

const broadcastMessage = (roomId: string, roomToUsersMap: Map<string, Map<string, WSContext>>, type: MessageTypes) => {
    const users = roomToUsersMap.get(roomId);
    if (!users) return;

    for (const userSocket of users.values()) {
        const message: RoomSocketMessage = {
            roomId,
            type,
        };
        userSocket.send(JSON.stringify(message));
    }
};

export const SocketService = {
    handleJoinRoom,
    handleRoomMatch,
    handleTimerStart,
    broadcastMessage,
};
