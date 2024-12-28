import { Hono } from "hono";
import { RoomController } from "../controllers/roomControllers.js";
import { AuthMiddleware } from "../middleware/authMiddleware.js";

const room = new Hono();

room.post("/", AuthMiddleware.requireUser, RoomController.createRoom);
room.post("/:roomId", AuthMiddleware.requireUser, RoomController.joinRoom);
room.post("/match/:roomId", AuthMiddleware.requireUser, RoomController.matchMembers);

export default room;
