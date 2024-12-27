let API_BASE = "";
let SOCKET_BASE = "";

if (import.meta.env.PROD) {
    API_BASE = "https://speed-dating-f38da0073ab0.herokuapp.com";
    SOCKET_BASE = "wss://speed-dating-f38da0073ab0.herokuapp.com/ws";
} else if (import.meta.env.DEV) {
    API_BASE = "http://localhost:3000";
    SOCKET_BASE = "ws://localhost:3000/ws";
}

export { API_BASE, SOCKET_BASE };
