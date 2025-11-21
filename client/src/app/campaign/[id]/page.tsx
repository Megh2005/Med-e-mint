"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Campaign } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Mail,
  CheckCircle2,
  Pencil,
} from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-white to-background">
        <div className="space-y-4 w-full max-w-3xl px-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-white to-background">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Campaign not found.</p>
          <Link href="/sos">
            <Button className="bg-white shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] transition-all duration-300 text-primary font-semibold rounded-2xl px-6 py-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-white to-background">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/sos">
            <Button className="bg-gradient-to-br from-background to-white shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] transition-all duration-300 text-primary font-semibold rounded-2xl px-6 py-3 border-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>

          {user && user.email === campaign.listedByEmail && (
            <div className="flex gap-4">
              <Link href={`/campaign/${id}/edit`}>
                <Button className="bg-accent text-accent-foreground shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] transition-all duration-300 font-semibold rounded-2xl px-6 py-3 border-0">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Campaign
                </Button>
              </Link>
              <Link href={`/campaign/${id}/registrations`}>
                <Button className="bg-secondary text-secondary-foreground shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] transition-all duration-300 font-semibold rounded-2xl px-6 py-3 border-0">
                  <User className="w-4 h-4 mr-2" />
                  View Registrations
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-background to-white rounded-3xl shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] p-8 md:p-10">
            <div className="space-y-2 pb-6 mb-8 border-b border-border">
              <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
                {campaign.name}
              </h1>
              <p className="text-muted-foreground text-lg">
                {campaign.description}
              </p>
            </div>

            <div className="space-y-8">
              {/* Event Details Section */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-white to-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    <Calendar className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                        Event Date
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                      {new Date(campaign.eventDate).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-white to-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                        Venue
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {campaign.eventVenue}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-white to-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    <User className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                        Listed By
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {campaign.listedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-white to-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    <Mail className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                        Contact
                      </p>
                      <p className="text-sm font-medium text-gray-700 break-all">
                        {campaign.listedByEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-background shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                    Requirements
                  </h3>
                </div>
                {campaign.requirements && campaign.requirements.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {campaign.requirements.map((req, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 text-sm font-medium text-black bg-primary rounded-full shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No specific requirements listed.
                  </p>
                )}
              </div>

              {/* Location Map Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wide">
                    Location
                  </h3>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff]">
                  <MapComponent
                    initialPosition={{
                      lng: Number(campaign.location.split(",")[0]),
                      lat: Number(campaign.location.split(",")[1]),
                    }}
                    draggable={false}
                  />
                </div>
              </div>

              {/* Registration Button */}
              {user && user.email !== campaign.listedByEmail && (
                <div className="mt-8">
                  <Link href={`/campaign/${id}/register`}>
                    <Button className="w-full mt-6 bg-primary text-primary-foreground shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] transition-all duration-300 font-semibold rounded-2xl px-6 py-3 border-0">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
