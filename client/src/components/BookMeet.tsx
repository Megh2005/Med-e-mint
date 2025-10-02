/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Cal from "@calcom/embed-react";
import React from "react";

const BookMeeting = ({ children }: { children: React.ReactNode }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="overflow-y-auto sm:w-full w-screen sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Book a call</DialogTitle>
          <DialogDescription>
            Book a call with this doctor to discuss your health issues.
          </DialogDescription>
        </DialogHeader>
        <div className="pb-8">
          <Cal
            calLink="iammeghdeb/30min"
            style={{ width: "100%", height: "500px" }}
          ></Cal>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookMeeting;
