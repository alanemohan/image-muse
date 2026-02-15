import { useQuery } from "@tanstack/react-query";
import { fetchGeoInfo, fetchWeather, fetchSpaceNews } from "@/services/pulseService";
import { CloudSun, Loader2, MapPin, Newspaper, RefreshCw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

const Pulse = () => {
  const geoQuery = useQuery({
    queryKey: ["pulse", "geo"],
    queryFn: fetchGeoInfo,
    staleTime: 1000 * 60 * 30,
    refetchInterval: 1000 * 60 * 15,
    refetchOnWindowFocus: true,
  });

  const weatherQuery = useQuery({
    queryKey: ["pulse", "weather", geoQuery.data?.latitude, geoQuery.data?.longitude],
    queryFn: () => fetchWeather(geoQuery.data!.latitude, geoQuery.data!.longitude),
    enabled: Boolean(geoQuery.data?.latitude && geoQuery.data?.longitude),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  const newsQuery = useQuery({
    queryKey: ["pulse", "news"],
    queryFn: () => fetchSpaceNews(6),
    staleTime: 1000 * 45,
    refetchInterval: 1000 * 120,
    refetchOnWindowFocus: true,
  });

  const lastUpdate = Math.max(
    geoQuery.dataUpdatedAt || 0,
    weatherQuery.dataUpdatedAt || 0,
    newsQuery.dataUpdatedAt || 0
  );

  return (
    <div className="min-h-screen pt-24 pb-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
              Pulse
            </h1>
            <p className="text-slate-400 mt-2">
              Live weather and space news powered by free public APIs.
            </p>
            {lastUpdate > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Updated: {new Date(lastUpdate).toLocaleTimeString()}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
            onClick={() => {
              void geoQuery.refetch();
              void weatherQuery.refetch();
              void newsQuery.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Pulse
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-emerald-300">
              <CloudSun className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Local Weather</h2>
            </div>

            {(geoQuery.isLoading || weatherQuery.isLoading) && (
              <div className="text-slate-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading weather...
              </div>
            )}

            {(geoQuery.isError || weatherQuery.isError) && (
              <div className="text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                Could not load weather right now.
              </div>
            )}

            {geoQuery.data && weatherQuery.data && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-4 w-4 text-cyan-300" />
                  {geoQuery.data.city}, {geoQuery.data.region}, {geoQuery.data.country_name}
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-slate-400 uppercase">Temperature</p>
                    <p className="text-2xl font-semibold text-slate-100">
                      {Math.round(weatherQuery.data.current.temperature_2m)} deg C
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-slate-400 uppercase">Humidity</p>
                    <p className="text-2xl font-semibold text-slate-100">
                      {Math.round(weatherQuery.data.current.relative_humidity_2m)}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-slate-400 uppercase flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      Wind
                    </p>
                    <p className="text-2xl font-semibold text-slate-100">
                      {Math.round(weatherQuery.data.current.wind_speed_10m)} km/h
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {weatherQuery.data.daily.time.slice(0, 3).map((day, idx) => (
                    <div
                      key={day}
                      className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3"
                    >
                      <p className="text-xs text-cyan-200">{day}</p>
                      <p className="text-sm text-slate-100">
                        {Math.round(weatherQuery.data.daily.temperature_2m_min[idx])} deg C -{" "}
                        {Math.round(weatherQuery.data.daily.temperature_2m_max[idx])} deg C
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-sky-500/20 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-4 text-sky-300">
              <Newspaper className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Space Headlines</h2>
            </div>

            {newsQuery.isLoading && (
              <div className="text-slate-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading news...
              </div>
            )}

            {newsQuery.isError && (
              <div className="text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                Could not load news.
              </div>
            )}

            {!newsQuery.isLoading && !newsQuery.isError && (
              <div className="space-y-3">
                {newsQuery.data?.slice(0, 4).map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border border-white/10 bg-white/5 p-3 hover:border-sky-400/40 transition-colors"
                  >
                    <p className="text-xs text-slate-400">{article.news_site}</p>
                    <p className="text-sm text-slate-100 line-clamp-2">{article.title}</p>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Pulse;
