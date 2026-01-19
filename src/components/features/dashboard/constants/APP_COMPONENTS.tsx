import { AboutModule } from "../modules/about_module/AboutModule";
import { AIChatModule } from "../components/AIChatModule";
import { FrameAnimationUltimate } from "../components/AnimationsModule";
import { BreathingModule } from "../components/BreathingModule";
import { BudgetModule } from "../components/BudgetModule";
import { BugReportModule } from "../components/BugReportModule";
import { CalcModule } from "../components/CalcModule";
import { CalendarModule } from "../modules/calendar_module/CalendarModule";
import { CameraModule } from "../components/CameraModule";
import { ClockModule } from "../components/ClockModule";
import { CodeModule } from "../modules/code_module/CodeModule";
import { ConverterModule } from "../components/ConverterModule";
import { CronDockerModule } from "../components/CronDockerModule";
import { CryptoModule } from "../components/CryptoModule";
import { DecisionWheelModule } from "../components/DecisionWheelModule";
import { DecodeModule } from "../components/DecodeModule";
import { DesignModule } from "../components/DesignModule";
import { DiceRollerModule } from "../components/DiceRollerModule";
import { ExcelModule } from "../modules/excel_module/ExcelModule";
import { FacebookToolsModule } from "../components/FacebookToolsModule";
import { FamilyTreeModule } from "../components/FamilyTreeModule";
import { FileExplorerModule } from "../components/FileExplorerModule";
import { GameModule } from "../components/GameModule";
import { GenDataModule } from "../components/GenDataModule";
import { GitModule } from "../modules/git_module/GitModule";
import { GoalTrackerModule } from "../components/GoalTrackerModule";
import { HourglassModule } from "../modules/hourglass_module/HourglassModule";
import { IconPickerModule } from "../components/IconPickerModule";
import { ImageCompressorModule } from "../components/ImageCompressorModule";
import { JsonModule } from "../modules/json_module/JsonModule";
import { JsonToolsModule } from "../modules/json_tool_module/JsonToolsModule";
import { JwtModule } from "../components/JwtModule";
import { LibraryModule } from "../components/LibraryModule";
import { LicenseModule } from "../modules/license_module/LicenseModule";
import { LoanModule } from "../components/LoanModule";
import { MangaModule } from "../components/MangaModule";
import { MapModule } from "../components/MapModule";
import { MarkdownModule } from "../modules/markdown_module/MarkdownModule";
import { MysticModule } from "../components/MysticModule";
import { NewsModule } from "../components/NewsModule";
import { NoteModule } from "../modules/note_module/NoteModule";
import { NovelEditorModule } from "../components/NovelEditorModule";
import { PdfModule } from "../modules/pdf_module/PdfModule";
import { PhoneModule } from "../components/PhoneModule";
import { PhotoBoothModule } from "../components/PhotoBoothModule";
import { PianoModule } from "../components/PianoModule";
import { PortfolioModule } from "../components/PortfolioModule";
import { PvzGameModule } from "../components/PvzGameModule";
import { QrCodeModule } from "../components/QrCodeModule";
import { RecipeFinderModule } from "../components/RecipeFinderModule";
import { RecordModule } from "../components/RecordModule";
import { RegexModule } from "../components/RegexModule";
import { RequestModule } from "../components/RequestModule";
import { ResponsiveViewerModule } from "../components/ResponsiveViewerModule";
import { RPGModule } from "../components/RPGModule";
import { ScreenCaptureModule } from "../components/ScreenCaptureModule";
import { ScreenMirrorModule } from "../components/ScreenMirrorModule";
import { ShutdownModule } from "../modules/power_module/ShutdownModule";
import { SignatureModule } from "../modules/signature_module/SignatureModule";
import { SnippetModule } from "../components/SnippetModule";
import { SocialModule } from "../components/SocialModule";
import { Space3DModule } from "../components/Space3DModule";
import { SpeedReaderModule } from "../components/SpeedReaderModule";
import { SpeedTestModule } from "../components/SpeedTestModule";
import { SystemInfoModule } from "../modules/system_info_module/SystemInfoModule";
import { TableCreatorModule } from "../modules/table_module/TableCreatorModule";
import { TaskModule } from "../modules/task_module/TaskModule";
import { TerminalModule } from "../modules/terminal_module/TerminalModule";
import { TimerModule } from "../modules/focus_module/TimerModule";
import { TowerDefenseModule } from "../components/TowerDefenseModule";
import { TranslateModule } from "../components/TranslateModule";
import { TypographyModule } from "../components/TypographyModule";
import { UIBuilderModule } from "../components/UIBuilderModule";
import { VaultModule } from "../components/VaultModule";
import { WaterBodyModule } from "../components/WaterBodyModule";
import { WeatherModule } from "../components/WeatherModule";
import { WhiteboardModule } from "../components/WhiteboardModule";
import { WikiModule } from "../components/WikiModule";
import { WordModule } from "../modules/word_module/WordModule";
import { SettingsModule } from "../modules/settings_module/SettingsModule";

export const APP_COMPONENTS: Record<string, React.ComponentType<any>> = {
  tasks: TaskModule,
  notes: NoteModule,
  timer: TimerModule,
  calc: CalcModule,
  translate: TranslateModule,
  map: MapModule,
  settings: SettingsModule,
  weather: WeatherModule,
  socials: SocialModule,
  qrcode: QrCodeModule,
  crypto: CryptoModule,
  decode: DecodeModule,
  news: NewsModule,
  camera: CameraModule,
  vault: VaultModule,
  whiteboard: WhiteboardModule,
  capture: ScreenCaptureModule,
  record: RecordModule,
  converter: ConverterModule,
  system: SystemInfoModule,
  speedtest: SpeedTestModule,
  shutdown: ShutdownModule,
  code: CodeModule,
  markdown: MarkdownModule,
  git: GitModule,
  budget: BudgetModule,
  json: JsonModule,
  request: RequestModule,
  regex: RegexModule,
  gen: GenDataModule,
  calendar: CalendarModule,
  snippets: SnippetModule,
  json_tools: JsonToolsModule,
  jwt: JwtModule,
  design: DesignModule,
  typography: TypographyModule,
  icons: IconPickerModule,
  devops: CronDockerModule,
  tree: FileExplorerModule,
  family: FamilyTreeModule,
  portfolio: PortfolioModule,
  loan: LoanModule,
  breathe: BreathingModule,
  health: WaterBodyModule,
  reader: SpeedReaderModule,
  pdf: PdfModule,
  sign: SignatureModule,
  "img-compress": ImageCompressorModule,
  wheel: DecisionWheelModule,
  recipe: RecipeFinderModule,
  mystic: MysticModule,
  "fb-tools": FacebookToolsModule,
  dice: DiceRollerModule,
  goals: GoalTrackerModule,
  table: TableCreatorModule,
  ai: AIChatModule,
  "bug-report": BugReportModule,
  responsive: ResponsiveViewerModule,
  library: LibraryModule,
  piano: PianoModule,
  terminal: TerminalModule,
  wiki: WikiModule,
  game: GameModule,
  rpg: RPGModule,
  def: TowerDefenseModule,
  pvz: PvzGameModule,
  manga: MangaModule,
  novel: NovelEditorModule,
  uibuilder: UIBuilderModule,
  space3d: Space3DModule,
  anim: FrameAnimationUltimate,
  clock: ClockModule,
  "photo-booth": PhotoBoothModule,
  phone: PhoneModule,
  mirror: ScreenMirrorModule,
  hourglass: HourglassModule,
  excel: ExcelModule,
  word: WordModule,
  about: AboutModule,
  license: LicenseModule,
};
