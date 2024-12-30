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
import type { JoinSocketMessage, PromiseReturn, Room, User } from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";
import { Gender } from "../constants/user.js";

dotenv.config();
const domain = process.env.DOMAIN! as string;

const getUserRooms = async (hostId: string): PromiseReturn<{ rooms: Room[] }> => {
    try {
        const rooms = await RoomModel.find({ hostId }).sort("createdAt");
        if (!rooms || rooms.length === 0) throw new ServiceError("No rooms found create by this user", 404);
        return {
            status: 200,
            data: {
                rooms,
            },
        };
    } catch (e) {
        return handleServerError(e, "GetUserRooms");
    }
};

const createRoom = async (
    hostId: string,
    conversationTime?: number,
    matchSetting?: string,
    genderMatching?: boolean,
): PromiseReturn<{ room: Room }> => {
    try {
        // Temp fix for room creation on refresh
        /*
        const createdRooms = await getUserRooms(hostId);
        if (createdRooms.status === 200) {
            const room = createdRooms.data?.rooms[0]!;
            return {
                status: 201,
                data: {
                    room,
                },
            };
        }
        customLogger(`No existing room for ${hostId} creating new room`);
        */

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
        return {
            status: 201,
            data: {
                room,
            },
        };
    } catch (e) {
        return handleServerError(e, "CreateRoom");
    }
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

const matchRoomMembers = async (roomId: string): PromiseReturn<{ user1: User; user2: User }[]> => {
    try {
        const room = await getRoom(roomId);
        if (!room) throw new ServiceError("Cannot find room", 404);

        const members = [...room.users];
        const memberMap = new Map<Mongoose.Types.ObjectId, Mongoose.Types.ObjectId>();
        //maaps users to their matches
        customLogger(`Members: ${prettyPrint(members)}`);

        // Split into male and femail
        const users = await Promise.all(members.map((m) => UserService.getUserById(m._id.toString())));
        const male = users.filter((m) => m!.gender == Gender.MALE).map((u) => u!._id);
        const female = users.filter((m) => m!.gender == Gender.FEMALE).map((u) => u!._id);

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
        //need to change this to ensure that people don't get matched to people that've been matched with before

        const mapArray = Array.from(memberMap);
        let res = [];
        for (const [m1, m2] of mapArray) {
            const user1 = await UserService.getUserById(m1.toString());
            const user2 = await UserService.getUserById(m2.toString());
            if (!user1 || !user2) {
                throw new ServiceError("Cannot find user", 404);
            }
            res.push({
                user1: user1,
                user2: user2,
            });
        }
        customLogger(`Matched members for room ${roomId}: ${prettyPrint(mapArray)}`);

        return {
            status: 200,
            data: res,
        };
    } catch (e) {
        return handleServerError(e, "MatchRoomMembers");
    }
};

const joinRoom = async (userId: string, roomId: string) => {
    const room = await getRoom(roomId);

    // Prevent joining the room twice
    if (room!.users.includes(new mongoose.Types.ObjectId(userId))) {
        customLogger(`User ${userId} already exists in roomm ${roomId}`);
        return room;
    }

    room!.users.push(new mongoose.Types.ObjectId(userId));
    //TODO make sure the nickname is unique in a room
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
