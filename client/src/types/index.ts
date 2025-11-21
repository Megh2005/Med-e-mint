export interface Campaign {
    id: string;
    name: string;
    description: string;
    eventDate: string;
    eventVenue: string;
    listedBy: string;
    listedByEmail: string;
    requirements: string[];
    location: string;
  }
  
  export interface Registration {
    id: string;
    campaignId: string;
    userId: string;
    name: string;
    email: string;
    role: "doctor" | "patient" | "ngo";
    mobile: string;
    registeredAt: string;
  }