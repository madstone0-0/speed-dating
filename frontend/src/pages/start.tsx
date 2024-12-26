import { useState } from 'react';
import './../styles/start.css'
import axios from 'axios';
import { API_BASE } from '../App';
import { HostLobby } from '../Components/hostLobby';

export function Start(){
    const [loading, setLoading] = useState(false);
    const [userCreated, setUserCreated] = useState(false);

    const signUpAsHost = async()=>{
        try{
            setLoading(true);
            const request = await axios.post(`${API_BASE}/auth/signup`, {
                nickname: 'host',
                host: true
            });
            if(request.status == 200) setUserCreated(true);

            console.log('Error response ->', request);
            setLoading(false);
        }catch(e: any){
            console.log('There was an error signing user up -> ', e);
            alert('An unexpected error occured');
            setLoading(false);
        }
    }


    
    return (
        
        <div className='main'>
            {loading?
                <h1>Loading...</h1>
            :
            userCreated?
                (
                    <>
                    <HostLobby/>
                    </>
                )
            :
            (
                <>
                    <h1>Create a speed dating session </h1>
                    <button onClick={signUpAsHost}>Let's start!</button>
                </>
            )
            }
            
        </div>
    );
}