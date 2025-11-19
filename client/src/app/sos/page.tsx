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
import Link from "next/link";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import MapComponent from "@/components/MapComponent";
import dynamic from "next/dynamic";

const DynamicMapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

export interface Campaign {
  createdAt: string;
  eventDate: string;
  id: string;
  listedBy: string;
  listedByEmail: string;
  location: string;
  locationDesc: string;
  name: string;
  requirements: string[];
}

export default function SOSPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<Campaign[]>([]);
  const [fetchingMyCampaigns, setFetchingMyCampaigns] = useState(false);
  const [fetchingCampaigns, setFetchingCampaigns] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [user, authLoading, router, pathname]);

  useEffect(() => {
    if (!user || !user.role) return;
    async function fetchCampaigns() {
      try {
        setFetchingCampaigns(true);
        const response = await axios.get(
          `/api/campaign?role=${user!.role}&email=${user?.email}`
        );
        const data = response.data;
        setUpcomingCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setFetchingCampaigns(false);
      }
    }

    fetchCampaigns();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "ngo") return;

    async function fetchMyCampaigns() {
      try {
        setFetchingMyCampaigns(true);
        const response = await axios.get(
          `/api/my-campaigns?email=${user?.email}`
        );
        const data = response.data;
        console.log("Fetched my campaigns:", data);
        setMyCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Error fetching my campaigns:", error);
      } finally {
        setFetchingMyCampaigns(false);
      }
    }

    fetchMyCampaigns();
  }, [user]);

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
          NGO Campaigns
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Help NGOs with their upcoming campaigns.
        </p>
      </div>

      {user.role === "ngo" && (
        <div className="flex justify-center">
          <Link href={"/campaign"}>
            <Button
              size="sm"
              className="shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200"
            >
              Launch Campaign
            </Button>
          </Link>
        </div>
      )}

      <div className="flex w-full">
        <div className={`${user.role === "ngo" ? "w-2/3 pr-4" : "w-full"}`}>
          <h1 className="text-center text-2xl mt-8 font-bold">
            Upcoming Campaigns
          </h1>
          <div className="mt-4">
            {fetchingCampaigns && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            )}
            {upcomingCampaigns.length === 0 ? (
              <p className="text-center text-muted-foreground mt-4">
                No upcoming campaigns.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingCampaigns.map((campaign) => (
                    <Link href={`/campaign/${campaign.id}`} key={campaign.id}>
                      <Card
                        className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        role="button"
                        tabIndex={0}
                      >
                        <h2 className="text-lg font-semibold mb-2">
                          {campaign.name}
                        </h2>

                        <p className="text-sm text-muted-foreground">
                          Date:{" "}
                          {new Date(campaign.eventDate).toLocaleDateString()}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {user.role === "ngo" && (
          <div className="w-1/3 pl-4 border-l border-border">
            <h1 className="text-center text-2xl mt-8 font-bold">
              My Campaigns
            </h1>
            <div className="mt-4">
              {fetchingMyCampaigns && (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              )}
              {myCampaigns.length === 0 ? (
                <p className="text-center text-muted-foreground mt-4">
                  No campaigns created yet.
                </p>
              ) : (
                <>
                  {myCampaigns.map((campaign) => (
                    <Link href={`/campaign/${campaign.id}`} key={campaign.id}>
                      <Card
                        key={campaign.id}
                        className="p-4"
                        role="button"
                        tabIndex={0}
                      >
                        <h2 className="text-lg font-semibold mb-2">
                          {campaign.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Date:{" "}
                          {new Date(campaign.eventDate).toLocaleDateString()}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
