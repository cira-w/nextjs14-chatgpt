import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
export const pay = action({
    args: {},
    handler: async (ctx) => {
        const clerkUser = await ctx.auth.getUserIdentity();
        const user = await ctx.runQuery(api.users.currentUser, {});

        if (!user || !clerkUser) {
            throw new Error("Unauthorized");
        }
        if (!clerkUser.emailVerified) {
            throw new Error("Email not verified");
        }
        const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
            apiVersion: "2023-10-16",
        });
        const domain = process.env.NEXT_PUBLICK_HOSTING_URL!;
        const session: Stripe.Response<Stripe.Checkout.Session> =
            await stripe.checkout.sessions.create({
                mode: "subscription",
                line_items: [
                    {
                        price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID!,
                        quantity: 1,
                    },
                ],
                customer_email: clerkUser.email,
                metadata: {
                    userId: user._id,
                },
                success_url: `${domain}`,
                cancel_url: `${domain}`,
            });
        return session.url;
    },
});

type Metadata = {
    userId: Id<"users">;
};

export const fulfill = internalAction({
    args: { signature: v.string(), payload: v.string() },
    handler: async ({ runMutation, runQuery }, { signature, payload }) => {
        const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
            apiVersion: "2023-10-16",
            // httpClient: Stripe.createFetchHttpClient(),
        });
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

        try {
            const event = await stripe.webhooks.constructEventAsync(
                payload,
                signature,
                webhookSecret,
            );
            //这里只写了checkout.session.completed实际项目中可以根据需要添加更多事件类型的处理逻辑,对于completedevent而言
            const completedEvent = event.data
                .object as Stripe.Checkout.Session & {
                metadata: Metadata;
            };
            console.log("event.type", event.type);
            if (event.type === "checkout.session.completed") {
                const subscription = await stripe.subscriptions.retrieve(
                    completedEvent.subscription as string,
                );

                const userId = completedEvent.metadata.userId;

                await runMutation(internal.users.updateSubscription, {
                    userId,
                    subscriptionId: subscription.id,
                    endsOn: subscription.current_period_end * 1000,
                });
            }
            if (event.type === "invoice.payment_succeeded") {
                const subscription = await stripe.subscriptions.retrieve(
                    completedEvent.subscription as string,
                );

                await runMutation(internal.users.updateSubscriptionById, {
                    subscriptionId: subscription.id,
                    endsOn: subscription.current_period_end * 1000,
                });
            }
            return { success: true };
        } catch (error) {
            console.log(error);
            return {
                success: false,
                error: (error as { message: string }).message,
            };
        }
    },
});
