import type { Context, Hono } from "hono";
import { RoomService } from "../services/RoomService.js";
import { sendSR } from "../utils.js";

const createRoom = async (c: Context) => {
    try {
        const userId = c.get("userId");
        const room = await RoomService.createRoom(userId!);
        return sendSR(c, {
            status: 201,
            data: room,
        });
    } catch (e) {
        console.log("There was an error creating the room -> ", e);
        return c.json(
            {
                message: "There was an error",
            },
            500,
        );
    }
};

const joinRoom = async (c: Context)=>{
    try{
        const userId = c.get("userId");
        const { roomId } = c.req.param();

        await RoomService.joinRoom(userId, roomId);
        return sendSR(c, {
            status: 200
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
}

export const RoomController = {
    createRoom,
    joinRoom
};
