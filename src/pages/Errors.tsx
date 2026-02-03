import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listAiLogs, AiLog } from "@/services/logsService";
import { Button } from "@/components/ui/button";

const Errors = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await listAiLogs(100);
      setLogs(data);
    } catch (error) {
      console.error("Failed to load logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="text-slate-400">Sign in to view your AI error logs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <Terminal className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">AI Error Logs</h1>
            <p className="text-slate-400 text-sm">
              Review Gemini failures and diagnose integration issues.
            </p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
              onClick={loadLogs}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            {loading ? "Loading logs..." : "No Gemini errors recorded yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-cyan-400">
                    {log.type}
                  </span>
                  {log.status_code && (
                    <span className="text-xs text-slate-400">
                      Status {log.status_code}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">
                  {log.message || "Unknown error"}
                </p>
                {log.raw && (
                  <pre className="mt-2 text-xs text-slate-500 whitespace-pre-wrap">
                    {log.raw}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Errors;
