import { Hono } from "hono";
import { requireUser } from "../middleware/authMiddleware.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { RoomService } from "../services/RoomService.js";
import { prettyPrint, sendSR } from "../utils.js";
import { customLogger } from "../logger.js";

const room = new Hono();

const createReqValdiator = zValidator(
    "json",
    z.object({
        matchSetting: z.string(),
        conversationTime: z.number().min(60).max(300),
        genderMatching: z.boolean(),
    }),
);

room.use(requireUser);

room.post("/", createReqValdiator, async (c) => {
    try {
        const validated = c.req.valid("json");
        const { genderMatching, conversationTime, matchSetting } = validated;
        const userId = c.get('jwtPayload');
        const room = await RoomService.createRoom(userId!, conversationTime, matchSetting, genderMatching);
        return sendSR(c, room);
    } catch (e) {
        console.log("There was an error creating the room -> ", e);
        return c.json(
            {
                message: "There was an error",
            },
            500,
        );
    }
});

room.post("/join/:roomId", async (c) => {
    try {
        const userId = c.get('jwtPayload');
        const { roomId } = c.req.param();

        await RoomService.joinRoom(userId!, roomId);
        return sendSR(c, {
            status: 200,
        });
    } catch (e) {
        console.log("There was an error joining the room -> ", e);
        return c.json(
            {
                message: "There was an error",
            },
            500,
        );
    }
});

const matchReqValidator = zValidator(
    "json",
    z.object({
        roomId: z.string(),
        matchSetting: z.string(),
        genderMatching: z.boolean(),
    }),
);

room.post("/match", matchReqValidator, async (c) => {
    try {
        const validated = c.req.valid("json");
        customLogger(prettyPrint(validated));
        const { roomId, matchSetting, genderMatching } = validated;
        const sr = await RoomService.matchRoomMembers(roomId, matchSetting, genderMatching);
        return sendSR(c, sr);
    } catch (e) {
        console.log(`There was an error matching the members -> ${e}`);
        return c.json(
            {
                message: "There was an error",
            },
            500,
        );
    }
});

export default room;
