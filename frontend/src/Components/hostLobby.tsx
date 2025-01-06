import { EventHandler, MouseEventHandler, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "./constants";
import "./../styles/lobby.css";
import { SOCKET_BASE } from "./constants";
import { SocketMessageTypes } from "./constants/sockets";
import { Timer } from "./timer";
import { RoomCreationInfo, RoomInfo, RoomSocketMessage } from "../types";

axios.defaults.withCredentials = true;
export function HostLobby() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const [createRoomInfo, setCreateRoomInfo] = useState<RoomCreationInfo>({
        matchSetting: "RANDOM",
        conversationTime: 60,
        genderMatching: false,
    });
    const round = useRef<number>(0);
    const roomInfo = useRef<RoomInfo>();
    const socket = useRef<WebSocket | null>();
    const maxMatches = useRef(0);
    const [sessionStart, setSessionStart] = useState(false);

    const getMatches = async (roomInfo: RoomInfo) => {
        try {
            const res = await axios.post(`${API_BASE}/room/match`, {
                ...roomInfo,
            });

            if (res.status != 200) {
                setError(true);
                console.log(`Error generating matches -> ${res}`);
                return;
            }

            const response = res.data.data;
            maxMatches.current = response.length;
            console.log({ response });
            localStorage.setItem("matches", JSON.stringify(response));
            return response;
        } catch (e) {
            console.error({ e });
        }
    };

    const SendMatches = async (roomId: string) => {
        try {
            const matches = JSON.parse(localStorage.getItem("matches")!);
            const matchesForRound = matches![round.current];
            console.log("matches for round -> ", matchesForRound);

            for (const match of matchesForRound) {
                const matchMessage = {
                    type: SocketMessageTypes.MATCH,
                    roomId,
                    user1: match.user1,
                    user2: match.user2 ? match.user2 : undefined,
                };
                socket.current?.send(JSON.stringify(matchMessage));
            }
            const matchDoneMessage = {
                type: SocketMessageTypes.MATCH_DONE,
                roomId,
            };
            const timerMessage = {
                type: SocketMessageTypes.TIMER_START,
                roomId,
                duration: 30, //for test purposes
            };
            socket.current?.send(JSON.stringify(matchDoneMessage));
            socket.current?.send(JSON.stringify(timerMessage));
            console.log(`Matches for round ${round} sent`);
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

        socket.current.onclose = () => {
            console.log("Connection Closed");
        };

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
                        console.log("Here");
                        if (round.current < maxMatches.current - 1) {
                            console.log("More matches");
                            //indexing from 0 to max - 1
                            round.current += 1;
                            SendMatches(roomInfo.current!.roomId).catch(console.error);
                            setSessionStart(true);

                            console.log("Auto rematching");
                        } else {
                            setSessionStart(false);
                            console.log("No more matches");
                            const message: RoomSocketMessage = {
                                roomId: roomInfo.current!.roomId,
                                type: SocketMessageTypes.MATCHING_OVER,
                            };
                            socket.current!.send(JSON.stringify(message));
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
        if (roomInfo.current) console.log(`Room id: ${roomInfo.current.roomId}`);
    }, [roomInfo.current]);

    const handleMatch: MouseEventHandler = async (e) => {
        e.preventDefault();
        if (users.length === 0) return;
        await getMatches(roomInfo.current!);
        SendMatches(roomInfo.current!.roomId!);
        setSessionStart(true);
    };

    const createRoom = async () => {
        try {
            const request = await axios.post(`${API_BASE}/room`, {
                ...createRoomInfo,
            });

            if (request.status != 201) {
                setError(true);
                console.log("Error creating room -> ", request);
                return;
            }

            const data = request.data.data.room;
            console.log("Create room response -> ", data);
            const { qrCodeUrl, _id, matchSetting, genderMatching } = data;
            roomInfo.current = {
                roomId: _id,
                matchSetting,
                genderMatching,
            };

            setQrCodeUrl(qrCodeUrl);
            socket.current!.send(
                JSON.stringify({
                    type: SocketMessageTypes.HOST,
                    roomId: _id,
                }),
            );
        } catch (e) {
            setError(true);
            console.log("Error creating room");
            console.log({ RoomCreationError: e });
            alert("An unexpected error occured. Refresh the page to retry");
        }
    };
    return (
        <div className="main">
            {!sessionStart ? (
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
            ) : (
                <>
                    <Timer socket={socket.current!} time={0} />
                </>
            )}
        </div>
    );
}
