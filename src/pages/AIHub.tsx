import { useQuery } from "@tanstack/react-query";
import { getAiProviders } from "@/services/aiBackend";
import {
  BadgeCheck,
  CircleAlert,
  CircleOff,
  Loader2,
  RefreshCw,
  Server,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AIHub = () => {
  const providersQuery = useQuery({
    queryKey: ["ai", "providers"],
    queryFn: getAiProviders,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const providers = providersQuery.data ?? [];
  const queryErrorMessage =
    providersQuery.error instanceof Error
      ? providersQuery.error.message
      : "Could not fetch provider status from backend.";

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              AI Hub
            </h1>
            <p className="text-slate-400 mt-2">
              Real-time provider health from backend checks.
            </p>
          </div>

          <Button
            variant="outline"
            className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
            onClick={() => void providersQuery.refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <div className="flex items-start gap-3 text-sm text-slate-300">
            <Server className="h-5 w-5 mt-0.5 text-cyan-300" />
            <div>
              Provider status is live-tested every 30 seconds using each provider API.
              Inference order remains Gemini {"->"} OpenRouter {"->"} HuggingFace {"->"} Local Fallback.
            </div>
          </div>
        </div>

        {providersQuery.isLoading && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-300">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Loading provider status...
          </div>
        )}

        {providersQuery.isError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200 flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{queryErrorMessage}</span>
          </div>
        )}

        {!providersQuery.isLoading && !providersQuery.isError && (
          <div className="grid md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold capitalize text-slate-100">
                    {provider.id.replace("-", " ")}
                  </h2>

                  {!provider.enabled ? (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-sm">
                      <CircleOff className="h-4 w-4" />
                      Disabled
                    </span>
                  ) : provider.reachable ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300 text-sm">
                      <BadgeCheck className="h-4 w-4" />
                      Healthy
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-300 text-sm">
                      <CircleAlert className="h-4 w-4" />
                      Unreachable
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Status: {provider.status}</p>
                  <p>HTTP: {provider.statusCode ?? "n/a"}</p>
                  <p>Latency: {provider.latencyMs ?? "n/a"} ms</p>
                  <p>Checked: {new Date(provider.checkedAt).toLocaleTimeString()}</p>
                  {provider.detail && <p>Detail: {provider.detail}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {provider.models.map((model) => (
                    <span
                      key={model}
                      className="px-2 py-1 rounded-md text-xs border border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHub;
