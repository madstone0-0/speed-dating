import { useEffect, useState } from "react";
import { SocketMessageTypes } from "./constants/sockets";
import "../styles/timer.css";

type timerProps = {
    socket: WebSocket;
    time: number;
};

export function Timer({ socket, time }: timerProps) {
    const [timeLeft, setTimeLeft] = useState(time);
    useEffect(() => {
        socket.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            const { type } = data;
            switch (type) {
                case SocketMessageTypes.TICK:
                    {
                        const { timeLeft } = data;
                        setTimeLeft(timeLeft);
                    }
                    break;
            }
        });
    }, []);

    const getMinutes = (time: number) => {
        return String(Math.floor(time / (1000 * 60)) % 60).padStart(2, "0");
    };

    const getSeconds = (time: number) => {
        return String(Math.floor(time / 1000) % 60).padStart(2, "0");
    };
    return (
        <>
            <h1 className="text-5xl md:text-9xl" id="time">
                {getMinutes(timeLeft)} : {getSeconds(timeLeft)}
            </h1>
        </>
    );
}
