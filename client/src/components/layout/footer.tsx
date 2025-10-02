"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Input } from "../ui/input";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Make sure this points to your Firebase config

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  interface SubscriptionData {
    email: string;
    subscribedAt: string;
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const subscriptionData: SubscriptionData = {
        email: email,
        subscribedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "subscriptions"), subscriptionData);

      setMessage("Successfully subscribed to newsletter!");
      setEmail("");
    } catch (error: any) {
      console.error("Error saving email to Firestore:", error);
      setMessage("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <footer className="bg-secondary/50 border-t text-foreground">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-muted-foreground text-sm">
              Your Health, Reimagined. We provide seamless access to healthcare
              services, from finding doctors to AI-driven health coaching.
            </p>
          </div>

          {/* Site Map */}
          <div>
            <h3 className="font-headline text-lg font-bold mb-4">Site Map</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/doctor-finder"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Find a Doctor
                </Link>
              </li>
              <li>
                <Link
                  href="/prescription-scanner"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Scan Prescription
                </Link>
              </li>
              <li>
                <Link
                  href="/diet-coach"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  AI Diet Coach
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-headline text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-primary" />
                <span className="text-muted-foreground">
                  Nimta Sarat Pally, Nadikul Road, India, West bengal,
                  Kolkata-700049
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-primary" />
                <span className="text-muted-foreground">+91 89107 29279</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-primary" />
                <span className="text-muted-foreground">
                  iammeghdeb@gmail.com
                </span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-headline text-lg font-bold mb-4">Newsletter</h3>
            <p className="text-muted-foreground text-sm mb-3">
              Stay updated with our latest news and features.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="email"
                  placeholder="Email"
                  className="bg-background shadow-neumorphic-inset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  className="shadow-neumorphic active:shadow-neumorphic-inset"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              {message && (
                <p
                  className={`text-xs ${
                    message.includes("Successfully")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Med-e-Mint. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="GitHub">
                <Github className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="#" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
