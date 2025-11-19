"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Campaign } from "../../../../app/sos/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchCampaign() {
      try {
        const docRef = doc(db, "campaigns", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCampaign({ id: docSnap.id, ...docSnap.data() } as Campaign);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaign();
  }, [id]);

  if (loading) {
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

  if (!campaign) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Campaign not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="mb-4">
        <Link href="/sos">
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong className="font-bold text-neutral-800">
              Date:
            </strong>{" "}
            {new Date(campaign.eventDate).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong className="font-bold text-neutral-800">
              Listed by:
            </strong>{" "}
            {campaign.listedBy} ({campaign.listedByEmail})
          </p>
          <div>
            <strong className="text-sm block font-bold mb-2 text-neutral-800">
              Requirements:
            </strong>
            {campaign.requirements && campaign.requirements.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.requirements.map((req, i) => (
                  <Badge key={i} className="text-sm">
                    {req}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific requirements.
              </p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <strong className="font-bold text-neutral-800">
              Location:
            </strong>
            <MapComponent
              initialPosition={{
                lng: Number(campaign.location.split(",")[0]),
                lat: Number(campaign.location.split(",")[1]),
              }}
              draggable={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
