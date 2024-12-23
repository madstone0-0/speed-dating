import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";

const ws = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: ws });

ws.get(
    "/ws",
    upgradeWebSocket((c) => ({
        onMessage(event, ws) {
            console.log(`Message from client: ${event.data}`);
            ws.send(event.data.toString().toUpperCase());
        },
        onClose: () => {
            console.log("Connection closed");
        },
    })),
);

export { ws, injectWebSocket };
