import { Hono } from "hono";
import { RoomController } from "../controllers/roomControllers.js";
import { AuthMiddleware } from "../middleware/authMiddleware.js";
import { cors } from "hono/cors";

const room = new Hono();

room.use('*', cors({
    origin: '*', // Allow all origins (not recommended for production)
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
    allowHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    maxAge: 600, // Cache the preflight response for 600 seconds
}));

room.post("/", AuthMiddleware.requireUser, RoomController.createRoom);
room.post("/:roomId", AuthMiddleware.requireUser, RoomController.joinRoom);

export default room;
