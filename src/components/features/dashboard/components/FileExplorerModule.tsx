import { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  Trash2,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  X,
  Menu,
  Terminal,
  FilePlus as FilePlusIcon,
  FolderPlus as FolderPlusIcon,
  Search,
  Edit2,
} from "lucide-react";

// --- TYPES ---
type FileType = "file" | "folder";

interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  isOpen?: boolean;
  children?: FileSystemItem[];
  parentId?: string | null;
}

// --- HELPER: ICONS ---
const getFileIcon = (name: string) => {
  if (name.endsWith(".json"))
    return <FileJson size={14} className="text-yellow-400" />;
  if (name.endsWith(".tsx") || name.endsWith(".ts") || name.endsWith(".js"))
    return <FileCode size={14} className="text-blue-400" />;
  if (name.endsWith(".css") || name.endsWith(".scss"))
    return <FileCode size={14} className="text-pink-400" />;
  if (name.endsWith(".html"))
    return <FileCode size={14} className="text-orange-400" />;
  if (name.endsWith(".md") || name.endsWith(".txt"))
    return <FileText size={14} className="text-slate-400" />;
  return <File size={14} className="text-slate-500" />;
};

// --- INITIAL DATA ---
const INITIAL_FILES: FileSystemItem[] = [
  {
    id: "root",
    name: "root",
    type: "folder",
    isOpen: true,
    parentId: null,
    children: [
      {
        id: "readme_md",
        name: "README.md",
        type: "file",
        content: "# Welcome to IDE Lite\n\nNow with Tabs & Renaming!",
        parentId: "root",
      },
    ],
  },
];

