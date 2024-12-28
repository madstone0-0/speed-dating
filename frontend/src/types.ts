import { SocketMessageTypes } from "./Components/constants/sockets";

export interface SocketMessage {
    type: string;
    roomId: string;
    users?: string[];
}

export interface BaseSocketMessage {
    type: SocketMessageTypes;
}

export type RoomSocketMessage = BaseSocketMessage & {
    roomId: string;
};

export type MatchSocketMessage = RoomSocketMessage & {
    user1: string;
    user2: string;
};

export type JoinSocketMessage = RoomSocketMessage & {
    userId: string;
};
