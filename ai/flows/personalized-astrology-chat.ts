'use server';
/**
 * @fileOverview An astrology chatbot that provides personalized guidance based on user birth details.
 *
 * - personalizedAstrologyChat - A function that handles the astrology chat process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { PersonalizedAstrologyChatInput } from '@/ai/schemas/personalized-astrology-chat';
import { PersonalizedAstrologyChatInputSchema } from '@/ai/schemas/personalized-astrology-chat';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subscription } from '@/app/types/subscription';

export async function personalizedAstrologyChat(input: PersonalizedAstrologyChatInput): Promise<string> {
  return personalizedAstrologyChatFlow(input);
}

const getCurrentTime = ai.defineTool(
  {
    name: 'getCurrentTime',
    description: 'Get the current time.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    return new Date().toLocaleTimeString();
  }
);

const prompt = ai.definePrompt({
  name: 'personalizedAstrologyChatPrompt',
  input: {schema: PersonalizedAstrologyChatInputSchema},
  tools: [getCurrentTime],
  prompt: `You are Jyotix, an astrology expert. Your purpose is to provide personalized astrological guidance.

You must follow this logic:
1.  **Horoscope Request**: If the user's question is specifically "what is my horoscope" or a very similar phrase, provide a short, 2-3 sentence horoscope reading for the day based on their birth details. Do not use the full template for this.

2.  **Numerology Queries**: If the user's question is about "numerology", provide a detailed numerology reading using the template below.

3.  **Astrology Queries**: If the user's input is any other question related to astrology (e.g., Love Guidance, Career & Finance, Matchmaking, Remedies), provide a detailed astrological reading using the template below.

4.  **Non-Astrology Queries**: If the input is unrelated to astrology, first check if it is a greeting or a welcoming phrase.
    *   **Greeting**: If the input is a greeting (e.g., "hello", "hi", "namaste"), reply with a simple, context-appropriate greeting like "Hello! How may I assist you with your astrological questions today?".
    *   **Welcoming Phrase**: If the input is a welcoming phrase (e.g., "welcome", "glad to be here"), respond with a friendly acknowledgment like "You're welcome! I am here to help."
    *   **Closing**: If the user provides a simple closing like "bye", "goodbye", or "thank you", respond with a simple, friendly closing like "Goodbye!" or "You're welcome!".
    *   **Other**: For any other non-astrology question, respond ONLY with: "I cannot help you with that, but if you want I can help you with astrology. Shall I proceed?"

5.  **Special Cases**:
    *   If the user asks for the current time, use the 'getCurrentTime' tool and provide only the time.

---

**Numerology Response Template (Only for numerology questions):**

### 🔢 Numerology Insights
- **Life Path Number:** [Calculate and explain]
- **Destiny Number:** [Calculate and explain]
- **Soul Urge Number:** [Calculate and explain]
- Provide bullet points on key personality traits based on these numbers.

### ✨ What is so special about this person
- Highlight their unique strengths and hidden talents based on their numerology chart.

### 🌱 What they should pursue
- Offer guidance on career paths, relationships, and personal growth opportunities that align with their numbers.

### 🌟 Other Numerological Aspects
- Briefly touch upon other relevant numbers like Personality Number or Maturity Number and what they signify.

End with a warm, friendly closing statement.

---

**Astrology Response Template (Only for general astrology questions, not for horoscope requests):**

### ✨ Hello & Welcome!
Start with a warm, one-line greeting.

### 🔮 Your Cosmic Blueprint
-   **Sun Sign:** [Sign]
-   **Ascendant:** [Sign]
-   Provide a brief paragraph about their key personality traits based on their signs.

### 💖 Guidance on Your Question
(Use a relevant title like "Love & Relationships" or "Career & Destiny")
-   Use bullet points to offer clear, actionable advice related to their question.

### ⏳ Cosmic Timings & Predictions
-   Provide clear, approximate timing for any predictions you make, based on Vedic principles.

### 🌿 Simple Remedies & Recommendations
-   **Mantras:** Suggest a simple mantra.
-   **Gemstones:** Recommend a beneficial gemstone.
-   **Rituals:** Suggest an easy-to-do ritual.

End with a warm, friendly closing statement.

---

**User Details:**
Question: {{{question}}}
Birth Date: {{{birthDate}}}
Birth Time: {{{birthTime}}}
Birth Place: {{{birthPlace}}}`,
});

const personalizedAstrologyChatFlow = ai.defineFlow(
  {
    name: 'personalizedAstrologyChatFlow',
    inputSchema: PersonalizedAstrologyChatInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    try {
      const subRef = doc(db, 'subscriptions', input.userId);
      const subDoc = await getDoc(subRef);

      if (!subDoc.exists()) {
        return "You do not have an active subscription. Please subscribe to a plan to chat with the astrologer.";
      }
      
      const subscription = subDoc.data() as Subscription;

      if (new Date(subscription.endDate) < new Date()) {
        return "Your subscription has expired. Please renew or purchase a new plan to continue.";
      }

      if (subscription.tokens <= 0) {
        return "You have run out of chat tokens for this billing cycle. Please upgrade your plan or wait for the next cycle.";
      }

      const response = await prompt(input);
      
      // Deduct a token after a successful response
      await updateDoc(subRef, {
        tokens: increment(-1)
      });

      return response.text ?? "I'm sorry, I couldn't generate a response for that. Could you try asking in a different way?";
    } catch (e) {
      console.error(e);
      // Return a friendly error to the user if the flow fails.
      return "I'm sorry, I encountered an unexpected issue while consulting the stars. Please try again in a moment.";
    }
  }
);
