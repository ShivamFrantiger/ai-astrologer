/**
 * @fileOverview Compact Kundli context builder for Gemini system context
 * Creates an ultra-dense, token-efficient summary of the active Kundli chart without SVG.
 */

import { NormalizedKundli } from '../kundli/types';
import { getHouseLord } from '../rules/engine';

export function buildCompactKundliContext(kundli: NormalizedKundli): string {
  const { birth, ascendant, moonSign, moonNakshatra, planets, dasha } = kundli;
  const lagna = ascendant.sign;

  // Key house lords: 1st, 2nd, 5th, 7th, 9th, 10th, 11th
  const houseLords = [
    `1st (Self/Lagna): ${getHouseLord(lagna, 1)}`,
    `2nd (Dhana/Wealth): ${getHouseLord(lagna, 2)}`,
    `5th (Intellect/Karma): ${getHouseLord(lagna, 5)}`,
    `7th (Partnership/Marriage/Biz): ${getHouseLord(lagna, 7)}`,
    `9th (Bhagya/Fortune): ${getHouseLord(lagna, 9)}`,
    `10th (Karma/Career): ${getHouseLord(lagna, 10)}`,
    `11th (Labha/Gains): ${getHouseLord(lagna, 11)}`,
  ].join(' | ');

  // Planetary placements
  const planetSummary = planets
    .map(
      (p) =>
        `${p.name}: ${p.sign} (${p.degree}°) in H${p.house}${
          p.retrograde ? ' [Vakri/R]' : ''
        }${p.nakshatra ? ` [${p.nakshatra}]` : ''}`
    )
    .join('\n- ');

  // Dasha status
  const currentDasha = dasha?.currentMahadasha
    ? `Running: ${dasha.currentMahadasha} Mahadasha (Antardasha: ${dasha.currentAntardasha || 'N/A'})`
    : 'Not available';

  return `### ACTIVE KUNDLI CONTEXT (Profile: ${kundli.label || 'Self'})
- Birth: ${birth.date} at ${birth.time} (${birth.isApproximateTime ? 'Approximate Noon Chart' : 'Exact'}), ${birth.place} [TZ: ${birth.timezone}]
- Lagna (Ascendant): ${ascendant.sign} (${ascendant.degree}°)${ascendant.nakshatra ? ` [Nakshatra: ${ascendant.nakshatra}]` : ''}
- Moon Sign (Rashi): ${moonSign}${moonNakshatra ? ` [Nakshatra: ${moonNakshatra}]` : ''}
- Key House Lords: ${houseLords}
- Running Vimshottari Dasha: ${currentDasha}

Planetary Alignments (Whole-Sign Houses):
- ${planetSummary}`;
}
