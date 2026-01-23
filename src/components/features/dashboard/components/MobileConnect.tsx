import React, { useState, useEffect, useRef, useMemo } from "react";
import Peer, { DataConnection } from "peerjs";
import {
  Send,
  AlertTriangle,
  File as FileIcon,
  Download,
  Paperclip,
  Settings,
  CheckCheck,
  Loader2,
  User,
  Palette,
  Sparkles,
  X,
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

// ... (Giữ nguyên các CONST, TYPES, UTILS cũ: CHUNK_SIZE, MsgType, AppSettings, THEMES, isValidUrl...)
// Để ngắn gọn, tôi sẽ focus vào phần sửa lỗi Copy

const CHUNK_SIZE = 16 * 1024;

// --- TYPES ---
type MsgType = {
  id: number;
  from: "me" | "other";
  type: "text" | "file";
  content: string;
  senderName?: string;
  fileData?: Blob;
};

type AppSettings = {
  username: string;
  themeColor: string;
  enableStars: boolean;
};

const THEMES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-600", text: "text-blue-500", border: "border-blue-500" },
  purple: {
    bg: "bg-purple-600",
    text: "text-purple-500",
    border: "border-purple-500",
  },
  orange: {
    bg: "bg-orange-600",
    text: "text-orange-500",
    border: "border-orange-500",
  },
  green: {
    bg: "bg-emerald-600",
    text: "text-emerald-500",
    border: "border-emerald-500",
  },
};

const isValidUrl = (string: string) => {
  try {
    return Boolean(new URL(string));
  } catch (e) {
    return false;
  }
};
const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) ||
  url.includes("/image/upload/");
