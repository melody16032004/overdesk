import { useState } from "react";
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
  Monitor,
  Download,
  Link,
  Sparkles,
  CheckCircle2,
  Hash,
  Calculator,
  BarChart3,
  Video,
  Play,
  AlertCircle,
  Wand2,
  RotateCcw,
} from "lucide-react";

// --- DATA & CONFIG ---
const TEXT_STYLES = [
  {
    id: "bold_serif",
    name: "Đậm (Serif)",
    map: "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  },
  {
    id: "bold_sans",
    name: "Đậm (Sans)",
    map: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
  },
  {
    id: "italic_serif",
    name: "Nghiêng (Serif)",
    map: "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧0123456789",
  },
  {
    id: "italic_sans",
    name: "Nghiêng (Sans)",
    map: "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789",
  },
  {
    id: "script",
    name: "Viết tay",
    map: "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏0123456789",
  },
  {
    id: "monospace",
    name: "Máy đánh chữ",
    map: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝐧𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  },
  {
    id: "bubble",
    name: "Bong bóng",
    map: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ0123456789",
  },
];

const NORMAL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const AI_TEMPLATES = [
  {
    label: "Bán hàng",
    text: "🔥 SIÊU SALE ĐỔ BỘ 🔥\nCơ hội duy nhất trong năm! Giảm ngay 50% cho 50 khách hàng đầu tiên.\n👉 Inbox ngay để chốt đơn: m.me/shopcuaban\n#sale #khuyenmai",
  },
  {
    label: "Deep",
    text: "Đôi khi, hạnh phúc không phải là đích đến, mà là hành trình chúng ta đang đi. ✨\nChúc cả nhà buổi tối an yên!\n#mood #quotes #life",
  },
  {
    label: "Tương tác",
    text: "Theo mọi người thì Tiền hay Tình quan trọng hơn? 🤔\nComment ý kiến của bạn xuống dưới nhé! 👇",
  },
];

export const FacebookToolsModule = () => {
  const [activeTab, setActiveTab] = useState<
    "mockup" | "text" | "downloader" | "tools"
  >("mockup");

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] text-slate-900 font-sans overflow-hidden relative">
      {/* HEADER */}
      <div className="flex-none p-3 md:p-4 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between z-20 overflow-x-auto">
        <div className="flex items-center gap-2 mr-4">
          <div className="p-2 bg-[#1877F2] rounded-full text-white shadow-lg shadow-blue-500/20">
            <Facebook size={20} fill="currentColor" strokeWidth={0} />
          </div>
          <span className="font-bold text-[#1877F2] text-lg tracking-tight hidden sm:block whitespace-nowrap">
            Meta Creator
          </span>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: "mockup", label: "Mockup", icon: Monitor },
            { id: "text", label: "Font", icon: Type },
            { id: "downloader", label: "Tải Video", icon: Download },
            { id: "tools", label: "Tiện ích", icon: Calculator },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-[#1877F2] shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <tab.icon size={14} />{" "}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "mockup" && <PostMockupView />}
        {activeTab === "text" && <FancyTextView />}
        {activeTab === "downloader" && <VideoDownloaderView />}
        {activeTab === "tools" && <UtilityToolsView />}
      </div>
    </div>
  );
};

