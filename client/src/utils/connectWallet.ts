/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "@/hooks/use-toast";
import { BrowserProvider } from "ethers";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const FLOW_TESTNET_PARAMS = {
    chainId: "0x221",
    chainName: "Flow Testnet",
    nativeCurrency: {
        name: "Flow",
        symbol: "FLOW",
        decimals: 18,
    },
    rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
    blockExplorerUrls: ["https://evm-testnet.flowscan.io/"],
};

export const connectWallet = async (
    setIsConnected: (val: boolean) => void,
    setUserAddress: (val: string) => void,
    setSigner: (val: any) => void
) => {
    if (!window.ethereum) {
        toast({
            title: "No Wallet Detected",
            description: "Please install MetaMask or another Web3 wallet.",
            variant: "destructive",
        });
        return;
    }

    try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setSigner(signer);

        const accounts = await provider.send("eth_requestAccounts", []);
        const address = accounts[0];
        setUserAddress(address);
        setIsConnected(true);

        const { chainId } = await provider.getNetwork();
        const flowTestnetId = 545;

        if (parseInt(chainId.toString(), 10) !== flowTestnetId) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: FLOW_TESTNET_PARAMS.chainId }],
                });
                toast({
                    title: "Network Switched",
                    description: "Successfully switched to Flow Testnet.",
                });
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [FLOW_TESTNET_PARAMS],
                        });
                        toast({
                            title: "Network Added",
                            description: "Flow Testnet has been added and connected.",
                        });
                    } catch (addError) {
                        toast({
                            title: "Failed to Add Network",
                            description: "Could not add Flow Testnet. Please try adding it manually.",
                            variant: "destructive",
                        });
                        console.error("Add network error:", addError);
                    }
                } else {
                    toast({
                        title: "Failed to Switch Network",
                        description: "Could not switch to Flow Testnet. Please try switching manually.",
                        variant: "destructive",
                    });
                    console.error("Switch error:", switchError);
                }
            }
        } else {
            toast({
                title: "Wallet Connected",
                description: "Welcome to Med-e-Mint!",
            });
        }
    } catch (error) {
        toast({
            title: "Connection Failed",
            description: "Wallet connection failed. Please try again.",
            variant: "destructive",
        });
        console.error("Connection error:", error);
    }
};