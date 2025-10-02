"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  inquiryType: z.string({ required_error: "Please select a reason for contacting us." }),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactUsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      inquiryType: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const adminEmail = "iammeghdeb@gmail.com";

    const userEmailSubject = `Thank you for your inquiry (Ticket: ${ticketId})`;
    const userEmailHtmlContent = `
        <h1>Thank You for Reaching Out!</h1>
        <p>Dear ${values.name},</p>
        <p>We have received your message and will get back to you shortly. Your ticket ID is <strong>${ticketId}</strong>.</p>
        <p>Here's a summary of your inquiry:</p>
        <ul>
            <li><strong>Name:</strong> ${values.name}</li>
            <li><strong>Email:</strong> ${values.email}</li>
            <li><strong>Phone:</strong> ${values.phone || 'Not provided'}</li>
            <li><strong>Inquiry Type:</strong> ${values.inquiryType}</li>
            <li><strong>Subject:</strong> ${values.subject}</li>
            <li><strong>Message:</strong></li>
        </ul>
        <p>${values.message}</p>
        <br/>
        <p>Best regards,</p>
        <p>The Med-E-Mint Team</p>
    `;

    const adminEmailSubject = `New Contact Form Submission (Ticket: ${ticketId})`;
    const adminEmailHtmlContent = `
        <h1>New Inquiry Received</h1>
        <p>A new message has been submitted through the contact form.</p>
        <h2>Details:</h2>
        <ul>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
            <li><strong>Name:</strong> ${values.name}</li>
            <li><strong>Email:</strong> ${values.email}</li>
            <li><strong>Phone:</strong> ${values.phone || 'Not provided'}</li>
            <li><strong>Inquiry Type:</strong> ${values.inquiryType}</li>
            <li><strong>Subject:</strong> ${values.subject}</li>
        </ul>
        <h2>Message:</h2>
        <p>${values.message}</p>
    `;

    try {
      // Send email to user
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ email: values.email }],
          subject: userEmailSubject,
          htmlContent: userEmailHtmlContent,
        }),
      });

      // Send email to admin
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ email: adminEmail }],
          subject: adminEmailSubject,
          htmlContent: adminEmailHtmlContent,
        }),
      });

      toast({
        title: "Message Sent!",
        description: "We've received your message and will get back to you soon.",
      });
      form.reset();
    } catch (error) {
      console.error("Failed to send email:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">Contact Us</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <Card className="bg-background shadow-neumorphic">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} className="bg-background shadow-neumorphic-inset" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 (555) 123-4567" {...field} className="bg-background shadow-neumorphic-inset" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inquiryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Contact</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background shadow-neumorphic-inset">
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General Inquiry</SelectItem>
                              <SelectItem value="support">Technical Support</SelectItem>
                              <SelectItem value="billing">Billing Question</SelectItem>
                              <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                              <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help?" {...field} className="bg-background shadow-neumorphic-inset" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Please provide details here..." {...field} className="bg-background resize-none shadow-neumorphic-inset min-h-[150px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full shadow-neumorphic active:shadow-neumorphic-inset" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
            <Card className="bg-background shadow-neumorphic p-6">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="font-headline text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="flex items-start gap-4">
                        <MapPin className="size-5 text-primary mt-1" />
                        <div>
                            <h4 className="font-semibold">Our Office</h4>
                            <p className="text-muted-foreground text-sm">Nimta Sarat Pally, Nadikul Road, India, West Bengal, Kolkata-700049</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="size-5 text-primary mt-1" />
                        <div>
                            <h4 className="font-semibold">Phone</h4>
                            <p className="text-muted-foreground text-sm">+91 89107 29279</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Mail className="size-5 text-primary mt-1" />
                        <div>
                            <h4 className="font-semibold">Email</h4>
                            <p className="text-muted-foreground text-sm">iammeghdeb@gmail.com</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
