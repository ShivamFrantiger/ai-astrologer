'use server';
/**
 * @fileOverview A flow for generating horoscopes.
 *
 * - generateHoroscope - A function that handles the horoscope generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  HoroscopeInputSchema,
  HoroscopeOutputSchema,
  type HoroscopeInput,
  type HoroscopeOutput,
} from '@/ai/schemas/horoscope';

export async function generateHoroscope(
  input: HoroscopeInput
): Promise<HoroscopeOutput> {
  return generateHoroscopeFlow(input);
}

const horoscopePrompt = ai.definePrompt({
  name: 'horoscopePrompt',
  input: {schema: HoroscopeInputSchema},
  output: {schema: HoroscopeOutputSchema},
  prompt: `Generate a short, engaging horoscope for the zodiac sign '{{{sign}}}' for the following period: '{{{period}}}'.
The horoscope should be 2-3 sentences long and provide some fun, positive guidance.`,
});

const generateHoroscopeFlow = ai.defineFlow(
  {
    name: 'generateHoroscopeFlow',
    inputSchema: HoroscopeInputSchema,
    outputSchema: HoroscopeOutputSchema,
  },
  async (input) => {
    const {output} = await horoscopePrompt(input);
    return output!;
  }
);
