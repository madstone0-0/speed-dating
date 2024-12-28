import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "./constants";
import "./../styles/lobby.css";
import { SOCKET_BASE } from "./constants";
import { SocketMessageTypes } from "./constants/sockets";

axios.defaults.withCredentials = true;
export function HostLobby() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const socket = useRef<WebSocket | null>();

    useEffect(() => {
        createRoom();
    }, []);

    useEffect(() => {
        socket.current = new WebSocket(SOCKET_BASE);
        socket.current.addEventListener("open", ()=>{
            console.log('Connection created!');
        });

        socket.current.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            console.log('Socket message -> ', data);
            
            const { type, users } = data;
            if(type == SocketMessageTypes.JOINED) setUsers(users);
        });

        return () => {
            socket.current?.close();
        };
    }, []);

    const createRoom = async () => {
        try {
            const request = await axios.post(`${API_BASE}/room`);

            if (request.status != 201) {
                setError(true);
                console.log("Error creating room -> ", request);
                return;
            }

            const data = request.data.data;
            console.log('Create room response -> ', data);
            const { qrCodeUrl, _id } = data;

            setQrCodeUrl(qrCodeUrl);
            socket.current!.send(JSON.stringify(
                {
                    type: SocketMessageTypes.HOST,
                    roomId: _id
                }
            ));
        } catch (e: any) {
            setError(true);
            console.log("Error creating room");
            alert("An unexpected error occured. Refresh the page to retry");
        }
    };
    return (
        <div className="main">
            <div className="qrHolder">
                <h1> Scan the QR code to join the room!</h1>
                {qrCodeUrl == "" ? <h1>Loading...</h1> : <img src={qrCodeUrl} />}
            </div>
            <div className="nameHolder">
                {users.map((u)=>{
                    return (
                        <h2 key={u}>{u}</h2>
                    );
                })}
            </div>
        </div>
    );
}
