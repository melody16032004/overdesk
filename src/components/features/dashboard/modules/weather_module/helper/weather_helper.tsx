import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

export const getWeatherIcon = (code: number) => {
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
