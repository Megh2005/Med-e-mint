"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BookMeeting from "@/components/BookMeet";
import { Textarea } from "@/components/ui/textarea";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Doctor {
  sl_no: number;
  name: string;
  age: number;
  short_description: string;
  specialization: string;
  experience: number;
  gender: string;
  rating: number;
  email: string;
  reason: string;
  matchType: string;
  matchAccuracy: string;
  message: string;
}

export default function DoctorFinderPage() {
  const [description, setDescription] = useState("");
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const searchLimit = 3;

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
      const fetchSearchCount = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const count = userDoc.data()?.searchCount || 0;
          setSearchCount(count);
          if (count >= searchLimit) {
            setError("You have reached your maximum search limit.");
          }
        }
      };
      fetchSearchCount();
    }
  }, [user]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    if (searchCount >= searchLimit) {
      setError("You have reached your search limit.");
      return;
    }

    if (description.trim().length < 20) {
      setError(
        "Please provide a detailed disease/symptom description (min 20 characters)."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setDoctor(null);

    try {
      const response = await fetch("/api/doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description, userId: user?.uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.limitReached) {
          setError(data.error || "You have reached your maximum search limit.");
          setSearchCount(searchLimit);
        } else {
          throw new Error(data.error || "An unknown error occurred.");
        }
        return;
      }

      setDoctor(data);
      setSearchCount((prevCount) => prevCount + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">
          Find Your Doctor
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Describe your symptoms, and we'll find the best specialist for you.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You have {Math.max(0, searchLimit - searchCount)} searches remaining.
        </p>
      </div>

      <div className="text-center mb-8">
        <p className="text-muted-foreground">Or, you can browse our full list of doctors.</p>
        <Button
            variant="outline"
            className="mt-2 shadow-neumorphic active:shadow-neumorphic-inset"
            onClick={() => router.push('/doctors')}
        >
            View All Doctors
        </Button>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative flex flex-col gap-4">
          <Textarea
            value={description}
            rows={8}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., I have a persistent cough and fever for the last 3 days..."
            className="w-full resize-none text-lg bg-background shadow-neumorphic-inset transition-shadow"
            disabled={isLoading || searchCount >= searchLimit}
          />
          <Button
            type="submit"
            size="lg"
            className="w-full shadow-neumorphic active:shadow-neumorphic-inset"
            disabled={isLoading || searchCount >= searchLimit}
          >
            {isLoading
              ? "Searching..."
              : searchCount >= searchLimit
              ? "Search Limit Reached"
              : "Search"}
          </Button>
        </form>
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-background shadow-neumorphic-inset overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>

                <div className="p-4 rounded-lg shadow-neumorphic-inset bg-background">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-5/6 mt-1" />
                </div>

                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {doctor && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-background shadow-neumorphic-inset hover:shadow-neumorphic transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-xl mb-1">
                      {doctor.name}
                    </CardTitle>
                    <p className="text-primary font-semibold">
                      {doctor.specialization}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        doctor.matchType === "AI Selected"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {doctor.matchType}
                    </Badge>
                    <Badge variant="outline">
                      Match: {doctor.matchAccuracy}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow text-left">
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>{doctor.experience} years of experience</span>
                  <div className="flex items-center gap-1">
                    <Star className="size-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{doctor.rating}/10</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="font-semibold text-sm mb-2 text-foreground">
                    Description:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.short_description}
                  </p>
                </div>

                <div className="mb-4 p-4 rounded-lg shadow-neumorphic-inset bg-background">
                  <p className="font-semibold text-sm mb-1 text-foreground">
                    Reason for Recommendation:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.reason}
                  </p>
                </div>

                <div className="mt-auto">
                  <BookMeeting>
                    <Button className="w-full shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
                      Book Appointment
                    </Button>
                  </BookMeeting>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}