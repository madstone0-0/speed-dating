import type { WSContext } from "hono/ws";
import { MessageTypes } from "../constants/socketMessage.js";
import type { SocketMessage } from "../types.js";
import { RoomService } from "./RoomService.js";
import { UserService } from "./UserService.js";

const handleJoinRoomMessage = async (roomId: string, userId: string, roomToHostMap: Map<string, WSContext<unknown>>) => {
    const socket = roomToHostMap.get(roomId);
    if (!socket) return; //just do nothing

    const room = await RoomService.getRoom(roomId);
    if(!room) return;
    const users = await Promise.all(room!.users.map((uId)=> UserService.getUserById(uId.toString())));
    const userNicknames = users.map((u)=> u!.nickname);

    const message: SocketMessage = {
        type: MessageTypes.JOINED,
        roomId: roomId,
        users: userNicknames
    };

    socket.send(JSON.stringify(message));
};

export const SocketService = {
    handleJoinRoomMessage,
};
