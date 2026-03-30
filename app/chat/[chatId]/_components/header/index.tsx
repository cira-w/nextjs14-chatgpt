import { UserButton } from "@clerk/nextjs";
import { SelectModel } from "./select-model";

export const Header = () => {
    return (
        <div className="flex h-[100px] justify-between p-5">
            {/* {/* <MobileSider/> */}
            <SelectModel />
            <UserButton />
        </div>
    );
};
