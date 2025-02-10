import React, { EventHandler, MouseEventHandler, useEffect, useRef, useState, SetStateAction, Dispatch } from "react";
import { API_BASE } from "./constants";
import "./../styles/lobby.css";
import { SOCKET_BASE } from "./constants";
import { SocketMessageTypes } from "./constants/sockets";
import { Timer } from "./timer";
import { RoomCreationInfo, RoomInfo, RoomSocketMessage } from "../types";
import { ratatosk } from "./utils/Fetch";
import { getSessionStore, removeSessionStore } from "./utils";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useWebSocketWithHeartbeat } from "./utils/hooks";

interface HostLobbyProps {
    setUserCreated: Dispatch<SetStateAction<boolean>>;
}

export function HostLobby({ setUserCreated }: HostLobbyProps) {
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
    const socket = useWebSocketWithHeartbeat();
    const maxMatches = useRef(0);
    const [sessionStart, setSessionStart] = useState(false);

    const getMatches = async (roomInfo: RoomInfo) => {
        try {
            const res = await ratatosk.post<any>(
                `${API_BASE}/room/match`,
                {
                    ...roomInfo,
                },
                {
                    headers: {
                        Authorization: getSessionStore("token"),
                    },
                },
            );

            if (res.status != 200) {
                setError(true);
                console.log(`Error generating matches -> ${res}`);
                return false;
            }

            const response = res.data.data;
            maxMatches.current = response.length;
            console.log({ response });
            sessionStorage.setItem("matches", JSON.stringify(response));
            return true;
        } catch (e) {
            if (e instanceof AxiosError && e.status && e.status === 498) {
                alert("Token has expired you will be redirected to the home page");
                removeSessionStore("token");
                setUserCreated(false);
            }
            console.error({ e });
            return false;
        }
    };

    const SendMatches = async (roomId: string) => {
        try {
            const matches = JSON.parse(sessionStorage.getItem("matches")!);
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
                duration: 60, //for test purposes
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
        socket.current?.addEventListener("message", (event) => {
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
    }, []);

    useEffect(() => {
        if (roomInfo.current) console.log(`Room id: ${roomInfo.current.roomId}`);
    }, [roomInfo.current]);

    const handleMatch: MouseEventHandler = async (e) => {
        e.preventDefault();
        if (users.length === 0) return;
        if (!(await getMatches(roomInfo.current!))) return;
        SendMatches(roomInfo.current!.roomId!);
        setSessionStart(true);
    };

    const createRoom = async () => {
        try {
            const request = await ratatosk.post<any>(
                `${API_BASE}/room`,
                {
                    ...createRoomInfo,
                },
                {
                    headers: {
                        Authorization: getSessionStore("token"),
                    },
                },
            );

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
            socket.current?.send(
                JSON.stringify({
                    type: SocketMessageTypes.HOST,
                    roomId: _id,
                }),
            );
        } catch (e) {
            setError(true);
            console.log("Error creating room");
            console.log({ RoomCreationError: e });
            if (e instanceof AxiosError && e.status && e.status === 498) {
                alert("Token has expired you will be redirected to the home page");
                removeSessionStore("token");
                setUserCreated(false);
                return;
            } else alert("An unexpected error occured. Refresh the page to retry");
        }
    };
    return (
        <>
            {!sessionStart ? (
                <>
                    <div className="flex flex-col justify-center items-center p-5 md:flex-row">
                        <h1 className="header"> Scan the QR code to join the room!</h1>
                        <div className="flex justify-center items-center m-10 w-[18.75rem] h-[18.75rem]">
                            {qrCodeUrl === "" ? (
                                <h1 className="text-center header">Loading...</h1>
                            ) : (
                                <img
                                    className="object-contain w-full h-full"
                                    src={qrCodeUrl}
                                    alt="QR Code"
                                    width="300"
                                    height="300"
                                />
                            )}
                        </div>
                    </div>
                    <div className="nameHolder">
                        {users.map((u) => {
                            return (
                                <h2 className="text-2xl font-medium" key={u}>
                                    {u}
                                </h2>
                            );
                        })}
                    </div>
                    <button className="m-2" onClick={handleMatch}>
                        Match
                    </button>
                </>
            ) : (
                <>
                    <Timer socket={socket.current!} time={0} />
                </>
            )}
        </>
    );
}
