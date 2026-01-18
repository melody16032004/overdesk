import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"; // CẦN CÀI: npm install remark-breaks
import {
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Columns,
  Download,
  Trash2,
  Maximize2,
  Table as TableIcon,
  CheckSquare,
  Undo,
  Redo,
  FileCode,
  Type,
  Clock,
  Copy,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

// --- TYPES ---
type ViewMode = "editor" | "preview" | "split";

const DEFAULT_TEXT = `# Welcome to Ultimate Notes 🚀

This editor combines **Pro Features** and **Smart Rendering**.

## Features
- [x] **Interactive Checkboxes** (Click me!)
- [x] Auto-generated Table of Contents
- [x] Smart Line Breaks (Enter once)
- [x] Code Highlighting & Copy

> "Simplicity is the ultimate sophistication."

### Sub-heading Example
This is a demonstration of H3.

## Code Example
\`\`\`javascript
// Try clicking the Copy button!
const magic = true;
console.log("Hello World");
\`\`\`

## Table Data
| Feature | Status | Priority |
| :--- | :--- | :--- |
| Auto-save | ✅ Ready | High |
| Stats | ✅ Ready | Low |
`;

export const MarkdownModule = () => {
  // --- STATE ---
  const [content, setContent] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [saved, setSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);

  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- INITIAL LOAD & RESIZE ---
  useEffect(() => {
    const savedContent = localStorage.getItem("dashboard_markdown_content");
    const initialText = savedContent || DEFAULT_TEXT;
    setContent(initialText);
    setHistory([initialText]);
    setHistoryIndex(0);

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === "split") setViewMode("editor");
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- HISTORY MANAGEMENT ---
  const updateContent = (newContent: string) => {
    setContent(newContent);
  };

  const saveToHistory = useCallback(
    (newContent: string) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        history[historyIndex] !== undefined &&
        content !== history[historyIndex]
      ) {
        saveToHistory(content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, historyIndex, history, saveToHistory]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  // --- AUTO SAVE ---
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("dashboard_markdown_content", content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [content]);

  // --- STATS ---
  const stats = useMemo(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((w) => w !== "").length;
    const chars = content.length;
    const readTime = Math.ceil(words / 200);
    return { words, chars, readTime };
  }, [content]);

  // --- TOC GENERATION ---
  const tableOfContents = useMemo(() => {
    const lines = content.split("\n");
    const headers = lines
      .filter((line) => line.startsWith("#"))
      .map((line) => {
        const level = line.match(/^#+/)?.[0].length || 0;
        const text = line.replace(/^#+\s/, "");
        return { level, text };
      });
    return headers;
  }, [content]);

  // --- LOGIC: Interactive Checkbox ---
  const toggleCheckbox = (index: number) => {
    const regex = /- \[[ x]\]/g;
    let match;
    let currentIndex = 0;
    let newContent = content;

    while ((match = regex.exec(content)) !== null) {
      if (currentIndex === index) {
        const currentStatus = match[0] === "- [x]";
        const newStatusString = currentStatus ? "- [ ]" : "- [x]";
        newContent =
          content.substring(0, match.index) +
          newStatusString +
          content.substring(match.index + match[0].length);
        updateContent(newContent);
        break;
      }
      currentIndex++;
    }
  };

  // --- MARKDOWN COMPONENTS ---
  const MarkdownComponents = useMemo(() => {
    let checkboxCounter = 0;
    return {
      input: (props: any) => {
        if (props.type === "checkbox") {
          const currentIndex = checkboxCounter++;
          return (
            <input
              type="checkbox"
              checked={props.checked}
              onChange={() => toggleCheckbox(currentIndex)}
              className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
          );
        }
        return <input {...props} />;
      },
      code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        const codeText = String(children).replace(/\n$/, "");
        if (!inline && match) {
          return (
            <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#1e1e1e] shadow-sm">
              <div className="flex justify-between items-center px-3 py-1.5 bg-[#252526] border-b border-white/10 text-xs text-slate-400 select-none">
                <span className="font-mono text-blue-400">{match[1]}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeText)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <div className="overflow-x-auto p-4 text-sm font-mono leading-relaxed text-gray-200">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            </div>
          );
        }
        return (
          <code
            className="bg-slate-100 dark:bg-slate-800 text-pink-500 dark:text-pink-400 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-slate-200 dark:border-slate-700"
            {...props}
          >
            {children}
          </code>
        );
      },
      blockquote: (props: any) => (
        <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 px-4 py-3 my-4 rounded-r-lg text-slate-600 dark:text-slate-300 italic relative">
          <Quote
            size={20}
            className="absolute -top-2 -left-2 text-blue-500 fill-white dark:fill-slate-900"
          />
          {props.children}
        </blockquote>
      ),
      table: (props: any) => (
        <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <table
            className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
            {...props}
          />
        </div>
      ),
      thead: (props: any) => (
        <thead className="bg-slate-50 dark:bg-slate-800" {...props} />
      ),
      th: (props: any) => (
        <th
          className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider"
          {...props}
        />
      ),
      td: (props: any) => (
        <td
          className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700"
          {...props}
        />
      ),
      a: (props: any) => (
        <a
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
    };
  }, [content]);

  // --- TOOLBAR ACTIONS ---
  const insertText = (before: string, after: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText =
      text.substring(0, start) +
      before +
      text.substring(start, end) +
      after +
      text.substring(end);
    updateContent(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = end + before.length;
    }, 0);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- RESIZE LOGIC ---
  const startResizing = useCallback(
    () => !isMobile && setIsDragging(true),
    [isMobile]
  );
  const stopResizing = useCallback(() => setIsDragging(false), []);
  const resize = useCallback(
    (e: MouseEvent) => {
      if (isDragging && containerRef.current && !isMobile) {
        const containerRect = containerRef.current.getBoundingClientRect();
        let newWidth =
          ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setEditorWidth(Math.max(20, Math.min(newWidth, 80)));
      }
    },
    [isDragging, isMobile]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isDragging, resize, stopResizing]);

  // --- RENDER ---
  return (
    <div
      className={clsx(
        "flex flex-col bg-slate-50 dark:bg-[#0d1117] font-sans text-slate-900 dark:text-slate-100 relative overflow-hidden transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full"
      )}
    >
      {/* 1. TOOLBAR */}
      <div className="flex-none flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] z-20 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <FileCode size={18} className="text-blue-500" />
            <span className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-200">
              Markdown Pro
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
              {saved ? (
                <CheckCircle2 size={10} className="text-green-500" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              )}
              {saved ? "Saved" : "Saving..."}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg mr-2">
              {!isMobile && (
                <button
                  onClick={() => {
                    setViewMode("split");
                    setEditorWidth(50);
                  }}
                  className={clsx(
                    "p-1.5 rounded transition-all",
                    viewMode === "split"
                      ? "bg-white dark:bg-slate-600 shadow text-blue-500"
                      : "text-slate-400"
                  )}
                  title="Split"
                >
                  <Columns size={14} />
                </button>
              )}
              <button
                onClick={() => setViewMode("editor")}
                className={clsx(
                  "p-1.5 rounded transition-all",
                  viewMode === "editor"
                    ? "bg-white dark:bg-slate-600 shadow text-blue-500"
                    : "text-slate-400"
                )}
                title="Editor"
              >
                <FileText size={14} />
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={clsx(
                  "p-1.5 rounded transition-all",
                  viewMode === "preview"
                    ? "bg-white dark:bg-slate-600 shadow text-blue-500"
                    : "text-slate-400"
                )}
                title="Preview"
              >
                <Eye size={14} />
              </button>
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>

        {/* FULL TOOLBAR RESTORED */}
        <div className="flex items-center justify-between px-2 py-1.5 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2">
            <div className="flex items-center border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 text-slate-500 disabled:opacity-30 hover:bg-slate-100 rounded"
              >
                <Undo size={14} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-slate-500 disabled:opacity-30 hover:bg-slate-100 rounded"
              >
                <Redo size={14} />
              </button>
            </div>
            {/* Text Style */}
            <div className="flex gap-0.5">
              <button
                onClick={() => insertText("**", "**")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Bold"
              >
                <Bold size={15} />
              </button>
              <button
                onClick={() => insertText("*", "*")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Italic"
              >
                <Italic size={15} />
              </button>
              <button
                onClick={() => insertText("~~", "~~")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 line-through text-sm px-2"
                title="Strikethrough"
              >
                S
              </button>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            {/* Headings */}
            <div className="flex gap-0.5">
              <button
                onClick={() => insertText("# ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="H1"
              >
                <Heading1 size={15} />
              </button>
              <button
                onClick={() => insertText("## ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="H2"
              >
                <Heading2 size={15} />
              </button>
              <button
                onClick={() => insertText("### ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="H3"
              >
                <Heading3 size={15} />
              </button>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            {/* Lists & Block */}
            <div className="flex gap-0.5">
              <button
                onClick={() => insertText("- ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="List"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => insertText("1. ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Ordered List"
              >
                <ListOrdered size={15} />
              </button>
              <button
                onClick={() => insertText("- [ ] ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Task List"
              >
                <CheckSquare size={15} />
              </button>
              <button
                onClick={() => insertText("> ")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Quote"
              >
                <Quote size={15} />
              </button>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            {/* Insertions */}
            <div className="flex gap-0.5">
              <button
                onClick={() => insertText("```\n", "\n```")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Code"
              >
                <Code size={15} />
              </button>
              <button
                onClick={() =>
                  insertText("| H1 | H2 |\n| --- | --- |\n| C1 | C2 |")
                }
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Table"
              >
                <TableIcon size={15} />
              </button>
              <button
                onClick={() => insertText("[", "](url)")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Link"
              >
                <LinkIcon size={15} />
              </button>
              <button
                onClick={() => insertText("![alt](", ")")}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                title="Image"
              >
                <ImageIcon size={15} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4 border-l border-slate-200 dark:border-slate-700 pl-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => {
                if (window.confirm("Clear?")) updateContent("");
              }}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        <div
          className={clsx(
            "flex flex-col bg-white dark:bg-[#0d1117]",
            viewMode === "preview" ? "hidden" : ""
          )}
          style={{ width: viewMode === "split" ? `${editorWidth}%` : "100%" }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            className="flex-1 w-full h-full p-6 resize-none outline-none bg-transparent font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-300 custom-scrollbar selection:bg-blue-100 dark:selection:bg-blue-900/30"
            placeholder="Type your markdown here..."
            spellCheck={false}
          />
          <div className="absolute bottom-2 right-4 text-[10px] text-slate-300 dark:text-slate-600 pointer-events-none opacity-50">
            Ln{" "}
            {
              content.substr(0, textareaRef.current?.selectionStart).split("\n")
                .length
            }
          </div>
        </div>

        {viewMode === "split" && (
          <div
            className="w-1 bg-slate-100 dark:bg-[#21262d] hover:bg-blue-400 cursor-col-resize z-10 flex items-center justify-center group"
            onMouseDown={startResizing}
          >
            <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-white" />
          </div>
        )}

        <div
          className={clsx(
            "flex flex-col bg-slate-50 dark:bg-[#0d1117] relative",
            viewMode === "editor" ? "hidden" : ""
          )}
          style={{
            width: viewMode === "split" ? `${100 - editorWidth}%` : "100%",
          }}
        >
          <button
            onClick={() => setShowToc(!showToc)}
            className={clsx(
              "absolute top-4 right-4 z-20 p-2 rounded-full shadow border transition-colors",
              showToc
                ? "bg-blue-100 text-blue-600 border-blue-200"
                : "bg-white/80 dark:bg-slate-800/80 text-slate-400 border-slate-200 dark:border-slate-700"
            )}
            title="Table of Contents"
          >
            <List size={16} />
          </button>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar p-8 md:px-12 md:py-8">
              <article
                className="markdown-body prose prose-slate dark:prose-invert max-w-none 
                    prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-800 prose-h2:pb-2
                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-pre:bg-transparent prose-pre:p-0
                "
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={MarkdownComponents}
                >
                  {content}
                </ReactMarkdown>
              </article>
              <div className="h-20" />
            </div>

            {showToc && (
              <div className="w-64 bg-white dark:bg-[#161b22] border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-4 hidden md:block animate-in slide-in-from-right-10">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                  <List size={12} /> Table of Contents
                </h3>
                <ul className="space-y-2">
                  {tableOfContents.map((header, i) => (
                    <li
                      key={i}
                      style={{ marginLeft: `${(header.level - 1) * 12}px` }}
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-500 truncate cursor-pointer transition-colors">
                        <ChevronRight size={10} className="opacity-50" />{" "}
                        {header.text}
                      </div>
                    </li>
                  ))}
                  {tableOfContents.length === 0 && (
                    <li className="text-xs text-slate-400 italic">
                      No headers found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-transparent cursor-col-resize" />
        )}
      </div>

      {/* 3. FOOTER */}
      <div className="flex-none h-7 bg-white dark:bg-[#161b22] border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between items-center px-4 select-none">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {stats.readTime} min read
          </span>
          <span className="flex items-center gap-1">
            <Type size={10} /> {stats.words} words
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <span>{stats.chars} chars</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span>Markdown Pro</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
