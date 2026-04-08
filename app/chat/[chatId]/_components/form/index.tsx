"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { Input } from "@/components/ui/input";
import { Square } from "lucide-react";
import React, { useState } from "react";

interface FormProps {
    chatId: Id<"chats">;
}

export const Form = ({ chatId }: FormProps) => {
    const chat = useQuery(api.chats.get, { id: chatId });
    const messages = useQuery(api.messages.list, { chatId }) || [];
    const sendMessage = useAction(api.messages.submit);
    const setGenerating = useMutation(api.chats.setGenerating);
    const cancelMessage = useMutation(api.messages.cancel);
    const [message, setMessage] = useState<string>("");

    // 获取当前正在生成的助手消息（最后一条未完成的消息）
    const currentAssistantMessage = messages
        .filter((m) => m.role === "assistant")
        .sort((a, b) => b._creationTime - a._creationTime)[0];

    // 停止生成
    const handleStopGeneration = () => {
        // 标记聊天不再生成
        setGenerating({
            id: chatId,
            isGenerating: false,
        });
        // 标记消息为已取消
        if (currentAssistantMessage) {
            cancelMessage({ messageId: currentAssistantMessage._id });
        }
    };

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
        <div className="relative sm:px-12 md:px-52 lg:pr-[500px] 2xl:px-96 w-full bg-neutral-800 backdrop-blur-sm pt-2">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Message TalkerGPT..."
                    className="border-[1px] border-neutral-200 ring-none rounded-xl bg-inherit text-neutral-200 placeholder:text-neutral-400 h-12"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                {chat.isGenerating && (
                    <button
                        onClick={handleStopGeneration}
                        className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
                        title="停止生成"
                    >
                        <Square className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};
