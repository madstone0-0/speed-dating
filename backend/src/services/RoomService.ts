import { MatchSetting } from "../constants/matchSetting.js";
import { RoomModel } from "../models/room.schema.js";
import QRCode from "qrcode";
import * as dotenv from "dotenv";
import { CloudinaryService } from "./CloudinaryService.js";
import { UserService } from "./UserService.js";
import mongoose from "mongoose";
import Mongoose from "mongoose";
import { customLogger } from "../logger.js";
import { handleServerError, prettyPrint, rng, sendError, ServiceError } from "../utils.js";
import type { JoinSocketMessage, PromiseReturn } from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";

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

const matchRoomMembers = async (
    roomId: string,
): PromiseReturn<[mongoose.Types.ObjectId, mongoose.Types.ObjectId][]> => {
    try {
        const room = await getRoom(roomId);
        if (!room) throw new ServiceError("Cannot find room", 404);

        const members = [...room.users];
        const memberMap = new Map<Mongoose.Types.ObjectId, Mongoose.Types.ObjectId>();
        customLogger(`Members: ${prettyPrint(members)}`);

        // Split into male and femail
        const users = await Promise.all(members.map((m) => UserService.getUserById(m._id.toString())));
        const male = users.filter((m) => m!.gender == "MALE").map((u) => u!._id);
        const female = users.filter((m) => m!.gender == "FEMALE").map((u) => u!._id);

        // Shuffle using Fisher-Yates
        for (let i = male.length - 1; i >= 0; i--) {
            const j = rng(i);
            [male[i], male[j]] = [male[j], male[i]];
        }

        for (let i = female.length - 1; i >= 0; i--) {
            const j = rng(i);
            [female[i], female[j]] = [female[j], female[i]];
        }

        // Match consecutive pairs
        for (let i = 0; i < Math.min(male.length, female.length); i++) {
            customLogger(`Matching ${male[i]} with ${female[i]}`);
            memberMap.set(male[i], female[i]);
        }

        const mapArray = Array.from(memberMap);
        customLogger(`Matched members for room ${roomId}: ${prettyPrint(mapArray)}`);

        return {
            status: 200,
            data: mapArray,
        };
    } catch (e) {
        return handleServerError(e, "MatchRoomMembers");
    }
};

const joinRoom = async (userId: string, roomId: string) => {
    const room = await getRoom(roomId);

    room!.users.push(new mongoose.Types.ObjectId(userId));
    //TODO make sure the nickname is unique
    await room!.save();
    return room;
};

export const RoomService = {
    createRoom,
    generateRoomQRCode,
    getRoom,
    joinRoom,
    matchRoomMembers,
};
