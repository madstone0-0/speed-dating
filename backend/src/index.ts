import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HEALTH_TEXT } from "./constants/constants.js";
import { sendMsg } from "./utils.js";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { customLogger } from "./logger.js";
import { ws, injectWebSocket } from "./routes/ws.js";
import auth from "./routes/auth.js";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import room from "./routes/room.js";


dotenv.config();

const mongoUri = process.env.MONGO_URI as string;
mongoose
    .connect(mongoUri)
    .then(() => console.log("Connected boyyy!"))
    .catch((e) => console.log(`There was an error connecting to the db: ${e}`));

const app = new Hono();

app.use(
    cors({
        // origin: "*", // Allow all origins (not recommended for production)
        origin: [
            "http://localhost:5173",
            "http://localhost:8080",
            "https://speed-dating.surge.sh",
            "http://speed-dating.surge.sh",
            "http://172.16.11.35:5173",
        ],
        allowMethods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
        allowHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
        maxAge: 600, // Cache the preflight response for 600 seconds
        credentials: true,
    }),
);
app.use(logger(customLogger), compress());

app.get("/", (c) => c.json(sendMsg("Backend")));

app.get("/health", (c) => {
    customLogger("Balling");
    return c.json(sendMsg(HEALTH_TEXT), 200);
});

app.route("/auth", auth);
app.route("/", ws);
app.route("/room", room);

export const PORT = parseInt(process.env.PORT!);
console.log(`Server is running on http://localhost:${PORT}`);

const server = serve({
    fetch: app.fetch,
    port: PORT,
});
injectWebSocket(server);
