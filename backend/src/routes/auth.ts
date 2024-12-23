import { Hono } from "hono";
import { sendData, sendMsg, sendSR } from "../utils.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import AuthService from "../services/AuthService.js";

const auth = new Hono();

auth.get("/info", (c) => c.json(sendMsg("Auth Route")));

const signupValidator = zValidator(
    "json",
    z.object({
        email: z.string().email(),
        password: z.string(),
    }),
);

auth.post("/signup", signupValidator, async (c) => {
    const validated = c.req.valid("json");
    const res = await AuthService.SignUp(validated);
    return sendSR(c, res);
});

export default auth;
