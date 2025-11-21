"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import dynamic from "next/dynamic";

const SearchMap = dynamic(() => import("@/components/SearchMap"), {
  ssr: false,
});

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Plus, X } from "lucide-react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Campaign } from "@/types";

// --- Helper function to get date strings ---
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getMaxDate = () => {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  return maxDate.toISOString().split("T")[0];
};

// --- Main Form Component ---
interface EventData {
  name: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  requirements: string[];
  eventVenue: string;
}

export default function EditCampaignPage() {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const router = useRouter();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!id) return;

    async function fetchCampaign() {
      try {
        const docRef = doc(db, "campaigns", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const campaign = { id: docSnap.id, ...docSnap.data() } as Campaign;
          const eventDateTime = new Date(campaign.eventDate);
          setEventData({
            name: campaign.name,
            eventDate: eventDateTime.toISOString().split("T")[0],
            eventTime: eventDateTime.toTimeString().split(" ")[0].substring(0, 5),
            location: campaign.location,
            description: campaign.description,
            requirements: campaign.requirements,
            eventVenue: campaign.eventVenue,
          });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
      }
    }

    fetchCampaign();
  }, [id]);

  const handleLocationUpdate = (loc: { lat: number; lng: number }) => {
    if (!eventData) return;
    setEventData((prevData) => ({
      ...prevData!,
      location: `${loc.lng}, ${loc.lat}`,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!eventData) return;
    const { name, value } = e.target;
    setEventData((prevData) => ({
      ...prevData!,
      [name]: value,
    }));
  };

  const handleRequirementChange = (value: string, index: number) => {
    if (!eventData) return;
    const newRequirements = [...eventData.requirements];
    newRequirements[index] = value;
    setEventData({ ...eventData, requirements: newRequirements });
  };

  const addRequirement = () => {
    if (!eventData) return;
    setEventData({
      ...eventData,
      requirements: [...eventData.requirements, ""],
    });
  };

  const removeRequirement = (index: number) => {
    if (!eventData || eventData.requirements.length <= 1) return;
    const newRequirements = eventData.requirements.filter(
      (_, i) => i !== index
    );
    setEventData({ ...eventData, requirements: newRequirements });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!eventData) return;

    if (
      !eventData.location ||
      !eventData.name ||
      !eventData.eventDate ||
      !eventData.eventTime ||
      !eventData.eventVenue
    ) {
      console.log("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    const combinedDateTime = new Date(
      `${eventData.eventDate}T${eventData.eventTime}`
    ).toISOString();

    const campaignDataToUpdate = {
        name: eventData.name,
        eventDate: combinedDateTime,
        location: eventData.location,
        description: eventData.description,
        requirements: eventData.requirements.filter((r) => r) || [],
        eventVenue: eventData.eventVenue,
    }

    try {
      const res = await axios.put(`/api/campaign/${id}`, campaignDataToUpdate);

      if (res.data.success) {
        console.log("Campaign updated successfully!");
        router.push(`/campaign/${id}`);
      }
    } catch (error) {
      console.log("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || !eventData) {
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

  if (user.role !== "ngo") {
    return (
      <div className="flex flex-col justify-center items-center container mx-auto px-4 md:px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You do not have permission to edit campaigns.
        </p>
        <Link href="/sos">
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  const requirementsOptions = [
    "",
    "doctor",
    "volunteers",
    "equipments",
    "funds",
    "logistics",
  ];

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="mb-8">
        <Link href={`/campaign/${id}`}>
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-7xl mx-auto shadow-lg rounded-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">
            Edit Your Campaign
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Update the details for your campaign below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="campaign-form"
            onSubmit={onSubmit}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Free Health Checkup Camp"
                  value={eventData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventVenue">Event Venue</Label>
                <Input
                  id="eventVenue"
                  name="eventVenue"
                  placeholder="e.g., City Community Hall"
                  value={eventData.eventVenue}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    min={getTodayDate()}
                    max={getMaxDate()}
                    value={eventData.eventDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Event Time</Label>
                  <Input
                    id="eventTime"
                    name="eventTime"
                    type="time"
                    value={eventData.eventTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell us more about the campaign"
                  value={eventData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Requirements</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRequirement}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {eventData.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <select
                        value={req}
                        onChange={(e) =>
                          handleRequirementChange(e.target.value, idx)
                        }
                        className="flex-1 bg-background border border-input rounded-md p-2 text-sm"
                      >
                        {requirementsOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "" ? "Select requirement" : opt}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRequirement(idx)}
                        disabled={eventData.requirements.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Campaign Location</Label>
                <div className="h-96 rounded-lg overflow-hidden border">
                  {isClient && eventData.location ? (
                    <SearchMap onLocationChange={handleLocationUpdate} initialPosition={{lat: parseFloat(eventData.location.split(',')[1]), lng: parseFloat(eventData.location.split(',')[0])}} />
                  ) : (
                    <div className="h-full flex justify-center items-center bg-muted">
                      <p>Initializing map...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Selected Coordinates</Label>
                <Input
                  id="location"
                  name="location"
                  readOnly
                  className="cursor-not-allowed"
                  placeholder="Click on the map to set location"
                  value={eventData.location}
                />
                <p className="text-sm text-muted-foreground">
                  Latitude, Longitude
                </p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            form="campaign-form"
            type="submit"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Campaign"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
