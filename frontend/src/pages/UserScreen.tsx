import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, SOCKET_BASE } from "../Components/constants";
import axios from "axios";
import { SocketMessageTypes } from "../Components/constants/sockets";
import { JoinSocketMessage, SocketMessage } from "../types";
import "./../styles/userScreen.css";
import { Timer } from "../Components/timer";

export function UserScreen() {
    const socket = useRef<WebSocket | null>();
    const { roomId } = useParams();
    const [joinedRoomBackend, setJoinedRoomBackend] = useState(false);
    const [joinedRoom, setJoinedRoom] = useState(false);
    const [nickname, setNickname] = useState("");
    const [gender, setGender] = useState("");
    const [clickedButton, setClickedButton] = useState(-1);
    const userId = useRef<string>("");
    const [sessionUnderway, setSessionUnderway] = useState(false);
    const [match, setMatch] = useState("");
    const [matchingOver, setMatchingOver] = useState(false);

    const validate = () => {
        return gender == "" || nickname == "";
    };

    const signUp = async () => {
        try {
            if (validate()) {
                alert("Fill the form completely!");
                return;
            }
            const request = await axios.post(`${API_BASE}/auth/signup`, {
                nickname: nickname,
                host: false,
                gender: gender,
            });
            if (request.status != 200) {
                console.log("Error joining room -> ", request);
                alert("An error occured!");
                return;
            }
            const data = request.data.data;
            console.log("the _id ->", data._id);
            userId.current = data._id;
            console.log("Response ->", request);
        } catch (e: any) {
            console.log("There was an error signing user up -> ", e);
            alert("An unexpected error occured");
        }
    };

    const joinRoom = async () => {
        try {
            const request = await axios.post(`${API_BASE}/room/join/${roomId}`);
            if (request.status != 200) {
                //need to do better error management here
                console.log("Error joining room -> ", request);
                alert("An error occured!");
                return;
            }
            setJoinedRoomBackend(true);
        } catch (e: any) {
            console.log("Error creating room");
            alert("An unexpected error occured. Refresh the page to retry");
        }
    };

    useEffect(() => {
        //check if a user is in the room already
        //need an endpoint for this
    }, []);

    useEffect(() => {
        socket.current = new WebSocket(SOCKET_BASE);
        socket.current.addEventListener("open", () => {
            console.log("User socket connection created");
        });

        socket.current.onclose = () => {
            console.log("Connection Closed");
        };

        socket.current.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            console.log("Socket message -> ", data);

            const { type } = data;
            if (type == SocketMessageTypes.JOINED) {
                alert("Joined Successfully!");
                setJoinedRoom(true);
                //what happens when people refresh?
            } else if (type == SocketMessageTypes.MATCHED) {
                setSessionUnderway(true);
                const { user1, user2 } = data;
                console.log("userId -> ", userId);
                console.log("user1 -> ", user1);
                console.log("user2 -> ", user2);
                if (user2) setMatch(user1._id === userId.current ? user2.nickname : user1.nickname);
            } else if (type == SocketMessageTypes.MATCH_DONE) {
                setSessionUnderway(true);
            } else if (type == SocketMessageTypes.MATCHING_OVER) setMatchingOver(true);
        });
    }, []);

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
            socket.current!.send(JSON.stringify(message));
        }
    }, [joinedRoomBackend, userId.current]);

    const submitFormJoinRoom = async () => {
        await signUp();
        await joinRoom();
    };

    return (
        <div className="main">
            {!joinedRoom ? (
                <>
                    <div className="formDiv">
                        <h1>Enter your nickname!</h1>
                        <input onChange={(e) => setNickname(e.target.value)} />
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
                    <button onClick={submitFormJoinRoom}>Join!</button>
                </>
            ) : sessionUnderway ? (
                <div className="sessionDiv">
                    <h1>
                        {" "}
                        {match != ""
                            ? `Your match is ${match}!`
                            : "Due to an inbalance in numbers. You have not been matched. Better luck next round"}{" "}
                    </h1>
                    <Timer socket={socket.current!} time={0} />
                </div>
            ) : matchingOver ? (
                <div>
                    <h1>Matching over!</h1>
                </div>
            ) : (
                <h1>Waiting for the host to begin matching!</h1>
            )}
        </div>
    );
}
