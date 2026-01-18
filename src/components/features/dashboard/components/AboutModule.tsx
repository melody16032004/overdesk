import { useState, useEffect } from "react";
import {
  Code2,
  Box,
  Github,
  Globe,
  Twitter,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  Layers,
  Award,
  Activity,
  Cpu,
  Terminal,
  Sparkles,
  Grid, // Icon cho Tab Module
  Search, // Icon tìm kiếm
  FileText,
  Calendar,
  Clock,
  Power,
  Table,
  PenTool,
  Hourglass,
  Layout,
  GitBranch,
  Settings,
  Info,
  FileSpreadsheet,
  CheckSquare,
  StickyNote,
  TerminalSquare,
  Database,
  DatabaseZap,
  FileJson,
  Braces,
  RadioTower,
  Shield,
  Regex,
  Binary,
  Code,
  Library,
  Container,
  FolderTree,
  Palette,
  Type,
  Sticker,
  PaintBucket,
  BoxIcon,
  Film,
  Smartphone,
  Facebook,
  ImagePlay,
  TestTube,
  ClipboardList,
  Bug,
  Bot,
  Calculator,
  ArrowRightLeft,
  Languages,
  QrCode,
  ALargeSmall,
  ImageIcon,
  CloudSun,
  MapIcon,
  Newspaper,
  Gauge,
  MonitorSmartphone,
  Cast,
  Aperture,
  Camera,
  Mic,
  Wallet,
  WalletCards,
  FlaskConical,
  Target,
  Users,
  Droplets,
  ChefHat,
  Wind,
  Headphones,
  Music,
  Brush,
  BookOpen,
  BookOpenText,
  Book,
  Gamepad2,
  Swords,
  Castle,
  Flower,
  Dice6,
  Dices,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

// --- DATA CONFIG ---
const APP_INFO = {
  name: "OverDesk",
  version: "2.0.0",
  build: "2026.01.18.RC2",
  author: "Trung Hoàng (Melody)",
  role: "Fullstack Engineer",
  slogan: "Your Ultimate Productivity Companion",
  socials: {
    github: "https://github.com",
    web: "https://overdesk.app",
    twitter: "https://twitter.com",
  },
};

// --- DANH SÁCH MODULE & MÔ TẢ (Bạn có thể import từ file config chung) ---
const MODULE_LIBRARY = [
  // --- SYSTEM ---
  { name: "Config", cat: "System", desc: "Manage Apps", icon: Layout },
  { name: "Settings", cat: "System", desc: "Preferences", icon: Settings },
  { name: "About", cat: "System", desc: "App Info", icon: Info },
  { name: "System", cat: "System", desc: "Monitor Info", icon: Activity },
  { name: "Time & Date", cat: "System", desc: "System Clock", icon: Clock },
  { name: "Power", cat: "System", desc: "Shutdown Timer", icon: Power },

  // --- OFFICE ---
  { name: "Word", cat: "Office", desc: "Editor & Docs", icon: FileText },
  { name: "Excel", cat: "Office", desc: "Spreadsheet", icon: FileSpreadsheet },
  { name: "PDF Tools", cat: "Office", desc: "Merge, Split", icon: FileText }, // Dùng tạm FileText hoặc import FileType2
  { name: "Task", cat: "Office", desc: "Daily to-dos", icon: CheckSquare },
  { name: "Note", cat: "Office", desc: "Quick memos", icon: StickyNote },
  {
    name: "Calendar",
    cat: "Office",
    desc: "Events & Schedule",
    icon: Calendar,
  },
  { name: "Markdown", cat: "Office", desc: "Markdown Editor", icon: FileText },
  { name: "Signature", cat: "Office", desc: "Create & Export", icon: PenTool },
  { name: "Table Studio", cat: "Office", desc: "Generator", icon: Table },
  { name: "Focus", cat: "Office", desc: "Pomodoro", icon: Clock },
  { name: "Hourglass", cat: "Office", desc: "Sand Timer", icon: Hourglass },

  // --- DEV ---
  {
    name: "Terminal",
    cat: "Dev",
    desc: "Virtual Machine",
    icon: TerminalSquare,
  },
  { name: "Code", cat: "Dev", desc: "Snippets & Notes", icon: Code2 },
  { name: "Git", cat: "Dev", desc: "Git Tools & Hub", icon: GitBranch },
  { name: "Database", cat: "Dev", desc: "Local SQL DB", icon: Database },
  {
    name: "ER Diagram",
    cat: "Dev",
    desc: "Schema Visualizer",
    icon: DatabaseZap,
  },
  { name: "JSON", cat: "Dev", desc: "Viewer & Editor", icon: FileJson },
  { name: "JSON Tools", cat: "Dev", desc: "Format & Diff", icon: Braces },
  { name: "Postman", cat: "Dev", desc: "API Client", icon: RadioTower },
  { name: "JWT Inspector", cat: "Dev", desc: "Debug Tokens", icon: Shield },
  { name: "Regex", cat: "Dev", desc: "Regex Tester", icon: Regex },
  { name: "Decoder", cat: "Dev", desc: "Morse / Base64", icon: Binary },
  { name: "Snippets", cat: "Dev", desc: "Code Library", icon: Code },
  { name: "Lib Hub", cat: "Dev", desc: "Package Manager", icon: Library },
  { name: "DevOps Tools", cat: "Dev", desc: "Cron & Docker", icon: Container },
  {
    name: "Tree Folder",
    cat: "Dev",
    desc: "Folder Structure",
    icon: FolderTree,
  },

  // --- DESIGN ---
  {
    name: "Dev Design",
    cat: "Design",
    desc: "Color & Contrast",
    icon: Palette,
  },
  { name: "Typography", cat: "Design", desc: "Scale & Fonts", icon: Type },
  { name: "Icon Picker", cat: "Design", desc: "Lucide Library", icon: Sticker },
  {
    name: "UI Factory",
    cat: "Design",
    desc: "Tạo code UI React",
    icon: PaintBucket,
  },
  { name: "3D Engine", cat: "Design", desc: "Unity-like View", icon: BoxIcon },
  { name: "Anim Studio", cat: "Design", desc: "CSS Motion Lib", icon: Film },
  {
    name: "Respon View",
    cat: "Design",
    desc: "Mobile Tester",
    icon: Smartphone,
  },
  {
    name: "Facebook Studio",
    cat: "Design",
    desc: "Mockup & Fonts",
    icon: Facebook,
  },
  {
    name: "Photo Booth",
    cat: "Design",
    desc: "Filters & Stickers",
    icon: ImagePlay,
  },

  // --- TEST ---
  { name: "Tester Studio", cat: "Test", desc: "Test Data Gen", icon: TestTube },
  {
    name: "TestCase",
    cat: "Test",
    desc: "Test Script Manager",
    icon: ClipboardList,
  },
  { name: "Bug Report", cat: "Test", desc: "Generator Tool", icon: Bug },

  // --- UTILITY ---
  { name: "AI Chat", cat: "Utility", desc: "Assistant", icon: Bot },
  { name: "Calc", cat: "Utility", desc: "Math tool", icon: Calculator },
  { name: "Convert", cat: "Utility", desc: "Unit Tools", icon: ArrowRightLeft },
  { name: "Trans", cat: "Utility", desc: "Multi-language", icon: Languages },
  { name: "QR Gen", cat: "Utility", desc: "Make Codes", icon: QrCode },
  {
    name: "Gen Data",
    cat: "Utility",
    desc: "Lorem & Fake Data",
    icon: ALargeSmall,
  },
  {
    name: "Image Tools",
    cat: "Utility",
    desc: "Compress & Convert",
    icon: ImageIcon,
  },
  { name: "Weather", cat: "Utility", desc: "Forecast", icon: CloudSun },
  { name: "Maps", cat: "Utility", desc: "World view", icon: MapIcon },
  { name: "News", cat: "Utility", desc: "VNExpress RSS", icon: Newspaper },
  { name: "Socials", cat: "Utility", desc: "Quick Links", icon: Globe },
  { name: "Speed", cat: "Utility", desc: "Network Test", icon: Gauge },
  {
    name: "Device Hub",
    cat: "Utility",
    desc: "Sync & Transfer",
    icon: MonitorSmartphone,
  },
  { name: "Cast Hub", cat: "Utility", desc: "Screen Mirror", icon: Cast },
  { name: "Share", cat: "Utility", desc: "File Sharing", icon: Cast },
  { name: "Capture", cat: "Utility", desc: "Screenshot Tool", icon: Aperture },
  { name: "Camera", cat: "Utility", desc: "Photo Booth", icon: Camera },
  { name: "Record", cat: "Utility", desc: "Voice Memos", icon: Mic },

  // --- FINANCE ---
  { name: "Budget", cat: "Finance", desc: "Expense Tracker", icon: Wallet },
  {
    name: "Vault",
    cat: "Finance",
    desc: "Passwords & Bank",
    icon: ShieldCheck,
  },
  { name: "Crypto", cat: "Finance", desc: "Encrypt Data", icon: ShieldCheck },
  {
    name: "Portfolio",
    cat: "Finance",
    desc: "Crypto & Stocks",
    icon: WalletCards,
  },
  {
    name: "Simulator",
    cat: "Finance",
    desc: "Loan & Buy vs Rent",
    icon: FlaskConical,
  },
  { name: "Goal Tracker", cat: "Finance", desc: "Set & Achieve", icon: Target },
  {
    name: "Genealogy",
    cat: "Finance",
    desc: "Family Tree Builder",
    icon: Users,
  },
  {
    name: "Body & Hydro",
    cat: "Finance",
    desc: "Tracker & BMI",
    icon: Droplets,
  },
  {
    name: "Kitchen Finder",
    cat: "Finance",
    desc: "Cook & Drink",
    icon: ChefHat,
  },
  { name: "Zen", cat: "Finance", desc: "Focus & Relax", icon: Wind },

  // --- MEDIA ---
  { name: "Music", cat: "Media", desc: "Lofi Player", icon: Headphones },
  { name: "Piano", cat: "Media", desc: "Synthesia Style", icon: Music },
  { name: "Board", cat: "Media", desc: "Sketch & Notes", icon: Brush },
  { name: "Speed Read", cat: "Media", desc: "RSVP Reading", icon: Zap },
  { name: "Manga", cat: "Media", desc: "Reading Manga", icon: BookOpen },
  {
    name: "Writer Studio",
    cat: "Media",
    desc: "Novel Studio",
    icon: BookOpenText,
  },
  { name: "Wiki", cat: "Media", desc: "Knowledge Base", icon: Book },

  // --- GAME ---
  { name: "Game", cat: "Game", desc: "Tetris Neon", icon: Gamepad2 },
  { name: "RPG", cat: "Game", desc: "Eternity Quest", icon: Swords },
  { name: "Defense", cat: "Game", desc: "Tower Defense", icon: Castle },
  { name: "PVZ", cat: "Game", desc: "Plants vs Zombies", icon: Flower },
  { name: "Mystic Space", cat: "Game", desc: "Tarot & Zodiac", icon: Sparkles },
  { name: "Dice Master", cat: "Game", desc: "Roll & Luck", icon: Dice6 },
  { name: "Decision Wheel", cat: "Game", desc: "Spin to Decide", icon: Dices },
];

const TECH_STACK = [
  {
    name: "Tauri v2",
    icon: ShieldCheck,
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    name: "React 18",
    icon: Code2,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    name: "TypeScript",
    icon: Box,
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    name: "Vite",
    icon: Zap,
    color: "text-yellow-500 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    name: "Zustand",
    icon: Layers,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    name: "Tailwind",
    icon: Sparkles,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
  },
];

// --- COMPONENTS ---

// 1. Live Monitor Chart
const LiveMonitor = ({
  label,
  color,
  value,
  displayValue,
}: {
  label: string;
  color: string;
  value: number;
  displayValue: string;
}) => {
  const [bars, setBars] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    setBars((prev) => {
      const newBars = [...prev.slice(1), value];
      return newBars;
    });
  }, [value]);

  return (
    <div className="bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-xl p-3 flex flex-col justify-between h-20 relative overflow-hidden transition-colors duration-300">
      <div className="flex justify-between items-center z-10">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${color}`}>
          {displayValue}
        </span>
      </div>
      <div className="flex items-end justify-between gap-1 h-8 z-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-t-sm transition-all duration-300 ${color.replace("text-", "bg-")}`}
            style={{
              height: `${Math.min(h, 100)}%`,
              opacity: 0.3 + ((i + 1) / 12) * 0.7,
            }}
          ></div>
        ))}
      </div>
      <div
        className={`hidden dark:block absolute -bottom-4 -right-4 w-16 h-16 ${color.replace("text-", "bg-")} blur-[40px] opacity-20`}
      ></div>
    </div>
  );
};

