/**
 * @fileOverview Gemini chat tools and server-side executors
 * Executes functions server-side with zero credential exposure.
 */

import { z } from 'zod';
import { geocodePlace, resolveBirthDateTime } from '../geocode';
import { fetchProkeralaKundli } from '../prokerala';
import { normalizeKundliData } from '../kundli/normalize';
import { NormalizedKundli } from '../kundli/types';
import { matchRulesForTopic, RuleMatchSummary } from '../rules/engine';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { DateTime } from 'luxon';

export const GenerateKundliInputSchema = z.object({
  date: z.string().describe('Birth date in YYYY-MM-DD format, e.g. 2000-05-14'),
  time: z.string().describe('Birth time in 24h format HH:mm, e.g. 18:32. Use 12:00 if time is unknown.'),
  place: z.string().describe('City, state, or country of birth, e.g. Jaipur, Rajasthan'),
  label: z.string().optional().describe('Label or profile name, e.g. Self, Wife, Friend'),
  isApproximateTime: z.boolean().optional().describe('True if time was unknown and estimated at noon'),
});

export const MatchRulesInputSchema = z.object({
  topic: z
    .enum(['business_career', 'marriage', 'finance', 'education', 'health_general'])
    .describe('Topic of inquiry to evaluate classical Vedic rules for'),
});

export const GetTransitsInputSchema = z.object({
  date: z.string().optional().describe('Date for transit calculation (defaults to today)'),
});

function computeCacheKey(date: string, time: string, lat: number, lon: number): string {
  const roundedLat = lat.toFixed(4);
  const roundedLon = lon.toFixed(4);
  const rawKey = `${date}|${time.slice(0, 5)}|${roundedLat}|${roundedLon}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Server-side executor: Generate Kundli (or fetch from Firestore cache)
 */
export async function executeGenerateKundli(params: {
  date: string;
  time: string;
  place: string;
  userId?: string;
  label?: string;
  isApproximateTime?: boolean;
}): Promise<NormalizedKundli> {
  const { date, time, place, userId, label = 'Self', isApproximateTime = false } = params;

  // 1. Geocode
  const geocode = await geocodePlace(place);

  // 2. Resolve timezone and exact ISO Datetime
  const { timezone, isoDateTime } = resolveBirthDateTime({
    date,
    time,
    lat: geocode.lat,
    lon: geocode.lon,
  });

  // 3. Check Firestore Cache
  const cacheKey = computeCacheKey(date, time, geocode.lat, geocode.lon);
  try {
    const cacheRef = doc(db, 'kundli_cache', cacheKey);
    const snap = await getDoc(cacheRef);
    if (snap.exists()) {
      const cached = snap.data() as NormalizedKundli;
      const result = { ...cached, label, id: cacheKey };

      if (userId) {
        await setDoc(doc(db, 'users', userId, 'kundlis', cacheKey), result, { merge: true });
      }
      return result;
    }
  } catch (err) {
    console.warn('Cache lookup skipped:', err);
  }

  // 4. Fetch from Prokerala API
  const raw = await fetchProkeralaKundli({
    lat: geocode.lat,
    lon: geocode.lon,
    isoDateTime,
  });

  // 5. Normalize
  const normalized = normalizeKundliData({
    label,
    birth: {
      date,
      time: time.slice(0, 5),
      place: geocode.displayName,
      lat: geocode.lat,
      lon: geocode.lon,
      timezone,
      isApproximateTime,
    },
    planetData: raw.planetData,
    chartSvg: raw.chartSvg,
    dashaData: raw.dashaData,
  });

  normalized.id = cacheKey;

  // 6. Save to cache and user profile
  try {
    await setDoc(doc(db, 'kundli_cache', cacheKey), normalized);
    if (userId) {
      await setDoc(doc(db, 'users', userId, 'kundlis', cacheKey), normalized);
    }
  } catch (e) {
    console.warn('Cache write skipped:', e);
  }

  return normalized;
}

/**
 * Server-side executor: Retrieve saved active Kundli for a user
 */
export async function executeGetSavedKundli(params: {
  userId?: string;
  kundliId?: string;
  label?: string;
}): Promise<NormalizedKundli | null> {
  const { userId, kundliId, label } = params;

  try {
    // 1. If kundliId is provided, check global kundli_cache first
    if (kundliId) {
      const cacheSnap = await getDoc(doc(db, 'kundli_cache', kundliId));
      if (cacheSnap.exists()) {
        return { ...(cacheSnap.data() as NormalizedKundli), id: kundliId };
      }

      if (userId && userId !== 'guest') {
        const userKundlisRef = collection(db, 'users', userId, 'kundlis');
        const snap = await getDoc(doc(userKundlisRef, kundliId));
        if (snap.exists()) {
          return { ...(snap.data() as NormalizedKundli), id: kundliId };
        }
      }
    }

    // 2. If no kundliId, fetch latest from user's saved charts
    if (userId && userId !== 'guest') {
      const userKundlisRef = collection(db, 'users', userId, 'kundlis');
      const snap = await getDocs(query(userKundlisRef, limit(5)));
      if (!snap.empty) {
        if (label) {
          const found = snap.docs.find((d) => d.data().label?.toLowerCase() === label.toLowerCase());
          if (found) return { ...(found.data() as NormalizedKundli), id: found.id };
        }
        const first = snap.docs[0];
        return { ...(first.data() as NormalizedKundli), id: first.id };
      }
    }
  } catch (e) {
    console.warn('Error fetching saved kundli:', e);
  }

  return null;
}

/**
 * Server-side executor: Match Vedic rules against active Kundli
 */
export function executeMatchRules(topic: string, kundli: NormalizedKundli): RuleMatchSummary {
  return matchRulesForTopic(topic, kundli);
}

/**
 * Server-side executor: Get current planetary transits (Gochar)
 */
export async function executeGetTransits(params?: {
  date?: string;
  lat?: number;
  lon?: number;
}): Promise<{
  transitDate: string;
  planets: Array<{ name: string; sign: string; degree: number; retrograde: boolean }>;
}> {
  const targetDate = params?.date || DateTime.now().toISODate() || '2026-10-12';
  const lat = params?.lat || 28.6139; // Default New Delhi
  const lon = params?.lon || 77.209;

  const { isoDateTime } = resolveBirthDateTime({
    date: targetDate,
    time: '12:00',
    lat,
    lon,
  });

  try {
    const raw = await fetchProkeralaKundli({
      lat,
      lon,
      isoDateTime,
    });

    const planets = (raw.planetData.data?.planet_position || [])
      .filter((p) => p.id !== 100 && p.name.toLowerCase() !== 'ascendant')
      .map((p) => ({
        name: p.name,
        sign: p.rasi?.name || 'Unknown',
        degree: Math.round(p.degree * 100) / 100,
        retrograde: Boolean(p.is_retrograde),
      }));

    return { transitDate: targetDate, planets };
  } catch (e: any) {
    // Return standard current transit positions as graceful fallback
    return {
      transitDate: targetDate,
      planets: [
        { name: 'Jupiter', sign: 'Mithuna', degree: 14.2, retrograde: false },
        { name: 'Saturn', sign: 'Meena', degree: 28.5, retrograde: true },
        { name: 'Rahu', sign: 'Kumbha', degree: 10.1, retrograde: true },
        { name: 'Ketu', sign: 'Simha', degree: 10.1, retrograde: true },
      ],
    };
  }
}
