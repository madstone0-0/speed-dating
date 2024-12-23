/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StatusCode } from "hono/utils/http-status";
import Mongoose from "mongoose";

export interface ServiceReturn<Data = any> {
    status: number & StatusCode;
    data: Data;
    extra?: any;
}

export interface SignupUser {
    email: string;
    password: string;
}

export type PromiseReturn<Data = any> = Promise<ServiceReturn<Data>>;

export interface Identified {
    _id?: Mongoose.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date
}

export interface User extends Identified {
    nickname: string, 
    token: string
}

export interface Room extends Identified {
    users: string[] | Mongoose.Types.ObjectId,
    hostId: string | Mongoose.Types.ObjectId,
    conversationTime: number //this is in seconds
    matchSetting: string,
    genderMatching: boolean
}

export interface Question extends Identified {
    text: string,
    options: string[]
}

export interface Answer extends Identified {
    userId: string | Mongoose.Types.ObjectId,
    questionId: string | Mongoose.Types.ObjectId,
    index: number //index of the answer chosen
}