// 2. Info Row Component
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-xs py-1">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
      {value}
    </span>
  </div>
);

// 3. Social Button Component
const SocialButton = ({ icon: Icon, link }: { icon: any; link: string }) => (
  <a
    href={link}
    target="_blank"
    rel="noreferrer"
    className="p-3 rounded-2xl transition-all duration-300 hover:-translate-y-1 bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-md dark:bg-black/30 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 dark:hover:shadow-none"
  >
    <Icon size={18} />
  </a>
);

export const AboutModule = () => {
  const [activeTab, setActiveTab] = useState<
    "general" | "modules" | "tech" | "credits"
  >("general");
  const [realVersion, setRealVersion] = useState(APP_INFO.version);

  // State tìm kiếm module
  const [searchTerm, setSearchTerm] = useState("");

  const [sysStats, setSysStats] = useState({
    cpu: 0,
    mem_used: 0,
    mem_total: 0,
  });
  const [checking, setChecking] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [devModeCount, setDevModeCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tính toán RAM
  const memUsedGB = (sysStats.mem_used / 1024 / 1024 / 1024).toFixed(1);
  const memTotalGB = (sysStats.mem_total / 1024 / 1024 / 1024).toFixed(1);
  const memPercent =
    sysStats.mem_total > 0 ? (sysStats.mem_used / sysStats.mem_total) * 100 : 0;

  useEffect(() => {
    getVersion()
      .then(setRealVersion)
      .catch(() => setRealVersion("Web Mode"));
    const fetchStats = async () => {
      try {
        const stats: any = await invoke("get_system_stats");
        setSysStats(stats);
      } catch (e) {
        setSysStats((prev) => ({ ...prev, cpu: Math.random() * 50 + 10 }));
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    if (isDevMode) return;
    setDevModeCount((prev) => prev + 1);
    if (devModeCount + 1 === 5) setIsDevMode(true);
  };

  const handleCheckUpdate = async () => {
    if (checking) return; // Tránh bấm nhiều lần
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
                // Update phần trăm tải (nếu muốn hiển thị chi tiết hơn)
                setUpdateMsg(
                  `Downloading: ${Math.round((downloaded / total) * 100)}%`,
                );
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

  const copyVersion = () => {
    navigator.clipboard.writeText(`OverDesk v${realVersion}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter Modules
  const filteredModules = MODULE_LIBRARY.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cat.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col font-sans relative overflow-hidden select-none transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse hidden dark:block"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none hidden dark:block"></div>

      {/* HEADER */}
      <div className="flex-none pt-8 pb-4 text-center z-10 relative">
        <div
          onClick={handleLogoClick}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] shadow-xl shadow-blue-500/30 flex items-center justify-center mb-3 transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer group relative"
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
