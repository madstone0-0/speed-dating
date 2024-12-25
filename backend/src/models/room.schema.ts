import { model, Schema } from "mongoose";
import type { Room } from "../types.js";
import { MatchSetting } from "../constants/matchSetting.js";

const roomSchema = new Schema<Room>(
    {
        users: [
            {
                type: Schema.Types.ObjectId,
                ref: "user",
                required: true,
            },
        ],

        hostId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        conversationTime: {
            type: Number,
            max: 120,
            min: 60,
            default: 60,
            required: true,
        },

        matchSetting: {
            type: String,
            enum: MatchSetting,
            default: MatchSetting.RANDOM,
        },

        genderMatching: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

export const RoomModel = model<Room>("room", roomSchema);
