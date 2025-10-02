//ts-nocheck

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import DietForm from "./diet-form";
import { Skeleton } from '@/components/ui/skeleton';

export default function DietCoachPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } else {
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="text-center mb-12">
                <Skeleton className="h-12 w-72 mx-auto"/>
                <Skeleton className="h-6 w-full max-w-2xl mx-auto mt-4"/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <Skeleton className="h-[600px] w-full"/>
                <Skeleton className="h-[600px] w-full"/>
            </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">AI Diet Coach</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Get a personalized meal plan tailored to your body, lifestyle, and preferences, powered by generative AI.
        </p>
      </div>
      <DietForm />
    </div>
  );
}