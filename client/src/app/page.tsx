import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, ScanLine, Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Find a Doctor",
    description: "Search for specialists and book appointments seamlessly.",
    icon: <Stethoscope className="size-8 text-primary" />,
    link: "/doctor-finder",
  },
  {
    title: "Scan Prescription",
    description: "Upload your prescription to get medication details in seconds.",
    icon: <ScanLine className="size-8 text-primary" />,
    link: "/prescription-scanner",
  },
  {
    title: "AI Diet Coach",
    description: "Get a personalized diet plan based on your health profile.",
    icon: <Bot className="size-8 text-primary" />,
    link: "/diet-coach",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[calc(100vh-5rem)] flex items-center justify-center bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-headline tracking-tight text-foreground">
              Make Your Health Data Protected & Immutable With<br/><span className="text-primary">Med-e-Mint</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-6xl mx-auto">
              Med-e-Mint offers seamless access to healthcare services, from finding the right doctor to personalized AI-driven health coaching. After receiving service, make your data immutable with Blockchain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-background border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">A New Era of Digital Health</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our innovative features are designed to provide a futuristic and accessible healthcare experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background shadow-neumorphic hover:shadow-neumorphic-inset transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4 p-6">
                  <div className="p-3 bg-background shadow-neumorphic-inset rounded-lg">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground px-6 pb-6 flex-grow">
                  <p>{feature.description}</p>
                </CardContent>
                <div className="px-6 pb-6 mt-auto">
                   <Button asChild variant="outline" className="w-full bg-transparent shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
                        <Link href={feature.link}>
                            Learn More <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
