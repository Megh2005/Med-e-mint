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
  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [referredDoctor, setReferredDoctor] = useState("");
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
    const fetchUsers = async () => {
      if (user?.role !== "doctor") return;

      try {
        const usersRef = collection(db, "users");
        
        // Fetch patients
        const patientQuery = query(usersRef, where("role", "==", "patient"));
        const patientSnapshot = await getDocs(patientQuery);
        const patientsData = patientSnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...(doc.data() as Omit<UserProfile, "uid">),
        }));
        setPatients(patientsData);

        // Fetch doctors
        const doctorQuery = query(usersRef, where("role", "==", "doctor"));
        const doctorSnapshot = await getDocs(doctorQuery);
        const doctorsData = doctorSnapshot.docs
          .map((doc) => ({
            uid: doc.id,
            ...(doc.data() as Omit<UserProfile, "uid">),
          }))
          .filter(doctor => doctor.uid !== user.uid); // Exclude current doctor
        setDoctors(doctorsData);

      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not load patient/doctor lists.",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
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
      const prescriptionData: any = {
        doctorId: user?.uid,
        patientId: selectedPatientData.uid,
        doctorName: user?.name || user?.email,
        patientName: selectedPatientData.name || selectedPatientData.email,
        diseaseDetails,
        labTests,
        medications,
        additionalNotes,
        dateTime: currentDateTime,
      };

      if (referredDoctor) {
        prescriptionData.referredDoctorId = referredDoctor;
      }

      await addDoc(prescriptionsCollection, prescriptionData);

      toast({
        title: "Prescription Saved",
        description: `Prescription for ${selectedPatientData.name} has been saved.`,
      });

      // Send email to patient
      if (selectedPatientData.email) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: [{ email: selectedPatientData.email }],
            subject: `New Prescription from ${user?.name || 'your doctor'}`,
            htmlContent: `<p>Dear ${selectedPatientData.name},</p><p>You have received a new prescription from Dr. ${user?.name || 'your doctor'}.</p><p>Please log in to your Med-e-Mint account to view the details.</p><p>Best regards,<br/> Med-e-Mint Team</p>`,
          }),
        }).catch(emailError => console.error("Failed to send patient email:", emailError));
      }

      // Send email to referred doctor
      if (referredDoctor) {
        const referredDoctorData = doctors.find(d => d.uid === referredDoctor);
        if (referredDoctorData?.email) {
          try {
            await fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipients: [{ email: referredDoctorData.email }],
                subject: `Patient Referral from Dr. ${user?.name}`,
                htmlContent: `
                  <p>Dear Dr. ${referredDoctorData.name},</p>
                  <p>You have received a patient referral from Dr. ${user?.name}.</p>
                  <h3>Patient Details:</h3>
                  <p><strong>Name:</strong> ${selectedPatientData.name}</p>
                  <h3>Prescription Details:</h3>
                  <p><strong>Diagnosis:</strong> ${diseaseDetails}</p>
                  <p><strong>Lab Tests:</strong> ${labTests || 'N/A'}</p>
                  <p><strong>Medications:</strong></p>
                  <div>${medications}</div>
                  <p><strong>Additional Notes:</strong> ${additionalNotes || 'N/A'}</p>
                  <p>Please review the case at your earliest convenience.</p>
                  <p>Best regards,<br/> Med-e-Mint Team</p>
                `,
              }),
            });
            toast({
              title: "Referral Email Sent",
              description: `An email has been sent to Dr. ${referredDoctorData.name}.`,
            });
          } catch (emailError) {
            console.error("Failed to send referral email:", emailError);
            toast({
              title: "Referral Email Error",
              description: "Failed to send referral notification email.",
              variant: "destructive",
            });
          }
        }
      }

      // Reset form fields
      setSelectedPatient("");
      setReferredDoctor("");
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

          {/* Refer to Doctor (Optional) */}
          <div>
            <label
              htmlFor="doctor-refer-select"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Refer to Doctor{" "}
              <span className="text-xs text-muted-foreground/70">
                (Optional)
              </span>
            </label>
            <select
              id="doctor-refer-select"
              value={referredDoctor}
              onChange={(e) => setReferredDoctor(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-black"
            >
              <option value="">Select a doctor to refer...</option>
              {doctors.map((doctor) => (
                <option key={doctor.uid} value={doctor.uid}>
                  {doctor.name} ({doctor.specialization || 'General'})
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
