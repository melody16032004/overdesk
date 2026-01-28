import { Sparkles, Bot, WifiOff } from "lucide-react";
import { Provider, ProviderConfig } from "../types/ai_type";

export const AI_PROVIDERS: Record<Provider, ProviderConfig> = {
  gemini: {
    name: "Google Gemini",
    icon: Sparkles,
    color: "text-blue-400",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Thay thế)" },
    ],
  },
  openai: {
    name: "OpenAI",
    icon: Bot,
    color: "text-emerald-400",
    getKeyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-5.2", name: "GPT-5.2 (Thông minh nhất)" },
      { id: "gpt-5.2-mini", name: "GPT-5.2 Mini (Nhanh)" },
      { id: "gpt-5-nano", name: "GPT-5 Nano (Preview)" },
    ],
  },
  offline: {
    name: "Offline Mode",
    icon: WifiOff,
    color: "text-slate-400",
    getKeyUrl: "",
    models: [{ id: "mock-v2", name: "Smart Responder" }],
  },
};

export const MOCK_DATA = {
  jokes: [
    "Tại sao lập trình viên không thích thiên nhiên? Vì nó có quá nhiều bugs.",
    "Vợ tôi bảo tôi phải chọn giữa lập trình và cô ấy... Tôi sẽ nhớ cô ấy lắm.",
  ],
  quotes: [
    "Hành trình vạn dặm bắt đầu từ một bước chân.",
    "Code là thơ, nhưng bug là đời.",
  ],
};
