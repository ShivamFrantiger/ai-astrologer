/**
 * @fileOverview Astronomical Fallback Vedic Kundli Calculator
 * Calculates Sidereal (Lahiri) Ascendant, Planets (Sun to Ketu), Whole-sign Houses,
 * Nakshatras, and Vimshottari Mahadasha without external API dependencies.
 */

import { NormalizedKundli, PlanetInfo } from './types';

const RASHI_NAMES = [
  'Mesha',      // 1: Aries
  'Vrishabha',   // 2: Taurus
  'Mithuna',    // 3: Gemini
  'Karka',      // 4: Cancer
  'Simha',      // 5: Leo
  'Kanya',      // 6: Virgo
  'Tula',       // 7: Libra
  'Vrishchika',  // 8: Scorpio
  'Dhanu',      // 9: Sagittarius
  'Makara',     // 10: Capricorn
  'Kumbha',     // 11: Aquarius
  'Meena',      // 12: Pisces
];

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const DASHA_LORDS = [
  { planet: 'Ketu', years: 7 },
  { planet: 'Venus', years: 20 },
  { planet: 'Sun', years: 6 },
  { planet: 'Moon', years: 10 },
  { planet: 'Mars', years: 7 },
  { planet: 'Rahu', years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn', years: 19 },
  { planet: 'Mercury', years: 17 },
];

/**
 * Approximate Julian Day Number from UTC
 */
function getJulianDate(date: Date): number {
  const time = date.getTime();
  return time / 86400000 + 2440587.5;
}

/**
 * Approximate Lahiri Ayanamsha (degrees)
 */
function getLahiriAyanamsha(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  return 23.85 + 0.01397 * (t * 100);
}

/**
 * Calculate Approximate Nirayana (Sidereal Lahiri) Planetary Longitudes (0 - 360)
 */
export function calculateFallbackKundli(params: {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  place: string;
  lat: number;
  lon: number;
  timezone?: string;
  label?: string;
  isApproximateTime?: boolean;
}): NormalizedKundli {
  const { date, time, place, lat, lon, label = 'Self', isApproximateTime = false } = params;

  const [yearStr, monthStr, dayStr] = date.split('-');
  const [hourStr, minStr] = time.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr || '12', 10);
  const min = parseInt(minStr || '0', 10);

  // Time in UTC assuming Indian/User timezone offset approx +5.5 if India, or lon / 15
  const tzOffsetHours = lon > 60 && lon < 95 && lat > 6 && lat < 38 ? 5.5 : Math.round((lon / 15) * 2) / 2;
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - Math.floor(tzOffsetHours), min - Math.round((tzOffsetHours % 1) * 60)));

  const jd = getJulianDate(utcDate);
  const d = jd - 2451545.0;
  const ayanamsha = getLahiriAyanamsha(jd);

  // Mean Longitudes of Planets (Tropical approximation - Ayanamsha)
  const norm = (deg: number) => ((deg % 360) + 360) % 360;

  // Sun
  const L_sun = norm(280.460 + 0.9856474 * d);
  const g_sun = norm(357.528 + 0.9856003 * d) * (Math.PI / 180);
  const sunTropical = norm(L_sun + 1.915 * Math.sin(g_sun) + 0.020 * Math.sin(2 * g_sun));
  const sunNirayana = norm(sunTropical - ayanamsha);

  // Moon
  const L_moon = norm(218.316 + 13.176396 * d);
  const m_moon = norm(134.963 + 13.064993 * d) * (Math.PI / 180);
  const moonTropical = norm(L_moon + 6.289 * Math.sin(m_moon));
  const moonNirayana = norm(moonTropical - ayanamsha);

  // Mars
  const marsTropical = norm(355.433 + 0.524033 * d);
  const marsNirayana = norm(marsTropical - ayanamsha);

  // Mercury
  const mercuryNirayana = norm(sunNirayana + 14 * Math.sin((d % 116) * (2 * Math.PI / 116)));

  // Jupiter
  const jupTropical = norm(34.35 + 0.083085 * d);
  const jupNirayana = norm(jupTropical - ayanamsha);

  // Venus
  const venusNirayana = norm(sunNirayana + 28 * Math.sin((d % 584) * (2 * Math.PI / 584)));

  // Saturn
  const satTropical = norm(50.08 + 0.033444 * d);
  const satNirayana = norm(satTropical - ayanamsha);

  // Rahu (Mean node moves backwards approx 19.34 deg/year)
  const rahuNirayana = norm(125.04 - 0.0529538 * d - ayanamsha);
  const ketuNirayana = norm(rahuNirayana + 180);

  // Ascendant (Lagna) Calculation based on Local Sidereal Time
  const GMST = norm(280.46061837 + 360.98564736629 * d);
  const LST = norm(GMST + lon);
  const lstRad = LST * (Math.PI / 180);
  const epsRad = 23.439 * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  const ascTropical = norm(Math.atan2(Math.cos(lstRad), -(Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad))) * (180 / Math.PI) + 90);
  const ascNirayana = norm(ascTropical - ayanamsha);

  const getRashiIndex = (deg: number) => Math.floor(deg / 30);
  const getDegreeInRashi = (deg: number) => Math.round((deg % 30) * 100) / 100;

  const ascRashiIdx = getRashiIndex(ascNirayana);
  const ascSign = RASHI_NAMES[ascRashiIdx];
  const ascDegree = getDegreeInRashi(ascNirayana);

  const getNakshatraInfo = (deg: number) => {
    const nakIdx = Math.floor(deg / (360 / 27));
    const rem = deg % (360 / 27);
    const pada = Math.floor(rem / ((360 / 27) / 4)) + 1;
    return { name: NAKSHATRA_NAMES[nakIdx % 27], pada, index: nakIdx % 27 };
  };

  const ascNak = getNakshatraInfo(ascNirayana);
  const moonNak = getNakshatraInfo(moonNirayana);

  const rawPlanets = [
    { name: 'Sun', long: sunNirayana },
    { name: 'Moon', long: moonNirayana },
    { name: 'Mars', long: marsNirayana },
    { name: 'Mercury', long: mercuryNirayana },
    { name: 'Jupiter', long: jupNirayana },
    { name: 'Venus', long: venusNirayana },
    { name: 'Saturn', long: satNirayana },
    { name: 'Rahu', long: rahuNirayana },
    { name: 'Ketu', long: ketuNirayana },
  ];

  const planets: PlanetInfo[] = rawPlanets.map((p) => {
    const rIdx = getRashiIndex(p.long);
    const house = ((rIdx - ascRashiIdx + 12) % 12) + 1;
    const nak = getNakshatraInfo(p.long);
    return {
      name: p.name,
      sign: RASHI_NAMES[rIdx],
      degree: getDegreeInRashi(p.long),
      house,
      retrograde: p.name === 'Rahu' || p.name === 'Ketu',
      nakshatra: nak.name,
      pada: nak.pada,
    };
  });

  // Calculate Vimshottari Dasha
  const nakspan = 360 / 27; // 13.333 deg
  const degInNak = moonNirayana % nakspan;
  const fractionElapsed = degInNak / nakspan;

  const startLordIdx = moonNak.index % 9;
  const birthLord = DASHA_LORDS[startLordIdx];
  const balanceYears = birthLord.years * (1 - fractionElapsed);

  const birthYear = year + (month - 1) / 12 + day / 365;
  const dashaPeriods: any[] = [];

  let currentYearProgress = birthYear;
  for (let i = 0; i < 9; i++) {
    const lordIdx = (startLordIdx + i) % 9;
    const lord = DASHA_LORDS[lordIdx];
    const duration = i === 0 ? balanceYears : lord.years;

    const startY = Math.floor(currentYearProgress);
    const endY = Math.floor(currentYearProgress + duration);
    currentYearProgress += duration;

    dashaPeriods.push({
      planet: lord.planet,
      start: `${startY}-01-01`,
      end: `${endY}-12-31`,
    });
  }

  const currentYear = new Date().getFullYear();
  const currentDashaObj = dashaPeriods.find((dp) => {
    const s = parseInt(dp.start.slice(0, 4), 10);
    const e = parseInt(dp.end.slice(0, 4), 10);
    return currentYear >= s && currentYear <= e;
  }) || dashaPeriods[0];

  // Helper to map houses in North Indian Kundli geometry
  const houseCoords: Record<number, { px: number; py: number; rx: number; ry: number }> = {
    1:  { px: 200, py: 85,  rx: 200, ry: 130 }, // House 1 (Lagna, Top Diamond)
    2:  { px: 110, py: 48,  rx: 155, ry: 75 },  // House 2 (Top Left Triangle)
    3:  { px: 52,  py: 110, rx: 75,  ry: 155 }, // House 3 (Left Top Triangle)
    4:  { px: 95,  py: 200, rx: 140, ry: 205 }, // House 4 (Left Diamond)
    5:  { px: 52,  py: 290, rx: 75,  ry: 245 }, // House 5 (Left Bottom Triangle)
    6:  { px: 110, py: 350, rx: 155, ry: 330 }, // House 6 (Bottom Left Triangle)
    7:  { px: 200, py: 310, rx: 200, ry: 270 }, // House 7 (Bottom Diamond)
    8:  { px: 290, py: 350, rx: 245, ry: 330 }, // House 8 (Bottom Right Triangle)
    9:  { px: 348, py: 290, rx: 325, ry: 245 }, // House 9 (Right Bottom Triangle)
    10: { px: 305, py: 200, rx: 260, ry: 205 }, // House 10 (Right Diamond)
    11: { px: 348, py: 110, rx: 325, ry: 155 }, // House 11 (Right Top Triangle)
    12: { px: 290, py: 48,  rx: 245, ry: 75 },  // House 12 (Top Right Triangle)
  };

  const planetAbbr: Record<string, string> = {
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
    Rahu: 'Ra',
    Ketu: 'Ke',
  };

  let houseElementsSvg = '';
  for (let h = 1; h <= 12; h++) {
    const coords = houseCoords[h];
    const rashiNum = ((ascRashiIdx + (h - 1)) % 12) + 1;

    // Rashi number in soft golden text
    houseElementsSvg += `<text x="${coords.rx}" y="${coords.ry}" font-size="11" fill="#dfbe8c" font-weight="bold" text-anchor="middle" font-family="sans-serif">${rashiNum}</text>`;

    // Planets residing in this house
    const hPlanets = planets.filter((p) => p.house === h);
    if (h === 1) {
      hPlanets.unshift({ name: 'Asc', sign: ascSign, degree: ascDegree, house: 1, retrograde: false });
    }

    if (hPlanets.length > 0) {
      const plStr = hPlanets.map((p) => {
        const abbr = p.name === 'Asc' ? 'Asc' : (planetAbbr[p.name] || p.name.slice(0, 2));
        return p.retrograde ? `${abbr}(R)` : abbr;
      }).join(' ');

      houseElementsSvg += `<text x="${coords.px}" y="${coords.py}" font-size="12" fill="#ffd56b" font-weight="bold" text-anchor="middle" font-family="sans-serif">${plStr}</text>`;
    }
  }

  // Complete North Indian Chart SVG representation
  const chartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <rect width="400" height="400" fill="#131620" stroke="#d4af37" stroke-width="3" rx="10"/>
    <line x1="0" y1="0" x2="400" y2="400" stroke="#d4af37" stroke-width="1.8"/>
    <line x1="0" y1="400" x2="400" y2="0" stroke="#d4af37" stroke-width="1.8"/>
    <polygon points="200,0 400,200 200,400 0,200" fill="none" stroke="#d4af37" stroke-width="1.8"/>
    ${houseElementsSvg}
  </svg>`;

  return {
    id: `fb-${Date.now()}`,
    label,
    birth: {
      date,
      time,
      place,
      lat,
      lon,
      timezone: `UTC+${tzOffsetHours}`,
      isApproximateTime,
    },
    ascendant: {
      sign: ascSign,
      degree: ascDegree,
      nakshatra: ascNak.name,
    },
    moonSign: RASHI_NAMES[getRashiIndex(moonNirayana)],
    moonNakshatra: moonNak.name,
    sunSign: RASHI_NAMES[getRashiIndex(sunNirayana)],
    planets,
    dasha: {
      currentMahadasha: currentDashaObj.planet,
      currentAntardasha: currentDashaObj.planet === 'Saturn' ? 'Mercury' : 'Jupiter',
      periods: dashaPeriods,
    },
    chartSvg,
    createdAt: new Date().toISOString(),
  };
}
