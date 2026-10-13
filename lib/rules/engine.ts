/**
 * @fileOverview Deterministic Vedic Astrology Rule Engine
 * Evaluates declarative rules against normalized Kundli data.
 */

import { NormalizedKundli, PlanetInfo } from '../kundli/types';

import businessCareerRules from '../../rules/business_career.json';
import marriageRules from '../../rules/marriage.json';
import financeRules from '../../rules/finance.json';
import educationRules from '../../rules/education.json';
import healthRules from '../../rules/health_general.json';

export interface RuleCondition {
  house?: number;
  lordInHouse?: number[];
  planet?: string;
  inHouse?: number[];
  inSign?: string[];
  isExalted?: boolean;
  isDebilitated?: boolean;
  isRetrograde?: boolean;
  conjunction?: string[];
  aspectOnHouse?: number;
  byPlanet?: string;
  dashaLord?: string;
  houseOwned?: number[];
}

export interface RuleDefinition {
  id: string;
  topic: string;
  source: string;
  condition: RuleCondition;
  effect: string;
  weight: number;
  confidence: 'classical' | 'common-practice';
}

export interface MatchedRule extends RuleDefinition {
  isMatched: boolean;
  reason?: string;
}

export interface RuleMatchSummary {
  topic: string;
  totalMatched: number;
  supportiveScore: number;
  challengingScore: number;
  netOutlook: 'Highly Supportive' | 'Favorable / Moderate' | 'Mixed / Challenging' | 'Requires Patience & Remedies';
  matchedRules: MatchedRule[];
  dashaFactors?: {
    currentMahadasha?: string;
    currentAntardasha?: string;
    dashaLordHousesOwned: number[];
  };
}

// Sign indexes (1 to 12)
const SIGN_INDEX_MAP: Record<string, number> = {
  mesha: 1, aries: 1,
  vrishabha: 2, taurus: 2,
  mithuna: 3, gemini: 3,
  karka: 4, cancer: 4,
  simha: 5, leo: 5,
  kanya: 6, virgo: 6,
  tula: 7, libra: 7,
  vrischika: 8, scorpio: 8,
  dhanu: 9, sagittarius: 9,
  makara: 10, capricorn: 10,
  kumbha: 11, aquarius: 11,
  meena: 12, pisces: 12,
};

// Planetary Lord by Sign index (1-12)
const SIGN_LORD_MAP: Record<number, string> = {
  1: 'Mars',
  2: 'Venus',
  3: 'Mercury',
  4: 'Moon',
  5: 'Sun',
  6: 'Mercury',
  7: 'Venus',
  8: 'Mars',
  9: 'Jupiter',
  10: 'Saturn',
  11: 'Saturn',
  12: 'Jupiter',
};

// Exaltation & Debilitation signs (index 1-12)
const EXALTATION_MAP: Record<string, number> = {
  Sun: 1, // Mesha
  Moon: 2, // Vrishabha
  Mars: 10, // Makara
  Mercury: 6, // Kanya
  Jupiter: 4, // Karka
  Venus: 12, // Meena
  Saturn: 7, // Tula
};

const DEBILITATION_MAP: Record<string, number> = {
  Sun: 7, // Tula
  Moon: 8, // Vrischika
  Mars: 4, // Karka
  Mercury: 12, // Meena
  Jupiter: 10, // Makara
  Venus: 6, // Kanya
  Saturn: 1, // Mesha
};

function normalizeSignName(sign: string): number {
  const clean = sign.toLowerCase().trim();
  return SIGN_INDEX_MAP[clean] || 1;
}

/**
 * Returns the sign index (1-12) of a given house H based on Lagna sign.
 */
function getHouseSign(lagnaSignIndex: number, houseNum: number): number {
  return ((lagnaSignIndex - 1 + (houseNum - 1)) % 12) + 1;
}

/**
 * Returns the lord of a given house (1-12).
 */
export function getHouseLord(lagnaSign: string, houseNum: number): string {
  const lagnaIndex = normalizeSignName(lagnaSign);
  const houseSign = getHouseSign(lagnaIndex, houseNum);
  return SIGN_LORD_MAP[houseSign] || 'Jupiter';
}

/**
 * Returns all houses (1-12) owned by a given planet in this chart.
 */
