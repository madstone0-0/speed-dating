import { sendError, sendSR } from "../utils.js";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export const requireUser = createMiddleware(async (c, next) => {
    const token = c.req.header('Authorization');
    if (!token)
        return sendSR(c, {
            status: 403,
            ...sendError("Unauthorized"),
        });

    let decodedToken;
    try{
        decodedToken = await verify(token, process.env.SECRET!);
    }catch(err: any){
        return sendSR(c, {
            status: 403,
            ...sendError(err)
        });
    }

    c.set("jwtPayload", decodedToken.userId);
    await next();
});
