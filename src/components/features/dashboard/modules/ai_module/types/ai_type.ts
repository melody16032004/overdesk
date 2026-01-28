export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  image?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export type Provider = "gemini" | "openai" | "offline";

export interface ProviderConfig {
  name: string;
  icon: any;
  color: string;
  getKeyUrl: string;
  models: { id: string; name: string }[];
}
