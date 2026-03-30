import { Id } from "@/convex/_generated/dataModel";
interface FormProps {
    chatId: Id<"chats">;
}
export const Form = ({ chatId }: FormProps) => {
    return <div> form</div>;
};
