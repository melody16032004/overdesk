import { useState, useEffect } from "react";
import {
  Cpu,
  Wifi,
  Battery,
  BatteryCharging,
  Monitor,
  Activity,
  Globe,
  Smartphone,
  Laptop,
  WifiOff,
  Server,
  Signal,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import {
  getSignalStrength,
  getSystemDetails,
} from "./helpers/system_info_helper";

export const SystemInfoModule = () => {
  // --- A. STATIC SYSTEM INFO (Thông tin tĩnh) ---
  const { os, browser } = getSystemDetails();

  const [hardware] = useState<any>({
    cores: navigator.hardwareConcurrency || 4,
    memory: (navigator as any).deviceMemory || 8,
    platform: (navigator as any).userAgentData?.platform || navigator.platform,
  });

  const [screen] = useState({
    width: window.screen.width,
    height: window.screen.height,
    pixelRatio: window.devicePixelRatio,
  });

  // --- B. DYNAMIC STATE (Thông tin động) ---
  const [battery, setBattery] = useState<any>(null);
  const [network, setNetwork] = useState<any>(null);

  // IP & Privacy State
  const [showSensitive, setShowSensitive] = useState(false);
  const [loadingIp, setLoadingIp] = useState(false);
  const [ipInfo, setIpInfo] = useState<{
    ip: string;
    isp: string;
    city: string;
  } | null>(null);

  // --- C. HANDLERS (Logic xử lý) ---
  const fetchIp = async () => {
    setLoadingIp(true);
    setIpInfo(null);
    try {
      // Ưu tiên 1: ipapi.co
      let response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("ipapi failed");
      let data = await response.json();

      setIpInfo({ ip: data.ip, isp: data.org, city: data.city });
    } catch (e) {
      console.warn("API 1 failed, trying fallback...", e);
      try {
        // Fallback: ipwho.is
        let response = await fetch("https://ipwho.is/");
        let data = await response.json();
        if (!data.success) throw new Error("ipwho failed");

        setIpInfo({
          ip: data.ip,
          isp: data.connection?.isp || data.isp || "Unknown ISP",
          city: data.city || "Unknown City",
        });
      } catch (err) {
        console.error("All APIs failed");
        setIpInfo({
          ip: "Unavailable",
          isp: "Unknown Network",
          city: "Unknown Location",
        });
      }
    } finally {
      setLoadingIp(false);
    }
  };

  // --- D. EFFECTS (Lifecycle & Listeners) ---

  // 1. Initial IP Fetch
  useEffect(() => {
    if (navigator.onLine) fetchIp();
  }, []);

  // 2. Battery Monitoring
  useEffect(() => {
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((bat: any) => {
        const updateBattery = () => {
          setBattery({
            level: bat.level * 100,
            charging: bat.charging,
            chargingTime: bat.chargingTime,
            dischargingTime: bat.dischargingTime,
          });
        };
        updateBattery();
        bat.addEventListener("levelchange", updateBattery);
        bat.addEventListener("chargingchange", updateBattery);
      });
    }
  }, []);

  // 3. Network Monitoring
  useEffect(() => {
    const updateNetwork = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        setNetwork({
          online: navigator.onLine,
          downlink: conn.downlink,
          rtt: conn.rtt,
          type: conn.effectiveType,
        });
      } else {
        setNetwork({ online: navigator.onLine });
      }
    };

    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener("change", updateNetwork);
    }

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  // --- E. COMPUTED VALUES ---
  const signalBars = network ? getSignalStrength(network.rtt) : 0;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 font-sans relative overflow-hidden text-slate-800 dark:text-slate-100 p-4">
      {/* HEADER */}
      <div className="flex-none mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity size={20} className="text-blue-500" /> System Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time metrics
          </p>
        </div>

        <div className="flex gap-2">
          {/* Nút Refresh IP */}
          <button
            onClick={fetchIp}
            disabled={loadingIp}
            className={`p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-slate-500 dark:text-slate-300 ${
              loadingIp ? "animate-spin cursor-not-allowed opacity-50" : ""
            }`}
            title="Refresh Network Info"
          >
            <RefreshCw size={16} />
          </button>

          {/* Nút Toggle Ẩn/Hiện thông tin nhạy cảm */}
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSensitive
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
            }`}
            title={
              showSensitive ? "Hide sensitive info" : "Show sensitive info"
            }
          >
            {showSensitive ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
        {/* --- NETWORK CARD --- */}
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 md:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  network?.online
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {network?.online ? <Wifi size={24} /> : <WifiOff size={24} />}
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-2">
                  {/* Tên nhà mạng (ISP) */}
                  {loadingIp ? (
                    <span className="text-slate-400 italic">Updating...</span>
                  ) : showSensitive ? (
                    ipInfo?.isp || "Detecting ISP..."
                  ) : (
                    "Active Connection"
                  )}

                  {/* Signal Bars */}
                  {network?.online && (
                    <div className="flex gap-0.5 items-end h-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-sm ${
                            i <= signalBars
                              ? "bg-green-500"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          style={{ height: `${i * 25}%` }}
                        ></div>
                      ))}
                    </div>
                  )}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  {network?.type?.toUpperCase() || "UNKNOWN"} NETWORK
                </p>
              </div>
            </div>

            {/* IP Badge */}
            <div className="text-right">
              <div
                className={`flex items-center justify-end gap-1.5 text-xs mb-0.5 ${
                  showSensitive ? "text-slate-500" : "text-green-600"
                }`}
              >
                {showSensitive ? (
                  <>
                    <Globe size={12} /> Public IP
                  </>
                ) : (
                  <>
                    <ShieldCheck size={12} /> Protected
                  </>
                )}
              </div>

              {/* HIỂN THỊ IP */}
              <div
                className={`text-xs font-mono font-bold tracking-tight text-slate-700 dark:text-slate-200 cursor-default select-none transition-all duration-300 ${
                  !showSensitive && !loadingIp
                    ? "blur-[3px] hover:blur-[1px]"
                    : ""
                }`}
              >
                {loadingIp ? "Loading..." : ipInfo ? ipInfo.ip : "192.168.x.x"}
              </div>

              <div className="text-[10px] text-slate-400">
                {loadingIp
                  ? "..."
                  : showSensitive
                    ? ipInfo?.city || "Unknown City"
                    : "Localhost"}
              </div>
            </div>
          </div>

          {/* Network Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                Down Speed
              </div>
              <div className="text-lg font-mono font-bold text-blue-500">
                {network?.downlink || "--"}{" "}
                <span className="text-xs text-slate-500">Mbps</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                Latency
              </div>
              <div
                className={`text-lg font-mono font-bold ${
                  network?.rtt < 100 ? "text-green-500" : "text-orange-500"
                }`}
              >
                {network?.rtt || "--"}{" "}
                <span className="text-xs text-slate-500">ms</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                Status
              </div>
              <div
                className={`text-lg font-bold ${
                  network?.online ? "text-green-500" : "text-red-500"
                }`}
              >
                {network?.online ? "Online" : "Offline"}
              </div>
            </div>
          </div>
        </div>

        {/* 2. DEVICE INFO (Giữ nguyên) */}
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              {os === "Android" || os === "iOS" ? (
                <Smartphone size={20} />
              ) : (
                <Laptop size={20} />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Device
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold">{os}</h3>
            <p className="text-xs text-slate-500">{browser} Browser</p>
            <div className="mt-2 text-xs bg-slate-100 dark:bg-white/5 p-1.5 rounded-md font-mono truncate border border-slate-200 dark:border-white/5">
              {hardware.platform}
            </div>
          </div>
        </div>

        {/* 3. BATTERY CARD (Giữ nguyên) */}
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  battery?.charging
                    ? "bg-green-500/10 text-green-500"
                    : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {battery?.charging ? (
                  <BatteryCharging size={20} />
                ) : (
                  <Battery size={20} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">Battery</h3>
                <p className="text-[10px] text-slate-500">
                  {battery?.charging ? "Charging" : "On Battery"}
                </p>
              </div>
            </div>
            <div className="text-xl font-mono font-bold">
              {battery ? Math.round(battery.level) : "--"}%
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${
                battery?.charging
                  ? "bg-green-500"
                  : battery?.level < 20
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }`}
              style={{ width: `${battery ? battery.level : 0}%` }}
            ></div>
          </div>
        </div>

        {/* 4. HARDWARE SPECS (Giữ nguyên) */}
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-white/5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Server size={16} className="text-slate-400" />
            <span className="text-xs font-bold uppercase text-slate-500">
              Hardware Specs
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <Cpu size={14} /> CPU Threads
              </span>
              <span className="font-mono font-bold">{hardware.cores}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <Activity size={14} /> Memory (RAM)
              </span>
              <span className="font-mono font-bold">~{hardware.memory} GB</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <Monitor size={14} /> Resolution
              </span>
              <span className="font-mono font-bold">
                {screen.width}x{screen.height}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <Signal size={14} /> Pixel Ratio
              </span>
              <span className="font-mono font-bold">{screen.pixelRatio}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
