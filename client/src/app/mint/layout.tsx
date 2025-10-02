"use client";

import { WalletContextProvider } from "@/context/Wallet";
import React from "react";

export default function MintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletContextProvider>{children}</WalletContextProvider>;
}
