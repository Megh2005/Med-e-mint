import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import * as SibApiV3Sdk from "@sendinblue/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaignName,
      campaignId,
      eventDate,
      location,
      eventVenue,
      listedBy,
      senderEmail,
    } = body;

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map((doc) => doc.data()) as {
      email: string;
    }[];

    const usersToNotify = users.filter((u) => u.email !== senderEmail);

    const newCampaignEmailSubject = `New Campaign Posted: ${campaignName}`;

    const newCampaignEmailHtmlContent = `
            <h1>New Campaign: ${campaignName}</h1>
            <p>Hello,</p>
            <p>A new campaign has just been listed by ${listedBy}.</p>
            <p>
              <strong>Date:</strong> ${new Date(
                eventDate
              ).toLocaleDateString()}<br/>
              <strong>Venue:</strong> ${eventVenue || "TBA"}<br/>
            </p>
            <p>View the campaign details using the link below:</p>
            <p>
              <a href="http://localhost:3000/campaign/${encodeURIComponent(
                campaignId
              )}">View campaign details</a>
            </p>
            <hr/>
            <p>Best regards,</p>
            <p>The Med-e-Care Team</p>
        `;

    const brevo = new SibApiV3Sdk.TransactionalEmailsApi();
    brevo.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );

    const sendSmtpEmail = {
      to: [{ email: process.env.NEXT_PUBLIC_SENDER_EMAIL! }],
      bcc: usersToNotify.map((u) => ({ email: u.email })),
      sender: {
        email: process.env.NEXT_PUBLIC_SENDER_EMAIL,
        name: "Team Med-e-Care",
      },
      subject: newCampaignEmailSubject,
      htmlContent: newCampaignEmailHtmlContent,
    };

    await brevo.sendTransacEmail(sendSmtpEmail);

    return NextResponse.json({
      success: true,
      message: "Notification emails sent to all users",
    });
  } catch (error) {
    console.error("Error sending notification emails:", error);
    return NextResponse.json(
      { error: "Failed to send notification emails" },
      { status: 500 }
    );
  }
}
