import { MatchSetting } from "../constants/matchSetting.js";
import { RoomModel } from "../models/room.schema.js";
import QRCode from "qrcode";
import * as dotenv from "dotenv";
import { CloudinaryService } from "./CloudinaryService.js";
import { UserService } from "./UserService.js";

dotenv.config();
const domain = process.env.DOMAIN! as string;

const createRoom = async (
    hostId: string,
    conversationTime?: number,
    matchSetting?: string,
    genderMatching?: boolean,
) => {
    const room = await RoomModel.create({
        users: [],
        hostId: hostId,
        conversationTime: conversationTime,
        matchSetting: matchSetting,
        genderMatching: genderMatching,
    });

    // Temp
    // const url = await generateRoomQRCode(room._id.toString());
    // room.qrCodeUrl = url;
    // room.save();

    room.qrCodeUrl = "DUMMY";
    room.save();

    return room;
};

const generateRoomQRCode = async (roomId: string) => {
    //generate roomQR code here
    const url = new URL(`/join/${roomId}`, domain);
    const qrcode = await QRCode.toDataURL(url.toString(), { width: 256 });
    const qrCodeUrl = await CloudinaryService.uploadRoomQRCode(qrcode, roomId);
    return qrCodeUrl;
};

const getRoom = async (roomId: string) => {
    const room = await RoomModel.findOne({ _id: roomId });
    if (!room) return null;
    return room;
};

const joinRoom = async (userId: string, roomId: string) => {
    const room = await getRoom(roomId);
    const user = await UserService.getUserById(userId);

    if (!user) throw Error("User does not exist");
    room!.users.push(user);
    //TODO make sure the nickname is unique
    await room!.save();
    return room;
};

export const RoomService = {
    createRoom,
    generateRoomQRCode,
    getRoom,
    joinRoom,
};
