import React, { useState, useEffect, useRef } from "react";
import Peer, { DataConnection } from "peerjs";
import { QRCodeSVG } from "qrcode.react";
import {
  Send,
  Laptop,
  Download,
  File as FileIcon,
  Network,
  CheckCircle2,
  Settings,
  X,
  Power,
  CloudUpload,
  Trash2,
  History, // Thêm icon History
} from "lucide-react";

// --- CẤU HÌNH CLOUDINARY ---
const CLOUD_NAME = "dspycnr0t";
const UPLOAD_PRESET = "overdesk";

type MsgType = {
  id: number;
  from: "me" | "phone";
  type: "text" | "file";
  content: string;
  fileData?: Blob;
};

export const PhoneModule = () => {
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [myId, setMyId] = useState<string>("");
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [history, setHistory] = useState<MsgType[]>([]);
  const [text, setText] = useState("");
  const [progress, setProgress] = useState(0);
  const [lanIp, setLanIp] = useState("");
  const [inputIp, setInputIp] = useState("192.168.1.");
  const [isIpConfigOpen, setIsIpConfigOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // --- STATE LỊCH SỬ IP ---
  const [ipHistory, setIpHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const incomingFileMeta = useRef<{
    name: string;
    size: number;
    mime: string;
  } | null>(null);
  const receivedChunks = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const deleteTokensRef = useRef<string[]>([]);

  useEffect(() => {
    setInputIp(window.location.hostname);

    // Load lịch sử IP từ LocalStorage
    const savedHistory = localStorage.getItem("overdesk_ip_history");
    if (savedHistory) {
      try {
        setIpHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }

    return () => {
      handleStopServer();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const startServer = () => {
    setIsServerRunning(true);
    try {
      const peer = new Peer();
      peerRef.current = peer;
      peer.on("open", (id) => setMyId(id));
      peer.on("connection", (conn) => {
        setConnection(conn);
        conn.on("data", (data) => handleIncomingData(data));
        conn.on("close", () => setConnection(null));
        conn.on("error", (err) => console.error(err));
      });
      peer.on("error", () => setIsServerRunning(false));
    } catch (err) {
      setIsServerRunning(false);
    }
  };

  const cleanupCloudFiles = async () => {
    if (deleteTokensRef.current.length === 0) return;
    setIsCleaning(true);
    const tokens = [...deleteTokensRef.current];
    tokens.forEach((token) => {
      const formData = new FormData();
      formData.append("token", token);
      fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/delete_by_token`, {
        method: "POST",
        body: formData,
      }).catch((err) => console.error("Clean error", err));
    });
    deleteTokensRef.current = [];
    setIsCleaning(false);
  };

  const handleStopServer = async () => {
    await cleanupCloudFiles();
    setIsServerRunning(false);
    setConnection(null);
    setMyId("");
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    incomingFileMeta.current = null;
    receivedChunks.current = [];
  };

  const handleClearChat = async () => {
    await cleanupCloudFiles();
    setHistory([]);
  };

  // --- XỬ LÝ LƯU IP VÀO LỊCH SỬ ---
  const generateQr = () => {
    if (inputIp.trim().length > 7) {
      setLanIp(inputIp.trim());
      setIsIpConfigOpen(false);

      // Lưu IP vào lịch sử (Unique, tối đa 5 cái gần nhất)
      const newHistory = [
        inputIp,
        ...ipHistory.filter((ip) => ip !== inputIp),
      ].slice(0, 5);
      setIpHistory(newHistory);
      localStorage.setItem("overdesk_ip_history", JSON.stringify(newHistory));
    }
  };

  const selectIpFromHistory = (ip: string) => {
    setInputIp(ip);
    setShowHistory(false);
  };

  const handleIncomingData = (data: any) => {
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      if (incomingFileMeta.current) {
        receivedChunks.current.push(new Blob([data as any]));
      }
      return;
    }
    if (data.type === "text") {
      setHistory((prev) => [
        ...prev,
        { id: Date.now(), from: "phone", type: "text", content: data.content },
      ]);
      try {
        navigator.clipboard.writeText(data.content);
      } catch (e) {}
    } else if (data.type === "file-start") {
      incomingFileMeta.current = data;
      receivedChunks.current = [];
    } else if (data.type === "file-end") {
      const meta = incomingFileMeta.current;
      if (meta) {
        const blob = new Blob(receivedChunks.current, {
          type: meta.mime,
        });
        setHistory((prev) => [
          ...prev,
          {
            id: Date.now(),
            from: "phone",
            type: "file",
            content: meta.name,
            fileData: blob,
          },
        ]);
        incomingFileMeta.current = null;
        receivedChunks.current = [];
      }
    }
  };

  const sendText = () => {
    if (connection && text.trim()) {
      connection.send({ type: "text", content: text });
      setHistory((prev) => [
        ...prev,
        { id: Date.now(), from: "me", type: "text", content: text },
      ]);
      setText("");
    }
  };

  const sendFileViaCloud = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!connection || !file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`
      );
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const fileUrl = response.secure_url;
          if (response.delete_token) {
            deleteTokensRef.current.push(response.delete_token);
          }
          connection.send({ type: "text", content: fileUrl });
          setHistory((prev) => [
            ...prev,
            { id: Date.now(), from: "me", type: "text", content: fileUrl },
          ]);
          setProgress(0);
        } else {
          console.error("Cloudinary Error:", xhr.responseText);
          alert("Upload failed (400). Check console.");
          setProgress(0);
        }
      };
      xhr.onerror = () => {
        alert("Network error.");
        setProgress(0);
      };
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setProgress(0);
    }
  };

  const port = "1420"; /*window.location.pport*/
  const connectUrl = `http://${lanIp}:${port}/connect?hostId=${myId}`;
  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="w-full h-full flex flex-col font-sans text-slate-200 select-none relative animate-in fade-in zoom-in duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-transparent pointer-events-none rounded-3xl"></div>
      <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4 z-10">
        {!isServerRunning ? (
          <div className="text-center bg-zinc-900/80 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-zinc-700 shadow-inner">
              <Laptop size={36} className="text-zinc-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Device Hub</h2>
            <button
              onClick={startServer}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 mx-auto mt-6 shadow-lg transition-all"
            >
              <Power size={18} /> START SERVER
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl h-full flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
              <div className="bg-zinc-900/90 border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center relative h-full shadow-xl">
                <div className="flex items-center gap-2 mb-4 w-full justify-center border-b border-white/5 pb-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connection ? "bg-green-500 animate-pulse" : "bg-amber-500"
                    }`}
                  ></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {connection ? "Online" : "Waiting"}
                  </span>
                </div>
                {!connection ? (
                  !lanIp || !myId || isIpConfigOpen ? (
                    <div className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-left animate-in slide-in-from-left relative">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                          <Network size={12} /> IP Config
                        </label>
                        {lanIp && myId && (
                          <button onClick={() => setIsIpConfigOpen(false)}>
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* INPUT WRAPPER */}
                      <div className="relative mb-2 group">
                        <input
                          className="w-full bg-zinc-800 border border-white/10 rounded px-3 py-2 text-xs text-white outline-none font-mono focus:border-blue-500 transition-colors"
                          placeholder="192.168.1.5"
                          value={inputIp}
                          onChange={(e) => setInputIp(e.target.value)}
                          onFocus={() => setShowHistory(true)}
                          // Delay blur để kịp nhận sự kiện click vào dropdown
                          onBlur={() =>
                            setTimeout(() => setShowHistory(false), 200)
                          }
                        />
                        {/* DROPDOWN HISTORY */}
                        {showHistory && ipHistory.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 border-b border-white/5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              <History size={10} /> Recent Used
                            </div>
                            {ipHistory.map((ip, index) => (
                              <button
                                key={index}
                                onClick={() => selectIpFromHistory(ip)}
                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-blue-600 hover:text-white transition-colors font-mono flex justify-between items-center group/item"
                              >
                                {ip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={generateQr}
                        disabled={!myId}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-[10px] font-bold disabled:opacity-50 transition-colors shadow-lg"
                      >
                        {myId ? "GENERATE QR" : "INITIALIZING..."}
                      </button>
                    </div>
                  ) : (
                    <div className="animate-in zoom-in duration-300 flex flex-col items-center w-full">
                      <div className="p-3 bg-white rounded-xl shadow-lg relative group mb-4">
                        <QRCodeSVG value={connectUrl} size={140} />
                        <button
                          onClick={() => setIsIpConfigOpen(true)}
                          className="absolute -top-2 -right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                      <div className="text-[10px] text-zinc-500 bg-zinc-950/50 px-3 py-1.5 rounded-full border border-white/5 font-mono max-w-full truncate">
                        {connectUrl}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="w-full py-8 bg-green-500/5 border border-green-500/20 rounded-2xl flex flex-col items-center animate-in zoom-in mt-4">
                    <CheckCircle2 size={32} className="text-green-500 mb-2" />
                    <span className="text-green-400 text-sm font-bold">
                      Device Paired
                    </span>
                  </div>
                )}
                <div className="flex-1"></div>

                <button
                  onClick={handleStopServer}
                  disabled={isCleaning}
                  className="mt-4 w-full py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/10 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isCleaning ? "Cleaning..." : "STOP SERVER"}
                </button>
              </div>
            </div>
            <div className="flex-1 bg-zinc-900/90 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Chat
                </span>
                {history.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    disabled={isCleaning}
                    className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1"
                  >
                    <Trash2 size={10} />{" "}
                    {isCleaning ? "Cleaning..." : "Clear & Delete"}
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`flex ${
                      item.from === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-md ${
                        item.from === "me"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-white/5"
                      }`}
                    >
                      {item.type === "text" ? (
                        item.content.startsWith("http") ? (
                          <a
                            href={item.content}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-300 underline break-all hover:text-blue-200"
                          >
                            {item.content}
                          </a>
                        ) : (
                          <p>{item.content}</p>
                        )
                      ) : (
                        <div className="flex items-center gap-3">
                          <FileIcon size={20} />
                          <span className="truncate max-w-[150px]">
                            {item.content}
                          </span>
                          {item.fileData && (
                            <button
                              onClick={() =>
                                downloadFile(item.fileData!, item.content)
                              }
                              className="p-1 bg-white/20 rounded hover:bg-white/30"
                            >
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-white/5 bg-zinc-950/50 flex gap-3 items-center">
                <label
                  className={`p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl cursor-pointer transition-colors border border-white/5 ${
                    !connection ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {progress > 0 ? (
                    <span className="text-xs font-bold text-blue-400">
                      {progress}%
                    </span>
                  ) : (
                    <CloudUpload size={20} className="text-zinc-400" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={sendFileViaCloud}
                    disabled={progress > 0}
                  />
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendText()}
                  disabled={!connection}
                  className="flex-1 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendText}
                  disabled={!connection || !text.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-xl"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
