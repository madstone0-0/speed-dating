import { useEffect, useState } from "react";
import axios from 'axios';
import { API_BASE } from "../App";
import './../styles/lobby.css';

export function HostLobby(){
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [error, setError] = useState(false);
    const [users, setUsers] = useState([]);
    const socket = new WebSocket('wss://speed-dating-f38da0073ab0.herokuapp.com/ws');

    useEffect(()=>{
        createRoom();
    }, []);

    useEffect(()=>{
        socket.addEventListener('message', ()=>{

        });


        return ()=>{
            socket.close();
        };
    }, []);

    const createRoom = async()=>{
        try{
            const request = await axios.post(`${API_BASE}/room`);

            if(request.status != 201){
                setError(true);
                console.log('Error creating room -> ', request);
                return;
            } 

            const data = request.data.data;
            const { qrCodeUrl } = data;

            setQrCodeUrl(qrCodeUrl);
        }catch(e: any){
            setError(true);
            console.log('Error creating room');
            alert('An unexpected error occured. Refresh the page to retry');
        }
    }
    return (
        <div className="main">

        </div>
    );
}