// src/features/dashboard/Dashboard.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  CheckSquare,
  StickyNote,
  Clock,
  ChevronLeft,
  Calculator,
  Settings,
  Bot,
  Grid,
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
  Search,
  X,
  Layout,
  ClipboardList,
  TestTube,
  EyeOff,
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
  ArrowUp,
  Info,
  Scale,
  RefreshCw,
  AlertCircle,
  Download,
  CheckCircle,
} from "lucide-react";

import { TaskModule } from "./components/TaskModule";
import { NoteModule } from "./components/NoteModule";
import { TimerModule } from "./components/TimerModule";
import { SettingsModule } from "./components/SettingsModule";
import { TranslateModule } from "./components/TranslateModule";
import { useAppStore } from "../../../stores/useAppStore";
import { CalcModule } from "./components/CalcModule";
import { MapModule } from "./components/MapModule";
import { WeatherModule } from "./components/WeatherModule";
import { SocialModule } from "./components/SocialModule";
import { QrCodeModule } from "./components/QrCodeModule";
import { CryptoModule } from "./components/CryptoModule";
import { DecodeModule } from "./components/DecodeModule";
import { NewsModule } from "./components/NewsModule";
import { CameraModule } from "./components/CameraModule";
import { VaultModule } from "./components/VaultModule";
import { WhiteboardModule } from "./components/WhiteboardModule";
import { ScreenCaptureModule } from "./components/ScreenCaptureModule";
import { ScreenShareModule } from "./components/ScreenShareModule";
import { MusicModule } from "./components/MusicModule";
import { useMusicStore } from "../../../stores/useMusicStore";
import { MiniPlayer } from "./components/MiniPlayer";
import { RecordModule } from "./components/RecordModule";
import { ConverterModule } from "./components/ConverterModule";
import { SystemInfoModule } from "./components/SystemInfoModule";
import { SpeedTestModule } from "./components/SpeedTestModule";
import { ShutdownModule } from "./components/ShutdownModule";
import { CodeModule } from "./components/CodeModule";
import { MarkdownModule } from "./components/MarkdownModule";
import { GitModule } from "./components/GitModule";
import { BudgetModule } from "./components/BudgetModule";
import { JsonModule } from "./components/JsonModule";
import { RequestModule } from "./components/RequestModule";
import { RegexModule } from "./components/RegexModule";
import { GenDataModule } from "./components/GenDataModule";
import { CalendarModule } from "./components/CalendarModule";
import { DatabaseModule } from "./components/DatabaseModule";
import { SnippetModule } from "./components/SnippetModule";
import { JsonToolsModule } from "./components/JsonToolsModule";
import { JwtModule } from "./components/JwtModule";
import { DesignModule } from "./components/DesignModule";
import { TypographyModule } from "./components/TypographyModule";
import { IconPickerModule } from "./components/IconPickerModule";
import { ERDiagramModule } from "./components/ERDiagramModule";
import { CronDockerModule } from "./components/CronDockerModule";
import { FileExplorerModule } from "./components/FileExplorerModule";
import { FamilyTreeModule } from "./components/FamilyTreeModule";
import { PortfolioModule } from "./components/PortfolioModule";
import { LoanModule } from "./components/LoanModule";
import { BreathingModule } from "./components/BreathingModule";
import { WaterBodyModule } from "./components/WaterBodyModule";
import { SpeedReaderModule } from "./components/SpeedReaderModule";
import { PdfModule } from "./components/PdfModule";
import { SignatureModule } from "./components/SignatureModule";
import { ImageCompressorModule } from "./components/ImageCompressorModule";
import { DecisionWheelModule } from "./components/DecisionWheelModule";
import { RecipeFinderModule } from "./components/RecipeFinderModule";
import { MysticModule } from "./components/MysticModule";
import { FacebookToolsModule } from "./components/FacebookToolsModule";
import { DiceRollerModule } from "./components/DiceRollerModule";
import { GoalTrackerModule } from "./components/GoalTrackerModule";
import { TableCreatorModule } from "./components/TableCreatorModule";
import { ConfigModule } from "./components/ConfigModule";
import { AIChatModule } from "./components/AIChatModule";
import { TesterModule } from "./components/TesterModule";
import { TestScriptModule } from "./components/TestScriptModule";
import { BugReportModule } from "./components/BugReportModule";
import { ResponsiveViewerModule } from "./components/ResponsiveViewerModule";
import { LibraryModule } from "./components/LibraryModule";
import { PianoModule } from "./components/PianoModule";
import { TerminalModule } from "./components/TerminalModule";
import { WikiModule } from "./components/WikiModule";
import { GameModule } from "./components/GameModule";
import { RPGModule } from "./components/RPGModule";
import { TowerDefenseModule } from "./components/TowerDefenseModule";
import { PvzGameModule } from "./components/PvzGameModule";
import { MangaModule } from "./components/MangaModule";
import { NovelEditorModule } from "./components/NovelEditorModule";
import { UIBuilderModule } from "./components/UIBuilderModule";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useToastStore } from "../../../stores/useToastStore";
import { Space3DModule } from "./components/Space3DModule";
import { FrameAnimationUltimate } from "./components/AnimationsModule";
import { ClockModule } from "./components/ClockModule";
import { PhotoBoothModule } from "./components/PhotoBoothModule";
import { PhoneModule } from "./components/PhoneModule";
import { ScreenMirrorModule } from "./components/ScreenMirrorModule";
import { HourglassModule } from "./components/HourglassModule";
import { ExcelModule } from "./components/ExcelModule";
import { WordModule } from "./components/WordModule";
import { AboutModule } from "./components/AboutModule";
import { LicenseModule } from "./components/LicenseModule";

