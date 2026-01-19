// src/App.tsx
import { useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useAppStore } from "./stores/useAppStore";
import { Shell } from "./layouts/Shell";
import { BubbleLayout } from "./layouts/BubbleLayout";
// Lưu ý: Kiểm tra lại đường dẫn import Dashboard này cho đúng với cấu trúc folder của bạn
import { ToastSystem } from "./components/ui/ToastSystem";
import { loadFromDisk } from "./utils/storage"; // 👈 IMPORT MỚI
import { Dashboard } from "./components/features/dashboard/Dashboard";
import { ScreenShareEngine } from "./components/features/dashboard/components/ScreenShareEngine";
import { NoteModule } from "./components/features/dashboard/modules/note_module/NoteModule";
import { TaskModule } from "./components/features/dashboard/modules/task_module/TaskModule";
import { TimerModule } from "./components/features/dashboard/modules/focus_module/TimerModule";
import { CalcModule } from "./components/features/dashboard/components/CalcModule";
import { TranslateModule } from "./components/features/dashboard/components/TranslateModule";
import { MapModule } from "./components/features/dashboard/components/MapModule";
import { WeatherModule } from "./components/features/dashboard/components/WeatherModule";
import { QrCodeModule } from "./components/features/dashboard/components/QrCodeModule";
import { CryptoModule } from "./components/features/dashboard/components/CryptoModule";
import { DecodeModule } from "./components/features/dashboard/components/DecodeModule";
import { NewsModule } from "./components/features/dashboard/components/NewsModule";
import { CameraModule } from "./components/features/dashboard/components/CameraModule";
// import { FaceIDModule } from "./components/features/dashboard/components/FaceIDModule";
import { VaultModule } from "./components/features/dashboard/components/VaultModule";
import { WhiteboardModule } from "./components/features/dashboard/components/WhiteboardModule";
import { ScreenCaptureModule } from "./components/features/dashboard/components/ScreenCaptureModule";
import { RecordModule } from "./components/features/dashboard/components/RecordModule";
import { ConverterModule } from "./components/features/dashboard/components/ConverterModule";
import { SystemInfoModule } from "./components/features/dashboard/modules/system_info_module/SystemInfoModule";
import { SpeedTestModule } from "./components/features/dashboard/components/SpeedTestModule";
import { ShutdownModule } from "./components/features/dashboard/modules/power_module/ShutdownModule";
import { CodeModule } from "./components/features/dashboard/modules/code_module/CodeModule";
import { MarkdownModule } from "./components/features/dashboard/modules/markdown_module/MarkdownModule";
import { GitModule } from "./components/features/dashboard/modules/git_module/GitModule";
import { BudgetModule } from "./components/features/dashboard/components/BudgetModule";
import { JsonModule } from "./components/features/dashboard/modules/json_module/JsonModule";
import { RequestModule } from "./components/features/dashboard/components/RequestModule";
import { RegexModule } from "./components/features/dashboard/components/RegexModule";
import { GenDataModule } from "./components/features/dashboard/components/GenDataModule";
import { CalendarModule } from "./components/features/dashboard/modules/calendar_module/CalendarModule";
import { SnippetModule } from "./components/features/dashboard/components/SnippetModule";
import { JsonToolsModule } from "./components/features/dashboard/modules/json_tool_module/JsonToolsModule";
import { JwtModule } from "./components/features/dashboard/components/JwtModule";
import { DesignModule } from "./components/features/dashboard/components/DesignModule";
import { TypographyModule } from "./components/features/dashboard/components/TypographyModule";
import { IconPickerModule } from "./components/features/dashboard/components/IconPickerModule";
import { CronDockerModule } from "./components/features/dashboard/components/CronDockerModule";
import { FileExplorerModule } from "./components/features/dashboard/components/FileExplorerModule";
import { FamilyTreeModule } from "./components/features/dashboard/components/FamilyTreeModule";
import { PortfolioModule } from "./components/features/dashboard/components/PortfolioModule";
import { LoanModule } from "./components/features/dashboard/components/LoanModule";
import { BreathingModule } from "./components/features/dashboard/components/BreathingModule";
import { WaterBodyModule } from "./components/features/dashboard/components/WaterBodyModule";
import { SpeedReaderModule } from "./components/features/dashboard/components/SpeedReaderModule";
import { PdfModule } from "./components/features/dashboard/modules/pdf_module/PdfModule";
import { SignatureModule } from "./components/features/dashboard/modules/signature_module/SignatureModule";
import { ImageCompressorModule } from "./components/features/dashboard/components/ImageCompressorModule";
import { DecisionWheelModule } from "./components/features/dashboard/components/DecisionWheelModule";
import { RecipeFinderModule } from "./components/features/dashboard/components/RecipeFinderModule";
import { MysticModule } from "./components/features/dashboard/components/MysticModule";
import { FacebookToolsModule } from "./components/features/dashboard/components/FacebookToolsModule";
import { DiceRollerModule } from "./components/features/dashboard/components/DiceRollerModule";
import { GoalTrackerModule } from "./components/features/dashboard/components/GoalTrackerModule";
import { TableCreatorModule } from "./components/features/dashboard/modules/table_module/TableCreatorModule";
import { AIChatModule } from "./components/features/dashboard/components/AIChatModule";
import { TesterModule } from "./components/features/dashboard/components/TesterModule";
import { TestScriptModule } from "./components/features/dashboard/components/TestScriptModule";
import { BugReportModule } from "./components/features/dashboard/components/BugReportModule";
import { ResponsiveViewerModule } from "./components/features/dashboard/components/ResponsiveViewerModule";
import { LibraryModule } from "./components/features/dashboard/components/LibraryModule";
import { PianoModule } from "./components/features/dashboard/components/PianoModule";
import { TerminalModule } from "./components/features/dashboard/modules/terminal_module/TerminalModule";
import { WikiModule } from "./components/features/dashboard/components/WikiModule";
import { GameModule } from "./components/features/dashboard/components/GameModule";
import { RPGModule } from "./components/features/dashboard/components/RPGModule";
import { TowerDefenseModule } from "./components/features/dashboard/components/TowerDefenseModule";
import { PvzGameModule } from "./components/features/dashboard/components/PvzGameModule";
import { MangaModule } from "./components/features/dashboard/components/MangaModule";
import { NovelEditorModule } from "./components/features/dashboard/components/NovelEditorModule";
import { UIBuilderModule } from "./components/features/dashboard/components/UIBuilderModule";
import { DatabaseModule } from "./components/features/dashboard/modules/database_module/DatabaseModule";
import { ERDiagramModule } from "./components/features/dashboard/modules/er_diagram_module/ERDiagramModule";
import { MobileConnect } from "./components/features/dashboard/components/MobileConnect";
import { PhoneModule } from "./components/features/dashboard/components/PhoneModule";
import { MobileMirror } from "./components/features/dashboard/components/MobileMirror";
import { ScreenMirrorModule } from "./components/features/dashboard/components/ScreenMirrorModule";
import { SettingsModule } from "./components/features/dashboard/modules/settings_module/SettingsModule";

