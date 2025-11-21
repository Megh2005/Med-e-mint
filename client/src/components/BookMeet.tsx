/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Cal from "@calcom/embed-react";
import React from "react";

const BookMeeting = ({ children }: { children: React.ReactNode }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>Book a call</SheetTitle>
          <SheetDescription>
            Book a call with this doctor to discuss your health issues.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8">
          <Cal
            calLink="iammeghdeb/30min"
            style={{ width: "100%", height: "100vh" }}
          ></Cal>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookMeeting;
