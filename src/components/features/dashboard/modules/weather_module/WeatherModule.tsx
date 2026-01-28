import { useState, useEffect } from "react";
import {
  useAppStore,
  WeatherLocation,
} from "../../../../../stores/useAppStore";
import {
  Cloud,
  Search,
  MapPin,
  Wind,
  Droplets,
  Loader2,
  Star,
} from "lucide-react";
import { getWeatherIcon } from "./helper/weather_helper";
import { WaitingView } from "./components/WaitingView";

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
      intervalId = setInterval(
        () => {
          console.log("Auto-refreshing weather...");
          fetchWeather(weatherLocation.lat, weatherLocation.lon);
        },
        15 * 60 * 1000,
      );
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
      );
      const data = await res.json();
      setCurrentWeather(data.current);
      setForecast(
        data.daily.time.slice(1, 4).map((t: string, i: number) => ({
          date: t,
          code: data.daily.weather_code[i + 1],
          max: data.daily.temperature_2m_max[i + 1],
          min: data.daily.temperature_2m_min[i + 1],
        })),
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
        `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=en&format=json`,
      );
      const data = await res.json();
      if (data.results) {
        setSearchResults(
          data.results.map((item: any) => ({
            name: item.name,
            country: item.country,
            lat: item.latitude,
            lon: item.longitude,
          })),
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
      (l) => l.lat === weatherLocation.lat && l.lon === weatherLocation.lon,
    );

  // UI KHI CHƯA CÓ ĐỊA ĐIỂM HOẶC ĐANG TÌM KIẾM
  if (isSearching) {
    return (
      <WaitingView
        weatherLocation={weatherLocation}
        setIsSearching={setIsSearching}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        loading={loading}
        searchResults={searchResults}
        setWeatherLocation={setWeatherLocation}
        setSearchResults={setSearchResults}
        savedWeatherLocations={savedWeatherLocations}
        toggleSavedWeatherLocation={toggleSavedWeatherLocation}
      />
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
