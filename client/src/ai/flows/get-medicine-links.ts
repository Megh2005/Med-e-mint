'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMedicineLinksInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine to find links for.'),
});
export type GetMedicineLinksInput = z.infer<typeof GetMedicineLinksInputSchema>;

const PharmacyLinkSchema = z.object({
  pharmacyName: z.string().describe('The name of the online pharmacy.'),
  link: z.string().describe('The direct URL to buy the medicine.'),
});

const GetMedicineLinksOutputSchema = z.object({
  links: z.array(PharmacyLinkSchema).describe('An array of pharmacy links for the medicine.'),
});
export type GetMedicineLinksOutput = z.infer<typeof GetMedicineLinksOutputSchema>;

export async function getMedicineLinks(
  input: GetMedicineLinksInput
): Promise<GetMedicineLinksOutput> {
  return getMedicineLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMedicineLinksPrompt',
  input: {schema: GetMedicineLinksInputSchema},
  output: {schema: GetMedicineLinksOutputSchema},
  prompt: `You are an expert web scraping assistant. You will be provided with a medicine name. Your task is to generate direct search URLs for this medicine on popular online pharmacies in India.

1.  Consider the following major online pharmacies: Tata 1mg.
2.  For each pharmacy, construct a full, valid, and working search URL for the given medicine name.
    -   For Tata 1mg, the URL format is \`https://www.1mg.com/search/all?name=MEDICINE_NAME\`
3.  Replace \`MEDICINE_NAME\` with the provided medicine name. Ensure the medicine name is properly URL-encoded (e.g., spaces become %20).
4.  Return a JSON object containing a list of these links. Each object in the list should have a 'pharmacyName' and a 'link'.

Example for 'Calpol 500mg':
{
  "links": [
    {
      "pharmacyName": "Tata 1mg",
      "link": "https://www.1mg.com/search/all?name=Calpol%20500mg"
    }
  ]
}

Medicine Name: {{medicineName}}`,
});

const getMedicineLinksFlow = ai.defineFlow(
  {
    name: 'getMedicineLinksFlow',
    inputSchema: GetMedicineLinksInputSchema,
    outputSchema: GetMedicineLinksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
