import { useState, useEffect } from "react";
// 1. Bỏ import 'open' từ shell, thêm WebviewWindow
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  Newspaper,
  Globe,
  Cpu,
  TrendingUp,
  Activity,
  Tv,
  Award,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Clock,
  ImageOff,
} from "lucide-react";

const CATEGORIES = [
  { id: "tin-moi-nhat", label: "Mới nhất", icon: Clock },
  { id: "the-gioi", label: "Thế giới", icon: Globe },
  { id: "kinh-doanh", label: "Kinh doanh", icon: TrendingUp },
  { id: "so-hoa", label: "Công nghệ", icon: Cpu },
  { id: "the-thao", label: "Thể thao", icon: Award },
  { id: "giai-tri", label: "Giải trí", icon: Tv },
  { id: "suc-khoe", label: "Sức khỏe", icon: Activity },
  { id: "giao-duc", label: "Giáo dục", icon: BookOpen },
];

interface Article {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  description: string;
}

export const NewsModule = () => {
  const [activeCategory, setActiveCategory] = useState("tin-moi-nhat");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const rssUrl = `https://vnexpress.net/rss/${activeCategory}.rss`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
        rssUrl
      )}`;

      const res = await fetch(apiUrl);
      const data = await res.json();

      if (data.status === "ok") {
        const processedItems = data.items.map((item: any) => {
          let imageUrl = "";
          if (item.enclosure && item.enclosure.link)
            imageUrl = item.enclosure.link;
          else if (item.thumbnail) imageUrl = item.thumbnail;
          else {
            const imgMatch = item.description.match(/src=["']([^"']+)["']/);
            if (imgMatch) imageUrl = imgMatch[1];
          }

          const cleanDesc = item.description
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();

          return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            thumbnail: imageUrl,
            description:
              cleanDesc.length > 120
                ? cleanDesc.substring(0, 120) + "..."
                : cleanDesc,
          };
        });
        setArticles(processedItems);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  // --- 2. HÀM MỞ BẰNG WEBVIEW OVERDESK ---
  const openArticleInWebview = async (url: string, title: string) => {
    try {
      // Tạo label duy nhất để mở được nhiều bài báo cùng lúc
      const label = `news-${Date.now()}`;

      const webview = new WebviewWindow(label, {
        url: url,
        title: title, // Tiêu đề cửa sổ là tiêu đề bài báo
        width: 1000,
        height: 800,
        resizable: true,
        decorations: true,
        center: true,
        focus: true,
      });

      webview.once("tauri://error", (e) => console.error("Webview error:", e));
    } catch (error) {
      console.error("Cannot create window:", error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Mới cập nhật";
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return "Vừa xong";
      if (hours < 24) return `${hours} giờ trước`;
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }).format(date);
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      {/* SIDEBAR CATEGORIES */}
      <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-indigo-500 text-white shadow-md"
                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <cat.icon size={18} />
            <span className="text-xs font-bold">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Newspaper className="text-indigo-500" size={20} /> VNExpress
          </h2>
          <button
            onClick={fetchNews}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-24 h-24 bg-slate-200 dark:bg-white/10 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {articles.map((item, idx) => (
                <div
                  key={idx}
                  // 3. Gọi hàm mở Webview
                  onClick={() => openArticleInWebview(item.link, item.title)}
                  className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-black/20 relative flex items-center justify-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (
                            e.target as HTMLImageElement
                          ).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 flex items-center justify-center text-slate-300 ${
                        item.thumbnail ? "hidden" : ""
                      }`}
                    >
                      <ImageOff size={20} />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-500 transition-colors mb-1 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed opacity-90">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        <Clock size={10} /> {formatDate(item.pubDate)}
                      </span>
                      <ExternalLink
                        size={12}
                        className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
