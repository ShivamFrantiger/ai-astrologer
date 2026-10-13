/**
 * @fileOverview Core types for Vedic Kundli representations
 */

export interface PlanetInfo {
  name: string;
  sign: string;
  degree: number;
  house: number;
  retrograde: boolean;
  nakshatra?: string;
  pada?: number;
}

export interface AscendantInfo {
  sign: string;
  degree: number;
  nakshatra?: string;
}

export interface DashaInfo {
  currentMahadasha?: string;
  currentAntardasha?: string;
  currentPratyantardasha?: string;
  periods?: Array<{
    planet: string;
    start: string;
    end: string;
    antardasha?: Array<{
      planet: string;
      start: string;
      end: string;
    }>;
  }>;
}

export interface BirthDetails {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  place: string;
  lat: number;
  lon: number;
  timezone: string;
  isApproximateTime?: boolean;
}

export interface NormalizedKundli {
  id?: string;
  label?: string; // Profile label (e.g. "Self", "Wife", "Friend")
  birth: BirthDetails;
  ascendant: AscendantInfo;
  moonSign: string;
  moonNakshatra?: string;
  sunSign?: string;
  planets: PlanetInfo[];
  dasha?: DashaInfo;
  chartSvg: string;
  createdAt?: string;
}

// Prokerala raw structures
export interface ProkeralaPlanetPosition {
  id: number;
  name: string;
  longitude: number;
  is_retrograde: boolean;
  position: number; // 1 to 12
  degree: number;
  rasi: {
    id: number;
    name: string;
    lord?: {
      id: number;
      name: string;
      vedic_name?: string;
    };
  };
  nakshatra?: {
    id: number;
    name: string;
    pada: number;
  };
}

export interface ProkeralaPlanetResponse {
  status: string;
  data: {
    planet_position: ProkeralaPlanetPosition[];
  };
}

export interface ProkeralaDashaPeriod {
  id: number;
  name: string;
  start: string;
  end: string;
  antardasha?: Array<{
    id: number;
    name: string;
    start: string;
    end: string;
  }>;
}

export interface ProkeralaDashaResponse {
  status: string;
  data: {
    dasha_periods: ProkeralaDashaPeriod[];
  };
}
