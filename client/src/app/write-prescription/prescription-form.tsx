"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, UserProfile } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, prescriptionsCollection } from "@/lib/firebase";
import MDEditor from '@uiw/react-md-editor';

export default function PrescriptionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [diseaseDetails, setDiseaseDetails] = useState("");
  const [labTests, setLabTests] = useState("");
  const [medications, setMedications] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    // Set current date and time
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentDateTime(formatted);
    };

    updateDateTime();
    // Update every minute
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "patient"));
        const querySnapshot = await getDocs(q);
        const patientsData = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...(doc.data() as Omit<UserProfile, "uid">),
        }));
        setPatients(patientsData);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not load patient list.",
          variant: "destructive",
        });
      }
    };

    if (user?.role === "doctor") {
      fetchPatients();
    }
  }, [user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPatientData = patients.find((p) => p.uid === selectedPatient);

    if (!selectedPatientData || !diseaseDetails.trim() || !medications.trim()) {
      toast({
        title: "Missing Information",
        description:
          "Please select a patient, fill in disease details, and add medications.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await addDoc(prescriptionsCollection, {
        doctorId: user?.uid,
        patientId: selectedPatientData.uid,
        doctorName: user?.name || user?.email,
        patientName: selectedPatientData.name || selectedPatientData.email,
        diseaseDetails,
        labTests,
        medications,
        additionalNotes,
        dateTime: currentDateTime,
      });

      toast({
        title: "Prescription Saved",
        description: `Prescription for ${selectedPatientData.name} has been saved.`,
      });

      // Reset form fields
      setSelectedPatient("");
      setDiseaseDetails("");
      setLabTests("");
      setMedications("");
      setAdditionalNotes("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not save the prescription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-neumorphic-inset">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Write Prescription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Display */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Date & Time
            </label>
            <Input
              type="text"
              value={currentDateTime}
              readOnly
              className="w-full bg-muted/50 shadow-neumorphic-inset cursor-not-allowed"
            />
          </div>

          {/* Patient Selection */}
          <div>
            <label
              htmlFor="patient-select"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Select Patient <span className="text-destructive">*</span>
            </label>
            <select
              id="patient-select"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
            >
              <option value="" disabled>
                Select a patient...
              </option>
              {patients.map((patient) => (
                <option key={patient.uid} value={patient.uid}>
                  {patient.name} ({patient.email})
                </option>
              ))}
            </select>
          </div>

          {/* Disease Details */}
          <div>
            <label
              htmlFor="disease-details"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Disease/Diagnosis Details{" "}
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="disease-details"
              rows={4}
              value={diseaseDetails}
              onChange={(e) => setDiseaseDetails(e.target.value)}
              placeholder="e.g., Acute Upper Respiratory Tract Infection, Fever with cough..."
              className="w-full resize-none text-base bg-background shadow-neumorphic-inset transition-shadow"
              disabled={isLoading}
            />
          </div>

          {/* Lab Tests (Optional) */}
          <div>
            <label
              htmlFor="lab-tests"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Lab Tests Recommended{" "}
              <span className="text-xs text-muted-foreground/70">
                (Optional)
              </span>
            </label>
            <Textarea
              id="lab-tests"
              rows={3}
              value={labTests}
              onChange={(e) => setLabTests(e.target.value)}
              placeholder="e.g., Complete Blood Count (CBC), Chest X-ray, Blood Sugar (Fasting)..."
              className="w-full resize-none text-base bg-background shadow-neumorphic-inset transition-shadow"
              disabled={isLoading}
            />
          </div>

          {/* Medications */}
          <div>
            <label
              htmlFor="medications"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Medications <span className="text-destructive">*</span>
            </label>
            <div data-color-mode="light">
              <MDEditor
                value={medications}
                onChange={(value) => setMedications(value || "")}
                preview="edit"
                height={200}
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label
              htmlFor="additional-notes"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Additional Notes/Instructions{" "}
              <span className="text-xs text-muted-foreground/70">
                (Optional)
              </span>
            </label>
            <Textarea
              id="additional-notes"
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g., Follow-up after 3 days, Drink plenty of fluids, Rest advised..."
              className="w-full resize-none text-base bg-background shadow-neumorphic-inset transition-shadow"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full shadow-neumorphic active:shadow-neumorphic-inset"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Prescription"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
