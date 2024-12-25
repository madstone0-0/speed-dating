import { model, Schema } from "mongoose";
import type { User } from "../types.js";

const userSchema = new Schema<User>({
    nickname: {
        type: String, 
        required: true
    },

    host: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

export const UserModel = model<User>('user', userSchema);
