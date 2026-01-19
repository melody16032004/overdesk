import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";

import {
  Braces,
  AlignLeft,
  Minimize2,
  Network,
  Copy,
  Trash2,
  Check,
  AlertTriangle,
  FileJson,
  ChevronDown,
  PenTool,
  Plus,
  X,
  Type,
  FolderOpen,
  Search,
  Save,
  Download,
  Upload,
  FileUp,
  FileDown,
  HardDrive,
} from "lucide-react";
import { useToastStore } from "../../../../../stores/useToastStore";
import { FieldType, FormField, JsonFile } from "./types/json_type";
import { SAMPLE_JSON } from "./constants/json_const";
import { JsonNode } from "./components/JsonNode";

// --- MAIN MODULE ---

export const JsonModule = () => {
  // --- STATE & REFS ---
  const { showToast } = useToastStore();

  // Editor Content State
  const [json, setJson] = useState("");
  const [view, setView] = useState<"code" | "tree" | "form">("code");
  const [fields, setFields] = useState<FormField[]>([]); // Form State

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ size: "0 B", items: 0 });
  const [activeMenu, setActiveMenu] = useState<"none" | "disk" | "format">(
    "none",
  );

  // Library/Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [savedFiles, setSavedFiles] = useState<JsonFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  // --- HOOKS & EFFECTS ---

  // Initial Load
  useEffect(() => {
    const savedContent = localStorage.getItem("dashboard_json_content");
    const initJson = savedContent || SAMPLE_JSON;
    setJson(initJson);
    validate(initJson);
    parseJsonToForm(initJson);

    const library = localStorage.getItem("dashboard_json_library");
    if (library) setSavedFiles(JSON.parse(library));
  }, []);

  // Auto Save
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("dashboard_json_content", json);
    }, 500);
    return () => clearTimeout(timer);
  }, [json]);

  // Save Hotkey Handler (Memoized for use in Effect and as Action)
  const handleSaveHotkey = useCallback(() => {
    const name = prompt("Enter file name:", "Untitled JSON");
    if (!name) return;

    const existingIndex = savedFiles.findIndex((f) => f.name === name);
    let updatedFiles = [...savedFiles];

    if (existingIndex !== -1) {
      showToast(`Overwriting existing file "${name}".`);
      updatedFiles[existingIndex] = {
        ...updatedFiles[existingIndex],
        content: json,
        date: new Date().toLocaleDateString(),
      };
      showToast(`Updated "${name}" in library.`);
    } else {
      updatedFiles = [
        {
          id: Date.now(),
          name,
          content: json,
          date: new Date().toLocaleDateString(),
        },
        ...savedFiles,
      ];
      showToast(`Saved new file "${name}" to library.`);
    }
    setSavedFiles(updatedFiles);
    localStorage.setItem(
      "dashboard_json_library",
      JSON.stringify(updatedFiles),
    );
  }, [json, savedFiles]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s": // Save
            e.preventDefault();
            handleSaveHotkey();
            break;
          case "d": // Clear
            e.preventDefault();
            setJson("");
            setFields([]);
            showToast("Cleared JSON content.");
            break;
          case "x": // Toggle Drawer
            e.preventDefault();
            setIsDrawerOpen((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveHotkey]);

  // --- LOGIC & HELPERS ---

  const validate = (val: string) => {
    try {
      if (!val.trim()) {
        setStats({ size: "0 B", items: 0 });
        setError(null);
        return;
      }
      const parsed = JSON.parse(val);
      setError(null);
      const size = new Blob([val]).size;
      const sizeStr =
        size > 1024 ? `${(size / 1024).toFixed(2)} KB` : `${size} B`;
      const items = Array.isArray(parsed)
        ? parsed.length
        : Object.keys(parsed).length;
      setStats({ size: sizeStr, items });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const parseJsonToForm = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        parsed !== null
      ) {
        const newFields: FormField[] = Object.entries(parsed).map(
          ([key, val], idx) => {
            let type: FieldType = "string";
            let value = String(val);
            if (typeof val === "number") type = "number";
            else if (typeof val === "boolean") type = "boolean";
            else if (val === null) {
              type = "null";
              value = "null";
            } else if (typeof val === "object") {
              value = JSON.stringify(val);
            }
            return { id: Date.now() + idx, key, value, type };
          },
        );
        setFields(newFields);
      }
    } catch (e) {}
  };

  const syncFormToJson = (currentFields: FormField[]) => {
    const obj: any = {};
    currentFields.forEach((f) => {
      if (!f.key) return;
      if (f.type === "number") obj[f.key] = Number(f.value);
      else if (f.type === "boolean") obj[f.key] = f.value === "true";
      else if (f.type === "null") obj[f.key] = null;
      else {
        try {
          if (
            (f.value.startsWith("{") || f.value.startsWith("[")) &&
            f.type === "string"
          ) {
            obj[f.key] = JSON.parse(f.value);
          } else {
            obj[f.key] = f.value;
          }
        } catch {
          obj[f.key] = f.value;
        }
      }
    });
    const newJson = JSON.stringify(obj, null, 2);
    setJson(newJson);
    validate(newJson);
    showToast("Synchronized form to JSON.");
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(json);
      setJson(JSON.stringify(parsed, null, 2));
      setActiveMenu("none");
    } catch (e) {
      showToast("Invalid JSON", "error");
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(json);
      setJson(JSON.stringify(parsed));
      setActiveMenu("none");
    } catch (e) {
      showToast("Invalid JSON", "error");
    }
  };

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [json]);

  const filteredFiles = savedFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- ACTIONS: DISK & LIBRARY ---

  const saveToLibrary = handleSaveHotkey;

  const handleDownloadDisk = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActiveMenu("none");
    showToast("Downloaded JSON file.");
  };

  const handleUploadDisk = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJson(content);
      validate(content);
      parseJsonToForm(content);
      if (view === "tree") setView("code");
    };
    reader.readAsText(file);
    e.target.value = "";
    setActiveMenu("none");
    showToast("Loaded JSON file from disk.");
  };

  const handleExportLibrary = () => {
    const blob = new Blob([JSON.stringify(savedFiles, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `json_lib_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported library to JSON file.");
  };

  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          if (window.confirm(`Merge ${parsed.length} files?`)) {
            const newLib = [...parsed, ...savedFiles].filter(
              (v, i, a) => a.findIndex((v2) => v2.id === v.id) === i,
            );
            setSavedFiles(newLib);
            localStorage.setItem(
              "dashboard_json_library",
              JSON.stringify(newLib),
            );
            showToast("Imported library file and merged.");
          }
        }
      } catch (e) {
        showToast("Error importing library file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const loadFromLibrary = (file: JsonFile) => {
    setJson(file.content);
    validate(file.content);
    parseJsonToForm(file.content);
    setIsDrawerOpen(false);
    showToast(`Loaded "${file.name}" from library.`);
  };

  const deleteFromLibrary = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const updated = savedFiles.filter((f) => f.id !== id);
    setSavedFiles(updated);
    localStorage.setItem("dashboard_json_library", JSON.stringify(updated));
    showToast("Deleted file from library.");
  };

  // --- VIEW HANDLERS ---

  const addField = () => {
    setFields([
      ...fields,
      { id: Date.now(), key: "", value: "", type: "string" },
    ]);
    showToast("Added new field to form.");
  };

  const updateField = (id: number, key: keyof FormField, val: string) => {
    const newFields = fields.map((f) =>
      f.id === id ? { ...f, [key]: val } : f,
    );
    setFields(newFields);
    syncFormToJson(newFields);
  };

  const removeField = (id: number) => {
    const newFields = fields.filter((f) => f.id !== id);
    setFields(newFields);
    syncFormToJson(newFields);
    showToast("Removed field from form.");
  };

  const handleSetView = (v: "code" | "tree" | "form") => {
    if (v === "form") parseJsonToForm(json);
    setView(v);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans relative overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex-none p-2 md:p-3 border-b border-[#3e3e42] flex items-center justify-between bg-[#252526] z-20 relative">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`p-1.5 rounded transition-colors ${
              isDrawerOpen
                ? "bg-[#3e3e42] text-white"
                : "text-slate-400 hover:text-white"
            }`}
            title="Library (Ctrl+X)"
          >
            <FolderOpen size={20} />
          </button>
          <div className="h-4 w-px bg-[#3e3e42]"></div>

          <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#3e3e42]">
            <button
              onClick={() => handleSetView("code")}
              className={`p-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${
                view === "code"
                  ? "bg-yellow-500 text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Braces size={14} /> Code
            </button>
            <button
              onClick={() => handleSetView("form")}
              className={`p-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${
                view === "form"
                  ? "bg-blue-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PenTool size={14} /> Form
            </button>
            <button
              onClick={() => handleSetView("tree")}
              disabled={!!error}
              className={`p-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${
                view === "tree"
                  ? "bg-purple-500 text-white shadow"
                  : "text-slate-400 hover:text-white disabled:opacity-30"
              }`}
            >
              <Network size={14} /> Tree
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 1. DISK DROPDOWN */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveMenu(activeMenu === "disk" ? "none" : "disk")
              }
              className={`p-2 rounded flex items-center gap-1 text-xs font-bold ${
                activeMenu === "disk"
                  ? "bg-[#3e3e42] text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#3e3e42]"
              }`}
            >
              <HardDrive size={16} />{" "}
              <span className="hidden md:inline">Disk</span>{" "}
              <ChevronDown size={10} />
            </button>
            {activeMenu === "disk" && (
              <div className="absolute top-full right-0 mt-1 w-36 bg-[#2d2d2d] border border-[#3e3e42] rounded-md shadow-xl py-1 z-50">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleUploadDisk}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#3e3e42] flex items-center gap-2"
                >
                  <Upload size={14} className="text-blue-400" /> Open
                </button>
                <button
                  onClick={handleDownloadDisk}
                  disabled={json.trim().length === 0}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#3e3e42] flex items-center gap-2 ${
                    json.trim().length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <Download size={14} className="text-green-400" /> Save As...
                </button>
              </div>
            )}
          </div>

          {/* 2. FORMAT DROPDOWN */}
          <div className="relative">
            <button
              onClick={() =>
                setActiveMenu(activeMenu === "format" ? "none" : "format")
              }
              className={`p-2 rounded flex items-center gap-1 text-xs font-bold ${
                activeMenu === "format"
                  ? "bg-[#3e3e42] text-white"
                  : "text-slate-400 hover:text-white hover:bg-[#3e3e42]"
              }`}
            >
              <AlignLeft size={16} />{" "}
              <span className="hidden md:inline">Format</span>{" "}
              <ChevronDown size={10} />
            </button>
            {activeMenu === "format" && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-[#2d2d2d] border border-[#3e3e42] rounded-md shadow-xl py-1 z-50">
                <button
                  onClick={handleFormat}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#3e3e42] flex items-center gap-2"
                >
                  <AlignLeft size={14} /> Prettify
                </button>
                <button
                  onClick={handleMinify}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#3e3e42] flex items-center gap-2"
                >
                  <Minimize2 size={14} /> Minify
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-[#3e3e42] mx-1"></div>

          <button
            onClick={saveToLibrary}
            disabled={json.trim().length === 0}
            className={`p-2 hover:bg-[#3e3e42] rounded text-blue-400 hover:text-white ${
              json.trim().length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Save to Library (Ctrl+S)"
          >
            <Save size={16} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(json);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            disabled={json.trim().length === 0}
            className={`p-2 hover:bg-[#3e3e42] rounded text-slate-400 hover:text-white ${
              json.trim().length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Copy to Clipboard"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
          </button>
          <button
            onClick={() => {
              setJson("");
              setFields([]);
              showToast("Cleared JSON content.");
            }}
            disabled={json.trim().length === 0}
            className={`p-2 hover:bg-[#3e3e42] rounded text-slate-400 hover:text-red-400 ${
              json.trim().length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Clear (Ctrl+D)"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* DROPDOWN BACKDROP (Để đóng menu khi click ra ngoài) */}
      {activeMenu !== "none" && (
        <div
          className="absolute inset-0 z-10"
          onClick={() => setActiveMenu("none")}
        ></div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* --- DRAWER (LEFT) --- */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-64 bg-[#252526] border-r border-[#3e3e42] z-40 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex-none p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#2d2d2d]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Library
            </span>
            <div className="flex gap-1">
              <input
                type="file"
                ref={libraryInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportLibrary}
              />
              <button
                onClick={() => libraryInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-blue-400"
                title="Import Library"
              >
                <FileUp size={14} />
              </button>
              <button
                onClick={handleExportLibrary}
                className="p-1.5 text-slate-400 hover:text-green-400"
                title="Export Library"
              >
                <FileDown size={14} />
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredFiles.length === 0 && (
              <div className="text-center text-gray-500 text-xs mt-10">
                Empty Library
              </div>
            )}
            {filteredFiles.map((f) => (
              <div
                key={f.id}
                onClick={() => loadFromLibrary(f)}
                className="group flex items-center justify-between p-2 rounded-md hover:bg-[#37373d] cursor-pointer transition-colors border border-transparent hover:border-[#454545]"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-200 truncate flex items-center gap-2">
                    <FileJson size={12} className="text-yellow-500" /> {f.name}
                  </div>
                  <div className="text-[10px] text-gray-500 pl-5">{f.date}</div>
                </div>
                <button
                  onClick={(e) => deleteFromLibrary(e, f.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BACKDROP */}
        {isDrawerOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-30"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
        )}

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#1e1e1e]">
          <div
            className={`${
              view === "code" ? "block" : "hidden"
            } h-full relative`}
          >
            <Editor
              value={json}
              onValueChange={(val) => {
                setJson(val);
                validate(val);
              }}
              highlight={(code) =>
                Prism.highlight(code, Prism.languages.json, "json")
              }
              padding={20}
              className="font-mono text-sm min-h-full"
              style={{
                fontFamily: '"Fira Code", monospace',
                fontSize: 14,
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
              }}
              textareaClassName="focus:outline-none"
            />
            {!json && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none">
                <FileJson size={48} className="opacity-20 mb-2" />
                <p className="text-xs uppercase font-bold tracking-widest opacity-50">
                  Paste JSON here
                </p>
              </div>
            )}
          </div>
          {view === "form" && (
            <div className="p-4 space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start animate-in slide-in-from-left-2 fade-in"
                >
                  <div className="flex-1">
                    <input
                      value={field.key}
                      onChange={(e) =>
                        updateField(field.id, "key", e.target.value)
                      }
                      placeholder="Key"
                      className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-2 text-sm text-purple-400 font-mono focus:border-blue-500 outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <span className="text-slate-500 mt-2">:</span>
                  <div className="flex-[2] flex gap-2">
                    {field.type === "boolean" ? (
                      <select
                        value={field.value}
                        onChange={(e) =>
                          updateField(field.id, "value", e.target.value)
                        }
                        className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-2 text-sm text-rose-400 font-mono outline-none"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : field.type === "null" ? (
                      <div className="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-2 text-sm text-slate-500 font-mono italic select-none">
                        null
                      </div>
                    ) : (
                      <input
                        value={field.value}
                        onChange={(e) =>
                          updateField(field.id, "value", e.target.value)
                        }
                        placeholder="Value"
                        className={`w-full bg-[#2d2d2d] border border-[#3e3e42] rounded px-3 py-2 text-sm font-mono focus:border-blue-500 outline-none placeholder:text-slate-600 ${
                          field.type === "number"
                            ? "text-orange-400"
                            : "text-emerald-400"
                        }`}
                      />
                    )}
                    <div className="relative group">
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, "type", e.target.value)
                        }
                        className="appearance-none bg-[#252526] hover:bg-[#3e3e42] text-xs text-slate-400 font-bold px-2 py-2 rounded border border-[#3e3e42] outline-none cursor-pointer w-[70px]"
                      >
                        <option value="string">Str</option>
                        <option value="number">Num</option>
                        <option value="boolean">Bool</option>
                        <option value="null">Null</option>
                      </select>
                      <Type
                        size={10}
                        className="absolute right-2 top-3 pointer-events-none text-slate-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeField(field.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addField}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors mt-2"
              >
                <Plus size={14} /> Add Field
              </button>
              <div className="mt-8 p-4 bg-[#252526] rounded-lg border border-[#3e3e42]">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
                  Live Preview
                </div>
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                  {json}
                </pre>
              </div>
            </div>
          )}
          {view === "tree" && parsedJson && (
            <div className="p-4 h-full">
              <JsonNode name="root" value={parsedJson} isLast={true} />
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div
        className={`flex-none px-3 py-1.5 text-[10px] flex justify-between items-center border-t border-[#3e3e42] ${
          error ? "bg-red-500/10 text-red-400" : "bg-[#007acc] text-white"
        }`}
      >
        <div className="flex gap-4">
          {error ? (
            <span className="flex items-center gap-1 font-bold">
              <AlertTriangle size={10} /> Invalid JSON: {error}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Check size={10} /> Valid JSON
            </span>
          )}
        </div>
        <div className="flex gap-3 opacity-80 font-mono">
          <span>Size: {stats.size}</span>
          <span>Items: {stats.items}</span>
        </div>
      </div>

      <style>{`.token.property{color:#9cdcfe}.token.string{color:#ce9178}.token.number{color:#b5cea8}.token.boolean{color:#569cd6}.token.null{color:#569cd6}.token.punctuation{color:#d4d4d4}`}</style>
    </div>
  );
};
