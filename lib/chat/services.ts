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
    welcomeGreeting: `Aapke career, job ya business ko lekar kya chal raha hai dimag mein? Niche apni birth details enter karein taaki main 10th house aur dasha dekh kar clear direction de sakun.`,
    initialReadingPrompt: 'Analyze career prospects, 10th house (Karma Bhava), 2nd house (Wealth), 11th house (Gains), and active Mahadasha for career direction.',
    quickQuestions: [
      'Mera promotion aur growth kab hoga?',
      'Job continue karoon ya business shuru karoon?',
      'Dhana Yoga aur financial stability kaisi rahegi?',
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
    welcomeGreeting: `Relationship ya shaadi ko lekar kya sawal hai aapka? Niche dialpad par apni birth details de dijiye, main aapke 7th house aur Venus ki sthiti dekh kar sachha margdarshan karunga.`,
    initialReadingPrompt: 'Analyze marriage & relationship prospects, 7th house (Kalatra), 5th house (Romance), Venus, and Jupiter placements.',
    quickQuestions: [
      'Mera vivah kab tak ban raha hai?',
      'Love marriage hogi ya arranged?',
      'Mera jeevansathi kaisa hoga?',
      'Relationship mein shanti ke liye kya karein?',
    ],
  },
  'matchmaking': {
    id: 'matchmaking',
    key: 'matchmaking',
    title: 'Kundli Milan & Compatibility',
    titleHi: 'कुंडली मिलान और अनुकूलता',
    topic: 'marriage',
    icon: '/svg/gem.svg',
    welcomeGreeting: `Kundli milan aur rishte ki stability dekhne ke liye birth details enter karein. Main Guna Milan aur 7th house dosh ka vishleshan karke bataunga.`,
    initialReadingPrompt: 'Analyze marriage stability, 7th house strength, Manglik dosh factors, and harmony in partnership.',
    quickQuestions: [
      'Kundli mein Manglik ya koi dosh hai?',
      'Vivah ke baad dampatya jeevan kaisa rahega?',
      'Partner ke sath understanding kaisi rahegi?',
      'Vivah mein delay kyun ho raha hai?',
    ],
  },
  'horoscope-readings': {
    id: 'horoscope-readings',
    key: 'horoscope-readings',
    title: 'Kundli & Horoscope Readings',
    titleHi: 'कुंडली और भविष्यफल',
    topic: 'general',
    icon: '/svg/book-open.svg',
    welcomeGreeting: `Aapki janma kundali ke mukhya yog aur aane wale samay ka vishleshan karne ke liye apni birth details niche enter karein.`,
    initialReadingPrompt: 'Provide an overview of Ascendant (Lagna), Moon sign, key yogas, and current Mahadasha period.',
    quickQuestions: [
      'Meri Kundli ka Lagna aur Rashi fal kya hai?',
      'Running Mahadasha ka kaisa asar rahega?',
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
    welcomeGreeting: `Kaun se graha ya pareshani ke liye upay janna chahte hain? Niche birth details enter karein taaki shastriya aur satvik upay nikaal sakun.`,
    initialReadingPrompt: 'Identify afflicted or weak planets (combust, debilitated, in 6/8/12 houses) and prescribe authentic Vedic remedies, gemstones, and mantras.',
    quickQuestions: [
      'Kaun sa graha peedit ya kamzor hai?',
      'Kaun sa Ratna dharan karna chahiye?',
      'Graha shanti ke liye kaun sa mantra sahi hai?',
      'Rukawaton ko door karne ke saral upay kya hain?',
    ],
  },
  'chat-with-astrologer': {
    id: 'chat-with-astrologer',
    key: 'chat-with-astrologer',
    title: 'Talk to Astrologer Consultation',
    titleHi: 'ज्योतिषी से सीधा परामर्श',
    topic: 'general',
    icon: '/svg/message-circle.svg',
    welcomeGreeting: `Swagat hai! Aapke man mein jeevan, career ya rishton ko lekar jo bhi duvidha hai, bejhijhak puchiye. Niche dialpad par apni birth details de dijiye.`,
    initialReadingPrompt: 'Introduce the native chart, Lagna, Moon sign, and open consultation for all life aspects.',
    quickQuestions: [
      'Mera career aur business aage kaisa rahega?',
      'Meri shaadi ka yog kab khul raha hai?',
      'Running Mahadasha ka mere jeevan par kya asar hai?',
      'Aarthik sthiti majboot kab hogi?',
    ],
  },
};

export function getServiceById(id?: string | null): AstrologyServiceConfig {
  if (!id) return ASTROLOGY_SERVICES['chat-with-astrologer'];
  const normalized = id.toLowerCase().replace(/_/g, '-');
  return ASTROLOGY_SERVICES[normalized] || ASTROLOGY_SERVICES['chat-with-astrologer'];
}
