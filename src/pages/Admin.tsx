import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Users, Image as ImageIcon, Heart, Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getAdminStats, listAdminLogs, listAdminUsers, AdminStats, AdminUser } from "@/services/adminService";
import { AiLog } from "@/services/logsService";
import { Button } from "@/components/ui/button";

const Admin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const [statsData, usersData, logsData] = await Promise.all([
        getAdminStats(),
        listAdminUsers(50),
        listAdminLogs(50),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setLogs(logsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="text-slate-400">Sign in to access admin analytics.</p>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <p className="text-slate-400">You do not have admin access.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">System analytics and AI monitoring.</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
              onClick={loadAll}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Users"
            value={stats?.users ?? 0}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Images"
            value={stats?.images ?? 0}
            icon={<ImageIcon className="w-5 h-5" />}
          />
          <StatCard
            title="Favorites"
            value={stats?.favorites ?? 0}
            icon={<Heart className="w-5 h-5" />}
          />
          <StatCard
            title="AI Logs"
            value={stats?.ai_logs ?? 0}
            icon={<Terminal className="w-5 h-5" />}
          />
        </div>

        {/* Users */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {users.map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="text-slate-200 text-sm">{entry.email}</p>
                  <p className="text-xs text-slate-500">{entry.full_name || "No display name"}</p>
                </div>
                <div className="text-xs text-slate-500">
                  Joined {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "—"}
                </div>
                <div className="text-xs text-slate-500">
                  {entry.is_admin ? "Admin" : "User"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent AI Errors</h2>
          {logs.length === 0 ? (
            <p className="text-slate-400 text-sm">No AI errors logged.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="text-cyan-400 uppercase">{log.type}</span>
                    {log.status_code && <span>Status {log.status_code}</span>}
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{log.message || "Unknown error"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-white/5 text-cyan-400">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  );
};

export default Admin;
