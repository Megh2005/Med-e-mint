import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Eye, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const teamMembers = [
    { name: "Dr. Anya Sharma", role: "CEO & Co-founder", initials: "AS" },
    { name: "Rohan Das", role: "CTO & Co-founder", initials: "RD" },
    { name: "Priya Singh", role: "Lead Designer", initials: "PS" },
    { name: "Dr. Ben Adams", role: "Medical Advisor", initials: "BA" },
]

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">About Med-e-Mint</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Learn more about our mission, vision, and the team dedicated to revolutionizing your healthcare experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold font-headline text-foreground">Who We Are</h2>
          <p className="text-muted-foreground">
            Med-e-Mint was founded with a simple yet powerful idea: to make healthcare more accessible, personalized, and efficient for everyone. We believe that managing your health should be as seamless as any other part of your digital life.
          </p>
          <p className="text-muted-foreground">
            Our team is composed of passionate doctors, engineers, and designers who are committed to leveraging cutting-edge technology, including generative AI, to create tools that empower you to take control of your health journey. From finding the right specialist to getting a personalized diet plan, Med-e-Mint is your trusted partner in health.
          </p>
        </div>
        <Card className="bg-background shadow-neumorphic p-8">
            <CardHeader className="p-0 text-center">
                <div className="mx-auto bg-primary/10 rounded-full p-6 w-fit mb-4 shadow-neumorphic">
                    <Users className="size-12 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-4 text-center">
                <p className="text-muted-foreground">
                    We are dedicated to building a platform that is not only technologically advanced but also deeply human-centric, ensuring trust and reliability.
                </p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center mb-16">
        <Card className="bg-background shadow-neumorphic p-8">
          <CardHeader>
            <div className="mx-auto bg-background rounded-full p-4 w-fit mb-4 shadow-neumorphic-inset">
              <Target className="size-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To democratize healthcare by providing intuitive, AI-powered tools that connect patients with the services they need, when they need them.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-neumorphic p-8">
          <CardHeader>
            <div className="mx-auto bg-background rounded-full p-4 w-fit mb-4 shadow-neumorphic-inset">
              <Eye className="size-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To create a future where healthcare is proactive, personalized, and seamlessly integrated into daily life, empowering individuals to live healthier, happier lives.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline text-foreground mb-8">Meet the Team</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
                 <div key={member.name} className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4 shadow-neumorphic bg-background text-primary text-2xl font-bold">
                        <AvatarFallback>
                           {member.initials}
                        </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
