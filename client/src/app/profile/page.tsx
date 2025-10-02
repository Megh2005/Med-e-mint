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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg shadow-neumorphic-inset">
      <div className="text-primary">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value || 'N/A'}</p>
      </div>
    </div>
  );

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
                                <Button className="w-full">Mint</Button>
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
    </div>
  );
}