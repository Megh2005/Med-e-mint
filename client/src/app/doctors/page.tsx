"use client";

import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BookMeeting from "@/components/BookMeet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Doctor interface
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
}

// Logger utility for colorful console messages
const logger = {
    info: (msg: string) => console.log(`%c[INFO] ${msg}`, 'color: #3498db; font-weight: bold;'),
    success: (msg: string) => console.log(`%c[SUCCESS] ${msg}`, 'color: #2ecc71; font-weight: bold;'),
    warn: (msg: string) => console.log(`%c[CACHE] ${msg}`, 'color: #f39c12; font-weight: bold;'),
    error: (msg: string) => console.error(`%c[ERROR] ${msg}`, 'color: #e74c3c; font-weight: bold;'),
};

// Doctor Card Component with Neomorphism style
const DoctorCard = ({ doctor }: { doctor: Doctor }) => {
  return (
    <Card className="bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{doctor.name}</CardTitle>
        <p className="text-primary font-semibold pt-1">
          {doctor.specialization}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{doctor.short_description}</p>
        <div className="mt-4 flex mb-6 flex-wrap gap-2 text-sm">
          <Badge variant="secondary">Exp: {doctor.experience} years</Badge>
          <Badge variant="secondary">Rating: {doctor.rating}/10</Badge>
          <Badge variant="secondary">Age: {doctor.age}</Badge>
          <Badge variant="secondary">{doctor.gender}</Badge>
        </div>
        <BookMeeting>
          <Button className="w-full shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
            Book Appointment
          </Button>
        </BookMeeting>
      </CardContent>
    </Card>
  );
};

// Main Page Component
const AllDoctorsPage = () => {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const cachedDoctors = sessionStorage.getItem("allDoctors");
        if (cachedDoctors) {
          logger.warn("Fetching doctors from session storage.");
          const data = JSON.parse(cachedDoctors);
          setAllDoctors(data);
          logger.success("Successfully loaded doctors from cache.");
        } else {
          logger.info("Fetching doctors from API...");
          const response = await fetch("/api/all-doctor");
          if (!response.ok) {
            throw new Error("Failed to fetch doctors");
          }
          const data = await response.json();
          setAllDoctors(data);
          sessionStorage.setItem("allDoctors", JSON.stringify(data));
          logger.success("Successfully fetched and cached doctors.");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        logger.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    let doctors = [...allDoctors];

    if (searchTerm) {
      doctors = doctors.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genderFilter !== "all") {
      doctors = doctors.filter(
        (doc) => doc.gender.toLowerCase() === genderFilter.toLowerCase()
      );
    }

    if (specializationFilter !== "all") {
      doctors = doctors.filter(
        (doc) => doc.specialization === specializationFilter
      );
    }

    setFilteredDoctors(doctors);
  }, [searchTerm, genderFilter, specializationFilter, allDoctors]);

  const specializations = useMemo(() => {
    const specs = new Set(allDoctors.map((doc) => doc.specialization));
    return ["all", ...Array.from(specs)];
  }, [allDoctors]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-foreground mb-4">
          Our Doctors
        </h1>
        <p className="text-xl text-center capitalize text-muted-foreground mb-12">
          Meet our team of dedicated and experienced medical professionals.
        </p>

        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-6 bg-background rounded-lg shadow-neumorphic">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background shadow-neumorphic-inset"
          />
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="bg-background shadow-neumorphic-inset">
              <SelectValue placeholder="Filter by gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={specializationFilter}
            onValueChange={setSpecializationFilter}
          >
            <SelectTrigger className="bg-background shadow-neumorphic-inset">
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              {specializations.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec === "all" ? "All Specializations" : spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-background shadow-neumorphic">
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="mt-4 mb-6 flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-red-500 text-lg">Error: {error}</p>
        )}

        {!loading && !error && filteredDoctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.sl_no} doctor={doctor} />
            ))}
          </div>
        )}

        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl font-semibold text-muted-foreground">
              No doctors found.
            </p>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllDoctorsPage;