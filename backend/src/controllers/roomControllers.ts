import type { Context, Hono } from "hono";

const createRoom = async(c: Context)=>{
    try{
        //create room
        //generate room qr code 
        //return them
    }catch(e){
        console.log('There was an error creating the room -> ', e);
        return c.json({
            message: 'There was an error'
        }, 500);
    }
}

export const RoomController = {
    createRoom
}
