import type { StatusCode } from "hono/utils/http-status";
import type { PromiseReturn, ServiceReturn, SignupUser } from "./types.js";
import type { Context } from "hono";

export const sendData = <T>(data: T) => ({ data: data });

export const sendMsg = (msg: string) => sendData({ msg });

export const sendError = <T>(err: T) => ({ data: { err: err } });

export const sendSR = <T>(c: Context, res: ServiceReturn<T>) => c.json(sendData(res.data), res.status);

export const prettyPrint = <T>(log: T) => {
    return JSON.stringify(log, undefined, 4);
};

export class ServiceError extends Error {
    status: number & StatusCode;

    constructor(message: string, status: number & StatusCode) {
        super(message);
        this.name = "ServiceError";
        this.status = status;
    }
}

export const resolveError = (error: unknown) => {
    if (error instanceof Error) {
        return new ServiceError(error.message, 500);
    } else if (error instanceof ServiceError) {
        return error;
    }

    console.error(`Unknown error: ${error as string}`);
    return new ServiceError("Unknown error", 500);
};
export const handleServerError = (error: unknown, message: string): ServiceReturn => {
    const err = resolveError(error);
    console.error(`${message} error: ${err.stack}`);
    return { status: err.status, data: { err: err.message } };
};

export const rng = (max: number, min: number = 0) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
