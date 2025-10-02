"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Loader2, Sparkles, Download } from "lucide-react";
import * as htmlToImage from 'html-to-image';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { handleGetDietPlan } from "@/lib/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DietPlanOutput } from "@/ai/flows/get-personalized-diet-plan";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Separator } from "@/components/ui/separator";


import { getUserDietInfo } from "@/lib/actions";
import { useAuth } from "@/hooks/use-auth";

const dietFormSchema = z.object({
  date: z.string(),
  name: z.string(),
  email: z.string().email(),
  gender: z.string(),
  age: z.coerce.number().positive("Age must be positive"),
  height: z.coerce.number().positive("Height must be positive"),
  weight: z.coerce.number().positive("Weight must be positive"),
  lifestyle: z.string().min(1, "Please select a lifestyle"),
  foodPreference: z.string().min(1, "Please select a food preference"),
  cuisinePreferences: z.string().min(1, "Cuisine is required"),
  hasDiabetes: z.boolean().default(false),
  hasBloodPressure: z.boolean().default(false),
  hasThyroid: z.boolean().default(false),
  specialConditions: z.string().optional(),
});

type DietFormValues = z.infer<typeof dietFormSchema>;

export default function DietForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DietPlanOutput | null>(null);
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const dietPlanRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [searchCount, setSearchCount] = useState(0);
  const SEARCH_LIMIT = 3;

  const form = useForm<DietFormValues>({
    resolver: zodResolver(dietFormSchema),
    defaultValues: {
      date: new Date().toLocaleDateString('en-CA'),
      name: "",
      email: "",
      gender: "",
      age: 0,
      height: 170,
      weight: 70,
      lifestyle: "moderately_active",
      foodPreference: "",
      cuisinePreferences: "Any",
      hasDiabetes: false,
      hasBloodPressure: false,
      hasThyroid: false,
      specialConditions: "",
    },
  });

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSearchCount(userData.dietPlanSearchCount || 0);
          form.reset({
            ...form.getValues(),
            ...userData,
            email: user.email || '',
            date: new Date().toLocaleDateString('en-CA'),
          });
        } else {
            form.setValue('email', user.email || '');
            form.setValue('date', new Date().toLocaleDateString('en-CA'));
        }
      };
      fetchUserData();
    }
  }, [user, form]);

  const onSubmit = (values: DietFormValues) => {
    if (searchCount >= SEARCH_LIMIT) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: "You have reached your generation limit for diet plans.",
      });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const response = await handleGetDietPlan({...values, specialConditions: values.specialConditions || ""}, user?.uid);
      if (response.success && response.data) {
        setResult(response.data);
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const newCount = (searchCount || 0) + 1;
            await updateDoc(userDocRef, {
                dietPlanSearchCount: newCount
            });
            setSearchCount(newCount);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error,
        });
      }
    });
  };

  const handleExport = useCallback(async () => {
    if (!dietPlanRef.current || !user) {
      toast({
        title: "Error",
        description: "Cannot export diet plan. User not logged in or plan not generated.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const blob = await htmlToImage.toBlob(dietPlanRef.current, { cacheBust: true });

      if (!blob) {
        throw new Error("Failed to create image blob.");
      }

      const formData = new FormData();
      formData.append('file', blob, 'diet-plan.png');
      formData.append('folder', 'diet-plans');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image.');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.secure_url;

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        dietPlanUrl: arrayUnion({ 
          url: imageUrl,
          date: new Date().toISOString(),
        }),
      });

      // Trigger local download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'diet-plan.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Export Successful",
        description: "Your diet plan has been saved to your profile and downloaded.",
      });

    } catch (err) {
      console.error("Export failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Export failed",
        description: `Could not export the diet plan. ${errorMessage}`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [user, toast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <Card className="bg-background shadow-neumorphic">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Bot className="size-6 text-primary" />
            Your Personalized Diet Coach
          </CardTitle>
          <CardDescription>
            Fill in your details below to receive a custom diet plan generated by our AI.
          </CardDescription>
          <p className="text-sm text-muted-foreground pt-2">
            Generations remaining: {Math.max(0, SEARCH_LIMIT - searchCount)}/{SEARCH_LIMIT}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                                <Input {...field} className="bg-background shadow-neumorphic-inset" readOnly />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} className="bg-background shadow-neumorphic-inset" readOnly />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input {...field} className="bg-background shadow-neumorphic-inset" readOnly />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} className="bg-background shadow-neumorphic-inset" readOnly />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <FormControl>
                                <Input {...field} className="bg-background shadow-neumorphic-inset" readOnly />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 175" {...field} className="bg-background shadow-neumorphic-inset" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 70" {...field} className="bg-background shadow-neumorphic-inset" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifestyle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background shadow-neumorphic-inset">
                            <SelectValue placeholder="Select your activity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                          <SelectItem value="lightly_active">Lightly Active (light exercise/sports 1-3 days/week)</SelectItem>
                          <SelectItem value="moderately_active">Moderately Active (moderate exercise/sports 3-5 days/week)</SelectItem>
                          <SelectItem value="very_active">Very Active (hard exercise/sports 6-7 days a week)</SelectItem>
                          <SelectItem value="extra_active">Extra Active (very hard exercise/sports & physical job)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="foodPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Preference</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background shadow-neumorphic-inset">
                            <SelectValue placeholder="Select your diet type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="jain">Jain</SelectItem>
                          <SelectItem value="eggetarian">Eggetarian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cuisinePreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuisine Preferences</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Italian, Mexican, Indian" {...field} className="bg-background shadow-neumorphic-inset" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div>
                <FormLabel>Medical Conditions</FormLabel>
                <FormDescription className="text-xs mb-2">
                  Select any existing conditions.
                </FormDescription>
                <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="hasDiabetes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-neumorphic-inset">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Diabetes (Sugar)
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="hasBloodPressure"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-neumorphic-inset">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          High Blood Pressure
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="hasThyroid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-neumorphic-inset">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Thyroid
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                </div>
              </div>

               <FormField
                control={form.control}
                name="specialConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Conditions or Preferences</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Allergies, specific dietary needs..." {...field} className="bg-background shadow-neumorphic-inset" />
                    </FormControl>
                     <FormDescription>
                        Please list any other diseases, allergies, or special conditions, separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending || searchCount >= SEARCH_LIMIT} className="w-full shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
                {isPending ? <Loader2 className="animate-spin" /> : (searchCount >= SEARCH_LIMIT ? "Generation Limit Reached" : "Generate My Plan")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center">
        <Card className="w-full bg-background shadow-neumorphic">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                Your AI-Generated Diet Plan
              </CardTitle>
            </div>
                        {result && (
                            <Button onClick={handleExport} disabled={isExporting} size="sm" className="shadow-neumorphic active:shadow-neumorphic-inset transition-shadow duration-200">
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {isExporting ? 'Exporting...' : 'Export'}
                            </Button>
                        )}
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {isPending && (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Our AI is preparing your personalized plan...</p>
              </div>
            )}
            {result && (
               <div ref={dietPlanRef} className="bg-background p-6 rounded-md">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">Diet Plan for {form.getValues("name")}</h3>
                    <p className="text-sm text-muted-foreground">Email: {form.getValues("email")}</p>
                    <p className="text-sm text-muted-foreground">Gender: {form.getValues("gender")}</p>
                    <p className="text-sm text-muted-foreground">Date: {form.getValues("date")}</p>
                </div>
                 <div className="space-y-4">
                    {result.meals.map((meal, mealIndex) => (
                        <div key={mealIndex} className="p-4 rounded-lg bg-background shadow-neumorphic-inset">
                            <h4 className="font-semibold">{meal.meal_time} ({meal.calories} kcal)</h4>
                            <p className="text-muted-foreground text-sm">{meal.food_items}</p>
                        </div>
                    ))}
                </div>
                 
               </div>
            )}
            {!isPending && !result && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                 <Bot size={48} className="mb-4" />
                <p>Your personalized diet plan will appear here once generated.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}