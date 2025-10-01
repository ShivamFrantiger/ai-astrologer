/**
 * @fileOverview Schemas and types for the chat flow.
 */
import {z} from 'genkit';

export const ChatInputSchema = z.object({
  question: z.string().describe('The user question for the AI.'),
});

export type ChatInput = z.infer<
  typeof ChatInputSchema
>;
