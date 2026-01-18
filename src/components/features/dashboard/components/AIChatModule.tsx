import { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Trash2,
  Settings,
  Copy,
  Key,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  Image as ImageIcon,
  Mic,
  X,
  RotateCcw,
  Sparkles,
  WifiOff,
  Plus,
  Edit3,
  PanelLeft,
} from "lucide-react";

// --- TYPES ---
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  image?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

type Provider = "gemini" | "openai" | "offline";

interface ProviderConfig {
  name: string;
  icon: any;
  color: string;
  getKeyUrl: string;
  models: { id: string; name: string }[];
}

// --- CONFIG ---
const AI_PROVIDERS: Record<Provider, ProviderConfig> = {
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

const MOCK_DATA = {
  jokes: [
    "Tại sao lập trình viên không thích thiên nhiên? Vì nó có quá nhiều bugs.",
    "Vợ tôi bảo tôi phải chọn giữa lập trình và cô ấy... Tôi sẽ nhớ cô ấy lắm.",
  ],
  quotes: [
    "Hành trình vạn dặm bắt đầu từ một bước chân.",
    "Code là thơ, nhưng bug là đời.",
  ],
};

export const AIChatModule = () => {
  // --- STATE ---
  // 1. Session Management
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("ai_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Create default if needed
  useEffect(() => {
    if (sessions.length === 0) createNewSession();
    else if (!currentSessionId) setCurrentSessionId(sessions[0].id);
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // 2. Chat UI State
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Responsive Sidebar: Mặc định ẩn trên mobile, hiện trên desktop
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);

  // 3. Settings State
  const [provider, setProvider] = useState<Provider>(
    () => (localStorage.getItem("ai_provider") as Provider) || "gemini",
  );
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_api_keys") || "{}");
    } catch {
      return {};
    }
  });
  const [systemPrompt] = useState(
    () =>
      localStorage.getItem("ai_system_prompt") || "Bạn là trợ lý ảo hữu ích.",
  );
  const [selectedModel, setSelectedModel] = useState(
    () =>
      localStorage.getItem("ai_selected_model") ||
      AI_PROVIDERS["gemini"].models[0].id,
  );

  // 4. Modal State (Form Edit/Delete)
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "rename" | "delete" | "clear" | null;
    title: string;
    inputValue?: string;
    targetId?: string;
  }>({ isOpen: false, type: null, title: "" });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("ai_sessions", JSON.stringify(sessions));
  }, [sessions]);
  useEffect(() => {
    localStorage.setItem("ai_api_keys", JSON.stringify(apiKeys));
  }, [apiKeys]);
  useEffect(() => {
    localStorage.setItem("ai_provider", provider);
  }, [provider]);
  useEffect(() => {
    localStorage.setItem("ai_system_prompt", systemPrompt);
  }, [systemPrompt]);
  useEffect(() => {
    localStorage.setItem("ai_selected_model", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, image]);

  // Focus modal input on open
  useEffect(() => {
    if (modal.isOpen && modal.type === "rename") {
      setTimeout(() => modalInputRef.current?.focus(), 100);
    }
  }, [modal.isOpen]);

  // --- ACTIONS ---
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "Đoạn chat mới",
      messages: [],
      timestamp: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const updateCurrentSessionMessages = (newMessages: Message[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          let title = s.title;
          // Auto title for new chats
          if (s.messages.length === 0 && newMessages.length > 0) {
            title =
              newMessages[0].content.slice(0, 30) +
              (newMessages[0].content.length > 30 ? "..." : "");
          }
          return { ...s, messages: newMessages, title };
        }
        return s;
      }),
    );
  };

  // --- MODAL HANDLERS ---
  const openRenameModal = (
    id: string,
    currentTitle: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      type: "rename",
      title: "Đổi tên đoạn chat",
      inputValue: currentTitle,
      targetId: id,
    });
  };

  const openDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({
      isOpen: true,
      type: "delete",
      title: "Xóa đoạn chat?",
      targetId: id,
    });
  };

  const openClearModal = () => {
    setModal({
      isOpen: true,
      type: "clear",
      title: "Xóa lịch sử cuộc trò chuyện này?",
    });
  };

  const handleModalSubmit = () => {
    if (modal.type === "rename" && modal.targetId && modal.inputValue) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === modal.targetId ? { ...s, title: modal.inputValue! } : s,
        ),
      );
    } else if (modal.type === "delete" && modal.targetId) {
      const newSessions = sessions.filter((s) => s.id !== modal.targetId);
      setSessions(newSessions);
      if (currentSessionId === modal.targetId) {
        setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      }
      if (newSessions.length === 0) createNewSession();
    } else if (modal.type === "clear") {
      updateCurrentSessionMessages([]);
    }
    setModal({ ...modal, isOpen: false });
  };

  // --- API CALLS ---
  const callGeminiAPI = async (userText: string, userImage?: string) => {
    try {
      const key = apiKeys.gemini;
      if (!key) return "Vui lòng nhập Gemini API Key trong Cài đặt.";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
      const parts: any[] = [{ text: userText }];
      if (userImage)
        parts.push({
          inline_data: {
            mime_type: userImage.split(";")[0].split(":")[1],
            data: userImage.split(",")[1],
          },
        });
      const history = messages.slice(-4).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `System Prompt: ${systemPrompt}` }],
            },
            ...history,
            { role: "user", parts },
          ],
        }),
      });
      if (response.status === 429) return "🛑 GEMINI HẾT QUOTA.";
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || response.statusText);
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text || "AI không phản hồi."
      );
    } catch (error: any) {
      return `⚠️ Lỗi Gemini: ${error.message}`;
    }
  };

  const callOpenAIAPI = async (userText: string, userImage?: string) => {
    try {
      const key = apiKeys.openai;
      if (!key) return "Vui lòng nhập OpenAI API Key trong Cài đặt.";
      let content: any = userText;
      if (userImage)
        content = [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: userImage } },
        ];
      const history = messages
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemPrompt },
              ...history,
              { role: "user", content },
            ],
            max_tokens: 1000,
          }),
        },
      );
      if (response.status === 429) return "🛑 OPENAI HẾT QUOTA.";
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Lỗi OpenAI");
      return data.choices?.[0]?.message?.content || "Không có phản hồi.";
    } catch (error: any) {
      return `⚠️ Lỗi OpenAI: ${error.message}`;
    }
  };

  const getSmartMockResponse = (text: string): string => {
    const lower = text.toLowerCase().trim();
    if (
      /^tính\s*[:]?\s*[\d\+\-\*\/\(\)\.\s]+$/.test(lower) ||
      /^[\d\+\-\*\/\(\)\.\s]+$/.test(lower)
    ) {
      try {
        return `🤖 Kết quả: **${new Function(
          lower.replace("tính", "").replace(/[^\d\+\-\*\/\(\)\.]/g, ""),
        )}**`;
      } catch {
        return "🤖 Lỗi phép tính.";
      }
    }
    if (lower.match(/^(hi|hello|xin chào)$/))
      return "Chào bạn! 👋 (Offline Mode)";
    if (lower.includes("mấy giờ"))
      return `🕒 ${new Date().toLocaleTimeString("vi-VN")}`;
    if (lower.includes("truyện cười"))
      return (
        "🤣 " +
        MOCK_DATA.jokes[Math.floor(Math.random() * MOCK_DATA.jokes.length)]
      );
    return "📡 Offline: Hỏi 'Mấy giờ', 'Truyện cười' hoặc tính toán đơn giản nhé.";
  };

  // --- HANDLER ---
  const handleSend = async () => {
    if (!input.trim() && !image) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
      image: image || undefined,
    };
    const newMessages = [...messages, userMsg];
    updateCurrentSessionMessages(newMessages);
    setInput("");
    setImage(null);
    setIsLoading(true);

    setTimeout(async () => {
      let res = "";
      if (provider === "gemini")
        res = await callGeminiAPI(userMsg.content, userMsg.image);
      else if (provider === "openai")
        res = await callOpenAIAPI(userMsg.content, userMsg.image);
      else res = getSmartMockResponse(userMsg.content);
      updateCurrentSessionMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res,
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
    }, 100);
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    setIsLoading(true);
    let res = "";
    if (provider === "gemini")
      res = await callGeminiAPI(lastUserMsg.content, lastUserMsg.image);
    else if (provider === "openai")
      res = await callOpenAIAPI(lastUserMsg.content, lastUserMsg.image);
    else res = getSmartMockResponse(lastUserMsg.content);
    updateCurrentSessionMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: res,
        timestamp: Date.now(),
      },
    ]);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Speech) {
      alert("Browser not supported");
      return;
    }
    const rec = new Speech();
    rec.lang = "vi-VN";
    rec.onresult = (e: any) => {
      setInput((prev) => prev + (prev ? " " : "") + e.results[0][0].transcript);
      setIsListening(false);
    };
    rec.start();
    setIsListening(true);
  };
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const match = part.match(/```(\w*)?([\s\S]*?)```/);
        const lang = match ? match[1] : "";
        const code = match ? match[2].trim() : part.slice(3, -3).trim();
        return (
          <div
            key={index}
            className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117]"
          >
            <div className="flex justify-between items-center px-3 py-1.5 bg-slate-800 border-b border-slate-700">
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                {lang || "CODE"}
              </span>
              <button
                onClick={() => copyToClipboard(code)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
              >
                <Copy size={10} /> Copy
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed custom-scrollbar">
              <code>{code}</code>
            </pre>
          </div>
        );
      } else {
        return (
          <div key={index} className="whitespace-pre-wrap font-sans">
            {part.split(/(\*\*.*?\*\*)/g).map((s, i) =>
              s.startsWith("**") ? (
                <strong key={i} className="text-indigo-200">
                  {s.slice(2, -2)}
                </strong>
              ) : (
                s
              ),
            )}
          </div>
        );
      }
    });
  };

  return (
    <div className="h-full flex bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {/* OVERLAY MOBILE: Fix lỗi bị đè layout */}
      {showSidebar && (
        <div
          className="md:hidden absolute inset-0 bg-black/60 z-30 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <div
        className={`
            absolute md:static inset-y-0 left-0 z-40 bg-[#1e293b] border-r border-slate-800 flex flex-col transition-all duration-300 overflow-hidden shadow-2xl md:shadow-none
            ${
              showSidebar
                ? "w-64 translate-x-0"
                : "w-0 -translate-x-full md:w-0 md:translate-x-0"
            }
        `}
      >
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-400 uppercase tracking-wider pl-2">
            Đoạn Chat
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={createNewSession}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id);
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                currentSessionId === session.id
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <MessageSquare
                size={14}
                className={`shrink-0 ${
                  currentSessionId === session.id ? "text-indigo-400" : ""
                }`}
              />
              <span className="text-xs truncate flex-1">{session.title}</span>
              {currentSessionId === session.id && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) =>
                      openRenameModal(session.id, session.title, e)
                    }
                    className="p-1 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Edit3 size={10} />
                  </button>
                  <button
                    onClick={(e) => openDeleteModal(session.id, e)}
                    className="p-1 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative z-0">
        {/* HEADER */}
        <div className="flex-none p-3 border-b border-slate-800 bg-[#1e293b]/80 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-2 overflow-hidden">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg mr-1 shadow-sm border border-slate-700/50"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div
              className={`p-1.5 rounded-lg text-white shadow-lg flex items-center justify-center ${
                provider === "openai"
                  ? "bg-emerald-600"
                  : provider === "offline"
                    ? "bg-slate-600"
                    : "bg-blue-600"
              }`}
            >
              {provider === "openai" ? (
                <Bot size={16} />
              ) : provider === "offline" ? (
                <WifiOff size={16} />
              ) : (
                <Sparkles size={16} />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-sm truncate">
                {AI_PROVIDERS[provider].name}
              </span>
              {provider !== "offline" && (
                <span className="text-[9px] text-slate-400 truncate">
                  {selectedModel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRegenerate}
              disabled={isLoading || messages.length === 0}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
            >
              <RotateCcw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg ${
                showSettings
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Settings size={18} />
            </button>
            <button
              onClick={openClearModal}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-lg transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* SETTINGS DRAWER */}
        {showSettings && (
          <div className="absolute top-14 right-0 w-full md:w-80 bg-slate-900 border-b border-l border-slate-800 p-4 shadow-2xl z-20 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white uppercase">
                Cấu hình AI
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
              {(Object.keys(AI_PROVIDERS) as Provider[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setProvider(key);
                    setSelectedModel(AI_PROVIDERS[key].models[0].id);
                  }}
                  className={`flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-bold transition-all ${
                    provider === key
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {key === "openai" ? (
                    <Bot size={14} className="mb-1" />
                  ) : key === "offline" ? (
                    <WifiOff size={14} className="mb-1" />
                  ) : (
                    <Sparkles size={14} className="mb-1" />
                  )}
                  {key === "openai"
                    ? "OpenAI"
                    : key === "offline"
                      ? "Offline"
                      : "Gemini"}
                </button>
              ))}
            </div>

            {provider !== "offline" && (
              <div className="space-y-4">
                {/* API KEY SECTION */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      API Key
                    </label>

                    {/* NÚT LẤY KEY Ở ĐÂY */}
                    <a
                      href={AI_PROVIDERS[provider].getKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink size={10} /> Lấy Key tại đây
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      value={apiKeys[provider] || ""}
                      onChange={(e) =>
                        setApiKeys((p) => ({
                          ...p,
                          [provider]: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                      placeholder={`Dán ${AI_PROVIDERS[provider].name} Key...`}
                    />
                    <div className="absolute right-2 top-2 text-slate-600">
                      <Key size={14} />
                    </div>
                  </div>
                </div>

                {/* MODEL SELECTOR */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {AI_PROVIDERS[provider].models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-inner ${
                  provider === "openai"
                    ? "bg-emerald-900/20 text-emerald-500"
                    : provider === "offline"
                      ? "bg-slate-800 text-slate-400"
                      : "bg-blue-900/20 text-blue-500"
                }`}
              >
                {provider === "openai" ? (
                  <Bot size={32} />
                ) : provider === "offline" ? (
                  <WifiOff size={32} />
                ) : (
                  <Sparkles size={32} />
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">
                {currentSession?.title || "Đoạn chat mới"}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                } group animate-in slide-in-from-bottom-2`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                    msg.role === "user" ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-white" />
                  )}
                </div>
                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Upload"
                      className="mb-3 rounded-lg max-h-48 w-auto border border-white/10"
                    />
                  )}
                  {msg.role === "assistant" &&
                  (msg.content.includes("HẾT QUOTA") ||
                    msg.content.includes("HẾT TIỀN")) ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-rose-400 font-bold mb-1 border-b border-rose-500/20 pb-1">
                        <AlertTriangle size={16} /> Lỗi
                      </div>
                      <div className="whitespace-pre-wrap font-sans text-slate-300">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    renderContent(msg.content)
                  )}
                  <div className="text-[9px] opacity-40 mt-1 text-right font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white animate-pulse" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="flex-none p-3 bg-[#1e293b] border-t border-slate-800 z-10">
          {image && (
            <div className="relative inline-block mb-2 animate-in slide-in-from-bottom-2">
              <img
                src={image}
                alt="Preview"
                className="h-12 w-auto rounded-lg border border-indigo-500/50 shadow-lg"
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600"
              >
                <X size={10} />
              </button>
            </div>
          )}
          <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-lg focus-within:border-indigo-500 transition-colors">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors mb-0.5"
            >
              <ImageIcon size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              onClick={toggleListening}
              className={`p-1.5 transition-colors mb-0.5 ${
                isListening
                  ? "text-rose-500 animate-pulse"
                  : "text-slate-400 hover:text-indigo-400"
              }`}
            >
              <Mic size={18} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.preventDefault(), handleSend())
              }
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent text-white text-sm px-2 py-1.5 outline-none resize-none max-h-32 custom-scrollbar"
              rows={1}
              style={{ minHeight: "36px" }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !image)}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0 mb-0.5"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- FORM MODAL (RENAME / DELETE) --- */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setModal({ ...modal, isOpen: false })}
        >
          <div
            className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                {modal.type === "delete" || modal.type === "clear" ? (
                  <AlertTriangle size={16} className="text-rose-500" />
                ) : (
                  <Edit3 size={16} className="text-indigo-500" />
                )}
                {modal.title}
              </h3>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* FORM RENAME */}
              {modal.type === "rename" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Tên đoạn chat
                  </label>
                  <input
                    ref={modalInputRef}
                    type="text"
                    value={modal.inputValue || ""}
                    onChange={(e) =>
                      setModal({ ...modal, inputValue: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 text-sm"
                    autoFocus
                  />
                </div>
              )}

              {/* CONFIRM MESSAGE */}
              {(modal.type === "delete" || modal.type === "clear") && (
                <p className="text-sm text-slate-400">
                  Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp
                  tục không?
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleModalSubmit}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all active:scale-95 ${
                  modal.type === "delete" || modal.type === "clear"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {modal.type === "delete" || modal.type === "clear"
                  ? "Xóa bỏ"
                  : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
