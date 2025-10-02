'use server';
/**
 * @fileOverview Scans a prescription image and extracts detailed medication information.
 *
 * - scanPrescriptionAndExtractDetails - A function that takes a prescription image data URI and returns extracted details for all medications found.
 * - ScanPrescriptionInput - The input type for the scanPrescriptionAndExtractDetails function.
 * - ScanPrescriptionOutput - The return type for the scanPrescriptionAndExtractDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanPrescriptionInputSchema = z.object({
  prescriptionDataUri: z
    .string()
    .describe(
      'A photo of a prescription, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type ScanPrescriptionInput = z.infer<typeof ScanPrescriptionInputSchema>;

const MedicationDetailsSchema = z.object({
    name: z.string().describe('The name of the medication.'),
    dosage: z.string().describe('The dosage of the medication.'),
    frequency: z.string().describe('The frequency at which the medication should be taken.'),
    composition: z.string().describe('The active chemical composition of the medication.'),
    purpose: z.string().describe('The reason or purpose for which this medicine is prescribed, explained in simple terms.'),
    sideEffects: z.string().describe('A comma-separated list of common, basic side effects of the medication.'),
});

const ScanPrescriptionOutputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  medications: z.array(MedicationDetailsSchema).describe('An array of all medications found on the prescription.'),
});
export type ScanPrescriptionOutput = z.infer<typeof ScanPrescriptionOutputSchema>;

export async function scanPrescriptionAndExtractDetails(
  input: ScanPrescriptionInput
): Promise<ScanPrescriptionOutput> {
  return scanPrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanPrescriptionPrompt',
  input: {schema: ScanPrescriptionInputSchema},
  output: {schema: ScanPrescriptionOutputSchema},
  prompt: `You are an expert pharmacist and medical analyst. You will be provided with an image of a prescription. Your tasks are:
1. Extract the patient's name. If not available, return "Not available".
2. Identify EACH and EVERY medication listed on the prescription.
3. For each medication, extract the following details:
    - The medication name.
    - The dosage (e.g., "500mg", "1 tablet").
    - The frequency (e.g., "Once a day", "Twice a day before food").
4. Using your knowledge base, provide the following for each medication:
    - The medical composition (the active ingredients).
    - The purpose of the medicine, explained in simple, easy-to-understand terms.
    - A list of common, basic side effects.
5. Decode any complex medical jargon into simple terms within your explanations.
6. Format the output as a JSON object with the patient's name and a list of all extracted medication details.

Prescription Image: {{media url=prescriptionDataUri}}`,
});

const scanPrescriptionFlow = ai.defineFlow(
  {
    name: 'scanPrescriptionFlow',
    inputSchema: ScanPrescriptionInputSchema,
    outputSchema: ScanPrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
