"use client";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
const Homepage = () => {
    const storeUser = useMutation(api.users.store);
    const chats = useQuery(api.chats.list);
    const router = useRouter();

    useEffect(() => {
        if (chats === undefined) {
            return;
        }

        const fetch = async () => {
            if (Array.isArray(chats) && chats.length > 0) {
                const latestChat = chats.reduce((latest, current) =>
                    current._creationTime > latest._creationTime ? current : latest
                );
                router.replace(`/chat/${latestChat._id}`);
                return;
            }

            const chatId = await storeUser({});
            router.replace(`/chat/${chatId}`);
        };

        fetch();
    }, [chats, storeUser, router]);

    const loadingText =
        chats === undefined ? "Loading your chats..." : "Creating a new chat...";

    return <div className="bg-neutral-800 h-full">{loadingText}</div>;
};
export default Homepage;
