import { Hono } from "hono";
import { RoomController } from "../controllers/roomControllers.js";
import { AuthMiddleware } from "../middleware/authMiddleware.js";

const room = new Hono();

room.post('/', AuthMiddleware.requireUser, RoomController.createRoom)

export default room;