const formatBytes = (bytes: number) => {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
const escapeRegExp = (string: string) =>
  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const escapedHighlight = escapeRegExp(highlight);
  try {
    const regex = new RegExp(`(${escapedHighlight})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={i}
              className="bg-yellow-500/80 text-white rounded px-0.5 font-medium"
            >
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
};

// --- [ĐÃ SỬA] COMPONENT MESSAGE BUBBLE ---
const MessageBubble = ({
  msg,
  searchTerm,
  onDownload,
}: {
  msg: MsgType;
  searchTerm: string;
  onDownload: (blob: Blob, name: string) => void;
}) => {
  const [copied, setCopied] = useState(false);

  // Hàm Copy mạnh mẽ (hoạt động cả HTTP và HTTPS)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = msg.content;

    try {
      // Cách 1: API Chuẩn (HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Cách 2: Fallback (HTTP / Mobile cũ)
        // Tạo một thẻ textarea ảo để copy
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Đảm bảo nó không hiển thị gây vướng nhưng vẫn thuộc DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        // Thực hiện lệnh copy
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) throw new Error("Fallback copy failed");
      }

      // Hiệu ứng thành công
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Không thể sao chép tin nhắn này."); // Báo lỗi cho người dùng biết
    }
  };

  // 1. FILE RENDER
  if (msg.type === "file" && msg.fileData) {
    const isImage = msg.fileData.type.startsWith("image/");

    if (isImage) {
      const imgUrl = URL.createObjectURL(msg.fileData);
      return (
        <div
          className="flex flex-col gap-1 group cursor-pointer"
          onClick={() => onDownload(msg.fileData!, msg.content)}
        >
          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/20">
            <img
              src={imgUrl}
              alt="preview"
              className="max-h-60 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="bg-black/60 p-2 rounded-full backdrop-blur-md">
                <Download size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-1 mt-1">
            <span className="text-[10px] opacity-70 truncate max-w-[150px]">
              <HighlightText text={msg.content} highlight={searchTerm} />
            </span>
            <span className="text-[10px] opacity-60 font-medium">
              {formatBytes(msg.fileData.size)}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div
        className="flex items-center gap-3 min-w-[200px] cursor-pointer group"
        onClick={() => onDownload(msg.fileData!, msg.content)}
      >
        <div className="bg-white/20 p-3 rounded-full flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
          <FileIcon size={24} className="text-white" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-sm font-bold leading-tight mb-0.5">
            <HighlightText text={msg.content} highlight={searchTerm} />
          </div>
          <div className="text-[11px] opacity-80 flex items-center gap-1">
            {formatBytes(msg.fileData.size)} • File
          </div>
        </div>
        <div className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
          <Download size={20} className="text-white" />
        </div>
      </div>
    );
  }

  // 2. TEXT RENDER
  const isLink = msg.type === "text" && isValidUrl(msg.content);
  const isImgLink = isLink && isImageUrl(msg.content);

  return (
    <div className="flex flex-col relative">
      {isImgLink ? (
        <div className="rounded-lg overflow-hidden border border-white/10 mb-1 relative group">
          <img
            src={msg.content}
            alt="sent"
            className="max-h-64 w-full object-cover"
          />
          <a
            href={msg.content}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <div className="bg-black/50 p-2 rounded-full text-white backdrop-blur-sm">
              <Download size={24} />
            </div>
          </a>
        </div>
      ) : isLink ? (
        <div className="bg-black/20 p-3 rounded-xl flex items-center gap-3 mb-1">
          <div className="p-2 bg-white/10 rounded-lg shrink-0 text-white">
            <Paperclip size={18} />
          </div>
          <div className="overflow-hidden">
            <a
              href={msg.content}
              target="_blank"
              rel="noreferrer"
              className="hover:underline text-sm truncate block font-medium text-white"
            >
              <HighlightText text={msg.content} highlight={searchTerm} />
            </a>
            <span className="text-[10px] text-slate-400">Liên kết ngoài</span>
          </div>
        </div>
      ) : (
        <span className="text-[16px] leading-relaxed break-words">
          <HighlightText text={msg.content} highlight={searchTerm} />
        </span>
      )}

      {/* FOOTER: Time & Copy Button */}
      <div
        className={`text-[10px] mt-1 flex items-center justify-end gap-3 select-none ${msg.from === "me" ? "text-white/70" : "text-slate-500"}`}
      >
        {/* Nút Copy - Đã tăng kích thước vùng bấm (p-2) để dễ bấm trên điện thoại */}
        <button
          onClick={handleCopy}
          className="group flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity p-1.5 -m-1.5"
          title="Sao chép"
        >
          {copied ? (
            <Check
              size={14}
              className={msg.from === "me" ? "text-white" : "text-green-500"}
              strokeWidth={3}
            />
          ) : (
            <Copy size={12} />
          )}
        </button>

        <span className="flex items-center gap-1">
          {new Date(msg.id).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {msg.from === "me" && <CheckCheck size={14} />}
        </span>
      </div>
    </div>
  );
};

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

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
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
    return (
      <div className="h-[100dvh] w-full bg-[#09101a] text-slate-100 flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 z-0 pointer-events-none">{stars}</div>
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20">
          <div
            className={`w-[300px] h-[300px] rounded-full border-4 ${themeBorder} animate-[ping_3s_linear_infinite]`}
          ></div>
          <div
            className={`absolute w-[200px] h-[200px] rounded-full border-4 ${themeBorder} animate-[ping_3s_linear_infinite_1s]`}
          ></div>
        </div>
        <div className="z-10 flex flex-col items-center gap-6 p-8 text-center max-w-sm">
          <div
            className={`w-24 h-24 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl relative`}
          >
            {status === "connecting" ? (
              <>
                <Loader2 className={`w-10 h-10 ${themeText} animate-spin`} />
                <div
                  className={`absolute -bottom-1 -right-1 w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center border border-white/10`}
                >
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-10 h-10 text-red-500" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1e293b] rounded-full flex items-center justify-center border border-white/10">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              </>
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {status === "connecting" ? "Đang kết nối..." : "Mất kết nối"}
            </h2>
            <p className="text-sm text-slate-400">
              {status === "connecting"
                ? "Đang tìm kiếm thiết bị chủ. Vui lòng đợi."
                : errorMsg || "Không thể liên lạc với máy chủ."}
            </p>
          </div>
          {status === "error" && (
            <button
              onClick={() => window.location.reload()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white shadow-lg active:scale-95 transition-all ${themeClass}`}
            >
              <RefreshCw size={18} /> Thử lại ngay
            </button>
          )}
        </div>
        <div className="absolute bottom-8 text-[10px] text-slate-600 font-mono">
          OVERDESK P2P • SECURE LINK
        </div>
      </div>
    );
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
                  onDownload={downloadBlob}
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
                className={`p-3 hover:text-white cursor-pointer transition-colors active:scale-95 ${text.trim() ? "text-slate-400" : themeText}`}
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
                <label className="relative inline-flex items-center cursor-pointer">
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
