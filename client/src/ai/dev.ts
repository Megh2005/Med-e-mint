import { config } from 'dotenv';
config();

import '@/ai/flows/scan-prescription-and-extract-details.ts';
import '@/ai/flows/get-personalized-diet-plan.ts';