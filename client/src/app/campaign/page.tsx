"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
});
// @ts-ignore: allow importing CSS without type declarations

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Plus } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

// --- Custom Geolocation Hook ---
// This hook gets the user's current location
const useGeolocation = () => {
  const [location, setLocation] = useState<{
    loaded: boolean;
    coordinates: { lat: number; lng: number };
    error: GeolocationPositionError | null;
  }>({
    loaded: false,
    coordinates: { lat: 0, lng: 0 },
    error: null,
  });

  const onSuccess = (position: GeolocationPosition) => {
    setLocation({
      loaded: true,
      coordinates: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      error: null,
    });
  };

  const onError = (error: GeolocationPositionError) => {
    setLocation({
      loaded: true,
      coordinates: { lat: 0, lng: 0 },
      error,
    });
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation((prevState) => ({
        ...prevState,
        loaded: true,
        error: {
          code: 0,
          message: "Geolocation not supported",
        } as GeolocationPositionError,
      }));
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }
  }, []);

  return location;
};

// --- Main Form Component ---
interface EventData {
  name: string;
  eventDate: string;
  location: string;
  locationDesc: string;
  requirements: string[];
}

export default function ListCampaigns() {
  const [eventData, setEventData] = useState<EventData>({
    name: "",
    eventDate: "",
    location: "",
    locationDesc: "",
    requirements: [],
  });
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const userLocation = useGeolocation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocationUpdate = (loc: { lat: number; lng: number }) => {
    setEventData((prevData) => ({
      ...prevData,
      location: `${loc.lng}, ${loc.lat}`,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEventData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!eventData.location || !eventData.name || !eventData.eventDate) {
      console.log("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.append("name", eventData.name);
    fd.append("listedBy", user?.displayName || "Anonymous");
    fd.append("listedByEmail", user?.email || "unknown"),
      fd.append("eventDate", eventData.eventDate);
    fd.append("location", eventData.location);
    fd.append("locationDesc", eventData.locationDesc);
    fd.append("requirements", JSON.stringify(eventData.requirements || []));

    try {
      const res = await axios.post("/api/campaign", fd);

      if (res.data.success) {
        console.log("Campaign Listed successfully!");
        router.push("/sos");
      }
    } catch (error) {
      console.log("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (userLocation.loaded && !userLocation.error) {
      setEventData((prevData) => ({
        ...prevData,
        location: `${userLocation.coordinates.lng}, ${userLocation.coordinates.lat}`,
      }));
    }
  }, [userLocation]);

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

  if (user.role !== "ngo") {
    return (
      <div className="flex flex-col justify-center items-center container mx-auto px-4 md:px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You do not have permission to list campaigns. This section is
          restricted to NGO users only.
        </p>
        <Link href="/sos">
          <Button
            variant="ghost"
            className="text-foreground hover:text-primary cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to SOS
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center container mx-auto px-4 md:px-6 py-12">
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
      <Card className="w-full max-w-7xl shadow-lg rounded-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">
            List your upcoming campaign
          </CardTitle>
          <CardDescription className="text-gray-500">
            Click on the map to set the incident location, then fill out the
            form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex space-x-6">
            <div className="w-2/3 space-y-4">
              {/* Map Integration */}
              <div className="space-y-2">
                <Label>Incident Location</Label>
                {isClient ? (
                  userLocation.loaded ? (
                    userLocation.error ? (
                      <div className="text-red-500">
                        {userLocation.error.message}
                      </div>
                    ) : (
                      <MapComponent
                        initialPosition={userLocation.coordinates}
                        onLocationChange={handleLocationUpdate}
                      />
                    )
                  ) : (
                    <div className="h-64 flex justify-center items-center bg-gray-200 rounded-xl">
                      <p>Loading map...</p>
                    </div>
                  )
                ) : (
                  <div className="h-64 flex justify-center items-center bg-gray-200 rounded-xl">
                    <p>Initializing map...</p>
                  </div>
                )}
              </div>

              {/* Location Coordinates Input (Read-only) */}
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
                <p className="text-sm text-gray-500">Latitude, Longitude</p>
              </div>
            </div>
            <div className="w-1/3 space-y-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Name of the event"
                  value={eventData.name}
                  className="bg-background shadow-neumorphic-inset"
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-start">
                  <Label className="pt-4">Requirements</Label>
                  <div className="flex items-center justify-between w-full">
                    <div />
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1 mr-2"
                      onClick={() =>
                        setEventData((prev) => {
                          const reqs = [
                            ...(((prev as any).requirements ?? [
                              "",
                            ]) as string[]),
                          ];
                          reqs.push("");
                          return { ...(prev as any), requirements: reqs };
                        })
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {((eventData.requirements ?? [""]) as string[]).map(
                      (req, idx) => {
                        const options = [
                          "",
                          "doctor",
                          "location",
                          "volunteers",
                          "equipments",
                          "funds",
                          "logistics",
                        ];
                        return (
                          <div
                            key={idx}
                            className="flex items-center space-x-2"
                          >
                            <select
                              id={`requirement-${idx}`}
                              name={`requirement-${idx}`}
                              value={req}
                              onChange={(e) =>
                                setEventData((prev) => {
                                  const reqs = [
                                    ...(((prev as any).requirements ?? [
                                      "",
                                    ]) as string[]),
                                  ];
                                  reqs[idx] = e.target.value;
                                  return {
                                    ...(prev as any),
                                    requirements: reqs,
                                  };
                                })
                              }
                              className="flex-1 bg-background shadow-neumorphic-inset p-2 rounded"
                            >
                              {options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt === "" ? "Select requirement" : opt}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2 py-1"
                              disabled={idx === 0}
                              onClick={() =>
                                setEventData((prev) => {
                                  const reqs = [
                                    ...(((prev as any).requirements ?? [
                                      "",
                                    ]) as string[]),
                                  ];
                                  if (reqs.length <= 1) return prev;
                                  reqs.splice(idx, 1);
                                  return {
                                    ...(prev as any),
                                    requirements: reqs,
                                  };
                                })
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <Label htmlFor="details">Event Date</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={eventData.eventDate}
                  className="bg-background shadow-neumorphic-inset"
                  onChange={handleInputChange}
                />
              </div>
              <Button
                disabled={
                  !eventData.location ||
                  !eventData.name ||
                  !eventData.eventDate ||
                  submitting
                }
                type="submit"
                className="shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200"
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  "List Event"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
