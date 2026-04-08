"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { use, useEffect, useRef, useState, memo } from "react";
import { MessageBox } from "./message-box";
import { useStreamingContent } from "@/hooks/useStreamingBuffer";

interface BodyProps {
    chatId: Id<"chats">;
}

interface BufferedMessageProps {
    message: Doc<"messages">;
    userImageUrl?: string | "";
}

// 使用 memo 包装 BufferedMessage，避免不必要的重渲染
const BufferedMessage = memo(
    ({ message, userImageUrl }: BufferedMessageProps) => {
        const [isStreaming, setIsStreaming] = useState(false);
        const prevContentRef = useRef(message.content);

        // 判断是否正在流式传输中
        useEffect(() => {
            // 如果内容在增长，认为正在流式传输
            if (message.content.length > prevContentRef.current.length) {
                setIsStreaming(true);
            } else if (message.role === "assistant") {
                // 助手消息，内容不再增长时，认为流式传输结束
                const timeout = setTimeout(() => {
                    setIsStreaming(false);
                }, 500);
                prevContentRef.current = message.content;
                return () => clearTimeout(timeout);
            }
            prevContentRef.current = message.content;
        }, [message.content, message.role]);

        const { displayedContent } = useStreamingContent(message.content, {
            charThreshold: 10,
            timeThreshold: 300,
            isStreaming,
        });

        // 对于用户消息，直接使用原始内容
        const finalContent =
            message.role === "user"
                ? message.content
                : displayedContent;

        return (
            <MessageBox
                message={{ ...message, content: finalContent }}
                userImageUrl={userImageUrl}
            />
        );
    }
);

BufferedMessage.displayName = "BufferedMessage";

export const Body = ({ chatId }: BodyProps) => {
    const messages = useQuery(api.messages.list, { chatId }) || [];
    const { user } = useUser();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showButton, setShowButton] = useState(false);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "auto" });
        }
    };
    return (
        <>
            <ScrollArea className="max-h-[calc(100%-150px)] h-full w-full flex-1">
                <div className="px-4 sm:px-12 md:px-52 2xl:px-[430px] relative">
                    {messages.map((message) => (
                        <BufferedMessage
                            key={message._id}
                            message={message}
                            userImageUrl={user?.imageUrl}
                        />
                    ))}
                </div>
                <div ref={scrollRef} />
            </ScrollArea>
        </>
    );
};
