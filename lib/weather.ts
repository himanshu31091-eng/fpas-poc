// ---------------------------------------------------------------------------
// Weather at Amsterdam Schiphol for arrival-day planning.
//
// Live data comes from Open-Meteo (free, no API key, CORS-friendly). If the
// call fails or the arrival date is outside the ~16-day forecast window, we
// fall back to a deterministic mock so the demo never breaks — same spirit as
// the flightStatus() mock in lib/jobs.ts.
//
// Weather is decision-support for live-animal welfare and airline temperature
// embargoes; it is not authoritative and nothing here schedules or blocks a
// shipment on its own.
// ---------------------------------------------------------------------------

export const AMS = { lat: 52.3105, lon: 4.7683, name: "Amsterdam Schiphol" };

export interface DayWeather {
  date: string; // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  code: number; // WMO weather code
  windKph: number;
  source: "live" | "mock";
}

/** WMO weather-code → short label + emoji. */
export function weatherLabel(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: "Clear", emoji: "☀️" };
  if (code <= 3) return { label: "Partly cloudy", emoji: "⛅" };
  if (code === 45 || code === 48) return { label: "Fog", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", emoji: "🌦️" };
  if (code >= 61 && code <= 67) return { label: "Rain", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { label: "Snow", emoji: "❄️" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", emoji: "🌦️" };
  if (code >= 85 && code <= 86) return { label: "Snow showers", emoji: "🌨️" };
  if (code >= 95) return { label: "Thunderstorm", emoji: "⛈️" };
  return { label: "Cloudy", emoji: "☁️" };
}

export type WelfareLevel = "ok" | "cold" | "heat";

/**
 * Arrival-day welfare flag. Thresholds are conservative demo values, not a
 * regulatory rule — outside a comfortable band, live-animal handling needs
 * extra care (and airlines may impose temperature embargoes).
 */
export function welfareFlag(day: DayWeather): { level: WelfareLevel; label: string } {
  if (day.tempMaxC >= 27) return { level: "heat", label: "Heat — welfare risk" };
  if (day.tempMinC <= 4) return { level: "cold", label: "Cold-weather handling" };
  return { level: "ok", label: "Within safe range" };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic, plausible AMS forecast for a date (offline fallback). */
export function mockForecastDay(date: string): DayWeather {
  const h = hashStr(date || "x");
  const month = Number(date?.slice(5, 7)) || 6;
  // Rough monthly average highs for Amsterdam (Jan…Dec).
  const seasonal = [6, 7, 10, 13, 17, 20, 22, 22, 19, 14, 9, 6][(month - 1 + 12) % 12];
  const tempMaxC = seasonal + ((h % 9) - 4);
  const tempMinC = tempMaxC - (3 + ((h >> 3) % 6));
  const codes = [0, 1, 2, 3, 45, 61, 63, 80, 95];
  const code = codes[h % codes.length];
  const windKph = 8 + ((h >> 5) % 32);
  return { date, tempMaxC, tempMinC, code, windKph, source: "mock" };
}

/**
 * Fetch a daily AMS forecast (up to 16 days) from Open-Meteo, keyed by date.
 * Returns null on any failure so the caller can fall back to the mock.
 */
export async function fetchAmsForecast(
  signal?: AbortSignal
): Promise<Map<string, DayWeather> | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${AMS.lat}&longitude=${AMS.lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max` +
    `&timezone=Europe%2FAmsterdam&forecast_days=16`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.daily;
    if (!d?.time?.length) return null;
    const map = new Map<string, DayWeather>();
    for (let i = 0; i < d.time.length; i++) {
      map.set(d.time[i], {
        date: d.time[i],
        tempMaxC: d.temperature_2m_max[i],
        tempMinC: d.temperature_2m_min[i],
        code: d.weather_code[i],
        windKph: d.wind_speed_10m_max[i],
        source: "live",
      });
    }
    return map;
  } catch {
    return null;
  }
}
