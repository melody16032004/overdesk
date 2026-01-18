import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  BookOpen,
  ChevronLeft,
  Settings,
  List,
  ArrowLeft,
  Search,
  Bookmark,
  X,
  Plus,
  Loader2,
  PlayCircle,
  Image as ImageIcon,
  Trash2,
  Library,
  Edit,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
  Filter,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import clsx from "clsx";

// --- 1. CONFIGURATION & UTILS ---

const STORAGE_KEY_PROGRESS = "manga_reading_progress_v35";
const STORAGE_KEY_CUSTOM_MANGAS = "manga_custom_list_v35";
const PAGES_PER_BATCH = 18;
const CHAPTER_BUFFER_SIZE = 8;
const PRELOAD_CHAPTER_THRESHOLD = 1;

const createSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

const getDynamicPageUrl = (
  slug: string,
  chapter: number,
  imageIndex: number,
  ext: string = "jpg"
) => {
  const rawUrl = `https://cloud-zzz.com/nettruyen/${slug}/${chapter}/${imageIndex}.${ext}?referer=nettruyenvio.com`;
  const encodedData = btoa(rawUrl);
  return `https://cdn.anhtruyen.com/image/${slug}/${chapter}/${imageIndex}.${ext}?data=${encodedData}`;
};

// --- TYPES ---
interface MangaPage {
  id: string;
  url: string;
}
interface Chapter {
  id: string;
  index: number;
  title: string;
  pages: MangaPage[];
}

interface MangaMetadata {
  id: string;
  title: string;
  author: string;
  slug: string;
  imageExt: string;
  cover: string;
  desc: string;
  status: "Ongoing" | "Completed";
  tags: string[];
  totalChapters: number;
  isCustom?: boolean;
}

interface ReadingProgress {
  mangaId: string;
  chapterIndex: number;
  pageIndex: number;
  timestamp: number;
}

interface MangaFormData {
  id?: string;
  title: string;
  author: string;
  coverUrl: string;
  slug: string;
  tags: string;
  desc: string;
  status: "Ongoing" | "Completed";
  imageExt: string;
  isCustom: boolean;
}

type Theme = "dark" | "light";
type ReadingMode = "vertical" | "horizontal_ltr" | "horizontal_rtl";
type FitMode = "width" | "height" | "original";

// --- COMPONENT: SMART IMAGE ---
const SmartImage = React.memo(
  ({
    src,
    alt,
    className,
    onLoadError,
    fitMode,
  }: {
    src: string;
    alt: string;
    className?: string;
    onLoadError: () => void;
    fitMode?: FitMode;
  }) => {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">(
      "loading"
    );
    useEffect(() => {
      setStatus("loading");
    }, [src]);

    return (
      <div
        className={`relative ${className} ${
          status === "loading"
            ? "min-h-[200px] bg-white/5 animate-pulse flex items-center justify-center"
            : ""
        }`}
      >
        {status === "loading" && (
          <Loader2 className="animate-spin text-slate-500" size={24} />
        )}
        {status !== "error" && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={clsx(
              className,
              status === "loading"
                ? "opacity-0 absolute inset-0"
                : "opacity-100 transition-opacity duration-300",
              fitMode === "height" ? "h-full w-auto mx-auto" : "w-full h-auto"
            )}
            onLoad={() => setStatus("loaded")}
            onError={() => {
              setStatus("error");
              onLoadError();
            }}
          />
        )}
      </div>
    );
  }
);

// --- API SIMULATION ---
const fetchChapterContent = async (
  manga: MangaMetadata,
  chapterIndex: number
): Promise<Chapter> => {
  const chapNum = chapterIndex + 1;
  return {
    id: `${manga.id}_ch${chapNum}`,
    index: chapterIndex,
    title: `Chapter ${chapNum}`,
    pages: Array.from({ length: 100 }, (_, p) => ({
      id: `p${p}`,
      url: getDynamicPageUrl(manga.slug, chapNum, p, manga.imageExt),
    })),
  };
};

