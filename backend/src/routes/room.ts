import { Hono } from "hono";
import { RoomController } from "../controllers/roomControllers.js";

const room = new Hono();

room.post('/', RoomController.createRoom)

export default room;
