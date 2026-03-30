import { handler } from "next/dist/build/templates/app-page";
import { mutation } from "./_generated/server";

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
      model: "gpt-3.5-turbo",
    });
    //创建一个新的聊天记录在存储用户信息到本地的时候，默认开一个新对话
    await ctx.db.insert("chats", {
      userId,
      title: "New Chat",
    });
    return userId;
  },
});
