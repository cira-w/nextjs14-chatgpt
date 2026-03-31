import { UserButton } from "@clerk/nextjs";
import { SelectModel } from "./select-model";
import { MobileSidebar } from "@/components/mobile-sidebar";

export const Header = () => {
    return (
        <div className="flex h-[100px] justify-between p-5">
            <MobileSidebar />
            <SelectModel />
            <UserButton />
        </div>
    );
};
