import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Questions from "./questions";

export function SuggestedTopics() {
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState<string[]>([]);

    async function getSuggestedTopics(signal: AbortSignal) {
        try {
            setLoading(true);
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_SECRET!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
Give me a list of suggested topics for a first date, in JSON format like
{
"topics":[
"question1",
"question2",
"question3",
...
]
}
USE THIS FORMAT EXACTLY OR YOU DIE.
`;

            const result = await model.generateContent(prompt, {
                signal: signal,
            });

            let res: string = result.response.text();
            res = res.toString().replace(/```/g, "").replace(/json/, "");
            console.log({ res });
            const questionArr: { topics: string[] } = JSON.parse(res);
            console.log({ questionArr });

            setLoading(false);
            setTopics(questionArr.topics);
        } catch (e) {
            console.log({ e });
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        getSuggestedTopics(controller.signal);
        return () => {
            controller.abort();
        };
    }, []);

    if (loading) return <h1>Loading</h1>;
    return <Questions questions={topics} />;
}
