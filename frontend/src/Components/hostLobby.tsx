import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./constants";
import "./../styles/lobby.css";
import { SOCKET_BASE } from "./constants";

axios.defaults.withCredentials = true;
export function HostLobby() {
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const socket = new WebSocket(SOCKET_BASE);

    useEffect(() => {
        createRoom();
    }, []);

    useEffect(() => {
        socket.addEventListener("open", ()=>{
            console.log('Connection created!');
        });

        socket.addEventListener("message", () => {

        });

        return () => {
            socket.close();
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
            const { qrCodeUrl } = data;

            setQrCodeUrl(qrCodeUrl);
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
                        <h2>{u}</h2>
                    );
                })}
            </div>
        </div>
    );
}
