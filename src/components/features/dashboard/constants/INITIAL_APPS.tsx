import {
  CheckSquare,
  StickyNote,
  Clock,
  Calculator,
  Settings,
  Bot,
  Languages,
  Map as MapIcon,
  CloudSun,
  Globe,
  QrCode,
  ShieldCheck,
  Binary,
  Newspaper,
  Camera,
  PenTool,
  Aperture,
  Cast,
  Mic,
  ArrowRightLeft,
  Activity,
  Gauge,
  Power,
  Code2,
  FileText,
  GitBranch,
  Wallet,
  FileJson,
  RadioTower,
  Regex,
  ALargeSmall,
  Calendar,
  Database,
  CodeIcon,
  Braces,
  ShieldIcon,
  Palette,
  Type,
  Sticker,
  DatabaseZap,
  Container,
  FolderTree,
  Users,
  WalletCards,
  FlaskConical,
  Wind,
  Droplets,
  Zap,
  FileSpreadsheetIcon,
  Brush,
  ImageIcon,
  Dices,
  ChefHat,
  Sparkles,
  Facebook,
  Dice6,
  Target,
  Table,
  Layout,
  ClipboardList,
  TestTube,
  Bug,
  Smartphone,
  Library,
  Music,
  Headphones,
  TerminalSquare,
  Book,
  Gamepad2,
  Swords,
  Castle,
  Flower,
  BookOpen,
  BookOpenText,
  PaintBucket,
  BoxIcon,
  Film,
  ClockFading,
  ImagePlay,
  MonitorSmartphone,
  Hourglass,
  FileSpreadsheet,
  Info,
  Scale,
} from "lucide-react";
import { DashboardApp } from "../../../../types/dashboard";

