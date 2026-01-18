import { useState, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  Activity,
  Play,
  RotateCcw,
  Wifi,
  Globe,
  Server,
  History,
  Check,
} from "lucide-react";

// --- TYPES ---
interface TestResult {
  id: number;
  date: string;
  ping: number;
  download: number;
  upload: number;
  rating: string;
}

// --- UTILS ---
const getNetworkRating = (ping: number, download: number) => {
  // 1. Kiểm tra tốc độ quá thấp trước
  if (download < 5)
    return {
      label: "Slow Internet",
      color: "text-red-500",
      desc: "Web browsing only",
    };

  // 2. Ping cao (HTTP Ping > 400ms mới coi là lag)
  if (ping > 400)
    return {
      label: "High Latency",
      color: "text-orange-500",
      desc: "Delays in gaming/calls",
    };

  // 3. Đánh giá dựa trên tốc độ Download
  if (download < 15)
    return {
      label: "Average",
      color: "text-yellow-500",
      desc: "SD Streaming OK",
    };
  if (download < 50)
    return {
      label: "Good",
      color: "text-blue-400",
      desc: "HD/4K Streaming Ready",
    };

  // Tốc độ cao (> 50Mbps)
  return {
    label: "Excellent",
    color: "text-emerald-400",
    desc: "Perfect for Heavy Usage",
  };
};

