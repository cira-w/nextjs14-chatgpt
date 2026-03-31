import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, Sparkle, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { GPTModel } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { UpgradeModel } from "./upgrade-model";

export const SelectModel = () => {
    const currentUser = useQuery(api.users.currentUser, {});
    const { mutate: selectGPT, pending: selectGPTPending } = useApiMutation(
        api.users.selectGPT,
    );
    // const result = selectGPT({ model: "gpt-4" });
    const [openSelect, setOpenSelect] = useState(false);
    const [openUpgradeModel, setOpenUpgradeModel] = useState(false);

    if (currentUser === undefined) {
        return <div>Loading...</div>;
    }
    if (currentUser === null) {
        return <div>Error: User not found</div>;
    }
    const isSubscribed = currentUser && (currentUser?.endsOn ?? 0) > Date.now();
    const GPTVersionText =
        currentUser.model === GPTModel["qwen3.5-flash"] ? "3.5" : "4";
    const handleClick = (model: GPTModel) => {
        //如果是gpt3.5，直接切换
        if (model === GPTModel["qwen3.5-flash"]) {
            selectGPT({ model });
            setOpenSelect(!openSelect);
            return;
        }
        //如果是gpt4，检查订阅状态，如果已订阅就切换，否则弹出升级提示
        if (isSubscribed) {
            selectGPT({ model });
        } else {
            setOpenUpgradeModel(true);
        }
    };
    const toggleOpen = () => {
        setOpenSelect(!openSelect);
    };
    return (
        <>
            <UpgradeModel
                open={openUpgradeModel}
                setOpen={setOpenUpgradeModel}
            />
            <Popover open={openSelect}>
                <PopoverTrigger
                    onClick={toggleOpen}
                    className="flex space-x-2 font-semibold items-center"
                >
                    <p>ChatGPT</p>
                    <p className="text-white/50">{GPTVersionText}</p>
                    <ChevronDown className="text-white/50 w-5 h-5" />
                </PopoverTrigger>

                <PopoverContent className="flex flex-col border-0 bg-neutral-700 text-white p-3 space-y-4">
                    <div
                        onClick={() => handleClick(GPTModel["qwen3.5-flash"])}
                        className="flex items-center text-start cursor-pointer rounded-md justify-start space-x-2 p-2 h-full w-full hover:bg-neutral-600"
                    >
                        <Zap className="w-6 h-6" />
                        <div className="w-full">
                            <p className="font-normal">qwen3.5-flash</p>
                            <p className="text-white/70">faster, cheaper</p>
                        </div>
                        <Checkbox
                            id="terms1"
                            checked={
                                currentUser.model === GPTModel["qwen3.5-flash"]
                            }
                        />
                    </div>

                    <div
                        onClick={() => handleClick(GPTModel["qwen3.5-plus"])}
                        className="flex items-center text-start cursor-pointer rounded-md justify-start space-x-2 p-2 h-full w-full hover:bg-neutral-600"
                    >
                        <Sparkles className="w-6 h-6" />
                        <div className="w-full">
                            <p className="font-normal">qwen3.5-plus</p>
                            <p className="text-white/70">most capable</p>
                            {!isSubscribed && (
                                <div className="w-full p-2 rounded-lg text-xs text-white text-center font-normal cursor-pointer bg-purple-500 active:bg-purple-700 mt-1.5">
                                    subscribe to use
                                </div>
                            )}
                        </div>

                        <Checkbox
                            id="terms2"
                            checked={
                                currentUser.model === GPTModel["qwen3.5-plus"]
                            }
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );
};
