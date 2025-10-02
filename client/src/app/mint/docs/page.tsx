"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import artifact from "@/app/marketplace.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

const contractAddress = artifact.address;
const contractABI = artifact.abi;

interface Document {
  documentId: number;
  patient: string;
  issuer: string;
  issuedDate: number;
  isActive: boolean;
  tokenURI: string;
  metadata?: any;
}

const DocsPage = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
      } else {
        setError("Please install MetaMask.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect wallet.");
    }
  };

  useEffect(() => {
    const fetchDocs = async () => {
      if (account && window.ethereum) {
        setLoading(true);
        setError(null);
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, contractABI, signer);

          const myDocs = await contract.getMyDocuments();

          const docsWithMetadata = await Promise.all(
            myDocs.map(async (doc: any) => {
              const tokenURI = await contract.tokenURI(doc.documentId);
              let metadata = null;
              try {
                const response = await fetch(tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
                if (response.ok) {
                  metadata = await response.json();
                }
              } catch (e) {
                console.error("Failed to fetch metadata", e);
              }
              return {
                documentId: Number(doc.documentId),
                patient: doc.patient,
                issuer: doc.issuer,
                issuedDate: Number(doc.issuedDate),
                isActive: doc.isActive,
                tokenURI,
                metadata,
              };
            })
          );

          setDocs(docsWithMetadata);
        } catch (err) {
          console.error(err);
          setError("Failed to fetch documents. Make sure you are on the correct network.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDocs();
  }, [account]);

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="p-8 bg-card rounded-xl shadow-neumorphism max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to view your medical documents.
          </p>
          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Medical Documents</h1>
        <p className="text-sm">
          Connected: <span className="font-mono">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
        </p>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="w-full h-48" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : docs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <Collapsible key={doc.documentId} asChild>
                <Card>
                  <CardHeader>
                    <CardTitle>{doc.metadata?.name || `Document #${doc.documentId}`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doc.metadata?.image && (
                      <img
                        src={doc.metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                        alt={doc.metadata.name}
                        className="w-full h-48 object-cover mb-4 rounded-md"
                      />
                    )}
                  </CardContent>
                  <CardFooter className="flex-col items-start">
                    <CollapsibleContent className="w-full">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Issued Date:</span>{" "}
                          {new Date(doc.issuedDate * 1000).toLocaleDateString()}
                        </p>
                        {doc.metadata?.description && (
                          <p className="mt-2 text-sm">{doc.metadata.description}</p>
                        )}
                      </div>
                    </CollapsibleContent>
                    <Link href={`/mint/docs/${doc.documentId}`} className="w-full mt-2">
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </Collapsible>
            ))}
          </div>
        ) : (
          <p>No documents found for your account.</p>
        )}
      </div>
    </div>
  );
};

export default DocsPage;