export const MangaModule = () => {
  // --- STATE ---
  const [mangas, setMangas] = useState<MangaMetadata[]>([]);
  const [savedProgress, setSavedProgress] = useState<
    Record<string, ReadingProgress>
  >({});

  // UI State
  const [activeMangaId, setActiveMangaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter State
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterTag, setFilterTag] = useState<string>("All");

  // Form State
  const [formData, setFormData] = useState<MangaFormData>({
    title: "",
    author: "",
    coverUrl: "",
    slug: "",
    tags: "",
    desc: "",
    status: "Ongoing",
    imageExt: "jpg",
    isCustom: true,
  });

  // Reader State
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loadedChapters, setLoadedChapters] = useState<Chapter[]>([]);
  // const [isFetchingChapter, setIsFetchingChapter] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [visiblePageCount, setVisiblePageCount] = useState(PAGES_PER_BATCH);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [shouldResumeScroll, setShouldResumeScroll] = useState(false);

  // Settings
  const [theme, setTheme] = useState<Theme>("dark");
  const [readingMode, setReadingMode] = useState<ReadingMode>("vertical");
  const [fitMode, setFitMode] = useState<FitMode>("width");

  // Refs
  const readerContainerRef = useRef<HTMLDivElement>(null);
  // const observerTarget = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeChapterRef = useRef<HTMLButtonElement>(null);
  const isCheckingNextChapter = useRef(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedCustom = localStorage.getItem(STORAGE_KEY_CUSTOM_MANGAS);
    let customMangas: MangaMetadata[] = savedCustom
      ? JSON.parse(savedCustom)
      : [];

    const defaultManga: MangaMetadata = {
      id: "default_conan",
      title: "Thám Tử Lừng Danh Conan",
      author: "Gosho Aoyama",
      slug: "tham-tu-conan",
      imageExt: "jpg",
      cover:
        "https://tse1.explicit.bing.net/th/id/OIP.BIbAIWH7m03ma6rk6gzKowHaLq?rs=1&pid=ImgDetMain&o=7&rm=3",
      desc: "Thám Tử Lừng Danh Conan xoay quanh Kudo Shinichi, thám tử trung học bị teo nhỏ thành cậu bé Conan Edogawa, dùng trí thông minh sắc bén để phá giải những vụ án hóc búa, đồng thời truy tìm tổ chức áo đen đứng sau số phận của mình.",
      status: "Ongoing",
      tags: ["Trinh Thám", "Shonen", "Hành Động"],
      totalChapters: 1000,
      isCustom: false,
    };

    const allMangas = [defaultManga, ...customMangas];
    setMangas(allMangas);

    const savedProg = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (savedProg)
      try {
        setSavedProgress(JSON.parse(savedProg));
      } catch (e) {}
  }, []);

  // --- CRUD ACTIONS ---
  const openAddModal = () => {
    setFormData({
      title: "",
      author: "",
      coverUrl: "",
      slug: "",
      tags: "",
      desc: "",
      status: "Ongoing",
      imageExt: "jpg",
      isCustom: true,
    });
    setShowModal(true);
  };

  const openEditModal = (e: React.MouseEvent, manga: MangaMetadata) => {
    e.stopPropagation();
    setFormData({
      id: manga.id,
      title: manga.title,
      author: manga.author,
      coverUrl: manga.cover,
      slug: manga.slug,
      tags: manga.tags.join(", "),
      desc: manga.desc, // Load desc cũ
      status: manga.status,
      imageExt: manga.imageExt,
      isCustom: manga.isCustom || false,
    });
    setShowModal(true);
  };

  const handleSaveManga = () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      alert("Thiếu thông tin!");
      return;
    }
    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const finalCover = formData.coverUrl.trim()
      ? formData.coverUrl
      : getDynamicPageUrl(formData.slug, 1, 0, formData.imageExt);

    const newManga: MangaMetadata = {
      id: formData.id || `manga_${Date.now()}`,
      title: formData.title,
      author: formData.author || "Unknown",
      slug: formData.slug,
      imageExt: formData.imageExt,
      cover: finalCover,
      desc: formData.desc || "Truyện tùy chỉnh.",
      status: formData.status,
      tags: tagsArray,
      totalChapters: formData.id
        ? mangas.find((m) => m.id === formData.id)?.totalChapters || 100
        : 100,
      isCustom: true,
    };

    let updatedList;
    if (formData.id) {
      updatedList = mangas.map((m) =>
        m.id === formData.id ? { ...m, ...newManga } : m
      );
    } else {
      updatedList = [...mangas, newManga];
    }

    setMangas(updatedList);
    localStorage.setItem(
      STORAGE_KEY_CUSTOM_MANGAS,
      JSON.stringify(updatedList.filter((m) => m.isCustom))
    );
    setShowModal(false);
  };

  const handleDeleteManga = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Xóa truyện này?")) return;
    const updatedList = mangas.filter((m) => m.id !== id);
    setMangas(updatedList);
    localStorage.setItem(
      STORAGE_KEY_CUSTOM_MANGAS,
      JSON.stringify(updatedList.filter((m) => m.isCustom))
    );
  };

  useEffect(() => {
    if (!formData.id && formData.title)
      setFormData((prev) => ({ ...prev, slug: createSlug(prev.title) }));
  }, [formData.title, formData.id]);

  // --- FILTER LOGIC ---
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    mangas.forEach((m) => m.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [mangas]);

  const filteredMangas = useMemo(() => {
    return mangas.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "All" || m.status === filterStatus;
      const matchTag =
        filterTag === "All" || (m.tags && m.tags.includes(filterTag));
      return matchSearch && matchStatus && matchTag;
    });
  }, [mangas, searchQuery, filterStatus, filterTag]);

  // --- CORE READER LOGIC ---
  const activeManga = useMemo(
    () => mangas.find((m) => m.id === activeMangaId),
    [mangas, activeMangaId]
  );
  const currentChapterData = useMemo(
    () => loadedChapters.find((c) => c.index === currentChapterIndex),
    [loadedChapters, currentChapterIndex]
  );
  const totalPages = currentChapterData?.pages.length || 0;

  // 1. Auto Extend Logic
  const checkAndExtendChapters = useCallback(async () => {
    if (!activeManga || isCheckingNextChapter.current) return;
    const distToEnd = activeManga.totalChapters - 1 - currentChapterIndex;
    if (distToEnd <= 2) {
      isCheckingNextChapter.current = true;
      const nextIndex = activeManga.totalChapters;
      const nextChapNum = nextIndex + 1;
      const img = new Image();
      img.src = getDynamicPageUrl(
        activeManga.slug,
        nextChapNum,
        0,
        activeManga.imageExt
      );
      img.onload = () => {
        const updatedList = mangas.map((m) =>
          m.id === activeManga.id
            ? { ...m, totalChapters: m.totalChapters + 1 }
            : m
        );
        setMangas(updatedList);
        if (activeManga.isCustom)
          localStorage.setItem(
            STORAGE_KEY_CUSTOM_MANGAS,
            JSON.stringify(updatedList.filter((m) => m.isCustom))
          );
        isCheckingNextChapter.current = false;
      };
      img.onerror = () => {
        isCheckingNextChapter.current = false;
      };
    }
  }, [activeManga, currentChapterIndex, mangas]);

  // 2. Page Error
  const handlePageError = useCallback(
    (chapterIndex: number, pageIndex: number) => {
      setLoadedChapters((prev) =>
        prev.map((ch) => {
          if (ch.index !== chapterIndex) return ch;
          if (pageIndex < ch.pages.length)
            return { ...ch, pages: ch.pages.slice(0, pageIndex) };
          return ch;
        })
      );
    },
    []
  );

  // 3. Buffering
  const bufferChapters = useCallback(
    async (startIndex: number, count: number, reset: boolean = false) => {
      if (!activeManga) return;
      // setIsFetchingChapter(true);
      const promises = [];
      for (let i = 0; i < count; i++) {
        const targetIndex = startIndex + i;
        if (targetIndex >= activeManga.totalChapters) break;
        if (!reset && loadedChapters.some((c) => c.index === targetIndex))
          continue;
        promises.push(fetchChapterContent(activeManga, targetIndex));
      }
      if (promises.length > 0) {
        const newChapters = await Promise.all(promises);
        setLoadedChapters((prev) => {
          let updated = reset ? newChapters : [...prev, ...newChapters];
          updated.sort((a, b) => a.index - b.index);
          if (updated.length > CHAPTER_BUFFER_SIZE) {
            const keepStart = Math.max(
              0,
              updated.findIndex((c) => c.index === startIndex) - 1
            );
            updated = updated.slice(keepStart, keepStart + CHAPTER_BUFFER_SIZE);
          }
          return updated;
        });
      }
      // setIsFetchingChapter(false);
    },
    [activeManga, loadedChapters]
  );

  // 4. Save Progress (ĐỊNH NGHĨA Ở ĐÂY LÀ ĐÚNG)
  const saveProgress = useCallback(() => {
    if (!activeManga) return;
    setSavedProgress((prev) => {
      const next = {
        ...prev,
        [activeManga.id]: {
          mangaId: activeManga.id,
          chapterIndex: currentChapterIndex,
          pageIndex: currentPageIndex,
          timestamp: Date.now(),
        },
      };
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(next));
      return next;
    });
  }, [activeManga, currentChapterIndex, currentPageIndex]);

  // --- USE EFFECTS (HOOKS) ---

  // Trigger check extend
  useEffect(() => {
    checkAndExtendChapters();
  }, [currentChapterIndex, activeManga?.totalChapters]);

  // Trigger Buffer
  useEffect(() => {
    if (!activeManga) return;
    const hasCurrent = loadedChapters.some(
      (c) => c.index === currentChapterIndex
    );
    if (!hasCurrent) bufferChapters(currentChapterIndex, 3, true);
    else {
      const maxLoaded = Math.max(...loadedChapters.map((c) => c.index));
      if (maxLoaded - currentChapterIndex <= PRELOAD_CHAPTER_THRESHOLD)
        bufferChapters(maxLoaded + 1, 2, false);
    }
  }, [currentChapterIndex, activeManga, bufferChapters]);

  // Tracking Page
  useEffect(() => {
    if (readingMode !== "vertical" || !currentChapterData) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) setCurrentPageIndex(index);
          }
        });
      },
      { threshold: 0.5, root: readerContainerRef.current }
    );
    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [currentChapterData, visiblePageCount, readingMode]);

  // Resume Scroll
  useEffect(() => {
    if (
      shouldResumeScroll &&
      currentChapterData &&
      readingMode === "vertical"
    ) {
      const targetPage = savedProgress[activeManga!.id]?.pageIndex || 0;
      if (targetPage >= visiblePageCount)
        setVisiblePageCount(targetPage + PAGES_PER_BATCH);
      setTimeout(() => {
        const element = pageRefs.current[targetPage];
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "start" });
          setShouldResumeScroll(false);
        }
      }, 200);
    }
  }, [currentChapterData, shouldResumeScroll]);

  // Infinite Scroll Loader
  useEffect(() => {
    if (!currentChapterData || readingMode !== "vertical") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisiblePageCount((prev) =>
            prev >= totalPages ? prev : prev + PAGES_PER_BATCH
          );
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );
    const sentinel = document.getElementById("scroll-sentinel");
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentChapterData, readingMode, totalPages, visiblePageCount]);

  // TOC Auto Scroll
  useEffect(() => {
    if (showToc && activeChapterRef.current) {
      setTimeout(
        () =>
          activeChapterRef.current?.scrollIntoView({
            behavior: "auto",
            block: "center",
          }),
        100
      );
    }
  }, [showToc]);

  // Auto Bookmark (Trigger saveProgress)
  useEffect(() => {
    if (!activeManga) return;
    const timeout = setTimeout(() => {
      saveProgress(); // Gọi hàm saveProgress đã định nghĩa ở trên
    }, 1000);
    return () => clearTimeout(timeout);
  }, [currentChapterIndex, currentPageIndex, activeManga, saveProgress]);

  // --- HANDLERS ---
  const openManga = (id: string, resume: boolean = false) => {
    setActiveMangaId(id);
    setLoadedChapters([]);
    const prog = savedProgress[id];
    if (resume && prog) {
      setCurrentChapterIndex(prog.chapterIndex);
      setCurrentPageIndex(prog.pageIndex);
      setShouldResumeScroll(true);
    } else {
      setCurrentChapterIndex(0);
      setCurrentPageIndex(0);
      setShouldResumeScroll(false);
    }
  };

  const changeChapter = (idx: number) => {
    if (idx >= 0 && idx < (activeManga?.totalChapters || 0)) {
      setCurrentChapterIndex(idx);
      setCurrentPageIndex(0);
      setShowToc(false);
      setShouldResumeScroll(false);
      if (readerContainerRef.current) readerContainerRef.current.scrollTop = 0;
    }
  };

  // const nextPage = () => {
  //   if (currentPageIndex < totalPages - 1) setCurrentPageIndex((p) => p + 1);
  //   else changeChapter(currentChapterIndex + 1);
  // };

  // const prevPage = () => {
  //   if (currentPageIndex > 0) setCurrentPageIndex((p) => p - 1);
  //   else changeChapter(currentChapterIndex - 1);
  // };

  const getThemeBg = () => (theme === "dark" ? "bg-[#0f172a]" : "bg-slate-50");
  const getThemeText = () =>
    theme === "dark" ? "text-slate-100" : "text-slate-800";

  // --- VIEW: LIBRARY ---
  if (!activeMangaId) {
    const filtered = filteredMangas; // Sử dụng filteredMangas từ useMemo ở trên (sẽ định nghĩa lại bên dưới)
    const lastReadId = Object.keys(savedProgress).sort(
      (a, b) => savedProgress[b].timestamp - savedProgress[a].timestamp
    )[0];
    const heroManga = mangas.find((m) => m.id === lastReadId) || mangas[0];

    return (
      <div
        className={`h-full flex flex-col ${getThemeBg()} ${getThemeText()} overflow-hidden relative`}
      >
        {/* --- MODAL ADD/EDIT (REDESIGNED) --- */}
        {showModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
              className={clsx(
                "w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border",
                theme === "dark"
                  ? "bg-[#1e293b] border-white/10 text-slate-200"
                  : "bg-white border-slate-200 text-slate-800"
              )}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                    {formData.id ? <Edit size={24} /> : <Plus size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-500 uppercase tracking-wide">
                      {formData.id ? "Chỉnh sửa truyện" : "Thêm truyện mới"}
                    </h3>
                    <p className="text-xs opacity-60">
                      Nhập thông tin chi tiết bên dưới
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-full hover:bg-black/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Section 1: Thông tin cơ bản & Ảnh bìa */}
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Left: Cover Preview */}
                  <div className="w-full sm:w-1/3 flex flex-col gap-3">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-black/20 relative shadow-inner border border-white/5 group">
                      <SmartImage
                        src={
                          formData.coverUrl ||
                          getDynamicPageUrl(
                            formData.slug || "demo",
                            1,
                            0,
                            formData.imageExt
                          )
                        }
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onLoadError={() => {}}
                      />
                      {!formData.coverUrl && !formData.slug && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">
                          Preview Ảnh Bìa
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <ImageIcon
                        className="absolute left-3 top-3 opacity-50"
                        size={14}
                      />
                      <input
                        type="text"
                        value={formData.coverUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, coverUrl: e.target.value })
                        }
                        placeholder="Link ảnh bìa (Tùy chọn)"
                        className={`w-full py-2.5 pl-9 pr-3 rounded-lg text-xs border outline-none transition-all ${
                          theme === "dark"
                            ? "bg-black/20 border-white/10 focus:border-amber-500/50"
                            : "bg-slate-50 border-slate-200 focus:border-amber-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Right: Text Inputs */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase opacity-70 mb-1.5 ml-1">
                        Tên truyện <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Nhập tên truyện..."
                        className={`w-full p-3 rounded-xl border outline-none font-bold text-lg transition-all ${
                          theme === "dark"
                            ? "bg-black/20 border-white/10 focus:border-amber-500/50 focus:bg-black/30"
                            : "bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white"
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase opacity-70 mb-1.5 ml-1">
                          Slug (Mã URL)
                        </label>
                        <div className="relative">
                          <LinkIcon
                            className="absolute left-3 top-3.5 opacity-40"
                            size={14}
                          />
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) =>
                              setFormData({ ...formData, slug: e.target.value })
                            }
                            className={`w-full py-3 pl-9 pr-3 rounded-xl border outline-none font-mono text-sm ${
                              theme === "dark"
                                ? "bg-black/20 border-white/10 text-green-400"
                                : "bg-slate-50 border-slate-200 text-green-600"
                            }`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase opacity-70 mb-1.5 ml-1">
                          Tác giả
                        </label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) =>
                            setFormData({ ...formData, author: e.target.value })
                          }
                          placeholder="Tên tác giả"
                          className={`w-full p-3 rounded-xl border outline-none text-sm ${
                            theme === "dark"
                              ? "bg-black/20 border-white/10"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase opacity-70 mb-1.5 ml-1">
                        Thể loại (Tags)
                      </label>
                      <div
                        className={`w-full p-2 rounded-xl border flex flex-wrap gap-2 ${
                          theme === "dark"
                            ? "bg-black/20 border-white/10"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {formData.tags
                          .split(",")
                          .filter((t) => t.trim())
                          .map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded text-xs font-bold"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                          }
                          placeholder="Nhập tag cách nhau dấu phẩy..."
                          className="flex-1 bg-transparent outline-none text-sm min-w-[120px] ml-1 placeholder:opacity-40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase opacity-70 mb-1.5 ml-1">
                    Mô tả
                  </label>
                  <div className="relative">
                    <FileText
                      className="absolute left-3 top-3.5 opacity-40"
                      size={14}
                    />
                    <textarea
                      value={formData.desc}
                      onChange={(e) =>
                        setFormData({ ...formData, desc: e.target.value })
                      }
                      placeholder="Nội dung tóm tắt..."
                      rows={3}
                      className={`w-full p-3 pl-9 rounded-xl border outline-none text-sm resize-none custom-scrollbar ${
                        theme === "dark"
                          ? "bg-black/20 border-white/10"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    />
                  </div>
                </div>

                {/* Section 2: Cấu hình nâng cao */}
                <div
                  className={`p-4 rounded-xl border ${
                    theme === "dark"
                      ? "bg-black/20 border-white/5"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase opacity-50 mb-3">
                    Cấu hình nguồn ảnh
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase opacity-70 mb-2">
                        Định dạng ảnh
                      </label>
                      <div className="flex bg-black/10 p-1 rounded-lg">
                        {["jpg", "png", "webp"].map((ext) => (
                          <button
                            key={ext}
                            onClick={() =>
                              setFormData({ ...formData, imageExt: ext })
                            }
                            className={clsx(
                              "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                              formData.imageExt === ext
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                          >
                            {ext.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase opacity-70 mb-2">
                        Trạng thái
                      </label>
                      <div className="flex bg-black/10 p-1 rounded-lg">
                        <button
                          onClick={() =>
                            setFormData({ ...formData, status: "Ongoing" })
                          }
                          className={clsx(
                            "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                            formData.status === "Ongoing"
                              ? "bg-green-600 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          Ongoing
                        </button>
                        <button
                          onClick={() =>
                            setFormData({ ...formData, status: "Completed" })
                          }
                          className={clsx(
                            "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                            formData.status === "Completed"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          Full
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className={`px-6 py-4 border-t ${
                  theme === "dark"
                    ? "border-white/5 bg-[#1e293b]"
                    : "border-slate-100 bg-white"
                }`}
              >
                <button
                  onClick={handleSaveManga}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  <span>
                    {formData.id ? "Lưu Thay Đổi" : "Thêm Vào Thư Viện"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <div className="absolute top-0 left-0 right-0 z-[40] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold drop-shadow-md">
            <BookOpen className="text-amber-500 " />
            <span>
              Manga<span className="text-amber-500">Pro</span>
            </span>
          </div>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className={clsx(
              "p-2 rounded-full border backdrop-blur-md transition-all duration-300 shadow-sm group",
              theme === "dark"
                ? "bg-white/10 border-white/20 text-yellow-400 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(250,204,21,0.5)]" // Dark styles
                : "bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-md" // Light styles
            )}
            title={
              theme === "dark"
                ? "Chuyển sang giao diện sáng"
                : "Chuyển sang giao diện tối"
            }
          >
            {theme === "dark" ? (
              <Sun
                size={20}
                className="group-hover:rotate-90 transition-transform duration-500"
              />
            ) : (
              <Moon
                size={20}
                className="group-hover:-rotate-90 transition-transform duration-500"
              />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* HERO SECTION */}
          {heroManga && (
            <div className="relative w-full h-[40vh] sm:h-[50vh] overflow-hidden flex items-end">
              <div className="absolute inset-0">
                <img
                  src={heroManga.cover}
                  className="w-full h-full object-cover opacity-60 blur-xl scale-110"
                  alt=""
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${
                    theme === "dark"
                      ? "from-[#0f172a] via-[#0f172a]/60"
                      : "from-slate-50 via-slate-50/60"
                  } to-transparent`}
                ></div>
              </div>
              <div className="relative z-10 px-6 pb-10 w-full max-w-7xl mx-auto flex items-end gap-6 sm:gap-10">
                <div className="w-24 sm:w-32 md:w-40 aspect-[2/3] rounded-lg shadow-2xl overflow-hidden border-2 border-white/20 shrink-0 transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                  <SmartImage
                    src={heroManga.cover}
                    alt=""
                    className="w-full h-full object-cover"
                    onLoadError={() => {}}
                  />
                </div>
                <div className="flex-1 mb-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Bookmark size={12} /> Đọc gần đây
                  </div>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight mb-2 line-clamp-2">
                    {heroManga.title}
                  </h1>
                  <p className="text-sm opacity-70 line-clamp-2 max-w-xl mb-6">
                    {heroManga.desc}
                  </p>
                  <button
                    onClick={() => openManga(heroManga.id, true)}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-full shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <PlayCircle size={20} fill="currentColor" /> Đọc tiếp
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LIBRARY GRID */}
          <div className="px-6 py-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 self-start">
                <Library className="text-slate-400" /> Thư viện
              </h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64 group">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                      theme === "dark"
                        ? "bg-white/5 focus:bg-white/10"
                        : "bg-white shadow-sm focus:shadow-md"
                    }`}
                  />
                </div>
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`p-2 rounded-xl transition-all ${
                    showFilterPanel
                      ? "bg-amber-500 text-white"
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <Filter size={18} />
                </button>
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
                >
                  <Plus size={18} />{" "}
                  <span className="hidden sm:inline">Thêm</span>
                </button>
              </div>
            </div>

            {/* FILTER PANEL */}
            {showFilterPanel && (
              <div
                className={`mb-8 p-4 rounded-xl border animate-in slide-in-from-top-2 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/10"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CustomSelect
                    label="Trạng thái"
                    value={filterStatus}
                    onChange={setFilterStatus}
                    icon={PlayCircle}
                    options={[
                      { value: "All", label: "Tất cả trạng thái" },
                      { value: "Ongoing", label: "Đang tiến hành" },
                      { value: "Completed", label: "Đã hoàn thành" },
                    ]}
                  />

                  <CustomSelect
                    label="Thể loại"
                    value={filterTag}
                    onChange={setFilterTag}
                    icon={Tag}
                    options={[
                      { value: "All", label: "Tất cả thể loại" },
                      ...uniqueTags.map((tag) => ({ value: tag, label: tag })),
                    ]}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
              {filtered.map((manga) => {
                const progress = savedProgress[manga.id];
                return (
                  <div key={manga.id} className="group relative cursor-pointer">
                    <div
                      className="aspect-[2/3] rounded-2xl overflow-hidden shadow-md group-hover:shadow-2xl group-hover:shadow-amber-500/20 transition-all duration-300 relative bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openManga(manga.id, true);
                      }}
                    >
                      <SmartImage
                        src={manga.cover}
                        alt={manga.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onLoadError={() => {}}
                      />

                      {/* Action Buttons */}
                      {manga.isCustom && (
                        <div
                          className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => openEditModal(e, manga)}
                            className="p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-500"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteManga(e, manga.id)}
                            className="p-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      {/* Resume Button */}
                      {progress && (
                        <div
                          className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex justify-center z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            openManga(manga.id, true);
                          }}
                        >
                          <button className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-full shadow-lg transition-transform hover:scale-105">
                            <PlayCircle size={12} fill="currentColor" /> Tiếp
                            Chap{" "}
                            {progress.chapterIndex +
                              (manga.slug === "tham-tu-conan" ? 2 : 1)}
                          </button>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      {!progress && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white shadow-lg">
                            <PlayCircle size={24} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3
                        className={`font-bold text-sm line-clamp-1 group-hover:text-amber-500 transition-colors ${getThemeText()}`}
                      >
                        {manga.title}
                      </h3>
                      <div className="flex justify-between items-center text-xs opacity-60 mt-1">
                        <span>
                          {manga.totalChapters > 999
                            ? "1000+"
                            : manga.totalChapters}{" "}
                          Chap
                        </span>
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide border",
                            manga.status === "Ongoing"
                              ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                              : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                          )}
                        >
                          {manga.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: READER ---
  return (
    <div
      className={`h-full flex flex-col relative ${getThemeBg()} ${getThemeText()} transition-colors duration-300 overflow-hidden select-none`}
    >
      <div
        className={clsx(
          "absolute top-0 left-0 right-0 p-4 z-40 flex justify-between transition-transform duration-300 bg-gradient-to-b from-black/80 to-transparent text-white",
          !showControls && "-translate-y-full"
        )}
      >
        <button
          onClick={() => setActiveMangaId(null)}
          className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20"
        >
          <ArrowLeft />
        </button>
        <div className="flex gap-2">
          <button
            onClick={saveProgress}
            className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20"
          >
            <Bookmark
              className={
                savedProgress[activeManga!.id]?.chapterIndex ===
                currentChapterIndex
                  ? "fill-white"
                  : ""
              }
            />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20"
          >
            <Settings />
          </button>
          <button
            onClick={() => setShowToc(true)}
            className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20"
          >
            <List />
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          className={`absolute top-16 right-4 w-72 p-4 rounded-2xl shadow-xl z-50 border backdrop-blur-xl ${
            theme === "dark"
              ? "bg-black/80 border-white/10"
              : "bg-white/90 border-slate-200"
          }`}
        >
          <div className="flex justify-between mb-4">
            <span className="font-bold text-xs uppercase opacity-70">
              Cài đặt
            </span>
            <button onClick={() => setShowSettings(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex bg-white/10 p-1 rounded-lg">
              {["vertical", "horizontal_ltr"].map((m) => (
                <button
                  key={m}
                  onClick={() => setReadingMode(m as ReadingMode)}
                  className={clsx(
                    "flex-1 py-2 text-xs rounded-md",
                    readingMode === m
                      ? "bg-amber-500 text-white"
                      : "hover:bg-white/10"
                  )}
                >
                  {m === "vertical" ? "Cuộn Dọc" : "Trang Ngang"}
                </button>
              ))}
            </div>
            {readingMode !== "vertical" && (
              <div className="flex bg-white/10 p-1 rounded-lg">
                <button
                  onClick={() => setFitMode("width")}
                  className={clsx(
                    "flex-1 py-2 text-xs rounded-md",
                    fitMode === "width"
                      ? "bg-amber-500 text-white"
                      : "hover:bg-white/10"
                  )}
                >
                  Vừa Ngang
                </button>
                <button
                  onClick={() => setFitMode("height")}
                  className={clsx(
                    "flex-1 py-2 text-xs rounded-md",
                    fitMode === "height"
                      ? "bg-amber-500 text-white"
                      : "hover:bg-white/10"
                  )}
                >
                  Vừa Dọc
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showToc && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowToc(false)}
          ></div>
          <div
            className={`relative w-80 h-full shadow-2xl flex flex-col animate-in slide-in-from-right ${
              theme === "dark" ? "bg-[#1e293b]" : "bg-white"
            }`}
          >
            <div className="p-4 border-b border-white/10 font-bold text-lg">
              Danh sách chương
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {Array.from({ length: activeManga!.totalChapters }).map(
                (_, i) => (
                  <button
                    key={i}
                    ref={i === currentChapterIndex ? activeChapterRef : null}
                    onClick={() => changeChapter(i)}
                    className={clsx(
                      "w-full text-left p-3 rounded-lg text-sm truncate transition-colors",
                      i === currentChapterIndex
                        ? "bg-amber-500 text-white font-bold"
                        : "hover:bg-white/10 opacity-70 hover:opacity-100"
                    )}
                  >
                    Chapter {i + 1}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={readerContainerRef}
        className="flex-1 overflow-auto bg-black"
        onClick={() => setShowControls(!showControls)}
      >
        {currentChapterData ? (
          readingMode === "vertical" ? (
            <div className="max-w-4xl mx-auto pb-20 min-h-screen">
              {currentChapterData.pages
                .slice(0, visiblePageCount)
                .map((p, i) => (
                  <div
                    key={p.id}
                    ref={(el) => {
                      pageRefs.current[i] = el;
                    }}
                    data-index={i}
                    className="mb-1 relative"
                  >
                    <SmartImage
                      src={p.url}
                      alt=""
                      onLoadError={() =>
                        handlePageError(currentChapterData.index, i)
                      }
                    />
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}
              <div id="scroll-sentinel" className="py-10 flex justify-center">
                {visiblePageCount < totalPages && (
                  <Loader2 className="animate-spin text-amber-500" />
                )}
              </div>
              {visiblePageCount >= totalPages && (
                <div className="py-10 flex justify-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      changeChapter(currentChapterIndex + 1);
                    }}
                    className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full"
                  >
                    Chap Tiếp
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              <div
                className="absolute inset-y-0 left-0 w-1/4 cursor-pointer z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPageIndex((p) => Math.max(0, p - 1));
                }}
              ></div>
              <div
                className="absolute inset-y-0 right-0 w-1/4 cursor-pointer z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1));
                }}
              ></div>
              {currentChapterData.pages[currentPageIndex] && (
                <SmartImage
                  src={currentChapterData.pages[currentPageIndex].url}
                  alt=""
                  fitMode={fitMode}
                  onLoadError={() =>
                    handlePageError(currentChapterData.index, currentPageIndex)
                  }
                />
              )}
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-white">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      <div
        className={clsx(
          "absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-white text-xs flex justify-between pointer-events-none transition-transform duration-300",
          !showControls && "translate-y-full"
        )}
      >
        <span className="opacity-80">{currentChapterData?.title}</span>
        <span className="opacity-80">
          {readingMode === "vertical"
            ? `${Math.min(visiblePageCount, totalPages)}/${totalPages}`
            : `${currentPageIndex + 1}/${totalPages}`}
        </span>
      </div>
    </div>
  );
};

// --- COMPONENT: CUSTOM SELECT (Replaces native select) ---
const CustomSelect = ({
  value,
  onChange,
  options,
  label,
  icon: Icon,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string } | any>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-[10px] uppercase font-bold opacity-60 mb-1">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm border outline-none transition-all bg-white/5 border-white/10 hover:bg-white/10 focus:ring-2 focus:ring-amber-500/50"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="opacity-70" />}
          <span>{selectedLabel}</span>
        </div>
        <ChevronLeft
          size={16}
          className={clsx(
            "transition-transform duration-300 opacity-50",
            isOpen ? "-rotate-90" : "-rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-1 rounded-xl border bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={clsx(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                value === opt.value
                  ? "bg-amber-500 text-white font-bold"
                  : "hover:bg-slate-100 dark:hover:bg-white/5 dark:text-slate-200"
              )}
            >
              {opt.label}
              {value === opt.value && <CheckCircle2 size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
