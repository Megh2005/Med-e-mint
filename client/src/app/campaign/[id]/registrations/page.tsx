"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Campaign, Registration } from "@/types";

export default function CampaignRegistrationsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    async function fetchData() {
      try {
        // Fetch campaign details
        const docRef = doc(db, "campaigns", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const campaignData = { id: docSnap.id, ...docSnap.data() } as Campaign;
          setCampaign(campaignData);

          // Check if the current user is the owner of the campaign
          if (user.email === campaignData.listedByEmail) {
            setIsAuthorized(true);
            // Fetch registrations
            const registrationsQuery = query(
              collection(db, "campaignRegistrations"),
              where("campaignId", "==", id)
            );
            const querySnapshot = await getDocs(registrationsQuery);
            const regs = querySnapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Registration)
            );
            setRegistrations(regs);
          } else {
            setIsAuthorized(false);
          }
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">
            You are not authorized to view this page.
          </p>
          <Link href={`/campaign/${id}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href={`/campaign/${id}`}>
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Registrations for {campaign?.name}
        </h1>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <User className="inline-block w-4 h-4 mr-2" />
                Name
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Registered At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length > 0 ? (
              registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>{reg.name}</TableCell>
                  <TableCell>{reg.email}</TableCell>
                  <TableCell>{reg.role}</TableCell>
                  <TableCell>{reg.mobile}</TableCell>
                  <TableCell>
                    {new Date(reg.registeredAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No registrations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
