import React, { useState } from "react";
import {
  Facebook,
  Type,
  Image as ImageIcon,
  ThumbsUp,
  MessageCircle,
  Share2,
  Globe,
  MoreHorizontal,
  Copy,
  Check,
  X,
  Smartphone,
  Download,
  Link,
  CheckCircle2,
  Calculator,
  Video,
  RotateCcw,
  Upload,
  Zap,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

// =================================================================================================
// 0. CONFIG & CONSTANTS
// =================================================================================================

const TABS = [
  { id: "mockup", label: "Mockup Creator", icon: Smartphone },
  { id: "text", label: "Fancy Fonts", icon: Type },
  { id: "downloader", label: "Video Downloader", icon: Download },
  { id: "tools", label: "Power Tools", icon: Zap },
];

const TEXT_STYLES = [
  {
    id: "bold_serif",
    name: "Bold Serif",
    map: "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  },
  {
    id: "bold_sans",
    name: "Bold Sans",
    map: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
  },
  {
    id: "italic_serif",
    name: "Italic Serif",
    map: "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧0123456789",
  },
  {
    id: "italic_sans",
    name: "Italic Sans",
    map: "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789",
  },
  {
    id: "script",
    name: "Script",
    map: "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏0123456789",
  },
  {
    id: "monospace",
    name: "Monospace",
    map: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝐧𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  },
  {
    id: "bubble",
    name: "Bubble",
    map: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ0123456789",
  },
];

const NORMAL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// =================================================================================================
// MAIN COMPONENT
// =================================================================================================
export const FacebookToolsModule = () => {
  const [activeTab, setActiveTab] = useState("mockup");

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] font-sans text-slate-900 overflow-hidden">
      {/* HEADER */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1877F2] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Facebook size={20} fill="currentColor" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-800 leading-tight">
              Meta Creator
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              All-in-one Toolkit
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-white text-[#1877F2] shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50",
              )}
            >
              <tab.icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "mockup" && <PostMockupView />}
        {activeTab === "text" && <FancyTextView />}
        {activeTab === "downloader" && <VideoDownloaderView />}
        {activeTab === "tools" && <UtilityToolsView />}
      </div>
    </div>
  );
};

