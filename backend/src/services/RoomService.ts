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
import type { JoinSocketMessage, PromiseReturn, Room, RoomMatch, User } from "../types.js";
import { MessageTypes } from "../constants/socketMessage.js";
import { Gender } from "../constants/user.js";

dotenv.config();
const domain = process.env.DOMAIN! as string;

const getUserRooms = async (hostId: string): PromiseReturn<{ rooms: Room[] }> => {
    try {
        const rooms = await RoomModel.find({ hostId }).sort("createdAt");
        if (!rooms || rooms.length === 0) throw new ServiceError(`No rooms found create by user ${hostId}`, 404);
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
    customLogger(prettyPrint(roomId));
    const room = await RoomModel.findOne({ _id: roomId });
    if (!room) return null;
    return room;
};

const matchGendered = async (
    memberMap: Map<Mongoose.Types.ObjectId, Set<Mongoose.Types.ObjectId>>,
    users: (User | null)[],
) => {
    // Split into male and female
    const male = users.filter((m) => m!.gender == Gender.MALE).map((u) => u!._id!);
    const female = users.filter((m) => m!.gender == Gender.FEMALE).map((u) => u!._id!);
    customLogger(prettyPrint(male));
    customLogger(prettyPrint(female));

    const roundMatches = [];

    const round = Math.max(male.length, female.length);
    for (let i = 0; i < round; ++i) {
        const matched = new Set<Mongoose.Types.ObjectId>();
        //keeps track of all the people that have been matched so far in this round
        const matches = [];
        for (let j = 0; j < male.length; ++j) {
            //hella patriarchal... my bad - Tani
            let femaleIndex = 0;
            let foundMatch;
            if (!memberMap.has(male[j])) memberMap.set(male[j], new Set<Mongoose.Types.ObjectId>());

            while (memberMap.get(male[j])!.has(female[femaleIndex]) || matched.has(female[femaleIndex])) {
                femaleIndex++;
                if (femaleIndex == female.length) break;
            }

            foundMatch = femaleIndex < female.length ? female[femaleIndex] : undefined;
            const user1 = await UserService.getUserById(male[j].toString());
            const user2 = foundMatch ? await UserService.getUserById(foundMatch!.toString()) : null;
            matches.push({
                user1: user1!,
                user2: user2,
            });
            if (foundMatch) {
                //if we have a match
                //add to the list of matches for the person and the list of matches for that round
                matched.add(foundMatch);
                memberMap.get(male[j])!.add(foundMatch);
            }
        }
        roundMatches.push(matches);
    }
    return roundMatches;
};

const matchNonGendered = async (
    memberMap: Map<Mongoose.Types.ObjectId, Set<Mongoose.Types.ObjectId>>,
    users: (User | null)[],
) => {
    // TODO: Improve with the Hungarian Algorithm https://www.wikiwand.com/en/articles/Hungarian_algorithm
    const roundMatches: RoomMatch = [];

    // Filter out null users and map to ids
    const userIds = await Promise.all(users.filter((u) => u).map((u) => u?._id!));
    const round = userIds.length;

    // Prepopulate the memberMap with empty sets
    userIds.forEach((u) => {
        if (!memberMap.has(u)) memberMap.set(u, new Set<Mongoose.Types.ObjectId>());
    });

    // Batch fetch all users once instead of in each round
    const userMap = new Map(
        (await Promise.all(userIds.map((id) => UserService.getUserById(id.toString())))).map((user) => [
            user!._id.toString(),
            user,
        ]),
    );

    for (let i = 0; i < round; i++) {
        // Matched uids
        const matched = new Set<Mongoose.Types.ObjectId>();
        const matches: { user1: User; user2: User | null }[] = [];

        for (let j = 0; j < userIds.length; j++) {
            const currUser = userIds[j];

            if (matched.has(currUser)) continue;

            const userMatches = memberMap.get(userIds[j])!;

            // If the current user has already matched with the current user, the current user has already been matched with another user
            // or the current user is the same as the user we are trying to match with, skip
            const foundMatch = userIds.find(
                (uid) =>
                    uid !== currUser &&
                    !userMatches.has(uid) &&
                    !matched.has(uid) &&
                    !memberMap.get(uid)!.has(currUser),
            );

            matches.push({
                user1: userMap.get(currUser.toString())!,
                user2: foundMatch ? userMap.get(foundMatch.toString())! : null,
            });

            if (foundMatch) {
                matched.add(currUser);
                matched.add(foundMatch);
                // Add to the member map both ways
                memberMap.get(currUser)!.add(foundMatch);
                memberMap.get(foundMatch)!.add(currUser);
            }
        }
        roundMatches.push(matches);
    }
    return roundMatches;
};

const countUnmatched = (matches: RoomMatch) => {
    const unmatchedSet = new Set<string>();
    for (const match of matches) {
        for (const pair of match) {
            if (!pair.user2) unmatchedSet.add(pair.user1._id!.toString());
        }
    }

    return unmatchedSet.size;
};

const matchRoomMembers = async (
    roomId: string,
    matchSetting: string,
    genderMatching: boolean,
): PromiseReturn<RoomMatch> => {
    try {
        const room = await getRoom(roomId);
        if (!room) throw new ServiceError("Cannot find room", 404);

        const members = [...room.users];

        //keeps track of all the person that a certain guy has been matched to
        const memberMap = new Map<Mongoose.Types.ObjectId, Set<Mongoose.Types.ObjectId>>();

        customLogger(`Members: ${prettyPrint(members)}`);

        const users = await Promise.all(members.map((m) => UserService.getUserById(m._id.toString())));

        let roundMatches: RoomMatch;
        if (genderMatching) roundMatches = await matchGendered(memberMap, users);
        else roundMatches = await matchNonGendered(memberMap, users);

        customLogger(`Matched members for room ${roomId}: ${prettyPrint(roundMatches)}`);

        //roundMatches looks like
        // 0 - [[a0,b0], [a1,b1]]
        //1 - [[a0,b1], [a1, b0]]

        return {
            status: 200,
            data: roundMatches,
        };
    } catch (e) {
        return handleServerError(e, "MatchRoomMembers");
    }
};

const joinRoom = async (userId: string, roomId: string) => {
    const room = await getRoom(roomId);

    // Prevent joining the room twice
    if (room!.users && room!.users.includes(new mongoose.Types.ObjectId(userId))) {
        customLogger(`User ${userId} already exists in roomm ${roomId}`);
        return room;
    }

    room!.users.push(new mongoose.Types.ObjectId(userId));
    //TODO make sure the nickname is unique in a room
    await room!.save();
    return room;
};

const leaveRoom = async (userId: string, roomId: string) => {
    const room = await getRoom(roomId);

    if (!room) return undefined;

    const newUsers = room.users.filter((u) => !u._id.equals(userId));
    room.users = newUsers;
    await room.save();
    return room;
};

export const RoomService = {
    createRoom,
    generateRoomQRCode,
    getRoom,
    joinRoom,
    leaveRoom,
    matchRoomMembers,
};
