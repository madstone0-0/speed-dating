import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, SOCKET_BASE } from "../Components/constants";
import axios from 'axios';
import { SocketMessageTypes } from "../Components/constants/sockets";
import { SocketMessage } from "../types";
import './../styles/userScreen.css';

export function UserScreen(){
    const socket = useRef<WebSocket | null>();
    const { roomId } = useParams();
    const [joinedRoomBackend, setJoinedRoomBackend] = useState(false)
    const [joinedRoom, setJoinedRoom] = useState(false);
    const [nickname, setNickname] = useState('');
    const [gender, setGender] = useState('');
    const [clickedButton, setClickedButton] = useState(-1);

    const validate = ()=>{
        return gender == '' || nickname == '';
    }

    const signUp = async ()=>{
        try {
            if(validate()){
                alert('Fill the form completely!');
                return;
            }
            const request = await axios.post(`${API_BASE}/auth/signup`, {
                nickname: nickname,
                host: false,
                gender: gender
            });
            if (request.status != 200){
                console.log('Error joining room -> ', request);
                alert('An error occured!');
                return;
            }

            console.log("Response ->", request);
        } catch (e: any) {
            console.log("There was an error signing user up -> ", e);
            alert("An unexpected error occured");
        }
    }

    const joinRoom = async ()=>{
        try{
            const request  = await axios.post(`${API_BASE}/room/${roomId}`);
            if(request.status!= 200){
                //need to do better error management here 
                console.log('Error joining room -> ', request);
                alert('An error occured!');
                return;
            }

            setJoinedRoomBackend(true);

        }catch (e: any) {
            console.log("Error creating room");
            alert("An unexpected error occured. Refresh the page to retry");
        }
    }

    useEffect(()=>{
        
        //check if a user is in the room already
        //need an endpoint for this
    }, []);

    useEffect(()=>{
        socket.current = new WebSocket(SOCKET_BASE);
        socket.current.addEventListener('open', ()=>{
            console.log('User socket connection created');
        });

        socket.current.addEventListener('message', (event)=>{
            const data = JSON.parse(event.data);
            console.log('Socket message -> ', data);

            const { type } = data;
            if(type == SocketMessageTypes.JOINED){
                alert('Joined Successfully!');
                setJoinedRoom(true);
                //what happens when people refresh?
            }
        });
    }, []);

    useEffect(()=>{
        //if the user has joined the room on the backend
        //we can send the socket joining message
        if(joinedRoomBackend){
            const message: SocketMessage = {
                type: SocketMessageTypes.JOIN_NOTIFICATION,
                roomId: roomId!,
            };
            socket.current!.send(JSON.stringify(message));
        }
            
    }, [joinedRoomBackend]);


    const submitFormJoinRoom = async()=>{
        await signUp();
        await joinRoom();
    }

    return (
        <>
            {!joinedRoom ? (
                <div className="main">
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
                </div>
            ) : (
               <div></div> 
            )}
        </>
    );
    
}