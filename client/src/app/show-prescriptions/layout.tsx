"use client";

import { WalletContextProvider } from "@/context/Wallet";

export default function ShowPrescriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletContextProvider>{children}</WalletContextProvider>;
}