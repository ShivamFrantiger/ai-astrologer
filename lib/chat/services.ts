/**
 * @fileOverview Astrology Services definitions and configurations for Jyotix Chat
 */

export interface AstrologyServiceConfig {
  id: string;
  key: string;
  title: string;
  titleHi: string;
  topic: 'business_career' | 'marriage' | 'finance' | 'education' | 'health_general' | 'general';
  icon: string;
  welcomeGreeting: string;
  initialReadingPrompt: string;
  quickQuestions: string[];
}

export const ASTROLOGY_SERVICES: Record<string, AstrologyServiceConfig> = {
  'career-finance': {
    id: 'career-finance',
    key: 'career-finance',
    title: 'Career & Finance Consultation',
    titleHi: 'करियर और वित्त परामर्श',
    topic: 'business_career',
    icon: '/svg/briefcase.svg',
    welcomeGreeting: `Namaste! Jyotix me aapka swagat hai. Main aapki **Career & Finance Consultation** me kaise madad kar sakta hoon?

Sateek Vedic bhavishyavani ke liye, kya aap apna **Date of Birth**, **Time of Birth**, aur **Place of Birth** bata sakte hain?
*(Jaise: 14 May 2000, 6:30 PM, Delhi)*`,
    initialReadingPrompt: 'Analyze career prospects, 10th house (Karma Bhava), 2nd house (Wealth), 11th house (Gains), and active Mahadasha for career direction.',
    quickQuestions: [
      'Mera promotion aur career growth kab hoga?',
      'Job continue karoon ya naya business shuru karoon?',
      'Mera Dhana Yoga aur financial status kaisa hai?',
      'Current Mahadasha me career kaisa rahega?',
    ],
  },
  'love-guidance': {
    id: 'love-guidance',
    key: 'love-guidance',
    title: 'Love & Relationship Guidance',
    titleHi: 'प्रेम और संबंध मार्गदर्शन',
    topic: 'marriage',
    icon: '/svg/heart.svg',
    welcomeGreeting: `Namaste! Jyotix me aapka swagat hai. Main aapki **Love & Relationship Guidance** me kaise madad kar sakta hoon?

Sateek Vedic bhavishyavani ke liye, kya aap apna **Date of Birth**, **Time of Birth**, aur **Place of Birth** bata sakte hain?
*(Jaise: 14 May 2000, 6:30 PM, Delhi)*`,
    initialReadingPrompt: 'Analyze marriage & relationship prospects, 7th house (Kalatra), 5th house (Romance), Venus, and Jupiter placements.',
    quickQuestions: [
      'Mera vivah (marriage) ka yog kab ban raha hai?',
      'Meri love marriage hogi ya arranged marriage?',
      'Mera jeevansathi kaisa hoga aur uska nature kaisa rahega?',
      'Relationship me shanti aur prem ke liye kya upay karein?',
    ],
  },
  'matchmaking': {
    id: 'matchmaking',
    key: 'matchmaking',
    title: 'Kundli Milan & Compatibility',
    titleHi: 'कुंडली मिलान और अनुकूलता',
    topic: 'marriage',
    icon: '/svg/gem.svg',
    welcomeGreeting: `Namaste! Jyotix me aapka swagat hai. Main aapki **Kundli Milan & Compatibility** me kaise madad kar sakta hoon?

Sateek Vedic bhavishyavani ke liye, kya aap apna **Date of Birth**, **Time of Birth**, aur **Place of Birth** bata sakte hain?
*(Jaise: 14 May 2000, 6:30 PM, Delhi)*`,
    initialReadingPrompt: 'Analyze marriage stability, 7th house strength, Manglik dosh factors, and harmony in partnership.',
    quickQuestions: [
      'Kya meri Kundli me Manglik dosh ya koi dosh hai?',
      'Vivah ke baad dampatya jeevan kaisa rahega?',
      'Partner ke sath understanding badhane ke Vedic upay kya hain?',
      'Vivah me deri ke kya kaaran hain aur kab yog banega?',
    ],
  },
  'horoscope-readings': {
    id: 'horoscope-readings',
    key: 'horoscope-readings',
    title: 'Kundli & Horoscope Readings',
    titleHi: 'कुंडली और भविष्यफल',
    topic: 'general',
    icon: '/svg/book-open.svg',
    welcomeGreeting: `Namaste! Jyotix me aapka swagat hai. Main aapki **Kundli & Horoscope Readings** me kaise madad kar sakta hoon?

Sateek Vedic bhavishyavani ke liye, kya aap apna **Date of Birth**, **Time of Birth**, aur **Place of Birth** bata sakte hain?
*(Jaise: 14 May 2000, 6:30 PM, Delhi)*`,
    initialReadingPrompt: 'Provide an overview of Ascendant (Lagna), Moon sign, key yogas, and current Mahadasha period.',
    quickQuestions: [
      'Meri Kundli ka Lagna aur Chandra Rashi ka fal kya hai?',
      'Aane wala samay aur running Mahadasha kaisi rahegi?',
      'Mera bhagyodaya kab hoga?',
      'Kundli ka sabse shubh graha kaun sa hai?',
    ],
  },
  'remedies': {
    id: 'remedies',
    key: 'remedies',
    title: 'Vedic Remedies & Solutions',
    titleHi: 'ज्योतिषीय उपाय और समाधान',
    topic: 'health_general',
    icon: '/svg/star.svg',
    welcomeGreeting: `Namaste! Jyotix me aapka swagat hai. Main aapki **Vedic Remedies & Upay** me kaise madad kar sakta hoon?

Sateek Vedic bhavishyavani ke liye, kya aap apna **Date of Birth**, **Time of Birth**, aur **Place of Birth** bata sakte hain?
*(Jaise: 14 May 2000, 6:30 PM, Delhi)*`,
    initialReadingPrompt: 'Identify afflicted or weak planets (combust, debilitated, in 6/8/12 houses) and prescribe authentic Vedic remedies, gemstones, and mantras.',
    quickQuestions: [
      'Meri Kundli me kaun sa graha peedit ya kamzor hai?',
      'Mujhe kaun sa Ratna (Gemstone) pehanna chahiye?',
      'Graha dosh shanti ke liye kaun sa mantra japna labhdayak hoga?',
      'Nazar dosh aur durbhagya se bachne ke saral upay kya hain?',
    ],
  },
  'chat-with-astrologer': {
    id: 'chat-with-astrologer',
    key: 'chat-with-astrologer',
    title: 'Talk to Astrologer Consultation',
    titleHi: 'ज्योतिषी से सीधा परामर्श',
    topic: 'general',
    icon: '/svg/message-circle.svg',
    welcomeGreeting: `Namaste! Jyotix me aapka swagat hai. Main aapki **Jyotish Paramarsh (Astrology Consultation)** me kaise madad kar sakta hoon?

Sateek Vedic bhavishyavani ke liye, kya aap apna **Date of Birth**, **Time of Birth**, aur **Place of Birth** bata sakte hain?
*(Jaise: 14 May 2000, 6:30 PM, Delhi)*`,
    initialReadingPrompt: 'Introduce the native chart, Lagna, Moon sign, and open consultation for all life aspects.',
    quickQuestions: [
      'Mera career aur business kaisa rahega?',
      'Meri shaadi kab tak hone ke yog hain?',
      'Running Mahadasha ka fal kya hoga?',
      'Dhana yoga aur aarthik sthiti kaisi rahegi?',
    ],
  },
};

export function getServiceById(id?: string | null): AstrologyServiceConfig {
  if (!id) return ASTROLOGY_SERVICES['chat-with-astrologer'];
  const normalized = id.toLowerCase().replace(/_/g, '-');
  return ASTROLOGY_SERVICES[normalized] || ASTROLOGY_SERVICES['chat-with-astrologer'];
}
