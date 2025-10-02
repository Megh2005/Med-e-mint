"use client";

import PrescriptionForm from "./prescription-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WritePrescriptionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'doctor')) {
      router.push("/"); // Redirect if not a doctor
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'doctor') {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="space-y-4 w-full max-w-2xl px-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-12 w-1/2 mx-auto" />
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <PrescriptionForm />
    </div>
  );
}
