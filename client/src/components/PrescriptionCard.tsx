import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PrescriptionCardProps {
  prescription: any;
  userRole: "doctor" | "patient";
}

export default function PrescriptionCard({
  prescription,
  userRole,
}: PrescriptionCardProps) {
  return (
    <Card className="shadow-neumorphic-sm">
      <CardHeader>
        <CardTitle className="text-xl font-headline">
          {userRole === "doctor"
            ? `To: ${prescription.patientName}`
            : `From: Dr. ${prescription.doctorName}`}
        </CardTitle>
        <CardDescription>{prescription.dateTime}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">Diagnosis</h4>
          <p className="text-muted-foreground">{prescription.diseaseDetails}</p>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold">Medications</h4>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {prescription.medications}
          </p>
        </div>
        {prescription.labTests && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold">Lab Tests</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {prescription.labTests}
              </p>
            </div>
          </>
        )}
        {prescription.additionalNotes && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold">Additional Notes</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {prescription.additionalNotes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
