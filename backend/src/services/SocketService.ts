import type { WSContext } from "hono/ws";
import { MessageTypes } from "../constants/socketMessage.js";
import type { SocketMessage } from "../types.js";
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

const genMatchMsg = (user1: string, user2: string) => {
    return {
        type: "MATCHED",
        user1,
        user2,
    };
};

const handleRoomMatch = async (
    roomId: string,
    user1: string,
    user2: string,
    roomToUsersMap: Map<string, Map<string, WSContext>>,
    // roomToUsersMap: Map<string, (string | WSContext<unknown>)[]>,
) => {
    const userSockets = roomToUsersMap.get(roomId);
    if (!userSockets) {
        customLogger(`User sockets ${userSockets}`);
        customLogger("Found no room sockets");
        return;
    }
    const user1Sock = userSockets.get(user1);
    const user2Sock = userSockets.get(user2);
    const user1Msg = genMatchMsg(user1, user2);
    const user2Msg = genMatchMsg(user2, user1);

    customLogger(`Sending message to user1 ${user1}: ${prettyPrint(user1Msg)}`);
    customLogger(`Sending message to user2 ${user2}: ${prettyPrint(user2Msg)}`);
    user1Sock?.send(JSON.stringify(user1Msg));
    user2Sock?.send(JSON.stringify(user2Msg));
};

export const SocketService = {
    handleJoinRoomMessage,
    handleRoomMatch,
};