export const FileExplorerModule = () => {
  // --- STATE ---

  // 1. File System
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(() => {
    try {
      const saved = localStorage.getItem("dashboard_file_system");
      return saved ? JSON.parse(saved) : INITIAL_FILES;
    } catch (e) {
      return INITIAL_FILES;
    }
  });

  // 2. Tabs Management (NEW)
  const [openFiles, setOpenFiles] = useState<string[]>([]); // Danh sách ID các file đang mở
  const [activeFileId, setActiveFileId] = useState<string | null>(null); // File đang focus

  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [fileContent, setFileContent] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Save Status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false); // NEW

  const [inputName, setInputName] = useState(""); // Dùng chung cho Create & Rename
  const [newItemType, setNewItemType] = useState<FileType>("file");
  const [itemToRename, setItemToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("dashboard_file_system", JSON.stringify(fileSystem));
  }, [fileSystem]);

  // --- AUTO SAVE ---
  const handleContentChange = (newContent: string) => {
    setFileContent(newContent);
    setSaveStatus("unsaved");

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      if (activeFileId) {
        setFileSystem((prevFS) => {
          const newFS = JSON.parse(JSON.stringify(prevFS));
          const target = findItem(newFS, activeFileId);
          if (target) target.content = newContent;
          return newFS;
        });
        setTimeout(() => setSaveStatus("saved"), 500);
      }
    }, 800);
  };

  // --- EDITOR HANDLERS (Giữ nguyên) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue =
        fileContent.substring(0, start) + "  " + fileContent.substring(end);
      handleContentChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    const pairs: { [key: string]: string } = {
      "(": ")",
      "{": "}",
      "[": "]",
      '"': '"',
      "'": "'",
    };
    if (pairs[e.key]) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const newValue =
        fileContent.substring(0, start) +
        e.key +
        pairs[e.key] +
        fileContent.substring(target.selectionEnd);
      handleContentChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    }
    if (e.key === "Enter") {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const currentLine =
        fileContent.substring(0, start).split("\n").pop() || "";
      const match = currentLine.match(/^(\s*)/);
      const spaces = match ? match[1] : "";
      const extraIndent = currentLine.trim().endsWith("{") ? "  " : "";
      if (spaces.length > 0 || extraIndent) {
        e.preventDefault();
        const insert = "\n" + spaces + extraIndent;
        const newValue =
          fileContent.substring(0, start) +
          insert +
          fileContent.substring(target.selectionEnd);
        handleContentChange(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + insert.length;
        }, 0);
      }
    }
  };

  const handleEditorScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // --- HELPERS ---
  const findItem = (
    items: FileSystemItem[],
    id: string
  ): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 1. Toggle Folder
  const toggleFolder = (folderId: string) => {
    const newFS = JSON.parse(JSON.stringify(fileSystem));
    const target = findItem(newFS, folderId);
    if (target && target.type === "folder") {
      target.isOpen = !target.isOpen;
      setFileSystem(newFS);
      setSelectedFolderId(folderId);
    }
  };

  // 2. Open File (Multi-tab Logic)
  const handleOpenFile = (file: FileSystemItem) => {
    // Nếu file chưa có trong danh sách tab, thêm vào
    if (!openFiles.includes(file.id)) {
      setOpenFiles([...openFiles, file.id]);
    }

    // Nếu đang sửa file khác chưa lưu xong (debounce chưa chạy), lưu ngay
    if (saveStatus === "unsaved" && activeFileId && activeFileId !== file.id) {
      // Force save logic here if strictly needed,
      // but existing auto-save closure usually handles it or next render captures it.
      // For simplicity in this demo, we assume risk is low or accepted.
    }

    // Set Active
    setActiveFileId(file.id);

    // Load content mới
    // Lưu ý: Cần lấy content mới nhất từ fileSystem (nơi lưu trữ chính)
    const currentFile = findItem(fileSystem, file.id);
    setFileContent(currentFile?.content || "");

    setIsMobileMenuOpen(false);
    setSaveStatus("saved");
  };

  // 3. Close Tab
  const handleCloseTab = (e: React.MouseEvent, idToClose: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter((id) => id !== idToClose);
    setOpenFiles(newOpenFiles);

    // Nếu đóng tab đang active, chuyển focus sang tab bên cạnh
    if (activeFileId === idToClose) {
      if (newOpenFiles.length > 0) {
        const lastFileId = newOpenFiles[newOpenFiles.length - 1];
        setActiveFileId(lastFileId);
        const file = findItem(fileSystem, lastFileId);
        setFileContent(file?.content || "");
      } else {
        setActiveFileId(null);
        setFileContent("");
      }
    }
  };

  // 4. Create New Item
  const handleCreateItem = () => {
    if (!inputName.trim()) return;
    const newFS = JSON.parse(JSON.stringify(fileSystem));
    const parent = findItem(newFS, selectedFolderId);
    const targetParent =
      parent && parent.type === "folder" ? parent : findItem(newFS, "root");

    if (targetParent && targetParent.type === "folder") {
      if (!targetParent.children) targetParent.children = [];
      const newItem: FileSystemItem = {
        id: Date.now().toString(),
        name: inputName,
        type: newItemType,
        parentId: targetParent.id,
        content: newItemType === "file" ? "" : undefined,
        children: newItemType === "folder" ? [] : undefined,
        isOpen: true,
      };
      targetParent.children.push(newItem);
      targetParent.isOpen = true;
      setFileSystem(newFS);
      setShowCreateModal(false);
      setInputName("");
      if (newItemType === "file") {
        handleOpenFile(newItem);
      }
    } else {
      alert("Cannot create item here.");
    }
  };

  // 5. Rename Item (NEW)
  const handleRenameItem = () => {
    if (!itemToRename || !inputName.trim()) return;

    const renameNode = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((item) => {
        if (item.id === itemToRename.id) {
          return { ...item, name: inputName };
        }
        if (item.children) {
          return { ...item, children: renameNode(item.children) };
        }
        return item;
      });
    };

    const newFS = renameNode(JSON.parse(JSON.stringify(fileSystem)));
    setFileSystem(newFS);
    setShowRenameModal(false);
    setItemToRename(null);
    setInputName("");
  };

  // 6. Delete Item
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this item?")) return;
    const deleteNode = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.filter((item) => {
        if (item.id === id) return false;
        if (item.children) item.children = deleteNode(item.children);
        return true;
      });
    };
    const newFS = deleteNode(JSON.parse(JSON.stringify(fileSystem)));
    setFileSystem(newFS);

    // Close tab if deleted
    if (openFiles.includes(id)) {
      const newOpen = openFiles.filter((fid) => fid !== id);
      setOpenFiles(newOpen);
      if (activeFileId === id) {
        setActiveFileId(
          newOpen.length > 0 ? newOpen[newOpen.length - 1] : null
        );
        if (newOpen.length === 0) setFileContent("");
        else {
          const f = findItem(newFS, newOpen[newOpen.length - 1]);
          setFileContent(f?.content || "");
        }
      }
    }
  };

  // --- RENDER TREE ---
  const renderTree = (items: FileSystemItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.id}>
        <div
          className={`flex items-center justify-between px-2 py-1.5 cursor-pointer text-xs select-none group transition-colors 
            ${
              item.id === activeFileId
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-[#2d2d2d] hover:text-slate-200"
            } 
            ${
              item.id === selectedFolderId && item.type === "folder"
                ? "bg-[#3e3e42]/50 border-l-2 border-blue-500"
                : "border-l-2 border-transparent"
            }
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === "folder") toggleFolder(item.id);
            else {
              handleOpenFile(item);
              if (item.parentId) setSelectedFolderId(item.parentId);
            }
          }}
        >
          <div className="flex items-center gap-1.5 truncate">
            {item.type === "folder" &&
              (item.isOpen ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              ))}
            {item.type === "folder" ? (
              item.isOpen ? (
                <FolderOpen size={14} className="text-blue-400" />
              ) : (
                <Folder size={14} className="text-blue-400" />
              )
            ) : (
              getFileIcon(item.name)
            )}
            <span className="truncate">{item.name}</span>
          </div>

          {/* Actions: Rename & Delete */}
          {item.id !== "root" && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToRename({ id: item.id, name: item.name });
                  setInputName(item.name);
                  setShowRenameModal(true);
                }}
                className="p-1 hover:bg-white/20 rounded"
              >
                <Edit2 size={10} />
              </button>
              <button
                onClick={(e) => handleDeleteItem(item.id, e)}
                className="p-1 hover:bg-red-500/80 hover:text-white rounded text-red-400"
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>
        {item.type === "folder" && item.isOpen && item.children && (
          <div>{renderTree(item.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const activeFileObj = activeFileId
    ? findItem(fileSystem, activeFileId)
    : null;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-[#3e3e42] rounded text-white"
          >
            <Menu size={18} />
          </button>
          <div className="font-bold text-white flex items-center gap-2">
            <Terminal size={18} className="text-green-500" />{" "}
            <span className="hidden sm:inline">IDE Lite</span>
          </div>
        </div>
        {activeFileObj && (
          <div className="text-xs text-slate-500 font-mono hidden md:block">
            {activeFileObj.name} — {activeFileObj.content?.length || 0} chars
          </div>
        )}
        <div className="flex items-center gap-2">
          {activeFileObj && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                saveStatus === "saved"
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : saveStatus === "saving"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : "bg-slate-700 text-slate-400 border-slate-600"
              }`}
            >
              {saveStatus === "saved" && <Check size={10} />}
              {saveStatus === "saving" && (
                <Loader2 size={10} className="animate-spin" />
              )}
              {saveStatus === "unsaved" && (
                <div className="w-2 h-2 rounded-full bg-slate-400" />
              )}
              {saveStatus === "saved"
                ? "Saved"
                : saveStatus === "saving"
                ? "Saving..."
                : "Unsaved"}
            </div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        <div
          className={`absolute md:relative inset-y-0 left-0 z-10 w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-2 border-b border-[#3e3e42] flex justify-between items-center bg-[#252526]">
            <span className="text-[10px] font-bold uppercase text-slate-500 px-2 tracking-wider">
              Explorer
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setNewItemType("file");
                  setInputName("");
                }}
                className="p-1.5 hover:bg-[#3e3e42] rounded text-slate-400 hover:text-white"
                title="New File"
              >
                <FilePlusIcon size={14} />
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setNewItemType("folder");
                  setInputName("");
                }}
                className="p-1.5 hover:bg-[#3e3e42] rounded text-slate-400 hover:text-white"
                title="New Folder"
              >
                <FolderPlusIcon size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            {renderTree(fileSystem)}
          </div>
          <div className="p-2 border-t border-[#3e3e42] bg-[#1e1e1e] text-[10px] text-slate-500 truncate">
            Selected:{" "}
            <span className="text-blue-400 font-bold">
              {findItem(fileSystem, selectedFolderId)?.name || "root"}
            </span>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div
            className="absolute inset-0 bg-black/50 z-0 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {openFiles.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* TABS BAR (NEW) */}
              <div className="flex bg-[#252526] border-b border-[#3e3e42] overflow-x-auto no-scrollbar">
                {openFiles.map((fid) => {
                  const file = findItem(fileSystem, fid);
                  if (!file) return null;
                  const isActive = fid === activeFileId;
                  return (
                    <div
                      key={fid}
                      onClick={() => handleOpenFile(file)}
                      className={`
                                        group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-[#3e3e42] min-w-[100px] max-w-[200px]
                                        ${
                                          isActive
                                            ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500"
                                            : "text-slate-500 hover:bg-[#2d2d2d] hover:text-slate-300 border-t-2 border-t-transparent"
                                        }
                                    `}
                    >
                      {getFileIcon(file.name)}
                      <span className="truncate flex-1">{file.name}</span>
                      <button
                        onClick={(e) => handleCloseTab(e, fid)}
                        className={`p-0.5 rounded hover:bg-slate-700 ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* CODE EDITOR */}
              {activeFileObj && (
                <div className="flex-1 relative flex overflow-hidden">
                  <div
                    ref={lineNumbersRef}
                    className="w-12 bg-[#252526] border-r border-[#3e3e42] text-right font-mono text-sm text-slate-600 select-none pt-4 pr-3 leading-6 overflow-hidden pointer-events-none z-5"
                  >
                    {fileContent.split("\n").map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={fileContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={handleEditorScroll}
                    className="flex-1 w-full h-full bg-[#1e1e1e] text-slate-300 font-mono text-sm leading-6 p-4 outline-none resize-none tab-size-2 whitespace-pre"
                    spellCheck={false}
                    style={{ tabSize: 2 }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <div className="w-16 h-16 bg-[#252526] rounded-xl flex items-center justify-center mb-4">
                <Search size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">Select a file to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / RENAME MODAL */}
      {(showCreateModal || showRenameModal) && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-2xl shadow-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              {showRenameModal ? (
                <Edit2 size={16} className="text-blue-500" />
              ) : newItemType === "file" ? (
                <FilePlusIcon size={16} className="text-blue-500" />
              ) : (
                <FolderPlusIcon size={16} className="text-yellow-500" />
              )}
              {showRenameModal
                ? "Rename Item"
                : `Create New ${newItemType === "file" ? "File" : "Folder"}`}
            </h3>

            {!showRenameModal && (
              <div className="text-xs text-slate-500 mb-2">
                Inside:{" "}
                <span className="text-slate-300 font-bold">
                  {findItem(fileSystem, selectedFolderId)?.name}
                </span>
              </div>
            )}

            <input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter name..."
              autoFocus
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-3 text-sm text-white mb-4 outline-none focus:border-blue-500"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (showRenameModal ? handleRenameItem() : handleCreateItem())
              }
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowRenameModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#3e3e42] text-white text-xs font-bold hover:bg-[#4e4e52]"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  showRenameModal ? handleRenameItem() : handleCreateItem()
                }
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg hover:bg-blue-500"
              >
                {showRenameModal ? "Rename" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
