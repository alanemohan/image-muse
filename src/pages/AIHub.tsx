import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, RefreshCw, Sparkles, Upload, Wand2 } from "lucide-react";
import { getAiProviders } from "@/services/aiBackend";
import { apiFetch } from "@/services/apiClient";
import { fileToBase64 } from "@/services/imageAnalysis";
import { toast } from "sonner";

const TASKS = [
  {
    id: "analysis",
    label: "Image Analysis",
    description: "Detailed scene, lighting, composition, tags, and accessibility notes.",
    requiresImage: true,
    promptPlaceholder: "Add a focus area, such as portraits, products, or travel scenes.",
  },
  {
    id: "caption",
    label: "Caption Generator",
    description: "Concise or social-ready captions with creative alternatives.",
    requiresImage: true,
    promptPlaceholder: "Describe the tone: editorial, playful, minimal, cinematic.",
  },
  {
    id: "alt_text",
    label: "Alt Text",
    description: "Accessibility-friendly text for screen readers and CMS fields.",
    requiresImage: true,
    promptPlaceholder: "Mention any accessibility constraints or audience context.",
  },
  {
    id: "tags",
    label: "Image Tags",
    description: "Search-friendly keywords for organizing and finding images.",
    requiresImage: true,
    promptPlaceholder: "Include metadata hints such as brand, event, or style.",
  },
  {
    id: "ocr",
    label: "OCR Extraction",
    description: "Extract on-image text with notes about legibility and confidence.",
    requiresImage: true,
    promptPlaceholder: "Tell the model what text regions matter most.",
  },
  {
    id: "palette",
    label: "Color Palette",
    description: "Dominant colors and how they function in the image.",
    requiresImage: true,
    promptPlaceholder: "Ask for brand-safe or design-oriented color usage.",
  },
  {
    id: "quality",
    label: "Quality Review",
    description: "Technical assessment with actionable improvement suggestions.",
    requiresImage: true,
    promptPlaceholder: "Focus on sharpness, exposure, noise, and framing.",
  },
  {
    id: "scene",
    label: "Scene Summary",
    description: "What is happening, the mood, and the compositional structure.",
    requiresImage: true,
    promptPlaceholder: "Highlight narrative or editorial context.",
  },
  {
    id: "style",
    label: "Style Detection",
    description: "Visual style classification with comparable style directions.",
    requiresImage: true,
    promptPlaceholder: "Include style families, eras, or reference genres.",
  },
  {
    id: "prompt",
    label: "Prompt Generator",
    description: "Generate a production-ready creative prompt from scratch.",
    requiresImage: false,
    promptPlaceholder: "Describe the goal, subject, format, and output style.",
  },
  {
    id: "enhance_prompt",
    label: "Prompt Enhancer",
    description: "Improve an existing prompt without changing its intent.",
    requiresImage: false,
    promptPlaceholder: "Paste the prompt you want to improve.",
  },
] as const;

type WorkspaceTask = (typeof TASKS)[number]["id"];

