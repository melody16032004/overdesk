import { AboutModule } from "../modules/about_module/AboutModule";
import { AIChatModule } from "../modules/ai_module/AIChatModule";
import { FrameAnimationUltimate } from "../modules/anim_module/AnimationsModule";
import { BreathingModule } from "../components/BreathingModule";
import { BudgetModule } from "../modules/budget_module/BudgetModule";
import { BugReportModule } from "../modules/bug_module/BugReportModule";
import { CalcModule } from "../modules/calc_module/CalcModule";
import { CalendarModule } from "../modules/calendar_module/CalendarModule";
import { CameraModule } from "../modules/camera_module/CameraModule";
import { ClockModule } from "../components/ClockModule";
import { CodeModule } from "../modules/code_module/CodeModule";
import { ConverterModule } from "../modules/converter_module/ConverterModule";
import { CronDockerModule } from "../modules/devops_module/CronDockerModule";
import { CryptoModule } from "../components/CryptoModule";
import { DecisionWheelModule } from "../components/DecisionWheelModule";
import { DecodeModule } from "../modules/decoder_module/DecodeModule";
import { DesignModule } from "../modules/design_module/DesignModule";
import { DiceRollerModule } from "../components/DiceRollerModule";
import { ExcelModule } from "../modules/excel_module/ExcelModule";
import { FacebookToolsModule } from "../modules/fb_module/FacebookToolsModule";
import { FamilyTreeModule } from "../components/FamilyTreeModule";
import { FileExplorerModule } from "../modules/explorer_module/FileExplorerModule";
import { GameModule } from "../components/GameModule";
import { GenDataModule } from "../modules/gen_data_module/GenDataModule";
import { GitModule } from "../modules/git_module/GitModule";
import { GoalTrackerModule } from "../components/GoalTrackerModule";
import { HourglassModule } from "../modules/hourglass_module/HourglassModule";
import { IconPickerModule } from "../modules/icon_picker_module/IconPickerModule";
import { ImageCompressorModule } from "../modules/image_module/ImageCompressorModule";
import { JsonModule } from "../modules/json_module/JsonModule";
import { JsonToolsModule } from "../modules/json_tool_module/JsonToolsModule";
import { JwtModule } from "../modules/jwt_module/JwtModule";
import { LibraryModule } from "../modules/library_module/LibraryModule";
import { LicenseModule } from "../modules/license_module/LicenseModule";
import { LoanModule } from "../components/LoanModule";
import { MangaModule } from "../components/MangaModule";
import { MapModule } from "../modules/map_module/MapModule";
import { MarkdownModule } from "../modules/markdown_module/MarkdownModule";
import { MysticModule } from "../components/MysticModule";
import { NewsModule } from "../modules/news_module/NewsModule";
import { NoteModule } from "../modules/note_module/NoteModule";
import { NovelEditorModule } from "../components/NovelEditorModule";
import { PdfModule } from "../modules/pdf_module/PdfModule";
import { PhoneModule } from "../modules/device_hub_module/PhoneModule";
import { PhotoBoothModule } from "../modules/photo_booth_module/PhotoBoothModule";
import { PianoModule } from "../components/PianoModule";
import { PortfolioModule } from "../components/PortfolioModule";
import { PvzGameModule } from "../components/PvzGameModule";
import { QrCodeModule } from "../modules/qr_gen_module/QrCodeModule";
import { RecipeFinderModule } from "../components/RecipeFinderModule";
import { RecordModule } from "../modules/record_module/RecordModule";
import { RegexModule } from "../modules/regex_module/RegexModule";
import { RequestModule } from "../modules/postman_module/RequestModule";
import { ResponsiveViewerModule } from "../modules/responsive_view_module/ResponsiveViewerModule";
import { RPGModule } from "../components/RPGModule";
import { ScreenCaptureModule } from "../components/ScreenCaptureModule";
import { ScreenMirrorModule } from "../components/ScreenMirrorModule";
import { ShutdownModule } from "../modules/power_module/ShutdownModule";
import { SignatureModule } from "../modules/signature_module/SignatureModule";
import { SnippetModule } from "../modules/snippet_module/SnippetModule";
import { SocialModule } from "../modules/social_module/SocialModule";
import { Space3DModule } from "../modules/space3d_module/Space3DModule";
import { SpeedReaderModule } from "../components/SpeedReaderModule";
import { SpeedTestModule } from "../modules/speed_ping_module/SpeedTestModule";
import { SystemInfoModule } from "../modules/system_info_module/SystemInfoModule";
import { TableCreatorModule } from "../modules/table_module/TableCreatorModule";
import { TaskModule } from "../modules/task_module/TaskModule";
import { TerminalModule } from "../modules/terminal_module/TerminalModule";
import { TimerModule } from "../modules/focus_module/TimerModule";
import { TowerDefenseModule } from "../components/TowerDefenseModule";
import { TranslateModule } from "../modules/translate_module/TranslateModule";
import { TypographyModule } from "../modules/typography_module/TypographyModule";
import { UIBuilderModule } from "../modules/ui_builder_module/UIBuilderModule";
import { VaultModule } from "../components/VaultModule";
import { WaterBodyModule } from "../components/WaterBodyModule";
import { WeatherModule } from "../modules/weather_module/WeatherModule";
import { WhiteboardModule } from "../components/WhiteboardModule";
import { WikiModule } from "../components/WikiModule";
import { WordModule } from "../modules/word_module/WordModule";
import { SettingsModule } from "../modules/settings_module/SettingsModule";
import { PeriodicTableModule } from "../modules/periodic_module/PeriodicTableModule";
import SpaceObservatoryModule from "../modules/space_module/SpaceObservatoryModule";
import StargazerModule from "../modules/space_module/StargazerModule";
import { MailModule } from "../modules/mail_module/MailModule";
// import { MovieWatchModule } from "../modules/movie_module/MovieWatchModule";

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
  img_compress: ImageCompressorModule,
  wheel: DecisionWheelModule,
  recipe: RecipeFinderModule,
  mystic: MysticModule,
  fb_tools: FacebookToolsModule,
  dice: DiceRollerModule,
  goals: GoalTrackerModule,
  table: TableCreatorModule,
  ai: AIChatModule,
  bug_report: BugReportModule,
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
  photo_booth: PhotoBoothModule,
  phone: PhoneModule,
  mirror: ScreenMirrorModule,
  hourglass: HourglassModule,
  excel: ExcelModule,
  word: WordModule,
  about: AboutModule,
  license: LicenseModule,
  periodic: PeriodicTableModule,
  space: SpaceObservatoryModule,
  stargazer: StargazerModule,
  // movie: MovieWatchModule,
  email: MailModule,
};
