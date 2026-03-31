import { Doc } from "@/convex/_generated/dataModel";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import Markdown from "./markdown";
interface MessageBoxProps {
    message: Doc<"messages">;
    userImageUrl?: string | "";
}
export const MessageBox = ({ message, userImageUrl }: MessageBoxProps) => {
    const nameString = message.role === "user" ? "You" : "TalkGPT";
    const imageUrl = message.role === "user" ? userImageUrl : "/logo.png";
    return (
        <div className="flex space-x-3 items-start mb-10 max-w-[calc(80%)] md:max-w-full text-wrap">
            <Avatar>
                <AvatarImage
                    className="w-7 h-7 text-white fill-white"
                    src={imageUrl}
                />
                <AvatarFallback className="text-neutral-900 font-semibold">
                    {nameString[0]}
                </AvatarFallback>
            </Avatar>
            <div>
                <h3 className="font-bold">{nameString}</h3>
                <div className="flex flex-grow">
                    <Markdown content={message.content} />
                </div>
            </div>
        </div>
    );
};
