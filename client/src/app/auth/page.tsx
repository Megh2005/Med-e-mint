"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { countries } from "@/lib/countries";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import AlreadyAuthenticated from "@/components/ui/already-authenticated";
import placeholderImages from "@/lib/placeholder-images";
import Image from "next/image";

const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().min(1, "Address is required"),
  age: z.coerce.number().positive("Age must be a positive number"),
  role: z.string().min(1, "Please select a role"),
  country: z.string().min(1, "Please select your country"),
  foodPreference: z.string().min(1, "Please select your food preference"),
  avatar: z.string().min(1, "Please select an avatar"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();

  const onboardingForm = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      gender: "",
      address: "",
      age: undefined,
      role: "",
      country: "",
      foodPreference: "",
      avatar: "",
    },
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        toast({
          title: "Sign In Successful",
          description: "Welcome back!",
        });
        router.push("/");
      } else {
        onboardingForm.setValue("name", user.displayName || "");
        setShowOnboarding(true);
      }
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onOnboardingSubmit = async (values: OnboardingFormValues) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not found");

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        ...values,
      });

      toast({
        title: "Onboarding Complete",
        description: "Welcome to Med-e-Mint!",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Onboarding Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user && !showOnboarding) {
    return <AlreadyAuthenticated />;
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-background p-4">
      <Card className="w-[60vw] max-w-4xl bg-background shadow-neumorphic-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4">
            <Logo />
          </Link>
          <CardTitle className="font-headline text-2xl">
            {showOnboarding ? "Complete Your Profile" : "Welcome to Med-e-Mint"}
          </CardTitle>
          <CardDescription>
            {showOnboarding ? "Please fill in the details below to continue." : "Sign in with your Google account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showOnboarding ? (
            <Form {...onboardingForm}>
              <form onSubmit={onboardingForm.handleSubmit(onOnboardingSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={onboardingForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} className="bg-background shadow-neumorphic-inset" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={onboardingForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background shadow-neumorphic-inset">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={onboardingForm.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 25" {...field} className="bg-background shadow-neumorphic-inset" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={onboardingForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full address" {...field} className="bg-background shadow-neumorphic-inset" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={onboardingForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background shadow-neumorphic-inset">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={onboardingForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background shadow-neumorphic-inset">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="patient">Patient</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={onboardingForm.control}
                    name="foodPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Food Preference</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background shadow-neumorphic-inset">
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="veg">Vegetarian</SelectItem>
                            <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={onboardingForm.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Your Avatar</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLoading(true);
                                const formData = new FormData();
                                formData.append("file", file);
                                try {
                                  const response = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  const data = await response.json();
                                  if (response.ok) {
                                    field.onChange(data.secure_url);
                                    toast({
                                      title: "Avatar Uploaded",
                                      description: "Your new avatar has been saved.",
                                    });
                                  } else {
                                    throw new Error(data.error || "Upload failed");
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Upload Failed",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            className="bg-background shadow-neumorphic-inset"
                          />
                          {field.value && (
                            <Image
                              src={field.value}
                              alt="Avatar Preview"
                              width={100}
                              height={100}
                              className="rounded-full"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full shadow-neumorphic active:shadow-neumorphic-inset" disabled={loading}>
                  {loading ? "Saving..." : "Complete Profile"}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center space-y-6 pt-4">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full max-w-sm shadow-neumorphic active:shadow-neumorphic-inset"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign in with Google"}
              </Button>
            </div>
          )}
           <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}