// --- 1. POST MOCKUP VIEW ---
const PostMockupView = () => {
  // State
  const [name, setName] = useState("Admin Đẹp Trai");
  const [time, setTime] = useState("Vừa xong");
  const [content, setContent] = useState(
    "Giao diện mới xịn quá cả nhà ơi! 😍\nThử ngay tính năng tạo Fake Post siêu chuẩn này nhé."
  );
  const [likes, setLikes] = useState("10K");
  const [comments, setComments] = useState("2.5K");
  const [shares, setShares] = useState("500");
  const [image, setImage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [reactions, setReactions] = useState(["like", "love"]);

  // Handlers
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "post" | "avatar"
  ) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      if (type === "post") setImage(url);
      else setAvatar(url);
    }
  };

  const toggleReaction = (type: string) => {
    if (reactions.includes(type))
      setReactions(reactions.filter((r) => r !== type));
    else setReactions([...reactions, type]);
  };

  const insertTemplate = (text: string) => setContent(text);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-[#f0f2f5]">
      {/* SETTINGS (Scrollable) */}
      <div className="w-full lg:w-96 bg-white border-r border-slate-200 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar shrink-0 order-2 lg:order-1 h-[50vh] lg:h-full z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
            <Smartphone size={14} /> Thông tin bài viết
          </h3>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Tên người đăng
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="w-24">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Thời gian
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isVerified
                    ? "bg-blue-500 border-blue-500"
                    : "border-slate-300"
                }`}
              >
                {isVerified && <Check size={10} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={isVerified}
                onChange={() => setIsVerified(!isVerified)}
                className="hidden"
              />
              <span className="text-xs font-medium text-slate-700">
                Tích xanh
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  darkMode
                    ? "bg-slate-800 border-slate-800"
                    : "border-slate-300"
                }`}
              >
                {darkMode && <Check size={10} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="hidden"
              />
              <span className="text-xs font-medium text-slate-700">
                Dark Mode
              </span>
            </label>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-500">
                Nội dung (Caption)
              </label>
              <div className="flex gap-1">
                {AI_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => insertTemplate(t.text)}
                    className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100 flex items-center gap-1"
                  >
                    <Wand2 size={8} /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Likes
              </label>
              <input
                type="text"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Cmt
              </label>
              <input
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Share
              </label>
              <input
                type="text"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Biểu cảm hiển thị
            </label>
            <div className="flex gap-2">
              {["like", "love", "haha", "wow", "sad", "angry"].map((r) => (
                <button
                  key={r}
                  onClick={() => toggleReaction(r)}
                  className={`p-1.5 rounded-full border transition-all ${
                    reactions.includes(r)
                      ? "bg-blue-100 border-blue-300 opacity-100"
                      : "border-slate-100 opacity-40 hover:opacity-100"
                  }`}
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

          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-xs text-slate-500 font-bold transition-colors">
                <ImageIcon size={16} /> Upload Ảnh Post
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "post")}
                />
              </label>
              {image && (
                <button
                  onClick={() => setImage(null)}
                  className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-xs text-slate-500 font-bold transition-colors">
                <ImageIcon size={16} /> Upload Avatar
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "avatar")}
                />
              </label>
              {avatar && (
                <button
                  onClick={() => setAvatar(null)}
                  className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW (Sticky) */}
      <div className="flex-1 bg-[#f0f2f5] p-4 lg:p-10 flex flex-col items-center justify-center overflow-y-auto min-h-[300px] lg:min-h-0 order-1 lg:order-2">
        {/* THE MOCKUP CARD */}
        <div
          className={`w-full max-w-[450px] rounded-xl shadow-md overflow-hidden transition-colors duration-300 ${
            darkMode
              ? "bg-[#242526] border border-[#3e4042]"
              : "bg-white border border-slate-200"
          }`}
        >
          {/* Header */}
          <div className="p-3 flex items-start justify-between">
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden border border-slate-100 shrink-0">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <ImageIcon size={18} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h4
                    className={`font-bold text-[15px] leading-tight ${
                      darkMode ? "text-[#e4e6eb]" : "text-[#050505]"
                    }`}
                  >
                    {name}
                  </h4>
                  {isVerified && (
                    <CheckCircle2
                      size={12}
                      className=" fill-[#1877F2] text-white"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[13px] mt-0.5">
                  <span
                    className={`${
                      darkMode ? "text-[#b0b3b8]" : "text-slate-500"
                    }`}
                  >
                    {time}
                  </span>
                  <span
                    className={`${
                      darkMode ? "text-[#b0b3b8]" : "text-slate-500"
                    }`}
                  >
                    ·
                  </span>
                  <Globe
                    size={12}
                    className={`${
                      darkMode ? "text-[#b0b3b8]" : "text-slate-500"
                    }`}
                  />
                </div>
              </div>
            </div>
            <button
              className={`${darkMode ? "text-[#b0b3b8]" : "text-slate-500"}`}
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Content */}
          <div
            className={`px-3 pb-3 text-[15px] whitespace-pre-line leading-snug ${
              darkMode ? "text-[#e4e6eb]" : "text-[#050505]"
            }`}
          >
            {content}
          </div>

          {/* Image */}
          {image && (
            <div className="w-full relative bg-black">
              <img
                src={image}
                className="w-full h-auto object-contain max-h-[500px]"
                alt="Post"
              />
            </div>
          )}

          {/* Stats */}
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {reactions.length > 0 ? (
                <div className="flex -space-x-1">
                  {reactions.slice(0, 3).map((r) => (
                    <div
                      key={r}
                      className="z-10 bg-white rounded-full p-[1px] relative"
                    >
                      <img
                        src={`https://raw.githubusercontent.com/Llike/Reaction/main/img/${r}.png`}
                        alt={r}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ThumbsUp size={14} className="text-slate-400" />
              )}
              <span
                className={`text-[13px] ml-1.5 ${
                  darkMode ? "text-[#b0b3b8]" : "text-slate-500"
                } hover:underline cursor-pointer`}
              >
                {likes}
              </span>
            </div>
            <div
              className={`flex gap-3 text-[13px] ${
                darkMode ? "text-[#b0b3b8]" : "text-slate-500"
              }`}
            >
              <span className="hover:underline cursor-pointer">
                {comments} bình luận
              </span>
              <span className="hover:underline cursor-pointer">
                {shares} chia sẻ
              </span>
            </div>
          </div>

          <div
            className={`mx-3 h-px ${
              darkMode ? "bg-[#3e4042]" : "bg-slate-200"
            }`}
          ></div>

          {/* Actions */}
          <div className="px-1 py-1 flex items-center justify-between">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium text-[13px] transition-colors ${
                darkMode
                  ? "text-[#b0b3b8] hover:bg-[#3a3b3c]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <ThumbsUp size={18} /> Thích
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium text-[13px] transition-colors ${
                darkMode
                  ? "text-[#b0b3b8] hover:bg-[#3a3b3c]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <MessageCircle size={18} /> Bình luận
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md font-medium text-[13px] transition-colors ${
                darkMode
                  ? "text-[#b0b3b8] hover:bg-[#3a3b3c]"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Share2 size={18} /> Chia sẻ
            </button>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 bg-white/50 px-3 py-1 rounded-full border border-slate-200 backdrop-blur-sm">
          💡 Mẹo: Nhấn <b>Windows + Shift + S</b> (PC) hoặc <b>Chụp màn hình</b>{" "}
          (Mobile) để lưu ảnh này.
        </div>
      </div>
    </div>
  );
};

// --- 2. FANCY TEXT VIEW ---
const FancyTextView = () => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const convertText = (text: string, map: string) => {
    return text
      .split("")
      .map((char) => {
        const index = NORMAL_CHARS.indexOf(char);
        if (index !== -1) {
          const mapArray = [...map];
          return mapArray[index] || char;
        }
        return char;
      })
      .join("");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-8 max-w-4xl mx-auto overflow-y-auto custom-scrollbar">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Type size={14} /> Nhập nội dung
          </label>
          <button
            onClick={() => setInputText("")}
            className="text-xs text-blue-500 hover:underline"
          >
            Xóa hết
          </button>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Gõ nội dung vào đây để biến hóa..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-lg outline-none focus:border-blue-500 focus:bg-white transition-all h-32 resize-none"
        />
      </div>

      <div className="grid gap-3">
        {TEXT_STYLES.map((style) => {
          const result = convertText(
            inputText || "Facebook Font Generator",
            style.map
          );
          return (
            <div
              key={style.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {style.name}
                </div>
                <div className="text-base md:text-lg text-slate-800 break-words font-medium">
                  {result}
                </div>
              </div>
              <button
                onClick={() => handleCopy(result, style.id)}
                className={`p-2.5 rounded-lg transition-all shrink-0 ${
                  copiedId === style.id
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white"
                }`}
              >
                {copiedId === style.id ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 3. VIDEO DOWNLOADER VIEW ---
const VideoDownloaderView = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (e) {
      alert("Vui lòng cho phép dán");
    }
  };

  const analyzeLink = () => {
    if (!url.includes("facebook.com") && !url.includes("fb.watch"))
      return alert("Link không hợp lệ! Hãy nhập link Facebook.");

    setLoading(true);
    setResult(null);

    // Magic Link Logic
    setTimeout(() => {
      let magicUrl = url.replace("www.facebook.com", "mbasic.facebook.com");
      if (url.includes("fb.watch")) {
        magicUrl = url;
      }

      setResult({
        type: url.includes("/reel/")
          ? "Reels"
          : url.includes("/stories/")
          ? "Story"
          : "Video",
        original: url,
        magic: magicUrl,
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-50 text-[#1877F2] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Video size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Tải Video & Story
          </h2>
          <p className="text-slate-500 text-sm">
            Hỗ trợ tải Reels, Watch và Story chất lượng cao.
          </p>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex flex-col md:flex-row gap-2 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Dán link bài viết vào đây..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
            />
            <Link
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            {!url && (
              <button
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-500 rounded-lg hover:bg-slate-100"
              >
                PASTE
              </button>
            )}
          </div>
          <button
            onClick={analyzeLink}
            disabled={loading || !url}
            className="h-12 px-8 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <RotateCcw className="animate-spin" size={20} />
            ) : (
              <Download size={20} />
            )}
            <span className="hidden md:inline">Get Video</span>
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle2 size={16} />
                </div>
                <span className="font-bold text-sm text-slate-700">
                  Đã tìm thấy {result.type}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 truncate max-w-[150px]">
                {result.original}
              </span>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-xl border border-yellow-200 flex items-start gap-3 text-left">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <b>Mẹo tải nhanh (Magic Link):</b>
                  <br />
                  Hệ thống sẽ chuyển bạn sang giao diện <b>Mbasic</b>. Tại đó,
                  video sẽ hiển thị như trình phát bình thường. Bạn chỉ cần bấm
                  vào video rồi chọn <b>"Tải xuống"</b> hoặc nhấn giữ video.
                </div>
              </div>

              <a
                href={result.magic}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Play size={24} fill="currentColor" />
                Mở Server Tải Xuống
              </a>

              <p className="mt-4 text-xs text-slate-400">
                Nếu là Story riêng tư, bạn cần đăng nhập Facebook trên trình
                duyệt trước.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 4. UTILITY TOOLS VIEW ---
const UtilityToolsView = () => {
  const [uid, setUid] = useState("");
  const [engagement, setEngagement] = useState<{
    likes: number;
    comments: number;
    followers: number;
  }>({ likes: 0, comments: 0, followers: 0 });
  const [er, setEr] = useState<number | null>(null);

  const generateLinks = () => {
    if (!uid.trim()) return [];
    const cleanId = uid.trim().replace(/[^a-zA-Z0-9.]/g, "");
    return [
      {
        label: "Messenger Chat",
        url: `https://m.me/${cleanId}`,
        icon: <MessageCircle size={16} />,
        color: "text-blue-500",
      },
      {
        label: "Profile Page",
        url: `https://facebook.com/${cleanId}`,
        icon: <Facebook size={16} />,
        color: "text-blue-700",
      },
      {
        label: "Find User ID",
        url: `https://lookup-id.com/#${cleanId}`,
        icon: <Hash size={16} />,
        color: "text-orange-500",
      },
    ];
  };

  const calculateER = () => {
    if (engagement.followers === 0) return;
    const rate =
      ((engagement.likes + engagement.comments) / engagement.followers) * 100;
    setEr(parseFloat(rate.toFixed(2)));
  };

  const links = generateLinks();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 lg:p-8">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {/* CARD 1: LINK GENERATOR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
            <Link size={16} /> Quick Links
          </h3>
          <div className="relative mb-6">
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Nhập Username (VD: zuck)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 outline-none focus:border-[#1877F2] transition-all font-medium text-sm"
            />
            <Facebook
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
          <div className="space-y-2">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all group no-underline"
              >
                <span
                  className={`flex items-center gap-3 text-sm font-bold ${link.color}`}
                >
                  {link.icon} {link.label}
                </span>
                <Sparkles
                  size={14}
                  className="text-slate-400 group-hover:text-blue-500"
                />
              </a>
            ))}
            {links.length === 0 && (
              <div className="text-center text-xs text-slate-400 py-2">
                Nhập username để tạo link
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: SEEDING CALCULATOR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Engagement Rate (ER)
          </h3>
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Likes
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border rounded-lg p-2 text-sm"
                  onChange={(e) =>
                    setEngagement({
                      ...engagement,
                      likes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Comments
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border rounded-lg p-2 text-sm"
                  onChange={(e) =>
                    setEngagement({
                      ...engagement,
                      comments: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Followers
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border rounded-lg p-2 text-sm"
                onChange={(e) =>
                  setEngagement({
                    ...engagement,
                    followers: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <button
            onClick={calculateER}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all"
          >
            Tính Tỷ lệ
          </button>

          {er !== null && (
            <div className="mt-4 text-center animate-in zoom-in">
              <div className="text-3xl font-black text-[#1877F2]">{er}%</div>
              <div className="text-xs text-slate-500">Tỷ lệ tương tác</div>
              <div className="mt-2 text-[10px] font-bold px-2 py-1 rounded bg-slate-100 inline-block text-slate-600">
                {er > 3 ? "🔥 Tốt" : er > 1 ? "👌 Ổn" : "😴 Thấp"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
