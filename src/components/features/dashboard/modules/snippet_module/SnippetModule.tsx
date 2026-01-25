import { useState, useEffect, useMemo } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css";

import {
  Code2,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Save,
  Hash,
  X,
  Edit3,
  Star,
  Menu,
  Download,
  Globe,
  AlignLeft,
} from "lucide-react";
import { useToastStore } from "../../../../../stores/useToastStore";
import { Snippet } from "./types/snippet_type";
import { SUPPORTED_LANGS } from "./constants/snippet_const";

export const SnippetModule = () => {
  // --- STATE & EFFECTS ---
  const { showToast } = useToastStore();

  // Snippet Data State
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState<string>("all");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLang, setEditLang] = useState("javascript");
  const [editTags, setEditTags] = useState("");

  // Initial Load & Persistence
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_snippets");
    if (saved) {
      setSnippets(JSON.parse(saved));
    } else {
      const demo: Snippet = {
        id: "demo_1",
        title: "Fetch Helper.js",
        lang: "javascript",
        code: "async function getData(url) {\n  const response = await fetch(url);\n  return response.json();\n}",
        tags: ["api", "network"],
        isFavorite: true,
        updatedAt: Date.now(),
      };
      setSnippets([demo]);
      setSelectedId("demo_1");
    }
  }, []);

  useEffect(() => {
    if (snippets.length > 0)
      localStorage.setItem("dashboard_snippets", JSON.stringify(snippets));
  }, [snippets]);

  // --- LOGIC & HELPERS ---

  const activeSnippet = snippets.find((s) => s.id === selectedId);

  const highlightCode = (code: string) => {
    const langDef =
      languages[isEditing ? editLang : activeSnippet?.lang || "javascript"] ||
      languages.javascript;
    return highlight(
      code,
      langDef,
      isEditing ? editLang : activeSnippet?.lang || "javascript",
    );
  };

  // Smart Language Detection from Filename
  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    const ext = val.split(".").pop()?.toLowerCase();
    if (ext) {
      const matchedLang = SUPPORTED_LANGS.find((l) => l.ext === ext);
      if (matchedLang) setEditLang(matchedLang.id);
    }
  };

  // --- ACTIONS (CRUD) ---

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsEditing(false);
    setCopied(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleCreate = () => {
    const newId = `snp_${Date.now()}`;
    const newSnippet: Snippet = {
      id: newId,
      title: "Untitled.js",
      lang: "javascript",
      code: "// Happy coding...",
      tags: [],
      isFavorite: false,
      updatedAt: Date.now(),
    };
    setSnippets([newSnippet, ...snippets]);
    setSelectedId(newId);

    // Auto populate edit fields
    setEditTitle(newSnippet.title);
    setEditCode(newSnippet.code);
    setEditLang(newSnippet.lang);
    setEditTags("");
    setIsEditing(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const startEdit = () => {
    if (!activeSnippet) return;
    setEditTitle(activeSnippet.title);
    setEditCode(activeSnippet.code);
    setEditLang(activeSnippet.lang);
    setEditTags(activeSnippet.tags.join(", "));
    setIsEditing(true);
  };

  const saveSnippet = () => {
    if (!selectedId) return;
    const updated = snippets.map((s) => {
      if (s.id === selectedId) {
        return {
          ...s,
          title: editTitle,
          code: editCode,
          lang: editLang,
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
          updatedAt: Date.now(),
        };
      }
      return s;
    });
    setSnippets(updated);
    setIsEditing(false);
    showToast("Snippet saved", "success");
  };

  const deleteSnippet = (id: string) => {
    const updated = snippets.filter((s) => s.id !== id);
    setSnippets(updated);
    if (selectedId === id) setSelectedId(null);
    showToast("Snippet deleted", "success");
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = snippets.map((s) =>
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s,
    );
    setSnippets(updated);
    if (updated.find((s) => s.id === id)?.isFavorite) {
      showToast("Marked as favorite", "success");
    } else {
      showToast("Removed from favorites", "success");
    }
  };

  // --- EXPORT & UTILS ---

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSnippets = () => {
    const blob = new Blob([JSON.stringify(snippets, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_snippets_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    showToast("Snippets exported as JSON", "success");
  };

  // --- COMPUTED DATA ---

  const filteredSnippets = useMemo(() => {
    let res = snippets;

    // 1. Filter by Lang
    if (filterLang !== "all") {
      res = res.filter((s) => s.lang === filterLang);
    }

    // 2. Filter by Favorite
    if (showFavoritesOnly) {
      res = res.filter((s) => s.isFavorite);
    }

    // 3. Search (Deep Search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.code.toLowerCase().includes(q),
      );
    }

    // 4. Sort: Favorites first, then Date
    return res.sort((a, b) => {
      if (a.isFavorite === b.isFavorite) return b.updatedAt - a.updatedAt;
      return a.isFavorite ? -1 : 1;
    });
  }, [snippets, filterLang, searchQuery, showFavoritesOnly]);

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* 1. SIDEBAR (Responsive Drawer) */}
      <div
        className={`
          absolute md:relative inset-y-0 left-0 z-30
          w-72 border-r border-[#3e3e42] bg-[#252526] flex flex-col shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
      `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-white">
              <Code2 size={20} className="text-yellow-500" />
              <span className="tracking-tight">Code Library</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Show Favorites"
              >
                <Star
                  size={16}
                  fill={showFavoritesOnly ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={exportSnippets}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Backup JSON"
              >
                <Download size={16} />
              </button>
              <button
                onClick={handleCreate}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code..."
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-yellow-500 outline-none"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar border-b border-[#3e3e42] bg-[#252526]">
          <button
            onClick={() => setFilterLang("all")}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
              filterLang === "all"
                ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                : "bg-[#3e3e42] text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            All
          </button>
          {SUPPORTED_LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setFilterLang(l.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                filterLang === l.id
                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                  : "bg-[#3e3e42] text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Snippet List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredSnippets.length === 0 && (
            <div className="text-center text-slate-500 text-xs mt-10 italic">
              No snippets found
            </div>
          )}
          {filteredSnippets.map((s) => {
            const LangIcon =
              SUPPORTED_LANGS.find((l) => l.id === s.lang)?.icon || Code2;
            return (
              <div
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className={`group relative p-3 rounded-xl pointer border transition-all ${
                  selectedId === s.id
                    ? "bg-gradient-to-r from-[#3e3e42] to-[#323236] border-slate-500 shadow-md"
                    : "border-transparent hover:bg-[#2a2d2e] hover:border-[#3e3e42]"
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <LangIcon
                      size={14}
                      className={
                        selectedId === s.id
                          ? "text-yellow-500"
                          : "text-slate-500"
                      }
                    />
                    <span
                      className={`font-bold text-sm truncate ${
                        selectedId === s.id ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(s.id, e)}
                    className={`transition-colors ${
                      s.isFavorite
                        ? "text-yellow-500 opacity-100"
                        : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-yellow-500"
                    }`}
                  >
                    <Star
                      size={14}
                      fill={s.isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {s.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e1e1e] text-slate-500 border border-[#3e3e42]"
                    >
                      #{t}
                    </span>
                  ))}
                  <span className="text-[9px] text-slate-600 ml-auto">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-[#3e3e42] bg-[#252526]">
          <div className="flex items-center gap-2 font-bold text-white">
            <Code2 size={18} className="text-yellow-500" /> Snippets
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-300"
          >
            <Menu size={18} />
          </button>
        </div>

        {activeSnippet ? (
          <>
            {/* Header Toolbar */}
            <div className="h-16 flex-none border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between px-4 md:px-6">
              {isEditing ? (
                <div className="flex flex-col md:flex-row gap-2 md:items-center flex-1 mr-4 animate-in fade-in">
                  <div className="relative flex-1">
                    <input
                      value={editTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full bg-[#1e1e1e] text-white px-3 py-2 rounded-lg border border-[#3e3e42] focus:border-yellow-500 outline-none text-sm font-bold placeholder:text-slate-600"
                      placeholder="Snippet Title (e.g. script.js)"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative min-w-[120px]">
                      <select
                        value={editLang}
                        onChange={(e) => setEditLang(e.target.value)}
                        className="w-full bg-[#1e1e1e] text-slate-300 px-3 py-2 rounded-lg border border-[#3e3e42] text-xs outline-none appearance-none pointer focus:border-yellow-500"
                      >
                        {SUPPORTED_LANGS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                      <Globe
                        size={12}
                        className="absolute right-3 top-3 text-slate-500 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeSnippet.title}
                    {activeSnippet.isFavorite && (
                      <Star
                        size={14}
                        className="text-yellow-500"
                        fill="currentColor"
                      />
                    )}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-yellow-500/20">
                      {activeSnippet.lang}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Updated{" "}
                      {new Date(activeSnippet.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 rounded-lg bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSnippet}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                    >
                      <Save size={14} /> Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => deleteSnippet(activeSnippet.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-[#3e3e42] rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={startEdit}
                      className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-[#3e3e42] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(activeSnippet.code)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
                      <span className="hidden md:inline">
                        {copied ? "Copied" : "Copy Code"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tags Input (Edit Mode Only) */}
            {isEditing && (
              <div className="px-6 py-3 bg-[#1e1e1e] border-b border-[#3e3e42] flex items-center gap-3 animate-in slide-in-from-top-2">
                <Hash size={14} className="text-slate-500" />
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="Tags (comma separated)... e.g. api, utils, helper"
                  className="flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600 font-mono"
                />
              </div>
            )}

            {/* Code Editor Area */}
            <div className="flex-1 overflow-auto relative bg-[#1e1e1e] group custom-scrollbar flex flex-col">
              <div className="flex-1 relative">
                <Editor
                  value={isEditing ? editCode : activeSnippet.code}
                  onValueChange={(code) => setEditCode(code)}
                  highlight={(code) => highlightCode(code)}
                  padding={24}
                  className="font-mono text-sm min-h-full"
                  disabled={!isEditing}
                  style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    backgroundColor: "#1e1e1e",
                    color: "#d4d4d4",
                    lineHeight: "1.6",
                  }}
                  textareaClassName="focus:outline-none"
                />
                {!isEditing && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] text-slate-400 pointer-events-none backdrop-blur-sm">
                    Read Only
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="flex-none px-4 py-1 bg-[#252526] border-t border-[#3e3e42] text-[10px] text-slate-500 flex justify-between items-center select-none">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <AlignLeft size={10} /> Lines:{" "}
                    {
                      (isEditing ? editCode : activeSnippet.code).split("\n")
                        .length
                    }
                  </span>
                  <span>
                    Chars: {(isEditing ? editCode : activeSnippet.code).length}
                  </span>
                </div>
                <div className="uppercase font-bold tracking-wider opacity-50">
                  {activeSnippet.lang}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 animate-in fade-in zoom-in">
            <div className="bg-[#252526] p-5 rounded-full mb-4 shadow-xl border border-[#3e3e42]">
              <Code2 size={48} className="text-yellow-600 opacity-50" />
            </div>
            <p className="text-sm font-medium">
              Select a snippet or create a new one
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3e3e42] text-slate-300 rounded-lg text-xs font-bold transition-all border border-[#3e3e42]"
            >
              Create New Snippet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
