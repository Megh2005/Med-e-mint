/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import { WalletContext } from "@/context/Wallet";
import { connectWallet } from "@/utils/connectWallet";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const WalletButton = () => {
    const {
        setIsConnected,
        setUserAddress,
        setSigner,
        isConnected,
        userAddress,
    } = useContext(WalletContext);

    return (
        <div className="flex gap-6">
            <Button
                size="lg"
                className="font-semibold shadow-neumorphic active:shadow-neumorphic-inset"
                disabled={isConnected}
                onClick={async () => {
                    await connectWallet(setIsConnected, setUserAddress, setSigner);
                }}
            >
                {userAddress
                    ? `${userAddress.slice(0, 8)}...${userAddress.slice(-8)}`
                    : "Connect Wallet"}
            </Button>
        </div>
    );
};

export default WalletButton;