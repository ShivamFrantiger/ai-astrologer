/**
 * @fileOverview Normalization of astrological data into standard Vedic Kundli JSON
 */

import {
  BirthDetails,
  NormalizedKundli,
  PlanetInfo,
  ProkeralaDashaResponse,
  ProkeralaPlanetResponse,
  DashaInfo,
} from './types';

export function normalizeKundliData(params: {
  birth: BirthDetails;
  planetData: ProkeralaPlanetResponse;
  chartSvg: string;
  dashaData?: ProkeralaDashaResponse | null;
  label?: string;
}): NormalizedKundli {
  const { birth, planetData, chartSvg, dashaData, label } = params;
  const planetPositions = planetData.data?.planet_position || [];

  // Ascendant has id 100 or name 'Ascendant'
  const ascendantRaw = planetPositions.find(
    (p) => p.id === 100 || p.name.toLowerCase() === 'ascendant'
  );

  const ascSign = ascendantRaw?.rasi?.name || 'Mesha';
  const ascPosition = ascendantRaw ? ascendantRaw.position : 1;
  const ascDegree = ascendantRaw
    ? Math.round(ascendantRaw.degree * 100) / 100
    : 0;
  const ascNakshatra = ascendantRaw?.nakshatra?.name;

  // Moon has id 1 or name 'Moon'
  const moonRaw = planetPositions.find(
    (p) => p.id === 1 || p.name.toLowerCase() === 'moon'
  );
  const moonSign = moonRaw?.rasi?.name || 'Unknown';
  const moonNakshatra = moonRaw?.nakshatra?.name;

  // Sun has id 0 or name 'Sun'
  const sunRaw = planetPositions.find(
    (p) => p.id === 0 || p.name.toLowerCase() === 'sun'
  );
  const sunSign = sunRaw?.rasi?.name;

  // Planetary list excluding Ascendant
  const planets: PlanetInfo[] = planetPositions
    .filter((p) => p.id !== 100 && p.name.toLowerCase() !== 'ascendant')
    .map((p) => {
      // Whole-sign house calculation relative to Ascendant
      const house = ((p.position - ascPosition + 12) % 12) + 1;

      return {
        name: p.name,
        sign: p.rasi?.name || 'Unknown',
        degree: Math.round(p.degree * 100) / 100,
        house,
        retrograde: Boolean(p.is_retrograde),
        nakshatra: p.nakshatra?.name,
        pada: p.nakshatra?.pada,
      };
    });

  // Normalize Dasha
  let dasha: DashaInfo | undefined;
  if (dashaData?.data?.dasha_periods?.length) {
    const now = new Date();
    const periods = dashaData.data.dasha_periods.map((dp) => ({
      planet: dp.name,
      start: dp.start,
      end: dp.end,
      antardasha: dp.antardasha?.map((ad) => ({
        planet: ad.name,
        start: ad.start,
        end: ad.end,
      })),
    }));

    // Identify current running Mahadasha & Antardasha
    const currentMaha = dashaData.data.dasha_periods.find((dp) => {
      const s = new Date(dp.start);
      const e = new Date(dp.end);
      return now >= s && now <= e;
    });

    let currentAntar: string | undefined;
    if (currentMaha?.antardasha) {
      const ad = currentMaha.antardasha.find((a) => {
        const s = new Date(a.start);
        const e = new Date(a.end);
        return now >= s && now <= e;
      });
      if (ad) currentAntar = ad.name;
    }

    dasha = {
      currentMahadasha: currentMaha?.name,
      currentAntardasha: currentAntar,
      periods,
    };
  }

  return {
    label: label || 'Self',
    birth,
    ascendant: {
      sign: ascSign,
      degree: ascDegree,
      nakshatra: ascNakshatra,
    },
    moonSign,
    moonNakshatra,
    sunSign,
    planets,
    dasha,
    chartSvg,
    createdAt: new Date().toISOString(),
  };
}
