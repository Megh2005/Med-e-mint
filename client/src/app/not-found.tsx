import { Button } from "@/components/ui/button";
import { Frown } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-6">
        <div className="mx-auto w-fit rounded-full bg-background p-6 shadow-neumorphic-lg">
          <Frown className="size-24 text-destructive" />
        </div>
        <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground">
                404 - Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Oops! The page you are looking for does not exist. It might have been moved or deleted.
            </p>
        </div>
        <Button asChild size="lg" className="shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
          <Link href="/">Go Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