interface DashboardApp {
  id: string;
  label: any;
  icon?: any;
  color?: any;
  desc?: string;
  disabled?: boolean;
}

// 1. DATA GỐC
const INITIAL_APPS: DashboardApp[] = [
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

// --- SUB-COMPONENTS ---
const UserWidget = () => {
  const { userName, setUserName } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(userName);
  }, [userName]);
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempName.trim()) setUserName(tempName.trim());
    else setTempName(userName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTempName(userName);
      setIsEditing(false);
    }
  };

  const firstLetter = (userName || "U").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2 shrink-0 z-20">
      <div className="text-right leading-tight">
        <div className="text-[9.5px] text-slate-300 font-medium select-none">
          Welcome back,
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-20 text-right text-sm font-bold bg-transparent border-b-2 border-indigo-500 outline-none text-slate-800 dark:text-white p-0"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-indigo-300 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors truncate max-w-[100px] cursor-pointer"
          >
            {userName}
          </button>
        )}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-lg select-none ring-2 ring-white dark:ring-white/10 hover:scale-105 active:scale-95 transition-transform cursor-pointer relative z-50"
      >
        {firstLetter}
      </button>
      {isEditing && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={handleSave}
        />
      )}
    </div>
  );
};

const AppHeader = ({ app, onBack }: { app: any; onBack: () => void }) => (
  <div className="shrink-0 h-11 flex items-center gap-2 px-1 border-b border-slate-200 dark:border-white/5 mb-2 bg-white dark:bg-[#0f172a] z-50">
    <button
      onClick={onBack}
      className="px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-400 transition-all flex items-center gap-1.5 group font-medium text-xs bg-slate-50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
    >
      <ChevronLeft
        size={14}
        className="group-hover:-translate-x-0.5 transition-transform"
      />
      Menu
    </button>
    <div className="flex-1 text-center pr-12">
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center justify-center gap-2">
        {app && <app.icon size={14} className="opacity-50" />}
        {app?.label}
      </span>
    </div>
    <div className="px-2 py-1.5 w-8"></div>
  </div>
);

const AppInfo = () => {
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    // Lấy version từ tauri.conf.json
    getVersion().then((v) => setAppVersion(v));
  }, []);

  return (
    <div className="text-xs text-slate-500">
      v{appVersion} ({INITIAL_APPS.length} Modules Edition)
    </div>
  );
};

// --- MAIN DASHBOARD ---

