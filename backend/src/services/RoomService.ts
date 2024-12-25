import { MatchSetting } from "../constants/matchSetting.js";
import { RoomModel } from "../models/room.schema.js";
import QRCode from 'qrcode';
import * as dotenv from 'dotenv';
import { CloudinaryService } from "./CloudinaryService.js";

dotenv.config();
const domain = process.env.DOMAIN! as string

const createRoom = async(hostId: string, conversationTime?: number,
    matchSetting?: string, genderMatching?: boolean)=>{
        const room = await RoomModel.create({
            users: [],
            hostId: hostId, 
            conversationTime: conversationTime,
            matchSetting: matchSetting, 
            genderMatching: genderMatching
        });

        const url = await generateRoomQRCode(room._id.toString());
        room.qrCodeUrl = url;
        room.save();

        return room;
    }

const generateRoomQRCode = async (roomId: string)=>{
    //generate roomQR code here
    const url = new URL(`/join/${roomId}`, domain);
    const qrcode = await QRCode.toDataURL(url.toString(), {width: 256});
    const qrCodeUrl = await CloudinaryService.uploadRoomQRCode(url.toString(), roomId);
    return qrCodeUrl;
}

export const RoomService = {
    createRoom,
    generateRoomQRCode
}
