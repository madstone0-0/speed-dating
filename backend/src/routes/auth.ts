import { Hono } from "hono";
import { sendData, sendMsg, sendSR } from "../utils.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import AuthService from "../services/AuthService.js";
import type { SignupUser } from "../types.js";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";

const auth = new Hono();

auth.get("/info", (c) => c.json(sendMsg("Auth Route")));

const signupValidator = zValidator(
    "json",
    z.object({
        nickname: z.string(),
        host: z.boolean().optional(),
    }),
);

auth.post("/signup", signupValidator, async (c) => {
    try{
        const validated = c.req.valid("json");
        const res = await AuthService.SignUp(validated);
        const cookie = getCookie(c, "userId");
        //cookies because cookies are automatically sent with each request

        if (cookie) deleteCookie(c, "userId");

        setCookie(c, "userId", res.data!._id!.toString(), {
            maxAge: 7200, //expires after 2 hours
        });
        return sendSR(c, res);
    }catch(e: any){
        console.log('There was an error signing up -> ', e);
        return sendSR(c, {
            status: 500,
            message: 'There was an error signing up!'
        })
    }
});

export default auth;
