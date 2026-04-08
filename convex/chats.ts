import { handler } from "next/dist/build/templates/app-page";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
    args: { id: v.id("chats") },
    handler: async (ctx, args) => {
        const chat = await ctx.db.get(args.id);
        return chat;
    },
});

export const create = mutation({
    args: {},
    //ctx=>context, args=>arguments
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
        if (!user) {
            throw new Error("User not found");
        }
        const chatId = await ctx.db.insert("chats", {
            userId: user._id,
            title: "New Chat",
            isGenerating: false,
        });
        return chatId;
    },
});
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        //用户是否存在于数据库中
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();

        if (user === null) {
            return null;
        }
        //查询用户的聊天记录
        return ctx.db
            .query("chats")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();
    },
});

export const rename = mutation({
    args: { id: v.id("chats"), title: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            title: args.title,
        });
    },
});
export const remove = mutation({
    args: { id: v.id("chats") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const setGenerating = mutation({
    args: { id: v.id("chats"), isGenerating: v.boolean() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            isGenerating: args.isGenerating,
        });
    },
});
