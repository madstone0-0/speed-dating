import { MatchSetting } from "../constants/matchSetting.js";
import { RoomModel } from "../models/room.schema.js";
import QRCode from "qrcode";
import * as dotenv from "dotenv";
import { CloudinaryService } from "./CloudinaryService.js";
import { UserService } from "./UserService.js";
import mongoose from 'mongoose';
import { customLogger } from "../logger.js";
import { prettyPrint, rng } from "../utils.js";
import type { JoinSocketMessage } from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";
import { PORT } from "../index.js";
import mongoose from 'mongoose';

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
    const url = await generateRoomQRCode(room._id.toString());
    room.qrCodeUrl = url;
    room.save();

    // room.qrCodeUrl = "DUMMY";
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

const matchRoomMembers = async (roomId: string) => {
    const room = await getRoom(roomId);
    if (!room) return null;

    const members: string[] = [...room.users] as string[];
    const memberMap = new Map<string, string>();
    customLogger(`Members: ${prettyPrint(members)}`);

    // Shuffle using Fisher-Yates
    for (let i = members.length - 1; i >= 0; i--) {
        const j = rng(i);
        [members[i], members[j]] = [members[j], members[i]];
    }

    // Match consecutive pairs
    for (let i = 0; i < members.length; i += 2) {
        customLogger(`Matching ${members[i]} with ${members[i + 1]}`);
        memberMap.set(members[i], members[i + 1] ? members[i + 1] : "");
    }

    const mapArray = Array.from(memberMap);
    customLogger(`Matched members for room ${roomId}: ${prettyPrint(mapArray)}`);

    return mapArray;
};

const sendMatches = async (matches: [string, string][]) => {};

const joinRoom = async (userId: string, roomId: string) => {
    const room = await getRoom(roomId);

    room!.users.push(new mongoose.Types.ObjectId(userId));
    //TODO make sure the nickname is unique
    await room!.save();
    const sockMessage: JoinSocketMessage = {
        type: MessageTypes.JOINED,
        roomId,
        userId,
    };
    return room;
};

export const RoomService = {
    createRoom,
    generateRoomQRCode,
    getRoom,
    joinRoom,
    matchRoomMembers,
};
