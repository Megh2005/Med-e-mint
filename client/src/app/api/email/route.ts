import { NextResponse } from "next/server";
import * as SibApiV3Sdk from "@sendinblue/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { recipients, subject, htmlContent } = body;

        if (!recipients || recipients.length === 0) {
            return NextResponse.json({ error: "Recipients array is required" }, { status: 400 });
        }

        if (!process.env.BREVO_API_KEY || !process.env.NEXT_PUBLIC_SENDER_EMAIL) {
            return NextResponse.json(
                { error: "BREVO_API_KEY or NEXT_PUBLIC_SENDER_EMAIL is missing" },
                { status: 500 }
            );
        }

        const brevo = new SibApiV3Sdk.TransactionalEmailsApi();
        brevo.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        const sendSmtpEmail = {
            to: recipients,
            sender: { email: process.env.NEXT_PUBLIC_SENDER_EMAIL, name: "Team Sansthapana" },
            subject: subject || "Registration Confirmation Email",
            htmlContent: htmlContent || "<p>WELCOME TO SANSTHAPANA!</p>",
        };

        await brevo.sendTransacEmail(sendSmtpEmail);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Send Email Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }

}
