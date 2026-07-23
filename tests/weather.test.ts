import { describe, it, expect } from "vitest";
import { weatherLabel, welfareFlag, mockForecastDay, type DayWeather } from "@/lib/weather";

const day = (o: Partial<DayWeather> = {}): DayWeather => ({
  date: "2026-07-24", tempMaxC: 20, tempMinC: 12, code: 1, windKph: 15, source: "mock", ...o,
});

describe("weather · weatherLabel", () => {
  it("maps WMO codes to labels", () => {
    expect(weatherLabel(0).label).toBe("Clear");
    expect(weatherLabel(2).label).toBe("Partly cloudy");
    expect(weatherLabel(61).label).toBe("Rain");
    expect(weatherLabel(95).label).toBe("Thunderstorm");
    expect(weatherLabel(4).label).toBe("Cloudy"); // unmatched code → fallback
  });
});

describe("weather · welfareFlag", () => {
  it("flags heat at/above 27°C max", () => {
    expect(welfareFlag(day({ tempMaxC: 30 })).level).toBe("heat");
    expect(welfareFlag(day({ tempMaxC: 27 })).level).toBe("heat");
  });
  it("flags cold at/below 4°C min", () => {
    expect(welfareFlag(day({ tempMaxC: 6, tempMinC: 2 })).level).toBe("cold");
  });
  it("is ok within the comfortable band", () => {
    expect(welfareFlag(day({ tempMaxC: 20, tempMinC: 12 })).level).toBe("ok");
  });
});

describe("weather · mockForecastDay", () => {
  it("is deterministic for a date and marked as mock", () => {
    const a = mockForecastDay("2026-07-24");
    const b = mockForecastDay("2026-07-24");
    expect(a).toEqual(b);
    expect(a.source).toBe("mock");
    expect(a.tempMaxC).toBeGreaterThanOrEqual(a.tempMinC);
  });
});