export function getHousesOwnedByPlanet(lagnaSign: string, planetName: string): number[] {
  const lagnaIndex = normalizeSignName(lagnaSign);
  const houses: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const sign = getHouseSign(lagnaIndex, h);
    if (SIGN_LORD_MAP[sign]?.toLowerCase() === planetName.toLowerCase()) {
      houses.push(h);
    }
  }
  return houses;
}

/**
 * Returns houses aspected by a planet from its placed house using Vedic Graha Drishti.
 */
export function getAspectedHouses(planetName: string, fromHouse: number): number[] {
  const p = planetName.toLowerCase();
  const aspects = new Set<number>();

  // All planets aspect the 7th house from themselves
  aspects.add(((fromHouse - 1 + 6) % 12) + 1);

  // Special Vedic Drishtis:
  if (p === 'mars') {
    aspects.add(((fromHouse - 1 + 3) % 12) + 1); // 4th
    aspects.add(((fromHouse - 1 + 7) % 12) + 1); // 8th
  } else if (p === 'jupiter' || p === 'rahu' || p === 'ketu') {
    aspects.add(((fromHouse - 1 + 4) % 12) + 1); // 5th
    aspects.add(((fromHouse - 1 + 8) % 12) + 1); // 9th
  } else if (p === 'saturn') {
    aspects.add(((fromHouse - 1 + 2) % 12) + 1); // 3rd
    aspects.add(((fromHouse - 1 + 9) % 12) + 1); // 10th
  }

  return Array.from(aspects);
}

/**
 * Evaluates a single rule condition deterministically against the Kundli chart.
 */
export function evaluateCondition(condition: RuleCondition, kundli: NormalizedKundli): boolean {
  const lagnaSign = kundli.ascendant.sign;
  const planets = kundli.planets;

  // 1. House Lord placement check (e.g. house 10 lord placed in houses [1, 10, 11])
  if (condition.house !== undefined && condition.lordInHouse) {
    const lord = getHouseLord(lagnaSign, condition.house);
    const planetObj = planets.find((p) => p.name.toLowerCase() === lord.toLowerCase());
    if (!planetObj || !condition.lordInHouse.includes(planetObj.house)) {
      return false;
    }
  }

  // 2. Planet placement check (e.g. planet "Jupiter" in house [1, 5, 9])
  if (condition.planet && condition.inHouse) {
    const planetObj = planets.find((p) => p.name.toLowerCase() === condition.planet!.toLowerCase());
    if (!planetObj || !condition.inHouse.includes(planetObj.house)) {
      return false;
    }
  }

  // 3. Exaltation / Debilitation check for house lord or planet
  if (condition.isExalted !== undefined) {
    let planetToCheck: PlanetInfo | undefined;
    if (condition.house !== undefined) {
      const lord = getHouseLord(lagnaSign, condition.house);
      planetToCheck = planets.find((p) => p.name.toLowerCase() === lord.toLowerCase());
    } else if (condition.planet) {
      planetToCheck = planets.find((p) => p.name.toLowerCase() === condition.planet!.toLowerCase());
    }

    if (planetToCheck) {
      const signIdx = normalizeSignName(planetToCheck.sign);
      const exaltedIdx = EXALTATION_MAP[planetToCheck.name];
      const isExalted = exaltedIdx === signIdx;
      if (condition.isExalted !== isExalted) return false;
    } else {
      return false;
    }
  }

  if (condition.isDebilitated !== undefined) {
    let planetToCheck: PlanetInfo | undefined;
    if (condition.house !== undefined) {
      const lord = getHouseLord(lagnaSign, condition.house);
      planetToCheck = planets.find((p) => p.name.toLowerCase() === lord.toLowerCase());
    } else if (condition.planet) {
      planetToCheck = planets.find((p) => p.name.toLowerCase() === condition.planet!.toLowerCase());
    }

    if (planetToCheck) {
      const signIdx = normalizeSignName(planetToCheck.sign);
      const debIdx = DEBILITATION_MAP[planetToCheck.name];
      const isDebilitated = debIdx === signIdx;
      if (condition.isDebilitated !== isDebilitated) return false;
    } else {
      return false;
    }
  }

  // 4. Retrograde status
  if (condition.isRetrograde !== undefined && condition.planet) {
    const planetObj = planets.find((p) => p.name.toLowerCase() === condition.planet!.toLowerCase());
    if (!planetObj || planetObj.retrograde !== condition.isRetrograde) {
      return false;
    }
  }

  // 5. Conjunction check (multiple planets in the same house)
  if (condition.conjunction && condition.conjunction.length > 1) {
    const targets = condition.conjunction.map((name) =>
      planets.find((p) => p.name.toLowerCase() === name.toLowerCase())
    );
    if (targets.some((t) => !t)) return false;

    const firstHouse = targets[0]!.house;
    const allInSameHouse = targets.every((t) => t!.house === firstHouse);
    if (!allInSameHouse) return false;

    if (condition.inHouse && !condition.inHouse.includes(firstHouse)) {
      return false;
    }
  }

  // 6. Graha Drishti (Aspect) check
  if (condition.aspectOnHouse !== undefined && condition.byPlanet) {
    const castingPlanet = planets.find((p) => p.name.toLowerCase() === condition.byPlanet!.toLowerCase());
    if (!castingPlanet) return false;

    const aspected = getAspectedHouses(castingPlanet.name, castingPlanet.house);
    if (!aspected.includes(condition.aspectOnHouse)) {
      return false;
    }
  }

  // 7. Dasha Lord check
  if (condition.dashaLord && kundli.dasha?.currentMahadasha) {
    const curMaha = kundli.dasha.currentMahadasha;
    if (condition.dashaLord !== 'current' && condition.dashaLord.toLowerCase() !== curMaha.toLowerCase()) {
      return false;
    }

    if (condition.houseOwned && condition.houseOwned.length > 0) {
      const owned = getHousesOwnedByPlanet(lagnaSign, curMaha);
      const matchesOwned = condition.houseOwned.some((h) => owned.includes(h));
      if (!matchesOwned) return false;
    }
  }

  return true;
}

