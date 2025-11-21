import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();

    const name = fd.get("name") as string;
    const eventDate = fd.get("eventDate") as string;
    const location = fd.get("location") as string;
    const eventVenue = fd.get("eventVenue") as string;
    const listedBy = fd.get("listedBy") as string;
    const listedByEmail = fd.get("listedByEmail") as string;
    const description = fd.get("description") as string;
    const requirements = JSON.parse(
      fd.get("requirements") as string
    ) as string[];

    const campaignData = {
      name,
      eventDate,
      location,
      eventVenue,
      description,
      requirements,
      listedBy,
      listedByEmail,
      createdAt: new Date().toISOString(),
    };

    const campaignRef = collection(db, "campaigns");
    await addDoc(campaignRef, campaignData);

    return NextResponse.json({
      success: true,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get("role");
    const email = req.nextUrl.searchParams.get("email");

    const campaignsRef = collection(db, "campaigns");
    const q = (() => {
      if (!role) return undefined;
      const r = role.toLowerCase();
      let requirements: string[] = [];

      if (r === "doctor") {
        requirements = ["doctor"];
      } else if (r === "ngo") {
        requirements = ["location", "funds", "equipments", "logistics"];
      } else {
        // no filtering for patients or any other roles — return undefined to fetch all campaigns
        return undefined;
      }

      const uniq = Array.from(new Set(requirements));
      if (uniq.length === 1) {
        return query(
          campaignsRef,
          where("requirements", "array-contains", uniq[0])
        );
      }

      return query(
        campaignsRef,
        where("requirements", "array-contains-any", uniq),
        where("listedByEmail", "!=", email)
      );
    })();

    const snapshot = q ? await getDocs(q) : await getDocs(campaignsRef);

    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}
