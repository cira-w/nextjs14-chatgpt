"use client";
import { UpgradeModel } from "@/app/chat/[chatId]/_components/header/upgrade-model";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Sparkle, Sparkles } from "lucide-react";

export const UpgradePlanButton = () => {
    const [openUpgradeModel, setOpenUpgradeModel] = useState(false);
    const currentUser = useQuery(api.users.currentUser);
    const handleClick = () => {
        setOpenUpgradeModel(true);
    };
    const isSubscribed = currentUser && (currentUser?.endsOn ?? 0) > Date.now();
    return (
        <>
            {!isSubscribed && (
                <>
                    <UpgradeModel
                        open={openUpgradeModel}
                        setOpen={setOpenUpgradeModel}
                    />
                    <Button
                        className="bg-transparent gap-x-2 justify-start p-2 h-fit hover:bg-neutral-800"
                        onClick={handleClick}
                    >
                        <Sparkles className="rounded-full bg-transparent border-[1px] border-neutral-600 p-1 fill-white" />
                        <div className="text-start">
                            <h3>Upgrade plan</h3>
                            <h5 className="font-normal text-xs text-zinc-400">
                                GET QWEN-PLUS
                            </h5>
                        </div>
                    </Button>
                </>
            )}
        </>
    );
};
