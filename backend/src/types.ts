/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StatusCode } from "hono/utils/http-status";
import Mongoose from "mongoose";
import { MessageTypes } from "./constants/socketMessage.js";
import type { WSContext } from "hono/ws";

export interface ServiceReturn<Data = any> {
    status: number & StatusCode;
    message?: string;
    data?: Data;
    extra?: any;
}

export interface SignupUser {
    nickname: string;
    gender?: string;
    host?: boolean;
}

export type PromiseReturn<Data = any> = Promise<ServiceReturn<Data>>;

export interface Identified {
    _id?: Mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface User extends Identified {
    nickname: string;
    gender: string;
    host: boolean;
}

export interface Room extends Identified {
    users: Mongoose.Types.ObjectId[];
    hostId: string | Mongoose.Types.ObjectId;
    conversationTime: number; //this is in seconds
    matchSetting: string;
    genderMatching: boolean;
    qrCodeUrl?: string;
}

export interface Question extends Identified {
    text: string;
    options: string[];
}

export interface Answer extends Identified {
    userId: string | Mongoose.Types.ObjectId;
    questionId: string | Mongoose.Types.ObjectId;
    index: number; //index of the answer chosen
}

export interface BaseSocketMessage {
    type: MessageTypes;
}

export type RoomSocketMessage = BaseSocketMessage & {
    roomId: string;
};

export type MatchSocketMessage = RoomSocketMessage & {
    user1: User;
    user2?: User;
};

export type JoinSocketMessage = RoomSocketMessage & {
    userId: string;
};

export type TimerStartMessage = RoomSocketMessage & {
    duration: number;
};

export type TickSocketMessage = RoomSocketMessage & {
    timeLeft: number;
};

export type TimerDoneMessage = RoomSocketMessage & {
    type: MessageTypes.TIMER_DONE;
};

export type TimerExtendMessage = RoomSocketMessage & {
    type: MessageTypes.TIMER_EXTEND;
};

export type TimerExtendedMesessage = RoomSocketMessage & {
    type: MessageTypes.EXTENDED;
};

export type MatchDoneMessage = RoomSocketMessage & {
    type: MessageTypes.MATCH_DONE;
};

export interface SocketMessage {
    type: MessageTypes;
    roomId: string;
    users?: string[]; //just a list of users in a room
}

export type RoomMatch = { user1: User; user2: User | null }[][];