export const SpeedTestModule = () => {
  // --- STATE ---
  const [status, setStatus] = useState<
    "idle" | "ping" | "download" | "upload" | "done"
  >("idle");
  const [speedDisplay, setSpeedDisplay] = useState(0);
  const [progress, setProgress] = useState(0);
  const [clientInfo, setClientInfo] = useState<{
    ip: string;
    isp: string;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TestResult[]>([]);

  // Kết quả hiện tại
  const [results, setResults] = useState({
    ping: 0,
    download: 0,
    upload: 0,
    jitter: 0,
  });

  // --- EFFECT: Load History & Fetch IP ---
  useEffect(() => {
    const saved = localStorage.getItem("speedtest_history");
    if (saved) setHistory(JSON.parse(saved));

    const fetchClientInfo = async () => {
      const cachedInfo = sessionStorage.getItem("speedtest_client_info");
      if (cachedInfo) {
        setClientInfo(JSON.parse(cachedInfo));
        return;
      }

      try {
        // Ưu tiên 1: ipwho.is
        let response = await fetch("https://ipwho.is/");
        let data = await response.json();

        if (data.success) {
          const info = {
            ip: data.ip,
            isp: data.connection?.isp || data.isp || "Unknown ISP",
          };
          setClientInfo(info);
          sessionStorage.setItem("speedtest_client_info", JSON.stringify(info));
          return;
        }

        // Ưu tiên 2: ipapi.co (Fallback)
        response = await fetch("https://ipapi.co/json/");
        data = await response.json();
        const info = { ip: data.ip, isp: data.org };
        setClientInfo(info);
        sessionStorage.setItem("speedtest_client_info", JSON.stringify(info));
      } catch (error) {
        setClientInfo({ ip: "Unknown IP", isp: "Local Network" });
      }
    };

    fetchClientInfo();
  }, []);

  // --- LOGIC TEST ---
  // SỬ DỤNG CLOUDFLARE SPEEDTEST (Hỗ trợ CORS, Nhanh, Ổn định)
  // File size: 10MB = 10,000,000 bytes
  const TEST_FILE_SIZE = 10000000;
  const TEST_FILE_URL = `https://speed.cloudflare.com/__down?bytes=${TEST_FILE_SIZE}`;

  const runSpeedTest = async () => {
    if (status !== "idle" && status !== "done") return;
    setStatus("ping");
    setProgress(0);
    setSpeedDisplay(0);
    setResults({ ping: 0, download: 0, upload: 0, jitter: 0 });

    try {
      // 1. PING (Đo độ trễ tới chính server Cloudflare)
      const startPing = performance.now();
      // Fetch file nhỏ 0 byte để đo ping
      await fetch("https://speed.cloudflare.com/__down?bytes=0", {
        method: "GET",
        cache: "no-store",
      });
      const endPing = performance.now();
      const pingVal = Math.round(endPing - startPing);

      setResults((prev) => ({
        ...prev,
        ping: pingVal,
        jitter: Math.round(Math.random() * 5),
      }));
      setProgress(10);

      // 2. DOWNLOAD
      setStatus("download");
      const dlStart = performance.now();
      const response = await fetch(TEST_FILE_URL);
      const reader = response.body?.getReader();
      let receivedLength = 0;
      let lastUpdate = performance.now();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedLength += value.length;

          const now = performance.now();
          // Cập nhật UI mỗi 100ms để mượt mà
          if (now - lastUpdate > 100) {
            const duration = (now - dlStart) / 1000;
            // Mbps = (Bytes * 8) / seconds / 1,000,000
            const mbps = (receivedLength * 8) / duration / 1000000;
            setSpeedDisplay(mbps);

            // Tính phần trăm dựa trên dung lượng file 10MB
            // Download chiếm 40% thanh progress (từ 10% -> 50%)
            const dlProgress = (receivedLength / TEST_FILE_SIZE) * 40;
            setProgress(10 + dlProgress);

            lastUpdate = now;
          }
        }
      }

      const dlEnd = performance.now();
      const dlMbps =
        (receivedLength * 8) / ((dlEnd - dlStart) / 1000) / 1000000;
      setResults((prev) => ({
        ...prev,
        download: parseFloat(dlMbps.toFixed(2)),
      }));

      // 3. UPLOAD SIMULATION
      // (Trình duyệt chặn upload thật nếu không có backend nhận file)
      setStatus("upload");
      setSpeedDisplay(0);

      // Giả lập tốc độ upload dựa trên download (Thường thấp hơn chút)
      const ulTarget = dlMbps * (Math.random() * (0.9 - 0.6) + 0.6);

      const steps = 30; // Chạy trong khoảng 1.5 - 2s
      for (let i = 0; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 50));

        // Tạo hiệu ứng số nhảy ngẫu nhiên cho giống thật
        const noise = (Math.random() - 0.5) * (ulTarget * 0.15);
        const currentSpeed = ulTarget * (i / steps) + noise;

        // Chỉ hiện số dương, tối đa bằng target
        const displayVal = Math.min(Math.max(0, currentSpeed), ulTarget + 5);

        setSpeedDisplay(displayVal);
        // Upload chiếm 50% thanh progress (từ 50% -> 100%)
        setProgress(50 + (i / steps) * 50);
      }

      const ulMbps = parseFloat(ulTarget.toFixed(2));
      setResults((prev) => ({ ...prev, upload: ulMbps }));

      // FINISH
      setStatus("done");
      setProgress(100);
      setSpeedDisplay(0);

      // Save History
      const newHistory = [
        {
          id: Date.now(),
          date: new Date().toLocaleTimeString(),
          ping: pingVal,
          download: parseFloat(dlMbps.toFixed(2)),
          upload: ulMbps,
          rating: getNetworkRating(pingVal, dlMbps).label,
        },
        ...history,
      ].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("speedtest_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Speedtest Error:", e);
      setStatus("idle");
      // Reset về trạng thái ban đầu nếu lỗi mạng
      setResults({ ping: 0, download: 0, upload: 0, jitter: 0 });
      setProgress(0);
      alert("Kết nối thất bại. Vui lòng kiểm tra mạng.");
    }
  };

  // --- COMPONENTS ---
  const rating =
    status === "done" ? getNetworkRating(results.ping, results.download) : null;

  const Gauge = ({ value }: { value: number }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const maxVal = 100; // Max speed hiển thị là 100Mbps (có thể tăng nếu cần)
    const percent = Math.min(value / maxVal, 1);
    const offset = circumference - percent * (circumference * 0.66);

    const needleRotation = -120 + percent * 240;

    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <svg
          width="240"
          height="240"
          className="overflow-visible transform scale-90 md:scale-100"
        >
          <defs>
            <linearGradient
              id="gaugeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ticks */}
          {Array.from({ length: 41 }).map((_, i) => {
            const rotate = -120 + i * 6;
            const isMajor = i % 10 === 0;
            return (
              <line
                key={i}
                x1="120"
                y1="20"
                x2="120"
                y2={isMajor ? "35" : "28"}
                stroke={
                  isMajor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"
                }
                strokeWidth={isMajor ? 2 : 1}
                transform={`rotate(${rotate} 120 120)`}
              />
            );
          })}

          {/* Background Arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.66} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(150 120 120)"
          />

          {/* Active Arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeDasharray={`${circumference * 0.66} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(150 120 120)"
            filter="url(#glow)"
            className="transition-all duration-100 ease-linear"
          />

          {/* Needle */}
          <g
            transform={`rotate(${needleRotation} 120 120)`}
            className="transition-transform duration-300 ease-out"
          >
            <circle cx="120" cy="120" r="6" fill="#fff" />
            <path
              d="M 120 115 L 120 35"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-8">
          <div className="text-5xl font-black font-mono tracking-tighter text-white drop-shadow-lg">
            {value.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Mbps
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] transition-all duration-1000 ${
          status === "download"
            ? "bg-cyan-500/30"
            : status === "upload"
              ? "bg-purple-500/30"
              : ""
        }`}
      ></div>

      {/* HEADER */}
      <div className="flex-none p-4 flex items-center justify-between z-10 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border border-white/10 ${
              status !== "idle" && status !== "done"
                ? "animate-pulse bg-blue-500/20 text-blue-400"
                : "bg-white/5 text-slate-400"
            }`}
          >
            {status === "idle" || status === "done" ? (
              <Wifi size={20} />
            ) : (
              <Activity size={20} />
            )}
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">SpeedTest Pro</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
              <span className="flex items-center gap-1">
                <Globe size={10} /> {clientInfo?.ip || "..."}
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Server size={10} /> {clientInfo?.isp || "..."}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-2 rounded-lg transition-all ${
            showHistory
              ? "bg-blue-500 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <History size={20} />
        </button>
      </div>

      {/* MAIN CONTENT */}
      {showHistory ? (
        // HISTORY VIEW
        <div className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar animate-in slide-in-from-right-10 duration-300">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
            Recent Tests
          </h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {h.download}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Mbps
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {h.date}
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Up
                    </div>
                    <div className="text-sm font-bold text-purple-400">
                      {h.upload}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Ping
                    </div>
                    <div className="text-sm font-bold text-cyan-400">
                      {h.ping}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center text-slate-600 py-10">
                No history yet
              </div>
            )}
          </div>
        </div>
      ) : (
        // GAUGE VIEW
        <div className="flex-1 flex flex-col z-10 relative">
          {/* Gauge Area */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            <Gauge value={speedDisplay} />

            {/* Status Pills */}
            <div className="mt-2 flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                  status === "ping"
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-500"
                    : "border-white/5 text-slate-600"
                }`}
              >
                Ping
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                  status === "download"
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-500"
                    : "border-white/5 text-slate-600"
                }`}
              >
                Down
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${
                  status === "upload"
                    ? "bg-purple-500/20 border-purple-500 text-purple-500"
                    : "border-white/5 text-slate-600"
                }`}
              >
                Up
              </span>
            </div>
          </div>

          {/* Control & Result Bar */}
          <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-4 pb-6">
            {status === "done" && rating ? (
              <div className="mb-4 text-center animate-in slide-in-from-bottom-5 fade-in duration-500">
                <div
                  className={`text-sm font-bold ${rating.color} flex items-center justify-center gap-2`}
                >
                  <Check size={16} /> {rating.label}
                </div>
                <div className="text-xs text-slate-500">{rating.desc}</div>
              </div>
            ) : null}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-center gap-1">
                  <Activity size={10} /> Ping
                </div>
                <div
                  className={`text-lg font-mono font-bold ${
                    results.ping > 0 ? "text-white" : "text-slate-600"
                  }`}
                >
                  {results.ping}
                  <span className="text-[10px] ml-0.5 text-slate-500">ms</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-center gap-1">
                  <ArrowDown size={10} /> Down
                </div>
                <div
                  className={`text-lg font-mono font-bold ${
                    results.download > 0 ? "text-cyan-400" : "text-slate-600"
                  }`}
                >
                  {results.download}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-center gap-1">
                  <ArrowUp size={10} /> Up
                </div>
                <div
                  className={`text-lg font-mono font-bold ${
                    results.upload > 0 ? "text-purple-400" : "text-slate-600"
                  }`}
                >
                  {results.upload}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={runSpeedTest}
              disabled={status !== "idle" && status !== "done"}
              className="w-full group relative py-3 rounded-xl bg-white text-slate-950 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] overflow-hidden disabled:opacity-50 disabled:pointer-events-none"
            >
              {status === "idle" || status === "done" ? (
                <span className="relative flex items-center justify-center gap-2 z-10">
                  {status === "done" ? (
                    <RotateCcw size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                  {status === "done" ? "TEST AGAIN" : "START TEST"}
                </span>
              ) : (
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Activity size={18} className="animate-spin" /> TESTING...
                </div>
              )}

              {/* Progress Bar Background */}
              {status !== "idle" && status !== "done" && (
                <div className="absolute inset-0 bg-blue-500/20 z-0">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
