"use client";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "./_components/header";
import { Body } from "./_components/body";
import { Form } from "./_components/form";
import { use } from "react";
interface ChatPageProps {
    //nextjs15的路由参数是一个promise对象，必须要在使用的时候使用use解包
    params: Promise<{
        chatId: Id<"chats">;
    }>;
}

const Chat = ({ params }: ChatPageProps) => {
    const { chatId } = use(params);
    const chat = useQuery(api.chats.get, { id: chatId });
    const router = useRouter();
    if (chat === null) {
        router.push("/");
    }
    return (
        <div className="bg-neutral-800 w-full h-full flex flex-col">
            <Header />
            <div className="flex flex-col h-full w-full overflow-hidden">
                <Body chatId={chatId} />
                <div className="w-full pb-2">
                    <Form chatId={chatId} />
                    <p className="w-full text-center text-xs text-neutral-400 my-2 lg:pr-[300px]">
                        talk with gpt
                    </p>
                </div>
            </div>
        </div>
    );
};
export default Chat;
