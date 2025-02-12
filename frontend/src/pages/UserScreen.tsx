import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, SOCKET_BASE } from "../Components/constants";
import { SocketMessageTypes } from "../Components/constants/sockets";
import { JoinSocketMessage, SocketMessage, TimerExtendMessage } from "../types";
import "./../styles/userScreen.css";
import { Timer } from "../Components/timer";
import { ratatosk } from "../Components/utils/Fetch";
import { getSessionStore, removeSessionStore, setSessionStore } from "../Components/utils";
import { AxiosError } from "axios";
import { SuggestedTopics } from "../Components/suggestedTopics";
import { useWebSocketWithHeartbeat } from "../Components/utils/hooks";

export function UserScreen() {
    const socket = useWebSocketWithHeartbeat();
    const { roomId } = useParams();
    const [joinedRoomBackend, setJoinedRoomBackend] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [clickedButton, setClickedButton] = useState(-1);
    const userId = useRef<string>("");
    const [sessionUnderway, setSessionUnderway] = useState(false);
    const [match, setMatch] = useState("");
    const [matchingOver, setMatchingOver] = useState(false);
    const [sentExtend, setSentExtend] = useState(false);

    const validate = () => {
        return gender == "" || nickname == "";
    };

    const signUp = async () => {
        try {
            if (validate()) {
                alert("Fill the form completely!");
                return;
            }
            const request = await ratatosk.post<any>(`${API_BASE}/auth/signup`, {
                nickname: nickname,
                host: false,
                gender: gender,
            });

            if (request.status != 200) {
                console.log("Error joining room -> ", request);
                alert("An error occured!");
                setLoading(false);
                return;
            }

            const data = request.data.data;
            const token = request.data.extra.token;
            setSessionStore("token", token);
            console.log("the _id ->", data._id);
            userId.current = data._id;
            console.log("Response ->", request);
            setLoading(false);
        } catch (e: any) {
            console.log("There was an error signing user up -> ", e);
            alert("An unexpected error occured");
            setLoading(false);
        }
    };

    const joinRoom = async () => {
        try {
            const request = await ratatosk.post<any>(
                `${API_BASE}/room/join/${roomId}`,
                {},
                {
                    headers: {
                        Authorization: getSessionStore("token"),
                    },
                },
            );

            if (request.status != 200) {
                //need to do better error management here
                console.log("Error joining room -> ", request);
                alert("An error occured!");
                setLoading(false);
                return;
            }
            setLoading(false);
            setJoinedRoomBackend(true);
        } catch (e: any) {
            console.log("Error creating room");
            if (e instanceof AxiosError && e.status && e.status === 498) {
                // Send them back to the username page?
                // alert("Token has expired you will be redirected to the home page");
                removeSessionStore("token");
                return;
            } else alert("An unexpected error occured. Refresh the page to retry");
            setLoading(false);
        }
    };

    useEffect(() => {
        //check if a user is in the room already
        //need an endpoint for this
    }, []);

    useEffect(() => {
        socket.current?.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            console.log("Socket message -> ", data);

            const { type } = data;
            if (type == SocketMessageTypes.JOINED) {
                alert("Joined Successfully!");
                setJoinedRoom(true);
                //what happens when people refresh?
                // their socket is destroyed and they leave the room
            } else if (type == SocketMessageTypes.MATCHED) {
                setSentExtend(false);
                setSessionUnderway(true);
                const { user1, user2 } = data;
                console.log("userId -> ", userId);
                console.log("user1 -> ", user1);
                console.log("user2 -> ", user2);
                if (user2) setMatch(user1._id === userId.current ? user2.nickname : user1.nickname);
            } else if (type == SocketMessageTypes.MATCH_DONE) {
                setSentExtend(false);
                setSessionUnderway(true);
            } else if (type == SocketMessageTypes.MATCHING_OVER) {
                setMatchingOver(true);
                setSessionUnderway(false);
            }
        });
    }, []);

    const handleExtend = () => {
        if (sentExtend) return;
        if (socket.current) {
            const extendMessage: TimerExtendMessage = {
                type: SocketMessageTypes.TIMER_EXTEND,
                roomId: roomId!,
            };
            socket.current.send(JSON.stringify(extendMessage));
            setSentExtend(true);
        }
    };

    //TODO: fix the mess here
    useEffect(() => {
        //if the user has joined the room on the backend
        //we can send the socket joining message
        if (joinedRoomBackend && userId.current !== "") {
            const message: JoinSocketMessage = {
                type: SocketMessageTypes.JOIN_NOTIFICATION,
                userId: userId.current!,
                roomId: roomId!,
            };
            if (socket.current) socket.current.send(JSON.stringify(message));
            else console.log("Socket not initialized");
        }
    }, [joinedRoomBackend, userId.current]);

    const submitFormJoinRoom = async () => {
        setLoading(true);
        await signUp();
        await joinRoom();
    };

    return (
        <div className="main">
            {nickname && <h1 className="text-5xl text-center text-black/50 header">{nickname}</h1>}
            {!joinedRoom ? (
                <>
                    <div className="flex flex-col items-center m-2.5 space-y-1.5">
                        <h1 className="header">Enter your nickname!</h1>
                        <input className="input" onChange={(e) => setNickname(e.target.value)} />
                    </div>
                    <div className="buttonHolder">
                        <button
                            className={clickedButton === 0 ? "buttonClicked" : "button"}
                            onClick={() => {
                                setGender("MALE");
                                setClickedButton(0);
                            }}
                        >
                            Male
                        </button>

                        <button
                            className={clickedButton === 1 ? "buttonClicked" : "button"}
                            onClick={() => {
                                setGender("FEMALE");
                                setClickedButton(1);
                            }}
                        >
                            Female
                        </button>
                    </div>
                    <button disabled={loading} onClick={submitFormJoinRoom}>
                        Join!
                    </button>
                </>
            ) : sessionUnderway ? (
                <div className="sessionDiv">
                    <h1 className="md:text-2xl header">
                        {match != ""
                            ? `Your match is ${match}!`
                            : "Due to an inbalance in numbers. You have not been matched. Better luck next round"}{" "}
                    </h1>
                    <button
                        className="m-2"
                        disabled={sentExtend || match == "" || !sessionUnderway}
                        onClick={(e) => {
                            e.preventDefault();
                            handleExtend();
                        }}
                    >
                        Extend
                    </button>
                    {/* <Timer socket={socket.current!} time={0} /> */}
                    <SuggestedTopics />
                    {/* {socket.current && <Timer socket={socket.current} time={0} />} */}
                </div>
            ) : matchingOver ? (
                <div>
                    <h1 className="header">Matching over!</h1>
                </div>
            ) : (
                <h1 className="header">Waiting for the host to begin matching!</h1>
            )}
        </div>
    );
}
