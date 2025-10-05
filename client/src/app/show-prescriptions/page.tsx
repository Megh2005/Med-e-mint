"use client";

import { useEffect, useState, useRef, useContext } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { InfoRow } from "@/components/ui/InfoRow";
import { prescriptionsCollection } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  User,
  Briefcase,
  Mail,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  Download,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import MDEditor from '@uiw/react-md-editor';
import { WalletContext } from "@/context/Wallet";
import { uploadFileToIPFS, uploadJSONToIPFS } from "@/utils/pinata";
import { ethers } from "ethers";
import Marketplace from "@/app/marketplace.json";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import WalletButton from "@/components/WalletButton";

interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  patientName: string;
  diseaseDetails: string;
  labTests: string;
  medications: string;
  additionalNotes: string;
  dateTime: string;
}

export default function ShowPrescriptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const { userAddress, isConnected } = useContext(WalletContext);

  const [mintingDialogOpen, setMintingDialogOpen] = useState(false);
  const [connectWalletDialogOpen, setConnectWalletDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const cachedUserData = sessionStorage.getItem(
          `user_data_${currentUser.uid}`
        );
        const cachedPrescriptions = sessionStorage.getItem(
          `prescriptions_${currentUser.uid}`
        );

        if (cachedUserData && cachedPrescriptions) {
          setUserData(JSON.parse(cachedUserData));
          setPrescriptions(JSON.parse(cachedPrescriptions));
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
          sessionStorage.setItem(
            `user_data_${currentUser.uid}`,
            JSON.stringify(userData)
          );

          if (userData.role === "patient") {
            const q = query(
              prescriptionsCollection,
              where("patientId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const fetchedPrescriptions = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Prescription[];
            setPrescriptions(fetchedPrescriptions);
          }
        }
        setLoading(false);
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleExport = (prescription: Prescription) => {
    if (prescriptionRef.current) {
      toPng(prescriptionRef.current)
        .then((dataUrl) => {
          const patientName = prescription.patientName.replace(/\s+/g, "_");

          const randomId = prescription.id.slice(0, 8);
          const fileName = `prescription_${patientName}_${randomId}.png`;

          const link = document.createElement("a");
          link.download = fileName;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error("oops, something went wrong!", err);
          toast({
            title: "Error",
            description: "Could not export prescription as PNG.",
            variant: "destructive",
          });
        });
    }
  };

  const handleMintClick = (prescription: Prescription) => {
    if (isConnected) {
      setSelectedPrescription(prescription);
      setMintingDialogOpen(true);
    } else {
      setConnectWalletDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPrescription && prescriptionRef.current) {
      setIsLoading(true);
      try {
        const dataUrl = await toPng(prescriptionRef.current);
        const blob = await (await fetch(dataUrl)).blob();
        
        const randomId = Math.random().toString(36).substring(2, 10);
        const title = `Dr_${selectedPrescription.doctorName.replace(/\s+/g, "_")}_${randomId}_${selectedPrescription.patientName.replace(/\s+/g, "_")}`;
        const file = new File([blob], `${title}.png`, { type: 'image/png' });

        const fileData = new FormData();
        fileData.set("file", file);

        toast({ title: "Uploading Document", description: "Please wait..." });
        const fileUploadResponse = await uploadFileToIPFS(fileData);
        if (!fileUploadResponse.success) throw new Error("Failed to upload document to IPFS.");

        const metadata = { title: title, description: selectedPrescription.diseaseDetails, image: fileUploadResponse.pinataURL };
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
        <Card className="w-full max-w-4xl bg-background shadow-neumorphic-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden shadow-neumorphic cursor-pointer relative p-4"
              >
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-[calc(100vh-10rem)] p-4">
      <Card className="w-full bg-background shadow-neumorphic-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            My Prescriptions
          </CardTitle>
          <CardDescription>
            Here are all the prescriptions you have received.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {prescriptions.map((prescription) => (
                <Dialog key={prescription.id}>
                  <DialogTrigger asChild>
                    <div className="rounded-lg overflow-hidden shadow-neumorphic cursor-pointer relative p-4">
                      <p className="font-bold">{`Dr. ${prescription.doctorName}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {prescription.dateTime}
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="p-0 max-w-3xl h-[80vh] flex flex-col">
                    <div className="overflow-y-auto flex-grow">
                      <div ref={prescriptionRef} className="bg-background p-8">
                        <DialogHeader>
                          <DialogTitle className="text-center text-4xl font-bold mb-4">
                            Prescription
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          <Card className="shadow-neumorphic-sm">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <User size={20} /> Patient Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <InfoRow
                                icon={<User size={16} />}
                                label="Patient"
                                value={prescription.patientName}
                              />
                              <InfoRow
                                icon={<Briefcase size={16} />}
                                label="Doctor"
                                value={prescription.doctorName}
                              />
                              <InfoRow
                                icon={<Mail size={16} />}
                                label="Date & Time"
                                value={prescription.dateTime}
                              />
                            </CardContent>
                          </Card>
                          <Card className="shadow-neumorphic-sm">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Stethoscope size={20} /> Disease Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{prescription.diseaseDetails}</p>
                            </CardContent>
                          </Card>
                          <Card className="shadow-neumorphic-sm">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <FlaskConical size={20} /> Lab Tests
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{prescription.labTests || "N/A"}</p>
                            </CardContent>
                          </Card>
                          <Card className="shadow-neumorphic-sm">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Pill size={20} /> Medications
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div data-color-mode="light">
                                {prescription.medications ? (
                                  <MDEditor.Markdown source={prescription.medications} />
                                ) : (
                                  <p>N/A</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="shadow-neumorphic-sm">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <FileText size={20} /> Additional Notes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{prescription.additionalNotes || "N/A"}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="p-6 pt-0">
                      <Button
                        onClick={() => handleExport(prescription)}
                        className="flex items-center gap-2"
                      >
                        <Download size={16} />
                        Export as PNG
                      </Button>
                      <Button
                        onClick={() => handleMintClick(prescription)}
                        className="flex items-center gap-2"
                      >
                        <Gem size={16} />
                        Mint
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No prescriptions found.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={mintingDialogOpen} onOpenChange={setMintingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mint Prescription</DialogTitle>
            <DialogDescription>Your prescription is ready to be minted as an NFT.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full shadow-neumorphic active:shadow-neumorphic-inset">
                {isLoading ? "Minting..." : "Mint Prescription"}
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
