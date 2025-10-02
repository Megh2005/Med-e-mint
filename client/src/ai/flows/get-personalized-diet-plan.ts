'use server';
/**
 * @fileOverview AI-powered personalized diet plan generator.
 *
 * - getPersonalizedDietPlan - A function that generates a personalized diet plan based on user input.
 * - PersonalizedDietPlanInput - The input type for the getPersonalizedDietPlan function.
 * - PersonalizedDietPlanOutput - The return type for the getPersonalizedDietPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedDietPlanInputSchema = z.object({
  height: z.number().describe('Your height in centimeters.'),
  weight: z.number().describe('Your weight in kilograms.'),
  age: z.number().describe('Your age in years.'),
  lifestyle: z
    .string()
    .describe(
      'Your lifestyle, e.g., sedentary, lightly active, moderately active, very active, or extra active.'
    ),
  cuisinePreferences: z
    .string()
    .describe('Your cuisine preferences, e.g., Italian, Mexican, Indian.'),
  foodPreference: z
    .string()
    .describe(
      'Your dietary preference, e.g., Vegetarian, Non-Vegetarian, Vegan, Jain.'
    ),
  specialConditions: z
    .string()
    .describe('Any other diseases or special conditions, comma-separated.'),
  hasDiabetes: z.boolean().describe('Whether the user has diabetes.'),
  hasBloodPressure: z.boolean().describe('Whether the user has high blood pressure.'),
  hasThyroid: z.boolean().describe('Whether the user has a thyroid condition.'),
});
export type PersonalizedDietPlanInput = z.infer<
  typeof PersonalizedDietPlanInputSchema
>;

const MealSchema = z.object({
    meal_time: z.string().describe('e.g., Breakfast, Lunch, Dinner, Snack'),
    food_items: z.string().describe('A comma-separated list of food items for the meal.'),
    calories: z.number().describe('Estimated calories for the meal.'),
});

const PersonalizedDietPlanOutputSchema = z.object({
    meals: z.array(MealSchema).describe('A set of meals for a single day.'),
});

export type DietPlanOutput = z.infer<typeof PersonalizedDietPlanOutputSchema>;

export async function getPersonalizedDietPlan(
  input: PersonalizedDietPlanInput
): Promise<DietPlanOutput> {
  return personalizedDietPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedDietPlanPrompt',
  input: {schema: PersonalizedDietPlanInputSchema},
  output: {schema: PersonalizedDietPlanOutputSchema},
  prompt: `You are a registered dietitian. Generate a personalized diet plan for a single day based on the user's details.

User Details:
Height: {{height}} cm
Weight: {{weight}} kg
Age: {{age}} years
Lifestyle: {{lifestyle}}
Cuisine Preferences: {{cuisinePreferences}}
Food Preference: {{foodPreference}}
{{#if hasDiabetes}}
- The user has Diabetes. The diet should be sugar-free and low-carb.
{{/if}}
{{#if hasBloodPressure}}
- The user has High Blood Pressure. The diet should be low in sodium.
{{/if}}
{{#if hasThyroid}}
- The user has a Thyroid condition. The diet should include iodine-rich foods and avoid goitrogens.
{{/if}}
{{#if specialConditions}}
Other conditions: {{specialConditions}}
{{/if}}

IMPORTANT: The diet plan MUST be strictly {{foodPreference}}.

Based on the above, create a detailed diet plan for a single day. Provide a list of meals (Breakfast, Lunch, Dinner, and optional snacks). For each meal, list the food items and an estimated calorie count.
Ensure the output is in the specified JSON format.`,
});

const personalizedDietPlanFlow = ai.defineFlow(
  {
    name: 'personalizedDietPlanFlow',
    inputSchema: PersonalizedDietPlanInputSchema,
    outputSchema: PersonalizedDietPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
