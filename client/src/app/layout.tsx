import type { Metadata } from "next";
import { PT_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
});

export const metadata: Metadata = {
  title: "Med-e-Mint",
  description: "Your Health, Reimagined.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={cn("font-body antialiased", ptSerif.variable)}>
        <div className="flex min-h-screen flex-col">
          <ScrollProgress />
          <Header />
          <main className="flex-1 md:ml-16">{children}</main>
          <Footer />
        </div>
        <Toaster />

        
      </body>
    </html>
  );
}
