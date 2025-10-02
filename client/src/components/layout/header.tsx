"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  X,
  Stethoscope,
  ScanLine,
  Bot,
  LogIn,
  Info,
  Contact,
  Home,
  User as UserIcon,
  LogOut,
  Gem,
  Pickaxe
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const mainNavLinks = [
  { href: "/", label: "Home", icon: <Home /> },
  { href: "/doctor-finder", label: "Find a Doctor", icon: <Stethoscope /> },
  {
    href: "/prescription-scanner",
    label: "Scan Prescription",
    icon: <ScanLine />,
  },
  { href: "/diet-coach", label: "Diet Coach", icon: <Bot /> },
  { href: "/mint", label: "Mint Docs", icon: <Gem /> },
  { href: "/mint/docs", label: "Minted Docs", icon: <Pickaxe /> },
  { href: "/about", label: "About Us", icon: <Info /> },
  { href: "/contact", label: "Contact Us", icon: <Contact /> },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsMenuOpen(false);
  };

  const authLink = user
    ? { href: "/profile", label: "Profile", icon: <UserIcon /> }
    : { href: "/auth", label: "Sign In", icon: <LogIn /> };
  const navLinks = [...mainNavLinks, authLink];

  return (
    <>
      {/* Mobile Header & Hamburger Menu */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-xs bg-background"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-4">
                  <Link href="/" onClick={() => setIsMenuOpen(false)}>
                    <Logo />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </div>
                <nav className="flex flex-col gap-4 p-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary",
                        pathname === link.href
                          ? "text-primary"
                          : "text-foreground"
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                  {user && (
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="flex items-center gap-3 text-lg font-medium justify-start pl-0 text-foreground transition-colors hover:text-primary"
                    >
                      <LogOut />
                      Sign Out
                    </Button>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Navigation Dock */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-16 flex-col items-center justify-between border-r bg-background py-4 z-50">
        <div className="flex flex-col items-center gap-4">
          <Link href="/" className="mb-4">
            <Logo iconOnly />
          </Link>
          <TooltipProvider>
            <nav className="flex flex-col items-center gap-4">
              {mainNavLinks.map((link) => (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-primary",
                        pathname === link.href
                          ? "bg-accent text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.icon}
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{link.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <div className="flex flex-col items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={authLink.href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-primary",
                    pathname === authLink.href
                      ? "bg-accent text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {authLink.icon}
                  <span className="sr-only">{authLink.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{authLink.label}</p>
              </TooltipContent>
            </Tooltip>
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-10 w-10 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    <LogOut />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </aside>
    </>
  );
}
