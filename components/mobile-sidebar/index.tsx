import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NewChatButton } from "../sidebar/new-chat-button";
import { ChatList } from "../sidebar/chat-list";

export const MobileSidebar = () => {
    return (
        <div className="block lg:hidden">
            <Sheet>
                <SheetTrigger>
                    <Menu className="text-white" />
                </SheetTrigger>
                <SheetContent
                    side={"left"}
                    className="h-full flex p-4 bg-neutral-950 flex-col"
                >
                    <NewChatButton />
                    <ChatList />
                    {/* <UpgradeButton /> */}
                </SheetContent>
            </Sheet>
        </div>
    );
};
