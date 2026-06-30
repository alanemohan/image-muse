import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import {
  dedupeNasaImageItems,
  fetchNasaApod,
  fetchNasaImageFeed,
} from "@/services/exploreService";

const FEED_PAGE_SIZE = 18;

const Explore = () => {
  const nasaQuery = useQuery({
    queryKey: ["explore", "nasa-apod"],
    queryFn: fetchNasaApod,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const feedQuery = useInfiniteQuery({
    queryKey: ["explore", "nasa-image-feed"],
    queryFn: ({ pageParam = 1 }) => fetchNasaImageFeed(FEED_PAGE_SIZE, pageParam),
    initialPageParam: 1,
    staleTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < FEED_PAGE_SIZE ? undefined : allPages.length + 1,
  });

  const feedItems = useMemo(
    () => dedupeNasaImageItems(feedQuery.data?.pages.flat() ?? []),
    [feedQuery.data]
  );

  const isLoading = nasaQuery.isLoading || feedQuery.isLoading;
  const hasError = nasaQuery.isError && feedQuery.isError;
  const latestUpdatedAt = Math.max(
    nasaQuery.dataUpdatedAt || 0,
    feedQuery.dataUpdatedAt || 0
  );

  return (
    <div className="min-h-screen px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Explore
            </div>
            <h1 className="mt-3 text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
              Real public image sources
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Live NASA APOD plus a paged NASA image library feed with stable caching and duplicate filtering.
            </p>
            {latestUpdatedAt > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Updated {new Date(latestUpdatedAt).toLocaleTimeString()}.
              </p>
            )}
          </div>

          <Button
            variant="outline"
            className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
            onClick={() => {
              void nasaQuery.refetch();
              void feedQuery.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Sources
          </Button>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-10 text-center text-slate-300">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Fetching fresh content from NASA APIs...
          </div>
        )}

        {hasError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            External API sources are temporarily unavailable. Try again in a moment.
          </div>
        )}

        {nasaQuery.data && !nasaQuery.isLoading && (
          <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/70">
            <div className="flex items-center gap-2 border-b border-white/10 p-5">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <h2 className="text-lg font-semibold text-cyan-200">
                NASA Astronomy Picture of the Day
              </h2>
            </div>

            <div className="grid gap-0 lg:grid-cols-2">
              {nasaQuery.data.media_type === "image" ? (
                <img
                  src={nasaQuery.data.url}
                  alt={nasaQuery.data.title}
                  className="min-h-[280px] w-full object-cover"
                  loading="eager"
                />
              ) : (
                <iframe
                  src={nasaQuery.data.url}
                  title={nasaQuery.data.title}
                  className="min-h-[280px] w-full"
                  allow="autoplay; encrypted-media"
                />
              )}

              <div className="space-y-3 p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                  {nasaQuery.data.date}
                </p>
                <h3 className="text-2xl font-semibold text-slate-100">
                  {nasaQuery.data.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {nasaQuery.data.explanation}
                </p>
                <a
                  href={nasaQuery.data.hdurl || nasaQuery.data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200"
                >
                  Open source media
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-200">
              NASA Image Library Feed
            </h2>
            {feedQuery.hasNextPage && (
              <Button
                variant="outline"
                className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                onClick={() => void feedQuery.fetchNextPage()}
                disabled={feedQuery.isFetchingNextPage}
              >
                {feedQuery.isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading more
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            )}
          </div>

          {feedItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {feedItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 transition hover:border-cyan-500/30"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="h-52 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 text-sm font-medium text-slate-100">
                      {item.title}
                    </p>
                    <p className="line-clamp-3 text-xs leading-5 text-slate-400">
                      {item.description}
                    </p>
                    {item.photographer && (
                      <p className="text-xs text-slate-400">By {item.photographer}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {item.dateCreated
                        ? new Date(item.dateCreated).toLocaleDateString()
                        : "Date n/a"}
                    </p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"
                    >
                      View source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            !feedQuery.isLoading && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-center text-slate-400">
                No NASA image feed results were returned.
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
};

export default Explore;
