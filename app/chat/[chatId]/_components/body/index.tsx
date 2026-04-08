"use client";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    memo,
    useCallback,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageBox } from "./message-box";
import { useStreamingContent } from "@/hooks/useStreamingBuffer";
import { ArrowDown } from "lucide-react";

interface BodyProps {
    chatId: Id<"chats">;
}

interface BufferedMessageProps {
    message: Doc<"messages">;
    userImageUrl?: string | "";
}

const BufferedMessage = memo(
    ({ message, userImageUrl }: BufferedMessageProps) => {
        const [isStreaming, setIsStreaming] = useState(false);
        const [showThinking, setShowThinking] = useState(false);
        const prevContentRef = useRef(message.content);
        const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        const contentJustStartedRef = useRef(false);

        useQuery(api.chats.get, { id: message.chatId });
        const isCancelled = message.isCancelled ?? false;

        // 仅处理思考动画的关闭：等待内容开始出现后关闭思考动画
        useEffect(() => {
            if (message.content.length > 0) {
                setShowThinking(false);
                if (thinkingTimeoutRef.current) {
                    clearTimeout(thinkingTimeoutRef.current);
                    thinkingTimeoutRef.current = null;
                }
            }
        }, [message.content]);

        useEffect(() => {
            if (message.role === "assistant" && message.content === "" && !isCancelled) {
                contentJustStartedRef.current = false;
                thinkingTimeoutRef.current = setTimeout(() => {
                    setShowThinking(true);
                }, 500);
            } else {
                setShowThinking(false);
                if (thinkingTimeoutRef.current) {
                    clearTimeout(thinkingTimeoutRef.current);
                    thinkingTimeoutRef.current = null;
                }
            }

            if (message.content.length > 0 && prevContentRef.current === "") {
                contentJustStartedRef.current = true;
                setIsStreaming(true);
                setShowThinking(false);
            }

            if (message.content.length > prevContentRef.current.length) {
                setIsStreaming(true);
            } else if (message.role === "assistant") {
                const timeout = setTimeout(() => {
                    setIsStreaming(false);
                }, 500);
                prevContentRef.current = message.content;
                return () => clearTimeout(timeout);
            }
            prevContentRef.current = message.content;
        }, [message.content, message.role, isCancelled]);

        const { displayedContent } = useStreamingContent(message.content, {
            charThreshold: contentJustStartedRef.current ? 1 : 10,
            timeThreshold: contentJustStartedRef.current ? 50 : 300,
            isStreaming,
        });

        const finalContent =
            message.role === "user" ? message.content : displayedContent;

        return (
            <MessageBox
                message={{ ...message, content: finalContent }}
                userImageUrl={userImageUrl}
                isCancelled={isCancelled}
                showThinking={showThinking}
            />
        );
    }
);

BufferedMessage.displayName = "BufferedMessage";

const ESTIMATED_MESSAGE_HEIGHT = 150;
const NEAR_BOTTOM_THRESHOLD = 100;

const estimateMessageHeight = (message: Doc<"messages">): number => {
    const baseHeight = message.role === "user" ? 80 : 100;
    const contentLength = message.content.length;
    if (contentLength < 100) return baseHeight;
    if (contentLength < 500) return baseHeight + 80;
    if (contentLength < 1500) return baseHeight + 200;
    return baseHeight + 400;
};

