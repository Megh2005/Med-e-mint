'use client';

import { WalletContextProvider } from "@/context/Wallet";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <WalletContextProvider>{children}</WalletContextProvider>;
}