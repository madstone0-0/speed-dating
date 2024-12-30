import { EventHandler, MouseEventHandler, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "./constants";
import "./../styles/lobby.css";
import { SOCKET_BASE } from "./constants";
import { SocketMessageTypes } from "./constants/sockets";
import { Timer } from "./timer";

axios.defaults.withCredentials = true;
export function HostLobby() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const [numMatches, setNumMatches] = useState(0);
    const [roomId, setRoomId] = useState("");
    const socket = useRef<WebSocket | null>();
    const maxMatches = useRef(0);
    const [sessionStart, setSessionStart] = useState(false);

    const getAndSendMatches = async (roomId: string) => {
        try {
            const res = await axios.post(`${API_BASE}/room/match/${roomId}`);

            if (res.status != 200) {
                setError(true);
                console.log(`Error generating matches -> ${res}`);
                return;
            }

            const matches = res.data.data;
            console.log({ matches });
            for (const match of matches) {
                const matchMessage = {
                    type: SocketMessageTypes.MATCH,
                    roomId,
                    user1: match.user1._id,
                    user2: match.user2._id,
                };
                socket.current?.send(JSON.stringify(matchMessage));
            }
            const timerMessage = {
                type: SocketMessageTypes.TIMER_START,
                roomId,
                duration: 75,//for test purposes
            };
            socket.current?.send(JSON.stringify(timerMessage));
            return matches;
        } catch (e) {
            console.error({ e });
        }
    };

    useEffect(() => {
        createRoom();
    }, []);

    useEffect(() => {
        socket.current = new WebSocket(SOCKET_BASE);
        socket.current.addEventListener("open", () => {
            console.log("Connection created!");
        });

        socket.current.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            console.log("Socket message -> ", data);
            console.log(`Max Matches: ${maxMatches.current}`);

            const { type } = data;
            switch (type) {
                case SocketMessageTypes.JOINED:
                    {
                        const { users } = data;
                        maxMatches.current = Math.floor(users.length / 2);
                        setUsers(users);
                    }
                    break;
                case SocketMessageTypes.TIMER_DONE:
                    {
                        if (numMatches < maxMatches.current) {
                            getAndSendMatches(roomId).catch(console.error);
                            setNumMatches(numMatches + 1);
                            console.log("Auto rematching");
                        } else {
                            console.log("No more auto rematching");
                        }
                    }
                    break;
            }
        });

        return () => {
            socket.current?.close();
        };
    }, []);

    useEffect(() => {
        if (roomId) console.log(`Room id: ${roomId}`);
    }, [roomId]);

    const handleMatch: MouseEventHandler = async (e) => {
        e.preventDefault();
        if (users.length === 0) return;
        const matches = await getAndSendMatches(roomId);
        setNumMatches(numMatches + 1);
        setSessionStart(true);
    };

    const createRoom = async () => {
        try {
            const request = await axios.post(`${API_BASE}/room`);

            if (request.status != 201) {
                setError(true);
                console.log("Error creating room -> ", request);
                return;
            }

            const data = request.data.data.room;
            console.log("Create room response -> ", data);
            const { qrCodeUrl, _id } = data;
            setRoomId(_id);

            setQrCodeUrl(qrCodeUrl);
            socket.current!.send(
                JSON.stringify({
                    type: SocketMessageTypes.HOST,
                    roomId: _id,
                }),
            );
        } catch (e: any) {
            setError(true);
            console.log("Error creating room");
            console.log({ RoomCreationError: e });
            alert("An unexpected error occured. Refresh the page to retry");
        }
    };
    return (
        <div className="main">
        {!sessionStart ?
            (
                <>
                    <div className="qrHolder">
                        <h1> Scan the QR code to join the room!</h1>
                        {qrCodeUrl == "" ? <h1>Loading...</h1> : <img src={qrCodeUrl} />}
                    </div>
                    <div className="nameHolder">
                        {users.map((u) => {
                        return <h2 key={u}>{u}</h2>;
                        })}
                    </div>
                    
                    <button onClick={handleMatch}>Match</button>
                </>
                )
            :
            (
                <>
                <Timer socket={socket.current!} time={157000} />
                </>
            )}
        </div>
    );
}
