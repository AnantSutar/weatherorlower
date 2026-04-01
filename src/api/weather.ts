import type { City } from "../components/game/types";

const RANDOM_CITY_URL = "https://random-city-api.vercel.app/api/random-city";
const MAX_CITY_ATTEMPTS = 8;

export function getCityKey(city: City) {
  return `${city.name.trim().toLowerCase()}-${city.country.trim().toLowerCase()}`;
}

async function fetchRandomCityName(): Promise<string> {
  const response = await fetch(RANDOM_CITY_URL);

  if (!response.ok) {
    throw new Error("Couldn't fetch a random city.");
  }

  const data = (await response.json()) as { city?: unknown };
  const rawCity = typeof data.city === "string" ? data.city.trim() : "";

  if (!rawCity) {
    throw new Error("Random city service returned invalid data.");
  }

  try {
    return decodeURIComponent(rawCity);
  } catch {
    return rawCity;
  }
}

async function fetchWeatherForCity(
  cityName: string,
  apiKey: string,
): Promise<City | null> {
  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(cityName)}&aqi=no`,
  );

  const data = (await response.json()) as {
    error?: { message?: string };
    location?: { country?: unknown; name?: unknown };
    current?: { temp_c?: unknown; condition?: { icon?: unknown } };
  };

  if (!response.ok) {
    const isMissingCity =
      typeof data.error?.message === "string" &&
      data.error.message.toLowerCase().includes("no matching location found");

    if (isMissingCity) {
      return null;
    }

    throw new Error("Weather service is unavailable right now.");
  }

  if (data.error) {
    return null;
  }

  const name =
    typeof data.location?.name === "string" ? data.location.name.trim() : "";
  const country =
    typeof data.location?.country === "string"
      ? data.location.country.trim()
      : "";
  const temp =
    typeof data.current?.temp_c === "number" ? data.current.temp_c : null;
  const icon =
    typeof data.current?.condition?.icon === "string"
      ? data.current.condition.icon
      : "";

  if (!name || !country || temp === null) {
    return null;
  }

  return {
    name,
    country,
    temp,
    img: icon ? (icon.startsWith("//") ? `https:${icon}` : icon) : "",
  };
}

export async function buildPlayableCity(
  apiKey: string,
  excludedKeys: string[] = [],
): Promise<City> {
  const blockedKeys = new Set(excludedKeys);

  for (let attempt = 0; attempt < MAX_CITY_ATTEMPTS; attempt += 1) {
    const cityName = await fetchRandomCityName();
    const city = await fetchWeatherForCity(cityName, apiKey);

    if (!city || blockedKeys.has(getCityKey(city))) {
      continue;
    }

    return city;
  }

  throw new Error("Couldn't find a valid city matchup. Please try again.");
}

export async function createInitialMatchup(apiKey: string) {
  const currentCity = await buildPlayableCity(apiKey);
  const nextCity = await buildPlayableCity(apiKey, [getCityKey(currentCity)]);

  return {
    currentCity,
    nextCity,
  };
}

export async function createNextCity(apiKey: string, baseCity: City) {
  return buildPlayableCity(apiKey, [getCityKey(baseCity)]);
}
