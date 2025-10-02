/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "@/hooks/use-toast";
import { BrowserProvider } from "ethers";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const AVALANCHE_FUJI_TESTNET_PARAMS = {
    chainId: "0xA869",
    chainName: "Avalanche Fuji Testnet",
    nativeCurrency: {
        name: "Avalanche",
        symbol: "AVAX",
        decimals: 18,
    },
    rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://testnet.snowtrace.io/"],
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
        const avalancheFujiTestnetId = 43113;

        if (parseInt(chainId.toString(), 10) !== avalancheFujiTestnetId) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: AVALANCHE_FUJI_TESTNET_PARAMS.chainId }],
                });
                toast({
                    title: "Network Switched",
                    description: "Successfully switched to Avalanche Fuji Testnet.",
                });
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [AVALANCHE_FUJI_TESTNET_PARAMS],
                        });
                        toast({
                            title: "Network Added",
                            description: "Avalanche Fuji Testnet has been added and connected.",
                        });
                    } catch (addError) {
                        toast({
                            title: "Failed to Add Network",
                            description: "Could not add Avalanche Fuji Testnet. Please try adding it manually.",
                            variant: "destructive",
                        });
                        console.error("Add network error:", addError);
                    }
                } else {
                    toast({
                        title: "Failed to Switch Network",
                        description: "Could not switch to Avalanche Fuji Testnet. Please try switching manually.",
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