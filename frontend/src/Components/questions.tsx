import React, { useEffect, useState } from "react";

interface QuestionsProps {
    questions: string[];
}

const Questions = ({ questions }: QuestionsProps) => {
    const [doneQuestions, setDoneQuestion] = useState<Map<number, { done: boolean; question: string }>>(new Map());
    useEffect(() => {
        if (questions.length === 0) return;
        const resMap = new Map<number, { done: boolean; question: string }>();
        let i = 0;
        for (const question of questions) {
            resMap.set(i, { done: false, question });
            i++;
        }
        setDoneQuestion(resMap);
    }, [questions]);

    if (questions.length === 0) {
        return <div>No questions</div>;
    }

    return (
        <div className="flex flex-col items-center w-full h-100">
            <h1 className="p-4 text-3xl header">Questions</h1>
            <div className="overflow-y-auto p-5">
                <ul className="w-full">
                    {Array.from(doneQuestions).map(([key, { done, question }]) => {
                        return (
                            <li key={key} className="p-4 md:p-2">
                                <p
                                    onClick={() => {
                                        const newDoneQuestions = new Map(doneQuestions);
                                        newDoneQuestions.set(key, { done: !done, question: question });
                                        setDoneQuestion(newDoneQuestions);
                                    }}
                                    className={`max-w-full text-lg font-bold break-words md:text-xl hover:cursor-pointer ${done ? "text-black/35" : ""}`}
                                >
                                    {done ? <s>{question}</s> : question}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default Questions;
