import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { geocodePlace, resolveBirthDateTime } from '@/lib/geocode';
import { fetchProkeralaKundli } from '@/lib/prokerala';
import { normalizeKundliData, NormalizedKundli } from '@/lib/kundli';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const KundliRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:mm or HH:mm:ss format'),
  place: z.string().min(2, 'Place name must be at least 2 characters'),
  userId: z.string().optional(),
});

// Per-user / per-IP rate guard
const userRateMap = new Map<string, number[]>();
const USER_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_USER = 5;

function checkUserRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = userRateMap.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => t > now - USER_RATE_LIMIT_WINDOW);

  if (validTimestamps.length >= MAX_REQUESTS_PER_USER) {
    return false;
  }

  validTimestamps.push(now);
  userRateMap.set(identifier, validTimestamps);
  return true;
}

function computeCacheKey(date: string, time: string, lat: number, lon: number): string {
  const roundedLat = lat.toFixed(4);
  const roundedLon = lon.toFixed(4);
  const rawKey = `${date}|${time.slice(0, 5)}|${roundedLat}|${roundedLon}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = KundliRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { date, time, place, userId } = parseResult.data;

    // Rate limiting identifier (userId or IP address)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const rateIdentifier = userId || ip;

    if (!checkUserRateLimit(rateIdentifier)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can calculate at most 5 charts per minute. Please try again in a moment.',
        },
        { status: 429 }
      );
    }

    // 1. Geocode place to lat/lon
    let geocode;
    try {
      geocode = await geocodePlace(place);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'Could not find the specified location.' },
        { status: 404 }
      );
    }

    // 2. Resolve timezone and exact ISO Datetime with historical offset
    let timezone: string;
    let isoDateTime: string;
    try {
      const resolved = resolveBirthDateTime({
        date,
        time,
        lat: geocode.lat,
        lon: geocode.lon,
      });
      timezone = resolved.timezone;
      isoDateTime = resolved.isoDateTime;
    } catch (err: any) {
      return NextResponse.json(
        { error: `Invalid date or time: ${err.message}` },
        { status: 400 }
      );
    }

    // 3. Check Firestore Cache first
    const cacheKey = computeCacheKey(date, time, geocode.lat, geocode.lon);
    let cachedKundli: NormalizedKundli | null = null;

    try {
      const cacheRef = doc(db, 'kundli_cache', cacheKey);
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists()) {
        cachedKundli = cacheSnap.data() as NormalizedKundli;
      }
    } catch (cacheErr) {
      console.warn('Firestore cache read error (continuing with fresh fetch):', cacheErr);
    }

    if (cachedKundli) {
      // If user is logged in, save reference to user's history if not already there
      if (userId) {
        try {
          const userKundliRef = doc(db, 'users', userId, 'kundlis', cacheKey);
          await setDoc(userKundliRef, { ...cachedKundli, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (e) {
          console.warn('Could not save to user kundli collection:', e);
        }
      }

      console.log('=== [KUNDLI DATA JSON (FROM CACHE)] ===');
      console.log(JSON.stringify(cachedKundli, null, 2));

      return NextResponse.json({
        success: true,
        cached: true,
        kundli: cachedKundli,
      });
    }

    // 4. On Cache Miss: Call Prokerala API
    let rawKundli;
    try {
      rawKundli = await fetchProkeralaKundli({
        lat: geocode.lat,
        lon: geocode.lon,
        isoDateTime,
      });
    } catch (apiErr: any) {
      console.error('Prokerala API error:', apiErr);
      const statusCode = apiErr.message?.includes('rate limit') ? 429 : 502;
      return NextResponse.json(
        {
          error: apiErr.message || 'Failed to retrieve astrological chart data from the provider.',
        },
        { status: statusCode }
      );
    }

    // 5. Normalize response into uniform Kundli JSON shape
    const normalized = normalizeKundliData({
      birth: {
        date,
        time: time.slice(0, 5),
        place: geocode.displayName,
        lat: geocode.lat,
        lon: geocode.lon,
        timezone,
      },
      planetData: rawKundli.planetData,
      chartSvg: rawKundli.chartSvg,
      dashaData: rawKundli.dashaData,
    });

    console.log('=== [KUNDLI DATA JSON] ===');
    console.log(JSON.stringify(normalized, null, 2));

    // 6. Save to Firestore cache
    try {
      const cacheRef = doc(db, 'kundli_cache', cacheKey);
      await setDoc(cacheRef, {
        ...normalized,
        createdAt: new Date().toISOString(),
      });

      // Save to user's history
      if (userId) {
        const userKundliRef = doc(db, 'users', userId, 'kundlis', cacheKey);
        await setDoc(userKundliRef, {
          ...normalized,
          savedAt: new Date().toISOString(),
        });
      }
    } catch (saveErr) {
      console.warn('Firestore cache write error:', saveErr);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      kundli: normalized,
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/kundli:', error);
    return NextResponse.json(
      {
        error: 'An unexpected internal error occurred while generating your Kundli. Please try again.',
      },
      { status: 500 }
    );
  }
}
