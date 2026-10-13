/**
 * @fileOverview Geocoding and timezone resolution for birth places.
 */

import tzlookup from 'tz-lookup';
import { DateTime } from 'luxon';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export interface BirthDateTimeResult {
  lat: number;
  lon: number;
  displayName: string;
  timezone: string;
  isoDateTime: string; // e.g. 2000-05-14T18:32:00+05:30
}

/**
 * Geocodes a place name to latitude and longitude using Nominatim OpenStreetMap.
 * Abstracted behind a single function so it can be swapped with Google Places or another provider easily.
 */
export async function geocodePlace(place: string): Promise<GeocodeResult> {
  const trimmed = place.trim();
  if (!trimmed) {
    throw new Error('Place name cannot be empty');
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed
  )}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Jyotix-Astro/1.0 (kundli-service; contact: support@jyotix.app)',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding service unavailable (status ${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Location "${place}" not found. Please provide a more specific city or district.`);
  }

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid coordinates returned for location');
  }

  return {
    lat,
    lon,
    displayName: first.display_name || trimmed,
  };
}

/**
 * Determines IANA timezone and formats ISO 8601 with timezone offset using luxon.
 * Handles historical daylight savings & local offsets accurately.
 */
export function resolveBirthDateTime(params: {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm or HH:mm:ss
  lat: number;
  lon: number;
}): { timezone: string; isoDateTime: string } {
  const { date, time, lat, lon } = params;

  // Lookup IANA timezone name (e.g., 'Asia/Kolkata')
  const timezone = tzlookup(lat, lon);

  // Normalize time string (ensure HH:mm:ss)
  const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
  const combined = `${date}T${timeWithSeconds}`;

  // Parse using Luxon with zone to get the exact historical offset
  const dt = DateTime.fromISO(combined, { zone: timezone });

  if (!dt.isValid) {
    throw new Error(`Invalid birth date or time: ${dt.invalidReason || 'parse error'}`);
  }

  // Format as ISO 8601 with offset, e.g. 2000-05-14T18:32:00+05:30
  // Prokerala expects YYYY-MM-DDTHH:mm:ss+ZZ:ZZ
  const isoDateTime = dt.toISO({ includeOffset: true, suppressMilliseconds: true });

  if (!isoDateTime) {
    throw new Error('Failed to generate ISO datetime with timezone offset');
  }

  return {
    timezone,
    isoDateTime,
  };
}
