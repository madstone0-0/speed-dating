import type { MiddlewareHandler } from "hono";

export const httpLogger: MiddlewareHandler = async (c, next) => {
    console.log(`[${c.req.method}] ${c.req.url}`);
    await next();
};
export const customLogger = (message: string, ...rest: string[]) => {
    console.log(message, ...rest);
};
