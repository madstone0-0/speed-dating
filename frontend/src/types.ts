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

export type TimerExtendMessage = RoomSocketMessage & {
    type: SocketMessageTypes.TIMER_EXTEND;
};

export type RoomInfo = {
    roomId: string;
    matchSetting: string;
    genderMatching: boolean;
};

export type RoomCreationInfo = {
    matchSetting: string;
    conversationTime: number;
    genderMatching: boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IFetch {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    put: (url: string, data: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
}
