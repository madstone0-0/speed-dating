/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StatusCode } from "hono/utils/http-status";
import Mongoose from "mongoose";

export interface ServiceReturn<Data = any> {
    status: number & StatusCode;
    message?: string;
    data?: Data;
    extra?: any;
}

export interface SignupUser {
    nickname: string;
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
    host: boolean;
}

export interface Room extends Identified {
    users: User[];
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

export interface SocketMessage {
    type: string,
    roomId: string,
    userNickname?: string,
    userId?: string
}
