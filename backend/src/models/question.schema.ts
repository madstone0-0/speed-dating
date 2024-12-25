import { model, Schema } from "mongoose";
import type { Question } from "../types.js";

const questionSchema = new Schema<Question>(
    {
        text: {
            type: String,
            required: true,
        },
        options: [
            {
                type: String,
                required: true,
            },
        ],
    },
    {
        timestamps: true,
    },
);

export const QuestionModel = model<Question>("question", questionSchema);
