import { useEffect, useState } from "react";
import  { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

dotenv.config();

export function SuggestedTopics(){
    const [topics, setTopics] = useState("Loading...");

    async function getSuggestedTopics(){
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_SECRET!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Give me a list of suggested topics for a first date";

        const result = await model.generateContent(prompt);
        setTopics(result.response.text);
    }

    useEffect(()=>{
        getSuggestedTopics();
    }, []);

    return (
        <>
        <p>{topics}</p>
        </>
    )
}