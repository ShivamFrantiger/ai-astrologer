/**
 * @fileOverview Schemas and types for the horoscope generation flow.
 */
import {z} from 'genkit';

export const HoroscopeInputSchema = z.object({
  sign: z.string().describe('The zodiac sign for the horoscope.'),
  period: z
    .string()
    .describe('The time period for the horoscope (e.g., Daily, Weekly).'),
});

export type HoroscopeInput = z.infer<typeof HoroscopeInputSchema>;

export const HoroscopeOutputSchema = z.object({
  horoscope: z.string().describe('The generated horoscope text.'),
});

export type HoroscopeOutput = z.infer<typeof HoroscopeOutputSchema>;
