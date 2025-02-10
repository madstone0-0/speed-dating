import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export function SuggestedTopics() {
    const [topics, setTopics] = useState("Loading...");

    async function getSuggestedTopics() {
        const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_SECRET!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = "Give me a list of suggested topics for a first date";

        const result = await model.generateContent(prompt);
        setTopics(result.response.text);
    }

    useEffect(() => {
        getSuggestedTopics();
    }, []);

    return (
        <>
            <p>{topics}</p>
        </>
    );
}