export const Body = ({ chatId }: BodyProps) => {
    const messages = useQuery(api.messages.list, { chatId }) || [];
    const { user } = useUser();

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [isNearBottom, setIsNearBottom] = useState(true);
    const [showNewMessageButton, setShowNewMessageButton] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);

    const prevMessagesLengthRef = useRef(messages.length);
    const pendingInitialScrollRef = useRef(true);

    const virtualizer = useVirtualizer({
        count: messages.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: (index) => estimateMessageHeight(messages[index]),
        overscan: 3,
        measureElement: (element) => element?.getBoundingClientRect().height ?? ESTIMATED_MESSAGE_HEIGHT,
    });

    const checkIfNearBottom = useCallback(() => {
        const el = scrollContainerRef.current;
        if (!el) return true;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        return distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
    }, []);

    const handleScroll = useCallback(() => {
        const nearBottom = checkIfNearBottom();
        setIsNearBottom(nearBottom);

        if (nearBottom) {
            setShowNewMessageButton(false);
            setNewMessageCount(0);
        }
    }, [checkIfNearBottom]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        const el = scrollContainerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
        setShowNewMessageButton(false);
        setNewMessageCount(0);
        setIsNearBottom(true);
    }, []);

    // 会话切换时强制滚动到底部（无动画，立即跳转）
    useEffect(() => {
        pendingInitialScrollRef.current = true;
        prevMessagesLengthRef.current = 0;
        setShowNewMessageButton(false);
        setNewMessageCount(0);
        setIsNearBottom(true);
    }, [chatId]);

    useLayoutEffect(() => {
        if (!pendingInitialScrollRef.current) return;

        const el = scrollContainerRef.current;
        if (!el) return;

        if (messages.length > 0) {
            virtualizer.scrollToIndex(messages.length - 1, {
                align: "end",
                behavior: "auto",
            });
        }

        el.scrollTop = el.scrollHeight;
        pendingInitialScrollRef.current = false;
        prevMessagesLengthRef.current = messages.length;
    }, [messages.length, virtualizer]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        requestAnimationFrame(() => {
            if (pendingInitialScrollRef.current) return;
            el.scrollTop = el.scrollHeight;
        });
    }, [chatId, messages.length]);

    // 新消息时自动滚动
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current) {
            if (isNearBottom) {
                requestAnimationFrame(() => {
                    scrollToBottom("smooth");
                });
            } else {
                setShowNewMessageButton(true);
                setNewMessageCount(
                    (prev) => prev + (messages.length - prevMessagesLengthRef.current)
                );
            }
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages.length, isNearBottom, scrollToBottom]);

    // 流式传输结束检测
    const lastMessage = messages[messages.length - 1];
    const lastMessageLengthRef = useRef(0);

    // 流式传输期间持续跟随
    useEffect(() => {
        if (!lastMessage || lastMessage.role !== "assistant") return;

        const contentLength = lastMessage.content.length;
        const isCurrentlyStreaming = contentLength > lastMessageLengthRef.current;

        if (isCurrentlyStreaming && isNearBottom) {
            const timeout = setTimeout(() => {
                scrollToBottom("smooth");
            }, 16);
            return () => clearTimeout(timeout);
        }

        lastMessageLengthRef.current = contentLength;
    }, [lastMessage, isNearBottom, scrollToBottom]);

    // 流式传输结束时最终滚动定位
    useEffect(() => {
        if (!lastMessage || lastMessage.role !== "assistant") return;

        const contentLength = lastMessage.content.length;
        const wasStreaming = lastMessageLengthRef.current > 0;
        const isNowStreaming = contentLength > lastMessageLengthRef.current;

        // 流式结束且处于跟随模式，滚动到底部
        if (wasStreaming && !isNowStreaming && isNearBottom) {
            requestAnimationFrame(() => {
                scrollToBottom("auto");
            });
        }
    }, [lastMessage, isNearBottom, scrollToBottom]);

    return (
        <div className="relative flex-1 min-h-0 flex flex-col" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-52 2xl:px-[430px]"
                style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.2) transparent" }}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const message = messages[virtualItem.index];
                        return (
                            <div
                                key={virtualItem.key}
                                ref={virtualizer.measureElement}
                                data-index={virtualItem.index}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <BufferedMessage
                                    message={message}
                                    userImageUrl={user?.imageUrl}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {showNewMessageButton && (
                <button
                    onClick={() => scrollToBottom("smooth")}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 z-50"
                >
                    <ArrowDown className="w-4 h-4" />
                    <span>
                        {newMessageCount > 0
                            ? `有 ${newMessageCount} 条新消息`
                            : "有新消息"}
                    </span>
                </button>
            )}
        </div>
    );
};