/**
 * Matches rules for a specific topic, calculates supportive/challenging scores,
 * and formats matched rules with citations.
 */
export function matchRulesForTopic(topic: string, kundli: NormalizedKundli): RuleMatchSummary {
  const cleanTopic = topic.toLowerCase().trim();
  let ruleSet: RuleDefinition[] = [];

  switch (cleanTopic) {
    case 'business':
    case 'career':
    case 'business_career':
    case 'job':
      ruleSet = businessCareerRules as RuleDefinition[];
      break;
    case 'marriage':
    case 'relationship':
    case 'love':
      ruleSet = marriageRules as RuleDefinition[];
      break;
    case 'finance':
    case 'wealth':
    case 'money':
      ruleSet = financeRules as RuleDefinition[];
      break;
    case 'education':
    case 'studies':
      ruleSet = educationRules as RuleDefinition[];
      break;
    case 'health':
    case 'wellness':
    case 'health_general':
      ruleSet = healthRules as RuleDefinition[];
      break;
    default:
      // Combine business and finance as general default
      ruleSet = [...(businessCareerRules as RuleDefinition[]), ...(marriageRules as RuleDefinition[])];
  }

  const matched: MatchedRule[] = [];
  let supportive = 0;
  let challenging = 0;

  for (const rule of ruleSet) {
    try {
      const isMatch = evaluateCondition(rule.condition, kundli);
      if (isMatch) {
        matched.push({ ...rule, isMatched: true });
        if (rule.weight > 0) supportive += rule.weight;
        else challenging += Math.abs(rule.weight);
      }
    } catch {
      // Continue safely on condition evaluation edge cases
    }
  }

  // Sort matched rules by highest absolute weight (strongest influences first)
  matched.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  let netOutlook: RuleMatchSummary['netOutlook'] = 'Favorable / Moderate';
  if (supportive > challenging + 3) {
    netOutlook = 'Highly Supportive';
  } else if (challenging > supportive) {
    netOutlook = 'Requires Patience & Remedies';
  } else if (supportive > challenging) {
    netOutlook = 'Favorable / Moderate';
  } else {
    netOutlook = 'Mixed / Challenging';
  }

  const currentMaha = kundli.dasha?.currentMahadasha;
  const dashaOwned = currentMaha ? getHousesOwnedByPlanet(kundli.ascendant.sign, currentMaha) : [];

  return {
    topic: cleanTopic,
    totalMatched: matched.length,
    supportiveScore: Math.round(supportive * 10) / 10,
    challengingScore: Math.round(challenging * 10) / 10,
    netOutlook,
    matchedRules: matched,
    dashaFactors: {
      currentMahadasha: kundli.dasha?.currentMahadasha,
      currentAntardasha: kundli.dasha?.currentAntardasha,
      dashaLordHousesOwned: dashaOwned,
    },
  };
}
