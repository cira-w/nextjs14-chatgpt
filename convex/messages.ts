import {
    action,
    internalMutation,
    internalQuery,
    mutation,
    query,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";
export const list = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .collect();
    },
});

export const send = internalMutation({
    args: {
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const newMessageId = await ctx.db.insert("messages", {
            role: args.role,
            content: args.content,
            chatId: args.chatId,
        });
        return newMessageId;
    },
});

export const retrive = internalQuery({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .order("desc")
            .take(3);
        return messages;
    },
});

export const submit = action({
    args: {
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.runQuery(api.users.currentUser, {});
        if (currentUser === null) {
            throw new Error("user Not found");
        }
        //send user message
        await ctx.runMutation(internal.messages.send, {
            role: args.role,
            content: args.content,
            chatId: args.chatId,
        });
        const messages = await ctx.runQuery(internal.messages.retrive, {
            chatId: args.chatId,
        });
        messages.reverse();
        const formattedMessages = messages.map((message) => ({
            role: message.role,
            content: message.content,
        }));
        const openai = new OpenAI({
            apiKey: process.env.QWEN_API_KEY,
            // baseURL: process.env.QWEN_API_BASE_URL,
            baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        });
        let response = "";
        const stream = await openai.chat.completions.create({
            model: currentUser.model,
            messages: formattedMessages,
            stream: true,
            temperature: 1,
            max_tokens: 420,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        // 🔍 添加这段调试代码
        // console.log("=== API 完整响应 ===", JSON.stringify(stream, null, 2));
        //save message
        const newAssistantMessageId = await ctx.runMutation(
            internal.messages.send,
            {
                role: "assistant",
                content: "",
                chatId: args.chatId,
            },
        );

        // 设置聊天为生成中状态
        await ctx.runMutation(api.chats.setGenerating, {
            id: args.chatId,
            isGenerating: true,
        });

        for await (const part of stream) {
            // 定期检查是否需要停止生成
            const chat = await ctx.runQuery(api.chats.get, { id: args.chatId });
            if (chat && !chat.isGenerating) {
                // 用户点击了停止按钮，提前退出
                break;
            }

            const delta = part.choices?.[0]?.delta;
            const content = delta?.content;

            if (!content) {
                continue;
            }

            response += content;

            await ctx.runMutation(internal.messages.update, {
                messageId: newAssistantMessageId,
                content: response,
            });
        }

        // 生成结束，重置状态
        await ctx.runMutation(api.chats.setGenerating, {
            id: args.chatId,
            isGenerating: false,
        });
    },
});

export const update = internalMutation({
    args: {
        messageId: v.id("messages"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            content: args.content,
        });
    },
});

export const cancel = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            isCancelled: true,
        });
    },
});
