import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, RefreshCw } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

/* ----------------------------- */
/* Safe storage helpers          */
/* ----------------------------- */

const safeLocalStorage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Failed to read localStorage key:", key, error);
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Failed to set localStorage key:", key, error);
    }
  },
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },
};

const safeSessionStorage = {
  remove(key: string) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove sessionStorage key:", key, error);
    }
  },
  clear() {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error("Failed to clear sessionStorage:", error);
    }
  },
};

const OPENROUTER_KEY_STORAGE = "app:openrouter_api_key";
const HUGGINGFACE_KEY_STORAGE = "app:huggingface_api_key";

const Settings = () => {
  const { settings, updateSettings, loading } = useSettings();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.is_admin);

  const clearStorage = useCallback(() => {
    safeLocalStorage.clear();
    safeSessionStorage.clear();
    window.location.href = "/";
  }, []);

  const handleAdminLogout = useCallback(async () => {
    await signOut();
    navigate("/signin", { replace: true });
  }, [navigate, signOut]);

  const resetBackground = useCallback(() => {
    safeSessionStorage.remove("cachedBackground");
    document.documentElement.style.removeProperty("--background-image");
  }, []);

  const exportData = useCallback(() => {
    const raw = safeLocalStorage.get("galleryImages");
    if (!raw) {
      alert("No data to export");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      alert("Stored data is corrupted");
      return;
    }

    const blob = new Blob([JSON.stringify(parsed, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `image-muse-backup-${new Date()
      .toISOString()
      .split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleApiKeyChange = useCallback((storageKey: string, value: string) => {
    safeLocalStorage.set(storageKey, value);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-slate-400">
            Manage your application preferences and data
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Preferences */}
          <Card className="bg-slate-900/50 border-cyan-700/50">
            <CardHeader>
              <CardTitle className="text-xl">Account Preferences</CardTitle>
              <CardDescription>
                Synced with backend while signed in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" aria-busy={loading}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">Auto Analyze</h3>
                  <p className="text-xs text-slate-500">Analyze images automatically after upload</p>
                </div>
                <input
                  type="checkbox"
                  title="Auto analyze"
                  aria-label="Auto analyze"
                  checked={settings.autoAnalyze}
                  onChange={(e) => void updateSettings({ autoAnalyze: e.target.checked })}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300">Default Sort</h3>
                <select
                  title="Default sort"
                  aria-label="Default sort"
                  className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  value={settings.defaultSort}
                  onChange={(e) =>
                    void updateSettings({
                      defaultSort: e.target.value as
                        | "newest"
                        | "oldest"
                        | "title"
                        | "size",
                    })
                  }
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title</option>
                  <option value="size">Size</option>
                </select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-300">Watermark Text</h3>
                <input
                  type="text"
                  title="Watermark text"
                  aria-label="Watermark text"
                  value={settings.watermarkText}
                  onChange={(e) => void updateSettings({ watermarkText: e.target.value })}
                  className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                  placeholder="Your watermark"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trash2 size={20} className="text-cyan-400" />
                Data Management
              </CardTitle>
              <CardDescription>
                Manage your stored data and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Export Backup
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  Download all your images as a backup file
                </p>
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400"
                >
                  Export Images
                </Button>
              </div>

              <div className="h-px bg-slate-700/50" />

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Clear All Data
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  Delete all stored images and preferences. This action cannot be
                  undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 size={16} className="mr-2" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-400">
                        Clear All Data?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all stored data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearStorage}>
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <RefreshCw size={20} className="text-purple-400" />
                Display Settings
              </CardTitle>
              <CardDescription>Customize the appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={resetBackground} variant="outline">
                <RefreshCw size={16} className="mr-2" />
                Refresh Background
              </Button>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card className="bg-slate-900/50 border-cyan-700/50">
            <CardHeader>
              <CardTitle className="text-xl">AI Configuration</CardTitle>
              <CardDescription>
                Provider chain: OpenRouter {"->"} HuggingFace {"->"} backend/local fallback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-400">OpenRouter API Key</p>
                <input
                  type="password"
                  placeholder="Enter OpenRouter API Key"
                  defaultValue={safeLocalStorage.get(OPENROUTER_KEY_STORAGE) ?? ""}
                  onChange={(e) =>
                    handleApiKeyChange(OPENROUTER_KEY_STORAGE, e.target.value)
                  }
                  className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400">HuggingFace API Key</p>
                <input
                  type="password"
                  placeholder="Enter HuggingFace API Key"
                  defaultValue={safeLocalStorage.get(HUGGINGFACE_KEY_STORAGE) ?? ""}
                  onChange={(e) =>
                    handleApiKeyChange(HUGGINGFACE_KEY_STORAGE, e.target.value)
                  }
                  className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <p className="text-xs text-yellow-400">
                API keys are stored in localStorage for development only.
              </p>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="bg-slate-900/50 border-red-700/50">
              <CardHeader>
                <CardTitle className="text-xl">Admin Session</CardTitle>
                <CardDescription>
                  Use this to securely end your admin session.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => {
                    void handleAdminLogout();
                  }}
                >
                  Logout (Admin)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;


