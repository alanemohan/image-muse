export type GeoInfo = {
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
};

export type WeatherResponse = {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export type SpaceNewsArticle = {
  id: number;
  title: string;
  summary: string;
  url: string;
  image_url: string;
  published_at: string;
  news_site: string;
};

export const fetchGeoInfo = async (): Promise<GeoInfo> => {
  const providers = [
    "https://ipapi.co/json/",
    "https://ipwho.is/",
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }

      const payload = await response.json();

      if (url.includes("ipapi.co")) {
        if (
          typeof payload?.city === "string" &&
          typeof payload?.region === "string" &&
          typeof payload?.country_name === "string" &&
          typeof payload?.latitude === "number" &&
          typeof payload?.longitude === "number"
        ) {
          return payload;
        }
        continue;
      }

      if (
        payload?.success === true &&
        typeof payload?.city === "string" &&
        typeof payload?.region === "string" &&
        typeof payload?.country === "string" &&
        typeof payload?.latitude === "number" &&
        typeof payload?.longitude === "number"
      ) {
        return {
          city: payload.city,
          region: payload.region,
          country_name: payload.country,
          latitude: payload.latitude,
          longitude: payload.longitude,
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error("Could not fetch geolocation");
};

export const fetchWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherResponse> => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not fetch weather");
  }
  return response.json();
};

export const fetchSpaceNews = async (limit = 6): Promise<SpaceNewsArticle[]> => {
  const response = await fetch(
    `https://api.spaceflightnewsapi.net/v4/articles/?limit=${limit}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Could not fetch space news");
  }

  const data = await response.json();
  return data.results ?? [];
};
