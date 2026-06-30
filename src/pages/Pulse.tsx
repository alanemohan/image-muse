import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  AlertCircle,
  ArrowUpRight,
  BrainCircuit,
  Layers3,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";
import {
  fetchAiCommunityStories,
  fetchResearchRadar,
  fetchStudioSignal,
} from "@/services/pulseService";

const Pulse = () => {
  const researchQuery = useQuery({
    queryKey: ["pulse", "research-radar"],
    queryFn: fetchResearchRadar,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const communityQuery = useQuery({
    queryKey: ["pulse", "community-stories"],
    queryFn: fetchAiCommunityStories,
    staleTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
  });

  const studioQuery = useQuery({
    queryKey: ["pulse", "studio-signal"],
    queryFn: fetchStudioSignal,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const lastUpdate = Math.max(
    researchQuery.dataUpdatedAt || 0,
    communityQuery.dataUpdatedAt || 0,
    studioQuery.dataUpdatedAt || 0
  );

  const briefing = useMemo(() => {
    const topResearchTopic = researchQuery.data?.[0]?.categories?.[0] || "AI research";
    const topCommunityStory = communityQuery.data?.[0]?.title || "community discussion";
    const topTag = studioQuery.data?.topTags?.[0]?.tag || "your gallery";

    return [
      `Research is centered on ${topResearchTopic}.`,
      `Community momentum is clustering around ${topCommunityStory}.`,
      `Your gallery is currently strongest around ${topTag}.`,
    ];
  }, [communityQuery.data, researchQuery.data, studioQuery.data]);

  const isLoading = researchQuery.isLoading || communityQuery.isLoading || studioQuery.isLoading;
  const hasError = researchQuery.isError || communityQuery.isError || studioQuery.isError;

  return (
    <div className="min-h-screen px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
              <BrainCircuit className="h-3.5 w-3.5" />
              Pulse
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
                AI studio briefing
              </h1>
              <p className="mt-2 max-w-3xl text-slate-400">
                A live dashboard for AI research, creator conversations, and what is happening inside your own studio.
              </p>
              {lastUpdate > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Updated {new Date(lastUpdate).toLocaleTimeString()}.
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
            onClick={() => {
              void researchQuery.refetch();
              void communityQuery.refetch();
              void studioQuery.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Briefing
          </Button>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-10 text-center text-slate-300">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
            Assembling today&apos;s AI briefing...
          </div>
        )}

        {hasError && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            One or more Pulse sources are temporarily unavailable. Cached data will be used where possible.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <StatTile
            icon={Layers3}
            label="Studio Images"
            value={String(studioQuery.data?.totalImages ?? 0)}
            sublabel={`${studioQuery.data?.analyzedImages ?? 0} analyzed`}
          />
          <StatTile
            icon={TrendingUp}
            label="Average Confidence"
            value={
              studioQuery.data?.averageConfidence == null
                ? "n/a"
                : `${Math.round(studioQuery.data.averageConfidence * 100)}%`
            }
            sublabel="Across recent analyses"
          />
          <StatTile
            icon={Wand2}
            label="Community Stories"
            value={String(communityQuery.data?.length ?? 0)}
            sublabel="Live from Hacker News"
          />
        </div>

        <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center gap-2 text-cyan-200">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Daily briefing</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {briefing.map((line) => (
              <div key={line} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                {line}
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Research radar</h2>
                <p className="text-sm text-slate-400">Fresh papers from arXiv across vision and machine learning.</p>
              </div>
              <Badge variant="outline" className="border-cyan-500/20 text-cyan-200">
                Live
              </Badge>
            </div>

            {researchQuery.isLoading ? (
              <LoadingBlock label="Loading research" />
            ) : (
              <div className="space-y-3">
                {(researchQuery.data ?? []).slice(0, 6).map((paper) => (
                  <a
                    key={paper.id}
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-500/30 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="line-clamp-2 text-sm font-medium text-slate-100">{paper.title}</p>
                        <p className="line-clamp-3 text-xs leading-5 text-slate-400">{paper.summary}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {paper.categories.slice(0, 4).map((category) => (
                            <Badge key={category} variant="outline" className="border-white/10 text-slate-300">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Your studio signal</h2>
                <p className="text-sm text-slate-400">What the gallery has learned from your uploads.</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-200">
                Personalized
              </Badge>
            </div>

            {studioQuery.isLoading ? (
              <LoadingBlock label="Loading studio signal" />
            ) : studioQuery.data ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {studioQuery.data.topTags.slice(0, 4).map((tag) => (
                    <div key={tag.tag} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Top tag</p>
                      <p className="mt-2 text-sm font-medium text-slate-100">{tag.tag}</p>
                      <p className="text-xs text-slate-400">Appears in {tag.count} images</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {studioQuery.data.recentImages.slice(0, 4).map((image) => (
                    <div key={image.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{image.title}</p>
                          <p className="text-xs text-slate-400">{image.description || image.caption || "No summary available"}</p>
                        </div>
                        {image.analysis?.confidence != null && (
                          <Badge variant="outline" className="border-cyan-500/20 text-cyan-200">
                            {Math.round(image.analysis.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </GlassCard>
        </div>

        <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center gap-2 text-sky-200">
            <Wand2 className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Community discoveries</h2>
          </div>

          {communityQuery.isLoading ? (
            <LoadingBlock label="Loading community stories" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(communityQuery.data ?? []).slice(0, 9).map((story) => (
                <a
                  key={story.objectID}
                  href={story.url || `https://news.ycombinator.com/item?id=${story.objectID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-400/30 hover:bg-white/10"
                >
                  <div className="space-y-2">
                    <p className="line-clamp-3 text-sm font-medium text-slate-100">{story.title}</p>
                    <p className="text-xs text-slate-400">
                      {story.points ?? 0} points · {story.num_comments ?? 0} comments · {story.author || "unknown"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

const StatTile = ({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel: string;
}) => (
  <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
        <p className="mt-1 text-sm text-slate-400">{sublabel}</p>
      </div>
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </GlassCard>
);

const LoadingBlock = ({ label }: { label: string }) => (
  <div className="flex min-h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
    {label}...
  </div>
);

export default Pulse;
