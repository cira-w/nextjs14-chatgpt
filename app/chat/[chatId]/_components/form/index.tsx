"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

interface FormProps {
    chatId: Id<"chats">;
}

export const Form = ({ chatId }: FormProps) => {
    const chat = useQuery(api.chats.get, { id: chatId });
    const sendMessage = useAction(api.messages.submit);
    const [message, setMessage] = useState<string>("");
    if (chat === undefined) {
        return null;
    }
    if (chat === null) {
        return <div>Chat not FOUND</div>;
    }
    const handleSendMessage = async () => {
        if (message === "") return;
        const temp = message;
        setMessage("");
        await sendMessage({
            role: "user",
            content: temp,
            chatId: chat._id,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="relative sm:px-12 md:px-52 lg:pr-[500px] 2xl:px-96 w-full bg-neutral-800">
            <Input
                placeholder="Message TalkerGPT..."
                className="border-[1px] border-neutral-200 ring-none rounded-xl bg-inherit text-neutral-200 placeholder:text-neutral-400 h-12"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};
