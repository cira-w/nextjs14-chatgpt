import { handler } from "next/dist/build/templates/app-page";
import { internalMutation, mutation, query } from "./_generated/server";
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
        //存储了用户信息就查看对话信息，有对话就返回第一个对话信息作为默认窗口，没有对话就创立一个新的对话，没有用户就创建一个新的用户记录，并创建一个新的对话
        if (user !== null) {
            const chat = await ctx.db
                .query("chats")
                .withIndex("by_userId", (q) => q.eq("userId", user._id))
                .first();
            if (chat === null) {
                const chatId = await ctx.db.insert("chats", {
                    userId: user._id,
                    title: "New Chat",
                });
                return chatId;
            }
            return chat._id;
        }
        // Create a new user record if it doesn't exist
        const userId = await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            model: "qwen3.5-flash",
        });
        const chatId = await ctx.db.insert("chats", {
            userId,
            title: "New Chat",
        });

        return chatId;
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
//new subscription
export const updateSubscription = internalMutation({
    args: {
        subscriptionId: v.string(),
        userId: v.id("users"),
        endsOn: v.number(),
    },
    handler: async (ctx, { subscriptionId, userId, endsOn }) => {
        await ctx.db.patch(userId, {
            subscriptionId: subscriptionId,
            endsOn: endsOn,
        });
    },
});
//renew subscription
export const updateSubscriptionById = internalMutation({
    args: {
        subscriptionId: v.string(),

        endsOn: v.number(),
    },
    handler: async (ctx, { subscriptionId, endsOn }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_subscriptionId", (q) =>
                q.eq("subscriptionId", subscriptionId),
            )
            .unique();

        if (!user) {
            throw new Error("user not found when update subscription");
        }
        await ctx.db.patch(user._id, {
            endsOn: endsOn,
        });
    },
});
