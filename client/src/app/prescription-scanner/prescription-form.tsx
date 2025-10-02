"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Loader2, Pill, ScanLine, Info, Package, CircleUserRound, AlertTriangle, Atom, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { handleScanPrescription } from "@/lib/actions";
import { ScanPrescriptionOutput } from "@/ai/flows/scan-prescription-and-extract-details";
import { Skeleton } from "@/components/ui/skeleton";

export default function PrescriptionForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ScanPrescriptionOutput | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const [scanCount, setScanCount] = useState(0);
  const scanLimit = 3;

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [user, authLoading, router, pathname]);

  useEffect(() => {
    if (user) {
      const fetchScanCount = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setScanCount(userDoc.data()?.prescriptionScanCount || 0);
        }
      };
      fetchScanCount();
    }
  }, [user]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 4 * 1024 * 1024) {
        
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: isPending || scanCount >= scanLimit,
  });

  const handleSubmit = () => {
    if (scanCount >= scanLimit) {
      toast({ variant: "destructive", title: "Limit Reached", description: "You have reached your scan limit." });
      return;
    }

    if (!file || !preview) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload an image first.",
      });
      return;
    }

    startTransition(async () => {
      if (!user) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to scan." });
        return;
      }
      const response = await handleScanPrescription(preview, user.uid);
      if (response.success && response.data) {
        setResult(response.data);
        setScanCount(prev => prev + 1);
      } else {
        toast({
          variant: "destructive",
          title: response.limitReached ? "Scan Limit Reached" : "Scan Failed",
          description: response.error,
        });
        if (response.limitReached) {
          setScanCount(scanLimit);
        }
        setResult(null);
      }
    });
  };

  const clearForm = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  if (authLoading || !user) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="bg-background shadow-neumorphic">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-background shadow-neumorphic min-h-[400px]">
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground">
                        <Loader2 className="size-12 animate-spin text-primary" />
                        <p>Loading user data...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card className="bg-background shadow-neumorphic">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Upload Prescription</CardTitle>
          <CardDescription>You have {Math.max(0, scanLimit - scanCount)} scans remaining.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`w-full aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all duration-300 relative
              ${isDragActive ? "border-primary bg-primary/10 shadow-neumorphic-inset" : "bg-background shadow-neumorphic-inset"}
              ${(isPending || scanCount >= scanLimit) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <Image src={preview} alt="Prescription preview" layout="fill" objectFit="contain" className="rounded-lg" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <UploadCloud className="size-12" />
                <p className="font-semibold">
                  {isDragActive ? "Drop the image here" : "Drag & drop an image, or click to select"}
                </p>
                <p className="text-sm">PNG, JPG, or WEBP (Max 4MB)</p>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSubmit} disabled={!file || isPending || scanCount >= scanLimit} className="w-full shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
                </>
              ) : scanCount >= scanLimit ? (
                "Scan Limit Reached"
              ) : (
                <>
                  <ScanLine className="mr-2 h-4 w-4" /> Scan
                </>
              )}
            </Button>
            <Button onClick={clearForm} variant="secondary" className="w-full bg-transparent shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background shadow-neumorphic min-h-[400px]">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Extracted Details</CardTitle>
          <CardDescription>Results from the scan will appear below.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background shadow-neumorphic-inset">
                <Skeleton className="size-8 rounded-full shrink-0 mt-1" />
                <div className="w-full space-y-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 rounded-lg bg-background shadow-neumorphic-inset space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="size-6 rounded-md" />
                      <Skeleton className="h-6 flex-grow" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background shadow-neumorphic-inset">
                <CircleUserRound className="size-8 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Patient Name</p>
                  <p className="font-bold text-lg">{result.patientName}</p>
                </div>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {result.medications?.map((med, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border-b-0">
                     <AccordionTrigger className="p-4 rounded-lg bg-background shadow-neumorphic-inset hover:no-underline [&[data-state=open]]:rounded-b-none">
                        <div className="flex items-center gap-4">
                            <Pill className="size-6 text-primary shrink-0" />
                            <span className="font-bold text-lg text-left">{med.name}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-background shadow-neumorphic-inset rounded-b-lg space-y-4">
                        <div className="flex items-start gap-4">
                            <Package className="size-5 text-primary shrink-0 mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Dosage & Frequency</p>
                                <p className="font-semibold">{med.dosage} - {med.frequency}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <Atom className="size-5 text-primary shrink-0 mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Composition</p>
                                <p className="font-semibold">{med.composition}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <HelpCircle className="size-5 text-primary shrink-0 mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Purpose</p>
                                <p className="text-sm">{med.purpose}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="size-5 text-primary shrink-0 mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Common Side Effects</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {med.sideEffects.split(',').map(effect => effect.trim()).filter(Boolean).map(effect => (
                                        <Badge key={effect} variant="secondary" className="font-normal">{effect}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
               {(!result.medications || result.medications.length === 0) && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                    <Info size={48} className="mb-4" />
                    <p>No medications could be identified from the prescription.</p>
                </div>
               )}
            </div>
          )}
          {!isPending && !result && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Info size={48} className="mb-4" />
                <p>Details from your prescription will appear here after scanning.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
