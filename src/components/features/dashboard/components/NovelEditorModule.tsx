import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Book,
  Plus,
  Trash2,
  FileText,
  Settings,
  PenTool,
  Type,
  Clock,
  CheckCircle2,
  Menu,
  Maximize2,
  Minimize2,
  X,
  ArrowLeft,
  Loader2,
  MoreVertical,
  Eye,
  EyeOff,
  FileType,
  FileDown,
  Edit,
  Split,
  GripVertical,
  AlertTriangle, // Thêm AlertTriangle cho modal xóa
} from "lucide-react";
import clsx from "clsx";

// --- TYPES ---
interface Chapter {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

interface Project {
  id: string;
  title: string;
  author: string;
  desc: string;
  status: "Draft" | "Published";
  chapters: Chapter[];
  createdAt: number;
}

interface EditorSettings {
  fontFamily: "sans" | "serif" | "mono";
  fontSize: number;
  maxWidth: "narrow" | "medium" | "wide";
  lineHeight: number;
}

// State để quản lý việc xóa
interface DeleteTarget {
  type: "project" | "chapter";
  id: string;
  title: string;
}

// --- CONFIG ---
const STORAGE_KEY_PROJECTS = "writer_studio_projects_v3";
const STORAGE_KEY_SETTINGS = "writer_studio_settings_v3";
const STORAGE_KEY_SESSION = "writer_studio_session_v3";
const WORD_TARGET_DEFAULT = 2000;

// --- UTILS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const countWords = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter((w) => w).length;
const estimateReadingTime = (words: number) => Math.ceil(words / 250);

const loadScript = (src: string) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
};

