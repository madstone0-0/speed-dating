/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StatusCode } from "hono/utils/http-status";

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
