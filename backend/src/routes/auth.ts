import { Hono } from "hono";
import { sendData, sendMsg, sendSR } from "../utils.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import AuthService from "../services/AuthService.js";
import { sign } from "hono/jwt";

const auth = new Hono();

auth.get("/info", (c) => c.json(sendMsg("Auth Route")));

const signupValidator = zValidator(
    "json",
    z.object({
        nickname: z.string(),
        gender: z.string().optional(),
        host: z.boolean().optional(),
    }),
);

auth.post("/signup", signupValidator, async (c) => {
    try {
        const validated = c.req.valid("json");
        const res = await AuthService.SignUp(validated);
        const payload = {
            userId: res.data!._id,
            exp: Math.floor(Date.now() / 1000) + 60 * 5, // Expiry time is not relative but absolute, set to 5 minutes
        };

        const secret = process.env.SECRET!;
        const token = await sign(payload, secret);
        res.extra = { token: token };

        return sendSR(c, res);
    } catch (e: any) {
        console.log("There was an error signing up -> ", e);
        return sendSR(c, {
            status: 500,
            message: "There was an error signing up!",
        });
    }
});

export default auth;
