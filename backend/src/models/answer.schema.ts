import { model, Schema } from "mongoose";
import type { Answer } from "../types.js";

const answerSchema = new Schema<Answer>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    questionId: {
        type: Schema.Types.ObjectId,
        ref: 'question',
        required: true
    },
    index: {
        type: Number,
        required: true
    }
},{
    timestamps: true
});

export const AnswerModel = model<Answer>('answer', answerSchema);
