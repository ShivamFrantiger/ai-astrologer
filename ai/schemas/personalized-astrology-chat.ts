/**
 * @fileOverview Schemas and types for the personalized astrology chat flow.
 */
import {z} from 'genkit';

export const PersonalizedAstrologyChatInputSchema = z.object({
  question: z.string().describe('The user question for the astrologer.'),
  birthDate: z.string().describe("The user's birth date."),
  birthTime: z.string().describe("The user's birth time."),
  birthPlace: z.string().describe("The user's birth place."),
  userId: z.string().describe("The user's ID."),
  kundliContext: z.string().optional().describe("Serialized Kundli chart JSON context without chartSvg."),
});

export type PersonalizedAstrologyChatInput = z.infer<
  typeof PersonalizedAstrologyChatInputSchema
>;
