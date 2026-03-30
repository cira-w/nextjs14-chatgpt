import { Id } from "@/convex/_generated/dataModel";
interface BodyProps {
    chatId: Id<"chats">;
}
export const Body = ({ chatId }: BodyProps) => {
    return <div> body</div>;
};
