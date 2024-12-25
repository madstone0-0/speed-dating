import { MessageTypes } from "../constants/socketMessage.js";
import type { SocketMessage } from "../types.js";
import { UserService } from "./UserService.js";

const handleJoinRoomMessage = async(roomId: string, userId: string,  roomToHostMap: Map<string, WebSocket>)=>{
    const socket = roomToHostMap.get(roomId);
    if(!socket) return; //just do nothing

    const user = await UserService.getUserById(userId);

    const message: SocketMessage = {
        type: MessageTypes.JOINED,
        roomId: roomId,
        userNickname: user!.nickname, 
        userId: userId
    };

    socket.send(JSON.stringify(message));
}