export const INITIAL_APPS: DashboardApp[] = [
  // --- GROUP 1: SYSTEM & SETTINGS (Màu Slate - Xám) ---
  {
    id: "config",
    label: "Config",
    icon: Layout,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "Manage Apps",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "Preferences",
  },
  {
    id: "about",
    label: "About",
    icon: Info,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "App Info",
  },
  {
    id: "license",
    label: "License",
    icon: Scale,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "Terms & Legal",
  },
  {
    id: "system",
    label: "System",
    icon: Activity,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "Monitor Info",
  },
  {
    id: "clock",
    label: "Time & Date",
    icon: ClockFading,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "System Clock",
  },
  {
    id: "shutdown",
    label: "Power",
    icon: Power,
    color:
      "text-slate-500 bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    desc: "Shutdown Timer",
  },

  // --- GROUP 2: OFFICE & PRODUCTIVITY (Màu Blue - Xanh dương) ---
  {
    id: "word",
    label: "Word",
    icon: FileText,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Editor & Docs",
  },
  {
    id: "excel",
    label: "Excel",
    icon: FileSpreadsheet,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Spreadsheet",
  },
  {
    id: "pdf",
    label: "PDF Tools",
    icon: FileSpreadsheetIcon,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Merge, Split",
  },
  {
    id: "tasks",
    label: "Task",
    icon: CheckSquare,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Daily to-dos",
  },
  {
    id: "notes",
    label: "Note",
    icon: StickyNote,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Quick memos",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Events & Schedule",
  },
  {
    id: "markdown",
    label: "Markdown",
    icon: FileText,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Markdown Editor",
  },
  {
    id: "sign",
    label: "Signature",
    icon: PenTool,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Create & Export",
  },
  {
    id: "table",
    label: "Table Studio",
    icon: Table,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Generator",
  },
  {
    id: "timer",
    label: "Focus",
    icon: Clock,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Pomodoro",
  },
  {
    id: "hourglass",
    label: "Hourglass",
    icon: Hourglass,
    color:
      "text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    desc: "Sand Timer",
  },

  // --- GROUP 3: DEVELOPMENT & CODING (Màu Indigo - Tím xanh) ---
  {
    id: "terminal",
    label: "Terminal",
    icon: TerminalSquare,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Virtual Machine",
  },
  {
    id: "code",
    label: "Code",
    icon: Code2,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Snippets & Notes",
  },
  {
    id: "git",
    label: "Git",
    icon: GitBranch,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Git Tools & Hub",
  },
  {
    id: "database",
    label: "Database",
    icon: Database,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Local SQL DB",
  },
  {
    id: "erd",
    label: "ER Diagram",
    icon: DatabaseZap,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Schema Visualizer",
  },
  {
    id: "json",
    label: "JSON",
    icon: FileJson,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Viewer & Editor",
  },
  {
    id: "json_tools",
    label: "JSON Tools",
    icon: Braces,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Format & Diff",
  },
  {
    id: "request",
    label: "Postman",
    icon: RadioTower,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "API Client",
  },
  {
    id: "jwt",
    label: "JWT Inspector",
    icon: ShieldIcon,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Debug Tokens",
  },
  {
    id: "regex",
    label: "Regex",
    icon: Regex,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Regex Tester",
  },
  {
    id: "decode",
    label: "Decoder",
    icon: Binary,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Morse / Base64",
  },
  {
    id: "snippets",
    label: "Snippets",
    icon: CodeIcon,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Code Library",
  },
  {
    id: "library",
    label: "Lib Hub",
    icon: Library,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Package Manager",
  },
  {
    id: "devops",
    label: "DevOps Tools",
    icon: Container,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Cron & Docker",
  },
  {
    id: "tree",
    label: "Tree Folder",
    icon: FolderTree,
    color:
      "text-indigo-500 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
    desc: "Folder Structure",
  },

  // --- GROUP 4: DESIGN & UI (Màu Pink - Hồng) ---
  {
    id: "design",
    label: "Dev Design",
    icon: Palette,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Color & Contrast",
  },
  {
    id: "typography",
    label: "Typography",
    icon: Type,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Scale & Fonts",
  },
  {
    id: "icons",
    label: "Icon Picker",
    icon: Sticker,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Lucide Library",
  },
  {
    id: "uibuilder",
    label: "UI Factory",
    icon: PaintBucket,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Tạo code UI React",
  },
  {
    id: "space3d",
    label: "3D Engine",
    icon: BoxIcon,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Unity-like View",
  },
  {
    id: "anim",
    label: "Anim Studio",
    icon: Film,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "CSS Motion Lib",
  },
  {
    id: "responsive",
    label: "Respon View",
    icon: Smartphone,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Mobile Tester",
  },
  {
    id: "fb-tools",
    label: "Facebook Studio",
    icon: Facebook,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Mockup & Fonts",
  },
  {
    id: "photo-booth",
    label: "Photo Booth",
    icon: ImagePlay,
    color:
      "text-pink-500 bg-pink-500/10 border-pink-200 dark:border-pink-500/20",
    desc: "Filters & Stickers",
  },

  // --- GROUP 5: TESTING & QA (Màu Orange - Cam) ---
  {
    id: "tester",
    label: "Tester Studio",
    icon: TestTube,
    color:
      "text-orange-500 bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    desc: "Test Data Gen",
  },
  {
    id: "testcase",
    label: "TestCase",
    icon: ClipboardList,
    color:
      "text-orange-500 bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    desc: "Test Script Manager",
  },
  {
    id: "bug-report",
    label: "Bug Report",
    icon: Bug,
    color:
      "text-orange-500 bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    desc: "Generator Tool",
  },

  // --- GROUP 6: UTILITIES & CONNECTIVITY (Màu Cyan - Xanh lơ) ---
  {
    id: "ai",
    label: "AI Chat",
    icon: Bot,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Assistant",
    disabled: false,
  },
  {
    id: "calc",
    label: "Calc",
    icon: Calculator,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Math tool",
  },
  {
    id: "converter",
    label: "Convert",
    icon: ArrowRightLeft,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Unit Tools",
  },
  {
    id: "translate",
    label: "Trans",
    icon: Languages,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Multi-language",
  },
  {
    id: "qrcode",
    label: "QR Gen",
    icon: QrCode,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Make Codes",
  },
  {
    id: "gen",
    label: "Gen Data",
    icon: ALargeSmall,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Lorem & Fake Data",
  },
  {
    id: "img-compress",
    label: "Image Tools",
    icon: ImageIcon,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Compress & Convert",
  },
  {
    id: "weather",
    label: "Weather",
    icon: CloudSun,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Forecast",
  },
  {
    id: "map",
    label: "Maps",
    icon: MapIcon,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "World view",
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "VNExpress RSS",
  },
  {
    id: "socials",
    label: "Socials",
    icon: Globe,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Quick Links",
  },
  {
    id: "speedtest",
    label: "Speed",
    icon: Gauge,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Network Test",
  },
  {
    id: "phone",
    label: "Device Hub",
    icon: MonitorSmartphone,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Sync & Transfer",
  },
  {
    id: "mirror",
    label: "Cast Hub",
    icon: Cast,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Screen Mirror",
  },
  {
    id: "share",
    label: "Share",
    icon: Cast,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Screen Mirror",
  },
  {
    id: "capture",
    label: "Capture",
    icon: Aperture,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Screenshot Tool",
  },
  {
    id: "camera",
    label: "Camera",
    icon: Camera,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Photo Booth",
  },
  {
    id: "record",
    label: "Record",
    icon: Mic,
    color:
      "text-cyan-500 bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    desc: "Voice Memos",
  },

  // --- GROUP 7: FINANCE & LIFESTYLE (Màu Emerald - Xanh ngọc) ---
  {
    id: "budget",
    label: "Budget",
    icon: Wallet,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Expense Tracker",
  },
  {
    id: "vault",
    label: "Vault",
    icon: ShieldCheck,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Passwords & Bank",
  },
  {
    id: "crypto",
    label: "Crypto",
    icon: ShieldCheck,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Encrypt Data",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: WalletCards,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Crypto & Stocks",
  },
  {
    id: "loan",
    label: "Simulator",
    icon: FlaskConical,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Loan & Buy vs Rent",
  },
  {
    id: "goals",
    label: "Goal Tracker",
    icon: Target,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Set & Achieve",
  },
  {
    id: "family",
    label: "Genealogy",
    icon: Users,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Family Tree Builder",
  },
  {
    id: "health",
    label: "Body & Hydro",
    icon: Droplets,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Tracker & BMI",
  },
  {
    id: "recipe",
    label: "Kitchen Finder",
    icon: ChefHat,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Cook & Drink",
  },
  {
    id: "breathe",
    label: "Zen",
    icon: Wind,
    color:
      "text-emerald-500 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    desc: "Focus & Relax",
  },

  // --- GROUP 8: MEDIA & READING (Màu Violet - Tím) ---
  {
    id: "music",
    label: "Music",
    icon: Headphones,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "Lofi Player",
  },
  {
    id: "piano",
    label: "Piano",
    icon: Music,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "Synthesia Style",
  },
  {
    id: "whiteboard",
    label: "Board",
    icon: Brush,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "Sketch & Notes",
  },
  {
    id: "reader",
    label: "Speed Read",
    icon: Zap,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "RSVP Reading",
  },
  {
    id: "manga",
    label: "Manga",
    icon: BookOpen,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "Reading Manga",
  },
  {
    id: "novel",
    label: "Writer Studio",
    icon: BookOpenText,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "Novel Studio",
  },
  {
    id: "wiki",
    label: "Wiki",
    icon: Book,
    color:
      "text-violet-500 bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    desc: "Knowledge Base",
  },

  // --- GROUP 9: GAMES & FUN (Màu Red/Rose - Đỏ/Hồng đậm) ---
  {
    id: "game",
    label: "Game",
    icon: Gamepad2,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Tetris Neon",
  },
  {
    id: "rpg",
    label: "RPG",
    icon: Swords,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Eternity Quest",
  },
  {
    id: "def",
    label: "Defense",
    icon: Castle,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Tower Defense",
  },
  {
    id: "pvz",
    label: "PVZ",
    icon: Flower,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Tower Defense",
  },
  {
    id: "mystic",
    label: "Mystic Space",
    icon: Sparkles,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Tarot & Zodiac",
  },
  {
    id: "dice",
    label: "Dice Master",
    icon: Dice6,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Roll & Luck",
  },
  {
    id: "wheel",
    label: "Decision Wheel",
    icon: Dices,
    color:
      "text-rose-500 bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    desc: "Spin to Decide",
  },
];
