import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";

// Import Languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";

import {
  Copy,
  Download,
  Trash2,
  Check,
  ChevronDown,
  Save,
  Play,
  LayoutTemplate,
  Terminal,
  GripVertical,
  FolderOpen,
  Plus,
  X,
  Search,
} from "lucide-react";

// --- TYPES ---
interface Snippet {
  id: number;
  title: string;
  code: string;
  langId: string;
  date: string;
}

// --- CONFIG ---
const LANGUAGES = [
  { id: "html", label: "HTML/Web", ext: "html" },
  { id: "javascript", label: "JavaScript", ext: "js" },
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "css", label: "CSS", ext: "css" },
  { id: "python", label: "Python", ext: "py" },
  { id: "json", label: "JSON", ext: "json" },
  { id: "sql", label: "SQL", ext: "sql" },
];

const TEMPLATES: Record<string, string> = {
  // 1. HTML: Giao diện Glassmorphism hiện đại + Tailwind Animation
  html: `<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
  
  <div class="relative group w-full max-w-md">
    <div class="absolute -inset-1 bg-gradient-to-r from-pink-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
    
    <div class="relative px-7 py-6 bg-slate-900 ring-1 ring-gray-900/5 rounded-xl leading-none flex items-top justify-start space-x-6">
      
      <div class="space-y-2">
        <p class="text-slate-100 font-medium text-lg">System Notification</p>
        <p class="text-slate-400 text-sm">
          A new update is available for your dashboard.
          <br/>Version <span class="text-pink-400 font-mono">v4.0.2</span>
        </p>
        
        <div class="pt-6 flex gap-4">
          <button class="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 hover:shadow-indigo-500/40 active:scale-95">
            Update Now
          </button>
          
          <button class="px-6 py-2 rounded-full text-slate-400 text-sm font-semibold hover:text-white transition-colors">
            Dismiss
          </button>
        </div>
      </div>
      
    </div>
  </div>
</div>`,

  // 2. JS: Giả lập quá trình khởi động Server (Showcase Console xịn)
  javascript: `// 🚀 System Boot Sequence Simulation
// Click "Run" to see the logs in action!

const systemCheck = async () => {
  console.log("INITIALIZING SYSTEM...");
  
  // Helper for delay
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  await wait(800);
  console.log("› CPU Cores: ", 8);
  console.log("› Memory: ", "16GB");
  
  await wait(800);
  console.warn("⚠️ Warning: Temperature sensors calibrating...");
  
  await wait(1000);
  const services = [
    { name: "Auth Service", status: "OK", pid: 4021 },
    { name: "Database", status: "OK", pid: 4022 },
    { name: "Firewall", status: "ACTIVE", pid: 4024 }
  ];
  
  console.log("Starting Services...");
  console.log(services); // Check out the object highlighting!

  await wait(1200);
  // console.error("❌ Error: Payment Gateway connection timeout (Simulation)");
  
  await wait(800);
  console.log("✅ SYSTEM READY. Welcome back, Admin.");
};

systemCheck();`,

  // 3. TS: Interface ví dụ thực tế
  typescript: `// TypeScript Interface Example

interface UserProfile {
  id: string;
  username: string;
  roles: ('admin' | 'editor' | 'viewer')[];
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
  };
  lastLogin?: Date;
}

const currentUser: UserProfile = {
  id: "USR-8821",
  username: "neo_anderson",
  roles: ['admin'],
  settings: {
    theme: 'dark',
    notifications: true
  }
};

console.log("Current User Profile:");
console.log(currentUser);

// Try hovering over 'currentUser' properties!`,

  // 4. CSS: Hiệu ứng Neon Button
  css: `/* ✨ Neon Button Effect */

body {
  background: #0f172a;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Inter', sans-serif;
}

.neon-btn {
  font-size: 24px;
  font-weight: bold;
  color: #0ff;
  background: transparent;
  border: 4px solid #0ff;
  padding: 1rem 2rem;
  border-radius: 10px;
  text-transform: uppercase;
  text-shadow: 0 0 10px #0ff;
  box-shadow: 0 0 20px #0ff, inset 0 0 20px #0ff;
  cursor: pointer;
  transition: 0.3s;
}

.neon-btn:hover {
  background: #0ff;
  color: #000;
  box-shadow: 0 0 50px #0ff, inset 0 0 20px #0ff;
}`,

  // 5. JSON: Config giả lập
  json: `{
  "app_name": "OverDesk Dashboard",
  "version": "2.5.0",
  "author": {
    "name": "Developer",
    "github": "@dev"
  },
  "features_enabled": {
    "dark_mode": true,
    "beta_access": false,
    "max_upload_size_mb": 50
  },
  "theme_colors": ["#1e293b", "#3b82f6", "#ef4444"]
}`,

  // 6. Python: Data Processing
  python: `# Data Processing Example

users = [
    {"name": "Alice", "role": "Admin", "score": 88},
    {"name": "Bob",   "role": "User",  "score": 42},
    {"name": "Eve",   "role": "User",  "score": 95}
]

# Find high scorers
high_scorers = [u["name"] for u in users if u["score"] > 80]

print(f"Total Users: {len(users)}")
print(f"High Scorers: {high_scorers}")

def calculate_average(data):
    total = sum(u["score"] for u in data)
    return total / len(data)

print(f"Average Score: {calculate_average(users):.2f}")`,

  // 7. SQL: Query phức tạp hơn chút
  sql: `-- Analyze User Activity

SELECT 
    u.username,
    COUNT(o.order_id) as total_orders,
    SUM(o.amount) as total_spent,
    MAX(o.order_date) as last_order
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.username
HAVING total_spent > 1000
ORDER BY total_spent DESC;`,
};

