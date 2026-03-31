import { handler } from "next/dist/build/templates/app-page";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }

        //检查用户是否存储
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
        //存储了用户信息就返回用户ID，没有就创建一个新的用户记录，并返回新的用户ID
        if (user !== null) {
            return user._id;
        }
        const userId = await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            model: "qwen3.5-flash",
        });
        //创建一个新的聊天记录在存储用户信息到本地的时候，默认开一个新对话
        await ctx.db.insert("chats", {
            userId,
            title: "New Chat",
        });
        return userId;
    },
});

export const selectGPT = mutation({
    args: {
        model: v.union(v.literal("qwen3.5-flash"), v.literal("qwen3.5-plus")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("select gpt without authorized user");
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
        if (user === null) {
            throw new Error("user not found when select gpt");
        }
        await ctx.db.patch(user._id, {
            model: args.model,
        });
        return user._id;
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("select gpt without authorized user");
        }
        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
    },
});