const SIZES = {
  PANEL: new LogicalSize(513, window.screen.availHeight),
  BUBBLE: new LogicalSize(80, 80),
};

function App() {
  const isMirrorPage = window.location.pathname === "/mobile-mirror";
  if (isMirrorPage) {
    return <MobileMirror />;
  }

  const isConnectPage =
    window.location.pathname === "/connect" ||
    window.location.search.includes("hostId");
  if (isConnectPage) {
    return <MobileConnect />;
  }

  // 👇 LẤY THÊM CÁC HÀM SETTER ĐỂ NẠP DỮ LIỆU
  const { viewMode, theme, opacity, setTasks, setNotes, setMapSavedLocs } =
    useAppStore();
  const [standaloneApp, setStandaloneApp] = useState<string | null>(null);

  const appWindow = getCurrentWindow();

  // --- 1. KHỞI TẠO APP (Chạy 1 lần duy nhất) ---
  useEffect(() => {
    const initApp = async () => {
      // A. Đọc dữ liệu từ ổ cứng (File System)
      const savedTasks = await loadFromDisk("tasks");
      const savedNotes = await loadFromDisk("notes");
      const savedMap = await loadFromDisk("map_saved_locs");

      // B. Nạp vào Store (Nếu có dữ liệu cũ)
      if (savedTasks) setTasks(savedTasks);
      if (savedNotes) setNotes(savedNotes);
      if (savedMap) setMapSavedLocs(savedMap);

      // C. Cài đặt Theme ban đầu
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // D. Hiện cửa sổ App (Sau khi đã load xong mọi thứ)
      await appWindow.show();
    };

    initApp();
  }, []); // Dependency rỗng -> Chỉ chạy lúc Mount

  // --- 2. THEME EFFECT (Chạy khi đổi theme) ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // --- 3. RESIZE EFFECT (Chạy khi đổi chế độ view) ---
  useEffect(() => {
    const updateSize = async () => {
      if (viewMode === "bubble") {
        await appWindow.setSize(SIZES.BUBBLE);
      } else {
        await appWindow.setSize(SIZES.PANEL);
      }
      // Tùy chọn: Có thể bỏ center() nếu muốn nó nhớ vị trí cũ
      await appWindow.center();
    };

    updateSize();
  }, [viewMode]);

  useEffect(() => {
    // 1. Kiểm tra URL khi khởi chạy
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get("app");
    if (appParam) {
      setStandaloneApp(appParam);
    }
  }, []);

  if (standaloneApp) {
    return (
      <div className="h-full w-full bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
        {standaloneApp === "tasks" && <TaskModule />}
        {standaloneApp === "notes" && <NoteModule />}
        {standaloneApp === "timer" && <TimerModule />}
        {standaloneApp === "calc" && <CalcModule />}
        {standaloneApp === "translate" && <TranslateModule />}
        {standaloneApp === "map" && <MapModule />}
        {standaloneApp === "settings" && <SettingsModule />}
        {standaloneApp === "weather" && <WeatherModule />}
        {standaloneApp === "qrcode" && <QrCodeModule />}
        {standaloneApp === "crypto" && <CryptoModule />}
        {standaloneApp === "decode" && <DecodeModule />}
        {standaloneApp === "news" && <NewsModule />}
        {standaloneApp === "camera" && <CameraModule />}
        {/* {standaloneApp === "faceid" && <FaceIDModule />} */}
        {standaloneApp === "vault" && <VaultModule />}
        {standaloneApp === "whiteboard" && <WhiteboardModule />}
        {standaloneApp === "capture" && <ScreenCaptureModule />}
        {standaloneApp === "record" && <RecordModule />}
        {standaloneApp === "converter" && <ConverterModule />}
        {standaloneApp === "system" && <SystemInfoModule />}
        {standaloneApp === "speedtest" && <SpeedTestModule />}
        {standaloneApp === "shutdown" && <ShutdownModule />}
        {standaloneApp === "code" && <CodeModule />}
        {standaloneApp === "markdown" && <MarkdownModule />}
        {standaloneApp === "git" && <GitModule />}
        {standaloneApp === "budget" && <BudgetModule />}
        {standaloneApp === "json" && <JsonModule />}
        {standaloneApp === "request" && <RequestModule />}
        {standaloneApp === "regex" && <RegexModule />}
        {standaloneApp === "gen" && <GenDataModule />}
        {standaloneApp === "calendar" && <CalendarModule />}

        {standaloneApp === "database" && (
          <DatabaseModule onSwitchToDatabase={() => setStandaloneApp("erd")} />
        )}

        {standaloneApp === "erd" && (
          <ERDiagramModule
            onSwitchToDatabase={() => setStandaloneApp("database")}
          />
        )}

        {standaloneApp === "snippets" && <SnippetModule />}
        {standaloneApp === "json_tools" && <JsonToolsModule />}
        {standaloneApp === "jwt" && <JwtModule />}
        {standaloneApp === "design" && <DesignModule />}
        {standaloneApp === "typography" && <TypographyModule />}
        {standaloneApp === "icons" && <IconPickerModule />}
        {standaloneApp === "devops" && <CronDockerModule />}
        {standaloneApp === "tree" && <FileExplorerModule />}
        {standaloneApp === "family" && <FamilyTreeModule />}
        {standaloneApp === "portfolio" && <PortfolioModule />}
        {standaloneApp === "loan" && <LoanModule />}
        {standaloneApp === "breathe" && <BreathingModule />}
        {standaloneApp === "health" && <WaterBodyModule />}
        {standaloneApp === "reader" && <SpeedReaderModule />}
        {standaloneApp === "pdf" && <PdfModule />}
        {standaloneApp === "sign" && <SignatureModule />}
        {standaloneApp === "img-compress" && <ImageCompressorModule />}
        {standaloneApp === "wheel" && <DecisionWheelModule />}
        {standaloneApp === "recipe" && <RecipeFinderModule />}
        {standaloneApp === "mystic" && <MysticModule />}
        {standaloneApp === "fb-tools" && <FacebookToolsModule />}
        {standaloneApp === "dice" && <DiceRollerModule />}
        {standaloneApp === "goals" && <GoalTrackerModule />}
        {standaloneApp === "table" && <TableCreatorModule />}
        {standaloneApp === "ai" && <AIChatModule />}
        {standaloneApp === "tester" && (
          <TesterModule onSwitchApp={() => setStandaloneApp("testcase")} />
        )}
        {standaloneApp === "testcase" && (
          <TestScriptModule onSwitchApp={() => setStandaloneApp("tester")} />
        )}
        {standaloneApp === "bug-report" && <BugReportModule />}
        {standaloneApp === "responsive" && <ResponsiveViewerModule />}
        {standaloneApp === "library" && <LibraryModule />}
        {standaloneApp === "piano" && <PianoModule />}
        {standaloneApp === "terminal" && <TerminalModule />}
        {standaloneApp === "wiki" && <WikiModule />}
        {standaloneApp === "game" && <GameModule />}
        {standaloneApp === "rpg" && <RPGModule />}
        {standaloneApp === "def" && <TowerDefenseModule />}
        {standaloneApp === "pvz" && <PvzGameModule />}
        {standaloneApp === "manga" && <MangaModule />}
        {standaloneApp === "novel" && <NovelEditorModule />}
        {standaloneApp === "uibuilder" && <UIBuilderModule />}
        {standaloneApp === "phone" && <PhoneModule />}
        {standaloneApp === "mirror" && <ScreenMirrorModule />}
      </div>
    );
  }

  return (
    <main
      className="h-screen w-screen overflow-hidden bg-transparent flex flex-col justify-center items-center transition-opacity duration-200"
      style={{ opacity: viewMode === "bubble" ? 1 : opacity }}
    >
      <ScreenShareEngine />

      {viewMode === "bubble" ? (
        <BubbleLayout />
      ) : (
        <Shell>
          {/* {standaloneApp === "notes" ? <NoteModule /> : <Dashboard />} */}
          <Dashboard />
        </Shell>
      )}

      <ToastSystem />
    </main>
  );
}

export default App;
