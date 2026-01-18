import React, { useState, useEffect, useRef } from "react";
import Peer, { DataConnection } from "peerjs";
import {
  Send,
  Upload,
  Loader2,
  AlertTriangle,
  File as FileIcon,
  Download,
} from "lucide-react";

const CHUNK_SIZE = 16 * 1024; // 16KB

type MsgType = {
  id: number;
  from: "me" | "other";
  type: "text" | "file";
  content: string;
  fileData?: Blob;
};

// --- HÀM HỖ TRỢ KIỂM TRA LINK ---
const isValidUrl = (string: string) => {
  try {
    return Boolean(new URL(string));
  } catch (e) {
    return false;
  }
};

const isImageUrl = (url: string) => {
  return (
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) ||
    url.includes("/image/upload/")
  );
};

const getFileNameFromUrl = (url: string) => {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.split("/").pop()?.split("?")[0] || "downloaded-file";
  } catch {
    return "downloaded-file";
  }
};

export const MobileConnect = () => {
  const [status, setStatus] = useState<"connecting" | "connected" | "error">(
    "connecting"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [text, setText] = useState("");
  const [history, setHistory] = useState<MsgType[]>([]);
  const [progress, setProgress] = useState(0);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const incomingMeta = useRef<{
    name: string;
    size: number;
    mime: string;
  } | null>(null);
  const receivedChunks = useRef<ArrayBuffer[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hostId = params.get("hostId");
    if (!hostId) {
      setStatus("error");
      setErrorMsg("Thiếu Host ID");
      return;
    }

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
          setErrorMsg("Ngắt kết nối");
        });
        conn.on("error", () => {
          setStatus("error");
          setErrorMsg("Lỗi kết nối");
        });
      });
      peer.on("error", (err) => {
        setStatus("error");
        setErrorMsg(err.type);
      });
    } catch (e) {
      setStatus("error");
      setErrorMsg("Lỗi trình duyệt");
    }

    return () => peerRef.current?.destroy();
  }, []);

  useEffect(
    () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    [history]
  );

  const handleIncomingData = (data: any) => {
    // --- ĐỒNG BỘ: XÓA CHAT KHI MÁY TÍNH RA LỆNH ---
    if (data.type === "clear-history") {
      setHistory([]);
      return;
    }

    // 1. NHẬN BINARY
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      if (incomingMeta.current) {
        const buffer = data instanceof Uint8Array ? data.buffer : data;
        receivedChunks.current.push(buffer as ArrayBuffer);
      }
      return;
    }

    // 2. NHẬN TEXT
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
      connRef.current.send({ type: "text", content: text });
      setHistory((prev) => [
        ...prev,
        { id: Date.now(), from: "me", type: "text", content: text },
      ]);
      setText("");
    }
  };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!connRef.current || !file) return;

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
      const chunk = buffer.slice(start, start + CHUNK_SIZE);
      connRef.current.send(chunk as any);
      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise((r) => setTimeout(r, 10));
    }

    connRef.current.send({ type: "file-end" });
    setHistory((prev) => [
      ...prev,
      { id: Date.now(), from: "me", type: "file", content: file.name },
    ]);
    setProgress(0);
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  const downloadRemote = async (url: string) => {
    try {
      const fileName = getFileNameFromUrl(url);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, "_blank");
    }
  };

  const MessageContent = ({ msg }: { msg: MsgType }) => {
    if (msg.type === "file" && msg.fileData) {
      return (
        <div className="flex items-center gap-2">
          <FileIcon size={16} />{" "}
          <span className="truncate max-w-[150px]">{msg.content}</span>
          <button
            onClick={() => downloadBlob(msg.fileData!, msg.content)}
            className="p-1 bg-black/20 rounded ml-1 hover:bg-black/30"
          >
            <Download size={14} />
          </button>
        </div>
      );
    }

    if (msg.type === "text" && isValidUrl(msg.content)) {
      const isImg = isImageUrl(msg.content);
      const fileName = getFileNameFromUrl(msg.content);

      return (
        <div className="flex flex-col gap-2">
          {isImg ? (
            <div className="relative group">
              <img
                src={msg.content}
                alt="Sent file"
                className="rounded-lg max-h-48 w-auto object-cover border border-white/10"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <button
                  onClick={() => downloadRemote(msg.content)}
                  className="p-2 bg-white/20 backdrop-blur rounded-full text-white"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg">
              <div className="p-2 bg-white/10 rounded">
                <FileIcon size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate max-w-[150px]">
                  {fileName}
                </span>
                <span className="text-[10px] opacity-70">Cloud File</span>
              </div>
            </div>
          )}
          <button
            onClick={() => downloadRemote(msg.content)}
            className="flex items-center justify-center gap-2 w-full py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold transition-colors"
          >
            <Download size={12} /> Tải xuống
          </button>
        </div>
      );
    }
    return <span>{msg.content}</span>;
  };

  return (
    <div className="h-[100dvh] w-full bg-black text-white font-sans flex flex-col overflow-hidden">
      <div className="h-14 border-b border-white/10 flex items-center justify-center shrink-0 bg-zinc-900">
        <h1 className="font-bold text-blue-500 tracking-wider">
          OVERDESK LINK
        </h1>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {status === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
            <Loader2 className="animate-spin text-blue-500" />
            <p>Connecting...</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 text-red-500">
            <AlertTriangle />
            <p>{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-zinc-800 rounded"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.from === "me" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.from === "me" ? "bg-blue-600" : "bg-zinc-800"
                }`}
              >
                <MessageContent msg={msg} />
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 bg-zinc-900 border-t border-white/10 shrink-0 flex gap-2">
          <label className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center cursor-pointer">
            {progress > 0 ? (
              <span className="text-[10px] text-blue-400 font-bold">
                {progress}%
              </span>
            ) : (
              <Upload size={20} className="text-zinc-400" />
            )}
            <input
              type="file"
              className="hidden"
              onChange={sendFile}
              disabled={progress > 0}
            />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-zinc-800 rounded-xl px-4 text-white outline-none"
            placeholder="Message..."
          />
          <button
            onClick={sendText}
            disabled={!text.trim()}
            className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
