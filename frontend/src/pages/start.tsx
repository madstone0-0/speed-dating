import { useState } from 'react';
import './../styles/start.css'
import axios from 'axios';

export function Start(){
    const [loading, setLoading] = useState(false);
    const signUpAsHost = async()=>{
        //
    }

    
    return (
        
        <div className='main'>
            {loading?
                <h1>Loading...</h1>
            :
            (
                <>
                    <h1>Create a speed dating session </h1>
                    <button>Let's start!</button>
                </>
            )
            }
            
        </div>
    );
}