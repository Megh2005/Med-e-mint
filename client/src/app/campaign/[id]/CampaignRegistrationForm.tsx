"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Registration } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Campaign } from "@/types";

interface CampaignRegistrationFormProps {
  campaignId: string;
  campaign: Campaign;
}

export default function CampaignRegistrationForm({
  campaignId,
  campaign,
}: CampaignRegistrationFormProps) {
  const { user } = useAuth();
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
        where("campaignId", "==", campaignId),
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
        campaignId,
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
      setMobile("");
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

  if (user && user.email === campaign.listedByEmail) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full mt-6 bg-primary text-primary-foreground shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] transition-all duration-300 font-semibold rounded-2xl px-6 py-3 border-0">
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register for Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
      </DialogContent>
    </Dialog>
  );
}
