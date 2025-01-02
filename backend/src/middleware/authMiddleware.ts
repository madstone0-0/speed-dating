import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { prettyPrint, sendError, sendSR } from "../utils.js";
import { createMiddleware } from "hono/factory";

export const requireUser = createMiddleware(async (c, next) => {
    const cookie = getCookie(c, "userId");
    if (!cookie)
        return sendSR(c, {
            status: 403,
            ...sendError("Unauthorized"),
        });

    c.set("userId", cookie);
    await next();
});
