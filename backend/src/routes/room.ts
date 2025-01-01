import { Hono } from "hono";
import { RoomController } from "../controllers/roomControllers.js";
import { AuthMiddleware } from "../middleware/authMiddleware.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { every } from "hono/combine";

const room = new Hono();

const createReqValdiator = zValidator(
    "json",
    z.object({
        matchSetting: z.string(),
        conversationTime: z.number().min(60).max(300),
        genderMatching: z.boolean(),
    }),
);

room.post("/", every(AuthMiddleware.requireUser, createReqValdiator), RoomController.createRoom);

room.post("/join/:roomId", AuthMiddleware.requireUser, RoomController.joinRoom);

const matchReqValidator = zValidator(
    "json",
    z.object({
        roomId: z.string(),
        matchSetting: z.string(),
        genderMatching: z.boolean(),
    }),
);

room.post("/match", every(AuthMiddleware.requireUser, matchReqValidator), RoomController.matchMembers);

export default room;
