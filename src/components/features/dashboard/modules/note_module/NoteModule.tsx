import React, { useState, useMemo } from "react";
import { useDataStore, Note } from "../../../../../stores/useDataStore";
import {
  LayoutList,
  LayoutGrid,
  Plus,
  ChevronLeft,
  Trash2,
  Settings2,
  Pin,
  Search,
  ArrowUpDown,
  X,
} from "lucide-react";
import clsx from "clsx";
import { ConfirmModal } from "../excel_module/components/ConfirmModal";

export const NoteModule = () => {
  // --- STATE & HOOKS ---
  const {
    notes,
    noteViewSettings,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    setNoteViewMode,
    setGridColumns,
    setSortBy,
  } = useDataStore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
  });

  // --- LOGIC & HELPERS ---
  const openConfirm = (title: string, message: string, action: () => void) => {
    setConfirmModal({ isOpen: true, title, message, action });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      switch (noteViewSettings.sortBy) {
        case "alpha":
          return a.title.localeCompare(b.title);
        case "created":
          return b.id.localeCompare(a.id);
        case "updated":
        default:
          return b.updatedAt - a.updatedAt;
      }
    });
    return result;
  }, [notes, searchQuery, noteViewSettings.sortBy]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleCreateNote = () => {
    const newId = addNote();
    setActiveNoteId(newId);
    setSearchQuery("");
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openConfirm(
      "Xóa ghi chú?",
      "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?",
      () => {
        deleteNote(id);
        if (activeNoteId === id) setActiveNoteId(null);
        closeConfirm();
      },
    );
  };

  // --- SUB-COMPONENTS ---
  const NoteCard = ({ note }: { note: Note }) => (
    <div
      onClick={() => setActiveNoteId(note.id)}
      className={clsx(
        "group relative p-4 rounded-xl border pointer transition-all duration-300",
        "hover:shadow-md dark:hover:shadow-none dark:hover:bg-white/10",
        noteViewSettings.mode === "grid"
          ? "aspect-[4/3] flex flex-col justify-between"
          : "h-24 flex flex-col justify-center",
        "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5",
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <h3
          className={clsx(
            "font-semibold text-sm text-slate-800 dark:text-slate-100 truncate flex-1",
            note.title === "Không tên" && "opacity-50 italic",
          )}
        >
          {note.title || "Không tên"}
        </h3>
        {note.isPinned && (
          <Pin
            size={12}
            className="text-orange-500 fill-orange-500 shrink-0 mt-1"
          />
        )}
      </div>

      <p
        className={clsx(
          "text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2",
          noteViewSettings.mode === "grid" && "flex-1",
        )}
      >
        {note.content.replace(/^#+\s.*\n/, "") || "Trống..."}
      </p>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
        <span className="text-[10px] text-slate-400 font-medium">
          {new Date(note.updatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePinNote(note.id);
            }}
            className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded text-slate-400 hover:text-orange-600 transition-colors"
          >
            <Pin size={12} />
          </button>
          <button
            onClick={(e) => handleDeleteNote(note.id, e)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  if (activeNote) {
    return (
      <div className="h-full flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden animate-in slide-in-from-right-4 duration-300 relative">
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.action}
          onCancel={closeConfirm}
        />

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
          <button
            onClick={() => setActiveNoteId(null)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <ChevronLeft size={16} /> Danh sách
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              {isSaving ? "Saving..." : "Saved"}
            </span>
            <div className="h-4 w-px bg-slate-300 dark:bg-white/20 mx-1"></div>
            <button
              onClick={() => togglePinNote(activeNote.id)}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                activeNote.isPinned
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10",
              )}
            >
              <Pin
                size={16}
                className={clsx(activeNote.isPinned && "fill-current")}
              />
            </button>
            <button
              onClick={() => handleDeleteNote(activeNote.id)}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative group overflow-hidden">
          <input
            type="text"
            value={activeNote.title}
            onChange={(e) => {
              setIsSaving(true);
              updateNote(activeNote.id, { title: e.target.value });
              setTimeout(() => setIsSaving(false), 500);
            }}
            placeholder="Tiêu đề ghi chú..."
            className="w-full bg-transparent px-6 pt-6 pb-2 text-2xl font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none border-none"
          />
          <textarea
            value={activeNote.content}
            onChange={(e) => {
              setIsSaving(true);
              updateNote(activeNote.id, { content: e.target.value });
              setTimeout(() => setIsSaving(false), 500);
            }}
            placeholder="Viết gì đó tuyệt vời..."
            className="flex-1 w-full bg-transparent px-6 pb-6 pt-2 text-base leading-7 resize-none focus:outline-none font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 custom-scrollbar"
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  // --- VIEW: Overview ---
  return (
    <div className="h-full flex flex-col gap-4 relative">
      {/* Nhúng Modal vào đây để nó hiện đè lên Overview */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={closeConfirm}
      />

      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5">
        {/* ... (Phần Header giữ nguyên như code trước) ... */}
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              My Note
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 dark:text-blue-200 dark:bg-blue-500/20 rounded-full">
              {notes.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100/50 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200/50 dark:border-white/5">
              <button
                onClick={() => setNoteViewMode("list")}
                className={clsx(
                  "p-1.5 rounded-md transition-all duration-200",
                  noteViewSettings.mode === "list"
                    ? "bg-white dark:bg-white/10 text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={() => setNoteViewMode("grid")}
                className={clsx(
                  "p-1.5 rounded-md transition-all duration-200",
                  noteViewSettings.mode === "grid"
                    ? "bg-white dark:bg-white/10 text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              onClick={() => {
                const nextSort =
                  noteViewSettings.sortBy === "updated" ? "alpha" : "updated";
                setSortBy(nextSort);
              }}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all border border-slate-200/50 dark:border-white/5"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 h-9 px-3">
          <div className="flex-1 relative group min-w-0">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search
                size={14}
                className="text-slate-400 group-focus-within:text-blue-500 transition-colors"
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhanh..."
              className="w-full h-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-400 dark:text-slate-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {noteViewSettings.mode === "grid" && (
            <div className="flex items-center gap-2 px-2 sm:px-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg animate-in fade-in slide-in-from-left-2 duration-300 shrink-0">
              <Settings2 size={14} className="text-slate-400" />
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={noteViewSettings.gridColumns}
                onChange={(e) => setGridColumns(Number(e.target.value))}
                className="w-12 sm:w-16 h-1 bg-slate-200 dark:bg-white/20 rounded-lg appearance-none pointer accent-blue-500"
              />
            </div>
          )}
          <button
            onClick={handleCreateNote}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tạo mới</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 custom-scrollbar">
        {filteredNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Search size={24} />
            </div>
            <p className="text-sm font-medium">Không tìm thấy ghi chú</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-blue-500 mt-2 hover:underline"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div
            className={clsx(
              "grid gap-3 pb-4",
              noteViewSettings.mode === "list" && "grid-cols-1",
            )}
            style={
              noteViewSettings.mode === "grid"
                ? {
                    gridTemplateColumns: `repeat(${noteViewSettings.gridColumns}, minmax(0, 1fr))`,
                  }
                : {}
            }
          >
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