export const Dashboard = () => {
  const {
    lastActiveApp,
    setLastActiveApp,
    multiWindowEnabled,
    cursorStyle,
    backgroundImage,
    autoHideUI,
  } = useAppStore();
  const { showToast } = useToastStore();
  const activeApp = lastActiveApp;
  const setActiveApp = setLastActiveApp;
  const { playlist } = useMusicStore();
  const [isWindowHovered, setIsWindowHovered] = useState(true);

  // --- [MỚI] STATE & REF CHO SCROLL TO TOP ---
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateAvailable(update);
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };

    // Kiểm tra ngay khi mở app
    checkForUpdates();

    // Kiểm tra định kỳ mỗi 60 phút (3600000 ms)
    const interval = setInterval(checkForUpdates, 3600000);

    return () => clearInterval(interval);
  }, []);

  // --- MỞ CHẾ ĐỘ TEST GIAO DIỆN ---
  // useEffect(() => {
  //   setUpdateAvailable({
  //     version: "9.9.9 (Bản Test)",
  //     body: "Đây là nội dung demo để bạn chỉnh sửa CSS.\n\n- Tính năng A\n- Sửa lỗi B\n- Giao diện đẹp hơn",
  //     // Mock hàm giả để không bị lỗi crash app nếu lỡ tay bấm nút Cập nhật
  //     downloadAndInstall: async (cb: any) => {
  //       // Giả lập quá trình tải
  //       if (cb) cb({ event: "Started", data: { contentLength: 100 } });
  //       setTimeout(
  //         () => cb && cb({ event: "Progress", data: { chunkLength: 50 } }),
  //         1000,
  //       );
  //       setTimeout(() => cb && cb({ event: "Finished" }), 2000);
  //     },
  //   });
  // }, []);

  useLayoutEffect(() => {
    if (!activeApp && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [activeApp]);
  // --- HÀM CUỘN LÊN ĐẦU ---
  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- STATE: HIDDEN APPS (QUẢN LÝ APP ẨN) ---
  const [hiddenAppIds, setHiddenAppIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_hidden_apps");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Function toggle (truyền xuống ConfigModule)
  const handleToggleAppVisibility = (id: string) => {
    // Không cho phép tắt Config hoặc Settings
    if (id === "config" || id === "settings") return;

    setHiddenAppIds((prev) => {
      const newHidden = prev.includes(id)
        ? prev.filter((appId) => appId !== id) // Bỏ ẩn (Hiện lại)
        : [...prev, id]; // Thêm vào danh sách ẩn

      localStorage.setItem("dashboard_hidden_apps", JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const handleBulkUpdate = (newHiddenIds: string[]) => {
    // Đảm bảo không bao giờ ẩn config và settings
    const safeHiddenIds = newHiddenIds.filter(
      (id) => id !== "config" && id !== "settings",
    );
    setHiddenAppIds(safeHiddenIds);
    localStorage.setItem(
      "dashboard_hidden_apps",
      JSON.stringify(safeHiddenIds),
    );
  };

  // const savedOrder = localStorage.getItem("dashboard_app_order");
  // if (savedOrder) {
  //   const orderIds = JSON.parse(savedOrder);
  //   const sorted = [...INITIAL_APPS].sort((a, b) => {
  //     const indexA = orderIds.indexOf(a.id);
  //     const indexB = orderIds.indexOf(b.id);
  //     if (indexA === -1) return 1;
  //     if (indexB === -1) return -1;
  //     return indexA - indexB;
  //   });
  //   return sorted;
  // }
  // return INITIAL_APPS;
  const LAYOUT_VERSION = "2.0";
  const [apps, setApps] = useState<DashboardApp[]>(() => {
    try {
      const savedData = localStorage.getItem("dashboard_app_order");
      const savedVersion = localStorage.getItem("layout_version");

      // Nếu có data cũ và đúng version
      if (savedData && savedVersion === LAYOUT_VERSION) {
        // Parse ra mảng các object (đang bị thiếu icon)
        const parsedApps = JSON.parse(savedData) as DashboardApp[];

        // --- BƯỚC KHÔI PHỤC ICON (QUAN TRỌNG) ---
        // Duyệt qua danh sách cũ, lấy ID và tìm lại Icon gốc trong INITIAL_APPS
        const restoredApps = parsedApps.map((savedApp) => {
          const originalApp = INITIAL_APPS.find((a) => a.id === savedApp.id);
          if (originalApp) {
            return { ...savedApp, icon: originalApp.icon }; // Gắn lại Icon xịn vào
          }
          return savedApp;
        });

        return restoredApps;
      }
    } catch (e) {
      console.error("Lỗi load cache dashboard:", e);
    }

    // Nếu không có cache hoặc lỗi, dùng mặc định
    return INITIAL_APPS;
  });

  // --- NEW: SEARCH STATE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<typeof INITIAL_APPS>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- NEW: SEARCH LOGIC ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + F or Cmd + F
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }, 50);
      }
      // Esc to close
      if (e.key === "Escape" && isSearchOpen) {
        handleCloseSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setHighlightedIds([]);
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = apps
      .filter((app) => app.label.toLowerCase().includes(lowerQuery))
      .map((app) => app.id);
    const matches_all = INITIAL_APPS.filter((app) =>
      app.label.toLowerCase().includes(lowerQuery),
    );

    setHighlightedIds(matches);
    setSearchResults(matches_all);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setHighlightedIds([]);
    setSearchResults([]);
  };

  const openExternalModule = async (moduleId: string) => {
    const appLabel =
      INITIAL_APPS.find((a) => a.id === moduleId)?.label || "Module";
    const windowLabel = `win-${moduleId}-${Date.now()}`;

    try {
      const webview = new WebviewWindow(windowLabel, {
        url: `index.html?app=${moduleId}`,
        title: `OverDesk - ${appLabel}`,
        width: 770,

        // --- CHỈNH SỬA TẠI ĐÂY ---
        height: window.screen.availHeight - 200, // Lấy chiều cao khả dụng (trừ thanh Taskbar)
        // y: 0, // Neo cửa sổ lên sát mép trên cùng
        // x: window.screen.availWidth - 550, // Nếu muốn neo sang phải thì dùng: window.screen.availWidth - 550

        resizable: true,
        decorations: true,
        center: true, // Nếu muốn căn giữa chiều ngang. Lưu ý: y:0 sẽ được ưu tiên hơn center chiều dọc
        focus: true, // Tự động focus vào cửa sổ mới khi mở
      });

      webview.once("tauri://created", function () {
        // console.log("Window created");
      });

      webview.once("tauri://error", function (e) {
        console.error("Error creating window:", e);
        showToast("Failed to launch window", "error");
      });
    } catch (error) {
      console.error(error);
    }
  };

  // const handleLaunchApp = (appId: string) => {
  //   if (appId) {
  //     setActiveApp(appId);
  //     handleCloseSearch();
  //   }
  // };
  const handleLaunchApp = (appId: string) => {
    if (appId) {
      const appInfo = INITIAL_APPS.find((a) => a.id === appId);

      // Kiểm tra xem app có bị disabled không
      if (appInfo?.disabled) return;

      // Logic chính:
      // 1. Nếu MultiWindow đang BẬT
      // 2. VÀ App không phải là 'config' hay 'settings' (các app này nên mở ở dashboard chính để quản lý state)
      if (
        multiWindowEnabled &&
        appId !== "config" &&
        appId !== "settings" &&
        appId !== "socials" &&
        appId !== "music"
      ) {
        openExternalModule(appId);
      } else {
        // Mở bình thường trong Dashboard
        setActiveApp(appId);
      }

      // Đóng search panel sau khi chọn
      handleCloseSearch();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // 1. Logic "/" -> Quay về Dashboard (Home)
      if (searchQuery.trim() === "/") {
        handleCloseSearch(); // Đóng modal tìm kiếm
        setActiveApp(null); // <--- QUAN TRỌNG: Đóng ứng dụng đang mở để về Dashboard
        return;
      }

      // 2. Logic mở ứng dụng đầu tiên tìm thấy
      if (searchResults.length > 0) {
        handleLaunchApp(searchResults[0].id);
      }
    }
  };

  // --- DRAG LOGIC ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    position: number,
  ) => {
    dragItem.current = position;
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLButtonElement>,
    position: number,
  ) => {
    e.preventDefault();
    dragOverItem.current = position;

    if (
      dragItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      const newApps = [...apps];
      const draggedItemContent = newApps[dragItem.current];
      newApps.splice(dragItem.current, 1);
      newApps.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = dragOverItem.current;
      setApps(newApps);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.remove("opacity-50");
    dragItem.current = null;
    dragOverItem.current = null;
    const orderIds = apps.map((a) => a.id);
    localStorage.setItem("dashboard_app_order", JSON.stringify(orderIds));
  };

  const handleBackFromShare = async () => {
    setActiveApp(null);
  };

  const renderStandardApp = () => {
    switch (activeApp) {
      case "tasks":
        return <TaskModule />;
      case "notes":
        return <NoteModule />;
      case "timer":
        return <TimerModule />;
      case "calc":
        return <CalcModule />;
      case "translate":
        return <TranslateModule />;
      case "map":
        return <MapModule />;
      case "settings":
        return <SettingsModule />;
      case "weather":
        return <WeatherModule />;
      case "socials":
        return <SocialModule />;
      case "qrcode":
        return <QrCodeModule />;
      case "crypto":
        return <CryptoModule />;
      case "decode":
        return <DecodeModule />;
      case "news":
        return <NewsModule />;
      case "camera":
        return <CameraModule />;
      case "vault":
        return <VaultModule />;
      case "whiteboard":
        return <WhiteboardModule />;
      case "capture":
        return <ScreenCaptureModule />;
      case "record":
        return <RecordModule />;
      case "converter":
        return <ConverterModule />;
      case "system":
        return <SystemInfoModule />;
      case "speedtest":
        return <SpeedTestModule />;
      case "shutdown":
        return <ShutdownModule />;
      case "code":
        return <CodeModule />;
      case "markdown":
        return <MarkdownModule />;
      case "git":
        return <GitModule />;
      case "budget":
        return <BudgetModule />;
      case "json":
        return <JsonModule />;
      case "request":
        return <RequestModule />;
      case "regex":
        return <RegexModule />;
      case "gen":
        return <GenDataModule />;
      case "calendar":
        return <CalendarModule />;
      case "database":
        return (
          <DatabaseModule onSwitchToDatabase={() => setActiveApp("erd")} />
        );
      case "erd":
        return (
          <ERDiagramModule
            onSwitchToDatabase={() => setActiveApp("database")}
          />
        );
      case "snippets":
        return <SnippetModule />;
      case "json_tools":
        return <JsonToolsModule />;
      case "jwt":
        return <JwtModule />;
      case "design":
        return <DesignModule />;
      case "typography":
        return <TypographyModule />;
      case "icons":
        return <IconPickerModule />;
      case "devops":
        return <CronDockerModule />;
      case "tree":
        return <FileExplorerModule />;
      case "family":
        return <FamilyTreeModule />;
      case "portfolio":
        return <PortfolioModule />;
      case "loan":
        return <LoanModule />;
      case "breathe":
        return <BreathingModule />;
      case "health":
        return <WaterBodyModule />;
      case "reader":
        return <SpeedReaderModule />;
      case "pdf":
        return <PdfModule />;
      case "sign":
        return <SignatureModule />;
      case "img-compress":
        return <ImageCompressorModule />;
      case "wheel":
        return <DecisionWheelModule />;
      case "recipe":
        return <RecipeFinderModule />;
      case "mystic":
        return <MysticModule />;
      case "fb-tools":
        return <FacebookToolsModule />;
      case "dice":
        return <DiceRollerModule />;
      case "goals":
        return <GoalTrackerModule />;
      case "table":
        return <TableCreatorModule />;
      case "ai":
        return <AIChatModule />;
      case "config":
        return (
          <ConfigModule
            allApps={INITIAL_APPS}
            hiddenAppIds={hiddenAppIds}
            onToggleApp={handleToggleAppVisibility}
            onBulkUpdate={handleBulkUpdate}
          />
        );
      case "tester":
        return <TesterModule onSwitchApp={setActiveApp} />;
      case "testcase":
        return <TestScriptModule onSwitchApp={setActiveApp} />;
      case "bug-report":
        return <BugReportModule />;
      case "responsive":
        return <ResponsiveViewerModule />;
      case "library":
        return <LibraryModule />;
      case "piano":
        return <PianoModule />;
      case "terminal":
        return <TerminalModule />;
      case "wiki":
        return <WikiModule />;
      case "game":
        return <GameModule />;
      case "rpg":
        return <RPGModule />;
      case "def":
        return <TowerDefenseModule />;
      case "pvz":
        return <PvzGameModule />;
      case "manga":
        return <MangaModule />;
      case "novel":
        return <NovelEditorModule />;
      case "uibuilder":
        return <UIBuilderModule />;
      case "space3d":
        return <Space3DModule />;
      case "anim":
        return <FrameAnimationUltimate />;
      case "clock":
        return <ClockModule />;
      case "photo-booth":
        return <PhotoBoothModule />;
      case "phone":
        return <PhoneModule />;
      case "mirror":
        return <ScreenMirrorModule />;
      case "hourglass":
        return <HourglassModule />;
      case "excel":
        return <ExcelModule />;
      case "word":
        return <WordModule />;
      case "about":
        return <AboutModule />;
      case "license":
        return <LicenseModule />;
      default:
        return null;
    }
  };

  const currentAppInfo = INITIAL_APPS.find((app) => app.id === activeApp);
  const shareAppInfo = INITIAL_APPS.find((app) => app.id === "share");

  useEffect(() => {
    // Áp dụng cho body để nó ăn toàn bộ app
    document.body.style.cursor = cursorStyle;

    // (Tuỳ chọn) Tạo style tag để override các element khác nếu cần thiết
    // Tuy nhiên gán vào body thường là đủ cho React App

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [cursorStyle]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden relative"
      onMouseEnter={() => setIsWindowHovered(true)}
      onMouseLeave={() => setIsWindowHovered(false)}
    >
      {updateAvailable && (
        <UpdatePopup
          updateInfo={updateAvailable}
          onClose={() => setUpdateAvailable(null)}
        />
      )}

      {/* --- [MỚI] BACKGROUND LAYER --- */}
      {/* Lớp này nằm dưới cùng (z-0), hiển thị ảnh nếu có */}
      <div
        className="absolute inset-0 z-0 transition-all duration-500"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: backgroundImage ? 1 : 0, // Ẩn nếu không có ảnh
        }}
      >
        {/* Lớp phủ tối nhẹ để icon dễ nhìn hơn trên nền ảnh sáng */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
      </div>

      {/* --- [MỚI] DEFAULT BACKGROUND LAYER --- */}
      {/* Lớp nền mặc định (Gradient/Màu) chỉ hiện khi KHÔNG có ảnh nền */}
      {!backgroundImage && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0f172a] dark:to-[#1e293b]" />
      )}

      {/* LAYER 1: PERSISTENT APPS */}
      <div
        className={`absolute inset-0 z-50 flex flex-col bg-slate-900 transition-opacity duration-300 
        ${
          activeApp === "share" || activeApp === "music"
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none invisible"
        }`}
      >
        <div
          className={activeApp === "share" ? "block h-full" : "hidden h-full"}
        >
          <AppHeader app={shareAppInfo} onBack={handleBackFromShare} />
          <div className="flex-1 overflow-hidden">
            <ScreenShareModule />
          </div>
        </div>

        <div
          className={activeApp === "music" ? "block h-full" : "hidden h-full"}
        >
          <AppHeader
            app={INITIAL_APPS.find((a) => a.id === "music")}
            onBack={() => setActiveApp(null)}
          />
          <div className="flex-1 overflow-hidden">
            <MusicModule />
          </div>
        </div>
      </div>

      {/* LAYER 2: STANDARD APPS */}
      {activeApp && activeApp !== "share" && (
        <div className="flex flex-col h-full animate-in slide-in-from-right-5 duration-300 relative z-40 bg-slate-50 dark:bg-[#0f172a]">
          <AppHeader app={currentAppInfo} onBack={() => setActiveApp(null)} />
          <div className="flex-1 overflow-hidden">{renderStandardApp()}</div>
        </div>
      )}

      {/* LAYER 3: GRID MENU (DRAGGABLE) */}
      {!activeApp && (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          {/* Header Dashboard */}
          <div className="mb-5 mt-3 px-3 shrink-0 flex items-center justify-between overflow-visible">
            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
              {/* Logo box: Thêm backdrop-blur để đẹp hơn trên nền ảnh */}
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-900/90 dark:bg-white/90 backdrop-blur-md flex items-center justify-center text-white dark:text-slate-900 shadow-lg">
                <Grid size={20} />
              </div>
              <div className="truncate drop-shadow-sm">
                <div className="inline-flex items-end gap-1">
                  <h2 className="text-base font-bold text-slate-300 dark:text-white leading-tight truncate">
                    OverDesk
                  </h2>
                  <AppInfo />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-300 dark:text-slate-400 truncate">
                  Dashboard{" "}
                  <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-[9px] font-mono text-black dark:text-white select-none">
                    Ctrl+F
                  </span>
                </div>
              </div>
            </div>
            <UserWidget />
          </div>

          {/* Grid Apps */}
          <div
            ref={scrollContainerRef}
            // [MỚI] Sửa sự kiện onScroll để cập nhật cả ref và state
            onScroll={(e) => {
              scrollPositionRef.current = e.currentTarget.scrollTop;
              setShowScrollTop(e.currentTarget.scrollTop > 100);
            }}
            className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide mt-3 "
          >
            <div
              className={`grid gap-3 grid-cols-[repeat(auto-fill,minmax(100px,1fr))] pb-10 transition-opacity duration-800 ease-in-out
            ${isWindowHovered || isSearchOpen || !autoHideUI ? "opacity-100" : "opacity-0"} `}
            >
              {apps.map((app: DashboardApp, index: number) => {
                if (hiddenAppIds.includes(app.id)) return null;

                const isHighlighted = highlightedIds.includes(app.id);
                // Nếu đang tìm kiếm mà không match thì làm mờ đi
                const isDimmed = highlightedIds.length > 0 && !isHighlighted;

                return (
                  <button
                    key={app.id}
                    draggable={!app.disabled}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    // onClick={() => {
                    //   if (!app.disabled) {
                    //     setActiveApp(app.id);
                    //     setIsSearchOpen(false); // <--- THÊM DÒNG NÀY: Đóng search khi mở app
                    //     setSearchQuery(""); // Reset query
                    //     setHighlightedIds([]); // Reset highlight
                    //   }
                    // }}
                    onClick={() => handleLaunchApp(app.id)}
                    disabled={app.disabled}
                    className={`
                      relative flex flex-col items-center p-3 rounded-xl border transition-all duration-300 group h-28 justify-center
                      cursor-grab active:cursor-grabbing
                      ${
                        backgroundImage
                          ? "bg-white/60 dark:bg-slate-900/10 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-900/80 shadow-sm"
                          : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-lg"
                      }
                      ${
                        app.disabled
                          ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-white/5 border-transparent grayscale-[0.8]"
                          : "bg-white dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1"
                      }
                      ${
                        isHighlighted
                          ? "ring-4 ring-yellow-400/80 dark:ring-yellow-400 scale-105 z-10 shadow-xl !opacity-100"
                          : ""
                      }
                      ${isDimmed ? "opacity-20 scale-95 blur-[1px]" : ""}
                    `}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border mb-2 transition-transform group-hover:scale-110 pointer-events-none ${app.color}`}
                    >
                      {app.icon ? (
                        <app.icon size={20} strokeWidth={2} />
                      ) : (
                        <span
                          title={`Lỗi Icon: ${app.id}`}
                          className="text-red-500 font-bold text-xs"
                        >
                          ?
                          {/* CÁCH FIX: Dùng hàm tự chạy để log xong trả về null */}
                          {(() => {
                            console.error(`MISSING ICON FOR APP: ${app.label}`);
                            return null;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="text-center w-full pointer-events-none">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-100 mb-0.5">
                        {app.label}
                      </div>
                      <div className="text-[9px] text-slate-600 dark:text-slate-300 font-medium">
                        {app.desc}
                      </div>
                    </div>
                    {app.disabled && (
                      <div
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"
                        title="Coming soon"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* [MỚI] NÚT SCROLL TO TOP */}
          <button
            onClick={scrollToTop}
            className={`
              absolute bottom-20 right-6  p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-300 z-50
              ${
                showScrollTop && isWindowHovered && !isSearchOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10 pointer-events-none"
              }
            `}
            title="Scroll to Top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      )}

      {/* --- SEARCH MODAL (NON-BLOCKING) --- */}
      {isSearchOpen && (
        // 1. pointer-events-none: Cho phép click xuyên qua vùng trống
        // 2. Bỏ bg-slate-900 và backdrop-blur để nhìn rõ bên dưới
        // 3. Đổi items-center thành items-start pt-24 để thanh search nằm trên cao, không che app giữa màn hình
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pointer-events-none animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 m-4 border border-slate-200 dark:border-slate-700 pointer-events-auto ring-1 ring-black/5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400" size={20} />
              <input
                autoFocus // Tự động focus khi mở
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={handleInputKeyDown}
                placeholder="Gõ tên ứng dụng..."
                className="w-full h-12 pl-10 pr-10 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setHighlightedIds([]);
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* --- LIST KẾT QUẢ TÌM KIẾM --- */}
            {searchResults.length > 0 ? (
              <div className="mt-3 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0 max-h-[50vh]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kết quả ({searchResults.length})
                </div>
                <div className="space-y-1">
                  {searchResults.map((app) => {
                    const isHidden = hiddenAppIds.includes(app.id);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleLaunchApp(app.id)}
                        disabled={app.disabled as boolean}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all group text-left
                            ${
                              app.disabled
                                ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
                                : "hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                            }
                        `}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${app.color}`}
                        >
                          <app.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {app.label}
                            </span>
                            {isHidden && (
                              <span
                                className="flex items-center gap-1 text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400"
                                title="Ứng dụng này đang bị ẩn"
                              >
                                <EyeOff size={10} /> Ẩn
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {app.desc}
                          </div>
                        </div>
                        {!app.disabled && (
                          <ChevronLeft
                            size={16}
                            className="text-slate-300 group-hover:text-indigo-400 rotate-180 transition-colors"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="mt-8 mb-4 text-center text-slate-400 text-xs">
                Không tìm thấy ứng dụng nào khớp với "{searchQuery}"
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 font-medium">
                <span>Tìm thấy tất cả ứng dụng</span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-[9px] border border-slate-300 dark:border-slate-600">
                    Esc
                  </kbd>{" "}
                  để đóng
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MINI PLAYER */}
      {playlist.length > 0 &&
        activeApp !== "music" &&
        activeApp !== "settings" &&
        activeApp !== "license" &&
        activeApp !== "about" &&
        activeApp !== "calendar" &&
        activeApp !== "share" &&
        activeApp !== "record" &&
        activeApp !== "system" &&
        activeApp !== "speedtest" &&
        activeApp !== "shutdown" &&
        activeApp !== "code" &&
        activeApp !== "git" &&
        activeApp !== "budget" &&
        activeApp !== "regex" &&
        activeApp !== "json_tools" &&
        activeApp !== "design" &&
        activeApp !== "erd" &&
        activeApp !== "database" &&
        activeApp !== "devops" &&
        activeApp !== "portfolio" &&
        activeApp !== "loan" &&
        activeApp !== "breathe" &&
        activeApp !== "reader" &&
        activeApp !== "sign" &&
        activeApp !== "wheel" &&
        activeApp !== "mystic" &&
        activeApp !== "dice" &&
        activeApp !== "goals" &&
        activeApp !== "table" &&
        activeApp !== "fb-tools" &&
        activeApp !== "ai" &&
        activeApp !== "tester" &&
        activeApp !== "testcase" &&
        activeApp !== "bug-report" &&
        activeApp !== "library" &&
        activeApp !== "piano" &&
        activeApp !== "rpg" &&
        activeApp !== "def" &&
        activeApp !== "pvz" &&
        activeApp !== "config" &&
        activeApp !== "manga" &&
        activeApp !== "novel" &&
        activeApp !== "uibuilder" &&
        activeApp !== "space3d" &&
        activeApp !== "anim" &&
        activeApp !== "clock" &&
        activeApp !== "photo-booth" &&
        activeApp !== "phone" &&
        activeApp !== "mirror" &&
        activeApp !== "hourglass" &&
        activeApp !== "excel" &&
        activeApp !== "word" &&
        activeApp !== "gen" &&
        activeApp !== "qrcode" && (
          <div
            className={`transition-opacity duration-500 ${isWindowHovered || !autoHideUI ? "opacity-100" : "opacity-0"}`}
          >
            <MiniPlayer />
          </div>
        )}
    </div>
  );
};

// --- COMPONENT POPUP CẬP NHẬT ---
const UpdatePopup = ({
  updateInfo,
  onClose,
}: {
  updateInfo: any;
  onClose: () => void;
}) => {
  const [status, setStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdate = async () => {
    setStatus("downloading");
    try {
      let downloaded = 0;
      let total = 0;

      await updateInfo.downloadAndInstall((event: any) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total > 0) {
              setProgress(Math.round((downloaded / total) * 100));
            }
            break;
          case "Finished":
            setStatus("ready");
            break;
        }
      });

      await relaunch();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMsg("Cập nhật thất bại. Vui lòng thử lại sau.");
    }
  };

  if (!updateInfo) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <RefreshCw size={100} />
        </div>

        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
          Cập nhật mới: v{updateInfo?.version}
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {updateInfo.body ||
            "Đã có bản cập nhật mới với nhiều tính năng hấp dẫn và sửa lỗi."}
        </p>

        {status === "downloading" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Đang tải xuống...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg mb-4 flex items-center gap-2 border border-red-500/20">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <div className="flex gap-3">
          {status !== "downloading" && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors"
            >
              Để sau
            </button>
          )}

          <button
            onClick={handleUpdate}
            disabled={status === "downloading"}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait transition-all"
          >
            {status === "idle" && (
              <>
                <Download size={14} /> Cập nhật ngay
              </>
            )}
            {status === "downloading" && (
              <>
                <RefreshCw size={14} className="animate-spin" /> Đang tải...
              </>
            )}
            {status === "ready" && (
              <>
                <CheckCircle size={14} /> Khởi động lại
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
