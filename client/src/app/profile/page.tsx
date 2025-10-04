"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail, Home, Globe, Briefcase, Utensils, VenetianMask, PersonStanding } from 'lucide-react';
import Image from 'next/image';
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WalletContext } from "@/context/Wallet";
import { uploadFileToIPFS, uploadJSONToIPFS } from "@/utils/pinata";
import { ethers } from "ethers";
import Marketplace from "@/app/marketplace.json";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContext } from "react";
import { InfoRow } from "@/components/ui/InfoRow";
import WalletButton from "@/components/WalletButton";





export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { userAddress, isConnected } = useContext(WalletContext);

  const [mintingDialogOpen, setMintingDialogOpen] = useState(false);
  const [connectWalletDialogOpen, setConnectWalletDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ url: string; date: string } | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ title: "", description: "" });
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          
        }
        setLoading(false);
      } else if (!isSigningOut) {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router, isSigningOut]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsSigningOut(false);
    }
  };

  const validateForm = () => {
    const newErrors = { title: "", description: "" };
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return !newErrors.title && !newErrors.description;
  };

  const handleMintClick = (plan: { url: string; date: string }) => {
    if (isConnected) {
      setSelectedPlan(plan);
      setMintingDialogOpen(true);
    } else {
      setConnectWalletDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && selectedPlan) {
      setIsLoading(true);
      try {
        const response = await fetch(selectedPlan.url);
        const blob = await response.blob();
        const file = new File([blob], `${formData.title.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });

        const fileData = new FormData();
        fileData.set("file", file);

        toast({ title: "Uploading Document", description: "Please wait..." });
        const fileUploadResponse = await uploadFileToIPFS(fileData);
        if (!fileUploadResponse.success) throw new Error("Failed to upload document to IPFS.");

        const metadata = { title: formData.title, description: formData.description, image: fileUploadResponse.pinataURL };
        toast({ title: "Uploading Metadata", description: "Please wait..." });
        const jsonUploadResponse = await uploadJSONToIPFS(metadata);
        if (!jsonUploadResponse.success) throw new Error("Failed to upload metadata to IPFS.");

        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);

          toast({ title: "Minting NFT", description: "Please approve the transaction in your wallet." });
          const transaction = await contract.createMedicalDocument(jsonUploadResponse.pinataURL, userAddress);
          await transaction.wait();

          toast({ title: "Success!", description: "Your document has been minted as an NFT." });
          setMintingDialogOpen(false);
          setFormData({ title: "", description: "" });
        } else {
          throw new Error("MetaMask Not Found. Please install MetaMask.");
        }
      } catch (error: any) {
        toast({ title: "An Error Occurred", description: error.message, variant: "destructive" });
      }
      setIsLoading(false);
    }
  };

  

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] p-4">
        <Card className="w-full max-w-2xl bg-background shadow-neumorphic-lg">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg shadow-neumorphic-inset">
                    <Skeleton className="h-6 w-6" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-10rem)] p-4">
      <Card className="w-full max-w-2xl bg-background shadow-neumorphic-lg">
        <CardHeader className="items-center text-center">
            <Avatar className="w-24 h-24 shadow-neumorphic-lg">
                <AvatarImage src={userData?.avatar || ''} alt={userData?.name} />
                <AvatarFallback className="text-3xl font-headline bg-background shadow-neumorphic-inset">
                    {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
          <CardTitle className="text-3xl font-headline mt-4">{userData?.name}</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 capitalize gap-4">
            <InfoRow icon={<User size={20} />} label="Full Name" value={userData?.name} />
            <InfoRow icon={<Mail size={20} />} label="Email Address" value={user?.email || ''} />
            <InfoRow icon={<VenetianMask size={20} />} label="Age" value={userData?.age} />
            <InfoRow icon={<PersonStanding size={20} />} label="Gender" value={userData?.gender} />
            <InfoRow icon={<Home size={20} />} label="Address" value={userData?.address} />
            <InfoRow icon={<Globe size={20} />} label="Country" value={userData?.country} />
            <InfoRow icon={<Briefcase size={20} />} label="Role" value={userData?.role} />
            <InfoRow icon={<Utensils size={20} />} label="Food Preference" value={userData?.foodPreference} />
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-headline mb-4">My Diet Plans</h3>
            {userData?.dietPlanUrl && userData.dietPlanUrl.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {userData.dietPlanUrl.map((plan: { url: string; date: string }, index: number) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div className="rounded-lg overflow-hidden shadow-neumorphic cursor-pointer relative">
                        <Image src={plan.url} alt={`Diet Plan ${index + 1}`} width={300} height={300} className="object-cover w-full h-full" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs">
                          {new Date(plan.date).toLocaleDateString()}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-4xl">
                        <div className="max-h-[90vh] overflow-y-auto no-scrollbar">
                            <div className="p-6">
                                <Image src={plan.url} alt={`Diet Plan ${index + 1}`} width={1000} height={1000} className="w-full h-auto rounded-lg" />
                            </div>
                            <DialogFooter className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t">
                                <Button className="w-full" onClick={() => handleMintClick(plan)}>Mint</Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No diet plans saved yet.</p>
            )}
          </div>


          <Button onClick={handleSignOut} className="w-full shadow-neumorphic active:shadow-neumorphic-inset">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Dialog open={mintingDialogOpen} onOpenChange={setMintingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mint Document</DialogTitle>
            <DialogDescription>Fill in the details below to mint your document as an NFT.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground">Document Title</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); if (e.target.value.trim()) setErrors(prev => ({ ...prev, title: "" })); }}
                placeholder="e.g., My Diet Plan"
                className="mt-1 bg-background shadow-neumorphic-inset"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground">Document Description</label>
              <Textarea
                id="description"
                value={formData.description}
                rows={3}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); if (e.target.value.trim()) setErrors(prev => ({ ...prev, description: "" })); }}
                placeholder="A brief description of the document..."
                className="mt-1 resize-none bg-background shadow-neumorphic-inset"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full shadow-neumorphic active:shadow-neumorphic-inset">
                {isLoading ? "Minting..." : "Mint Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={connectWalletDialogOpen} onOpenChange={setConnectWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>Please connect your wallet to mint a new document.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <WalletButton />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}