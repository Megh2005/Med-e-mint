import PrescriptionForm from "./prescription-form";

export default function PrescriptionScannerPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground">Prescription Scanner</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload an image of your prescription, and our AI will extract the details for you in seconds.
        </p>
      </div>
      <PrescriptionForm />
    </div>
  );
}