type WorkspaceResult = Record<string, unknown> & {
  title?: string;
  description?: string;
  caption?: string;
  tags?: string[];
  altText?: string;
  text?: string;
  scene?: string;
  mood?: string;
  composition?: string;
  style?: string;
  why?: string;
  prompt?: string;
  negativePrompt?: string;
  score?: number;
  assessment?: string;
  improvements?: string[];
  recommendations?: string[];
  confidence?: number;
  palette?: Array<{ name?: string; hex?: string; usage?: string }>;
  variations?: string[];
  similarStyles?: string[];
  analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

const taskLookup = new Map(TASKS.map((task) => [task.id, task]));

const formatPercent = (value?: number) =>
  typeof value === "number" ? `${Math.round(value * 100)}%` : "n/a";

const AIHub = () => {
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask>("analysis");
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<WorkspaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const providersQuery = useQuery({
    queryKey: ["ai", "providers"],
    queryFn: getAiProviders,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const selectedConfig = taskLookup.get(selectedTask) ?? TASKS[0];
  const requiresImage = selectedConfig.requiresImage;
  const canRun = !loading && (!requiresImage || Boolean(imageBase64));

  useEffect(() => {
    setError(null);
    setResult(null);
  }, [selectedTask]);

  const providerSummary = useMemo(() => {
    const providers = providersQuery.data ?? [];
    const healthy = providers.filter((provider) => provider.reachable).length;
    const total = providers.length;
    return { healthy, total };
  }, [providersQuery.data]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
      setImagePreview(base64);
      setError(null);
      toast.success("Image loaded for analysis");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Failed to load image");
    } finally {
      event.target.value = "";
    }
  };

  const handleRun = async () => {
    if (!canRun) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        task: selectedTask,
        imageBase64: requiresImage ? imageBase64 ?? undefined : undefined,
        prompt: prompt.trim() || undefined,
      };

      const data = await apiFetch<WorkspaceResult>("/ai/workspace", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "AI request failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) {
      return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-slate-400">
          Run a task to see structured AI output here.
        </div>
      );
    }

    switch (selectedTask) {
      case "analysis":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <StatCard label="Title" value={String(result.title ?? "Image")} />
              <StatCard label="Confidence" value={formatPercent(result.confidence)} />
            </div>
            <StatCard label="Description" value={String(result.description ?? "")} />
            <StatCard label="Caption" value={String(result.caption ?? "")} />
            {Array.isArray(result.tags) && result.tags.length > 0 && (
              <ResultTags items={result.tags} />
            )}
            {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
              <BulletList title="Recommendations" items={result.recommendations} />
            )}
            {result.metadata && Object.keys(result.metadata).length > 0 && (
              <KeyValueList title="Metadata" data={result.metadata} />
            )}
            {result.analysis && Object.keys(result.analysis).length > 0 && (
              <KeyValueList title="Analysis" data={result.analysis} />
            )}
          </div>
        );
      case "caption":
        return (
          <div className="space-y-4">
            <StatCard label="Caption" value={String(result.caption ?? result.prompt ?? "")} />
            {Array.isArray(result.variations) && result.variations.length > 0 && (
              <BulletList title="Alternatives" items={result.variations} />
            )}
          </div>
        );
      case "alt_text":
        return (
          <div className="space-y-4">
            <StatCard label="Alt Text" value={String(result.altText ?? result.text ?? "")} />
            <StatCard label="Confidence" value={formatPercent(result.confidence)} />
          </div>
        );
      case "tags":
        return <ResultTags items={result.tags ?? []} />;
      case "ocr":
        return (
          <div className="space-y-4">
            <StatCard label="Detected Text" value={String(result.text ?? "")} />
            {result.notes ? <StatCard label="Notes" value={String(result.notes)} /> : null}
          </div>
        );
      case "palette":
        return <PalettePreview palette={result.palette ?? []} />;
      case "quality":
        return (
          <div className="space-y-4">
            <StatCard label="Score" value={typeof result.score === "number" ? `${Math.round(result.score * 100)}/100` : "n/a"} />
            <StatCard label="Assessment" value={String(result.assessment ?? "")} />
            {Array.isArray(result.improvements) && result.improvements.length > 0 && (
              <BulletList title="Improvements" items={result.improvements} />
            )}
          </div>
        );
      case "scene":
        return (
          <div className="space-y-4">
            <StatCard label="Scene" value={String(result.scene ?? "")} />
            <StatCard label="Mood" value={String(result.mood ?? "")} />
            <StatCard label="Composition" value={String(result.composition ?? "")} />
          </div>
        );
      case "style":
        return (
          <div className="space-y-4">
            <StatCard label="Style" value={String(result.style ?? "")} />
            {Array.isArray(result.similarStyles) && result.similarStyles.length > 0 && (
              <ResultTags items={result.similarStyles} />
            )}
            {result.why ? <StatCard label="Why" value={String(result.why)} /> : null}
          </div>
        );
      case "prompt":
      case "enhance_prompt":
        return (
          <div className="space-y-4">
            <StatCard label="Prompt" value={String(result.prompt ?? "")} />
            {result.negativePrompt ? <StatCard label="Negative Prompt" value={String(result.negativePrompt)} /> : null}
            {Array.isArray(result.variations) && result.variations.length > 0 && (
              <BulletList title="Variations" items={result.variations} />
            )}
            {Array.isArray(result.improvements) && result.improvements.length > 0 && (
              <BulletList title="Improvements" items={result.improvements} />
            )}
          </div>
        );
      default:
        return <pre className="overflow-auto rounded-xl bg-slate-950/80 p-4 text-xs text-slate-300">{JSON.stringify(result, null, 2)}</pre>;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI Workspace
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Practical image AI tools
              </h1>
              <p className="mt-2 max-w-3xl text-slate-400">
                Generate real AI results for analysis, captions, alt text, OCR, palettes, quality feedback, prompt generation, and more.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
              onClick={() => void providersQuery.refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Providers
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-100">Choose a task</h2>
              <Badge variant="outline" className="border-cyan-500/20 text-cyan-200">
                {providerSummary.healthy}/{providerSummary.total || 0} providers healthy
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {TASKS.map((task) => {
                const active = selectedTask === task.id;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTask(task.id)}
                    className={`rounded-2xl border p-4 text-left transition ${active
                      ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                      : "border-white/10 bg-white/5 hover:border-cyan-500/30 hover:bg-white/10"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-100">{task.label}</h3>
                      {task.requiresImage ? (
                        <Badge variant="outline" className="border-white/10 text-slate-300">
                          Image
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-200">
                          Text
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{task.description}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-100">Inputs</h2>
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                  <Upload className="h-4 w-4 text-cyan-300" />
                  <span>{imageBase64 ? "Replace uploaded image" : "Upload an image"}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-4 max-h-64 w-full rounded-xl object-contain"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Prompt / Instructions</label>
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={selectedConfig.promptPlaceholder}
                  className="min-h-32 border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Button
                onClick={() => void handleRun()}
                disabled={!canRun}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running task...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Run task
                  </>
                )}
              </Button>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">Provider health</h2>
            {providersQuery.isLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking provider status...
              </div>
            ) : providersQuery.isError ? (
              <div className="text-sm text-red-200">Could not fetch provider status.</div>
            ) : (
              <div className="space-y-3">
                {(providersQuery.data ?? []).map((provider) => (
                  <div key={provider.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-100 capitalize">{provider.id}</p>
                      <Badge variant="outline" className={provider.reachable ? "border-emerald-500/20 text-emerald-200" : "border-amber-500/20 text-amber-200"}>
                        {provider.reachable ? "Healthy" : provider.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Latency: {provider.latencyMs ?? "n/a"} ms. Checked: {new Date(provider.checkedAt).toLocaleTimeString()}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="border border-white/10 bg-slate-950/70 p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">Result</h2>
            {loading ? (
              <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating output...
              </div>
            ) : (
              renderResult()
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-100">{value || "n/a"}</p>
  </div>
);

const ResultTags = ({ items }: { items: string[] }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Tags</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} className="border-cyan-500/20 bg-cyan-500/10 text-cyan-100">
          {item}
        </Badge>
      ))}
    </div>
  </div>
);

const BulletList = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{title}</p>
    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="rounded-lg bg-slate-950/70 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const KeyValueList = ({ title, data }: { title: string; data: Record<string, unknown> }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{title}</p>
    <div className="mt-3 space-y-2 text-sm">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-3 rounded-lg bg-slate-950/70 px-3 py-2">
          <span className="text-slate-400">{key}</span>
          <span className="max-w-[70%] whitespace-pre-wrap text-right text-slate-100">
            {Array.isArray(value) ? value.join(", ") : typeof value === "object" && value ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const PalettePreview = ({ palette }: { palette: Array<{ name?: string; hex?: string; usage?: string }> }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Palette</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {palette.map((color, index) => (
        <div key={`${color.hex || color.name || index}`} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div
            className="h-20 rounded-lg border border-white/10"
            style={{ background: color.hex || "linear-gradient(135deg, #0f172a, #1e293b)" }}
          />
          <div className="mt-3 space-y-1 text-sm text-slate-200">
            <p className="font-medium">{color.name || "Color"}</p>
            <p className="text-slate-400">{color.hex || "n/a"}</p>
            <p className="text-slate-400">{color.usage || ""}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AIHub;
