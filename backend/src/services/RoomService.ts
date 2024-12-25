import { MatchSetting } from "../constants/matchSetting.js";
import { RoomModel } from "../models/room.schema.js";

const createRoom = async(hostId: string, conversationTime?: number,
    matchSetting?: string, genderMatching?: boolean)=>{
        const room = await RoomModel.create({
            users: [],
            hostId: hostId, 
            conversationTime: conversationTime,
            matchSetting: matchSetting, 
            genderMatching: genderMatching
        });

        return room;
    }

const generateRoomQRCode = async (roomId: string)=>{
    //generate roomQR code here
}

export const RoomService = {
    createRoom,
    generateRoomQRCode
}
