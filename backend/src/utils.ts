import type { PromiseReturn, ServiceReturn, SignupUser } from "./types.js";
import type { Context } from "hono";

export const sendData = <T>(data: T) => ({ data: data });

export const sendMsg = (msg: string) => sendData({ msg });

export const sendError = <T>(err: T) => ({ data: { err: err } });

export const sendSR = <T>(c: Context, res: ServiceReturn<T>) => c.json(sendData(res.data), res.status);

export const prettyPrint = <T>(log: T) => {
    return JSON.stringify(log, undefined, 4);
};
