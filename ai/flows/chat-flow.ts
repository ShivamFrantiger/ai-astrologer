'use server';
/**
 * @fileOverview A simple AI chatbot.
 *
 * - chat - A function that handles the chat process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ChatInput } from '@/ai/schemas/chat';
import { ChatInputSchema } from '@/ai/schemas/chat';

export async function chat(input: ChatInput): Promise<string> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  prompt: `You are a helpful AI assistant. Respond to the user's question.

Question: {{{question}}}`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    try {
      const response = await prompt(input);
      return response.text ?? "I'm sorry, I couldn't generate a response. Could you try asking in a different way?";
    } catch (e) {
      console.error(e);
      return "I'm sorry, I encountered an unexpected issue. Please try again in a moment.";
    }
  }
);
