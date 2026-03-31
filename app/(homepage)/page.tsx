"use client";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
const Homepage = () => {
    const storeUser = useMutation(api.users.store);
    const router = useRouter();

    useEffect(() => {
        const fetch = async () => {
            const chatId = await storeUser({});
            router.push(`/chat/${chatId}`);
        };
        fetch();
    }, [storeUser, router]);
    return <div className="bg-neutral-800 h-full">Creating a new chat...</div>;
};
export default Homepage;