export const CodeModule = () => {
  // --- STATE ---
  const [code, setCode] = useState("");
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [copied, setCopied] = useState(false);
  const [isOpenLang, setIsOpenLang] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Resizable State
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 👇 NEW: Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    // 1. Load Current Work
    const savedCode = localStorage.getItem("dashboard_code_snippet");
    const savedLangId = localStorage.getItem("dashboard_code_lang");
    if (savedLangId) {
      const found = LANGUAGES.find((l) => l.id === savedLangId);
      if (found) {
        setLang(found);
        if (found.id === "html" || found.id === "javascript")
          setShowPreview(true);
      }
    }
    if (savedCode) setCode(savedCode);
    else setCode(TEMPLATES["html"]);

    // 2. Load Snippets Library
    const savedSnippets = localStorage.getItem("dashboard_saved_snippets");
    if (savedSnippets) {
      setSnippets(JSON.parse(savedSnippets));
    }

    // 3. Handle Resize
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setEditorWidth(50);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- AUTO SAVE WORK ---
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("dashboard_code_snippet", code);
      localStorage.setItem("dashboard_code_lang", lang.id);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, lang]);

  // --- SNIPPET LOGIC ---
  const saveSnippet = () => {
    const title = prompt("Enter snippet name:", "Untitled Snippet");
    if (!title) return;

    const newSnippet: Snippet = {
      id: Date.now(),
      title,
      code,
      langId: lang.id,
      date: new Date().toLocaleDateString(),
    };

    const updated = [newSnippet, ...snippets];
    setSnippets(updated);
    localStorage.setItem("dashboard_saved_snippets", JSON.stringify(updated));
    alert("Saved to Drawer!");
  };

  const loadSnippet = (s: Snippet) => {
    if (
      window.confirm(`Load snippet "${s.title}"? Unsaved changes will be lost.`)
    ) {
      setCode(s.code);
      const found = LANGUAGES.find((l) => l.id === s.langId);
      if (found) setLang(found);
      setIsDrawerOpen(false); // Đóng drawer sau khi load
    }
  };

  const deleteSnippet = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Delete this snippet?")) {
      const updated = snippets.filter((s) => s.id !== id);
      setSnippets(updated);
      localStorage.setItem("dashboard_saved_snippets", JSON.stringify(updated));
    }
  };

  const filteredSnippets = snippets.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        newWidth = Math.max(20, Math.min(newWidth, 80));
        setEditorWidth(newWidth);
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

  // --- PREVIEW GENERATOR ---
  const getSrcDoc = () => {
    if (!code) return "";
    if (lang.id === "html") {
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script><style>::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}</style></head><body class="bg-white">${code}<script>window.onerror=function(msg,u,l){document.body.innerHTML+='<div style="position:fixed;bottom:10px;left:10px;right:10px;color:red;background:#fee;padding:10px;border:1px solid red;">❌ '+msg+' (Line '+l+')</div>';};</script></body></html>`;
    }
    if (lang.id === "javascript" || lang.id === "typescript") {
      return `<html><head><style>body{background:#1e1e1e;color:#d4d4d4;font-family:'Consolas',monospace;padding:10px;margin:0}.log-entry{padding:4px 0;border-bottom:1px solid #333;font-size:13px}.error{color:#f87171}.warn{color:#facc15}.obj{color:#60a5fa}.str{color:#ce9178}.num{color:#b5cea8}</style></head><body><div id="console"></div><script>const c=document.getElementById('console');function f(a){if(typeof a==='object')return'<span class="obj">'+JSON.stringify(a,null,2)+'</span>';if(typeof a==='string')return'<span class="str">"'+a+'"</span>';if(typeof a==='number')return'<span class="num">'+a+'</span>';return a}const o={...console};['log','error','warn'].forEach(m=>{console[m]=(...a)=>{const out=a.map(f).join(' ');c.innerHTML+=\`<div class="log-entry \${m}">\${m==='error'?'❌ ':m==='warn'?'⚠️ ':'› '}\${out}</div>\`;window.scrollTo(0,document.body.scrollHeight)}});window.onerror=function(m,u,l){console.error(m+' (Line '+(l-30)+')')};try{${code}}catch(e){console.error(e.message)}</script></body></html>`;
    }
    return `<html><body style="background:#1e1e1e;color:#d4d4d4;font-family:monospace;white-space:pre-wrap;padding:16px">${code.replace(
      /</g,
      "&lt;"
    )}</body></html>`;
  };

  const highlight = (code: string) =>
    Prism.highlight(
      code,
      Prism.languages[lang.id] || Prism.languages.javascript,
      lang.id
    );

  // --- KEYBOARD HANDLERS ---
  const handleKeyDown = (e: any) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      setCode(
        code.substring(0, selectionStart) + "  " + code.substring(selectionEnd)
      );
      setTimeout(
        () =>
          (e.target.selectionStart = e.target.selectionEnd =
            selectionStart + 2),
        0
      );
    }
    const pairs: Record<string, string> = {
      "(": ")",
      "{": "}",
      "[": "]",
      '"': '"',
      "'": "'",
    };
    if (pairs[e.key]) {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      setCode(
        code.substring(0, selectionStart) +
          e.key +
          pairs[e.key] +
          code.substring(selectionEnd)
      );
      setTimeout(
        () =>
          (e.target.selectionStart = e.target.selectionEnd =
            selectionStart + 1),
        0
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white font-sans relative overflow-hidden select-none">
      {/* 1. HEADER */}
      <div className="flex-none flex items-center justify-between p-2 md:p-3 bg-[#252526] border-b border-[#3e3e42] z-30 relative">
        <div className="flex items-center gap-2 md:gap-3">
          {/* 👇 Toggle Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`p-1.5 rounded-md transition-colors ${
              isDrawerOpen
                ? "bg-[#3c3c3c] text-white"
                : "text-gray-400 hover:text-white"
            }`}
            title="Snippet Library"
          >
            <FolderOpen size={20} />
          </button>

          <div className="h-4 w-px bg-[#3e3e42] mx-1"></div>

          <div className="relative">
            <button
              onClick={() => setIsOpenLang(!isOpenLang)}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#3c3c3c] hover:bg-[#505050] px-3 py-1.5 rounded-md transition-colors border border-transparent focus:border-blue-500 min-w-[100px] justify-between"
            >
              {lang.label} <ChevronDown size={12} />
            </button>
            {isOpenLang && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpenLang(false)}
                ></div>
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] rounded-md shadow-2xl z-50 py-1 max-h-80 overflow-y-auto custom-scrollbar">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setLang(l);
                        setIsOpenLang(false);
                        if (l.id === "html" || l.id === "javascript")
                          setShowPreview(true);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#094771] hover:text-white border-l-2 flex justify-between items-center ${
                        lang.id === l.id
                          ? "text-blue-400 border-blue-400 bg-[#3c3c3c]"
                          : "text-gray-300 border-transparent"
                      }`}
                    >
                      {l.label} {lang.id === l.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setShowPreview(!showPreview);
              setEditorWidth(50);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              showPreview
                ? "bg-green-600 text-white"
                : "bg-[#3c3c3c] text-gray-300 hover:text-white"
            }`}
          >
            {showPreview ? <LayoutTemplate size={14} /> : <Play size={14} />}{" "}
            <span className="hidden md:inline">
              {showPreview ? "Split View" : "Run"}
            </span>
          </button>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={saveSnippet}
            className="p-2 text-blue-400 hover:text-white hover:bg-[#3c3c3c] rounded-md"
            title="Save to Drawer"
          >
            <Save size={16} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#3c3c3c] rounded-md"
          >
            {copied ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([code], { type: "text/plain" })
              );
              a.download = `code.${lang.ext}`;
              a.click();
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#3c3c3c] rounded-md"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => window.confirm("Clear?") && setCode("")}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#3c3c3c] rounded-md"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* --- DRAWER PANEL (LEFT) --- */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-64 bg-[#252526] border-r border-[#3e3e42] z-40 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex-none p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#2d2d2d]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Snippets
            </span>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="p-2">
            <div className="flex items-center bg-[#3c3c3c] rounded-md px-2 py-1">
              <Search size={12} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white w-full ml-2 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredSnippets.length === 0 && (
              <div className="text-center text-gray-500 text-xs mt-10">
                No snippets found.
                <br />
                Save one to get started!
              </div>
            )}
            {filteredSnippets.map((s) => (
              <div
                key={s.id}
                onClick={() => loadSnippet(s)}
                className="group flex items-center justify-between p-2 rounded-md hover:bg-[#37373d] cursor-pointer transition-colors border border-transparent hover:border-[#454545]"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-200 truncate">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-gray-500 flex gap-2">
                    <span className="uppercase text-blue-400">{s.langId}</span>
                    <span>{s.date}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteSnippet(e, s.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Create Button */}
          <div className="p-3 border-t border-[#3e3e42]">
            <button
              onClick={saveSnippet}
              className="w-full flex items-center justify-center gap-2 bg-[#007acc] hover:bg-[#0062a3] text-white py-1.5 rounded-md text-xs font-bold transition-colors"
            >
              <Plus size={14} /> Save Current Code
            </button>
          </div>
        </div>

        {/* Backdrop for Mobile */}
        {isDrawerOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-30"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
        )}

        {/* --- MAIN CONTENT (EDITOR + PREVIEW) --- */}
        <div
          className={`flex-1 flex overflow-hidden relative ${
            showPreview ? "flex-col md:flex-row" : "flex-col"
          }`}
        >
          {/* EDITOR */}
          <div
            className="relative bg-[#1e1e1e] flex flex-col min-h-0"
            style={{
              width: showPreview && !isMobile ? `${editorWidth}%` : "100%",
              height: showPreview && isMobile ? "50%" : "100%",
            }}
          >
            <div className="flex-1 flex overflow-hidden relative">
              <div className="hidden md:block w-10 flex-none bg-[#1e1e1e] border-r border-[#333] text-right pr-2 pt-5 text-[#6e7681] font-mono text-sm select-none overflow-hidden">
                {code.split("\n").map((_, i) => (
                  <div key={i} className="leading-[1.5]">
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar relative">
                <Editor
                  value={code}
                  onValueChange={setCode}
                  highlight={highlight}
                  padding={20}
                  onKeyDown={handleKeyDown}
                  className="font-mono text-xs min-h-full"
                  style={{
                    fontFamily: '"Fira Code", "Consolas", monospace',
                    fontSize: 12,
                    lineHeight: "1.5",
                    backgroundColor: "#1e1e1e",
                    color: "#d4d4d4",
                  }}
                  textareaClassName="focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* RESIZER */}
          {showPreview && !isMobile && (
            <div
              className="hidden md:flex w-2 bg-[#252526] border-x border-[#3e3e42] cursor-col-resize hover:bg-blue-500 hover:border-blue-500 transition-colors items-center justify-center z-20 shrink-0"
              onMouseDown={startResizing}
            >
              <GripVertical size={12} className="text-gray-500" />
            </div>
          )}

          {/* PREVIEW */}
          {showPreview && (
            <div
              className="bg-white flex flex-col min-h-0 relative"
              style={{
                width: !isMobile ? `${100 - editorWidth}%` : "100%",
                height: isMobile ? "50%" : "100%",
              }}
            >
              {isDragging && (
                <div className="absolute inset-0 z-50 bg-transparent"></div>
              )}
              <div className="flex-none bg-[#f3f4f6] px-3 py-1.5 border-b border-gray-200 flex justify-between items-center text-slate-600">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  {lang.id === "javascript" ? (
                    <Terminal size={12} />
                  ) : (
                    <LayoutTemplate size={12} />
                  )}{" "}
                  Output
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded">
                  {lang.id === "html" ? "Browser" : "Console"}
                </span>
              </div>
              <iframe
                srcDoc={getSrcDoc()}
                className="flex-1 w-full h-full border-none bg-white"
                title="Preview"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex-none bg-[#007acc] text-white px-3 py-1 text-[10px] flex justify-between items-center select-none z-20">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <Save size={10} /> Auto-saved
          </span>
          <span>
            Ln {code.split("\n").length}, Col {code.length}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="uppercase font-bold opacity-90">{lang.label}</span>
          <span className="opacity-70">UTF-8</span>
        </div>
      </div>

      <style>{`.token.comment{color:#6a9955}.token.string{color:#ce9178}.token.number{color:#b5cea8}.token.keyword{color:#c586c0}.token.function{color:#dcdcaa}`}</style>
    </div>
  );
};