// =================================================================================================
// 1. MOCKUP CREATOR
// =================================================================================================
const PostMockupView = () => {
  const [config, setConfig] = useState({
    name: "Admin Đẹp Trai",
    time: "Just now",
    content:
      "Chào mừng bạn đến với giao diện mới! 🎉\nHãy thử tạo một bài viết giả lập ngay bây giờ.",
    likes: "12K",
    comments: "2.4K",
    shares: "850",
    image: null as string | null,
    avatar: null as string | null,
    isVerified: true,
    isDark: false,
    reactions: ["like", "love"] as string[],
  });

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "image" | "avatar",
  ) => {
    if (e.target.files?.[0]) {
      setConfig({ ...config, [key]: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const toggleReaction = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      reactions: prev.reactions.includes(type)
        ? prev.reactions.filter((r) => r !== type)
        : [...prev.reactions, type],
    }));
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-[#f0f2f5]">
      {/* SETTINGS PANEL */}
      <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar z-10 shadow-xl lg:shadow-none shrink-0 h-1/2 lg:h-full">
        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Profile Info
            </h3>
            <div className="space-y-3">
              <InputGroup
                label="Name"
                value={config.name}
                onChange={(v) => setConfig({ ...config, name: v })}
              />
              <InputGroup
                label="Time"
                value={config.time}
                onChange={(v) => setConfig({ ...config, time: v })}
              />
              <div className="flex gap-4 pt-1">
                <Toggle
                  label="Blue Tick"
                  checked={config.isVerified}
                  onChange={() =>
                    setConfig({ ...config, isVerified: !config.isVerified })
                  }
                />
                <Toggle
                  label="Dark Mode"
                  checked={config.isDark}
                  onChange={() =>
                    setConfig({ ...config, isDark: !config.isDark })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Content
            </h3>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all resize-none h-24"
              value={config.content}
              onChange={(e) =>
                setConfig({ ...config, content: e.target.value })
              }
              placeholder="Post content..."
            />
            <div className="grid grid-cols-2 gap-3">
              <UploadButton
                label="Upload Avatar"
                onChange={(e) => handleFile(e, "avatar")}
                active={!!config.avatar}
              />
              <UploadButton
                label="Upload Image"
                onChange={(e) => handleFile(e, "image")}
                active={!!config.image}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Metrics
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <InputGroup
                label="Likes"
                value={config.likes}
                onChange={(v) => setConfig({ ...config, likes: v })}
              />
              <InputGroup
                label="Cmts"
                value={config.comments}
                onChange={(v) => setConfig({ ...config, comments: v })}
              />
              <InputGroup
                label="Shares"
                value={config.shares}
                onChange={(v) => setConfig({ ...config, shares: v })}
              />
            </div>
            <div className="flex gap-2 justify-center pt-2">
              {["like", "love", "haha", "wow", "sad", "angry"].map((r) => (
                <button
                  key={r}
                  onClick={() => toggleReaction(r)}
                  className={clsx(
                    "p-1.5 rounded-full border transition-all",
                    config.reactions.includes(r)
                      ? "bg-blue-100 border-blue-400 opacity-100 scale-110"
                      : "border-slate-100 opacity-40 hover:opacity-100 hover:scale-110",
                  )}
                >
                  <img
                    src={`https://raw.githubusercontent.com/Llike/Reaction/main/img/${r}.png`}
                    alt={r}
                    className="w-5 h-5 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW AREA */}
      <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 lg:p-10 overflow-y-auto h-1/2 lg:h-full relative">
        <div
          className={clsx(
            "w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden transition-colors duration-300 transform scale-95 sm:scale-100 origin-center",
            config.isDark ? "bg-[#242526] border border-[#3e4042]" : "bg-white",
          )}
        >
          {/* Header */}
          <div className="p-4 flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100/10">
                {config.avatar ? (
                  <img
                    src={config.avatar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon size={18} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "font-bold text-[15px] leading-tight",
                      config.isDark ? "text-[#e4e6eb]" : "text-[#050505]",
                    )}
                  >
                    {config.name}
                  </span>
                  {config.isVerified && (
                    <CheckCircle2
                      size={13}
                      className=" fill-blue-500 text-white"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[13px] mt-0.5 font-medium">
                  <span
                    className={
                      config.isDark ? "text-[#b0b3b8]" : "text-slate-500"
                    }
                  >
                    {config.time}
                  </span>
                  <span
                    className={
                      config.isDark ? "text-[#b0b3b8]" : "text-slate-500"
                    }
                  >
                    ·
                  </span>
                  <Globe
                    size={12}
                    className={
                      config.isDark ? "text-[#b0b3b8]" : "text-slate-500"
                    }
                  />
                </div>
              </div>
            </div>
            <MoreHorizontal
              size={20}
              className={config.isDark ? "text-[#b0b3b8]" : "text-slate-500"}
            />
          </div>

          {/* Content */}
          <div
            className={clsx(
              "px-4 pb-3 text-[15px] whitespace-pre-line leading-relaxed",
              config.isDark ? "text-[#e4e6eb]" : "text-[#050505]",
            )}
          >
            {config.content}
          </div>

          {/* Image */}
          {config.image && (
            <div className="w-full bg-black relative">
              <img
                src={config.image}
                className="w-full h-auto max-h-[600px] object-contain"
              />
            </div>
          )}

          {/* Stats */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {config.reactions.length > 0 && (
                <div className="flex -space-x-1.5">
                  {config.reactions.slice(0, 3).map((r) => (
                    <div
                      key={r}
                      className="z-10 rounded-full border-[2px] border-white dark:border-[#242526]"
                    >
                      <img
                        src={`https://raw.githubusercontent.com/Llike/Reaction/main/img/${r}.png`}
                        className="w-4 h-4"
                      />
                    </div>
                  ))}
                </div>
              )}
              <span
                className={clsx(
                  "text-[13px] hover:underline pointer ml-1",
                  config.isDark ? "text-[#b0b3b8]" : "text-slate-500",
                )}
              >
                {config.likes}
              </span>
            </div>
            <div
              className={clsx(
                "flex gap-3 text-[13px]",
                config.isDark ? "text-[#b0b3b8]" : "text-slate-500",
              )}
            >
              <span>{config.comments} comments</span>
              <span>{config.shares} shares</span>
            </div>
          </div>

          {/* Action Bar */}
          <div
            className={clsx(
              "mx-4 h-px mb-1",
              config.isDark ? "bg-[#3e4042]" : "bg-slate-200",
            )}
          />
          <div className="px-2 pb-1 flex">
            {["Like", "Comment", "Share"].map((action, i) => (
              <div
                key={action}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium text-[14px] transition-colors pointer",
                  config.isDark
                    ? "text-[#b0b3b8] hover:bg-[#3a3b3c]"
                    : "text-slate-500 hover:bg-slate-100",
                )}
              >
                {i === 0 ? (
                  <ThumbsUp size={18} />
                ) : i === 1 ? (
                  <MessageCircle size={18} />
                ) : (
                  <Share2 size={18} />
                )}
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================================================
// 2. FANCY FONT GENERATOR (FIXED)
// =================================================================================================
const FancyTextView = () => {
  const [text, setText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const convert = (str: string, map: string) => {
    // [FIX] Chuyển map string thành array để xử lý ký tự Unicode
    const mapArray = [...map];
    return str
      .split("")
      .map((char) => {
        const idx = NORMAL_CHARS.indexOf(char);
        return idx !== -1 ? mapArray[idx] || char : char;
      })
      .join("");
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col items-center bg-slate-50 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-3xl space-y-6">
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something amazing here..."
              className="w-full h-32 md:h-full p-4 bg-transparent resize-none outline-none text-lg text-slate-800 placeholder:text-slate-400"
            />
            {text && (
              <button
                onClick={() => setText("")}
                className="absolute top-2 right-2 p-1 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {TEXT_STYLES.map((style) => {
            const result = convert(text || "Preview Text", style.map);
            const isCopied = copiedId === style.id;
            return (
              <div
                key={style.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    {style.name}
                  </div>
                  <div className="text-lg font-medium text-slate-800 truncate">
                    {result}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(result, style.id)}
                  className={clsx(
                    "p-2.5 rounded-lg transition-all shrink-0",
                    isCopied
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-slate-100 text-slate-500 group-hover:bg-blue-600 group-hover:text-white",
                  )}
                >
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =================================================================================================
// 3. VIDEO DOWNLOADER (FIXED MISSING FUNCTION)
// =================================================================================================
const VideoDownloaderView = () => {
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [videoType, setVideoType] = useState<"video" | "reel" | "story" | null>(
    null,
  );
  const [showMagicModal, setShowMagicModal] = useState(false);

  const SERVERS = [
    {
      id: "mbasic",
      name: "Server 1 (Magic)",
      desc: "Tải trực tiếp qua FB Basic",
      icon: Zap,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      id: "snapsave",
      name: "Server 2 (SnapSave)",
      desc: "Hỗ trợ 4K, Story",
      icon: Download,
      color: "text-green-500",
      url: "https://snapsave.app/vn",
      bg: "bg-green-500/10",
    },
    {
      id: "fdown",
      name: "Server 3 (FDown)",
      desc: "Tải Video cơ bản",
      icon: Globe,
      color: "text-blue-500",
      url: "https://fdown.net/",
      bg: "bg-blue-500/10",
    },
  ];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLink(text);
      if (text) handleAnalyze(text);
    } catch (e) {
      console.error("Paste failed:", e);
    }
  };

  const handleAnalyze = (inputUrl = link) => {
    if (!inputUrl.includes("facebook.com") && !inputUrl.includes("fb.watch"))
      return;
    setStatus("loading");
    setTimeout(() => {
      if (inputUrl.includes("/reel/")) setVideoType("reel");
      else if (inputUrl.includes("/stories/")) setVideoType("story");
      else setVideoType("video");
      setStatus("success");
    }, 800);
  };

  const openUrl = async (targetUrl: string) => {
    try {
      // @ts-ignore
      if (window.__TAURI_INTERNALS__) {
        await open(targetUrl);
      } else {
        window.open(targetUrl, "_blank");
      }
    } catch (e) {
      window.open(targetUrl, "_blank");
    }
  };

  // [FIXED] Đã thêm hàm này để mở Modal
  const requestMagicLink = () => {
    setShowMagicModal(true);
  };

  const executeMagicLink = () => {
    let magicUrl = link.replace("www.facebook.com", "mbasic.facebook.com");
    if (link.includes("fb.watch")) magicUrl = link;
    openUrl(magicUrl);
    setShowMagicModal(false);
  };

  const openExternalTool = (toolUrl: string) => {
    openUrl(toolUrl);
  };

  return (
    <div className="h-full flex items-center justify-center p-4 bg-slate-50 overflow-y-auto relative">
      {/* MAGIC MODAL */}
      {showMagicModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-yellow-600">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-bold">Magic Link Guide</h3>
            </div>
            <div className="text-sm text-slate-600 space-y-3 mb-6">
              <p>
                Hệ thống sẽ mở giao diện <b>Facebook Basic</b> trên trình duyệt.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500">
                1. Bấm vào video để phát.
                <br />
                2. Bấm vào dấu <b>3 chấm</b> hoặc nhấn giữ video.
                <br />
                3. Chọn <b>"Tải xuống video"</b>.
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMagicModal(false)}
                className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-bold text-sm"
              >
                Huỷ
              </button>
              <button
                onClick={executeMagicLink}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20"
              >
                Mở Trình Duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN UI */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-br from-[#1877F2] to-[#0056b3] p-8 text-white text-center relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-10"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner relative z-10">
            <Download size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-1 relative z-10">
            Smart Downloader
          </h2>
          <p className="text-blue-100 text-sm opacity-80 relative z-10">
            Hỗ trợ Story, Reels, Video 4K & Private
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <div className="relative flex-1 group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                {status === "loading" ? (
                  <RotateCcw className="animate-spin" size={18} />
                ) : (
                  <Link size={18} />
                )}
              </div>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze(link)}
                placeholder="Dán link Facebook vào đây (Ctrl + V)"
                className="w-full h-14 pl-11 pr-24 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700"
              />
              <button
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-sm"
              >
                PASTE
              </button>
            </div>

            <button
              onClick={() => handleAnalyze(link)}
              disabled={status === "loading" || !link}
              className="w-full h-12 bg-[#1877F2] hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {status === "loading" ? "Đang phân tích..." : "Phân tích Link"}
            </button>
          </div>

          {status === "success" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <div
                  className={clsx(
                    "p-3 rounded-full",
                    videoType === "story"
                      ? "bg-pink-100 text-pink-600"
                      : "bg-blue-100 text-blue-600",
                  )}
                >
                  {videoType === "story" ? (
                    <RotateCcw size={20} />
                  ) : (
                    <Video size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-700 capitalize">
                    {videoType || "Video"} Facebook
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{link}</p>
                </div>
                <div className="ml-auto">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                  Chọn phương thức tải
                </label>
                <div className="grid gap-3">
                  {SERVERS.map((server) => (
                    <button
                      key={server.id}
                      onClick={() =>
                        server.id === "mbasic"
                          ? requestMagicLink()
                          : openExternalTool(server.url!)
                      }
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            server.bg,
                            server.color,
                          )}
                        >
                          <server.icon size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                            {server.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {server.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-slate-300 group-hover:text-blue-500"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =================================================================================================
// 4. UTILITY TOOLS
// =================================================================================================
const UtilityToolsView = () => {
  const [uid, setUid] = useState("");
  const openUrl = async (targetUrl: string) => {
    try {
      // @ts-ignore
      if (window.__TAURI__) await open(targetUrl);
      else window.open(targetUrl, "_blank");
    } catch (e) {
      window.open(targetUrl, "_blank");
    }
  };

  const links = [
    {
      label: "Messenger",
      url: `https://m.me/${uid}`,
      icon: MessageCircle,
      color: "text-blue-500",
    },
    {
      label: "Profile",
      url: `https://facebook.com/${uid}`,
      icon: Facebook,
      color: "text-blue-700",
    },
    {
      label: "Graph API",
      url: `https://graph.facebook.com/${uid}/picture?type=large`,
      icon: ImageIcon,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="h-full p-4 lg:p-10 overflow-y-auto custom-scrollbar flex flex-col items-center">
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <Link size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Quick Links</h3>
              <p className="text-xs text-slate-500">
                Generate direct links from UID
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Enter Username / UID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 font-medium"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {links.map((l, i) => (
                <button
                  key={i}
                  onClick={() => openUrl(uid ? l.url : "#")}
                  disabled={!uid}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-xl border transition-all group w-full",
                    uid
                      ? "bg-white border-slate-100 hover:border-orange-200 hover:bg-orange-50 pointer"
                      : "bg-slate-50 border-transparent opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <l.icon size={18} className={l.color} />
                    <span className="text-sm font-bold text-slate-700">
                      {l.label}
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-orange-400"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Placeholder for more tools */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Engagement Calc</h3>
              <p className="text-xs text-slate-500">
                Calculate Engagement Rate
              </p>
            </div>
          </div>
          <div className="text-center py-8 text-slate-400 text-sm">
            Coming Soon...
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const InputGroup = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all"
    />
  </div>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <label className="flex items-center gap-2 pointer select-none">
    <div
      className={clsx(
        "w-9 h-5 rounded-full relative transition-colors",
        checked ? "bg-blue-500" : "bg-slate-300",
      )}
    >
      <div
        className={clsx(
          "w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </div>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={onChange}
    />
    <span className="text-xs font-bold text-slate-600">{label}</span>
  </label>
);

const UploadButton = ({
  label,
  onChange,
  active,
}: {
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  active: boolean;
}) => (
  <label
    className={clsx(
      "flex flex-col items-center justify-center h-20 border border-dashed rounded-xl pointer transition-all gap-1",
      active
        ? "border-blue-500 bg-blue-50 text-blue-600"
        : "border-slate-300 hover:bg-slate-50 text-slate-400",
    )}
  >
    <Upload size={18} />
    <span className="text-[10px] font-bold">{label}</span>
    <input
      type="file"
      className="hidden"
      accept="image/*"
      onChange={onChange}
    />
  </label>
);
