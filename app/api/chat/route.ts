import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JYOTIX_CHAT_SYSTEM_PROMPT } from '@/lib/chat/systemPrompt';
import { buildCompactKundliContext } from '@/lib/chat/context';
import {
  executeGenerateKundli,
  executeGetSavedKundli,
  executeGetTransits,
  executeMatchRules,
} from '@/lib/chat/tools';
import { NormalizedKundli } from '@/lib/kundli/types';
import { getServiceById } from '@/lib/chat/services';
import { retrieveAstrologyKnowledge } from '@/lib/rag/retriever';

const ParsedBirthSchema = z.object({
  hasBirthInfo: z.boolean(),
  date: z.string().optional(), // YYYY-MM-DD
  time: z.string().optional(), // HH:mm
  place: z.string().optional(),
  label: z.string().optional(),
  isApproximateTime: z.boolean().optional(),
  isConfirmation: z.boolean().optional(),
  isDenial: z.boolean().optional(),
  topic: z
    .enum(['business_career', 'marriage', 'finance', 'education', 'health_general', 'general'])
    .optional(),
});

// Helper: Call Gemini REST API directly
async function callGemini(params: {
  systemInstruction?: string;
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
  ];
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body: any = {
        contents: params.contents,
        generationConfig: {
          temperature: params.temperature ?? 0.4,
          topP: params.topP ?? 0.9,
          ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
        },
      };

      if (params.systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: params.systemInstruction }],
        };
      }

      if (params.responseMimeType) {
        body.generationConfig.responseMimeType = params.responseMimeType;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Model ${model} returned ${res.status}: ${errText.slice(0, 100)}. Trying fallback...`);
        lastError = new Error(`Gemini API error (${res.status}): ${errText}`);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} fetch failed: ${err.message}. Trying next candidate...`);
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to generate response.');
}

interface StructuredReply {
  bubbles: string[];
  quickReplies: string[];
  chartFactors?: string[];
  needsTool?: string;
}

function parseStructuredReply(rawText: string): StructuredReply {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.bubbles) && parsed.bubbles.length > 0) {
      return {
        bubbles: parsed.bubbles.map((b: any) => String(b).trim()).filter(Boolean),
        quickReplies: Array.isArray(parsed.quickReplies)
          ? parsed.quickReplies.map((q: any) => String(q).trim()).filter(Boolean).slice(0, 3)
          : [],
        chartFactors: Array.isArray(parsed.chartFactors)
          ? parsed.chartFactors.map((f: any) => String(f).trim()).filter(Boolean)
          : [],
        needsTool: parsed.needsTool,
      };
    }
  } catch (e) {
    // Robust fallback: check if text contains "bubbles": [ ... ]
    const match = rawText.match(/"bubbles"\s*:\s*\[([\s\S]*?)\]/);
    if (match) {
      try {
        const parsedBubbles = JSON.parse(`[${match[1]}]`);
        if (Array.isArray(parsedBubbles) && parsedBubbles.length > 0) {
          return {
            bubbles: parsedBubbles.map((b: any) => String(b).trim()).filter(Boolean),
            quickReplies: ['Detail mein batao', 'Upaay bataun?', 'Career ke bare mein'],
          };
        }
      } catch (err) {}
    }
  }

  const paras = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return {
    bubbles: paras.length > 0 ? paras.slice(0, 3) : [rawText.trim()],
    quickReplies: ['Detail mein batao', 'Upaay bataun?', 'Career ke bare mein'],
  };
}

