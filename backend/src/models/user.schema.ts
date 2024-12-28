import { model, Schema } from "mongoose";
import type { User } from "../types.js";
import { Gender } from "../constants/user.js";

const userSchema = new Schema<User>(
    {
        nickname: {
            type: String,
            required: true,
        },

        host: {
            type: Boolean,
            default: false,
        },
        
        gender: {
            type: String,
            enum: Gender,
            default: Gender.MALE
        }
    },
    {
        timestamps: true,
    },
);

export const UserModel = model<User>("user", userSchema);
