import { useState, useEffect } from "react";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  ImageOff,
} from "lucide-react";
import { Article } from "./types/news_type";
import { formatDate, openArticleInWebview } from "./helper/news_helper";
import { Sidebar } from "./components/Sidebar";

export const NewsModule = () => {
  const [activeCategory, setActiveCategory] = useState("tin-moi-nhat");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const rssUrl = `https://vnexpress.net/rss/${activeCategory}.rss`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
        rssUrl,
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

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      {/* SIDEBAR CATEGORIES */}
      <Sidebar
        setActiveCategory={setActiveCategory}
        activeCategory={activeCategory}
      />

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
                  className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all pointer group"
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
