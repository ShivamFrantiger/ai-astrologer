/**
 * @fileOverview Prokerala Astrology API Client
 * Handles OAuth2 client credentials authentication, token caching,
 * rate limiting (5 req/min), and requests for planetary positions, charts, and dasha.
 */

import {
  ProkeralaPlanetResponse,
  ProkeralaDashaResponse,
} from './kundli';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in ms
}

let cachedToken: CachedToken | null = null;

// In-memory sliding window rate guard: max 5 requests per minute
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(): void {
  const now = Date.now();
  // Remove timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new Error('API rate limit reached (max 5 requests per minute). Please try again in a minute.');
  }

  requestTimestamps.push(now);
}

/**
 * Retrieves a valid OAuth2 access token, reusing cached token if unexpired.
 */
async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // Buffer by 60 seconds before actual expiration
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > now + 60 * 1000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'paste_here' || clientSecret === 'paste_here') {
    throw new Error('Prokerala API credentials are not properly configured in environment variables.');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId.trim());
  params.append('client_secret', clientSecret.trim());

  let response: Response;
  try {
    response = await fetch('https://api.prokerala.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err: any) {
    throw new Error(`Failed to connect to Prokerala authentication service: ${err.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 400) {
      throw new Error('Prokerala API authentication failed. Please check your Client ID and Client Secret.');
    }
    throw new Error(`Prokerala token error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Performs an authenticated GET request to Prokerala API with automatic retry on token expiry.
 */
async function fetchProkerala(endpoint: string, searchParams: Record<string, string>, retryOn401 = true): Promise<Response> {
  checkRateLimit();

  const token = await getAccessToken();
  const url = new URL(`https://api.prokerala.com/v2/astrology/${endpoint}`);
  for (const [key, val] of Object.entries(searchParams)) {
    url.searchParams.append(key, val);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: endpoint === 'chart' ? 'image/svg+xml, application/json' : 'application/json',
    },
  });

  if (response.status === 401 && retryOn401) {
    // Force refresh token once
    await getAccessToken(true);
    return fetchProkerala(endpoint, searchParams, false);
  }

  return response;
}

export interface FetchKundliRawResult {
  planetData: ProkeralaPlanetResponse;
  chartSvg: string;
  dashaData?: ProkeralaDashaResponse | null;
}

/**
 * Fetches planet position and North Indian SVG chart from Prokerala in parallel.
 * Also attempts to fetch Dasha periods if supported on current plan.
 */
export async function fetchProkeralaKundli(params: {
  lat: number;
  lon: number;
  isoDateTime: string;
}): Promise<FetchKundliRawResult> {
  const { lat, lon, isoDateTime } = params;
  const coordinates = `${lat},${lon}`;
  const ayanamsa = '1'; // 1 = Lahiri

  // Common parameters
  const commonParams = {
    ayanamsa,
    coordinates,
    datetime: isoDateTime,
  };

  // Run planet-position and chart requests in parallel
  const [planetRes, chartRes, dashaRes] = await Promise.allSettled([
    fetchProkerala('planet-position', commonParams),
    fetchProkerala('chart', {
      ...commonParams,
      chart_type: 'rasi',
      chart_style: 'north-indian',
      format: 'svg',
    }),
    fetchProkerala('dasha-periods', commonParams),
  ]);

  // Handle planet position response
  if (planetRes.status === 'rejected') {
    throw new Error(`Failed to fetch planet positions: ${planetRes.reason.message}`);
  }
  const planetResponse = planetRes.value;
  if (!planetResponse.ok) {
    if (planetResponse.status === 429) {
      throw new Error('Prokerala rate limit exceeded (5 requests/min limit). Please try again in a minute.');
    }
    const errText = await planetResponse.text();
    let parsedMessage = errText;
    try {
      const errObj = JSON.parse(errText);
      if (errObj.errors && errObj.errors[0]?.detail) {
        parsedMessage = errObj.errors[0].detail;
        if (parsedMessage.toLowerCase().includes('sandbox mode')) {
          parsedMessage += ' (To calculate charts for any birth date, activate Live mode for your app in the Prokerala Developer Dashboard).';
        }
      }
    } catch {}
    throw new Error(`Astrology API error: ${parsedMessage}`);
  }
  const planetData: ProkeralaPlanetResponse = await planetResponse.json();

  // Handle chart response
  if (chartRes.status === 'rejected') {
    throw new Error(`Failed to fetch chart: ${chartRes.reason.message}`);
  }
  const chartResponse = chartRes.value;
  if (!chartResponse.ok) {
    if (chartResponse.status === 429) {
      throw new Error('Prokerala rate limit exceeded. Please try again in a minute.');
    }
    const errText = await chartResponse.text();
    throw new Error(`Error fetching chart SVG (${chartResponse.status}): ${errText}`);
  }
  const chartSvg = await chartResponse.text();

  // Handle dasha response (optional, graceful degradation if plan restricts it)
  let dashaData: ProkeralaDashaResponse | null = null;
  if (dashaRes.status === 'fulfilled' && dashaRes.value.ok) {
    try {
      dashaData = await dashaRes.value.json();
    } catch {
      dashaData = null;
    }
  }

  return {
    planetData,
    chartSvg,
    dashaData,
  };
}
