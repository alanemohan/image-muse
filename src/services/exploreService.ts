export type NasaApod = {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  date: string;
  copyright?: string;
};

export type NasaImageItem = {
  id: string;
  title: string;
  description: string;
  previewUrl: string;
  dateCreated: string;
  photographer?: string;
  sourceUrl: string;
};

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || "DEMO_KEY";

type NasaImageSearchResponse = {
  collection?: {
    items?: Array<{
      data?: Array<{
        nasa_id?: string;
        title?: string;
        description?: string;
        date_created?: string;
        photographer?: string;
      }>;
      links?: Array<{
        href?: string;
        render?: string;
      }>;
    }>;
  };
};

export const fetchNasaApod = async (): Promise<NasaApod> => {
  const response = await fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("NASA API unavailable");
  }

  return response.json();
};

export const fetchNasaImageFeed = async (
  limit = 18,
  page = 1
): Promise<NasaImageItem[]> => {
  const params = new URLSearchParams({
    q: "space",
    media_type: "image",
    page: String(page),
  });

  const response = await fetch(`https://images-api.nasa.gov/search?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("NASA image feed unavailable");
  }

  const payload = (await response.json()) as NasaImageSearchResponse;
  const items = Array.isArray(payload.collection?.items) ? payload.collection.items : [];

  return items
    .map((item) => {
      const data = item.data?.[0];
      const imageLink = item.links?.find((link) => link.render === "image")?.href || "";
      const id = data?.nasa_id || "";

      return {
        id,
        title: data?.title || "Untitled",
        description: data?.description || "No description available.",
        previewUrl: imageLink,
        dateCreated: data?.date_created || "",
        photographer: data?.photographer || undefined,
        sourceUrl: id ? `https://images.nasa.gov/details/${id}` : imageLink,
      };
    })
    .filter((item) => item.id && item.previewUrl)
    .slice(0, limit);
};
