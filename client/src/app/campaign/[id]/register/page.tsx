"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Registration } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CampaignRegistrationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to register for the campaign.",
        variant: "destructive",
      });
      return;
    }

    if (!mobile) {
      toast({
        title: "Error",
        description: "Please enter your mobile number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for existing registration
      const registrationsQuery = query(
        collection(db, "campaignRegistrations"),
        where("campaignId", "==", id),
        where("email", "==", user.email)
      );
      const querySnapshot = await getDocs(registrationsQuery);

      if (!querySnapshot.empty) {
        toast({
          title: "Already Registered",
          description: "You are already registered for this event.",
        });
        return;
      }

      const registrationData: Omit<Registration, "id"> = {
        campaignId: id as string,
        userId: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        role: user.role,
        mobile,
        registeredAt: new Date().toISOString(),
      };
      await addDoc(
        collection(db, "campaignRegistrations"),
        registrationData
      );

      toast({
        title: "Success",
        description: "Successfully registered for the campaign!",
      });
      router.push(`/campaign/${id}`);
    } catch (error) {
      console.error("Error saving registration:", error);
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-6">
        <Link href={`/campaign/${id}`}>
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>
      </div>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Register for Campaign
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={user?.displayName || ""} disabled />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={user?.role || ""} disabled />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter your mobile number"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </form>
      </div>
    </div>
  );
}