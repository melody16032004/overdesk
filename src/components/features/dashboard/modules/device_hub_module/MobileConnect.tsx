import React, { useState, useEffect, useRef, useMemo } from "react";
import Peer, { DataConnection } from "peerjs";
import {
  Send,
  Paperclip,
  Settings,
  CheckCheck,
  User,
  Palette,
  Sparkles,
  X,
  Search,
} from "lucide-react";
import { MessageBubble } from "./components/MessageBubble";
import { CHUNK_SIZE, THEMES } from "./constants/device_hub_const";
import { MsgType, AppSettings } from "./types/device_hub_type";
import { Disconnected } from "./components/Disconnected";
import { downloadFile } from "./helpers/device_hub_helper";

// --- (PHẦN CÒN LẠI CỦA COMPONENT MobileConnect GIỮ NGUYÊN) ---
export const MobileConnect = () => {
  const [status, setStatus] = useState<"connecting" | "connected" | "error">(
    "connecting",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [text, setText] = useState("");
  const [history, setHistory] = useState<MsgType[]>([]);
  const [progress, setProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("appSettings");
    return saved
      ? JSON.parse(saved)
      : { username: "You", themeColor: "blue", enableStars: true };
  });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const incomingMeta = useRef<{
    name: string;
    size: number;
    mime: string;
  } | null>(null);
  const receivedChunks = useRef<ArrayBuffer[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  const stars = useMemo(() => {
    if (!settings.enableStars) return null;
    return Array.from({ length: 50 }).map((_, i) => (
      <div
        key={i}
        className="star-twinkle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${Math.random() * 3 + 2}s`,
          opacity: Math.random() * 0.5 + 0.3,
        }}
      />
    ));
  }, [settings.enableStars]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hostId = params.get("hostId");
    if (!hostId) {
      setStatus("error");
      setErrorMsg("Thiếu Host ID");
      return;
    }

    const initPeer = () => {
      try {
        const peer = new Peer();
        peerRef.current = peer;
        peer.on("open", () => {
          const conn = peer.connect(hostId, { reliable: true });
          conn.on("open", () => {
            setStatus("connected");
            connRef.current = conn;
          });
          conn.on("data", (data) => handleIncomingData(data));
          conn.on("close", () => {
            setStatus("error");
            setErrorMsg("Mất kết nối với máy chủ");
          });
          conn.on("error", () => {
            setStatus("error");
            setErrorMsg("Lỗi đường truyền");
          });
        });
        peer.on("error", (err) => {
          setStatus("error");
          setErrorMsg(
            err.type === "peer-unavailable"
              ? "Không tìm thấy máy chủ"
              : "Lỗi kết nối",
          );
        });
      } catch (e) {
        setStatus("error");
        setErrorMsg("Trình duyệt không hỗ trợ");
      }
    };
    initPeer();
    return () => peerRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (!isSearching)
      setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
  }, [history, showSettings, isSearching]);

  useEffect(() => {
    if (isSearching) setTimeout(() => searchInputRef.current?.focus(), 100);
    else setSearchTerm("");
  }, [isSearching]);

  const handleIncomingData = (data: any) => {
    if (data.type === "clear-history") {
      setHistory([]);
      return;
    }

    // --- [SỬA LỖI TẠI ĐÂY] ---
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      if (incomingMeta.current) {
        const buffer = data instanceof Uint8Array ? data.buffer : data;

        // Ép kiểu 'as unknown as ArrayBuffer' để TypeScript bỏ qua lỗi SharedArrayBuffer
        receivedChunks.current.push(buffer as unknown as ArrayBuffer);
      }
      return;
    }
    if (data.type === "text") {
      setHistory((prev) => [
        ...prev,
        { id: Date.now(), from: "other", type: "text", content: data.content },
      ]);
    } else if (data.type === "file-start") {
      incomingMeta.current = data;
      receivedChunks.current = [];
    } else if (data.type === "file-end") {
      if (incomingMeta.current) {
        const blob = new Blob(receivedChunks.current, {
          type: incomingMeta.current.mime,
        });
        setHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            from: "other",
            type: "file",
            content: incomingMeta.current!.name,
            fileData: blob,
          },
        ]);
        incomingMeta.current = null;
        receivedChunks.current = [];
      }
    }
  };

  const sendText = () => {
    if (connRef.current && text.trim()) {
      connRef.current.send({
        type: "text",
        content: text,
        sender: settings.username,
      });
      setHistory((prev) => [
        ...prev,
        { id: Date.now(), from: "me", type: "text", content: text },
      ]);
      setText("");
      if (inputRef.current) inputRef.current.blur();
    }
  };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!connRef.current || !file) return;
    e.target.value = "";
    setHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: "me",
        type: "file",
        content: file.name,
        fileData: file,
      },
    ]);
    connRef.current.send({
      type: "file-start",
      name: file.name,
      size: file.size,
      mime: file.type,
    });
    const buffer = await file.arrayBuffer();
    const total = Math.ceil(file.size / CHUNK_SIZE);
    for (let i = 0; i < total; i++) {
      const start = i * CHUNK_SIZE;
      const chunk = buffer.slice(start, (i + 1) * CHUNK_SIZE);
      connRef.current.send(chunk as any);
      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise((r) => setTimeout(r, 5));
    }
    connRef.current.send({ type: "file-end" });
    setProgress(0);
  };

  const matchCount = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    return history.filter((msg) =>
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()),
    ).length;
  }, [history, searchTerm]);

  const themeClass = THEMES[settings.themeColor].bg;
  const themeText = THEMES[settings.themeColor].text;
  const themeBorder = THEMES[settings.themeColor].border;

  if (status !== "connected") {
    <Disconnected
      status={status}
      stars={stars}
      themeBorder={themeBorder}
      themeText={themeText}
      errorMsg={errorMsg}
      themeClass={themeClass}
    />;
  }

  return (
    <div className="h-[100dvh] w-full font-sans flex flex-col bg-[#09101a] text-slate-100 overflow-hidden relative">
      <div className="h-14 px-4 flex items-center justify-between shrink-0 z-30 w-full bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        {isSearching ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-4 duration-200">
            <Search size={18} className="text-slate-400" />
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white text-[16px] placeholder-slate-500"
              placeholder="Tìm tin nhắn, file..."
            />
            {searchTerm && (
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 whitespace-nowrap">
                {matchCount} kết quả
              </span>
            )}
            <button
              onClick={() => setIsSearching(false)}
              className="p-1 bg-white/10 rounded-full hover:bg-white/20"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${themeClass}`}
              >
                {settings.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-bold text-white text-base">
                  Overdesk Sync
                </h1>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${status === "connected" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"}`}
                  ></span>
                  <span className="text-xs text-slate-400 font-medium">
                    {status === "connected" ? "Online" : "Reconnecting..."}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <Settings size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[radial-gradient(ellipse_at_bottom,_#1b2735_0%,_#090a0f_100%)]">
          {stars}
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 custom-scrollbar z-10">
          {history.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500 text-sm bg-black/20 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-white/5 ${themeText}`}
                >
                  <Send size={24} />
                </div>
                <p className="font-medium text-slate-300 mb-1">
                  Xin chào, {settings.username}!
                </p>
                <p className="text-xs opacity-70">
                  Gửi file hoặc chat để bắt đầu đồng bộ.
                </p>
              </div>
            </div>
          )}

          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.from === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm backdrop-blur-md transition-all ${msg.from === "me" ? `${themeClass} text-white rounded-2xl rounded-tr-sm` : "bg-[#1e293b]/95 text-slate-200 rounded-2xl rounded-tl-sm border border-white/10"}`}
              >
                <MessageBubble
                  msg={msg}
                  searchTerm={searchTerm}
                  onDownload={downloadFile}
                />
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {!isSearching && (
          <div className="shrink-0 p-2 z-20 bg-gradient-to-t from-[#09101a] via-[#09101a]/95 to-transparent pt-4 pb-safe">
            <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex items-end gap-2 shadow-2xl mx-auto max-w-3xl">
              <label
                className={`p-3 hover:text-white pointer transition-colors active:scale-95 ${text.trim() ? "text-slate-400" : themeText}`}
              >
                {progress > 0 ? (
                  <span className="text-[10px] font-bold">{progress}%</span>
                ) : (
                  <>
                    <Paperclip size={24} />
                    <input
                      type="file"
                      className="hidden"
                      onChange={sendFile}
                      disabled={progress > 0}
                    />
                  </>
                )}
              </label>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendText()}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-[16px] outline-none py-3 min-w-0"
                placeholder="Tin nhắn..."
              />
              <button
                onClick={sendText}
                disabled={!text.trim()}
                className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${text.trim() ? `${themeClass} text-white shadow-lg transform active:scale-90` : "bg-white/5 text-slate-600 cursor-default"}`}
              >
                <Send
                  size={20}
                  className={text.trim() ? "translate-x-0.5" : ""}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e293b] rounded-t-3xl border-t border-white/10 shadow-2xl w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-300 pb-safe">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Settings size={18} /> Cài đặt
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <User size={14} /> Tên hiển thị
                </label>
                <input
                  value={settings.username}
                  onChange={(e) =>
                    setSettings({ ...settings, username: e.target.value })
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                  placeholder="Nhập tên của bạn..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Palette size={14} /> Màu chủ đạo
                </label>
                <div className="flex gap-3">
                  {Object.keys(THEMES).map((key) => (
                    <button
                      key={key}
                      onClick={() =>
                        setSettings({ ...settings, themeColor: key })
                      }
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${THEMES[key].bg} ${settings.themeColor === key ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60"}`}
                    >
                      {settings.themeColor === key && (
                        <CheckCheck size={16} className="text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Sparkles size={18} className="text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium">Hiệu ứng sao bay</span>
                </div>
                <label className="relative inline-flex items-center pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableStars}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        enableStars: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pb-safe { padding-bottom: max(8px, env(safe-area-inset-bottom)); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .star-twinkle { position: absolute; background-color: white; border-radius: 50%; box-shadow: 0 0 2px rgba(255, 255, 255, 0.8); animation: twinkle infinite ease-in-out alternate; }
        @keyframes twinkle { 0% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 4px rgba(255, 255, 255, 1); } 100% { opacity: 0.3; transform: scale(0.9); } }
      `}</style>
    </div>
  );
};
