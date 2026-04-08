import { Doc } from "@/convex/_generated/dataModel";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { memo } from "react";
import Markdown from "./markdown";
interface MessageBoxProps {
    message: Doc<"messages">;
    userImageUrl?: string | "";
    isCancelled?: boolean;
    showThinking?: boolean;
    statusText?: string | null;
}

export const MessageBox = memo(({ message, userImageUrl, isCancelled = false, showThinking = false, statusText = null }: MessageBoxProps) => {
    const nameString = message.role === "user" ? "You" : "TalkGPT";
    const imageUrl = message.role === "user" ? userImageUrl : "/logo.png";

    return (
        <div className="flex space-x-3 items-start mb-10 max-w-[calc(80%)] md:max-w-full text-wrap">
            <Avatar>
                <AvatarImage
                    className="w-7 h-7 text-white fill-white"
                    src={imageUrl}
                />
                <AvatarFallback className="text-neutral-900 font-semibold">
                    {nameString[0]}
                </AvatarFallback>
            </Avatar>
            <div>
                <h3 className="font-bold">{nameString}</h3>
                <div className="flex flex-grow flex-col">
                    {isCancelled ? (
                        <div className="text-neutral-400 text-sm">
                            已取消
                        </div>
                    ) : showThinking ? (
                        <div className="flex items-center gap-2 text-neutral-400 text-sm">
                            <span>正在思考中</span>
                            <span className="flex gap-1">
                                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                            </span>
                        </div>
                    ) : null}
                    {statusText && (
                        <div className="text-neutral-400 text-sm italic">
                            {statusText}
                        </div>
                    )}
                    {message.content && (
                        <>
                            <Markdown content={message.content} />
                            {isCancelled && (
                                <div className="text-neutral-400 text-sm mt-1">
                                    已取消
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

MessageBox.displayName = "MessageBox";
