import { useState, useEffect } from "react";
import { useAppStore, WeatherLocation } from "../../../../stores/useAppStore";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Search,
  MapPin,
  Wind,
  Droplets,
  ArrowLeft,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";

// Hàm map mã thời tiết (WMO code) sang Icon và Màu
const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1)
    return {
      icon: Sun,
      color: "text-yellow-500",
      bg: "from-blue-400 to-blue-300",
    };
  if (code === 2 || code === 3)
    return {
      icon: Cloud,
      color: "text-gray-200",
      bg: "from-gray-400 to-gray-300",
    };
  if (code >= 51 && code <= 67)
    return {
      icon: CloudRain,
      color: "text-blue-200",
      bg: "from-slate-600 to-slate-500",
    }; // Mưa
  if (code >= 71 && code <= 77)
    return {
      icon: CloudSnow,
      color: "text-white",
      bg: "from-indigo-300 to-white",
    }; // Tuyết
  if (code >= 95)
    return {
      icon: CloudLightning,
      color: "text-yellow-300",
      bg: "from-indigo-800 to-purple-800",
    }; // Bão
  return { icon: Cloud, color: "text-white", bg: "from-blue-500 to-cyan-400" }; // Mặc định
};

export const WeatherModule = () => {
  const {
    weatherLocation,
    setWeatherLocation,
    savedWeatherLocations,
    toggleSavedWeatherLocation,
  } = useAppStore();

  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State cho tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [isSearching, setIsSearching] = useState(!weatherLocation);

  // 1. Gọi API lấy thời tiết khi có địa điểm
  useEffect(() => {
    let intervalId: any;

    if (weatherLocation) {
      // Lần đầu gọi ngay lập tức
      fetchWeather(weatherLocation.lat, weatherLocation.lon);
      setIsSearching(false);

      // Cài đặt timer để gọi lại sau mỗi 15 phút (15 * 60 * 1000 ms)
      // Open-Meteo update dữ liệu khoảng 1h/lần nên refresh 15-30p là hợp lý
      intervalId = setInterval(() => {
        console.log("Auto-refreshing weather...");
        fetchWeather(weatherLocation.lat, weatherLocation.lon);
      }, 15 * 60 * 1000);
    } else {
      setIsSearching(true);
    }

    // Quan trọng: Dọn dẹp timer khi tắt component hoặc đổi địa điểm
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [weatherLocation]);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      // API Open-Meteo (Miễn phí, không cần key)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      const data = await res.json();
      setCurrentWeather(data.current);
      setForecast(
        data.daily.time.slice(1, 4).map((t: string, i: number) => ({
          date: t,
          code: data.daily.weather_code[i + 1],
          max: data.daily.temperature_2m_max[i + 1],
          min: data.daily.temperature_2m_min[i + 1],
        }))
      );
    } catch (error) {
      console.error("Weather error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Tìm kiếm địa điểm (Geocoding API)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=en&format=json`
      );
      const data = await res.json();
      if (data.results) {
        setSearchResults(
          data.results.map((item: any) => ({
            name: item.name,
            country: item.country,
            lat: item.latitude,
            lon: item.longitude,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isSaved =
    weatherLocation &&
    savedWeatherLocations.some(
      (l) => l.lat === weatherLocation.lat && l.lon === weatherLocation.lon
    );

  // UI KHI CHƯA CÓ ĐỊA ĐIỂM HOẶC ĐANG TÌM KIẾM
  if (isSearching) {
    return (
      <div className="h-full flex flex-col p-4 bg-white dark:bg-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          {weatherLocation && (
            <button
              onClick={() => setIsSearching(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h3 className="font-bold text-lg text-slate-700 dark:text-white">
            Locations
          </h3>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search city..."
            className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 outline-none focus:ring-2 ring-indigo-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-indigo-500 text-white rounded-xl"
          >
            <Search size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          )}

          {/* LOGIC HIỂN THỊ LIST */}
          {/* Nếu ĐANG tìm kiếm -> Hiện kết quả tìm kiếm */}
          {searchResults.length > 0 ? (
            searchResults.map((city, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setWeatherLocation(city);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-indigo-500/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <MapPin
                    size={18}
                    className="text-slate-400 group-hover:text-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-slate-700 dark:text-white">
                      {city.name}
                    </div>
                    <div className="text-xs text-slate-400">{city.country}</div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            /* Nếu KHÔNG tìm kiếm -> Hiện danh sách ĐÃ LƯU */
            <>
              {savedWeatherLocations.length > 0 && searchQuery === "" && (
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">
                  Saved Locations
                </div>
              )}
              {savedWeatherLocations.map((city, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <button
                    onClick={() => {
                      setWeatherLocation(city);
                      setIsSearching(false);
                    }}
                    className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all text-left"
                  >
                    <Star size={16} className="text-amber-400 fill-amber-400" />
                    <div>
                      <div className="font-bold text-slate-700 dark:text-white text-sm">
                        {city.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {city.country}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleSavedWeatherLocation(city)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {savedWeatherLocations.length === 0 && searchQuery === "" && (
                <div className="text-center text-slate-400 text-xs mt-10">
                  No saved locations yet.
                  <br />
                  Search and star your favorite cities!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // UI HIỂN THỊ THỜI TIẾT
  const weatherStyle = currentWeather
    ? getWeatherIcon(currentWeather.weather_code)
    : { bg: "bg-slate-500", color: "", icon: Cloud };
  const MainIcon = weatherStyle.icon;

  return (
    <div
      className={`h-full flex flex-col relative overflow-hidden bg-gradient-to-br ${weatherStyle.bg} text-white transition-all duration-500`}
    >
      {/* Header Location */}
      <div className="flex items-center justify-between p-4 z-10">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="opacity-80" />
          <span className="font-bold tracking-wide">
            {weatherLocation?.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Nút Save/Unsave */}
          <button
            onClick={() =>
              weatherLocation && toggleSavedWeatherLocation(weatherLocation)
            }
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title={isSaved ? "Unsave location" : "Save location"}
          >
            <Star
              size={18}
              className={
                isSaved ? "fill-white text-white" : "text-white opacity-70"
              }
            />
          </button>

          {/* Nút Tìm kiếm */}
          <button
            onClick={() => setIsSearching(true)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-6 z-10">
        {loading ? (
          <Loader2 className="animate-spin w-10 h-10 opacity-50" />
        ) : (
          currentWeather && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <MainIcon
                size={100}
                className={`mb-2 drop-shadow-lg ${weatherStyle.color}`}
                strokeWidth={1.5}
              />
              <div className="text-6xl font-bold tracking-tighter drop-shadow-sm">
                {Math.round(currentWeather.temperature_2m)}°
              </div>
              <div className="text-lg font-medium opacity-90 mt-1 capitalize">
                Current Weather
              </div>

              <div className="flex gap-6 mt-6 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10">
                <div className="flex flex-col items-center gap-1">
                  <Wind size={16} className="opacity-70" />
                  <span className="text-sm font-bold">
                    {currentWeather.wind_speed_10m}{" "}
                    <span className="text-[10px] font-normal">km/h</span>
                  </span>
                </div>
                <div className="w-[1px] bg-white/20 h-8"></div>
                <div className="flex flex-col items-center gap-1">
                  <Droplets size={16} className="opacity-70" />
                  <span className="text-sm font-bold">
                    {currentWeather.relative_humidity_2m}%
                  </span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Forecast Mini */}
      <div className="p-4 bg-black/10 backdrop-blur-sm z-10">
        <div className="flex justify-between items-center text-center">
          {forecast.map((day: any, i) => {
            const DIcon = getWeatherIcon(day.code).icon;
            const d = new Date(day.date);
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            return (
              <div key={i} className="flex flex-col items-center gap-1 w-1/3">
                <span className="text-[10px] opacity-70 uppercase">
                  {dayName}
                </span>
                <DIcon size={20} className="my-1" />
                <div className="text-xs font-bold">
                  {Math.round(day.max)}°{" "}
                  <span className="opacity-50 text-[10px]">
                    {Math.round(day.min)}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