function countWords(bubbles: string[]): number {
  return bubbles.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

function hasViolations(bubbles: string[], isDetail: boolean): boolean {
  const words = countWords(bubbles);
  if (!isDetail && words > 100) return true;
  if (bubbles.some((b) => /\[[A-Z0-9_\-]+\]/.test(b))) return true;
  if (bubbles.some((b) => /(^#{1,6}\s+|^\s*[\*\-•]\s+)/m.test(b))) return true;
  return false;
}

function sanitizeBubbles(bubbles: string[], isDetail: boolean): string[] {
  let cleaned = bubbles
    .map((b) =>
      b
        .replace(/\[[A-Z0-9_\-]+\]/g, '') // strip rule IDs like [MAR-004]
        .replace(/^#{1,6}\s+/gm, '') // strip markdown headers
        .replace(/^\s*[\*\-•]\s+/gm, '') // strip bullet lists
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter(Boolean);

  if (!isDetail && countWords(cleaned) > 70) {
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(0, 2);
    }
    if (countWords(cleaned) > 70) {
      const allWords = cleaned.join(' ').split(/\s+/);
      const capped = allWords.slice(0, 68).join(' ') + '...';
      if (cleaned.length === 1) {
        cleaned = [capped];
      } else {
        cleaned = [cleaned[0], capped.slice(cleaned[0].length).trim()];
      }
    }
  }
  return cleaned;
}

function buildUserFactsBlock(
  kundli: NormalizedKundli,
  chatHistory?: Array<{ sender: string; text: string }>
): string {
  const bYear = parseInt(kundli.birth.date?.slice(0, 4) || '', 10);
  const age = !isNaN(bYear) ? `${new Date().getFullYear() - bYear} years` : 'Not specified';

  let relationship = 'Not stated';
  let profession = 'Not stated';
  const topicsAsked = new Set<string>();

  if (chatHistory && Array.isArray(chatHistory)) {
    const allText = chatHistory.map((h) => h.text).join(' ');
    if (/gf|girlfriend/i.test(allText)) relationship = 'Has girlfriend';
    else if (/bf|boyfriend/i.test(allText)) relationship = 'Has boyfriend';
    else if (/wife|patni|biwi|shadi ho gayi|married/i.test(allText)) relationship = 'Married';
    else if (/single|unmarried/i.test(allText)) relationship = 'Single';

    if (/business|startup|dukaan/i.test(allText)) profession = 'Business / Startup';
    else if (/job|naukri|engineer|developer|doctor|ca|corporate/i.test(allText)) profession = 'Job / Corporate';

    if (/shadi|marriage|vivah|rishta|gf/i.test(allText)) topicsAsked.add('Marriage / Love');
    if (/business|career|job|naukri/i.test(allText)) topicsAsked.add('Career / Business');
    if (/paisa|dhan|money|wealth/i.test(allText)) topicsAsked.add('Finance');
    if (/padhai|education|exam/i.test(allText)) topicsAsked.add('Education');
  }

  let dashaDataStr = 'NO TIMELINE DATES AVAILABLE (DO NOT invent timing or years; say "exact time chart se clear nahi hai")';
  if (kundli.dasha?.periods && kundli.dasha.periods.length > 0) {
    dashaDataStr = kundli.dasha.periods
      .map((p) => {
        let s = `${p.planet} (${p.start} to ${p.end})`;
        if (p.antardasha && p.antardasha.length > 0) {
          s += ` [Sub: ${p.antardasha.map((a) => `${a.planet}: ${a.start} - ${a.end}`).join(', ')}]`;
        }
        return s;
      })
      .join(' | ');
  }

  return `USER FACTS:
- Name: ${kundli.label || 'Friend'}
- Age: ${age} (Born: ${kundli.birth.date}, ${kundli.birth.time}, ${kundli.birth.place})
- Lagna: ${kundli.ascendant.sign} (${kundli.ascendant.degree}°)
- Moon Sign (Rashi): ${kundli.moonSign}
- Running Mahadasha: ${kundli.dasha?.currentMahadasha || 'None'}, Antardasha: ${kundli.dasha?.currentAntardasha || 'None'}
- Dasha Data Timeline: ${dashaDataStr}
- Relationship Status: ${relationship}
- Profession: ${profession}
- Topics Asked Before: ${topicsAsked.size > 0 ? Array.from(topicsAsked).join(', ') : 'None yet'}`;
}

// Intake parser: Analyzes natural text into structured details or intent
async function parseUserIntake(userText: string, contextState: any): Promise<z.infer<typeof ParsedBirthSchema>> {
  const prompt = `You are a conversational intake parser for a Vedic astrology chatbot.
Analyze the user message in the context of recent chat state.
Current Pending Birth State: ${JSON.stringify(contextState?.pendingBirth || {})}

Tasks:
1. Did the user confirm previous understanding? (e.g. "haan", "yes", "sahi hai", "theek hai", "proceed", "banao", "create" -> isConfirmation: true)
2. Did the user deny or correct? (e.g. "nahi", "galat hai", "no" -> isDenial: true)
3. Did the user provide birth info in Hindi/English/Hinglish (e.g., "14 may 2000, shaam 6:32, Jaipur", "01-01-2000 12:00 Delhi", "meri date 10 Jan 1995 hai time nahi pata, Delhi")?
   - Convert date to standard YYYY-MM-DD.
   - Convert time to 24h HH:mm (e.g. "shaam 6:32" -> "18:32", "subah 8:00" -> "08:00", "6:30 PM" -> "18:30"). If user says time unknown, set time: "12:00", isApproximateTime: true.
   - Extract place (city, district, state/country).
   - Extract label if mentioned ("dost ki", "wife ki", "husband ki", "meri"). Default: "Self".
4. Classify topic if user asked an astrological question: "business_career" (job, career, startup), "marriage" (shaadi, love, partner), "finance" (paisa, wealth), "education" (padhai, exams), "health_general" (health, wellness, remedies), or "general".

Respond strictly with a JSON object matching this schema:
{
  "hasBirthInfo": boolean,
  "date": string or null,
  "time": string or null,
  "place": string or null,
  "label": string or null,
  "isApproximateTime": boolean,
  "isConfirmation": boolean,
  "isDenial": boolean,
  "topic": "business_career" | "marriage" | "finance" | "education" | "health_general" | "general"
}`;

  try {
    const raw = await callGemini({
      contents: [{ role: 'user', parts: [{ text: `User message: "${userText}"\n\n${prompt}` }] }],
      responseMimeType: 'application/json',
      temperature: 0.1,
    });
    const parsed = JSON.parse(raw);
    return ParsedBirthSchema.parse(parsed);
  } catch (e) {
    // Robust fallback parsing using regex
    const isConfirmation = /^(haan|yes|sahi|ha|theek|ok|correct|proceed|banao|banaiye|sure|confirm)$/i.test(userText.trim());
    const isDenial = /^(nahi|no|galat|wrong|incorrect)$/i.test(userText.trim());

    // Regex for date: YYYY-MM-DD or DD-MM-YYYY or DD Month YYYY
    let extractedDate: string | undefined;
    const isoDateMatch = userText.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    const dmyDateMatch = userText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
    const textDateMatch = userText.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i);

    if (isoDateMatch) {
      extractedDate = `${isoDateMatch[1]}-${isoDateMatch[2].padStart(2, '0')}-${isoDateMatch[3].padStart(2, '0')}`;
    } else if (dmyDateMatch) {
      extractedDate = `${dmyDateMatch[3]}-${dmyDateMatch[2].padStart(2, '0')}-${dmyDateMatch[1].padStart(2, '0')}`;
    } else if (textDateMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = monthNames.findIndex((m) => textDateMatch[2].toLowerCase().startsWith(m));
      if (mIdx !== -1) {
        extractedDate = `${textDateMatch[3]}-${String(mIdx + 1).padStart(2, '0')}-${textDateMatch[1].padStart(2, '0')}`;
      }
    }

    // Regex for time: 18:30 or 6:30 PM
    let extractedTime: string | undefined;
    const timeMatch = userText.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const meridiem = timeMatch[3]?.toLowerCase();
      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;
      extractedTime = `${String(h).padStart(2, '0')}:${m}`;
    }

    // Regex for place: Delhi, Jaipur, Mumbai, etc.
    let extractedPlace: string | undefined;
    const placeMatch = userText.match(/\b(Delhi|New Delhi|Mumbai|Jaipur|Bangalore|Bengaluru|Pune|Kolkata|Chennai|Hyderabad|Ahmedabad|Lucknow|Varanasi|Patna|Bhopal|Indore|Surat|Noida|Gurgaon|Gurugram|Chandigarh|Ludhiana|Agra|Kanpur)\b/i);
    if (placeMatch) {
      extractedPlace = placeMatch[1];
    }

    const hasBirth = !!(extractedDate || extractedTime || extractedPlace);

    return {
      hasBirthInfo: hasBirth,
      date: extractedDate,
      time: extractedTime,
      place: extractedPlace,
      label: 'Self',
      isApproximateTime: false,
      isConfirmation,
      isDenial,
      topic: 'general',
    };
  }
}

// Generate contextual initial reading once Kundli is available
async function generateInitialReading(
  kundli: NormalizedKundli,
  serviceKey: string
): Promise<StructuredReply> {
  const service = getServiceById(serviceKey);
  const topic = service.topic;
  const compactContext = buildCompactKundliContext(kundli);
  const userFacts = buildUserFactsBlock(kundli);

  const prompt = `${compactContext}

${userFacts}

SERVICE FOCUS: ${service.title} (${topic.toUpperCase()})

TASK:
1. Greet the native warmly in friendly WhatsApp chat style.
2. Bubble 1: State that their Kundli is ready. Mention their Lagna (${kundli.ascendant.sign}) and Moon sign (${kundli.moonSign}).
3. Bubble 2: Give 1 direct insight or focus area regarding ${service.title} in plain words based on chart (max 25 words).
4. Bubble 3: Ask 1 friendly opening question.
5. Overall length MUST be under 70 words total. Strictly NO rule IDs, NO bullet lists, NO headings.
6. Provide 2-3 quickReplies tailored to ${service.title}.`;

  try {
    const raw = await callGemini({
      systemInstruction: JYOTIX_CHAT_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 220,
      responseMimeType: 'application/json',
    });
    return parseStructuredReply(raw);
  } catch (e) {
    return {
      bubbles: [
        `Namaste! Aapki Janam Kundli taiyar ho gayi hai. Lagna ${kundli.ascendant.sign} aur Rashi ${kundli.moonSign} hai.`,
        `Abhi ${kundli.dasha?.currentMahadasha ? `${kundli.dasha.currentMahadasha} ki dasha prabhavi hai.` : 'kundli active hai.'} ${service.title} ke bare mein aap kya jaan na chahenge?`,
      ],
      quickReplies: service.quickQuestions.slice(0, 3),
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      userId = 'guest',
      serviceId = 'career-finance',
      activeKundliId,
      activeKundli: clientKundli,
      pendingBirth,
      isDirectBirthSubmit,
      birthDetails,
      chatHistory,
      detail: explicitDetail,
    } = body;

    const service = getServiceById(serviceId);

    if (!message && !isDirectBirthSubmit) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Direct Form Submit Fallback
    if (isDirectBirthSubmit && birthDetails) {
      try {
        const kundli = await executeGenerateKundli({
          date: birthDetails.date,
          time: birthDetails.time || '12:00',
          place: birthDetails.place,
          userId,
          label: birthDetails.label || 'Self',
          isApproximateTime: birthDetails.isApproximateTime,
        });

        const initialReading = await generateInitialReading(kundli, serviceId);

        return NextResponse.json({
          bubbles: initialReading.bubbles,
          quickReplies: initialReading.quickReplies,
          reply: initialReading.bubbles.join('\n\n'),
          messageType: 'kundli_card',
          kundli,
          activeKundliId: kundli.id,
          pendingBirth: null,
          topic: service.topic,
        });
      } catch (err: any) {
        console.warn('Direct birth submit fallback:', err.message);
        const { calculateFallbackKundli } = await import('@/lib/kundli/fallbackCalculator');
        const kundli = calculateFallbackKundli({
          date: birthDetails.date,
          time: birthDetails.time || '12:00',
          place: birthDetails.place,
          lat: 28.6139,
          lon: 77.2090,
          label: birthDetails.label || 'Self',
          isApproximateTime: birthDetails.isApproximateTime,
        });

        const initialReading = await generateInitialReading(kundli, serviceId);

        return NextResponse.json({
          bubbles: initialReading.bubbles,
          quickReplies: initialReading.quickReplies,
          reply: initialReading.bubbles.join('\n\n'),
          messageType: 'kundli_card',
          kundli,
          activeKundliId: kundli.id,
          pendingBirth: null,
          topic: service.topic,
        });
      }
    }

    // 2. Fetch existing saved Kundli (client passed, or activeKundliId, or user's latest)
    let activeKundli: NormalizedKundli | null = clientKundli || null;
    if (!activeKundli && activeKundliId) {
      activeKundli = await executeGetSavedKundli({ userId, kundliId: activeKundliId });
    }
    if (!activeKundli && userId && userId !== 'guest') {
      activeKundli = await executeGetSavedKundli({ userId });
    }

    // 3. Conversational Intake Analysis
    const intake = await parseUserIntake(message, { pendingBirth });

    // Handle Confirmation: If pending birth exists and user confirmed
    if (pendingBirth && (intake.isConfirmation || intake.hasBirthInfo)) {
      const dateToUse = intake.date || pendingBirth.date;
      const timeToUse = intake.time || pendingBirth.time;
      const placeToUse = intake.place || pendingBirth.place;
      const labelToUse = intake.label || pendingBirth.label || 'Self';
      const isApprox = intake.isApproximateTime ?? pendingBirth.isApproximateTime ?? false;

      if (dateToUse && timeToUse && placeToUse) {
        try {
          const kundli = await executeGenerateKundli({
            date: dateToUse,
            time: timeToUse,
            place: placeToUse,
            userId,
            label: labelToUse,
            isApproximateTime: isApprox,
          });

          const initialReading = await generateInitialReading(kundli, serviceId);

          return NextResponse.json({
            bubbles: initialReading.bubbles,
            quickReplies: initialReading.quickReplies,
            reply: initialReading.bubbles.join('\n\n'),
            messageType: 'kundli_card',
            kundli,
            activeKundliId: kundli.id,
            pendingBirth: null,
            topic: service.topic,
          });
        } catch (err: any) {
          console.warn('Confirmation birth submit fallback:', err.message);
          const { calculateFallbackKundli } = await import('@/lib/kundli/fallbackCalculator');
          const kundli = calculateFallbackKundli({
            date: dateToUse,
            time: timeToUse,
            place: placeToUse,
            lat: 28.6139,
            lon: 77.2090,
            label: labelToUse,
            isApproximateTime: isApprox,
          });

          const initialReading = await generateInitialReading(kundli, serviceId);

          return NextResponse.json({
            bubbles: initialReading.bubbles,
            quickReplies: initialReading.quickReplies,
            reply: initialReading.bubbles.join('\n\n'),
            messageType: 'kundli_card',
            kundli,
            activeKundliId: kundli.id,
            pendingBirth: null,
            topic: service.topic,
          });
        }
      }
    }

    // Handle Denial/Correction
    if (pendingBirth && intake.isDenial) {
      return NextResponse.json({
        bubbles: [
          'Koi baat nahi! Kripya sahi Janam Vivaran batayein:',
          'Date of Birth (DD-MM-YYYY), Time of Birth (AM/PM), aur Place of Birth (City).',
        ],
        quickReplies: ['18-10-2002, 10:30 AM, Delhi', 'Time nahi pata'],
        reply: 'Koi baat nahi! Kripya sahi Janam Vivaran likhein: Date, Time, Place.',
        messageType: 'text',
        pendingBirth: null,
      });
    }

    // Handle Natural Intake (Date / Time / Place provided in message)
    if (intake.hasBirthInfo) {
      const mergedDate = intake.date || pendingBirth?.date;
      const mergedTime = intake.time || pendingBirth?.time;
      const mergedPlace = intake.place || pendingBirth?.place;
      const mergedLabel = intake.label || pendingBirth?.label || 'Self';
      const isApprox = intake.isApproximateTime ?? pendingBirth?.isApproximateTime ?? false;

      // Check if all 3 fields are present -> Directly generate Kundli!
      if (mergedDate && mergedTime && mergedPlace) {
        try {
          const kundli = await executeGenerateKundli({
            date: mergedDate,
            time: mergedTime,
            place: mergedPlace,
            userId,
            label: mergedLabel,
            isApproximateTime: isApprox,
          });

          const initialReading = await generateInitialReading(kundli, serviceId);

          return NextResponse.json({
            bubbles: initialReading.bubbles,
            quickReplies: initialReading.quickReplies,
            reply: initialReading.bubbles.join('\n\n'),
            messageType: 'kundli_card',
            kundli,
            activeKundliId: kundli.id,
            pendingBirth: null,
            topic: service.topic,
          });
        } catch (err: any) {
          console.warn('Natural birth submit fallback:', err.message);
          const { calculateFallbackKundli } = await import('@/lib/kundli/fallbackCalculator');
          const kundli = calculateFallbackKundli({
            date: mergedDate,
            time: mergedTime,
            place: mergedPlace,
            lat: 28.6139,
            lon: 77.2090,
            label: mergedLabel,
            isApproximateTime: isApprox,
          });

          const initialReading = await generateInitialReading(kundli, serviceId);

          return NextResponse.json({
            bubbles: initialReading.bubbles,
            quickReplies: initialReading.quickReplies,
            reply: initialReading.bubbles.join('\n\n'),
            messageType: 'kundli_card',
            kundli,
            activeKundliId: kundli.id,
            pendingBirth: null,
            topic: service.topic,
          });
        }
      }

      // If missing partial fields, ask friendly human follow-up
      if (!mergedDate) {
        return NextResponse.json({
          bubbles: ['Bahut badhiya! Kripya apni Date of Birth (Janam Tithi) batayein (jaise: 14 May 2000).'],
          quickReplies: ['14 May 2000', '01 Jan 1998'],
          reply: 'Bahut badhiya! Kripya apni Date of Birth batayein.',
          pendingBirth: { date: mergedDate, time: mergedTime, place: mergedPlace, label: mergedLabel },
        });
      }
      if (!mergedTime) {
        return NextResponse.json({
          bubbles: [
            `Aapki Janam Tithi (${mergedDate}) note ho gayi hai! 📅`,
            `Ab kripya apna Time of Birth batayein (jaise: 6:30 PM). Agar exact time nahi pata, toh 'approx' bol dijiye.`,
          ],
          quickReplies: ['10:30 AM', '6:30 PM', 'Exact time nahi pata'],
          reply: `Aapki Janam Tithi (${mergedDate}) note ho gayi hai. Ab apna Time of Birth batayein.`,
          pendingBirth: { date: mergedDate, time: mergedTime, place: mergedPlace, label: mergedLabel },
        });
      }
      if (!mergedPlace) {
        return NextResponse.json({
          bubbles: [
            `Janam Tithi (${mergedDate}) aur Samay (${mergedTime}) note ho gaya hai!`,
            `Ab kripya apna Place of Birth (Janam Sthan/Shahar) batayein (jaise: Jaipur ya Delhi).`,
          ],
          quickReplies: ['Delhi', 'Mumbai', 'Jaipur'],
          reply: `Ab kripya apna Place of Birth batayein.`,
          pendingBirth: { date: mergedDate, time: mergedTime, place: mergedPlace, label: mergedLabel },
        });
      }
    }

    // 4. If No active Kundli exists and user asks a question without birth info
    if (!activeKundli) {
      // Check if user is asking a conceptual, book-grounded, or general astrology question
      let ragResult = { chunks: [] as any[], citations: [] as any[], formattedContext: '', totalFound: 0 };
      try {
        ragResult = await retrieveAstrologyKnowledge(message || '', {
          topK: 4,
          minScore: 0.35,
          preferCustomBook: true,
        });
      } catch (e) {
        console.warn('Pre-kundli RAG retrieval failed:', e);
      }

      // If we found relevant knowledge chunks from the book or Vedic references:
      if (ragResult.totalFound > 0) {
        const isPureEnglish =
          /^[a-zA-Z0-9\s.,?!'"\-]+$/.test(message || '') &&
          !/\b(meri|mera|kab|kaisa|kya|hai|hoon|hogi|batao|chahiye|nahi|ki|ka|ke|se|aur|par|ko)\b/i.test(message || '');

        const languageInstruction = isPureEnglish
          ? 'LANGUAGE: Answer strictly in clear, natural conversational English.'
          : 'LANGUAGE: Natural conversational everyday Hinglish as suited to the user prompt.';

        const bookPrompt = `You are Jyotix, an authentic Vedic Astrologer grounded deeply in the following classical and custom astrology texts:
${ragResult.formattedContext}

USER QUESTION: "${message}"

INSTRUCTIONS:
1. Answer the user's question directly, accurately, and warmly based on the passages above.
2. If citing the author or book (e.g., Sri Chennareddy Vasudev / Shantha Vasantha Trust / classical shastras), do so respectfully.
3. Keep the answer clear and conversational (2-3 short chat bubbles, maximum 120 words total).
4. Strictly NO headings (#), NO bullet asterisks (*, -, •), NO technical JSON code blocks.
5. In the final bubble, gently invite them: "Agar aap apni vyaktigat kundli ke anusar falit dekhna chahte hain, toh apna Date, Time aur Place of Birth batayein!"
6. ${languageInstruction}
7. Return strictly a JSON object: { "bubbles": string[], "quickReplies": string[] }`;

        try {
          const raw = await callGemini({
            systemInstruction: JYOTIX_CHAT_SYSTEM_PROMPT,
            contents: [{ role: 'user', parts: [{ text: bookPrompt }] }],
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 350,
            responseMimeType: 'application/json',
          });

          const structured = parseStructuredReply(raw);
          const sanitized = sanitizeBubbles(structured.bubbles, true);

          return NextResponse.json({
            bubbles: sanitized,
            quickReplies:
              structured.quickReplies.length > 0
                ? structured.quickReplies
                : ['Apni Kundli Banayein', 'Career ke bare mein', 'Detail mein batao'],
            reply: sanitized.join('\n\n'),
            messageType: 'text',
            sources: ragResult.citations,
          });
        } catch (genErr) {
          console.error('Failed to generate RAG answer for pre-kundli question:', genErr);
        }
      }

      // Fallback: prompt for birth info
      return NextResponse.json({
        bubbles: [service.welcomeGreeting],
        quickReplies: service.quickQuestions.slice(0, 3),
        reply: service.welcomeGreeting,
        messageType: 'text',
      });
    }

    // 5. Active Kundli Exists -> Answer in the Service Context!
    const topic = intake.topic && intake.topic !== 'general' ? intake.topic : service.topic;
    const rulesSummary = executeMatchRules(topic, activeKundli);
    const compactKundliContext = buildCompactKundliContext(activeKundli);
    const userFacts = buildUserFactsBlock(activeKundli, chatHistory);

    // Fetch transits
    const transits = await executeGetTransits({
      lat: activeKundli.birth.lat,
      lon: activeKundli.birth.lon,
    });

    const isDetail =
      explicitDetail === true ||
      /detail\s+me(in)?\s+batao|explain\s+in\s+detail|vistaar\s+mein|batao\s+detail/i.test(message || '');
    const isRemedies = /upaay|upay|remedy|remedies|totka|nivaran/i.test(message || '');
    const isFollowUp = Array.isArray(chatHistory) && chatHistory.length > 2;

    const matchedRulesText = rulesSummary.matchedRules
      .slice(0, 5)
      .map((r) => `[${r.id}]: ${r.effect}`)
      .join('\n');

    // Retrieve relevant passages from custom astrology books and classical references
    let ragResult = { chunks: [] as any[], citations: [] as any[], formattedContext: '', totalFound: 0 };
    try {
      ragResult = await retrieveAstrologyKnowledge(message || '', {
        topic,
        topK: 4,
        minScore: 0.35,
        preferCustomBook: true,
      });
    } catch (ragErr) {
      console.warn('RAG retrieval skipped due to error:', ragErr);
    }

    let modeInstruction = '';
    if (isDetail) {
      modeInstruction =
        'DETAIL MODE: User requested "detail mein batao". Up to 250 words total allowed across 2-3 short conversational bubbles. Also populate "chartFactors" with 2-4 key reasons in plain language.';
    } else if (isRemedies) {
      modeInstruction =
        'REMEDIES MODE: User asked for upaay/remedies. Remedies are now ALLOWED! Give max 3 simple everyday remedies in friendly chat style. Max 70 words total.';
    } else {
      modeInstruction = isFollowUp
        ? 'FOLLOW-UP MODE: User asked a short follow-up (e.g. "kab tak?"). Keep response under 50 words total across 1-2 bubbles. Do NOT repeat the previous answer. Answer directly with timing or chart reason.'
        : 'INITIAL ANSWER MODE: Max 70 words total across 2-3 short bubbles. First sentence must be direct answer, then single key chart reason in plain words, then dasha timing if available, then ONE short follow-up question.';
    }

    const dashaDatesAvailable =
      activeKundli.dasha?.periods && activeKundli.dasha.periods.length > 0;
    const timingRule = !dashaDatesAvailable
      ? 'CRITICAL: Dasha timeline dates are missing in chart data. You MUST state "exact time chart se clear nahi hai" instead of guessing any dates or windows.'
      : 'TIMING: Quote actual dasha period dates provided in dasha data. Never invent vague windows.';

    const isPureEnglish =
      /^[a-zA-Z0-9\s.,?!'"\-]+$/.test(message || '') &&
      !/\b(meri|mera|kab|kaisa|kya|hai|hoon|hogi|batao|chahiye|nahi|ki|ka|ke|se|aur|par|ko)\b/i.test(message || '');

    const languageInstruction = isPureEnglish
      ? 'LANGUAGE: The user asked in pure English. You MUST reply strictly in 100% natural conversational English (no Hindi or Hinglish words).'
      : 'LANGUAGE: Natural conversational everyday Hinglish, the way people text.';

    const promptContext = `${compactKundliContext}

${userFacts}

ACTIVE SERVICE CONSULTATION: ${service.title}
FOCUSED TOPIC: [${topic.toUpperCase()}]

CURRENT PLANETARY TRANSITS:
${transits.planets.map((p) => `${p.name} in ${p.sign} (${p.degree}°)`).join(', ')}

MATCHED CLASSICAL RULES (Internal context only, DO NOT output [XXX-000] rule IDs):
${matchedRulesText || 'Neutral planetary influences.'}

${ragResult.formattedContext ? `AUTHENTIC ASTROLOGICAL REFERENCE PASSAGES (Ground your answer in these insights where relevant):
${ragResult.formattedContext}
` : ''}
${timingRule}

USER QUESTION: "${message}"

INSTRUCTIONS:
${modeInstruction}
- Split reply into 2-3 short chat bubbles (1-2 sentences each).
- Strictly NO headings (#), NO bullet lists (*, -, •), NO rule IDs like [MAR-004].
- Reference at least one specific chart fact (house, lord, planet placement or dasha) in plain words.
- ${languageInstruction}
- Return JSON strictly matching: { "bubbles": string[], "quickReplies": string[], "chartFactors"?: string[] }`;

    let rawReply = await callGemini({
      systemInstruction: JYOTIX_CHAT_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: promptContext }] }],
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: isDetail ? 1000 : 700,
      responseMimeType: 'application/json',
    });

    let structured = parseStructuredReply(rawReply);

    // Server-side validation
    if (hasViolations(structured.bubbles, isDetail)) {
      try {
        const retryPrompt = `${promptContext}\n\nREGENERATION REQUIRED: Your previous answer violated constraints. You MUST make it shorter (under 60 words total), strictly NO rule IDs (like [XXX-000]), NO bullet lists, NO headings. Return valid JSON only: { "bubbles": string[], "quickReplies": string[] }`;
        const retryRaw = await callGemini({
          systemInstruction: JYOTIX_CHAT_SYSTEM_PROMPT,
          contents: [{ role: 'user', parts: [{ text: retryPrompt }] }],
          temperature: 0.3,
          topP: 0.9,
          maxOutputTokens: isDetail ? 500 : 200,
          responseMimeType: 'application/json',
        });
        structured = parseStructuredReply(retryRaw);
      } catch (e) {
        // Fallback to programmatic sanitization
      }
    }

    structured.bubbles = sanitizeBubbles(structured.bubbles, isDetail);

    return NextResponse.json({
      bubbles: structured.bubbles,
      quickReplies: structured.quickReplies,
      chartFactors: structured.chartFactors || [],
      sources: ragResult.citations || [],
      reply: structured.bubbles.join('\n\n'),
      messageType: 'bubbles',
      activeKundliId: activeKundli.id,
      kundli: activeKundli,
      matchedRules: rulesSummary.matchedRules,
      netOutlook: rulesSummary.netOutlook,
      topic,
      isDetail,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        bubbles: [`Kshama karein, ek takneeki samasya aayi: ${error.message || 'Please try again in a moment.'}`],
        quickReplies: ['Dobara pucho', 'Nayi Kundli banao'],
        reply: `Kshama karein, ek takneeki samasya aayi: ${error.message || 'Please try again in a moment.'}`,
        messageType: 'text',
      },
      { status: 500 }
    );
  }
}