export const NovelEditorModule = () => {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSplitView, setIsSplitView] = useState(true);
  const [isReadMode, setIsReadMode] = useState(false);

  // Delete Modal State (Thay thế window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Splitter & Responsive State
  const [splitRatio, setSplitRatio] = useState(50);
  const [isLargeScreen, setIsLargeScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const isResizing = useRef(false);

  // Editor State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved
      ? JSON.parse(saved)
      : {
          fontFamily: "serif",
          fontSize: 18,
          maxWidth: "medium",
          lineHeight: 1.8,
        };
  });

  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjAuthor, setNewProjAuthor] = useState("");

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<HTMLDivElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shouldShowSplit = isSplitView && isLargeScreen;

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      const session = localStorage.getItem(STORAGE_KEY_SESSION);
      if (session) {
        try {
          const { projId, chapId } = JSON.parse(session);
          const projExists = projects.find((p) => p.id === projId);
          if (projExists) {
            setActiveProjectId(projId);
            if (chapId) {
              const chapExists = projExists.chapters.find(
                (c) => c.id === chapId
              );
              if (chapExists) {
                setActiveChapterId(chapId);
                setEditorTitle(chapExists.title);
                setEditorContent(chapExists.content);
              }
            }
          }
        } catch (e) {}
      }
    }
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMoreMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newRatio = (offsetX / rect.width) * 100;
      if (newRatio > 20 && newRatio < 80) setSplitRatio(newRatio);
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDownSplitter = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedProjects));
  };
  const saveSession = (projId: string | null, chapId: string | null) => {
    localStorage.setItem(
      STORAGE_KEY_SESSION,
      JSON.stringify({ projId, chapId })
    );
  };
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId),
    [projects, activeProjectId]
  );

  // --- HANDLERS ---
  const openCreateModal = () => {
    setEditingProject(null);
    setNewProjTitle("");
    setNewProjAuthor("");
    setShowProjectModal(true);
  };
  const openEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setNewProjTitle(project.title);
    setNewProjAuthor(project.author);
    setShowProjectModal(true);
  };

  const handleSaveProject = () => {
    if (!newProjTitle.trim()) return;
    if (editingProject) {
      const updatedProjects = projects.map((p) =>
        p.id === editingProject.id
          ? { ...p, title: newProjTitle, author: newProjAuthor }
          : p
      );
      setProjects(updatedProjects);
      saveProjectsToStorage(updatedProjects);
    } else {
      const newProject: Project = {
        id: generateId(),
        title: newProjTitle,
        author: newProjAuthor || "Tôi",
        desc: "",
        status: "Draft",
        chapters: [],
        createdAt: Date.now(),
      };
      const updated = [newProject, ...projects];
      setProjects(updated);
      saveProjectsToStorage(updated);
      setActiveProjectId(newProject.id);
      saveSession(newProject.id, null);
    }
    setShowProjectModal(false);
    setNewProjTitle("");
    setNewProjAuthor("");
    setEditingProject(null);
  };

  const handleAddChapter = () => {
    if (!activeProject) return;
    const newChap: Chapter = {
      id: generateId(),
      title: `Chương ${activeProject.chapters.length + 1}`,
      content: "",
      lastModified: Date.now(),
    };
    const updatedProjects = projects.map((p) =>
      p.id === activeProjectId
        ? { ...p, chapters: [...p.chapters, newChap] }
        : p
    );
    setProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);
    setActiveChapterId(newChap.id);
    setEditorTitle(newChap.title);
    setEditorContent("");
    saveSession(activeProjectId, newChap.id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const handleSelectChapter = (chapId: string) => {
    if (activeChapterId && activeProject) saveCurrentChapterImmediate();
    const chapter = activeProject?.chapters.find((c) => c.id === chapId);
    if (chapter) {
      setActiveChapterId(chapId);
      setEditorTitle(chapter.title);
      setEditorContent(chapter.content);
      saveSession(activeProjectId, chapId);
      if (window.innerWidth < 768) setShowSidebar(false);
    }
  };

  const saveCurrentChapterImmediate = useCallback(() => {
    if (!activeProjectId || !activeChapterId) return;
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === activeProjectId) {
          const updatedChaps = p.chapters.map((c) =>
            c.id === activeChapterId
              ? {
                  ...c,
                  title: editorTitle,
                  content: editorContent,
                  lastModified: Date.now(),
                }
              : c
          );
          return { ...p, chapters: updatedChaps };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });
    setIsSaving(false);
  }, [activeProjectId, activeChapterId, editorTitle, editorContent]);

  useEffect(() => {
    if (!activeProjectId || !activeChapterId) return;
    setIsSaving(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(
      () => saveCurrentChapterImmediate(),
      1000
    );
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [editorContent, editorTitle, saveCurrentChapterImmediate]);

  // --- DELETE HANDLERS (UPDATED) ---

  // 1. Trigger Delete Modal for Chapter
  const requestDeleteChapter = (e: React.MouseEvent, chap: Chapter) => {
    e.stopPropagation();
    setDeleteTarget({ type: "chapter", id: chap.id, title: chap.title });
  };

  // 2. Trigger Delete Modal for Project
  const requestDeleteProject = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setDeleteTarget({ type: "project", id: proj.id, title: proj.title });
  };

  // 3. Confirm Delete Action
  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "chapter") {
      // Logic xóa chapter cũ
      const updatedProjects = projects.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              chapters: p.chapters.filter((c) => c.id !== deleteTarget.id),
            }
          : p
      );
      setProjects(updatedProjects);
      saveProjectsToStorage(updatedProjects);
      if (activeChapterId === deleteTarget.id) {
        setActiveChapterId(null);
        setEditorContent("");
        setEditorTitle("");
        saveSession(activeProjectId, null);
      }
    } else {
      // Logic xóa project cũ
      const updated = projects.filter((p) => p.id !== deleteTarget.id);
      setProjects(updated);
      saveProjectsToStorage(updated);
      if (activeProjectId === deleteTarget.id) {
        setActiveProjectId(null);
        setActiveChapterId(null);
        saveSession(null, null);
      }
    }
    setDeleteTarget(null); // Đóng modal
  };

  const handleExportWord = () => {
    if (!activeProject) return;
    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${
      activeProject.title
    }</title><style>body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; } h1 { font-size: 24pt; text-align: center; font-weight: bold; margin-bottom: 20pt; } p.author { text-align: center; font-style: italic; margin-bottom: 40pt; } h2 { font-size: 16pt; font-weight: bold; margin-top: 20pt; margin-bottom: 12pt; } p { text-align: justify; text-justify: inter-ideograph; margin-bottom: 8pt; text-indent: 20pt; }</style></head><body><h1>${activeProject.title.toUpperCase()}</h1><p class="author">Tác giả: ${
      activeProject.author
    }</p><br clear=all style='mso-special-character:line-break;page-break-before:always'>${activeProject.chapters
      .map(
        (chap) =>
          `<h2>${chap.title}</h2>${chap.content
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => `<p>${p}</p>`)
            .join(
              ""
            )}<br clear=all style='mso-special-character:line-break;page-break-before:always'>`
      )
      .join("")}</body></html>`;
    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProject.title}.doc`;
    link.click();
    setShowMoreMenu(false);
  };

  const handleExportPDF = async () => {
    if (!activeProject) return;
    setIsExporting(true);
    try {
      // @ts-ignore
      if (!window.html2pdf)
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        );
      const element = document.createElement("div");
      element.innerHTML = `<div style="font-family: 'Times New Roman', serif; padding: 40px; color: #000; line-height: 1.6;"><h1 style="text-align: center; font-size: 28px; margin-bottom: 10px;">${activeProject.title.toUpperCase()}</h1><p style="text-align: center; font-style: italic; margin-bottom: 50px;">Tác giả: ${
        activeProject.author
      }</p>${activeProject.chapters
        .map(
          (chap) =>
            `<div style="page-break-before: always;"><h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">${
              chap.title
            }</h2>${chap.content
              .split("\n")
              .filter((x) => x.trim())
              .map(
                (p) =>
                  `<p style="text-align: justify; text-indent: 30px; margin-bottom: 10px;">${p}</p>`
              )
              .join("")}</div>`
        )
        .join("")}</div>`;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${activeProject.title}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      alert("Lỗi khi tạo PDF (kiểm tra mạng).");
      console.error(err);
    } finally {
      setIsExporting(false);
      setShowMoreMenu(false);
    }
  };

  const wordCount = useMemo(() => countWords(editorContent), [editorContent]);
  const progressPercent = Math.min(
    100,
    (wordCount / WORD_TARGET_DEFAULT) * 100
  );

  const getEditorWidth = () => {
    switch (settings.maxWidth) {
      case "narrow":
        return "max-w-2xl";
      case "wide":
        return "max-w-5xl";
      default:
        return "max-w-3xl";
    }
  };
  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case "mono":
        return "font-mono";
      case "sans":
        return "font-sans";
      default:
        return "font-serif";
    }
  };

  // --- RENDER ---
  return (
    <div
      className={`flex h-full w-full bg-[#f8f9fa] dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300 relative`}
    >
      {/* === SIDEBAR === */}
      {showSidebar && (
        <div
          className="absolute inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <aside
        className={clsx(
          "flex flex-col border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[#1e293b] transition-all duration-300 z-40",
          "absolute inset-y-0 left-0 w-[280px] shadow-2xl md:shadow-none h-full",
          showSidebar
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0 md:relative",
          isZenMode && "!hidden"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 h-16 flex items-center justify-between shrink-0">
          {!activeProjectId ? (
            <div className="flex items-center gap-2 font-bold text-lg text-amber-600 dark:text-amber-500">
              <PenTool size={20} /> Writer Studio
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setActiveProjectId(null);
                  setActiveChapterId(null);
                  saveSession(null, null);
                }}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} /> Trở về
              </button>
              <button
                onClick={handleAddChapter}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all active:scale-95"
              >
                <Plus size={18} />
              </button>
            </>
          )}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {!activeProjectId ? (
            <div className="space-y-3">
              <button
                onClick={openCreateModal}
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all gap-2 group"
              >
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-bold uppercase">
                  Tạo dự án mới
                </span>
              </button>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    setActiveProjectId(proj.id);
                    setActiveChapterId(null);
                    setEditorContent("");
                    setEditorTitle("");
                    saveSession(proj.id, null);
                  }}
                  className="group bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-transparent hover:border-amber-500/50 cursor-pointer transition-all relative hover:shadow-md"
                >
                  <h4 className="font-bold truncate pr-16 text-sm">
                    {proj.title}
                  </h4>
                  <div className="text-[10px] opacity-60 mt-1.5 flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <FileText size={10} /> {proj.chapters.length} chương
                    </span>
                    <span>
                      {new Date(proj.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div
                    className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => openEditModal(e, proj)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => requestDeleteProject(e, proj)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {activeProject?.chapters.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-40 text-xs text-center">
                  <Book size={32} className="mb-2" />
                  Chưa có chương nào.
                  <br />
                  Bấm dấu + để thêm.
                </div>
              )}
              {activeProject?.chapters.map((chap, idx) => (
                <div
                  key={chap.id}
                  onClick={() => handleSelectChapter(chap.id)}
                  className={clsx(
                    "group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border-l-[3px]",
                    activeChapterId === chap.id
                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "border-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <div className="truncate flex-1">
                    <div className="text-sm font-medium truncate">
                      {chap.title || `Chương ${idx + 1}`}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {countWords(chap.content)} từ
                    </div>
                  </div>
                  <button
                    onClick={(e) => requestDeleteChapter(e, chap)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main
        className={clsx(
          "flex-1 flex flex-col min-w-0 relative h-full transition-all duration-300",
          isZenMode ? "bg-[#fcfcfc] dark:bg-[#050505]" : ""
        )}
      >
        {/* TOOLBAR */}
        <div
          className={clsx(
            "h-16 flex items-center justify-between px-4 sm:px-6 z-20 transition-all duration-500 ease-in-out border-b border-slate-200 dark:border-white/5",
            isZenMode
              ? "absolute top-0 left-0 right-0 -translate-y-full opacity-0 pointer-events-none"
              : "bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => setShowSidebar(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            >
              <Menu size={20} />
            </button>
            {activeProject ? (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase opacity-50 tracking-wider truncate max-w-[150px]">
                  {activeProject.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
                    {editorTitle || "Chưa có tên"}
                  </span>
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin text-blue-500" />
                  ) : (
                    <CheckCircle2 size={12} className="text-green-500" />
                  )}
                </div>
              </div>
            ) : (
              <span className="text-sm font-bold opacity-50">Chọn dự án</span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Toggle Split View (Desktop Only > 1024px) */}
            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className={clsx(
                "p-2 rounded-lg transition-colors hidden lg:block",
                isSplitView
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20"
                  : "hover:bg-slate-100 dark:hover:bg-white/5"
              )}
              title="Chia đôi màn hình"
            >
              <Split size={18} />
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => setIsReadMode(!isReadMode)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  isReadMode
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20"
                    : "hover:bg-slate-100 dark:hover:bg-white/5"
                )}
                title="Chế độ đọc"
              >
                {isReadMode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  showSettings
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20"
                    : "hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <Type size={18} />
              </button>
              <button
                onClick={() => setIsZenMode(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Menu More */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={clsx(
                  "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5",
                  isExporting && "animate-pulse text-blue-500"
                )}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MoreVertical size={18} />
                )}
              </button>
              {showMoreMenu && (
                <div className="absolute top-12 right-0 w-56 bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 z-50 animate-in zoom-in-95 origin-top-right">
                  <div className="text-[10px] font-bold uppercase opacity-50 px-3 py-1">
                    Xuất bản
                  </div>
                  <button
                    onClick={handleExportWord}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <FileType size={16} className="text-blue-600" /> Xuất file
                    Word (.doc)
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <FileDown size={16} className="text-red-600" /> Xuất file
                    PDF
                  </button>
                  <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-1 sm:hidden"></div>
                  <button
                    onClick={() => {
                      setIsReadMode(!isReadMode);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg sm:hidden text-left"
                  >
                    <Eye size={16} />{" "}
                    {isReadMode ? "Tắt chế độ đọc" : "Chế độ đọc"}
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg sm:hidden text-left"
                  >
                    <Settings size={16} /> Cấu hình
                  </button>
                  <button
                    onClick={() => {
                      setIsZenMode(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg sm:hidden text-left"
                  >
                    <Maximize2 size={16} /> Zen Mode
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SETTINGS POPUP */}
        {showSettings && (
          <div className="absolute top-16 right-4 w-72 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5 z-50 animate-in zoom-in-95 origin-top-right">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-2">
              <span className="text-xs font-bold uppercase opacity-50">
                Cấu hình soạn thảo
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-bold mb-2 opacity-70">
                  Kiểu chữ
                </div>
                <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-lg">
                  {["sans", "serif", "mono"].map((f) => (
                    <button
                      key={f}
                      onClick={() =>
                        setSettings({ ...settings, fontFamily: f as any })
                      }
                      className={clsx(
                        "flex-1 py-1.5 text-xs rounded capitalize transition-all",
                        settings.fontFamily === f
                          ? "bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400 font-bold"
                          : "opacity-60"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-bold mb-2 opacity-70">
                  <span>Cỡ chữ</span>
                  <span>{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold mb-2 opacity-70">
                  Chiều rộng
                </div>
                <div className="flex gap-2">
                  {["narrow", "medium", "wide"].map((w) => (
                    <button
                      key={w}
                      onClick={() =>
                        setSettings({ ...settings, maxWidth: w as any })
                      }
                      className={clsx(
                        "flex-1 py-1.5 border rounded text-xs transition-all capitalize",
                        settings.maxWidth === w
                          ? "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-500/10 font-bold"
                          : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SPLIT VIEW CONTAINER */}
        {activeChapterId ? (
          <div
            id="split-container"
            className="flex-1 flex overflow-hidden relative h-full"
          >
            {/* LEFT SIDE: EDITOR INPUT */}
            <div
              className="flex-1 h-full overflow-y-auto custom-scrollbar relative"
              style={{
                width: shouldShowSplit ? `${splitRatio}%` : "100%",
                flex: shouldShowSplit ? "none" : 1,
              }}
            >
              <div
                className={clsx(
                  "mx-auto px-6 sm:px-10 min-h-screen transition-all duration-300",
                  !shouldShowSplit && getEditorWidth(),
                  isZenMode ? "py-20" : "py-10"
                )}
              >
                {!isReadMode ? (
                  <>
                    <input
                      type="text"
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      placeholder="Tiêu đề chương..."
                      className={clsx(
                        "w-full text-3xl sm:text-4xl font-black bg-transparent border-none outline-none mb-6 placeholder:opacity-20 text-slate-900 dark:text-slate-100 leading-tight",
                        getFontFamily()
                      )}
                    />
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      placeholder="Hãy bắt đầu viết câu chuyện của bạn..."
                      className={clsx(
                        "w-full h-auto resize-none bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:opacity-20 leading-relaxed",
                        getFontFamily()
                      )}
                      style={{
                        fontSize: `${settings.fontSize}px`,
                        lineHeight: settings.lineHeight,
                        minHeight: "70vh",
                      }}
                      spellCheck={false}
                    />
                  </>
                ) : (
                  <div
                    className={clsx(
                      "prose dark:prose-invert max-w-none animate-in fade-in select-none",
                      getFontFamily()
                    )}
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: settings.lineHeight,
                    }}
                  >
                    <h1 className="text-3xl sm:text-4xl font-black mb-8 text-center border-b pb-4 border-dashed border-current/20">
                      {editorTitle}
                    </h1>
                    {editorContent
                      .split("\n")
                      .filter((p) => p.trim())
                      .map((para, i) => (
                        <p key={i} className="mb-4 text-justify indent-8">
                          {para}
                        </p>
                      ))}
                    <div className="mt-10 pt-10 border-t border-dashed border-current/20 text-center opacity-50 text-sm italic">
                      --- Hết chương ---
                    </div>
                  </div>
                )}
              </div>
              {/* Footer */}
              <div
                className={clsx(
                  "absolute bottom-0 left-0 right-0 p-3 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-xs transition-transform duration-500 z-20",
                  isZenMode
                    ? "translate-y-full opacity-0 hover:translate-y-0 hover:opacity-100"
                    : ""
                )}
              >
                <div className="flex items-center gap-4 opacity-60 font-mono">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} /> {wordCount} từ
                  </span>
                  <span className="flex items-center gap-1.5 sm:flex">
                    <Clock size={12} /> {estimateReadingTime(wordCount)} phút
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="opacity-50 hidden sm:inline">Mục tiêu:</span>
                  <div className="w-20 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>
            </div>

            {/* DRAGGABLE SPLITTER */}
            {shouldShowSplit && (
              <div
                ref={splitterRef}
                className="w-1 bg-slate-200 dark:bg-white/5 hover:bg-blue-500 cursor-col-resize z-30 transition-colors hidden lg:flex items-center justify-center group"
                onMouseDown={handleMouseDownSplitter}
              >
                <GripVertical
                  size={12}
                  className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}

            {/* RIGHT SIDE: PREVIEW */}
            {shouldShowSplit && (
              <div
                className="hidden lg:block h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-black/20 border-l border-slate-200 dark:border-white/5"
                style={{ width: `${100 - splitRatio}%`, flex: "none" }}
              >
                <div
                  className={clsx(
                    "p-10 min-h-screen prose dark:prose-invert max-w-none select-none",
                    getFontFamily()
                  )}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: settings.lineHeight,
                  }}
                >
                  <h1 className="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-slate-100">
                    {editorTitle || "Tiêu đề"}
                  </h1>
                  {editorContent
                    .split("\n")
                    .filter((p) => p.trim())
                    .map((para, i) => (
                      <p
                        key={i}
                        className="mb-4 text-justify indent-8 text-slate-700 dark:text-slate-300"
                      >
                        {para}
                      </p>
                    ))}
                  <div className="mt-12 pt-8 border-t border-dashed border-current/10 text-center text-xs opacity-40 italic">
                    Preview Mode
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 select-none p-6 text-center">
            <Book size={64} className="mb-4 text-slate-400 stroke-1" />
            <p className="text-lg font-medium">
              Chào mừng trở lại Writer Studio
            </p>
            <p className="text-sm">
              Chọn một chương từ sidebar hoặc tạo mới để bắt đầu.
            </p>
          </div>
        )}

        {/* EXIT ZEN MODE BUTTON */}
        {isZenMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={() => setIsZenMode(false)}
              className="bg-black/80 hover:bg-black text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105 border border-white/20 backdrop-blur-md"
            >
              <Minimize2 size={14} /> Thoát Zen Mode
            </button>
          </div>
        )}
      </main>

      {/* MODAL CREATE/EDIT PROJECT */}
      {showProjectModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-amber-500">
              <PenTool size={24} />{" "}
              {editingProject ? "Chỉnh sửa tác phẩm" : "Khởi tạo tác phẩm"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">
                  Tên tác phẩm
                </label>
                <input
                  type="text"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-black/20 dark:border-white/10 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">
                  Tác giả
                </label>
                <input
                  type="text"
                  value={newProjAuthor}
                  onChange={(e) => setNewProjAuthor(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-black/20 dark:border-white/10 outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-sm transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveProject}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                >
                  {editingProject ? "Lưu thay đổi" : "Tạo ngay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-white/10 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">
                Xác nhận xóa{" "}
                {deleteTarget.type === "project" ? "Dự án" : "Chương"}?
              </h3>
              <p className="text-sm opacity-60 mb-6">
                Bạn có chắc muốn xóa{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  "{deleteTarget.title}"
                </span>{" "}
                không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-transform active:scale-95"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
