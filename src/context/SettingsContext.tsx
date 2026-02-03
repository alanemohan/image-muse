import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSettings as getRemoteSettings, updateSettings as updateRemoteSettings, UserSettings } from "@/services/settingsService";

type SettingsContextType = {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
};

const DEFAULT_SETTINGS: UserSettings = {
  autoAnalyze: true,
  defaultSort: "newest",
  watermarkText: "",
  showMetadata: true,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  updateSettings: async () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const isServerMode = Boolean(user);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      if (isServerMode) {
        try {
          const remote = await getRemoteSettings();
          if (active) setSettings(remote);
        } catch (error) {
          console.error("Failed to load settings:", error);
          if (active) setSettings(DEFAULT_SETTINGS);
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      const stored = localStorage.getItem("user_settings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (active) setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        } catch (error) {
          console.error("Failed to parse settings:", error);
          if (active) setSettings(DEFAULT_SETTINGS);
        }
      } else if (active) {
        setSettings(DEFAULT_SETTINGS);
      }
      if (active) setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [isServerMode]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const merged = { ...settings, ...updates };
    setSettings(merged);

    if (isServerMode) {
      try {
        const remote = await updateRemoteSettings(updates);
        setSettings(remote);
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    } else {
      localStorage.setItem("user_settings", JSON.stringify(merged));
    }
  };

  const value = useMemo(
    () => ({ settings, loading, updateSettings }),
    [settings, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
