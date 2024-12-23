import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HEALTH_TEXT } from "./constants.js";
import { sendData, sendMsg } from "./utils.js";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { customLogger } from "./logger.js";
import auth from "./routes/auth.js";

const app = new Hono();
app.use(logger(customLogger), cors(), compress());

app.get("/", (c) => c.json(sendMsg("Backend")));

app.get("/health", (c) => {
    customLogger("Balling");
    return c.json(sendMsg(HEALTH_TEXT), 200);
});

app.route("/auth", auth);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port,
});
