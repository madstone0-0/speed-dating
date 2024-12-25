import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { sendSR } from "../utils.js";

const requireUser = async (c: Context, next: Next) => {
    const cookie = getCookie(c, "userId");
    if (!cookie)
        return sendSR(c, {
            status: 403,
            message: "Unauthorized!",
        });

    c.set("userId", cookie);
    await next();
};

export const AuthMiddleware = {
    requireUser,
};
