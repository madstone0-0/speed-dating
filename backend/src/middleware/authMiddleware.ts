import { prettyPrint, sendError, sendSR } from "../utils.js";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { customLogger } from "../logger.js";
import type { UnofficialStatusCode } from "hono/utils/http-status";

export const requireUser = createMiddleware(async (c, next) => {
    const token = c.req.header("Authorization");
    if (!token)
        return sendSR(c, {
            status: 403,
            ...sendError("Unauthorized"),
        });

    let decodedToken;
    try {
        decodedToken = await verify(token, process.env.SECRET!);
        customLogger(prettyPrint(decodedToken));
    } catch (err: any) {
        customLogger(err);
        return sendSR(c, {
            status: 498 as UnofficialStatusCode,
            ...sendError(err),
        });
    }

    c.set("jwtPayload", decodedToken.userId);
    await next();
});
