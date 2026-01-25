import { useState, useEffect } from "react";
import {
  Box,
  Github,
  Globe,
  Twitter,
  Copy,
  Check,
  RefreshCw,
  Award,
  Activity,
  Cpu,
  Terminal,
  Grid,
  Search,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { LiveMonitor } from "./components/LiveMonitor";
import { InfoRow } from "./components/InfoRow";
import { SocialButton } from "./components/SocialButton";
import { APP_INFO, MODULE_LIBRARY, TECH_STACK } from "./constants/about_const";

export const AboutModule = () => {
  // --- 1. UI & NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<
    "general" | "modules" | "tech" | "credits"
  >("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // --- 2. SYSTEM DATA STATE ---
  const [realVersion, setRealVersion] = useState(APP_INFO.version);
  const [sysStats, setSysStats] = useState({
    cpu: 0,
    mem_used: 0,
    mem_total: 0,
  });

  // --- 3. UPDATER STATE ---
  const [checking, setChecking] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // --- 4. DEV MODE STATE ---
  const [devModeCount, setDevModeCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);

  // --- 5. COMPUTED VALUES (Derived State) ---
  const memUsedGB = (sysStats.mem_used / 1024 / 1024 / 1024).toFixed(1);
  const memTotalGB = (sysStats.mem_total / 1024 / 1024 / 1024).toFixed(1);
  const memPercent =
    sysStats.mem_total > 0 ? (sysStats.mem_used / sysStats.mem_total) * 100 : 0;

  const filteredModules = MODULE_LIBRARY.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cat.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- 6. EFFECTS ---

  // Effect 1: Get App Version (Run once)
  useEffect(() => {
    getVersion()
      .then(setRealVersion)
      .catch(() => setRealVersion("Web Mode"));
  }, []);

  // Effect 2: Monitor System Stats (Interval)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats: any = await invoke("get_system_stats");
        setSysStats(stats);
      } catch (e) {
        // Fallback fake data for web/dev environment without Rust backend
        setSysStats((prev) => ({ ...prev, cpu: Math.random() * 50 + 10 }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 7. HANDLERS (ACTIONS) ---

  const handleLogoClick = () => {
    if (isDevMode) return;
    setDevModeCount((prev) => prev + 1);
    if (devModeCount + 1 === 5) setIsDevMode(true);
  };

  const copyVersion = () => {
    navigator.clipboard.writeText(`OverDesk v${realVersion}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckUpdate = async () => {
    if (checking) return;

    setChecking(true);
    setUpdateMsg("Checking for updates...");

    try {
      const update = await check();

      if (update) {
        setUpdateMsg(`Found v${update.version}! Downloading...`);
        let downloaded = 0;
        let total = 0;

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              total = event.data.contentLength || 0;
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              if (total > 0) {
                const percent = Math.round((downloaded / total) * 100);
                setUpdateMsg(`Downloading: ${percent}%`);
              }
              break;
            case "Finished":
              setUpdateMsg("Installing...");
              break;
          }
        });

        setUpdateMsg("Done! Restarting...");
        await relaunch();
      } else {
        setUpdateMsg("You're on the latest build.");
        setTimeout(() => setUpdateMsg(""), 3000);
      }
    } catch (error) {
      console.error(error);
      setUpdateMsg("Update failed. See console.");
      setTimeout(() => setUpdateMsg(""), 3000);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-sans relative overflow-hidden select-none transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse hidden dark:block"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none hidden dark:block"></div>

      {/* HEADER */}
      <div className="flex-none pt-8 pb-4 text-center z-10 relative">
        <div
          onClick={handleLogoClick}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] shadow-xl shadow-blue-500/30 flex items-center justify-center mb-3 transform hover:scale-105 active:scale-95 transition-all duration-300 pointer group relative"
        >
          <Box
            size={40}
            className="text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-500"
          />
          {isDevMode && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-yellow-200 animate-bounce">
              DEV
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-1 text-slate-900 dark:text-white transition-colors">
          {APP_INFO.name}
        </h1>
        <p className="text-xs font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500 transition-colors">
          {APP_INFO.slogan}
        </p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex justify-center gap-1.5 px-4 mb-4 z-10 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "general", label: "Overview", icon: Activity },
          { id: "modules", label: "Modules", icon: Grid }, // NEW TAB
          { id: "tech", label: "Stack", icon: Cpu },
          { id: "credits", label: "Team", icon: Award },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 whitespace-nowrap
                ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-950 dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                }
              `}
            >
              <tab.icon
                size={12}
                className={isActive ? "text-blue-400 dark:text-blue-600" : ""}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8 relative z-10">
        {/* --- TAB: GENERAL --- */}
        {activeTab === "general" && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Version Card */}
            <div className="p-4 rounded-2xl border flex items-center justify-between bg-white border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/5 dark:shadow-none transition-colors">
              <div>
                <p className="text-[10px] uppercase font-bold mb-1 text-slate-400 dark:text-slate-500">
                  Current Build
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-black text-slate-800 dark:text-white transition-colors">
                    v{realVersion}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    PRO
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyVersion}
                  className="p-2.5 rounded-xl transition-all bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {copied ? (
                    <Check size={16} className="text-emerald-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={handleCheckUpdate}
                  disabled={checking} // Disable khi đang chạy
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all 
                    ${
                      checking
                        ? "bg-slate-500/20 text-slate-400 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95"
                    }
                  `}
                >
                  <RefreshCw
                    size={16}
                    className={checking ? "animate-spin" : ""}
                  />{" "}
                  {/* Hiển thị text theo trạng thái */}
                  {checking ? "Processing..." : "Check Update"}
                </button>
              </div>
            </div>
            {updateMsg && (
              <div className="text-center text-xs font-medium text-emerald-500 animate-in fade-in">
                {updateMsg}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <LiveMonitor
                label="CPU Usage"
                color="text-cyan-600 dark:text-cyan-400"
                value={sysStats.cpu}
                displayValue={`${sysStats.cpu.toFixed(1)}%`}
              />
              <LiveMonitor
                label="Memory"
                color="text-purple-600 dark:text-purple-400"
                value={memPercent}
                displayValue={`${memUsedGB}/${memTotalGB} GB`}
              />
            </div>

            {/* System Spec */}
            <div className="p-4 rounded-2xl border bg-white border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/5 dark:shadow-none transition-colors">
              <h3 className="text-xs font-bold mb-3 uppercase flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Terminal size={14} /> System Spec
              </h3>
              <div className="space-y-2">
                <InfoRow label="Engine" value="WebView2 / Blink" />
                <InfoRow label="Architecture" value="x64 / ARM64" />
                <InfoRow
                  label="Environment"
                  value={
                    (window as any).__TAURI__ ? "Tauri Runtime" : "Web Sandbox"
                  }
                />
                <InfoRow label="License" value="Commercial / Pro" />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MODULES (NEW) --- */}
        {activeTab === "modules" && (
          <div className="space-y-3 animate-in slide-in-from-right-4 fade-in duration-500">
            {/* Search Bar */}
            <div className="relative group">
              <Search
                size={16}
                className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search 85+ modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="grid gap-2">
              {filteredModules.length > 0 ? (
                filteredModules.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/5 dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
                          {item.cat}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No modules found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: TECH STACK --- */}
        {activeTab === "tech" && (
          <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 fade-in duration-500">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="p-3 rounded-2xl border transition-all hover:scale-[1.02] cursor-default group bg-white border-slate-200 shadow-sm hover:shadow-md dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:shadow-none"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tech.bg}`}
                >
                  <tech.icon size={20} className={tech.color} />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200 transition-colors">
                  {tech.name}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  Core Module
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB: CREDITS --- */}
        {activeTab === "credits" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
            <div className="p-6 rounded-3xl border text-center relative overflow-hidden bg-white border-slate-200 shadow-lg dark:bg-white/5 dark:border-white/5 dark:shadow-none transition-colors">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-full h-full bg-slate-800 rounded-full border-4 border-blue-500 shadow-xl overflow-hidden flex items-center justify-center">
                  <span className="text-3xl font-black text-white">H</span>
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#1e293b]"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">
                {APP_INFO.author}
              </h3>
              <p className="text-xs text-blue-500 font-bold mb-6 uppercase tracking-wide">
                {APP_INFO.role}
              </p>
              <div className="flex justify-center gap-3">
                <SocialButton icon={Github} link={APP_INFO.socials.github} />
                <SocialButton icon={Globe} link={APP_INFO.socials.web} />
                <SocialButton icon={Twitter} link={APP_INFO.socials.twitter} />
              </div>
            </div>
            <div className="text-center opacity-60">
              <p className="text-[10px] text-slate-600 dark:text-slate-300">
                Made with ❤️ & ☕ in Vietnam.
                <br />© 2024 OverDesk Inc.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
