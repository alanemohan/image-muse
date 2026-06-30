import { apiFetch } from "./apiClient";
import type { GalleryImage } from "@/types/gallery";

export type HnStory = {
  objectID: string;
  title: string;
  url?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
  story_text?: string;
  author?: string;
  _highlightResult?: {
    title?: { value?: string };
  };
};

export type ResearchPaper = {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  authors: string[];
  categories: string[];
};

export type StudioSignal = {
  totalImages: number;
  analyzedImages: number;
  averageConfidence: number | null;
  topTags: Array<{ tag: string; count: number }>;
  recentImages: GalleryImage[];
};

const cache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

const fetchJsonCached = async <T>(url: string, ttlMs: number): Promise<T> => {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const pending = inFlight.get(url);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = fetch(url, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return (await response.json()) as T;
    })
    .then((value) => {
      cache.set(url, { expiresAt: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, request);
  return request;
};

const fetchXmlCached = async (url: string, ttlMs: number): Promise<Document> => {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as Document;
  }

  const pending = inFlight.get(url);
  if (pending) {
    return pending as Promise<Document>;
  }

  const request = fetch(url, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      const xmlText = await response.text();
      return new DOMParser().parseFromString(xmlText, "application/xml");
    })
    .then((value) => {
      cache.set(url, { expiresAt: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, request);
  return request;
};

const uniqueBy = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const fetchAiCommunityStories = async (): Promise<HnStory[]> => {
  const queries = [
    "artificial intelligence",
    "prompt engineering",
    "image generation",
    "multimodal",
  ];

  const responses = await Promise.all(
    queries.map((query) =>
      fetchJsonCached<{ hits?: HnStory[] }>(
        `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=6&query=${encodeURIComponent(query)}`,
        1000 * 60 * 10
      ).catch(() => ({ hits: [] }))
    )
  );

  return uniqueBy(
    responses.flatMap((response) => response.hits ?? []),
    (story) => story.objectID
  ).slice(0, 12);
};

export const fetchResearchRadar = async (): Promise<ResearchPaper[]> => {
  const query = encodeURIComponent("cat:cs.AI OR cat:cs.CV OR cat:stat.ML OR cat:eess.IV");
  const url = `https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending`;
  const xml = await fetchXmlCached(url, 1000 * 60 * 30);

  const entries = Array.from(xml.getElementsByTagName("entry"));

  return entries
    .map((entry) => {
      const getText = (tag: string) => entry.getElementsByTagName(tag)[0]?.textContent?.trim() || "";
      const id = getText("id");
      const title = getText("title").replace(/\s+/g, " ");
      const summary = getText("summary").replace(/\s+/g, " ");
      const publishedAt = getText("published");
      const authors = Array.from(entry.getElementsByTagName("author"))
        .map((author) => author.getElementsByTagName("name")[0]?.textContent?.trim() || "")
        .filter(Boolean);
      const categories = Array.from(entry.getElementsByTagName("category"))
        .map((category) => category.getAttribute("term") || "")
        .filter(Boolean);

      return {
        id,
        title,
        summary,
        url: id,
        publishedAt,
        authors,
        categories,
      };
    })
    .filter((paper) => paper.id && paper.title && paper.summary);
};

export const fetchStudioSignal = async (): Promise<StudioSignal> => {
  const data = await apiFetch<{ images: GalleryImage[] }>("/images");
  const images = Array.isArray(data.images) ? data.images : [];
  const analyzedImages = images.filter((image) => Boolean(image.analysis)).length;
  const confidenceValues = images
    .map((image) => image.analysis?.confidence)
    .filter((value): value is number => typeof value === "number");

  const tagCounts = new Map<string, number>();
  for (const image of images) {
    for (const tag of image.tags || []) {
      const normalized = tag.trim();
      if (!normalized) continue;
      tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
    }
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalImages: images.length,
    analyzedImages,
    averageConfidence: confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : null,
    topTags,
    recentImages: images.slice(0, 6),
  };
};
