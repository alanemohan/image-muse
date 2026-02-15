import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { fetchNasaApod, fetchNasaImageFeed } from "@/services/exploreService";

const Explore = () => {
  const nasaQuery = useQuery({
    queryKey: ["explore", "nasa-apod"],
    queryFn: fetchNasaApod,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const feedQuery = useQuery({
    queryKey: ["explore", "nasa-image-feed"],
    queryFn: () => fetchNasaImageFeed(18, Math.floor(Math.random() * 8) + 1),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 45,
    refetchOnWindowFocus: true,
  });

  const isLoading = nasaQuery.isLoading || feedQuery.isLoading;
  const hasError = nasaQuery.isError && feedQuery.isError;

  const nasa = useMemo(() => nasaQuery.data, [nasaQuery.data]);
  const feedItems = useMemo(() => feedQuery.data ?? [], [feedQuery.data]);

  return (
    <div className="min-h-screen pt-24 pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
              Explore Free APIs
            </h1>
            <p className="text-slate-400 mt-2">
              Live discovery feed powered by NASA APOD and NASA Image Library.
            </p>
            {Math.max(nasaQuery.dataUpdatedAt || 0, feedQuery.dataUpdatedAt || 0) > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Updated:{" "}
                {new Date(
                  Math.max(nasaQuery.dataUpdatedAt || 0, feedQuery.dataUpdatedAt || 0)
                ).toLocaleTimeString()}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
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
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-300">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Fetching fresh content from public APIs...
          </div>
        )}

        {hasError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            External API sources are temporarily unavailable. Try refresh in a moment.
          </div>
        )}

        {nasa && !nasaQuery.isLoading && (
          <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <h2 className="text-lg font-semibold text-cyan-200">
                NASA Astronomy Picture of the Day
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-0">
              {nasa.media_type === "image" ? (
                <img
                  src={nasa.url}
                  alt={nasa.title}
                  className="w-full h-full min-h-[280px] object-cover"
                />
              ) : (
                <iframe
                  src={nasa.url}
                  title={nasa.title}
                  className="w-full min-h-[280px]"
                  allow="autoplay; encrypted-media"
                />
              )}

              <div className="p-6 space-y-3">
                <p className="text-xs uppercase tracking-wide text-cyan-300/80">
                  {nasa.date}
                </p>
                <h3 className="text-2xl font-semibold text-slate-100">
                  {nasa.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {nasa.explanation}
                </p>
                <a
                  href={nasa.hdurl || nasa.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 text-sm"
                >
                  Open source media
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>
        )}

        {!feedQuery.isLoading && feedItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-200">NASA Image Library Feed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {feedItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-white/10 bg-slate-900/60"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-slate-200 font-medium line-clamp-2">{item.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                    {item.photographer && (
                      <p className="text-xs text-slate-400">By {item.photographer}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {item.dateCreated ? new Date(item.dateCreated).toLocaleDateString() : "Date n/a"}
                    </p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 text-xs"
                    >
                      View source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Explore;
